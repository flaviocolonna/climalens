/**
 * Da tre numeri per paese a una risposta alla domanda "perché *tanto*".
 *
 * Il file dei paesi porta le emissioni di un anno già divise per sorgente e,
 * accanto, l'energia consumata a testa. Sono i due ingredienti dell'identità
 * che spiega quasi tutta la differenza fra un paese e l'altro:
 *
 *     CO₂ a testa  =  energia a testa  ×  CO₂ per unità di energia
 *
 * cioè *quanta* energia usa una persona di qui e *quanto è sporca*. Un paese
 * può stare sopra la media mondiale per il primo fattore (Norvegia), per il
 * secondo (Sudafrica) o per tutti e due (Qatar), e sono tre storie diverse che
 * un solo numero pro capite appiattisce in una.
 *
 * Dove il grosso non è l'energia — Brasile, Congo, Indonesia — l'identità non
 * spiega niente, perché quelle emissioni non escono da un motore ma da una
 * foresta tagliata. La ripartizione per sorgente lo dice prima, ed è per questo
 * che viene mostrata per prima.
 *
 * **Due contabilità, mai mescolate in un conto.** CO₂ fossile e uso del suolo
 * vengono dal Global Carbon Budget; il totale dei gas serra, il metano e il
 * protossido vengono da Climate Watch, che stima l'uso del suolo in modo
 * diverso. Sottrarre l'uno dall'altro darebbe numeri che non tornano — per il
 * Congo, un totale più piccolo della somma delle sue parti. Quindi la quota
 * non-CO₂ si calcola solo con i termini che arrivano dalla stessa fonte.
 */
import type { CountryProps, SourceSplit, WorldReference } from '@/lib/countryEmissions';
import { LOCALE_TAG, type Locale } from '@/i18n/locale';

/** Le sorgenti, nell'ordine in cui hanno senso lette una dopo l'altra. */
const SOURCE_ORDER: Array<keyof SourceSplit> = [
  'coal',
  'oil',
  'gas',
  'cement',
  'flaring',
  'industry',
  'land',
];

const SOURCE_LABELS: Record<Locale, Record<keyof SourceSplit, string>> = {
  it: {
    coal: 'Carbone',
    oil: 'Petrolio',
    gas: 'Gas',
    cement: 'Cemento',
    flaring: 'Gas bruciato ai pozzi',
    industry: 'Altri processi industriali',
    land: 'Foreste e uso del suolo',
  },
  en: {
    coal: 'Coal',
    oil: 'Oil',
    gas: 'Gas',
    cement: 'Cement',
    flaring: 'Gas flaring',
    industry: 'Other industrial processes',
    land: 'Forests and land use',
  },
  es: {
    coal: 'Carbón',
    oil: 'Petróleo',
    gas: 'Gas',
    cement: 'Cemento',
    flaring: 'Quema de gas en pozos',
    industry: 'Otros procesos industriales',
    land: 'Bosques y uso del suelo',
  },
};

const OTHER_LABEL: Record<Locale, string> = { it: 'Altro', en: 'Other', es: 'Otro' };

/** Sotto questa quota una riga non è una spiegazione: finisce in "altro". */
const MIN_ROW_SHARE = 2;

/** E sotto questa, nemmeno "altro" vale la riga. */
const MIN_OTHER_SHARE = 0.2;

export interface SourceRow {
  id: keyof SourceSplit | 'other';
  label: string;
  /** Mt di CO₂ in un anno. */
  mt: number;
  /** Quota di quanto il paese emette in un anno, in percento. */
  share: number;
}

export interface SourceBreakdown {
  rows: SourceRow[];
  /** Totale emesso: fossile più uso del suolo, quando è una sorgente. */
  totalMt: number;
  /**
   * Uso del suolo quando invece è un pozzo, in Mt riassorbite (positivo).
   * Non è una fetta della torta: è una fetta tolta, e va detta a parte.
   */
  sinkMt: number | null;
}

/**
 * La ripartizione per sorgente, ordinata dal pezzo più grosso.
 *
 * Le quote sono sul totale ricostruito dalle sue parti, non sul totale
 * pubblicato: i due differiscono per l'arrotondamento del file (al massimo il
 * 2%, su paesi da mezza megatonnellata), e una torta le cui fette non fanno
 * cento è una torta sbagliata.
 */
export function sourceBreakdown(props: CountryProps, locale: Locale): SourceBreakdown | null {
  const src = props.src;
  if (!src) return null;

  const parts = SOURCE_ORDER.map((id) => ({ id, mt: src[id] ?? 0 })).filter((p) => p.mt > 0);
  const total = parts.reduce((a, p) => a + p.mt, 0);
  if (total <= 0) return null;

  const labels = SOURCE_LABELS[locale];
  const sorted = [...parts].sort((a, b) => b.mt - a.mt);
  const rows: SourceRow[] = [];
  let othersMt = 0;
  for (const p of sorted) {
    const share = (p.mt / total) * 100;
    if (share >= MIN_ROW_SHARE) rows.push({ id: p.id, label: labels[p.id], mt: p.mt, share });
    else othersMt += p.mt;
  }
  const otherShare = (othersMt / total) * 100;
  if (otherShare >= MIN_OTHER_SHARE) {
    rows.push({ id: 'other', label: OTHER_LABEL[locale], mt: othersMt, share: otherShare });
  }

  const land = src.land ?? 0;
  return { rows, totalMt: total, sinkMt: land < 0 ? -land : null };
}

export interface EnergyIdentity {
  /** kWh di energia primaria a testa in un anno. */
  energyPc: number;
  /** Quante volte la media mondiale. */
  energyRatio: number;
  /** Grammi di CO₂ per kWh consumato. */
  intensity: number;
  intensityRatio: number;
  /** t di CO₂ fossile a testa: il prodotto dei due fattori. */
  pcFossil: number;
  pcRatio: number;
}

/**
 * I due fattori dietro la CO₂ fossile pro capite, ciascuno rapportato al mondo.
 * Per costruzione `energyRatio × intensityRatio = pcRatio`, ed è quello che
 * rende leggibile la riga: due numeri che si moltiplicano nel terzo.
 */
export function energyIdentity(
  props: CountryProps,
  world: WorldReference,
): EnergyIdentity | null {
  const { pcFossil, energyPc } = props;
  if (!pcFossil || !energyPc || !world.pcFossil || !world.energyPc) return null;
  // Tonnellate → grammi: l'intensità si legge in g/kWh come sulle bollette.
  const intensity = (pcFossil * 1e6) / energyPc;
  const worldIntensity = (world.pcFossil * 1e6) / world.energyPc;
  return {
    energyPc,
    energyRatio: energyPc / world.energyPc,
    intensity,
    intensityRatio: intensity / worldIntensity,
    pcFossil,
    pcRatio: pcFossil / world.pcFossil,
  };
}

/**
 * Quanta parte dei gas serra del paese non è CO₂: metano (allevamento,
 * discariche, perdite di gas) e protossido d'azoto (fertilizzanti), pesati in
 * CO₂ equivalente. Dove supera un quarto del totale, la storia del paese non è
 * quella dei combustibili.
 */
export function nonCo2Share(props: CountryProps): { share: number; ch4: number; n2o: number } | null {
  const { ghg, ch4, n2o } = props;
  if (!ghg || ghg <= 0 || ch4 === undefined || n2o === undefined) return null;
  return { share: ((ch4 + n2o) / ghg) * 100, ch4: (ch4 / ghg) * 100, n2o: (n2o / ghg) * 100 };
}

/** Quota della popolazione mondiale, in percento: il metro di ogni "quanto gli tocca". */
export function populationShare(props: CountryProps, world: WorldReference): number | null {
  if (!props.pop || !world.pop) return null;
  return (props.pop / world.pop) * 100;
}

/** "1,3×" — un rapporto, sotto il 10 con un decimale. */
export function times(ratio: number, locale: Locale): string {
  const digits = ratio >= 10 ? 0 : ratio >= 1 ? 1 : 2;
  return `${ratio.toLocaleString(LOCALE_TAG[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}×`;
}

/** "3,2%" o "0,04%": sotto l'uno per cento un decimale solo non dice niente. */
export function share(value: number, locale: Locale): string {
  const digits = value >= 1 ? 1 : value >= 0.1 ? 2 : 3;
  return `${value.toLocaleString(LOCALE_TAG[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

/** "302 Mt" oppure "2,1 Gt": le megatonnellate smettono di dire qualcosa a quattro cifre. */
export function emissionsMass(mt: number, locale: Locale): string {
  if (mt >= 1000) {
    return `${(mt / 1000).toLocaleString(LOCALE_TAG[locale], { maximumFractionDigits: 1 })} Gt`;
  }
  return `${mt.toLocaleString(LOCALE_TAG[locale], { maximumFractionDigits: mt < 10 ? 1 : 0 })} Mt`;
}
