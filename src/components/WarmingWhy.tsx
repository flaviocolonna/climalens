import { useMemo } from 'react';
import { Thermometer } from 'lucide-react';
import type { ClimateGrid } from '@/lib/climateData';
import { anomalyCss } from '@/lib/colorScale';
import { signed, signedDegrees } from '@/lib/format';
import type { CountryIndex } from '@/lib/geoLookup';
import { explainWarming } from '@/lib/warmingWhy';
import { useI18n } from '@/i18n/LocaleProvider';
import { headline, reason, stepLabel } from '@/i18n/content/warmingWhy';

interface Props {
  grid: ClimateGrid;
  latitude: number;
  longitude: number;
  /** Le forme dei confini fanno anche da maschera terra/mare; null finché non arrivano. */
  index: CountryIndex | null;
}

/**
 * "+1,96 °C" è il numero. Questa sezione è il *perché* sia proprio quello.
 *
 * La risposta è una scala di confronti misurati sulla stessa griglia — mondo,
 * fascia di latitudine, terra o mare di quella fascia, punto — dove ogni riga è
 * la media di un insieme più stretto e la differenza con la riga sopra è quanto
 * pesa quel passaggio. Il testo sotto ogni riga dice il meccanismo fisico; i
 * numeri restano quelli letti dai dati, non quelli che il testo vorrebbe.
 */
export function WarmingWhy({ grid, latitude, longitude, index }: Props) {
  const { locale, t } = useI18n();
  const why = useMemo(
    () => explainWarming(grid, latitude, longitude, index),
    [grid, latitude, longitude, index],
  );

  if (why.point === null || why.steps.length < 2) return null;

  return (
    <section className="mb-5 border-t border-white/10 pt-4">
      <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        <Thermometer className="h-3 w-3 text-slate-500" />
        {t('warmingWhy.heading')}
      </h3>

      <p className="mb-3 text-xs leading-relaxed text-slate-400">{headline(why, locale)}</p>

      <div className="space-y-2.5">
        {why.steps.map((step) => (
          <div key={step.id}>
            <div className="flex items-baseline gap-2 text-xs">
              <span className="min-w-0 flex-1 truncate text-slate-300">
                {stepLabel(step.id, why, locale)}
              </span>
              <span
                className="shrink-0 font-mono font-semibold tabular-nums"
                style={{ color: anomalyCss(step.value) }}
              >
                {signedDegrees(step.value, locale)}
              </span>
              <span className="w-12 shrink-0 text-right font-mono text-[11px] tabular-nums text-slate-500">
                {step.delta === null ? '' : signed(step.delta, locale)}
              </span>
            </div>
            <p className="mt-0.5 pr-14 text-[11px] leading-relaxed text-slate-500">
              {reason(step.id, why, locale)}
            </p>
          </div>
        ))}
      </div>

      {!why.steps.some((s) => s.id === 'band') && (
        <p className="mt-2.5 text-[11px] leading-relaxed text-slate-500">
          {t('warmingWhy.bandMissingNote', {
            band: why.band.label,
            pct: Math.round(why.bandCoverage * 100),
          })}
        </p>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-slate-600">{t('warmingWhy.footerNote')}</p>
    </section>
  );
}
