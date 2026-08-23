/**
 * Le curve di quello che sta già funzionando, prodotte da
 * scripts/build-progress-data.mjs. Sono 2 KB: si caricano quando si apre il
 * pannello che le usa.
 */

/** Coppie [anno, valore], in ordine crescente di anno. */
export type Series = Array<[number, number]>;

export interface LcoeRange {
  /** Primo e ultimo punto della serie mondiale: [anno, $/kWh]. */
  first: [number, number];
  last: [number, number];
}

export interface ProgressData {
  meta: {
    source: string;
    sourceUrl: string;
    generatedAt: string;
    solarPriceDropPct: number;
    solarPriceFrom: [number, number];
    solarPriceTo: [number, number];
  };
  series: {
    solarPrice: Series;
    solarCapacity: Series;
    renewableShare: Series;
  };
  lcoe: Record<string, LcoeRange>;
}

/** L'ordine in cui il pannello elenca le tecnologie: dalla più crollata. */
export const LCOE_TECHS = [
  'solar_photovoltaic',
  'onshore_wind',
  'offshore_wind',
  'hydropower',
  'geothermal',
] as const;

export type LcoeTech = (typeof LCOE_TECHS)[number];

let pending: Promise<ProgressData> | null = null;

export function loadProgress(): Promise<ProgressData> {
  if (!pending) {
    pending = fetch(`${import.meta.env.BASE_URL}data/progress.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`progress.json: HTTP ${r.status}`);
        return r.json() as Promise<ProgressData>;
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}

/** Variazione percentuale fra i due estremi di una serie di costo. */
export function changePct(range: LcoeRange): number {
  return (range.last[1] / range.first[1] - 1) * 100;
}
