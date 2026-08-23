/**
 * Le metriche che la mappa sa dipingere, in quattro famiglie.
 *
 * Sono quattro domande diverse — chi causa il riscaldamento, chi respira cosa,
 * chi può permettersi di reggerlo, chi sta facendo quello che ha detto — e
 * tenerle in elenchi separati evita che il selettore diventi una fila di
 * quattordici chip in cui il PM2.5 sembra un tipo di CO₂. I componenti però
 * non devono sapere a quale famiglia appartiene un id: passano da qui.
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
import { getPledgeMetrics, PLEDGE_METRIC_IDS, type PledgeMetricId } from '@/lib/pledges';
import type { Locale } from '@/i18n/locale';

export type AnyMetricId = MetricId | PollutionMetricId | AdaptationMetricId | PledgeMetricId;

/** `anomaly` = la mappa mostra le anomalie di temperatura, non un layer paesi. */
export type MapMode = 'anomaly' | 'co2' | 'pollution' | 'adaptation' | 'pledges';

export type MetricFamily = Exclude<MapMode, 'anomaly'>;

const CO2_IDS: MetricId[] = ['pc', 'cum', 'net'];

export function isPollutionMetric(id: AnyMetricId): id is PollutionMetricId {
  return (POLLUTION_METRIC_IDS as string[]).includes(id);
}

export function isAdaptationMetric(id: AnyMetricId): id is AdaptationMetricId {
  return (ADAPTATION_METRIC_IDS as string[]).includes(id);
}

export function isPledgeMetric(id: AnyMetricId): id is PledgeMetricId {
  return (PLEDGE_METRIC_IDS as string[]).includes(id);
}

export function familyOf(id: AnyMetricId): MetricFamily {
  if (isPollutionMetric(id)) return 'pollution';
  if (isAdaptationMetric(id)) return 'adaptation';
  if (isPledgeMetric(id)) return 'pledges';
  return 'co2';
}

export function metricsFor(family: MetricFamily, locale: Locale): Metric[] {
  if (family === 'pollution') return getPollutionMetrics(locale);
  if (family === 'adaptation') return getAdaptationMetrics(locale);
  if (family === 'pledges') return getPledgeMetrics(locale);
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
  ...PLEDGE_METRIC_IDS,
];

export function isMetricId(value: string | null | undefined): value is AnyMetricId {
  return !!value && (ALL_METRIC_IDS as string[]).includes(value);
}

/**
 * Le proprietà di una feature dopo le fusioni: quelle delle emissioni più, per
 * ogni tabella arrivata, le sue. Sta qui e non in uno dei moduli perché è
 * l'unico posto che li conosce tutti senza accoppiarli fra loro.
 *
 * `target` non è una metrica — non si dipinge — ma viaggia con le promesse e
 * finisce sulla feature insieme a loro: il popup lo legge da qui.
 */
export type MergedCountryProps = CountryProps &
  Partial<Record<PollutionMetricId | AdaptationMetricId | PledgeMetricId, number>> & {
    target?: number;
  };
