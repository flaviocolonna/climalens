/**
 * Il percorso: dieci passaggi che attraversano quello che l'app sa già fare.
 *
 * Il problema che risolve non è la mancanza di contenuto — ce n'è fin troppo —
 * ma che chi arriva vede una mappa e cinque pulsanti senza sapere in che
 * ordine leggerli. Qui l'ordine c'è, ed è quello in cui l'argomento si regge:
 * cosa succede → chi lo causa → cosa si respira → chi può reggerlo → chi
 * mantiene la parola → da cosa viene → dove porta → cosa puoi fare.
 *
 * Ogni passo è **uno stato dell'app**, non una schermata nuova: la stessa
 * mappa, gli stessi pannelli. È possibile solo perché lo stato era già tutto
 * indirizzabile per l'URL — il percorso è, letteralmente, dieci link interni.
 */
import type { AnyMetricId } from '@/lib/mapMetrics';
import type { PanelId } from '@/lib/urlState';

export interface TourStep {
  id: string;
  /**
   * Lo stato che il passo pretende. `undefined` = lascia com'è; `null` su
   * `metric` e `panel` = torna alla mappa nuda.
   */
  metric?: AnyMetricId | null;
  panel?: PanelId | null;
  /** Anno da mostrare; `'latest'` = l'ultimo disponibile nella griglia. */
  year?: number | 'latest';
}

export const TOUR_STEPS: TourStep[] = [
  { id: 'now', metric: null, panel: null, year: 'latest' },
  { id: 'then', metric: null, panel: null, year: 1950 },
  { id: 'place', metric: null, panel: null, year: 'latest' },
  { id: 'causes', metric: 'cum', panel: null },
  { id: 'breathe', metric: 'pm25', panel: null },
  { id: 'cope', metric: 'gain', panel: null },
  { id: 'promises', metric: 'gap', panel: null },
  { id: 'sectors', metric: null, panel: 'sectors' },
  { id: 'ahead', metric: null, panel: 'future' },
  { id: 'you', metric: null, panel: 'actions' },
];

export const TOUR_LENGTH = TOUR_STEPS.length;

/** Indice valido, o null: un `?tour=99` non deve rompere l'avvio. */
export function clampStep(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const i = Math.round(value);
  return i >= 0 && i < TOUR_LENGTH ? i : null;
}
