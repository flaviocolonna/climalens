/**
 * I nove confini planetari.
 *
 * È la sezione che rimette il clima al suo posto: uno dei nove limiti, e non
 * quello messo peggio. Azoto e fosforo sono superati di tre volte, la biosfera
 * di dieci; il buco dell'ozono, invece, si sta richiudendo — l'unico problema
 * ambientale globale che l'umanità abbia davvero risolto.
 *
 * **Valori**: Richardson et al., *Earth beyond six of nine planetary
 * boundaries*, Science Advances 2023. Una sola valutazione, internamente
 * coerente, invece di nove numeri presi da nove posti diversi.
 *
 * **Stato**: Planetary Health Check 2025 (PIK / Stockholm Resilience Centre),
 * che ha dichiarato superata anche l'acidificazione degli oceani — settima su
 * nove. Il suo limite è stato ricalcolato lì sulla base preindustriale
 * rivista, quindi quella riga porta i numeri del 2025 e non quelli del 2023:
 * è l'unico posto dove le due fonti si sovrappongono, ed è dichiarato invece
 * che mescolato in silenzio.
 *
 * Locale-neutro di proposito: id, numeri e unità sono gli stessi ovunque. I
 * nomi e le spiegazioni stanno in src/i18n/content/boundaries.ts.
 */

export type BoundaryStatus = 'crossed' | 'safe';

export interface Boundary {
  id: string;
  status: BoundaryStatus;
  /**
   * Da che parte si sfonda. `above`: il valore cresce oltre il limite (CO₂).
   * `below`: cala sotto (foreste rimaste, saturazione di aragonite). Senza
   * questo, metà delle righe avrebbe la barra dalla parte sbagliata.
   */
  direction: 'above' | 'below';
  /** null = confine riconosciuto ma non ancora quantificato. */
  boundary: number | null;
  current: number | null;
  /** Il valore attuale è un minimo, non un punto: la biosfera è ">100". */
  atLeast?: boolean;
  /** Simbolo dell'unità, uguale in ogni lingua. */
  unit: string;
  decimals: number;
  year: number;
}

export const BOUNDARIES: Boundary[] = [
  {
    id: 'biosphere',
    status: 'crossed',
    direction: 'above',
    boundary: 10,
    current: 100,
    atLeast: true,
    unit: 'E/MSY',
    decimals: 0,
    year: 2023,
  },
  {
    id: 'biogeochemical',
    status: 'crossed',
    direction: 'above',
    boundary: 62,
    current: 190,
    unit: 'Tg N/anno',
    decimals: 0,
    year: 2023,
  },
  {
    id: 'freshwater',
    status: 'crossed',
    direction: 'above',
    boundary: 11.1,
    current: 18.2,
    unit: '%',
    decimals: 1,
    year: 2023,
  },
  {
    id: 'land',
    status: 'crossed',
    direction: 'below',
    boundary: 75,
    current: 60,
    unit: '%',
    decimals: 0,
    year: 2023,
  },
  {
    id: 'climate',
    status: 'crossed',
    direction: 'above',
    boundary: 350,
    current: 417,
    unit: 'ppm CO₂',
    decimals: 0,
    year: 2023,
  },
  {
    id: 'oceanAcidification',
    status: 'crossed',
    direction: 'below',
    boundary: 2.86,
    current: 2.8,
    unit: 'Ω arag.',
    decimals: 2,
    year: 2025,
  },
  {
    // Plastiche, pesticidi, PFAS, farmaci: decine di migliaia di sostanze di
    // sintesi rilasciate senza che ne esista una soglia sicura calcolata.
    id: 'novelEntities',
    status: 'crossed',
    direction: 'above',
    boundary: null,
    current: null,
    unit: '',
    decimals: 0,
    year: 2023,
  },
  {
    id: 'aerosols',
    status: 'safe',
    direction: 'above',
    boundary: 0.1,
    current: 0.076,
    unit: 'ΔAOD',
    decimals: 3,
    year: 2023,
  },
  {
    id: 'ozone',
    status: 'safe',
    direction: 'below',
    boundary: 276,
    current: 284.6,
    unit: 'DU',
    decimals: 1,
    year: 2023,
  },
];

export const CROSSED_COUNT = BOUNDARIES.filter((b) => b.status === 'crossed').length;

/**
 * Quanto si è oltre il limite, come multiplo del limite stesso: 1 è esattamente
 * sul confine, 3 vuol dire tre volte tanto. Serve a mettere sulla stessa scala
 * righe misurate in ppm, in teragrammi e in unità Dobson, che altrimenti non
 * si potrebbero confrontare con nessuna barra.
 */
export function pressure(b: Boundary): number | null {
  if (b.boundary === null || b.current === null || b.boundary === 0 || b.current === 0) return null;
  return b.direction === 'above' ? b.current / b.boundary : b.boundary / b.current;
}

/** Oltre questo la barra si taglia: il numero esatto resta scritto accanto. */
export const PRESSURE_SCALE_MAX = 2;

export const SOURCE_VALUES_URL = 'https://www.science.org/doi/10.1126/sciadv.adh2458';
export const SOURCE_STATUS_URL = 'https://www.planetaryhealthcheck.org/';
