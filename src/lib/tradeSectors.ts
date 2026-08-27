/**
 * Composizione settoriale dell'import/export di un paese: non emissioni, ma
 * valore commerciale doganale — la risposta a "cosa c'è dentro" il numero
 * `net` della mappa (src/lib/countryEmissions.ts).
 *
 * Il file è prodotto da scripts/build-trade-sectors.mjs dall'API "preview" di
 * UN Comtrade. Niente geometria qui: è una tabella piatta per ISO3, nello
 * stesso spirito di pollution-countries.json, e non serve alla mappa — non
 * dipinge nessun colore — quindi non c'è una `mergeIntoCountries` a farla
 * entrare nelle feature: la si guarda per ISO3 quando serve, punto.
 */
import type { TradeSectorId } from '@/lib/tradeSectorTaxonomy';

export interface TradeSectorEntry {
  year: number;
  /** Quota % del valore commerciale, per settore. Le quote di un flusso sommano a ~100. */
  imports: Partial<Record<TradeSectorId, number>>;
  exports: Partial<Record<TradeSectorId, number>>;
}

export interface TradeSectorTable {
  meta: {
    source: string;
    sourceUrl: string;
    generatedAt: string;
    sectors: TradeSectorId[];
    coverage: { imports: number; exports: number };
    countries: number;
  };
  /** Un paese senza dati doganali utilizzabili è assente, non azzerato. */
  countries: Record<string, TradeSectorEntry>;
}

let pending: Promise<TradeSectorTable> | null = null;

/** Chiesto solo da chi apre la scheda di un paese, mai dalla mappa. */
export function loadTradeSectors(): Promise<TradeSectorTable> {
  if (!pending) {
    pending = fetch(`${import.meta.env.BASE_URL}data/trade-sectors.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`trade-sectors.json: HTTP ${r.status}`);
        return r.json() as Promise<TradeSectorTable>;
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}
