/**
 * Ripartizione settoriale delle emissioni globali di gas serra.
 *
 * Fonte: Climate Watch / WRI (release 2020), anno 2016 — la ricostruzione usata
 * anche da Our World in Data. È l'ultimo anno pubblicato con questo livello di
 * dettaglio per sotto-settore: le quote si muovono di poco da un anno all'altro,
 * il totale assoluto invece cresce.
 *
 * Tutti i gas convertiti in CO2 equivalente (GWP a 100 anni), uso del suolo
 * incluso. Le quote sono percentuali del totale globale e per costruzione
 * sommano a quella del genitore — l'invariante è verificata in dev, in fondo.
 *
 * Locale-neutro di proposito: id, quote, colori e fonti sono gli stessi in
 * ogni lingua. I nomi e le note leggibili vivono in
 * src/i18n/content/sectors.ts, separati apposta — così una traduzione non può
 * far scivolare una quota rispetto alle altre senza che il controllo qui sotto
 * se ne accorga.
 */
import { LOCALE_TAG, type Locale } from '@/i18n/locale';
import { sectorText, demandSectorText } from '@/i18n/content/sectors';

export interface EmissionSector {
  id: string;
  /** Quota sul totale globale delle emissioni di gas serra, in percento. */
  share: number;
  children?: EmissionSector[];
}

export const EMISSIONS_META = {
  /** Totale globale nell'anno di riferimento. */
  totalGt: 49.4,
  year: 2016,
  source: 'Climate Watch (WRI)',
  sourceUrl: 'https://ourworldindata.org/emissions-by-sector',
} as const;

export const EMISSION_SECTORS: EmissionSector[] = [
  {
    id: 'energy',
    share: 73.2,
    children: [
      {
        id: 'energy-industry',
        share: 24.2,
        children: [
          { id: 'other-industry', share: 10.6 },
          { id: 'iron-steel', share: 7.2 },
          { id: 'chemicals-energy', share: 3.6 },
          { id: 'food-tobacco', share: 1.0 },
          { id: 'non-ferrous', share: 0.7 },
          { id: 'paper-pulp', share: 0.6 },
          { id: 'machinery', share: 0.5 },
        ],
      },
      {
        id: 'energy-buildings',
        share: 17.5,
        children: [
          { id: 'residential', share: 10.9 },
          { id: 'commercial', share: 6.6 },
        ],
      },
      {
        id: 'transport',
        share: 16.2,
        children: [
          { id: 'road', share: 11.9 },
          { id: 'aviation', share: 1.9 },
          { id: 'shipping', share: 1.7 },
          { id: 'rail', share: 0.4 },
          { id: 'pipeline', share: 0.3 },
        ],
      },
      { id: 'unallocated', share: 7.8 },
      {
        id: 'fugitive',
        share: 5.8,
        children: [
          { id: 'fugitive-oil-gas', share: 3.9 },
          { id: 'fugitive-coal', share: 1.9 },
        ],
      },
      { id: 'energy-agri', share: 1.7 },
    ],
  },
  {
    id: 'land',
    share: 18.4,
    children: [
      { id: 'livestock', share: 5.8 },
      { id: 'agri-soils', share: 4.1 },
      { id: 'crop-burning', share: 3.5 },
      { id: 'deforestation', share: 2.2 },
      { id: 'cropland', share: 1.4 },
      { id: 'rice', share: 1.3 },
      { id: 'grassland', share: 0.1 },
    ],
  },
  {
    id: 'industry',
    share: 5.2,
    children: [
      { id: 'cement', share: 3.0 },
      { id: 'chemicals-process', share: 2.2 },
    ],
  },
  {
    id: 'waste',
    share: 3.2,
    children: [
      { id: 'landfills', share: 1.9 },
      { id: 'wastewater', share: 1.3 },
    ],
  },
];

/**
 * Colore per settore di primo livello, ereditato dai figli.
 * Palette categorica validata sulla superficie scura dell'app (#0b0f16):
 * banda di luminosità, croma, separazione per daltonismo e contrasto ≥ 3:1.
 */
export const SECTOR_COLORS: Record<string, string> = {
  energy: '#3987e5',
  land: '#d95926',
  industry: '#199e70',
  waste: '#c98500',
};

/**
 * La stessa torta tagliata per uso finale invece che per sorgente.
 *
 * L'abbigliamento non è una riga mancante nell'albero qui sopra: è già dentro,
 * spalmato tra petrolchimica (fibre sintetiche), altra industria (tintura e
 * finissaggio), agricoltura (cotone, lana), navigazione e discariche. Vale per
 * cibo, turismo, sanità, digitale ed edilizia.
 *
 * Tre conseguenze, tutte dichiarate nell'interfaccia invece che nascoste:
 *  - queste voci **si sovrappongono** e non sommano a 100;
 *  - ognuna ha la **sua fonte e il suo anno**, perché non esiste uno studio
 *    unico che le calcoli tutte con gli stessi confini;
 *  - alcune sono **contese**, e allora si disegna l'intervallo, non una media
 *    inventata che sembrerebbe più precisa di quello che è.
 */
export interface DemandSector {
  id: string;
  /** Estremi della stima; coincidono quando la fonte è una sola. */
  min: number;
  max: number;
  year: number;
  source: string;
  sourceUrl: string;
  /** Id dei settori-sorgente in cui queste emissioni sono già contate. */
  spans: string[];
}

export const DEMAND_SECTORS: DemandSector[] = [
  {
    id: 'buildings-construction',
    min: 37,
    max: 37,
    year: 2021,
    source: 'UNEP · Global Status Report for Buildings and Construction',
    sourceUrl:
      'https://www.unep.org/resources/publication/2022-global-status-report-buildings-and-construction',
    spans: ['residential', 'commercial', 'cement', 'iron-steel', 'other-industry'],
  },
  {
    id: 'food',
    min: 26,
    max: 26,
    year: 2018,
    source: 'Poore & Nemecek · Science',
    sourceUrl: 'https://www.science.org/doi/10.1126/science.aaq0216',
    spans: [
      'livestock',
      'agri-soils',
      'crop-burning',
      'deforestation',
      'cropland',
      'rice',
      'food-tobacco',
      'landfills',
    ],
  },
  {
    id: 'tourism',
    min: 8,
    max: 8,
    year: 2013,
    source: 'Lenzen et al. · Nature Climate Change',
    sourceUrl: 'https://www.nature.com/articles/s41558-018-0141-x',
    spans: ['aviation', 'road', 'shipping', 'commercial', 'food-tobacco'],
  },
  {
    id: 'health',
    min: 4.4,
    max: 4.4,
    year: 2014,
    source: 'Health Care Without Harm',
    sourceUrl: 'https://noharm-global.org/documents/health-care-climate-footprint-report',
    spans: ['commercial', 'chemicals-energy', 'road', 'other-industry'],
  },
  {
    id: 'apparel',
    min: 2,
    max: 4,
    year: 2018,
    source: 'Textile Exchange (2%) · McKinsey & GFA (4%)',
    sourceUrl: 'https://www.mckinsey.com/industries/retail/our-insights/fashion-on-climate',
    spans: ['chemicals-energy', 'other-industry', 'cropland', 'livestock', 'shipping', 'landfills'],
  },
  {
    id: 'digital',
    min: 1.5,
    max: 4,
    year: 2020,
    source: 'Freitag et al. · Patterns',
    sourceUrl: 'https://www.cell.com/patterns/fulltext/S2666-3899(21)00188-4',
    spans: ['commercial', 'other-industry', 'non-ferrous', 'machinery'],
  },
];

/** id → catena di antenati (incluso sé stesso), per aprire l'albero su un punto. */
export const SECTOR_PATHS: ReadonlyMap<string, string[]> = (() => {
  const paths = new Map<string, string[]>();
  const walk = (nodes: EmissionSector[], ancestors: string[]) => {
    for (const n of nodes) {
      const path = [...ancestors, n.id];
      paths.set(n.id, path);
      if (n.children) walk(n.children, path);
    }
  };
  walk(EMISSION_SECTORS, []);
  return paths;
})();

/**
 * Nome leggibile di un settore-sorgente, per le etichette di rimando — una
 * mappa per lingua, precalcolata una volta sola: niente da ricostruire quando
 * cambia la lingua durante la sessione.
 */
export const SECTOR_NAMES: Record<Locale, ReadonlyMap<string, string>> = (() => {
  const build = (locale: Locale) => {
    const names = new Map<string, string>();
    const walk = (nodes: EmissionSector[]) => {
      for (const n of nodes) {
        names.set(n.id, sectorText(n.id, locale)?.name ?? n.id);
        if (n.children) walk(n.children);
      }
    };
    walk(EMISSION_SECTORS);
    return names;
  };
  return { it: build('it'), en: build('en'), es: build('es') };
})();

export { sectorText, demandSectorText };

/** Gigatonnellate di CO2e corrispondenti a una quota percentuale. */
export function gigatonnes(share: number): number {
  return (share * EMISSIONS_META.totalGt) / 100;
}

function oneDecimal(value: number, locale: Locale): string {
  return value.toLocaleString(LOCALE_TAG[locale], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** "12,4%" con la virgola decimale italiana (o il punto in inglese). Decimale fisso: sta in colonna. */
export function percent(share: number, locale: Locale): string {
  return `${oneDecimal(share, locale)}%`;
}

/**
 * "37%", "4,4%", "2–4%". Fuori da una colonna incolonnata il decimale fisso è
 * solo rumore, e un intervallo va letto come un intervallo: un segno di
 * percentuale in fondo, non due.
 */
export function percentRange(min: number, max: number, locale: Locale): string {
  const trim = (v: number) => v.toLocaleString(LOCALE_TAG[locale], { maximumFractionDigits: 1 });
  return min === max ? `${trim(max)}%` : `${trim(min)}–${trim(max)}%`;
}

/** "8,9 Gt" di CO2e all'anno. */
export function gigatonnesLabel(share: number, locale: Locale): string {
  const gt = gigatonnes(share);
  // Arrotondata a una cifra, una voce come le praterie (0,1%) diventerebbe
  // "0,0 Gt", cioè niente. Sono 49 milioni di tonnellate.
  if (gt < 0.05) return locale === 'en' ? '<0.1 Gt' : '<0,1 Gt';
  return `${oneDecimal(gt, locale)} Gt`;
}

if (import.meta.env.DEV) {
  // Le quote sono percentuali del totale globale: i figli devono ricomporre il
  // genitore, e i settori di primo livello il 100%. Se una cifra viene corretta
  // a mano senza aggiornare il resto, questo se ne accorge subito.
  const check = (nodes: EmissionSector[], expected: number, label: string) => {
    const sum = nodes.reduce((acc, n) => acc + n.share, 0);
    if (Math.abs(sum - expected) > 0.05) {
      console.warn(`[emissions] ${label}: i figli sommano a ${sum}, atteso ${expected}`);
    }
    for (const n of nodes) if (n.children) check(n.children, n.share, n.id);
  };
  check(EMISSION_SECTORS, 100, 'totale globale');

  // I rimandi della seconda lente puntano dentro l'albero: un id rinominato lì
  // spezzerebbe la navigazione in silenzio, mostrando un elenco più corto.
  for (const d of DEMAND_SECTORS) {
    const missing = d.spans.filter((id) => !SECTOR_PATHS.has(id));
    if (missing.length) console.warn(`[emissions] ${d.id}: id inesistenti → ${missing.join(', ')}`);
  }
}
