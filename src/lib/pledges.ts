/**
 * Promesse contro traiettoria.
 *
 * È la quarta domanda della mappa, e l'unica che si muove nel tempo: non chi
 * emette, chi subisce o chi regge, ma **se un paese sta facendo quello che ha
 * detto**. Ha bisogno di tre metriche perché nessuna delle tre da sola
 * significa qualcosa:
 *
 *   `pledge`  quanto è vincolante l'impegno — una promessa, non un risultato
 *   `trend`   cosa hanno fatto le emissioni negli ultimi dieci anni
 *   `gap`     la distanza fra i due, in punti percentuali all'anno
 *
 * La prima da sola premierebbe chi scrive bene le leggi; la seconda da sola
 * premierebbe chi è in recessione. È il confronto a dire qualcosa, e i testi
 * delle prime due rimandano esplicitamente alla terza per non essere lette
 * come un voto.
 *
 * Il `gap` è calcolato in scripts/build-pledges-data.mjs sotto un'ipotesi
 * dichiarata (discesa lineare fino a zero) e **non esiste** per i paesi il cui
 * obiettivo cade troppo vicino: la fonte mescola net zero e riduzioni parziali,
 * e un 2030 trattato come azzeramento darebbe un divario enorme e falso. Quei
 * paesi restano grigi, che è il modo onesto di dire "questo conto qui non si
 * può fare".
 */
import type { Locale } from '@/i18n/locale';
import { LOCALE_TAG } from '@/i18n/locale';
import {
  SEQUENTIAL,
  type CountryEmissions,
  type Metric,
  type MetricClass,
} from '@/lib/countryEmissions';

export type PledgeMetricId = 'pledge' | 'trend' | 'gap';

export const PLEDGE_METRIC_IDS: PledgeMetricId[] = ['pledge', 'trend', 'gap'];

/** Il valore che viaggia con le metriche ma non si dipinge: l'anno promesso. */
export interface PledgeRow {
  pledge: number;
  trend?: number;
  gap?: number;
  target?: number;
}

export interface PledgeTable {
  meta: {
    source: string;
    sourceUrl: string;
    trajectorySource: string;
    /** Il divario le combina entrambe, e la riga della fonte deve dirlo. */
    combinedSource: string;
    trajectorySourceUrl: string;
    generatedAt: string;
    /** La scala dell'impegno in inglese: l'identità dei gradini, non l'etichetta. */
    ladder: string[];
    years: Record<PledgeMetricId, number>;
    trendFrom: number;
    trendYears: number;
    minHorizon: number;
    coverage: Record<PledgeMetricId, number>;
    countries: number;
  };
  countries: Record<string, PledgeRow>;
}

/** Dal peggio al meglio: la rampa scura sta sempre dalla parte del peggio. */
const WORST_FIRST = [...SEQUENTIAL].reverse();

/**
 * Fuori rampa, come per l'assorbimento netto nel layer delle emissioni: un
 * paese già al passo non è "poco in ritardo", è dall'altra parte dello zero.
 */
const ON_TRACK = '#308e63';

/** Due versi opposti attorno allo zero, la stessa scala di `net`. */
const DIVERGING = {
  strongFall: '#007976',
  softFall: '#6cb7b4',
  flat: '#4f565e',
  softRise: '#dc8c81',
  strongRise: '#be3029',
};

/** Quantità a tinta unica, o due versi opposti attorno allo zero. */
const KIND: Record<PledgeMetricId, Metric['kind']> = {
  pledge: 'sequential',
  trend: 'diverging',
  // Sequenziale come `pc`, che ha lo stesso impianto: una rampa sola più un
  // colore fuori scala per chi sta dall'altra parte dello zero.
  gap: 'sequential',
};

const SHAPES: Record<PledgeMetricId, MetricClass[]> = {
  // Ordinale 0-6, più alto = impegno più forte: verso invertito, come le due
  // metriche "più alto è meglio" dell'adattamento. Gli ultimi due gradini
  // della scala — raggiunto e dichiarato, raggiunto e verificato — cadono
  // nella stessa classe: sono tre paesi in tutto, e due colori quasi uguali
  // per tre poligoni sarebbero una distinzione che nessuno può leggere.
  pledge: [
    { from: -Infinity, color: WORST_FIRST[0], label: '' },
    { from: 1, color: WORST_FIRST[1], label: '' },
    { from: 2, color: WORST_FIRST[2], label: '' },
    { from: 3, color: WORST_FIRST[3], label: '' },
    { from: 4, color: WORST_FIRST[4], label: '' },
    { from: 5, color: WORST_FIRST[5], label: '' },
  ],
  // Variazione percentuale su dieci anni: qui non c'è un "peggio" a tinta
  // unica, ci sono due direzioni, e lo zero è il fatto.
  trend: [
    { from: -Infinity, color: DIVERGING.strongFall, label: '' },
    { from: -20, color: DIVERGING.softFall, label: '' },
    { from: -5, color: DIVERGING.flat, label: '' },
    { from: 5, color: DIVERGING.softRise, label: '' },
    { from: 25, color: DIVERGING.strongRise, label: '' },
  ],
  // Punti percentuali all'anno di ritardo. Otto paesi su 148 stanno sotto lo
  // zero: una divergente sprecherebbe metà rampa su un ramo quasi vuoto, e
  // sotto sta la stessa forma di `pc` — un colore fuori scala per il verso
  // opposto, la rampa rossa per tutto il resto.
  gap: [
    { from: -Infinity, color: ON_TRACK, label: '' },
    { from: 0, color: SEQUENTIAL[0], label: '' },
    { from: 2, color: SEQUENTIAL[1], label: '' },
    { from: 4, color: SEQUENTIAL[2], label: '' },
    { from: 6, color: SEQUENTIAL[3], label: '' },
    { from: 8, color: SEQUENTIAL[4], label: '' },
    { from: 12, color: SEQUENTIAL[5], label: '' },
  ],
};

interface MetricText {
  short: string;
  title: string;
  unit: string;
  blurb: string;
  classLabels: string[];
  /** Un gradino per voce della scala della fonte, nello stesso ordine. */
  ladder: string[];
  format: (value: number, locale: Locale) => string;
  /** La riga in più del popup: quello che il colore non può dire. */
  detail: (row: PledgeRow, locale: Locale) => string | null;
}

const dec = (v: number, locale: Locale, digits = 1) =>
  v.toLocaleString(LOCALE_TAG[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

/** Segno esplicito e meno tipografico: `-13.6` in un popup si legge come un trattino. */
const signed = (v: number, locale: Locale) =>
  `${v > 0 ? '+' : v < 0 ? '−' : ''}${dec(Math.abs(v), locale)}`;

const TEXT: Record<Locale, Record<PledgeMetricId, MetricText>> = {
  it: {
    pledge: {
      short: 'Impegno',
      title: 'Quanto è vincolante la promessa',
      unit: 'dalla nessuna promessa alla legge dello stato',
      blurb:
        'Quasi tutti hanno un obiettivo, ma "scritto in una legge" e "annunciato a una conferenza" non sono la stessa cosa. Questa mappa dice solo cosa è stato detto. Per cosa è stato fatto c’è la scheda accanto.',
      classLabels: [
        'nessun obiettivo',
        'proposto, in discussione',
        'dichiarazione o impegno',
        'in un documento di indirizzo',
        'scritto in una legge',
        'dichiarato raggiunto',
      ],
      ladder: [
        'nessun obiettivo',
        'proposto, in discussione',
        'dichiarazione o impegno',
        'in un documento di indirizzo',
        'scritto in una legge',
        'raggiunto (autodichiarato)',
        'raggiunto (verificato)',
      ],
      format: (v, l) => TEXT[l].pledge.ladder[Math.round(v)] ?? '—',
      detail: (row) => (row.target ? `obiettivo: ${row.target}` : null),
    },
    trend: {
      short: 'Traiettoria',
      title: 'Cosa hanno fatto davvero le emissioni',
      unit: 'variazione della CO₂ fossile negli ultimi dieci anni',
      blurb:
        'Il contrario della promessa: nessuna intenzione, solo la differenza fra due anni. Verde-azzurro scende, rosso sale. Attenzione a leggerla da sola — un calo può essere una politica riuscita o un’economia in crisi, ed è il divario a distinguerle.',
      classLabels: [
        'in calo di oltre il 20%',
        'in calo del 5 – 20%',
        'quasi ferme (±5%)',
        'in aumento del 5 – 25%',
        'in aumento di oltre il 25%',
      ],
      ladder: [],
      format: (v, l) => `${signed(v, l)}% in dieci anni`,
      detail: (row) => (row.target ? `obiettivo: ${row.target}` : null),
    },
    gap: {
      short: 'Divario',
      title: 'Al ritmo di adesso, ci arriva?',
      unit: 'punti percentuali all’anno fra il taglio richiesto e quello in corso',
      blurb:
        'Quanto deve accelerare un paese per rispettare il suo obiettivo, alla sua data, partendo dal ritmo che tiene oggi. Non è un giudizio esterno: è la sua promessa messa accanto alla sua traiettoria. Grigio dove il conto non si può fare.',
      classLabels: [
        'il ritmo attuale basterebbe',
        'meno di 2 punti l’anno',
        '2 – 4 punti',
        '4 – 6 punti',
        '6 – 8 punti',
        '8 – 12 punti',
        'oltre 12 punti',
      ],
      ladder: [],
      format: (v, l) =>
        v <= 0 ? 'al ritmo giusto' : `${dec(v, l)} punti all’anno da recuperare`,
      detail: (row, l) =>
        row.target && row.trend !== undefined
          ? `obiettivo ${row.target} · finora ${signed(row.trend, l)}%`
          : null,
    },
  },
  en: {
    pledge: {
      short: 'Pledge',
      title: 'How binding the promise is',
      unit: 'from no promise at all to an act of parliament',
      blurb:
        'Almost everyone has a target, but "written into law" and "announced at a conference" are not the same thing. This map shows only what was said. For what was done, see the tab next to it.',
      classLabels: [
        'no target',
        'proposed, under discussion',
        'declaration or pledge',
        'in a policy document',
        'written into law',
        'declared achieved',
      ],
      ladder: [
        'no target',
        'proposed, under discussion',
        'declaration or pledge',
        'in a policy document',
        'written into law',
        'achieved (self-declared)',
        'achieved (externally validated)',
      ],
      format: (v, l) => TEXT[l].pledge.ladder[Math.round(v)] ?? '—',
      detail: (row) => (row.target ? `target: ${row.target}` : null),
    },
    trend: {
      short: 'Trajectory',
      title: 'What the emissions actually did',
      unit: 'change in fossil CO₂ over the past ten years',
      blurb:
        'The opposite of a promise: no intentions, just the difference between two years. Teal is falling, red is rising. Careful reading it alone — a fall can be a policy working or an economy collapsing, and it is the gap that tells them apart.',
      classLabels: [
        'down by more than 20%',
        'down 5 – 20%',
        'roughly flat (±5%)',
        'up 5 – 25%',
        'up by more than 25%',
      ],
      ladder: [],
      format: (v, l) => `${signed(v, l)}% in ten years`,
      detail: (row) => (row.target ? `target: ${row.target}` : null),
    },
    gap: {
      short: 'Gap',
      title: 'At this pace, does it get there?',
      unit: 'percentage points a year between the cut required and the cut under way',
      blurb:
        'How much faster a country has to go to meet its own target, by its own date, starting from the pace it is keeping today. Not an outside verdict: its promise set beside its trajectory. Grey where the sum cannot be done.',
      classLabels: [
        'the current pace would do',
        'under 2 points a year',
        '2 – 4 points',
        '4 – 6 points',
        '6 – 8 points',
        '8 – 12 points',
        'over 12 points',
      ],
      ladder: [],
      format: (v, l) => (v <= 0 ? 'on track' : `${dec(v, l)} points a year to make up`),
      detail: (row, l) =>
        row.target && row.trend !== undefined
          ? `target ${row.target} · so far ${signed(row.trend, l)}%`
          : null,
    },
  },
  es: {
    pledge: {
      short: 'Compromiso',
      title: 'Cuán vinculante es la promesa',
      unit: 'desde ninguna promesa hasta una ley del estado',
      blurb:
        'Casi todos tienen un objetivo, pero "escrito en una ley" y "anunciado en una conferencia" no son lo mismo. Este mapa dice solo lo que se ha dicho. Para lo que se ha hecho está la pestaña de al lado.',
      classLabels: [
        'sin objetivo',
        'propuesto, en discusión',
        'declaración o compromiso',
        'en un documento de política',
        'escrito en una ley',
        'declarado alcanzado',
      ],
      ladder: [
        'sin objetivo',
        'propuesto, en discusión',
        'declaración o compromiso',
        'en un documento de política',
        'escrito en una ley',
        'alcanzado (autodeclarado)',
        'alcanzado (verificado)',
      ],
      format: (v, l) => TEXT[l].pledge.ladder[Math.round(v)] ?? '—',
      detail: (row) => (row.target ? `objetivo: ${row.target}` : null),
    },
    trend: {
      short: 'Trayectoria',
      title: 'Qué hicieron de verdad las emisiones',
      unit: 'variación del CO₂ fósil en los últimos diez años',
      blurb:
        'Lo contrario de la promesa: ninguna intención, solo la diferencia entre dos años. Verde azulado baja, rojo sube. Cuidado al leerla sola — una caída puede ser una política que funciona o una economía en crisis, y es la brecha la que las distingue.',
      classLabels: [
        'bajan más del 20%',
        'bajan un 5 – 20%',
        'casi planas (±5%)',
        'suben un 5 – 25%',
        'suben más del 25%',
      ],
      ladder: [],
      format: (v, l) => `${signed(v, l)}% en diez años`,
      detail: (row) => (row.target ? `objetivo: ${row.target}` : null),
    },
    gap: {
      short: 'Brecha',
      title: 'Al ritmo de ahora, ¿llega?',
      unit: 'puntos porcentuales al año entre el recorte exigido y el que está en marcha',
      blurb:
        'Cuánto tiene que acelerar un país para cumplir su objetivo, en su fecha, partiendo del ritmo que lleva hoy. No es un veredicto externo: es su promesa puesta junto a su trayectoria. Gris donde la cuenta no se puede hacer.',
      classLabels: [
        'el ritmo actual bastaría',
        'menos de 2 puntos al año',
        '2 – 4 puntos',
        '4 – 6 puntos',
        '6 – 8 puntos',
        '8 – 12 puntos',
        'más de 12 puntos',
      ],
      ladder: [],
      format: (v, l) => (v <= 0 ? 'a buen ritmo' : `${dec(v, l)} puntos al año por recuperar`),
      detail: (row, l) =>
        row.target && row.trend !== undefined
          ? `objetivo ${row.target} · hasta ahora ${signed(row.trend, l)}%`
          : null,
    },
  },
};

export function getPledgeMetrics(locale: Locale): Metric[] {
  return PLEDGE_METRIC_IDS.map((id) => {
    const text = TEXT[locale][id];
    return {
      id,
      short: text.short,
      title: text.title,
      unit: text.unit,
      blurb: text.blurb,
      kind: KIND[id],
      classes: SHAPES[id].map((c, i) => ({ ...c, label: text.classLabels[i] })),
      format: (value: number) => text.format(value, locale),
      detail: (row: Record<string, unknown>) => text.detail(row as unknown as PledgeRow, locale),
    };
  });
}

export function mergePledges(countries: CountryEmissions, table: PledgeTable): CountryEmissions {
  return {
    ...countries,
    features: countries.features.map((f) => {
      const extra = table.countries[f.properties.iso];
      return extra ? { ...f, properties: { ...f.properties, ...extra } } : f;
    }),
  };
}

let pending: Promise<PledgeTable> | null = null;

export function loadPledges(): Promise<PledgeTable> {
  if (!pending) {
    pending = fetch(`${import.meta.env.BASE_URL}data/pledges-countries.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`pledges-countries.json: HTTP ${r.status}`);
        return r.json() as Promise<PledgeTable>;
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}
