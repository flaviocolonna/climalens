/**
 * Il rovescio della mappa: non chi subisce il riscaldamento, ma chi lo causa.
 *
 * Il file è prodotto da scripts/build-emissions-data.mjs unendo i dati Global
 * Carbon Budget (via Our World in Data) alle forme Natural Earth 1:110m.
 * Viene caricato su richiesta — quando si accende il layer, o quando si apre
 * il pannello di un luogo, che dalle stesse forme ricava a quale paese
 * attribuire il punto. Sono 210 KB: chi guarda solo la mappa delle anomalie
 * non li scarica.
 */
import { LOCALE_TAG, type Locale } from '@/i18n/locale';

export type MetricId = 'pc' | 'cum' | 'net';

/** I gruppi di dati del file: ognuno con il suo anno di riferimento. */
export type GroupId = MetricId | 'warm' | 'mix' | 'ghg';

/**
 * Il taglio fossile delle emissioni di un anno, in Mt di CO₂.
 * `land` sta a parte perché non è un combustibile e perché può essere
 * **negativo**: dove i boschi ricrescono, il paese assorbe invece di emettere.
 */
export interface SourceSplit {
  coal?: number;
  oil?: number;
  gas?: number;
  cement?: number;
  flaring?: number;
  industry?: number;
  land?: number;
}

export interface CountryProps {
  iso: string;
  /** Codice a due lettere: è quello che parla la stessa lingua del geocoder. */
  iso2?: string;
  /** Nome del paese, in italiano / inglese / spagnolo — vedi scripts/build-emissions-data.mjs. */
  name: Record<Locale, string>;
  /** t CO₂ pro capite, uso del suolo incluso. */
  pc?: number;
  /** % delle emissioni cumulate mondiali dal 1750. */
  cum?: number;
  /** t pro capite: consumi meno produzione. Positivo = importatore netto. */
  net?: number;
  /** °C di riscaldamento globale attribuibili ai gas serra emessi qui. */
  tmp?: number;
  /** ...e la stessa cosa come quota del riscaldamento attribuito, in %. */
  tmpShare?: number;
  /** Mt di CO₂ fossile in un anno. */
  co2?: number;
  /** % della CO₂ mondiale di quell'anno, uso del suolo incluso. */
  shr?: number;
  /** t pro capite di sola CO₂ fossile: è questa che l'identità energetica divide. */
  pcFossil?: number;
  pop?: number;
  /** kWh di energia primaria a testa, in un anno. */
  energyPc?: number;
  /** Mt CO₂e di tutti i gas serra, uso del suolo incluso. */
  ghg?: number;
  /** Mt CO₂e di metano. */
  ch4?: number;
  /** Mt CO₂e di protossido d'azoto. */
  n2o?: number;
  src?: SourceSplit;
}

/** Il mondo agli stessi anni di riferimento: il denominatore di ogni "× la media". */
export type WorldReference = Omit<CountryProps, 'iso' | 'name'>;

export interface CountryEmissions {
  type: 'FeatureCollection';
  meta: {
    source: string;
    sourceUrl: string;
    /** Fonte della sola attribuzione in °C, che ha un autore diverso. */
    attribution: string;
    attributionUrl: string;
    shapes: string;
    generatedAt: string;
    years: Record<GroupId, number>;
    coverage: Record<MetricId | 'tmp' | 'src' | 'energyPc' | 'ghg' | 'iso2', number>;
    world: WorldReference;
    countries: number;
  };
  features: Array<{
    type: 'Feature';
    properties: CountryProps;
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  }>;
}

/** Paesi senza dato: visibili come sagoma, mai colorati come uno zero. */
export const NO_DATA_COLOR = 'rgba(148, 163, 184, 0.10)';
export const BORDER_COLOR = 'rgba(226, 232, 240, 0.22)';

export interface MetricClass {
  /** Estremo inferiore incluso; il primo vale da -∞. */
  from: number;
  color: string;
  label: string;
}

export interface Metric {
  /**
   * Anche il nome della proprietà da leggere sulla feature: l'espressione di
   * riempimento fa `['get', metric.id]`. È una stringa e non `MetricId` perché
   * la stessa forma serve alle metriche di src/lib/pollution.ts, che stanno in
   * un'altra famiglia ma si disegnano allo stesso modo.
   */
  id: string;
  /** Etichetta del selettore, corta per stare in un chip. */
  short: string;
  title: string;
  unit: string;
  blurb: string;
  /** Sequenziale = quantità; divergente = due versi opposti attorno allo zero. */
  kind: 'sequential' | 'diverging';
  /** In ordine crescente. */
  classes: MetricClass[];
  format: (value: number) => string;
  /**
   * Una riga in più nel popup, per le metriche in cui il valore dipinto non è
   * tutta la storia: l'anno che un paese si è dato non si può colorare, ma
   * senza di lui «scritto in una legge» non dice quasi niente. Riceve tutte le
   * proprietà della feature, non solo il valore. Opzionale: la stragrande
   * maggioranza delle metriche si esaurisce nel numero che mostra.
   */
  detail?: (props: Record<string, unknown>) => string | null;
}

const oneDecimal = (v: number, locale: Locale) =>
  v.toLocaleString(LOCALE_TAG[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Rampa sequenziale a tinta unica (rossa), dal chiaro al scuro: **più scuro =
 * più emissioni**, la convenzione che chiunque abbia visto una mappa si aspetta.
 *
 * Il costo è che su una basemap scura il valore alto è anche il meno luminoso.
 * Due cose lo tengono leggibile: il passo più scuro si ferma dove il contrasto
 * sul fondo regge ancora (2,3:1, verificato, non a occhio) e ogni paese ha il
 * suo contorno chiaro, così un riempimento scuro legge come pieno e non come
 * buco. L'alfa resta costante su tutte le classi: farla crescere col valore
 * annullerebbe esattamente la rampa di luminosità che porta l'informazione.
 */
export const SEQUENTIAL = ['#e9b6af', '#e59489', '#df7064', '#d44a40', '#bf2621', '#9e1614'];

/** Fuori rampa: un valore negativo non è "poco rosso", è il verso opposto. */
const ABSORBS = '#308e63';

/**
 * Rampa divergente rosso↔verde-azzurro, neutro grigio al centro.
 *
 * Qui "più scuro = peggio" non si applica: non c'è un peggio, ci sono due
 * versi. Vale la regola parallela — **più scuro = più lontano da zero** — su
 * entrambe le braccia, con il grigio del centro che arretra perché "in pari"
 * non è una notizia. Il rosso resta dalla parte di chi importa: è il paese la
 * cui impronta vera è più grande del suo numero territoriale.
 *
 * Il grigio centrale sta sotto il 3:1 sulla basemap: la legenda scrive per
 * esteso ogni classe e il popup stampa il numero, che è il rimedio previsto.
 */
const DIVERGING = {
  strongNeg: '#007976',
  softNeg: '#6cb7b4',
  neutral: '#4f565e',
  softPos: '#dc8c81',
  strongPos: '#be3029',
};

/**
 * Gli stessi due estremi della rampa `net`, per chi disegna import/export
 * altrove (la scomposizione per settore in AreaEmissions) e vuole restare
 * nella stessa lingua visiva invece di inventare una tinta nuova.
 */
export const NET_IMPORT_COLOR = DIVERGING.strongPos;
export const NET_EXPORT_COLOR = DIVERGING.strongNeg;

/** id → soglie e colori, locale-neutri: le etichette leggibili sono in METRIC_TEXT. */
const METRIC_SHAPE: Record<MetricId, { kind: Metric['kind']; classes: Array<{ from: number; color: string }> }> = {
  pc: {
    kind: 'sequential',
    classes: [
      { from: -Infinity, color: ABSORBS },
      { from: 0, color: SEQUENTIAL[0] },
      { from: 1, color: SEQUENTIAL[1] },
      { from: 2.5, color: SEQUENTIAL[2] },
      { from: 5, color: SEQUENTIAL[3] },
      { from: 10, color: SEQUENTIAL[4] },
      { from: 15, color: SEQUENTIAL[5] },
    ],
  },
  cum: {
    kind: 'sequential',
    classes: [
      { from: -Infinity, color: SEQUENTIAL[0] },
      { from: 0.1, color: SEQUENTIAL[1] },
      { from: 0.5, color: SEQUENTIAL[2] },
      { from: 2, color: SEQUENTIAL[3] },
      { from: 5, color: SEQUENTIAL[4] },
      { from: 15, color: SEQUENTIAL[5] },
    ],
  },
  net: {
    kind: 'diverging',
    classes: [
      { from: -Infinity, color: DIVERGING.strongNeg },
      { from: -2, color: DIVERGING.softNeg },
      { from: -0.5, color: DIVERGING.neutral },
      { from: 0.5, color: DIVERGING.softPos },
      { from: 2, color: DIVERGING.strongPos },
    ],
  },
};

interface MetricText {
  short: string;
  title: string;
  unit: string;
  blurb: string;
  /** Stesso ordine di METRIC_SHAPE[id].classes. */
  classLabels: string[];
  format: (value: number, locale: Locale) => string;
}

const METRIC_TEXT: Record<Locale, Record<MetricId, MetricText>> = {
  it: {
    pc: {
      short: 'Pro capite',
      title: 'CO₂ pro capite',
      unit: 'tonnellate a testa, in un anno',
      blurb:
        'Le emissioni del paese divise per i suoi abitanti, uso del suolo incluso. È la domanda "quanto pesa una persona di qui".',
      classLabels: [
        'assorbe più di quanto emette',
        'meno di 1 t',
        '1 – 2,5 t',
        '2,5 – 5 t',
        '5 – 10 t',
        '10 – 15 t',
        'oltre 15 t',
      ],
      format: (v, locale) => `${oneDecimal(v, locale)} t a testa`,
    },
    cum: {
      short: 'Storiche',
      title: 'Quota delle emissioni storiche',
      unit: '% di tutta la CO₂ emessa dal 1750',
      blurb:
        'La CO₂ resta in atmosfera per secoli: il riscaldamento di oggi lo ha caricato chi ha bruciato per primo, non chi brucia adesso.',
      classLabels: ['meno dello 0,1%', '0,1 – 0,5%', '0,5 – 2%', '2 – 5%', '5 – 15%', 'oltre il 15%'],
      format: (v, locale) =>
        `${v.toLocaleString(LOCALE_TAG[locale], { minimumFractionDigits: v < 1 ? 2 : 1, maximumFractionDigits: 2 })}%`,
    },
    net: {
      short: 'Import/export',
      title: 'Emissioni comprate e vendute',
      unit: 'tonnellate a testa: consumi meno produzione',
      blurb:
        'Chi compra una maglietta fatta altrove ne compra anche le emissioni. Rosso: il paese consuma più di quanto emette, e la differenza è arrivata dentro le merci. Verde-azzurro: produce per gli altri.',
      classLabels: ['esporta oltre 2 t', 'esporta 0,5 – 2 t', 'in pari (±0,5 t)', 'importa 0,5 – 2 t', 'importa oltre 2 t'],
      format: (v, locale) =>
        `${v > 0 ? '+' : v < 0 ? '−' : ''}${oneDecimal(Math.abs(v), locale)} t a testa`,
    },
  },
  en: {
    pc: {
      short: 'Per capita',
      title: 'CO₂ per capita',
      unit: 'tonnes per person, per year',
      blurb:
        "The country's emissions divided by its population, land use included. It's the question of how much one person here accounts for.",
      classLabels: [
        'absorbs more than it emits',
        'less than 1 t',
        '1 – 2.5 t',
        '2.5 – 5 t',
        '5 – 10 t',
        '10 – 15 t',
        'over 15 t',
      ],
      format: (v, locale) => `${oneDecimal(v, locale)} t per person`,
    },
    cum: {
      short: 'Historical',
      title: 'Share of historical emissions',
      unit: '% of all CO₂ emitted since 1750',
      blurb:
        "CO₂ stays in the atmosphere for centuries: today's warming was loaded by whoever burned first, not whoever burns now.",
      classLabels: ['less than 0.1%', '0.1 – 0.5%', '0.5 – 2%', '2 – 5%', '5 – 15%', 'over 15%'],
      format: (v, locale) =>
        `${v.toLocaleString(LOCALE_TAG[locale], { minimumFractionDigits: v < 1 ? 2 : 1, maximumFractionDigits: 2 })}%`,
    },
    net: {
      short: 'Imports/exports',
      title: 'Emissions bought and sold',
      unit: 'tonnes per person: consumption minus production',
      blurb:
        "Buying a T-shirt made elsewhere means buying its emissions too. Red: the country consumes more than it emits, and the difference arrived embedded in goods. Teal: it produces for others.",
      classLabels: ['exports over 2 t', 'exports 0.5 – 2 t', 'balanced (±0.5 t)', 'imports 0.5 – 2 t', 'imports over 2 t'],
      format: (v, locale) =>
        `${v > 0 ? '+' : v < 0 ? '−' : ''}${oneDecimal(Math.abs(v), locale)} t per person`,
    },
  },
  es: {
    pc: {
      short: 'Per cápita',
      title: 'CO₂ per cápita',
      unit: 'toneladas por persona, al año',
      blurb:
        'Las emisiones del país divididas entre sus habitantes, uso del suelo incluido. Es la pregunta de cuánto le corresponde a una persona de aquí.',
      classLabels: [
        'absorbe más de lo que emite',
        'menos de 1 t',
        '1 – 2,5 t',
        '2,5 – 5 t',
        '5 – 10 t',
        '10 – 15 t',
        'más de 15 t',
      ],
      format: (v, locale) => `${oneDecimal(v, locale)} t por persona`,
    },
    cum: {
      short: 'Históricas',
      title: 'Cuota de las emisiones históricas',
      unit: '% de todo el CO₂ emitido desde 1750',
      blurb:
        'El CO₂ permanece en la atmósfera durante siglos: el calentamiento de hoy lo cargó quien quemó primero, no quien quema ahora.',
      classLabels: ['menos del 0,1%', '0,1 – 0,5%', '0,5 – 2%', '2 – 5%', '5 – 15%', 'más del 15%'],
      format: (v, locale) =>
        `${v.toLocaleString(LOCALE_TAG[locale], { minimumFractionDigits: v < 1 ? 2 : 1, maximumFractionDigits: 2 })}%`,
    },
    net: {
      short: 'Importación/exportación',
      title: 'Emisiones compradas y vendidas',
      unit: 'toneladas por persona: consumo menos producción',
      blurb:
        'Quien compra una camiseta hecha en otro lugar también compra sus emisiones. Rojo: el país consume más de lo que emite, y la diferencia llegó dentro de los productos. Verde azulado: produce para otros.',
      classLabels: ['exporta más de 2 t', 'exporta 0,5 – 2 t', 'en equilibrio (±0,5 t)', 'importa 0,5 – 2 t', 'importa más de 2 t'],
      format: (v, locale) =>
        `${v > 0 ? '+' : v < 0 ? '−' : ''}${oneDecimal(Math.abs(v), locale)} t por persona`,
    },
  },
};

const METRIC_IDS: MetricId[] = ['pc', 'cum', 'net'];

/** Le metriche del layer per paese, con testo ed etichette nella lingua data. */
export function getMetrics(locale: Locale): Metric[] {
  return METRIC_IDS.map((id) => {
    const shape = METRIC_SHAPE[id];
    const text = METRIC_TEXT[locale][id];
    return {
      id,
      short: text.short,
      title: text.title,
      unit: text.unit,
      blurb: text.blurb,
      kind: shape.kind,
      classes: shape.classes.map((c, i) => ({ ...c, label: text.classLabels[i] })),
      format: (value: number) => text.format(value, locale),
    };
  });
}

export function metricById(id: MetricId, locale: Locale): Metric {
  const m = getMetrics(locale).find((x) => x.id === id);
  if (!m) throw new Error(`metrica sconosciuta: ${id}`);
  return m;
}

/**
 * Espressione MapLibre per il riempimento: una `step` sulle classi, protetta da
 * un `case` perché una proprietà assente non è uno zero.
 */
export function fillColorExpression(metric: Metric): unknown[] {
  const step: unknown[] = ['step', ['get', metric.id], metric.classes[0].color];
  for (const c of metric.classes.slice(1)) step.push(c.from, c.color);
  return ['case', ['has', metric.id], step, NO_DATA_COLOR];
}

let pending: Promise<CountryEmissions> | null = null;

/** Caricato una volta sola per sessione, alla prima accensione del layer. */
export function loadCountryEmissions(): Promise<CountryEmissions> {
  if (!pending) {
    pending = fetch(`${import.meta.env.BASE_URL}data/co2-countries.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`co2-countries.json: HTTP ${r.status}`);
        return r.json() as Promise<CountryEmissions>;
      })
      .catch((err) => {
        // Un errore in cache bloccherebbe anche i tentativi successivi.
        pending = null;
        throw err;
      });
  }
  return pending;
}
