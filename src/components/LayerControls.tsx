import { AlertTriangle, Loader2 } from 'lucide-react';
import { Legend } from '@/components/Legend';
import type { CountryEmissions, MetricId } from '@/lib/countryEmissions';
import {
  familyOf,
  isPollutionMetric,
  metricsFor,
  type AnyMetricId,
  type MapMode,
} from '@/lib/mapMetrics';
import { METRIC_SOURCE, type PollutionMetricId, type PollutionTable } from '@/lib/pollution';
import { useI18n } from '@/i18n/LocaleProvider';

interface Props {
  baseline: string;
  /** null = la mappa mostra le anomalie. */
  metric: AnyMetricId | null;
  onMetricChange: (metric: AnyMetricId | null) => void;
  meta: CountryEmissions['meta'] | null;
  pollutionMeta: PollutionTable['meta'] | null;
  loading: boolean;
  error: string | null;
}

/**
 * L'ultima metrica scelta per famiglia: tornare su una scheda non deve
 * ricominciare dalla prima voce come se non ci fossi mai stato.
 */
const lastOf: Record<'co2' | 'pollution', AnyMetricId> = { co2: 'pc', pollution: 'pm25' };

/**
 * Tre domande sulla stessa mappa: cosa succede qui (le anomalie), chi ha
 * causato il riscaldamento (la CO₂), e cosa si respira o si beve (tutto il
 * resto). Sono alternative, non sovrapponibili, e il selettore lo dice invece
 * di lasciarlo scoprire.
 *
 * La terza scheda esiste perché il PM2.5 non è un tipo di CO₂: come sesto chip
 * accanto a "pro capite" si sarebbe letto come una variante dello stesso conto.
 */
export function LayerControls({
  baseline,
  metric,
  onMetricChange,
  meta,
  pollutionMeta,
  loading,
  error,
}: Props) {
  const { locale, t } = useI18n();
  const mode: MapMode = metric === null ? 'anomaly' : familyOf(metric);
  if (metric) lastOf[familyOf(metric)] = metric;

  const metrics = mode === 'anomaly' ? [] : metricsFor(mode, locale);
  const active = metrics.find((m) => m.id === metric) ?? null;

  return (
    <div className="pointer-events-auto w-72 rounded-xl border border-white/10 bg-ink-900/85 p-3 shadow-2xl backdrop-blur-md">
      <div className="mb-3 flex gap-0.5 rounded-lg bg-white/5 p-0.5">
        <ModeTab active={mode === 'anomaly'} onClick={() => onMetricChange(null)}>
          {t('layerControls.whoSuffers')}
        </ModeTab>
        <ModeTab active={mode === 'co2'} onClick={() => onMetricChange(lastOf.co2)}>
          {t('layerControls.whoCauses')}
        </ModeTab>
        <ModeTab active={mode === 'pollution'} onClick={() => onMetricChange(lastOf.pollution)}>
          {t('layerControls.beyondCo2')}
        </ModeTab>
      </div>

      {mode === 'anomaly' ? (
        <Legend baseline={baseline} bare />
      ) : loading ? (
        <div className="flex items-center gap-2 py-6 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
          {t('layerControls.loadingCountries')}
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-2.5 py-2 text-[11px] leading-relaxed text-amber-200/90">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          <div>
            {error}
            <span className="mt-1 block text-amber-200/60">
              {t('layerControls.generateFileHint')} <code className="font-mono">npm run data</code>.
            </span>
          </div>
        </div>
      ) : (
        active && (
          <>
            <div className="mb-2.5 flex flex-wrap gap-1">
              {metrics.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onMetricChange(m.id as AnyMetricId)}
                  aria-pressed={m.id === metric}
                  className={`rounded-md border px-2 py-1 text-[11px] transition ${
                    m.id === metric
                      ? 'border-sky-400/40 bg-sky-500/15 text-sky-200'
                      : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                  }`}
                >
                  {m.short}
                </button>
              ))}
            </div>

            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {active.title}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-500">{active.unit}</div>

            {/* Tessere larghe, non pallini: fra due passi di una rampa a tinta
                unica corre poca luminosità, e su 10px non si vede. */}
            <ul className="mt-2 space-y-1">
              {[...active.classes].reverse().map((c) => (
                <li key={c.from} className="flex items-center gap-2 text-[11px] text-slate-300">
                  <span
                    className="h-3 w-6 shrink-0 rounded-[3px] ring-1 ring-inset ring-white/15"
                    style={{ background: c.color }}
                  />
                  {c.label}
                </li>
              ))}
              <li className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="h-3 w-6 shrink-0 rounded-[3px] bg-slate-400/10 ring-1 ring-inset ring-white/15" />
                {t('common.noData')}
              </li>
            </ul>

            <p className="mt-2.5 border-t border-white/10 pt-2 text-[10px] leading-relaxed text-slate-500">
              {active.blurb}
            </p>

            <MetaLine metric={metric} meta={meta} pollutionMeta={pollutionMeta} />
          </>
        )
      )}
    </div>
  );
}

/**
 * Anno, copertura e fonte della metrica mostrata. Le due famiglie hanno due
 * sidecar diversi perché vengono da due pipeline diverse, e la riga nomina la
 * fonte giusta invece di una generica buona per entrambe.
 */
function MetaLine({
  metric,
  meta,
  pollutionMeta,
}: {
  metric: AnyMetricId | null;
  meta: CountryEmissions['meta'] | null;
  pollutionMeta: PollutionTable['meta'] | null;
}) {
  const { t } = useI18n();
  if (!metric) return null;

  if (isPollutionMetric(metric)) {
    if (!pollutionMeta) return null;
    const id = metric as PollutionMetricId;
    const source =
      METRIC_SOURCE[id] === 'owid' ? pollutionMeta.sources.owid : pollutionMeta.sources.worldBank;
    return (
      <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">
        {t('layerControls.metaLine', {
          year: pollutionMeta.years[id],
          coverage: pollutionMeta.coverage[id],
          countries: pollutionMeta.countries,
          source,
        })}
      </p>
    );
  }

  if (!meta) return null;
  const id = metric as MetricId;
  return (
    <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">
      {t('layerControls.metaLine', {
        year: meta.years[id],
        coverage: meta.coverage[id],
        countries: meta.countries,
        source: meta.source,
      })}
    </p>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`min-w-0 flex-1 truncate rounded-md px-1 py-1.5 text-[10px] font-medium transition ${
        active ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}
