import { useEffect, useState } from 'react';
import { Loader2, Wind } from 'lucide-react';
import { WHO_PM25, fetchAirQuality, type AirQuality as AirQualityData } from '@/lib/airQuality';
import { useI18n } from '@/i18n/LocaleProvider';
import { LOCALE_TAG } from '@/i18n/locale';

interface Props {
  /** Cambia identità con il punto: è la chiave che fa ripartire la richiesta. */
  placeKey: string;
  latitude: number;
  longitude: number;
}

/**
 * Che aria si respira qui.
 *
 * Il resto del pannello parla di gradi, che sono un'astrazione; questo parla di
 * microgrammi per metro cubo, che sono nei polmoni di chi ci abita. Il numero
 * che conta non è il valore assoluto ma il **rapporto sulla linea guida OMS**:
 * "2,6 volte la soglia" si capisce senza sapere cosa sia un µg/m³.
 *
 * È un arricchimento come la serie ERA5: se non arriva, il pannello resta
 * utile e lo dice, invece di sparire o di mostrare uno zero.
 */
export function AirQuality({ placeKey, latitude, longitude }: Props) {
  const { locale, t } = useI18n();
  const [data, setData] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setFailed(false);
    setLoading(true);
    fetchAirQuality(latitude, longitude, controller.signal)
      .then(setData)
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // placeKey distingue due punti che arrotondano alle stesse coordinate.
  }, [placeKey, latitude, longitude]);

  const decimal = (v: number, digits = 1) =>
    v.toLocaleString(LOCALE_TAG[locale], {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });

  return (
    <section className="mt-4 border-t border-white/10 pt-4">
      <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        <Wind className="h-3 w-3 text-slate-500" />
        {t('airQuality.heading')}
      </h3>

      {loading ? (
        <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t('airQuality.loading')}
        </div>
      ) : failed || !data ? (
        <p className="py-1 text-xs text-slate-600">{t('airQuality.unavailable')}</p>
      ) : (
        <>
          {data.annualMean !== null ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold leading-none tracking-tight text-white">
                  {decimal(data.annualMean)}
                </span>
                <span className="text-xs text-slate-400">{t('airQuality.unit')}</span>
                <span className="ml-auto shrink-0 font-mono text-sm font-semibold text-[#df7064]">
                  {t('airQuality.timesGuideline', {
                    times: decimal(data.annualMean / WHO_PM25.annual),
                  })}
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                {t('airQuality.annualCaption', { year: data.year, guideline: WHO_PM25.annual })}
              </p>

              {data.daysOverDaily !== null && (
                <div className="mt-3 flex items-baseline gap-2 text-xs">
                  <span className="min-w-0 flex-1 text-slate-300">
                    {t('airQuality.daysOverLabel', { daily: WHO_PM25.daily })}
                  </span>
                  <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-white">
                    {data.daysOverDaily}
                  </span>
                  <span className="shrink-0 text-slate-600">/ {data.daysCounted}</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500">{t('airQuality.noAnnualSeries')}</p>
          )}

          {data.now?.pm25 !== null && data.now !== null && (
            <div className="mt-3 flex items-baseline gap-2 border-t border-white/5 pt-2.5 text-xs">
              <span className="min-w-0 flex-1 text-slate-400">{t('airQuality.nowLabel')}</span>
              <span className="shrink-0 font-mono tabular-nums text-slate-200">
                {decimal(data.now.pm25)} µg/m³
              </span>
              {data.now.europeanAqi !== null && (
                <span className="shrink-0 font-mono text-[10px] text-slate-600">
                  {t('airQuality.aqi', { value: Math.round(data.now.europeanAqi) })}
                </span>
              )}
            </div>
          )}

          <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
            {t('airQuality.footnote')}
          </p>
        </>
      )}
    </section>
  );
}
