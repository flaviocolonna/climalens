/**
 * Dal punto cliccato alla zona: point-in-polygon sulle stesse forme che
 * colorano la mappa delle emissioni.
 *
 * Serve a due domande diverse del pannello di un luogo:
 *  - **a chi appartiene questo punto**, per poter dire quante emissioni causa
 *    la zona in cui sta (il dato è per paese: più fine di così non esiste);
 *  - **è terra o è mare**, perché è metà della risposta a *perché* qui si
 *    scalda così: l'acqua e il suolo assorbono lo stesso calore in modo
 *    completamente diverso.
 *
 * Le forme sono Natural Earth 1:110m, cioè semplificate: un'isola piccola può
 * non esserci e una costa è approssimata a qualche chilometro. Chi legge il
 * risultato lo dichiara invece di far finta che il confine sia esatto.
 */
import type { CountryEmissions, CountryProps } from '@/lib/countryEmissions';

/** [lon, lat][] — il primo anello è il contorno, gli altri sono buchi. */
type Ring = number[][];
type Polygon = Ring[];

interface Entry {
  props: CountryProps;
  polys: Polygon[];
  /** [minLon, minLat, maxLon, maxLat] — prefiltro prima del ray casting. */
  bbox: [number, number, number, number];
}

/** Un grado di latitudine, in km. Per la longitudine si moltiplica per cos(lat). */
const KM_PER_DEGREE = 111.32;

/**
 * Oltre questa distanza dalla costa un punto non "appartiene" più a nessuno:
 * in mezzo all'Atlantico le emissioni del paese più vicino non dicono niente.
 * 300 km è il limite delle acque territoriali estese più un margine per la
 * semplificazione delle forme.
 */
export const NEAREST_MAX_KM = 300;

/**
 * Sotto questa latitudine la maschera terra/mare non è affidabile: l'Antartide
 * non è nel file dei confini (non ha popolazione, quindi non ha una riga nelle
 * emissioni) e il continente risulterebbe oceano.
 */
export const LAND_MASK_MIN_LAT = -60;

export type Attribution =
  /** Trovato per codice: la ricerca sa già in che paese sta il posto. */
  | { kind: 'code'; props: CountryProps }
  | { kind: 'inside'; props: CountryProps }
  | { kind: 'nearest'; props: CountryProps; km: number }
  /** Il paese esiste, ma non è in questo file: nessuna forma a 1:110m. */
  | { kind: 'unlisted' }
  | { kind: 'offshore' };

export class CountryIndex {
  private readonly entries: Entry[];

  constructor(data: CountryEmissions) {
    this.entries = data.features.map((f) => {
      const polys: Polygon[] =
        f.geometry.type === 'Polygon'
          ? [f.geometry.coordinates as Polygon]
          : (f.geometry.coordinates as Polygon[]);
      let minLon = Infinity;
      let minLat = Infinity;
      let maxLon = -Infinity;
      let maxLat = -Infinity;
      for (const poly of polys) {
        for (const [lon, lat] of poly[0]) {
          if (lon < minLon) minLon = lon;
          if (lon > maxLon) maxLon = lon;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
      }
      return { props: f.properties, polys, bbox: [minLon, minLat, maxLon, maxLat] };
    });
  }

  /** Il paese che contiene il punto, o null se cade in mare. */
  at(lat: number, lon: number): CountryProps | null {
    for (const e of this.entries) {
      const [minLon, minLat, maxLon, maxLat] = e.bbox;
      if (lon < minLon || lon > maxLon || lat < minLat || lat > maxLat) continue;
      for (const poly of e.polys) {
        if (!inRing(poly[0], lon, lat)) continue;
        // Un buco è un buco: il Lesotho dentro il Sudafrica, i grandi laghi.
        let inHole = false;
        for (let i = 1; i < poly.length; i++) {
          if (inRing(poly[i], lon, lat)) {
            inHole = true;
            break;
          }
        }
        if (!inHole) return e.props;
      }
    }
    return null;
  }

  /** Il paese con questo codice a due lettere, se il file ce l'ha. */
  byCode(iso2: string): CountryProps | null {
    const code = iso2.toUpperCase();
    return this.entries.find((e) => e.props.iso2 === code)?.props ?? null;
  }

  /**
   * A chi attribuire il punto. Un click appena al largo di Napoli deve dire
   * "Italia", non "nessuno": la costa qui è una linea semplificata, e il mare
   * a due chilometri dalla riva non è mare aperto.
   *
   * Quando il punto arriva dalla ricerca il codice del paese lo si sa già, e
   * vince su qualunque geometria: a 1:110m Singapore non ha una forma, e le sue
   * coordinate cadono dentro la Malaysia. Se quel codice non è nel file, la
   * risposta è "non ce l'ho" — non il vicino di casa con i numeri sbagliati.
   */
  attribute(lat: number, lon: number, iso2?: string): Attribution {
    if (iso2) {
      const props = this.byCode(iso2);
      return props ? { kind: 'code', props } : { kind: 'unlisted' };
    }

    const inside = this.at(lat, lon);
    if (inside) return { kind: 'inside', props: inside };

    let best: { props: CountryProps; km: number } | null = null;
    for (const e of this.entries) {
      // La distanza dal rettangolo è sempre ≤ quella dal bordo vero: se già
      // quella è peggiore del migliore trovato, il paese si salta intero.
      if (best && bboxDistanceKm(e.bbox, lat, lon) >= best.km) continue;
      for (const poly of e.polys) {
        const km = ringDistanceKm(poly[0], lat, lon);
        if (!best || km < best.km) best = { props: e.props, km };
      }
    }
    if (!best || best.km > NEAREST_MAX_KM) return { kind: 'offshore' };
    return { kind: 'nearest', props: best.props, km: best.km };
  }

  /**
   * Terra o mare, per la maschera del confronto termico.
   * `null` dove la maschera non è affidabile, cioè sotto i 60° S.
   */
  isLand(lat: number, lon: number): boolean | null {
    if (lat < LAND_MASK_MIN_LAT) return null;
    return this.at(lat, lon) !== null;
  }

  /**
   * Quanta terra c'è intorno, in un intorno di `radiusDeg` gradi: 1 = punto
   * continentale, 0 = oceano aperto. È la continentalità, misurata invece che
   * dedotta dal nome del posto.
   *
   * La finestra si allarga in longitudine man mano che si sale di latitudine,
   * perché un grado di longitudine a Oslo è la metà che a Roma: senza la
   * correzione l'intorno sarebbe un'ellisse schiacciata invece di un quadrato
   * di chilometri.
   */
  landFraction(lat: number, lon: number, radiusDeg = 5, steps = 2): number | null {
    if (lat < LAND_MASK_MIN_LAT) return null;
    const lonRadius = Math.min(radiusDeg / Math.max(Math.cos(toRad(lat)), 0.2), 40);
    let land = 0;
    let total = 0;
    for (let i = -steps; i <= steps; i++) {
      const y = lat + (radiusDeg * i) / steps;
      if (y > 90 || y < -90) continue;
      for (let j = -steps; j <= steps; j++) {
        const x = wrap180(lon + (lonRadius * j) / steps);
        total++;
        if (this.at(y, x)) land++;
      }
    }
    return total ? land / total : null;
  }
}

/** Un indice per file di dati: costruirlo due volte è lavoro buttato. */
const built = new WeakMap<CountryEmissions, CountryIndex>();

export function countryIndex(data: CountryEmissions): CountryIndex {
  let index = built.get(data);
  if (!index) {
    index = new CountryIndex(data);
    built.set(data, index);
  }
  return index;
}

// ---------------------------------------------------------------------------

/** Ray casting classico: quante volte una semiretta attraversa l'anello. */
function inRing(ring: Ring, x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

const wrap180 = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180;

/**
 * Distanza in km da un anello, misurata sui segmenti e non sui vertici: a
 * questa semplificazione un lato di costa può essere lungo cinquanta
 * chilometri, e il vertice più vicino sarebbe molto più lontano del bordo.
 *
 * I gradi si proiettano in km attorno alla latitudine del punto: su distanze
 * di poche centinaia di chilometri l'errore è sotto l'1%, e qui il numero
 * serve a decidere "questo o mare aperto", non a navigarci.
 */
function ringDistanceKm(ring: Ring, lat: number, lon: number): number {
  const kx = KM_PER_DEGREE * Math.cos(toRad(lat));
  const ky = KM_PER_DEGREE;
  const px = lon * kx;
  const py = lat * ky;
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const ax = wrapNear(ring[j][0], lon) * kx;
    const ay = ring[j][1] * ky;
    const bx = wrapNear(ring[i][0], lon) * kx;
    const by = ring[i][1] * ky;
    const d = segmentDistance(px, py, ax, ay, bx, by);
    if (d < best) best = d;
  }
  return best;
}

function bboxDistanceKm(
  bbox: [number, number, number, number],
  lat: number,
  lon: number,
): number {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const dLon = Math.max(minLon - lon, 0, lon - maxLon);
  const dLat = Math.max(minLat - lat, 0, lat - maxLat);
  return Math.hypot(dLon * KM_PER_DEGREE * Math.cos(toRad(lat)), dLat * KM_PER_DEGREE);
}

/** Distanza punto-segmento nel piano proiettato. */
function segmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const vx = bx - ax;
  const vy = by - ay;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / len2));
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
}

/**
 * Riporta una longitudine dalla parte del punto: sull'antimeridiano
 * −179° e +179° distano due gradi, non trecentocinquantotto.
 */
function wrapNear(lon: number, reference: number): number {
  if (lon - reference > 180) return lon - 360;
  if (reference - lon > 180) return lon + 360;
  return lon;
}
