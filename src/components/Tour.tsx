import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Compass, X } from 'lucide-react';
import { TOUR_LENGTH, TOUR_STEPS } from '@/lib/tour';
import { stepText } from '@/i18n/content/tour';
import { useI18n } from '@/i18n/LocaleProvider';

interface Props {
  step: number;
  onStep: (step: number) => void;
  onExit: () => void;
}

/**
 * La barra del percorso, sopra tutto il resto.
 *
 * `z-[60]` la tiene sopra i pannelli a tutto schermo (`z-50`), che alcuni
 * passi aprono: senza, il percorso sparirebbe dietro la cosa che ha appena
 * aperto e non ci sarebbe modo di andare avanti.
 *
 * Sta in basso al centro perché è l'unica fascia che nessun altro pannello
 * occupa, ed è comunque staccata dalla linea del tempo, che durante il
 * percorso resta usabile.
 */
export function Tour({ step, onStep, onExit }: Props) {
  const { locale, t } = useI18n();
  const current = TOUR_STEPS[step];
  const text = stepText(current.id, locale);
  const first = step === 0;
  const last = step === TOUR_LENGTH - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') onExit();
      // Le frecce guidano il percorso mentre è aperto: durante una spiegazione
      // scorrere gli anni non è quello che uno si aspetta dai tasti.
      else if (e.key === 'ArrowRight' && !last) onStep(step + 1);
      else if (e.key === 'ArrowLeft' && !first) onStep(step - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, first, last, onStep, onExit]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-xl rounded-xl border border-sky-400/25 bg-ink-900/95 p-4 shadow-2xl backdrop-blur-md animate-fade-up">
        <div className="flex items-start gap-3">
          <Compass className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold text-white">{text.title}</h2>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-500">
                {step + 1}/{TOUR_LENGTH}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">{text.body}</p>
          </div>
          <button
            onClick={onExit}
            aria-label={t('tour.exit')}
            className="shrink-0 rounded-lg p-1 text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {/* Il progresso come tacche e non come barra: sono nove passi, e
              vedere quanti ne restano conta più di una percentuale. */}
          <div className="flex flex-1 gap-1" aria-hidden>
            {TOUR_STEPS.map((s, i) => (
              <span
                key={s.id}
                className={`h-1 flex-1 rounded-full transition ${
                  i <= step ? 'bg-sky-400/70' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => onStep(step - 1)}
            disabled={first}
            className="rounded-lg border border-white/10 p-1.5 text-slate-300 transition enabled:hover:border-white/20 enabled:hover:bg-white/5 disabled:opacity-30"
            aria-label={t('tour.prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {last ? (
            <button
              onClick={onExit}
              className="rounded-lg border border-sky-400/40 bg-sky-500/15 px-3 py-1.5 text-xs font-medium text-sky-200 transition hover:bg-sky-500/25"
            >
              {t('tour.finish')}
            </button>
          ) : (
            <button
              onClick={() => onStep(step + 1)}
              className="flex items-center gap-1 rounded-lg border border-sky-400/40 bg-sky-500/15 px-3 py-1.5 text-xs font-medium text-sky-200 transition hover:bg-sky-500/25"
            >
              {t('tour.next')}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
