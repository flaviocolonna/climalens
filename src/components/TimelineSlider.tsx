import { useEffect, useRef } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { anomalyCss } from '@/lib/colorScale';
import { signedDegrees } from '@/lib/format';
import { useI18n } from '@/i18n/LocaleProvider';

/** Years advanced per second while playing. */
const YEARS_PER_SECOND = 9;

interface Props {
  years: number[];
  year: number;
  globalAnomaly: number | null;
  playing: boolean;
  onYearChange: (year: number) => void;
  onPlayingChange: (playing: boolean) => void;
}

export function TimelineSlider({
  years,
  year,
  globalAnomaly,
  playing,
  onYearChange,
  onPlayingChange,
}: Props) {
  const { locale, t } = useI18n();
  const first = years[0];
  const last = years[years.length - 1];
  const atEnd = year >= last;

  // Drive playback off rAF timestamps so the pace is frame-rate independent.
  const yearRef = useRef(year);
  yearRef.current = year;

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last_ = performance.now();
    let acc = 0;

    const tick = (now: number) => {
      acc += (now - last_) / 1000;
      last_ = now;
      const steps = Math.floor(acc * YEARS_PER_SECOND);
      if (steps > 0) {
        acc -= steps / YEARS_PER_SECOND;
        const next = yearRef.current + steps;
        if (next >= last) {
          onYearChange(last);
          onPlayingChange(false);
          return;
        }
        onYearChange(next);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, last, onYearChange, onPlayingChange]);

  const toggle = () => {
    if (atEnd && !playing) {
      onYearChange(first);
      onPlayingChange(true);
    } else {
      onPlayingChange(!playing);
    }
  };

  const decades = years.filter((y) => y % 20 === 0);
  const pct = ((year - first) / (last - first)) * 100;

  return (
    <div className="pointer-events-auto rounded-2xl border border-white/10 bg-ink-900/85 px-5 py-4 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-5">
        <button
          onClick={toggle}
          aria-label={playing ? t('timeline.pause') : t('timeline.play')}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sky-500 text-ink-950 shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 active:scale-95"
        >
          {playing ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : atEnd ? (
            <RotateCcw className="h-4 w-4" />
          ) : (
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          )}
        </button>

        <div className="w-[5.5rem] shrink-0">
          <div className="font-mono text-3xl font-bold leading-none tracking-tight text-white tabular-nums">
            {year}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
            {t('timeline.yearLabel')}
          </div>
        </div>

        <div className="relative min-w-0 flex-1">
          <input
            type="range"
            min={first}
            max={last}
            step={1}
            value={year}
            onChange={(e) => {
              onPlayingChange(false);
              onYearChange(Number(e.target.value));
            }}
            aria-label={t('timeline.selectYearAria')}
            className="climalens-range w-full"
            style={{ ['--pct' as string]: `${pct}%` }}
          />
          <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-600">
            {decades.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>

        <div className="w-36 shrink-0 text-right">
          <div
            className="font-mono text-2xl font-bold leading-none tabular-nums transition-colors"
            style={{ color: globalAnomaly === null ? '#64748b' : anomalyCss(globalAnomaly) }}
          >
            {globalAnomaly === null ? '—' : signedDegrees(globalAnomaly, locale)}
          </div>
          <div className="mt-1 text-[10px] uppercase leading-tight tracking-wider text-slate-500">
            {t('timeline.globalMeanLabel')}
          </div>
        </div>
      </div>
    </div>
  );
}
