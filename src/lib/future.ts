/**
 * Dove porta questa strada, e quanto tempo resta.
 *
 * Il resto dell'app guarda indietro: 146 anni di misure, chi ha emesso cosa,
 * quali confini sono già stati superati. Qui c'è l'unica parte che guarda
 * avanti, e cambia la domanda da «cos'è successo» a «cosa stiamo scegliendo».
 *
 * **Attenzione alle basi di riferimento.** Le anomalie della mappa sono
 * riferite al 1951-1980 (la convenzione GISTEMP); queste proiezioni al
 * 1850-1900 (la convenzione IPCC). Sono due zeri diversi, e sommarli sarebbe
 * sbagliato di circa un quarto di grado: per questo gli scenari vivono in un
 * grafico separato con la loro base scritta accanto, invece che in coda alla
 * linea del tempo, dove sarebbero sembrati la continuazione della stessa curva.
 */

export type ScenarioId = 'ssp119' | 'ssp126' | 'ssp245' | 'ssp370' | 'ssp585';

export interface ScenarioPoint {
  /** Finestra ventennale, come la pubblica l'IPCC. */
  from: number;
  to: number;
  /** Stima migliore e intervallo *molto probabile*, °C sul 1850-1900. */
  best: number;
  low: number;
  high: number;
}

export interface Scenario {
  id: ScenarioId;
  /** Etichetta tecnica: non si traduce, è il nome dello scenario. */
  code: string;
  points: ScenarioPoint[];
}

/**
 * IPCC AR6 WGI, tabella SPM.1: riscaldamento globale in superficie rispetto al
 * 1850-1900, stima migliore e intervallo molto probabile.
 *
 * Tre finestre e non una curva annuale: l'IPCC pubblica queste, e disegnare
 * un valore per ogni anno vorrebbe dire interpolare numeri che nessuno ha
 * calcolato. Il pannello unisce i punti con segmenti e lo dice.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: 'ssp119',
    code: 'SSP1-1.9',
    points: [
      { from: 2021, to: 2040, best: 1.5, low: 1.2, high: 1.7 },
      { from: 2041, to: 2060, best: 1.6, low: 1.2, high: 2.0 },
      { from: 2081, to: 2100, best: 1.4, low: 1.0, high: 1.8 },
    ],
  },
  {
    id: 'ssp126',
    code: 'SSP1-2.6',
    points: [
      { from: 2021, to: 2040, best: 1.5, low: 1.2, high: 1.8 },
      { from: 2041, to: 2060, best: 1.7, low: 1.3, high: 2.2 },
      { from: 2081, to: 2100, best: 1.8, low: 1.3, high: 2.4 },
    ],
  },
  {
    id: 'ssp245',
    code: 'SSP2-4.5',
    points: [
      { from: 2021, to: 2040, best: 1.5, low: 1.2, high: 1.8 },
      { from: 2041, to: 2060, best: 2.0, low: 1.6, high: 2.5 },
      { from: 2081, to: 2100, best: 2.7, low: 2.1, high: 3.5 },
    ],
  },
  {
    id: 'ssp370',
    code: 'SSP3-7.0',
    points: [
      { from: 2021, to: 2040, best: 1.5, low: 1.2, high: 1.8 },
      { from: 2041, to: 2060, best: 2.1, low: 1.7, high: 2.6 },
      { from: 2081, to: 2100, best: 3.6, low: 2.8, high: 4.6 },
    ],
  },
  {
    id: 'ssp585',
    code: 'SSP5-8.5',
    points: [
      { from: 2021, to: 2040, best: 1.6, low: 1.3, high: 1.9 },
      { from: 2041, to: 2060, best: 2.4, low: 1.9, high: 3.0 },
      { from: 2081, to: 2100, best: 4.4, low: 3.3, high: 5.7 },
    ],
  },
];

export const SCENARIOS_SOURCE = {
  name: 'IPCC AR6 WGI · tabella SPM.1',
  url: 'https://www.ipcc.ch/report/ar6/wg1/',
  baseline: '1850-1900',
} as const;

/**
 * Il tempo che resta, e il perché di ogni numero.
 *
 * Il bilancio viene da *Indicators of Global Climate Change 2024* (Forster et
 * al., ESSD 2025); il ritmo di consumo **non** è copiato da lì ma calcolato
 * dai dati che l'app ha già — CO₂ fossile più uso del suolo del riferimento
 * mondiale di co2-countries.json. Così le due cifre restano coerenti fra loro
 * e il conto si può rifare a mano.
 */
export const CARBON_BUDGET = {
  /** Gt CO₂ residue dall'inizio del 2025, 50% di probabilità di restare sotto 1,5 °C. */
  gt: 130,
  from: 2025,
  probability: 50,
  /** Con il 66% di probabilità ne restano molte meno. */
  strictGt: 80,
  strictProbability: 66,
  /** Gt CO₂ emesse in un anno: fossili + cemento + uso del suolo, 2024. */
  annualGt: 43.2,
  annualYear: 2024,
  source: 'Forster et al. · Indicators of Global Climate Change 2024 (ESSD 2025)',
  sourceUrl: 'https://essd.copernicus.org/articles/17/2641/2025/',
} as const;

/** Anni al netto di quanto è già stato bruciato da inizio 2025. */
export function yearsLeft(budgetGt: number, now = new Date()): number {
  const elapsed = (now.getUTCFullYear() - CARBON_BUDGET.from) + now.getUTCMonth() / 12;
  const spent = Math.max(0, elapsed) * CARBON_BUDGET.annualGt;
  return Math.max(0, (budgetGt - spent) / CARBON_BUDGET.annualGt);
}

/**
 * Quasi tutti sono d'accordo, e quasi nessuno lo sa.
 *
 * È il risultato meglio documentato della letteratura sul comportamento
 * climatico: le persone agiscono in modo condizionale — faccio la mia parte se
 * penso che la facciano anche gli altri — e sottostimano sistematicamente
 * quanto gli altri siano disposti a fare. Credere di essere in minoranza
 * quando si è nell'89% è di per sé un freno.
 *
 * Le cifre per paese non sono in nessun dataset aperto che sia riuscito a
 * trovare: qui ci sono quelle globali, trascritte come i produttori.
 */
export const CLIMATE_SUPPORT = {
  people: 130000,
  countries: 125,
  /** % disposta a versare l'1% del reddito personale. */
  willingToPay: 69,
  /** % che condivide le norme sociali pro-clima. */
  norms: 86,
  /** % che chiede più azione politica. */
  demandsAction: 89,
  year: 2024,
  source: 'Andre, Boneva, Chopra & Falk · Nature Climate Change 2024',
  sourceUrl:
    'https://www.uni-bonn.de/en/news/weltweite-befragung-zeigt-breite-mehrheit-der-weltbevoelkerung-fuer-den-klimaschutz',
} as const;
