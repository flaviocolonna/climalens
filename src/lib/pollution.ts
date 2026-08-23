/**
 * L'inquinamento che non è CO₂.
 *
 * La CO₂ scalda ma non si respira, e non è quello che uccide adesso: il PM2.5
 * sì. Queste cinque metriche stanno sulla stessa mappa dei paesi ma rispondono
 * a un'altra domanda, e per questo vivono in una scheda a parte invece che
 * come altri cinque chip in fondo a quella del carbonio.
 *
 * Il file è prodotto da scripts/build-pollution-data.mjs: una tabella per
 * codice ISO3, 16 KB, **senza geometrie**. Le forme le ha già co2-countries.json
 * e ripeterle costerebbe dieci volte tanto per ridire le stesse frontiere —
 * `mergeIntoCountries` le mette insieme al volo.
 *
 * Le classi non sono numeri tondi: dove esiste una soglia ufficiale è quella a
 * fare da confine. Il PM2.5 usa la linea guida OMS 2021 (5 µg/m³) e i suoi
 * quattro obiettivi intermedi; lo stress idrico usa le classi SDG 6.4.2. Una
 * scala inventata avrebbe reso i colori arbitrari proprio dove esiste un
 * accordo internazionale su dove sta il limite.
 */
import type { Locale } from '@/i18n/locale';
import { LOCALE_TAG } from '@/i18n/locale';
import {
  SEQUENTIAL,
  type CountryEmissions,
  type Metric,
  type MetricClass,
} from '@/lib/countryEmissions';

export type PollutionMetricId = 'pm25' | 'airDeaths' | 'waterStress' | 'plastic' | 'nitrogen';

export const POLLUTION_METRIC_IDS: PollutionMetricId[] = [
  'pm25',
  'airDeaths',
  'waterStress',
  'plastic',
  'nitrogen',
];

export interface PollutionTable {
  meta: {
    sources: { worldBank: string; worldBankUrl: string; owid: string; owidUrl: string };
    labels: Record<PollutionMetricId, string>;
    generatedAt: string;
    years: Record<PollutionMetricId, number>;
    coverage: Record<PollutionMetricId, number>;
    countries: number;
  };
  countries: Record<string, Partial<Record<PollutionMetricId, number>>>;
}

/** Quale fonte firma quale metrica: le due non hanno lo stesso editore. */
export const METRIC_SOURCE: Record<PollutionMetricId, 'worldBank' | 'owid'> = {
  pm25: 'worldBank',
  airDeaths: 'worldBank',
  waterStress: 'worldBank',
  plastic: 'owid',
  nitrogen: 'owid',
};

/**
 * Soglie e colori. La rampa è quella già validata sulla basemap scura per le
 * emissioni: stessa lingua visiva — più scuro = peggio — per una domanda
 * diversa, invece di una seconda tavolozza da imparare.
 */
const SHAPES: Record<PollutionMetricId, MetricClass[]> = {
  // Linea guida OMS 2021 (5) e i quattro obiettivi intermedi (10, 15, 25, 35).
  pm25: [
    { from: -Infinity, color: SEQUENTIAL[0], label: '' },
    { from: 5, color: SEQUENTIAL[1], label: '' },
    { from: 10, color: SEQUENTIAL[2], label: '' },
    { from: 15, color: SEQUENTIAL[3], label: '' },
    { from: 25, color: SEQUENTIAL[4], label: '' },
    { from: 35, color: SEQUENTIAL[5], label: '' },
  ],
  airDeaths: [
    { from: -Infinity, color: SEQUENTIAL[0], label: '' },
    { from: 10, color: SEQUENTIAL[1], label: '' },
    { from: 25, color: SEQUENTIAL[2], label: '' },
    { from: 50, color: SEQUENTIAL[3], label: '' },
    { from: 100, color: SEQUENTIAL[4], label: '' },
    { from: 150, color: SEQUENTIAL[5], label: '' },
  ],
  // Classi SDG 6.4.2: sopra il 100% un paese preleva più di quanto si rigeneri.
  waterStress: [
    { from: -Infinity, color: SEQUENTIAL[0], label: '' },
    { from: 25, color: SEQUENTIAL[2], label: '' },
    { from: 50, color: SEQUENTIAL[3], label: '' },
    { from: 75, color: SEQUENTIAL[4], label: '' },
    { from: 100, color: SEQUENTIAL[5], label: '' },
  ],
  plastic: [
    { from: -Infinity, color: SEQUENTIAL[0], label: '' },
    { from: 1, color: SEQUENTIAL[2], label: '' },
    { from: 3, color: SEQUENTIAL[3], label: '' },
    { from: 6, color: SEQUENTIAL[4], label: '' },
    { from: 10, color: SEQUENTIAL[5], label: '' },
  ],
  nitrogen: [
    { from: -Infinity, color: SEQUENTIAL[0], label: '' },
    { from: 30, color: SEQUENTIAL[2], label: '' },
    { from: 60, color: SEQUENTIAL[3], label: '' },
    { from: 100, color: SEQUENTIAL[4], label: '' },
    { from: 150, color: SEQUENTIAL[5], label: '' },
  ],
};

interface MetricText {
  short: string;
  title: string;
  unit: string;
  blurb: string;
  classLabels: string[];
  format: (value: number, locale: Locale) => string;
}

const decimal = (v: number, locale: Locale, digits: number) =>
  v.toLocaleString(LOCALE_TAG[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const TEXT: Record<Locale, Record<PollutionMetricId, MetricText>> = {
  it: {
    pm25: {
      short: 'Aria (PM2.5)',
      title: 'Polveri sottili nell’aria',
      unit: 'µg/m³, media annua a cui è esposta la popolazione',
      blurb:
        'È l’inquinamento che si respira, non quello che scalda. La linea guida OMS è 5 µg/m³: le classi qui sono quella soglia e i quattro obiettivi intermedi con cui l’OMS misura chi ci si sta avvicinando.',
      classLabels: [
        'entro la linea guida OMS (5)',
        '5 – 10 (obiettivo 4)',
        '10 – 15 (obiettivo 3)',
        '15 – 25 (obiettivo 2)',
        '25 – 35 (obiettivo 1)',
        'oltre 35 µg/m³',
      ],
      format: (v, l) => `${decimal(v, l, 1)} µg/m³`,
    },
    airDeaths: {
      short: 'Morti',
      title: 'Morti attribuibili all’aria',
      unit: 'decessi ogni 100.000 abitanti, in un anno',
      blurb:
        'Aria di casa e aria di fuori insieme. È la metrica che rende l’inquinamento una cosa che succede alle persone e non all’atmosfera: nel mondo sono milioni di morti l’anno, più della somma di malaria, tubercolosi e HIV.',
      classLabels: [
        'meno di 10',
        '10 – 25',
        '25 – 50',
        '50 – 100',
        '100 – 150',
        'oltre 150 ogni 100.000',
      ],
      format: (v, l) => `${decimal(v, l, 0)} ogni 100.000`,
    },
    waterStress: {
      short: 'Acqua',
      title: 'Stress idrico',
      unit: '% dell’acqua dolce disponibile che viene prelevata',
      blurb:
        'Quanta acqua si prende rispetto a quanta se ne rigenera. Le classi sono quelle dell’obiettivo ONU 6.4.2: oltre il 100% un paese sta consumando fossili idrici o acqua che arriva da fuori confine, e non è una situazione che si può reggere.',
      classLabels: [
        'basso (sotto il 25%)',
        'medio (25 – 50%)',
        'alto (50 – 75%)',
        'molto alto (75 – 100%)',
        'critico: preleva più di quanto si rigeneri',
      ],
      format: (v, l) => `${decimal(v, l, v < 10 ? 1 : 0)}%`,
    },
    plastic: {
      short: 'Plastica',
      title: 'Plastica mal gestita',
      unit: 'kg a testa in un anno, fuori da qualunque impianto',
      blurb:
        'Non quanta plastica si consuma: quanta ne finisce fuori da discariche e impianti, cioè quella che può arrivare in mare. Ed è per questo che la mappa non somiglia a quella della CO₂ — dipende dalla raccolta, non dai consumi.',
      classLabels: [
        'meno di 1 kg',
        '1 – 3 kg',
        '3 – 6 kg',
        '6 – 10 kg',
        'oltre 10 kg a testa',
      ],
      format: (v, l) => `${decimal(v, l, 1)} kg a testa`,
    },
    nitrogen: {
      short: 'Azoto',
      title: 'Azoto sui campi',
      unit: 'kg di fertilizzante azotato per ettaro coltivato',
      blurb:
        'L’azoto che le piante non assorbono finisce nei fiumi e poi in mare, dove alimenta alghe che consumano l’ossigeno e lasciano zone morte. È uno dei confini planetari superati più nettamente.',
      classLabels: [
        'meno di 30 kg/ha',
        '30 – 60 kg/ha',
        '60 – 100 kg/ha',
        '100 – 150 kg/ha',
        'oltre 150 kg/ha',
      ],
      format: (v, l) => `${decimal(v, l, 0)} kg/ha`,
    },
  },
  en: {
    pm25: {
      short: 'Air (PM2.5)',
      title: 'Fine particulate matter',
      unit: 'µg/m³, annual mean the population is exposed to',
      blurb:
        "This is the pollution you breathe, not the one that warms. The WHO guideline is 5 µg/m³: the classes here are that threshold plus the four interim targets the WHO uses to track who is getting closer.",
      classLabels: [
        'within the WHO guideline (5)',
        '5 – 10 (target 4)',
        '10 – 15 (target 3)',
        '15 – 25 (target 2)',
        '25 – 35 (target 1)',
        'over 35 µg/m³',
      ],
      format: (v, l) => `${decimal(v, l, 1)} µg/m³`,
    },
    airDeaths: {
      short: 'Deaths',
      title: 'Deaths attributable to air pollution',
      unit: 'deaths per 100,000 people, per year',
      blurb:
        'Household and outdoor air together. This is the metric that makes pollution something that happens to people rather than to the atmosphere: millions of deaths a year worldwide, more than malaria, tuberculosis and HIV combined.',
      classLabels: [
        'fewer than 10',
        '10 – 25',
        '25 – 50',
        '50 – 100',
        '100 – 150',
        'over 150 per 100,000',
      ],
      format: (v, l) => `${decimal(v, l, 0)} per 100,000`,
    },
    waterStress: {
      short: 'Water',
      title: 'Water stress',
      unit: '% of available freshwater that is withdrawn',
      blurb:
        'How much water is taken versus how much renews. The classes are those of UN target 6.4.2: above 100% a country is drawing on fossil groundwater or on water that arrives from beyond its borders, and that cannot hold.',
      classLabels: [
        'low (under 25%)',
        'medium (25 – 50%)',
        'high (50 – 75%)',
        'very high (75 – 100%)',
        'critical: withdraws more than renews',
      ],
      format: (v, l) => `${decimal(v, l, v < 10 ? 1 : 0)}%`,
    },
    plastic: {
      short: 'Plastic',
      title: 'Mismanaged plastic waste',
      unit: 'kg per person per year, outside any facility',
      blurb:
        'Not how much plastic is consumed: how much ends up outside landfills and facilities, which is the share that can reach the sea. That is why this map looks nothing like the CO₂ one — it tracks collection, not consumption.',
      classLabels: ['under 1 kg', '1 – 3 kg', '3 – 6 kg', '6 – 10 kg', 'over 10 kg per person'],
      format: (v, l) => `${decimal(v, l, 1)} kg per person`,
    },
    nitrogen: {
      short: 'Nitrogen',
      title: 'Nitrogen on cropland',
      unit: 'kg of nitrogen fertiliser per hectare of cropland',
      blurb:
        'Nitrogen the plants do not take up runs into rivers and then to sea, where it feeds algae that strip the oxygen and leave dead zones. It is one of the most decisively transgressed planetary boundaries.',
      classLabels: [
        'under 30 kg/ha',
        '30 – 60 kg/ha',
        '60 – 100 kg/ha',
        '100 – 150 kg/ha',
        'over 150 kg/ha',
      ],
      format: (v, l) => `${decimal(v, l, 0)} kg/ha`,
    },
  },
  es: {
    pm25: {
      short: 'Aire (PM2.5)',
      title: 'Partículas finas en el aire',
      unit: 'µg/m³, media anual a la que está expuesta la población',
      blurb:
        'Es la contaminación que se respira, no la que calienta. La guía de la OMS es 5 µg/m³: las clases de aquí son ese umbral y los cuatro objetivos intermedios con los que la OMS mide quién se está acercando.',
      classLabels: [
        'dentro de la guía OMS (5)',
        '5 – 10 (objetivo 4)',
        '10 – 15 (objetivo 3)',
        '15 – 25 (objetivo 2)',
        '25 – 35 (objetivo 1)',
        'más de 35 µg/m³',
      ],
      format: (v, l) => `${decimal(v, l, 1)} µg/m³`,
    },
    airDeaths: {
      short: 'Muertes',
      title: 'Muertes atribuibles al aire',
      unit: 'defunciones por cada 100.000 habitantes, al año',
      blurb:
        'Aire de casa y aire de fuera juntos. Es la métrica que convierte la contaminación en algo que le pasa a las personas y no a la atmósfera: millones de muertes al año en el mundo, más que la malaria, la tuberculosis y el VIH sumados.',
      classLabels: [
        'menos de 10',
        '10 – 25',
        '25 – 50',
        '50 – 100',
        '100 – 150',
        'más de 150 por cada 100.000',
      ],
      format: (v, l) => `${decimal(v, l, 0)} por 100.000`,
    },
    waterStress: {
      short: 'Agua',
      title: 'Estrés hídrico',
      unit: '% del agua dulce disponible que se extrae',
      blurb:
        'Cuánta agua se toma frente a cuánta se regenera. Las clases son las del objetivo ONU 6.4.2: por encima del 100% un país está consumiendo agua fósil o agua que llega de fuera de sus fronteras, y eso no se sostiene.',
      classLabels: [
        'bajo (menos del 25%)',
        'medio (25 – 50%)',
        'alto (50 – 75%)',
        'muy alto (75 – 100%)',
        'crítico: extrae más de lo que se regenera',
      ],
      format: (v, l) => `${decimal(v, l, v < 10 ? 1 : 0)}%`,
    },
    plastic: {
      short: 'Plástico',
      title: 'Plástico mal gestionado',
      unit: 'kg por persona al año, fuera de cualquier instalación',
      blurb:
        'No cuánto plástico se consume: cuánto acaba fuera de vertederos e instalaciones, que es el que puede llegar al mar. Por eso este mapa no se parece al del CO₂ — depende de la recogida, no del consumo.',
      classLabels: ['menos de 1 kg', '1 – 3 kg', '3 – 6 kg', '6 – 10 kg', 'más de 10 kg por persona'],
      format: (v, l) => `${decimal(v, l, 1)} kg por persona`,
    },
    nitrogen: {
      short: 'Nitrógeno',
      title: 'Nitrógeno en los cultivos',
      unit: 'kg de fertilizante nitrogenado por hectárea cultivada',
      blurb:
        'El nitrógeno que las plantas no absorben acaba en los ríos y luego en el mar, donde alimenta algas que consumen el oxígeno y dejan zonas muertas. Es uno de los límites planetarios superados con más claridad.',
      classLabels: [
        'menos de 30 kg/ha',
        '30 – 60 kg/ha',
        '60 – 100 kg/ha',
        '100 – 150 kg/ha',
        'más de 150 kg/ha',
      ],
      format: (v, l) => `${decimal(v, l, 0)} kg/ha`,
    },
  },
};

export function getPollutionMetrics(locale: Locale): Metric[] {
  return POLLUTION_METRIC_IDS.map((id) => {
    const text = TEXT[locale][id];
    return {
      id,
      short: text.short,
      title: text.title,
      unit: text.unit,
      blurb: text.blurb,
      kind: 'sequential' as const,
      classes: SHAPES[id].map((c, i) => ({ ...c, label: text.classLabels[i] })),
      format: (value: number) => text.format(value, locale),
    };
  });
}

/**
 * Le proprietà della tabella entrano nelle feature già caricate.
 *
 * Torna una collezione **nuova**: la mappa riconosce il cambio di identità e
 * rifà `setData`, invece di dover essere avvisata a parte che i dati sotto le
 * sono cambiati sotto i piedi.
 */
export function mergeIntoCountries(
  countries: CountryEmissions,
  table: PollutionTable,
): CountryEmissions {
  return {
    ...countries,
    features: countries.features.map((f) => {
      const extra = table.countries[f.properties.iso];
      return extra ? { ...f, properties: { ...f.properties, ...extra } } : f;
    }),
  };
}

let pending: Promise<PollutionTable> | null = null;

/** 16 KB, chiesti solo da chi apre la scheda che li usa. */
export function loadPollution(): Promise<PollutionTable> {
  if (!pending) {
    pending = fetch(`${import.meta.env.BASE_URL}data/pollution-countries.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`pollution-countries.json: HTTP ${r.status}`);
        return r.json() as Promise<PollutionTable>;
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}
