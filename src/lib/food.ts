/**
 * Cosa c'è nel piatto, prodotto da scripts/build-food-data.mjs.
 *
 * Sta accanto alla riga «dieta vegetale» del pannello azioni perché è lì che
 * viene la domanda successiva: *quali* cibi. Manzo e frutta secca stanno a due
 * ordini di grandezza di distanza dentro la stessa spesa.
 *
 * La scomposizione per fase serve a una cosa sola, ed è la più utile: il
 * trasporto è una fetta minima quasi ovunque. Cambiare **cosa** si mangia pesa
 * molto più di cambiare **da dove viene**.
 */

export interface Food {
  /** Nome nella lingua della fonte: i cibi hanno un file di traduzione a parte. */
  name: string;
  /** kg CO₂e per kg di prodotto. */
  kg: number;
  /** Le fasi, nell'ordine di `meta.stages`. */
  stages: number[];
  /** m² di terra per kg, dove la fonte lo pubblica. */
  land: number | null;
}

export interface FoodData {
  meta: {
    source: string;
    sourceUrl: string;
    generatedAt: string;
    stages: string[];
    /** Quota mediana del trasporto sul totale, in percento. */
    medianTransportShare: number;
    unit: string;
  };
  foods: Food[];
}

/** L'indice della fase «trasporto», che è quella che serve nominare. */
export function transportIndex(data: FoodData): number {
  return data.meta.stages.indexOf('transport');
}

let pending: Promise<FoodData> | null = null;

export function loadFood(): Promise<FoodData> {
  if (!pending) {
    pending = fetch(`${import.meta.env.BASE_URL}data/food.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`food.json: HTTP ${r.status}`);
        return r.json() as Promise<FoodData>;
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}
