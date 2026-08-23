/**
 * Come lo sappiamo: quando l'abbiamo capito, e con che convenzioni si misura.
 *
 * Due sezioni che rispondono a due obiezioni diverse. La cronologia risponde a
 * «non si poteva sapere»: la fisica di base è del 1856, il primo calcolo del
 * 1896, il primo allarme formale al governo americano del 1965. Il glossario
 * risponde a «questi numeri me li stai scegliendo tu»: ogni pannello dell'app
 * ha una trappola di convenzione che evita in piccolo, qui sono spiegate una
 * volta per tutte in un posto solo.
 *
 * Anni e id restano qui, locale-neutri; i testi stanno in
 * src/i18n/content/knowledge.ts.
 */

export interface Milestone {
  id: string;
  year: number;
  /** Chi l'ha fatto: nome proprio, uguale in ogni lingua. */
  who: string;
}

/** In ordine cronologico: l'ordine è la dimostrazione. */
export const MILESTONES: Milestone[] = [
  { id: 'foote', year: 1856, who: 'Eunice Newton Foote' },
  { id: 'tyndall', year: 1859, who: 'John Tyndall' },
  { id: 'arrhenius', year: 1896, who: 'Svante Arrhenius' },
  { id: 'callendar', year: 1938, who: 'Guy Callendar' },
  { id: 'revelle', year: 1957, who: 'Roger Revelle · Hans Suess' },
  { id: 'keeling', year: 1958, who: 'Charles David Keeling' },
  { id: 'johnson', year: 1965, who: "President's Science Advisory Committee" },
  { id: 'charney', year: 1979, who: 'Jule Charney · US National Academy of Sciences' },
  { id: 'hansen', year: 1988, who: 'James Hansen · US Senate' },
  { id: 'ipcc', year: 1990, who: 'IPCC' },
  { id: 'paris', year: 2015, who: 'COP21' },
];

/**
 * Le convenzioni che l'app deve dichiarare di continuo, spiegate una volta.
 * L'ordine è quello in cui uno le incontra guardando l'app dall'inizio.
 */
export const GLOSSARY_IDS = [
  'baseline',
  'anomaly',
  'co2e',
  'gwp',
  'territorial',
  'upstream',
  'perCapita',
  'referenceYear',
  'coverage',
] as const;

export type GlossaryId = (typeof GLOSSARY_IDS)[number];
