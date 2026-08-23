/**
 * Loader + accessors for the pre-baked NASA GISTEMP anomaly grid.
 * The binary is [year][lat][lon] Int16 in centi-degrees; see
 * scripts/build-climate-data.mjs for how it is produced.
 */

export interface ClimateMeta {
  source: string;
  sourceUrl: string;
  variable: string;
  units: string;
  baseline: string;
  generatedAt: string;
  years: number[];
  startYear: number;
  endYear: number;
  nLat: number;
  nLon: number;
  latStart: number;
  latStep: number;
  lonStart: number;
  lonStep: number;
  scale: number;
  fill: number;
  globalAnnualAnomaly: number[];
}

export interface SeriesPoint {
  year: number;
  value: number | null;
}

/**
 * La finestra "prima delle ciminiere". Le anomalie GISTEMP sono riferite al
 * 1951-1980, che non è un preindustriale: per dire "quanto si è scaldato
 * questo posto" il confronto va rifatto contro i primi trent'anni misurati.
 * Una definizione sola, usata dal titolo del pannello e da ogni confronto che
 * ci si appoggia — due definizioni diverse dello stesso numero sono un bug che
 * non si vede.
 */
export const PRE_INDUSTRIAL = [1880, 1909] as const;

/** Ampiezza della finestra recente, in anni. */
const RECENT_YEARS = 10;

/** Normalises any longitude into [-180, 180). */
export function wrapLon(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

export class ClimateGrid {
  readonly meta: ClimateMeta;
  /** Flat Int16 store, length = years * nLat * nLon. */
  private readonly data: Int16Array;
  private readonly cells: number;

  constructor(meta: ClimateMeta, data: Int16Array) {
    this.meta = meta;
    this.data = data;
    this.cells = meta.nLat * meta.nLon;
  }

  get years(): number[] {
    return this.meta.years;
  }

  yearIndex(year: number): number {
    return this.meta.years.indexOf(year);
  }

  /** The raw Int16 plane for one year — used by the map renderer. */
  plane(year: number): Int16Array | null {
    const i = this.yearIndex(year);
    if (i < 0) return null;
    return this.data.subarray(i * this.cells, (i + 1) * this.cells);
  }

  /** Grid indices for a geographic point, or null if outside the grid. */
  private cellOf(lat: number, lon: number): { la: number; lo: number } | null {
    const { latStart, latStep, lonStart, lonStep, nLat, nLon } = this.meta;
    const la = Math.round((lat - latStart) / latStep);
    const lo = Math.round((wrapLon(lon) - lonStart) / lonStep);
    if (la < 0 || la >= nLat) return null;
    // Longitude is cyclic, so wrap rather than reject.
    const loWrapped = ((lo % nLon) + nLon) % nLon;
    return { la, lo: loWrapped };
  }

  /** Anomaly in °C at a point for one year, or null where the source has no data. */
  valueAt(year: number, lat: number, lon: number): number | null {
    const yi = this.yearIndex(year);
    const cell = this.cellOf(lat, lon);
    if (yi < 0 || !cell) return null;
    const raw = this.data[yi * this.cells + cell.la * this.meta.nLon + cell.lo];
    return raw === this.meta.fill ? null : raw * this.meta.scale;
  }

  /** Full 1880→present anomaly series for one point. */
  seriesAt(lat: number, lon: number): SeriesPoint[] {
    const cell = this.cellOf(lat, lon);
    if (!cell) return this.meta.years.map((year) => ({ year, value: null }));
    const offset = cell.la * this.meta.nLon + cell.lo;
    return this.meta.years.map((year, yi) => {
      const raw = this.data[yi * this.cells + offset];
      return { year, value: raw === this.meta.fill ? null : raw * this.meta.scale };
    });
  }

  /** Area-weighted global mean anomaly for a year. */
  globalAnomaly(year: number): number | null {
    const i = this.yearIndex(year);
    return i < 0 ? null : this.meta.globalAnnualAnomaly[i];
  }

  /** L'ultimo decennio pubblicato: l'altro estremo di ogni confronto. */
  get recentWindow(): readonly [number, number] {
    return [this.meta.endYear - (RECENT_YEARS - 1), this.meta.endYear];
  }

  /**
   * Quanto si è scaldata una cella tra il preindustriale e oggi.
   * `null` dove una delle due finestre non ha nemmeno un anno misurato: nel
   * 1880 la griglia è coperta al 68%, e un'assenza di copertura non è uno zero.
   */
  warmingAt(lat: number, lon: number): number | null {
    const cell = this.cellOf(lat, lon);
    if (!cell) return null;
    return this.warmingAtOffset(cell.la * this.meta.nLon + cell.lo);
  }

  /**
   * Lo stesso numero per tutte le celle, in un colpo solo: NaN dove manca.
   * Serve alle medie per fascia di latitudine, che leggono migliaia di celle —
   * farlo cella per cella con `seriesAt` allocherebbe 146 oggetti per ognuna.
   * Le finestre sono costanti, quindi si calcola una volta per sessione.
   */
  warmingField(): Float32Array {
    if (!this.field) {
      const field = new Float32Array(this.cells);
      for (let i = 0; i < this.cells; i++) {
        const w = this.warmingAtOffset(i);
        field[i] = w === null ? NaN : w;
      }
      this.field = field;
    }
    return this.field;
  }

  /** Latitudine del centro della cella, dall'indice piatto di `warmingField`. */
  cellLat(index: number): number {
    return this.meta.latStart + Math.floor(index / this.meta.nLon) * this.meta.latStep;
  }

  /** Longitudine del centro della cella, dall'indice piatto di `warmingField`. */
  cellLon(index: number): number {
    return this.meta.lonStart + (index % this.meta.nLon) * this.meta.lonStep;
  }

  /**
   * Il riscaldamento medio del pianeta, dalla serie globale pesata per area che
   * accompagna il file. Non è la media delle celle di `warmingField`: quella
   * peserebbe come il resto le celle senza copertura ottocentesca.
   */
  globalWarming(): number | null {
    const { years, globalAnnualAnomaly } = this.meta;
    const mean = (from: number, to: number) => {
      let sum = 0;
      let n = 0;
      for (let i = 0; i < years.length; i++) {
        if (years[i] < from || years[i] > to) continue;
        sum += globalAnnualAnomaly[i];
        n++;
      }
      return n ? sum / n : null;
    };
    const base = mean(PRE_INDUSTRIAL[0], PRE_INDUSTRIAL[1]);
    const recent = mean(this.recentWindow[0], this.recentWindow[1]);
    return base === null || recent === null ? null : recent - base;
  }

  private field: Float32Array | null = null;

  private warmingAtOffset(offset: number): number | null {
    const base = this.windowMean(offset, PRE_INDUSTRIAL[0], PRE_INDUSTRIAL[1]);
    const recent = this.windowMean(offset, this.recentWindow[0], this.recentWindow[1]);
    return base === null || recent === null ? null : recent - base;
  }

  /** Media delle anomalie di una cella su una finestra di anni, saltando i buchi. */
  private windowMean(offset: number, from: number, to: number): number | null {
    const { years, fill, scale } = this.meta;
    let sum = 0;
    let n = 0;
    for (let yi = 0; yi < years.length; yi++) {
      if (years[yi] < from || years[yi] > to) continue;
      const raw = this.data[yi * this.cells + offset];
      if (raw === fill) continue;
      sum += raw;
      n++;
    }
    return n ? (sum / n) * scale : null;
  }
}

export async function loadClimateGrid(signal?: AbortSignal): Promise<ClimateGrid> {
  const [meta, buf] = await Promise.all([
    fetch(`${import.meta.env.BASE_URL}data/temp-meta.json`, { signal }).then((r) => {
      if (!r.ok) throw new Error(`temp-meta.json: HTTP ${r.status}`);
      return r.json() as Promise<ClimateMeta>;
    }),
    fetch(`${import.meta.env.BASE_URL}data/temp-grid.bin`, { signal }).then((r) => {
      if (!r.ok) throw new Error(`temp-grid.bin: HTTP ${r.status}`);
      return r.arrayBuffer();
    }),
  ]);

  const expected = meta.years.length * meta.nLat * meta.nLon * 2;
  if (buf.byteLength !== expected) {
    throw new Error(
      `grid size mismatch: expected ${expected} bytes, received ${buf.byteLength}. Re-run \`npm run data\`.`,
    );
  }
  return new ClimateGrid(meta, new Int16Array(buf));
}

/**
 * Linear-regression slope of a series, in °C per decade.
 * Nulls are skipped; returns null if there is not enough signal.
 */
export function trendPerDecade(points: SeriesPoint[]): number | null {
  const valid = points.filter((p): p is { year: number; value: number } => p.value !== null);
  if (valid.length < 10) return null;
  const n = valid.length;
  const meanX = valid.reduce((a, p) => a + p.year, 0) / n;
  const meanY = valid.reduce((a, p) => a + p.value, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of valid) {
    num += (p.year - meanX) * (p.value - meanY);
    den += (p.year - meanX) ** 2;
  }
  return den === 0 ? null : (num / den) * 10;
}

/** Mean of a series over an inclusive year window, ignoring gaps. */
export function meanOver(points: SeriesPoint[], from: number, to: number): number | null {
  const vals = points.filter((p) => p.year >= from && p.year <= to && p.value !== null);
  if (!vals.length) return null;
  return vals.reduce((a, p) => a + (p.value as number), 0) / vals.length;
}
