/**
 * Le metriche che la mappa sa dipingere, in due famiglie.
 *
 * Sono due domande diverse — chi causa il riscaldamento, e chi respira cosa —
 * e tenerle in due elenchi separati evita che il selettore diventi una fila di
 * otto chip in cui il PM2.5 sembra un tipo di CO₂. I componenti però non
 * devono sapere a quale famiglia appartiene un id: passano da qui.
 */
import { getMetrics, type Metric, type MetricId } from '@/lib/countryEmissions';
import { getPollutionMetrics, POLLUTION_METRIC_IDS, type PollutionMetricId } from '@/lib/pollution';
import type { Locale } from '@/i18n/locale';

export type AnyMetricId = MetricId | PollutionMetricId;

/** `null` = la mappa mostra le anomalie di temperatura, non un layer paesi. */
export type MapMode = 'anomaly' | 'co2' | 'pollution';

const CO2_IDS: MetricId[] = ['pc', 'cum', 'net'];

export function isPollutionMetric(id: AnyMetricId): id is PollutionMetricId {
  return (POLLUTION_METRIC_IDS as string[]).includes(id);
}

export function familyOf(id: AnyMetricId): Exclude<MapMode, 'anomaly'> {
  return isPollutionMetric(id) ? 'pollution' : 'co2';
}

export function metricsFor(family: Exclude<MapMode, 'anomaly'>, locale: Locale): Metric[] {
  return family === 'pollution' ? getPollutionMetrics(locale) : getMetrics(locale);
}

export function resolveMetric(id: AnyMetricId, locale: Locale): Metric {
  const found = metricsFor(familyOf(id), locale).find((m) => m.id === id);
  if (!found) throw new Error(`metrica sconosciuta: ${id}`);
  return found;
}

export const ALL_METRIC_IDS: AnyMetricId[] = [...CO2_IDS, ...POLLUTION_METRIC_IDS];

export function isMetricId(value: string | null | undefined): value is AnyMetricId {
  return !!value && (ALL_METRIC_IDS as string[]).includes(value);
}
