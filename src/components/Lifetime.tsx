import { useMemo, useState } from 'react';
import { anomalyCss } from '@/lib/colorScale';
import type { SeriesPoint } from '@/lib/climateData';
import { signedDegrees } from '@/lib/format';
import {
  HOTTEST_COUNT,
  clampBirthYear,
  lifetimeStats,
  persistBirthYear,
  storedBirthYear,
} from '@/lib/lifetime';
import { useI18n } from '@/i18n/LocaleProvider';

interface Props {
  series: SeriesPoint[];
  startYear: number;
  endYear: number;
}

/**
 * Il riscaldamento di questo punto dentro una vita sola.
 *
 * È la stessa serie del grafico qui sopra, letta con un'origine diversa: non
 * il 1880, ma l'anno che scrive chi guarda. Costa zero richieste e cambia la
 * frase da «l'umanità ha scaldato il pianeta» a «è successo mentre c'eri».
 */
export function Lifetime({ series, startYear, endYear }: Props) {
  const { locale, t } = useI18n();
  const [birthYear, setBirthYear] = useState<number | null>(() => storedBirthYear());

  const stats = useMemo(
    () => (birthYear === null ? null : lifetimeStats(series, birthYear)),
    [series, birthYear],
  );

  const commit = (raw: string) => {
    const parsed = Number(raw);
    if (!raw || !Number.isFinite(parsed)) {
      setBirthYear(null);
      return;
    }
    // Il clamp avviene solo quando il campo è plausibile: mentre si digita
    // "19" non deve saltare al primo anno della serie.
    if (raw.length < 4) return;
    const year = clampBirthYear(parsed, startYear, endYear);
    setBirthYear(year);
    persistBirthYear(year);
  };

  return (
    <section className="mt-4 border-t border-white/10 pt-4">
      <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {t('locationPanel.lifetimeHeading')}
      </h3>

      <label className="flex items-center gap-2 text-xs text-slate-400">
        {t('locationPanel.lifetimeLabel')}
        <input
          type="number"
          inputMode="numeric"
          min={startYear}
          max={endYear}
          defaultValue={birthYear ?? ''}
          onChange={(e) => commit(e.target.value)}
          placeholder="1990"
          className="w-20 rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
        />
      </label>

      {birthYear !== null && stats && (
        <div className="mt-3">
          {stats.warming === null ? (
            <p className="text-xs text-slate-500">{t('locationPanel.lifetimeNoData')}</p>
          ) : (
            <>
              <div
                className="font-mono text-3xl font-bold leading-none tracking-tight tabular-nums"
                style={{ color: anomalyCss(stats.warming) }}
              >
                {signedDegrees(stats.warming, locale)}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                {t('locationPanel.lifetimeWarming', { year: birthYear })}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                {t('locationPanel.lifetimeHottest', {
                  hot: stats.hottestInLife,
                  total: HOTTEST_COUNT,
                })}
              </p>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
                {t('locationPanel.lifetimeCaption', { year: birthYear })}
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
