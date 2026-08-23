import { ANOMALY_MAX, ANOMALY_MIN, legendGradient } from '@/lib/colorScale';
import { useT } from '@/i18n/LocaleProvider';

const TICKS = [ANOMALY_MIN, -2, 0, 2, ANOMALY_MAX];

interface Props {
  baseline: string;
  /** Senza cornice: la legenda vive dentro un pannello che ce l'ha già. */
  bare?: boolean;
}

export function Legend({ baseline, bare }: Props) {
  const t = useT();
  const body = (
    <>
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {t('legend.title')}
      </div>
      <div
        className={`h-2.5 rounded-full ring-1 ring-inset ring-white/15 ${bare ? 'w-full' : 'w-56'}`}
        style={{ background: legendGradient() }}
      />
      <div
        className={`mt-1.5 flex justify-between font-mono text-[10px] text-slate-400 ${
          bare ? 'w-full' : 'w-56'
        }`}
      >
        {TICKS.map((tick) => (
          <span key={tick}>{tick > 0 ? `+${tick}` : tick}</span>
        ))}
      </div>
      <div className="mt-2 text-[10px] leading-relaxed text-slate-500">
        {t('legend.subtitle', { baseline })}
      </div>
    </>
  );

  if (bare) return body;
  return (
    <div className="pointer-events-auto rounded-xl border border-white/10 bg-ink-900/80 p-3 shadow-2xl backdrop-blur-md">
      {body}
    </div>
  );
}
