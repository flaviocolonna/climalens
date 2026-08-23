import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, Sparkles, X } from 'lucide-react';
import {
  ACTIONS,
  ACTIONS_SOURCE,
  MULTIPLIERS,
  REFERENCES,
  type ClimateAction,
} from '@/lib/actions';
import { CARBON_MAJORS } from '@/lib/producers';
import { CARBON_BUDGET, CLIMATE_SUPPORT, yearsLeft } from '@/lib/future';
import { loadFood, type FoodData } from '@/lib/food';
import { STAGE_COLORS, foodName, stageName } from '@/i18n/content/food';
import { actionText, multiplierText } from '@/i18n/content/actions';
import { useI18n } from '@/i18n/LocaleProvider';
import { LOCALE_TAG, type Locale } from '@/i18n/locale';

/** Le azioni usano il rosso della mappa: è sempre CO₂, solo dalla parte di chi la evita. */
const BAR_COLOR = '#bf2621';
/**
 * Il grassetto dentro una stringa tradotta: le traduzioni hanno bisogno di
 * poter spostare l'enfasi dove la loro sintassi la mette, e spezzare la frase
 * in tre chiavi lo impedirebbe. Marcatore minimo, nessun HTML in ingresso.
 */
function emphasise(text: string): React.ReactNode {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-medium text-white">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

/** Le raccomandate, per distinguerle senza affidarsi al solo colore. */
const ADVISED_COLOR = '#8560c6';

interface Props {
  onClose: () => void;
}

/**
 * Cosa può fare una persona, in ordine di quanto pesa — e dove sta la leva vera.
 *
 * Il pannello ha una tesi e la dichiara: il taglio diretto di un individuo è
 * piccolo davanti a quello che estraggono dieci imprese, e proprio per questo
 * le leve che contano non si misurano in tonnellate. Senza quel ponte, questa
 * schermata accanto a «chi le estrae» si contraddirebbe da sola.
 *
 * La scala delle barre arriva alla **media mondiale pro capite**, non alla
 * prima azione: così si vede a occhio che nemmeno la scelta più grossa copre
 * metà di quello che emette una persona media del pianeta.
 */
export function ActionsPanel({ onClose }: Props) {
  const { locale, t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const decimal = (v: number, digits = 1) =>
    v.toLocaleString(LOCALE_TAG[locale], {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('actionsPanel.heading')}
      className="fixed inset-0 z-50 flex flex-col bg-ink-950/95 backdrop-blur-xl animate-fade-up"
    >
      <header className="shrink-0 border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Sparkles className="h-5 w-5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight text-white">
              {t('actionsPanel.heading')}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {t('actionsPanel.subheading')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
            {t('actionsPanel.close')}
            <kbd className="hidden rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline">
              esc
            </kbd>
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-8 px-5 py-7 sm:px-8 lg:grid-cols-[19rem_minmax(0,1fr)]">
          {/* Il rail porta la tesi, non un numero: è quello che tiene insieme
              questa schermata con la lente «chi le estrae». */}
          <aside className="space-y-5 lg:sticky lg:top-0 lg:h-max">
            <div>
              <h3 className="text-sm font-medium text-white">
                {t('actionsPanel.contextHeading')}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {t('actionsPanel.contextBody', {
                  gt: decimal(CARBON_MAJORS.tracedGt),
                })}
              </p>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {t('actionsPanel.handoffHeading')}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                {t('actionsPanel.handoffBody')}
              </p>
            </div>

            <div className="space-y-1 border-t border-white/10 pt-4 text-[10px] leading-relaxed text-slate-600">
              <a
                href={ACTIONS_SOURCE.primaryUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition hover:text-slate-400"
              >
                {ACTIONS_SOURCE.primary}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
              <a
                href={ACTIONS_SOURCE.corroboratingUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 transition hover:text-slate-400"
              >
                {ACTIONS_SOURCE.corroborating}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
              <p className="pt-1">{t('actionsPanel.sourceNote')}</p>
            </div>
          </aside>

          <div className="min-w-0">
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {t('actionsPanel.rankingHeading')}
            </h3>
            <p className="mb-4 mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-400">
              {t('actionsPanel.rankingIntro')}
            </p>

            {/* Le due righe di riferimento, dette prima di mostrarle: senza,
                un trattino verticale in mezzo a una barra non spiega niente. */}
            <div className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-px bg-white/40" />
                {t('actionsPanel.refFairShare')} · {decimal(REFERENCES.fairShare)}{' '}
                {t('actionsPanel.savesUnit')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-px bg-white/25" />
                {t('actionsPanel.refWorld', { year: REFERENCES.worldYear })} ·{' '}
                {decimal(REFERENCES.worldPerCapita)} {t('actionsPanel.savesUnit')}
              </span>
            </div>

            <div className="space-y-3">
              {ACTIONS.map((a) => (
                <ActionRow key={a.id} action={a} locale={locale} decimal={decimal} />
              ))}
            </div>

            <section className="mt-6 rounded-lg border border-white/5 bg-white/[0.02] px-3.5 py-3">
              <h4 className="text-xs font-medium text-slate-200">
                {t('actionsPanel.excludedHeading')}
              </h4>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                {t('actionsPanel.excludedBody', {
                  saves: decimal(ACTIONS_SOURCE.excludedChildSaves),
                })}
              </p>
            </section>

            <FoodSection />

            {/* Il conto alla rovescia sta qui e non da solo in una schermata:
                senza una leva accanto produce fatalismo, che è l'opposto di
                quello che questo pannello sta cercando di fare. */}
            <section className="mt-7 border-t border-white/10 pt-5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {t('actionsPanel.budgetHeading')}
              </h3>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-mono text-5xl font-bold leading-none tracking-tight text-[#bf2621]">
                  {decimal(yearsLeft(CARBON_BUDGET.gt))}
                </span>
                <span className="text-sm text-slate-300">{t('actionsPanel.budgetYears')}</span>
              </div>
              <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-400">
                {t('actionsPanel.budgetCaption', {
                  annual: decimal(CARBON_BUDGET.annualGt),
                  gt: CARBON_BUDGET.gt,
                  from: CARBON_BUDGET.from,
                  probability: CARBON_BUDGET.probability,
                })}
              </p>
              <p className="mt-1.5 max-w-3xl text-[11px] leading-relaxed text-slate-500">
                {t('actionsPanel.budgetStrict', {
                  probability: CARBON_BUDGET.strictProbability,
                  gt: CARBON_BUDGET.strictGt,
                  years: decimal(yearsLeft(CARBON_BUDGET.strictGt)),
                })}
              </p>
              <p className="mt-2 text-[10px] text-slate-600">
                <a
                  href={CARBON_BUDGET.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 transition hover:text-slate-400"
                >
                  {CARBON_BUDGET.source}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </p>
            </section>

            <section className="mt-7 border-t border-white/10 pt-5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {t('actionsPanel.supportHeading')}
              </h3>
              <p className="mb-3 mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-400">
                {t('actionsPanel.supportIntro', {
                  people: CLIMATE_SUPPORT.people.toLocaleString(LOCALE_TAG[locale]),
                  countries: CLIMATE_SUPPORT.countries,
                })}
              </p>
              <div className="max-w-2xl space-y-2">
                {[
                  { pct: CLIMATE_SUPPORT.willingToPay, label: t('actionsPanel.supportWilling') },
                  { pct: CLIMATE_SUPPORT.norms, label: t('actionsPanel.supportNorms') },
                  { pct: CLIMATE_SUPPORT.demandsAction, label: t('actionsPanel.supportDemands') },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-baseline gap-2 text-xs">
                      <span className="w-10 shrink-0 font-mono text-sm font-semibold tabular-nums text-white">
                        {row.pct}%
                      </span>
                      <span className="min-w-0 flex-1 text-slate-300">{row.label}</span>
                    </div>
                    <div className="ml-12 mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-r-[3px]"
                        style={{ width: `${row.pct}%`, background: '#2f7d5b' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 max-w-3xl text-xs leading-relaxed text-slate-400">
                {emphasise(t('actionsPanel.supportGap', { demands: CLIMATE_SUPPORT.demandsAction }))}
              </p>
              <p className="mt-2 text-[10px] text-slate-600">
                <a
                  href={CLIMATE_SUPPORT.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 transition hover:text-slate-400"
                >
                  {CLIMATE_SUPPORT.source}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </p>
            </section>

            <section className="mt-7 border-t border-white/10 pt-5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {t('actionsPanel.multipliersHeading')}
              </h3>
              <p className="mb-4 mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-400">
                {t('actionsPanel.multipliersIntro')}
              </p>
              <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {MULTIPLIERS.map((id) => {
                  const text = multiplierText(id, locale);
                  return (
                    <article key={id}>
                      <h4 className="text-sm font-medium text-slate-100">{text.name}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{text.note}</p>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionRow({
  action,
  locale,
  decimal,
}: {
  action: ClimateAction;
  locale: Locale;
  decimal: (v: number, digits?: number) => string;
}) {
  const { t } = useI18n();
  const text = actionText(action.id, locale);
  const pct = (v: number) => (v / REFERENCES.worldPerCapita) * 100;

  return (
    <article>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm text-slate-100">{text.name}</span>
        {action.advised && (
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px]"
            style={{ color: ADVISED_COLOR, background: `${ADVISED_COLOR}1f` }}
          >
            {t('actionsPanel.advisedBadge')}
          </span>
        )}
        <span className="ml-auto shrink-0 font-mono text-sm font-semibold tabular-nums text-white">
          {decimal(action.saves, action.saves < 1 ? 2 : 1)}
        </span>
        <span className="shrink-0 text-[10px] text-slate-600">{t('actionsPanel.savesUnit')}</span>
      </div>

      {/* La traccia è lunga quanto una persona media del mondo: la barra più
          lunga della lista non arriva a metà, ed è il punto. */}
      <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="absolute inset-y-0 left-0 rounded-r-[3px]"
          style={{
            width: `max(2px, ${pct(action.saves)}%)`,
            background: action.advised ? ADVISED_COLOR : BAR_COLOR,
          }}
        />
        <div
          className="absolute inset-y-0 w-px bg-white/40"
          style={{ left: `${pct(REFERENCES.fairShare)}%` }}
          aria-hidden
        />
      </div>

      <p className="mt-1.5 max-w-3xl text-[11px] leading-relaxed text-slate-500">{text.note}</p>
    </article>
  );
}

/**
 * Cosa c'è nel piatto: la scatola che la riga «dieta vegetale» lascia chiusa.
 *
 * Le barre sono impilate per fase della filiera, e la fase che conta guardare
 * è il **trasporto**: è una scheggia in quasi tutte, mentre uso del suolo e
 * allevamento sono quasi tutto. È il modo più diretto per smontare il «mangia
 * locale» — non dicendolo, facendolo vedere.
 */
function FoodSection() {
  const { locale, t } = useI18n();
  const [data, setData] = useState<FoodData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadFood()
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  const max = data?.foods[0]?.kg ?? 1;

  return (
    <section className="mt-7 border-t border-white/10 pt-5">
      <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {t('actionsPanel.foodHeading')}
      </h3>
      <p className="mb-4 mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-400">
        {t('actionsPanel.foodIntro')}
      </p>

      {failed ? (
        <p className="text-xs text-slate-500">
          {t('actionsPanel.foodUnavailable')}{' '}
          <code className="font-mono text-slate-400">npm run data:food</code>.
        </p>
      ) : !data ? (
        <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t('actionsPanel.foodLoading')}
        </div>
      ) : (
        <>
          <div className="max-w-3xl space-y-2">
            {data.foods.map((food) => (
              <div key={food.name}>
                <div className="flex items-baseline gap-2 text-xs">
                  <span className="min-w-0 flex-1 truncate text-slate-200">
                    {foodName(food.name, locale)}
                  </span>
                  {food.land !== null && (
                    <span className="hidden shrink-0 text-[10px] text-slate-600 sm:inline">
                      {t('actionsPanel.foodLandLabel', {
                        value: food.land.toLocaleString(LOCALE_TAG[locale]),
                      })}
                    </span>
                  )}
                  <span className="w-14 shrink-0 text-right font-mono font-semibold tabular-nums text-white">
                    {food.kg.toLocaleString(LOCALE_TAG[locale], { maximumFractionDigits: 1 })}
                  </span>
                </div>
                {/* Segmenti impilati con un distacco di 1px: le fasi sottili —
                    trasporto, imballaggio — resterebbero altrimenti invisibili
                    contro quella accanto. */}
                <div className="mt-1 flex h-1.5 gap-px overflow-hidden rounded-full bg-white/[0.06]">
                  {food.stages.map((value, i) =>
                    value <= 0 ? null : (
                      <span
                        key={data.meta.stages[i]}
                        title={`${stageName(data.meta.stages[i], locale)}: ${value}`}
                        style={{
                          width: `${(value / max) * 100}%`,
                          background: STAGE_COLORS[data.meta.stages[i]],
                        }}
                      />
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
            {data.meta.stages.map((stage) => (
              <span key={stage} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ background: STAGE_COLORS[stage] }}
                />
                {stageName(stage, locale)}
              </span>
            ))}
          </div>

          <p className="mt-3 max-w-3xl text-xs leading-relaxed text-slate-400">
            {emphasise(
              t('actionsPanel.foodTransportNote', {
                share: data.meta.medianTransportShare.toLocaleString(LOCALE_TAG[locale], {
                  maximumFractionDigits: 1,
                }),
              }),
            )}
          </p>
          <p className="mt-2 text-[10px] text-slate-600">
            <a
              href={data.meta.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 transition hover:text-slate-400"
            >
              {data.meta.source}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </p>
        </>
      )}
    </section>
  );
}
