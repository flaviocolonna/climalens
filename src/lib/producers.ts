/**
 * Chi estrae il carbonio, e chi confeziona la plastica.
 *
 * È il terzo taglio della stessa torta, dopo «da dove escono» (per sorgente) e
 * «a cosa servono» (per uso finale): **contabilità a monte**. La CO₂ del
 * petrolio Aramco la emette chi lo brucia — questa lente dice chi l'ha tirato
 * fuori dal terreno. Non è un doppio conteggio, è la stessa quantità guardata
 * da un altro capo della filiera, e l'interfaccia lo dichiara come già fa per
 * la lente dei consumi.
 *
 * **Dati copiati a mano, non generati.** È l'unica eccezione del progetto e
 * vale la pena dire perché: il CSV di Carbon Majors è gratuito ma dietro un
 * download interattivo che uno script non può attraversare, e i risultati dei
 * brand audit escono solo in PDF annuali. Quindi qui ci sono le cifre dei
 * comunicati, con l'anno e il link accanto a ciascuna, invece di una pipeline
 * che finge di aggiornarsi da sola.
 */

export interface CarbonMajor {
  /** Nome proprio: uguale in ogni lingua, resta nei dati. */
  name: string;
  /** Mt CO₂e attribuite nell'anno di riferimento. */
  mt: number;
  /**
   * Stato o impresa privata: cambia di chi è la leva per fermarla. Assente
   * dove la voce non è un'impresa ma un aggregato di settore.
   */
  kind?: 'state' | 'investor';
}

export const CARBON_MAJORS = {
  year: 2024,
  /** Gt CO₂e tracciate nell'anno, dalle entità ancora attive. */
  tracedGt: 34.7,
  activeEntities: 166,
  totalEntities: 178,
  /** % della CO₂ fossile e da cemento di tutta l'era industriale. */
  historicalShare: 70,
  historicalFrom: 1854,
  /** Quante imprese bastano a superare metà delle emissioni mondiali. */
  halfWorldCount: 32,
  source: 'Carbon Majors (InfluenceMap) · aggiornamento 2024',
  sourceUrl: 'https://carbonmajors.org/briefing/Carbon-Majors-2024-Data-Update-35466',
  top: [
    { name: 'Saudi Aramco', mt: 1786, kind: 'state' },
    { name: 'Coal India', mt: 1684, kind: 'state' },
    { name: 'CHN Energy', mt: 1679, kind: 'state' },
    { name: 'National Iranian Oil Co.', mt: 1387, kind: 'state' },
    { name: 'Gazprom', mt: 1293, kind: 'state' },
    { name: 'Jinneng Group', mt: 1129, kind: 'state' },
    { name: 'China (Cement)', mt: 950 },
    { name: 'Rosneft', mt: 763, kind: 'state' },
    { name: 'CNPC', mt: 750, kind: 'state' },
    { name: 'Shandong Energy', mt: 750, kind: 'state' },
  ] satisfies CarbonMajor[],
} as const;

/**
 * I marchi ritrovati nei rifiuti raccolti dai volontari.
 *
 * La classifica **non** è per numero di pezzi ma per quanti paesi diversi
 * ritrovano quel marchio, ed è una scelta metodologica che cambia il podio: nel
 * 2023 PepsiCo ha lasciato più pezzi di Coca-Cola, ma in 30 paesi contro 40.
 * Contare i pezzi premierebbe i posti dove si raccoglie di più, non i marchi
 * più diffusi — e siccome la differenza non è ovvia, il pannello la scrive.
 */
export const PLASTIC_BRANDS = {
  year: 2023,
  audits: 250,
  volunteers: 8804,
  countries: 41,
  items: 537719,
  brandsFound: 6858,
  parentCompanies: 3810,
  /** Pezzi del primo in classifica, e in quanti paesi è stato ritrovato. */
  leaderItems: 33820,
  leaderCountries: 40,
  leaderYearsFirst: 6,
  runnerUpCountries: 30,
  source: 'Break Free From Plastic · Global Brand Audit 2023',
  sourceUrl:
    'https://www.breakfreefromplastic.org/2024/02/07/bffp-movement-unveils-2023-global-brand-audit-results/',
  /**
   * L'ordine pubblicato. Il conteggio per singolo marchio non è nei comunicati
   * oltre al primo, quindi qui c'è la posizione e basta: inventare i numeri
   * mancanti per riempire una colonna sarebbe peggio di lasciarla vuota.
   */
  top: [
    'The Coca-Cola Company',
    'Nestlé',
    'Unilever',
    'PepsiCo',
    'Mondelēz International',
    'Mars, Inc.',
    'Procter & Gamble',
    'Danone',
    'Altria',
  ],
} as const;
