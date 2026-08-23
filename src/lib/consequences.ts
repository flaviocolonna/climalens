/**
 * Cosa fa il riscaldamento.
 *
 * Tutto il resto dell'app misura la **causa**: chi emette, chi ha emesso, chi
 * promette, chi mantiene, cosa puoi togliere tu. La mappa dice che si scalda e
 * non dice mai cosa il riscaldamento faccia. Questo è il pezzo mancante, e ha
 * due metà che rispondono a due obiezioni diverse.
 *
 * **Il mare**, per chi pensa che sia una faccenda del 2100: sale da un secolo,
 * è misurato, e accelera. La parte che quasi nessuno sa è che una quota è già
 * decisa — l'oceano risponde per secoli a un calore che ha già assorbito, e
 * anche fermandosi a 1,5 °C continuerebbe a salire per duemila anni.
 *
 * **Gli eventi attribuiti**, per chi dice «c'è sempre stato il maltempo». La
 * scienza dell'attribuzione risponde con un numero: quante volte più probabile
 * è diventato quel giorno preciso. Non «il clima cambia», ma «quell'alluvione,
 * lì, nel 2022».
 *
 * ---
 *
 * **Perché gli eventi sono scritti a mano e non scaricati.** L'elenco completo
 * esiste, ed è ottimo: Carbon Brief ne mantiene uno pubblico con quasi mille
 * studi. È però distribuito con licenza CC BY-NC-ND, e ND vuol dire che non se
 * ne può pubblicare una versione rielaborata. Quindi la loro raccolta serve qui
 * come **indice per risalire agli studi primari**, che sono la fonte vera di
 * ogni riga, e il pannello rimanda alla loro mappa per chi vuole tutto. È la
 * stessa scelta fatta per il Climate Action Tracker nel layer delle promesse:
 * se la licenza non permette di ridistribuire, non si ridistribuisce.
 *
 * Le proiezioni stanno qui e non in una pipeline per un motivo diverso: una
 * proiezione non è una serie da scaricare, è una riga di un rapporto. Vale la
 * stessa regola degli scenari di temperatura in src/lib/future.ts.
 */
import type { ScenarioId } from '@/lib/future';

// ---------------------------------------------------------------------------
// Il mare
// ---------------------------------------------------------------------------

export interface SeaProjection {
  id: ScenarioId;
  /** Etichetta tecnica dello scenario: non si traduce. */
  code: string;
  /** Metri, mediana e intervallo *probabile* (17°–83° percentile). */
  median: number;
  low: number;
  high: number;
}

/**
 * IPCC AR6 WGI, tabella 9.9 e SPM B.5.3: innalzamento medio globale del mare
 * al 2100 rispetto al **1995-2014**.
 *
 * È un'altra base di riferimento ancora: le anomalie della mappa sono sul
 * 1951-1980, gli scenari di temperatura sul 1850-1900, questi sul 1995-2014.
 * Tre zeri diversi in tre pannelli diversi, e ognuno scrive il suo accanto —
 * confonderli è il modo più facile di sbagliare di mezzo metro.
 */
export const SEA_2100: SeaProjection[] = [
  { id: 'ssp119', code: 'SSP1-1.9', median: 0.38, low: 0.28, high: 0.55 },
  { id: 'ssp126', code: 'SSP1-2.6', median: 0.44, low: 0.32, high: 0.62 },
  { id: 'ssp245', code: 'SSP2-4.5', median: 0.56, low: 0.44, high: 0.76 },
  { id: 'ssp370', code: 'SSP3-7.0', median: 0.68, low: 0.55, high: 0.9 },
  { id: 'ssp585', code: 'SSP5-8.5', median: 0.77, low: 0.63, high: 1.01 },
];

export const SEA_PROJECTION_BASELINE = '1995–2014';

/**
 * Il ritmo misurato, per finestre, come lo riporta l'AR6. Tre numeri e non una
 * curva: sono questi che l'IPCC pubblica, e sono anche il modo più diretto di
 * mostrare che il fenomeno **accelera** invece di limitarsi a proseguire.
 */
export const SEA_RATES = [
  { from: 1901, to: 1971, mmPerYear: 1.3 },
  { from: 1971, to: 2006, mmPerYear: 1.9 },
  { from: 2006, to: 2018, mmPerYear: 3.7 },
] as const;

export const SEA_FACTS = {
  /** Centimetri saliti fra il 1901 e il 2018. */
  risenCm: 20,
  /** Nessun secolo ne ha visto altrettanto negli ultimi tremila anni. */
  unprecedentedYears: 3000,
  /**
   * L'impegno di lungo periodo: **anche** fermando il riscaldamento a 1,5 °C,
   * il mare continua a salire di 2-3 m nei duemila anni successivi. È la cifra
   * meno conosciuta dell'intero rapporto e la più difficile da digerire,
   * perché non dipende più da quello che si decide adesso.
   */
  commitmentAtC: 1.5,
  commitmentLowM: 2,
  commitmentHighM: 3,
  commitmentYears: 2000,
} as const;

export const SEA_SOURCE = {
  name: 'IPCC AR6 WGI · Summary for Policymakers e capitolo 9',
  url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
} as const;

// ---------------------------------------------------------------------------
// Gli eventi attribuiti
// ---------------------------------------------------------------------------

export type EventType = 'heat' | 'flood' | 'drought' | 'storm' | 'ocean';

export interface AttributedEvent {
  id: string;
  year: number;
  type: EventType;
  /** Un punto rappresentativo: cliccando, la mappa apre lì. */
  lat: number;
  lon: number;
  /** Chi ha fatto lo studio — la fonte primaria, non chi la indicizza. */
  source: string;
  sourceUrl: string;
}

/**
 * Dodici eventi, scelti a mano su tre criteri: che lo studio dia un **numero**
 * e non un'impressione, che i tipi di evento siano diversi, e che la geografia
 * non sia tutta europea e nordamericana.
 *
 * L'ultimo criterio è deliberatamente in contrasto con la letteratura, che è
 * sbilanciata proprio così — e il pannello lo dice invece di nasconderlo dietro
 * una selezione che sembra equilibrata.
 *
 * Il Giappone 2018 è qui apposta con il suo +7%: fra moltiplicatori da 30 e da
 * 600 serve una riga che ricordi che l'attribuzione non risponde sempre in
 * grande, e che quando risponde piccolo lo dice.
 */
export const EVENTS: AttributedEvent[] = [
  {
    id: 'europe2003',
    year: 2003,
    type: 'heat',
    lat: 48.86,
    lon: 2.35,
    source: 'Stott et al. · Nature 2004',
    sourceUrl: 'https://www.nature.com/articles/nature03089',
  },
  {
    id: 'reef2016',
    year: 2016,
    type: 'ocean',
    lat: -18.3,
    lon: 147.7,
    source: 'World Weather Attribution 2016',
    sourceUrl: 'https://www.worldweatherattribution.org/great-barrier-reef-bleaching-march-2016/',
  },
  {
    id: 'harvey2017',
    year: 2017,
    type: 'storm',
    lat: 29.76,
    lon: -95.37,
    source: 'van Oldenborgh et al. · Environmental Research Letters 2017',
    sourceUrl: 'https://iopscience.iop.org/article/10.1088/1748-9326/aa9ef2',
  },
  {
    id: 'japan2018',
    year: 2018,
    type: 'flood',
    lat: 34.4,
    lon: 132.46,
    source: 'Kawase et al. · Bulletin of the American Meteorological Society 2020',
    sourceUrl: 'https://www.ametsoc.net/eee/2018/19_Kawase0173.pdf',
  },
  {
    id: 'siberia2020',
    year: 2020,
    type: 'heat',
    lat: 67.55,
    lon: 133.39,
    source: 'World Weather Attribution 2020',
    sourceUrl:
      'https://www.worldweatherattribution.org/siberian-heatwave-of-2020-almost-impossible-without-climate-change/',
  },
  {
    id: 'westernNorthAmerica2021',
    year: 2021,
    type: 'heat',
    lat: 50.23,
    lon: -121.58,
    source: 'World Weather Attribution 2021',
    sourceUrl:
      'https://www.worldweatherattribution.org/western-north-american-extreme-heat-virtually-impossible-without-human-caused-climate-change/',
  },
  {
    id: 'hornOfAfrica2022',
    year: 2022,
    type: 'drought',
    lat: 4.17,
    lon: 42.07,
    source: 'World Weather Attribution 2023',
    sourceUrl:
      'https://www.worldweatherattribution.org/human-induced-climate-change-increased-drought-severity-in-southern-horn-of-africa/',
  },
  {
    id: 'madagascar2022',
    year: 2022,
    type: 'storm',
    lat: -18.15,
    lon: 49.4,
    source: 'World Weather Attribution 2022',
    sourceUrl:
      'https://www.worldweatherattribution.org/climate-change-increased-rainfall-associated-with-tropical-cyclones-hitting-highly-vulnerable-communities-in-madagascar-mozambique-malawi/',
  },
  {
    id: 'southAsia2022',
    year: 2022,
    type: 'heat',
    lat: 28.61,
    lon: 77.21,
    source: 'World Weather Attribution 2022',
    sourceUrl:
      'https://www.worldweatherattribution.org/climate-change-made-devastating-early-heat-in-india-and-pakistan-30-times-more-likely/',
  },
  {
    id: 'pakistan2022',
    year: 2022,
    type: 'flood',
    lat: 26.0,
    lon: 68.4,
    source: 'Otto et al. · Environmental Research: Climate 2023',
    sourceUrl: 'https://iopscience.iop.org/article/10.1088/2752-5295/acbfd5',
  },
  {
    id: 'europeDrought2022',
    year: 2022,
    type: 'drought',
    lat: 48.0,
    lon: 8.5,
    source: 'World Weather Attribution 2022',
    sourceUrl:
      'https://www.worldweatherattribution.org/high-temperatures-exacerbated-by-climate-change-made-2022-northern-hemisphere-droughts-more-likely/',
  },
  {
    id: 'amazon2023',
    year: 2023,
    type: 'drought',
    lat: -3.1,
    lon: -60.02,
    source: 'World Weather Attribution 2024',
    sourceUrl:
      'https://www.worldweatherattribution.org/climate-change-not-el-nino-main-driver-of-exceptional-drought-in-highly-vulnerable-amazon-river-basin/',
  },
];

/**
 * Il quadro d'insieme, contato sull'elenco pubblico di Carbon Brief.
 *
 * I conteggi sono **nostri**, fatti sulla loro lista al momento indicato, e la
 * distinzione conta: la cifra che loro pubblicano negli articoli si riferisce a
 * versioni precedenti dell'elenco. Qui si dice quanti sono oggi e come si
 * dividono, con il rimando alla loro mappa per chi vuole verificarli.
 *
 * Le tre categorie oltre alla prima ci sono per un motivo preciso: senza,
 * questa sezione mostrerebbe solo i casi in cui l'attribuzione ha trovato
 * qualcosa, che è il modo più elegante di mentire con dati veri.
 */
export const ATTRIBUTION_DB = {
  total: 967,
  moreLikely: 743,
  noInfluence: 81,
  lessLikely: 76,
  inconclusive: 67,
  countedOn: '2026-08',
  source: 'Carbon Brief',
  url: 'https://interactive.carbonbrief.org/attribution-studies/index.html',
} as const;

/**
 * Dove guarda la letteratura, per regione. Non è una mappa di dove succedono
 * gli eventi estremi: è una mappa di **dove si studiano**, e le due cose
 * divergono esattamente nel verso peggiore.
 *
 * Contate sullo stesso elenco. Le voci non geografiche — «globale», «emisfero
 * settentrionale» — restano fuori perché non sono luoghi, e mescolarle
 * gonfierebbe il totale senza aggiungere un posto.
 */
export const STUDIES_BY_REGION = [
  { id: 'easternAsia', studies: 216 },
  { id: 'europe', studies: 214 },
  { id: 'northernAmerica', studies: 171 },
  { id: 'subSaharanAfrica', studies: 61 },
  { id: 'australia', studies: 57 },
  { id: 'southernAsia', studies: 53 },
  { id: 'latinAmerica', studies: 45 },
  { id: 'arctic', studies: 13 },
  { id: 'northernAfrica', studies: 10 },
  { id: 'oceania', studies: 9 },
] as const;

export type RegionId = (typeof STUDIES_BY_REGION)[number]['id'];

// ---------------------------------------------------------------------------
// Il file di dati
// ---------------------------------------------------------------------------

export interface ExposedCountry {
  iso: string;
  /** Nome come lo scrive la Banca Mondiale: la tabella non è tradotta. */
  name: string;
  /** % della popolazione che vive sotto i cinque metri di quota. */
  population: number;
  /** % della superficie sotto i cinque metri, o null se manca. */
  land: number | null;
}

export interface ConsequencesData {
  meta: {
    seaSource: string;
    seaSourceUrl: string;
    seaBaseline: string;
    seaFrom: number;
    seaTo: number;
    exposureSource: string;
    exposureSourceUrl: string;
    exposureYears: number[];
    exposureCoverage: number;
    generatedAt: string;
  };
  /** [anno, millimetri rispetto alla media del periodo di riferimento]. */
  sea: Array<[number, number]>;
  exposed: ExposedCountry[];
}

let pending: Promise<ConsequencesData> | null = null;

export function loadConsequences(): Promise<ConsequencesData> {
  if (!pending) {
    pending = fetch(`${import.meta.env.BASE_URL}data/consequences.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`consequences.json: HTTP ${r.status}`);
        return r.json() as Promise<ConsequencesData>;
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}
