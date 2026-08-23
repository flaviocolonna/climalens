/**
 * Le metriche che la mappa sa dipingere, in tre famiglie.
 *
 * Sono tre domande diverse — chi causa il riscaldamento, chi respira cosa, chi
 * può permettersi di reggerlo — e tenerle in tre elenchi separati evita che il
 * selettore diventi una fila di undici chip in cui il PM2.5 sembra un tipo di
 * CO₂. I componenti però non devono sapere a quale famiglia appartiene un id:
 * passano da qui.
 */
import {
  getMetrics,
  type CountryProps,
  type Metric,
  type MetricId,
} from '@/lib/countryEmissions';
import {
  getAdaptationMetrics,
  ADAPTATION_METRIC_IDS,
  type AdaptationMetricId,
} from '@/lib/adaptation';
import { getPollutionMetrics, POLLUTION_METRIC_IDS, type PollutionMetricId } from '@/lib/pollution';
import type { Locale } from '@/i18n/locale';

export type AnyMetricId = MetricId | PollutionMetricId | AdaptationMetricId;

/** `anomaly` = la mappa mostra le anomalie di temperatura, non un layer paesi. */
export type MapMode = 'anomaly' | 'co2' | 'pollution' | 'adaptation';

export type MetricFamily = Exclude<MapMode, 'anomaly'>;

const CO2_IDS: MetricId[] = ['pc', 'cum', 'net'];

export function isPollutionMetric(id: AnyMetricId): id is PollutionMetricId {
  return (POLLUTION_METRIC_IDS as string[]).includes(id);
}

export function isAdaptationMetric(id: AnyMetricId): id is AdaptationMetricId {
  return (ADAPTATION_METRIC_IDS as string[]).includes(id);
}

export function familyOf(id: AnyMetricId): MetricFamily {
  if (isPollutionMetric(id)) return 'pollution';
  if (isAdaptationMetric(id)) return 'adaptation';
  return 'co2';
}

export function metricsFor(family: MetricFamily, locale: Locale): Metric[] {
  if (family === 'pollution') return getPollutionMetrics(locale);
  if (family === 'adaptation') return getAdaptationMetrics(locale);
  return getMetrics(locale);
}

export function resolveMetric(id: AnyMetricId, locale: Locale): Metric {
  const found = metricsFor(familyOf(id), locale).find((m) => m.id === id);
  if (!found) throw new Error(`metrica sconosciuta: ${id}`);
  return found;
}

export const ALL_METRIC_IDS: AnyMetricId[] = [
  ...CO2_IDS,
  ...POLLUTION_METRIC_IDS,
  ...ADAPTATION_METRIC_IDS,
];

export function isMetricId(value: string | null | undefined): value is AnyMetricId {
  return !!value && (ALL_METRIC_IDS as string[]).includes(value);
}

/**
 * Le proprietà di una feature dopo le fusioni: quelle delle emissioni più, se
 * le rispettive tabelle sono arrivate, quelle dell'inquinamento e
 * dell'adattamento. Sta qui e non in uno dei due moduli perché è l'unico posto
 * che li conosce entrambi senza accoppiarli fra loro.
 */
export type MergedCountryProps = CountryProps &
  Partial<Record<PollutionMetricId | AdaptationMetricId, number>>;
