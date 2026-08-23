import { useEffect } from 'react';
import { BookOpen, X } from 'lucide-react';
import { GLOSSARY_IDS, MILESTONES } from '@/lib/knowledge';
import { glossaryText, milestoneText } from '@/i18n/content/knowledge';
import { useI18n } from '@/i18n/LocaleProvider';

interface Props {
  onClose: () => void;
}

/**
 * Come lo sappiamo: la cronologia della scienza e le convenzioni di misura.
 *
 * Due risposte a due obiezioni. «Non si poteva sapere»: la fisica è del 1856,
 * il primo allarme a un capo di governo del 1965. «I numeri li scegli tu»: le
 * convenzioni che ogni pannello dichiara in piccolo, spiegate una volta sola
 * in un posto solo — ed è la pagina che uno apre per decidere se fidarsi.
 */
export function KnowledgePanel({ onClose }: Props) {
  const { locale, t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('knowledge.heading')}
      className="fixed inset-0 z-50 flex flex-col bg-ink-950/95 backdrop-blur-xl animate-fade-up"
    >
      <header className="shrink-0 border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <BookOpen className="h-5 w-5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight text-white">
              {t('knowledge.heading')}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-400">{t('knowledge.subheading')}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
            {t('knowledge.close')}
            <kbd className="hidden rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline">
              esc
            </kbd>
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-9 px-5 py-7 sm:px-8 lg:grid-cols-2">
          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {t('knowledge.timelineHeading')}
            </h3>
            <p className="mb-5 mt-1.5 text-xs leading-relaxed text-slate-400">
              {t('knowledge.timelineIntro')}
            </p>

            {/* Una riga verticale continua: le tappe sono lontane fra loro nel
                tempo, ma il filo che le lega non si è mai interrotto. */}
            <ol className="relative space-y-5 border-l border-white/10 pl-5">
              {MILESTONES.map((m) => (
                <li key={m.id} className="relative">
                  <span
                    className="absolute -left-[1.4rem] top-1.5 h-1.5 w-1.5 rounded-full bg-slate-500"
                    aria-hidden
                  />
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-mono text-sm font-semibold tabular-nums text-white">
                      {m.year}
                    </span>
                    <span className="text-[11px] text-slate-500">{m.who}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    {milestoneText(m.id, locale)}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {t('knowledge.methodHeading')}
            </h3>
            <p className="mb-5 mt-1.5 text-xs leading-relaxed text-slate-400">
              {t('knowledge.methodIntro')}
            </p>

            <dl className="space-y-4">
              {GLOSSARY_IDS.map((id) => {
                const entry = glossaryText(id, locale);
                return (
                  <div key={id} className="border-b border-white/5 pb-4 last:border-0">
                    <dt className="text-sm font-medium text-slate-100">{entry.term}</dt>
                    <dd className="mt-1 text-xs leading-relaxed text-slate-400">{entry.body}</dd>
                  </div>
                );
              })}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
