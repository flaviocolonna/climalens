/**
 * Chi può permettersi di reggerlo.
 *
 * La mappa risponde già a «chi lo subisce» (le anomalie) e «chi lo causa» (le
 * emissioni). Questa è la terza domanda, ed è quella che chiude l'argomento:
 * fra chi subisce di più e chi ha i mezzi per adattarsi non c'è quasi
 * sovrapposizione.
 *
 * Fonte: ND-GAIN Country Index. Attenzione al **verso**: l'indice complessivo
 * e la prontezza sono "più alto = meglio", la vulnerabilità è "più alto =
 * peggio". La rampa rossa del progetto dice «più scuro = peggio», quindi due
 * delle tre metriche hanno le classi in ordine invertito — è dichiarato qui e
 * non lasciato al caso, perché una mappa con il verso sbagliato mente senza
 * che nessuno se ne accorga.
 */
import type { Locale } from '@/i18n/locale';
import { LOCALE_TAG } from '@/i18n/locale';
import {
  SEQUENTIAL,
  type CountryEmissions,
  type Metric,
  type MetricClass,
} from '@/lib/countryEmissions';

export type AdaptationMetricId = 'gain' | 'vulnerability' | 'readiness';

export const ADAPTATION_METRIC_IDS: AdaptationMetricId[] = ['gain', 'vulnerability', 'readiness'];

export interface AdaptationTable {
  meta: {
    source: string;
    sourceUrl: string;
    generatedAt: string;
    years: Record<AdaptationMetricId, number>;
    coverage: Record<AdaptationMetricId, number>;
    countries: number;
  };
  countries: Record<string, Partial<Record<AdaptationMetricId, number>>>;
}

/** Dal peggio al meglio: la rampa scura sta sempre dalla parte del peggio. */
const WORST_FIRST = [...SEQUENTIAL].reverse();

const SHAPES: Record<AdaptationMetricId, MetricClass[]> = {
  // Indice complessivo 0-100, più alto = meglio: le classi partono dal fondo,
  // quindi il colore più scuro va al valore più basso.
  gain: [
    { from: -Infinity, color: WORST_FIRST[0], label: '' },
    { from: 30, color: WORST_FIRST[1], label: '' },
    { from: 40, color: WORST_FIRST[2], label: '' },
    { from: 50, color: WORST_FIRST[3], label: '' },
    { from: 60, color: WORST_FIRST[4], label: '' },
    { from: 70, color: WORST_FIRST[5], label: '' },
  ],
  // Vulnerabilità 0-1, più alto = peggio: verso normale.
  vulnerability: [
    { from: -Infinity, color: SEQUENTIAL[0], label: '' },
    { from: 0.3, color: SEQUENTIAL[1], label: '' },
    { from: 0.35, color: SEQUENTIAL[2], label: '' },
    { from: 0.4, color: SEQUENTIAL[3], label: '' },
    { from: 0.45, color: SEQUENTIAL[4], label: '' },
    { from: 0.55, color: SEQUENTIAL[5], label: '' },
  ],
  // Prontezza 0-1, più alto = meglio: verso invertito come l'indice.
  readiness: [
    { from: -Infinity, color: WORST_FIRST[0], label: '' },
    { from: 0.25, color: WORST_FIRST[1], label: '' },
    { from: 0.35, color: WORST_FIRST[2], label: '' },
    { from: 0.45, color: WORST_FIRST[3], label: '' },
    { from: 0.55, color: WORST_FIRST[4], label: '' },
    { from: 0.65, color: WORST_FIRST[5], label: '' },
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

const dec = (v: number, locale: Locale, digits: number) =>
  v.toLocaleString(LOCALE_TAG[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const TEXT: Record<Locale, Record<AdaptationMetricId, MetricText>> = {
  it: {
    gain: {
      short: 'Indice',
      title: 'Quanto un paese regge il clima che cambia',
      unit: 'indice ND-GAIN, 0-100: più alto è meglio',
      blurb:
        'Mette insieme quanto un paese è esposto e quanto è attrezzato per adattarsi. Confrontala con la mappa di chi causa le emissioni: le due quasi non si sovrappongono, ed è tutto l’argomento della giustizia climatica in due click.',
      classLabels: [
        'sotto 30 — i più in difficoltà',
        '30 – 40',
        '40 – 50',
        '50 – 60',
        '60 – 70',
        'oltre 70 — i più attrezzati',
      ],
      format: (v, l) => `${dec(v, l, 1)} / 100`,
    },
    vulnerability: {
      short: 'Vulnerabilità',
      title: 'Quanto un paese è esposto',
      unit: 'indice 0-1: più alto è peggio',
      blurb:
        'Esposizione ai danni, sensibilità dei settori chiave — cibo, acqua, salute, infrastrutture — e capacità di assorbire il colpo. È la metà del problema che non dipende dai soldi.',
      classLabels: [
        'sotto 0,30 — meno esposti',
        '0,30 – 0,35',
        '0,35 – 0,40',
        '0,40 – 0,45',
        '0,45 – 0,55',
        'oltre 0,55 — più esposti',
      ],
      format: (v, l) => dec(v, l, 3),
    },
    readiness: {
      short: 'Prontezza',
      title: 'Quanto un paese è pronto a investire',
      unit: 'indice 0-1: più alto è meglio',
      blurb:
        'Condizioni economiche, qualità della governance e coesione sociale: quanto un paese riesce a trasformare i soldi dell’adattamento in opere che funzionano. È la metà del problema che dipende dai soldi — e dalle istituzioni.',
      classLabels: [
        'sotto 0,25 — meno pronti',
        '0,25 – 0,35',
        '0,35 – 0,45',
        '0,45 – 0,55',
        '0,55 – 0,65',
        'oltre 0,65 — più pronti',
      ],
      format: (v, l) => dec(v, l, 3),
    },
  },
  en: {
    gain: {
      short: 'Index',
      title: 'How well a country copes with a changing climate',
      unit: 'ND-GAIN index, 0-100: higher is better',
      blurb:
        "Combines how exposed a country is with how equipped it is to adapt. Compare it with the map of who causes the emissions: the two barely overlap, and that is the whole climate-justice argument in two clicks.",
      classLabels: [
        'under 30 — struggling most',
        '30 – 40',
        '40 – 50',
        '50 – 60',
        '60 – 70',
        'over 70 — best equipped',
      ],
      format: (v, l) => `${dec(v, l, 1)} / 100`,
    },
    vulnerability: {
      short: 'Vulnerability',
      title: 'How exposed a country is',
      unit: 'index 0-1: higher is worse',
      blurb:
        'Exposure to harm, sensitivity of the key sectors — food, water, health, infrastructure — and the capacity to absorb the blow. It is the half of the problem that money does not fix.',
      classLabels: [
        'under 0.30 — least exposed',
        '0.30 – 0.35',
        '0.35 – 0.40',
        '0.40 – 0.45',
        '0.45 – 0.55',
        'over 0.55 — most exposed',
      ],
      format: (v, l) => dec(v, l, 3),
    },
    readiness: {
      short: 'Readiness',
      title: 'How ready a country is to invest',
      unit: 'index 0-1: higher is better',
      blurb:
        'Economic conditions, quality of governance and social cohesion: how well a country turns adaptation money into things that work. It is the half of the problem that does depend on money — and on institutions.',
      classLabels: [
        'under 0.25 — least ready',
        '0.25 – 0.35',
        '0.35 – 0.45',
        '0.45 – 0.55',
        '0.55 – 0.65',
        'over 0.65 — most ready',
      ],
      format: (v, l) => dec(v, l, 3),
    },
  },
  es: {
    gain: {
      short: 'Índice',
      title: 'Cuánto aguanta un país el clima que cambia',
      unit: 'índice ND-GAIN, 0-100: más alto es mejor',
      blurb:
        'Combina cuán expuesto está un país con cuán preparado está para adaptarse. Compárala con el mapa de quién causa las emisiones: apenas se solapan, y ahí está todo el argumento de la justicia climática en dos clics.',
      classLabels: [
        'menos de 30 — los que peor están',
        '30 – 40',
        '40 – 50',
        '50 – 60',
        '60 – 70',
        'más de 70 — los mejor equipados',
      ],
      format: (v, l) => `${dec(v, l, 1)} / 100`,
    },
    vulnerability: {
      short: 'Vulnerabilidad',
      title: 'Cuán expuesto está un país',
      unit: 'índice 0-1: más alto es peor',
      blurb:
        'Exposición al daño, sensibilidad de los sectores clave — comida, agua, salud, infraestructuras — y capacidad de absorber el golpe. Es la mitad del problema que el dinero no arregla.',
      classLabels: [
        'menos de 0,30 — menos expuestos',
        '0,30 – 0,35',
        '0,35 – 0,40',
        '0,40 – 0,45',
        '0,45 – 0,55',
        'más de 0,55 — más expuestos',
      ],
      format: (v, l) => dec(v, l, 3),
    },
    readiness: {
      short: 'Preparación',
      title: 'Cuán preparado está un país para invertir',
      unit: 'índice 0-1: más alto es mejor',
      blurb:
        'Condiciones económicas, calidad de la gobernanza y cohesión social: cuánto logra un país convertir el dinero de la adaptación en obras que funcionan. Es la mitad del problema que sí depende del dinero — y de las instituciones.',
      classLabels: [
        'menos de 0,25 — menos preparados',
        '0,25 – 0,35',
        '0,35 – 0,45',
        '0,45 – 0,55',
        '0,55 – 0,65',
        'más de 0,65 — más preparados',
      ],
      format: (v, l) => dec(v, l, 3),
    },
  },
};

export function getAdaptationMetrics(locale: Locale): Metric[] {
  return ADAPTATION_METRIC_IDS.map((id) => {
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

export function mergeAdaptation(
  countries: CountryEmissions,
  table: AdaptationTable,
): CountryEmissions {
  return {
    ...countries,
    features: countries.features.map((f) => {
      const extra = table.countries[f.properties.iso];
      return extra ? { ...f, properties: { ...f.properties, ...extra } } : f;
    }),
  };
}

let pending: Promise<AdaptationTable> | null = null;

export function loadAdaptation(): Promise<AdaptationTable> {
  if (!pending) {
    pending = fetch(`${import.meta.env.BASE_URL}data/adaptation-countries.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`adaptation-countries.json: HTTP ${r.status}`);
        return r.json() as Promise<AdaptationTable>;
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}
