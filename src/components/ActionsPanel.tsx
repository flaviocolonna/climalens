import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Loader2, Sparkles, X } from 'lucide-react';
import {
  ACTIONS,
  ACTIONS_SOURCE,
  MULTIPLIERS,
  REFERENCES,
  type ClimateAction,
} from '@/lib/actions';
import { CARBON_MAJORS } from '@/lib/producers';
import {
  applicability,
  buildProfile,
  FOOTPRINT_SOURCE,
  QUESTIONS,
  type Answers,
  type MissingReason,
  type QuestionId,
  type Profile,
} from '@/lib/footprint';
import { CARBON_BUDGET, CLIMATE_SUPPORT, yearsLeft } from '@/lib/future';
import { loadFood, type FoodData } from '@/lib/food';
import { STAGE_COLORS, foodName, stageName } from '@/i18n/content/food';
import { actionText, multiplierText } from '@/i18n/content/actions';
import { leverText, missingText, questionText } from '@/i18n/content/footprint';
import { emphasise } from '@/components/emphasise';
import { useI18n } from '@/i18n/LocaleProvider';
import { LOCALE_TAG, type Locale } from '@/i18n/locale';

/** Le azioni usano il rosso della mappa: è sempre CO₂, solo dalla parte di chi la evita. */
const BAR_COLOR = '#bf2621';

/** Le raccomandate, per distinguerle senza affidarsi al solo colore. */
const ADVISED_COLOR = '#8560c6';

/** Fuori rampa, come l'assorbimento netto sulla mappa: zero e un altro verso, non poco rosso. */
const NOTHING_LEFT_COLOR = '#308e63';

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

  /**
   * Le risposte vivono qui e basta: niente localStorage, niente URL. Sono sei
   * fatti sulla vita di chi legge, e l'unico posto in cui questa app non ha
   * nessun motivo di conservarli è tutti quanti.
   */
  const [answers, setAnswers] = useState<Answers>({});
  const profile = useMemo(() => buildProfile(answers), [answers]);
  const excluded = useMemo(() => applicability(answers), [answers]);
  // Ricliccare l'opzione già scelta la toglie: una risposta data per sbaglio a
  // una domanda sulla propria vita deve potersi ritirare, non solo cambiare.
  const answer = useCallback(
    (question: QuestionId, option: string) =>
      setAnswers((prev) => ({ ...prev, [question]: prev[question] === option ? undefined : option })),
    [],
  );

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
            <YourNumber
              answers={answers}
              profile={profile}
              onAnswer={answer}
              onReset={() => setAnswers({})}
              decimal={decimal}
            />

            <h3 className="mt-8 border-t border-white/10 pt-5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
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

            {profile.answered > 0 && (
              <p className="mb-4 max-w-3xl text-[11px] leading-relaxed text-slate-500">
                {t('actionsPanel.rankingProfileNote')}
              </p>
            )}

            <div className="space-y-3">
              {ACTIONS.map((a) => (
                <ActionRow
                  key={a.id}
                  action={a}
                  locale={locale}
                  decimal={decimal}
                  excluded={excluded[a.id]}
                />
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

/**
 * Il tuo numero: sei domande, e la classifica del mondo diventa la tua.
 *
 * Il pezzo che mancava al pannello. La lista qui sotto è vera per il pianeta e
 * inutile per la singola persona che non ha l'auto e legge «vivere senza auto»
 * al primo posto. Queste sei righe non stimano quanto emetti — sarebbe una
 * cifra con due decimali e un errore del trenta per cento — ma **quali leve hai
 * davvero in mano**, e in che ordine.
 *
 * Tre scelte che la tengono onesta:
 *
 *   - Il risultato non appare finché non ci sono tutte e sei le risposte: con
 *     tre su sei il totale sarebbe più basso e sembrerebbe una buona notizia.
 *   - Le leve che non ti riguardano restano scritte, con il perché. «Non hai
 *     l'auto» non è un buco nel questionario, è metà del risultato.
 *   - L'ultima leva non ha tonnellate, e la scritta accanto dice che è
 *     deliberato. È la tesi del pannello, e qui arriva alla persona giusta nel
 *     momento in cui ha appena finito di contare le proprie.
 */
function YourNumber({
  answers,
  profile,
  onAnswer,
  onReset,
  decimal,
}: {
  answers: Answers;
  profile: Profile;
  onAnswer: (question: QuestionId, option: string) => void;
  onReset: () => void;
  decimal: (v: number, digits?: number) => string;
}) {
  const { locale, t } = useI18n();
  const complete = profile.answered === QUESTIONS.length;
  const numeric = profile.levers.filter((l) => l.tonnes !== null);
  const top = numeric[0] ?? null;
  // La stessa traccia della classifica qui sotto — una persona media del mondo —
  // e non il massimo di questa lista. Due grafici a barre dello stesso colore
  // nella stessa pagina, con due scale diverse, si leggono l'uno contro l'altro
  // e sbagliano: la leva più grande di chi ha poche leve riempirebbe la riga.
  const pct = (v: number) => (v / REFERENCES.worldPerCapita) * 100;

  return (
    <section>
      <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {t('actionsPanel.yourHeading')}
      </h3>
      <p className="mb-1.5 mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-400">
        {t('actionsPanel.yourIntro')}
      </p>
      <p className="mb-4 max-w-3xl text-[11px] leading-relaxed text-slate-600">
        {t('actionsPanel.yourPrivacy')}
      </p>

      <div className="max-w-3xl space-y-3.5">
        {QUESTIONS.map((question) => {
          const text = questionText(question.id, locale);
          return (
            <fieldset key={question.id}>
              <legend className="mb-1.5 text-xs text-slate-300">{text.prompt}</legend>
              <div className="flex flex-wrap gap-1.5">
                {question.options.map((option) => {
                  const active = answers[question.id] === option;
                  return (
                    <button
                      key={option}
                      onClick={() => onAnswer(question.id, option)}
                      aria-pressed={active}
                      className={`rounded-md border px-2.5 py-1 text-[11px] transition ${
                        active
                          ? 'border-sky-400/40 bg-sky-500/15 text-sky-200'
                          : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                      }`}
                    >
                      {text.options[option]}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
        <span className="font-mono tabular-nums">
          {t('actionsPanel.yourProgress', {
            answered: profile.answered,
            total: QUESTIONS.length,
          })}
        </span>
        {profile.answered > 0 && (
          <button
            onClick={onReset}
            className="underline-offset-2 transition hover:text-slate-400 hover:underline"
          >
            {t('actionsPanel.yourReset')}
          </button>
        )}
        {!complete && <span>{t('actionsPanel.yourIncomplete')}</span>}
      </div>

      {complete && (
        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {/* Lo zero non prende il rosso d'allarme: chi non ha piu niente da
                tirare non va sgridato con il colore. Stessa logica del layer
                delle emissioni, dove il verso opposto esce dalla rampa. */}
            <span
              className="font-mono text-5xl font-bold leading-none tracking-tight"
              style={{ color: profile.total > 0 ? BAR_COLOR : NOTHING_LEFT_COLOR }}
            >
              {decimal(profile.total)}
            </span>
            <span className="text-sm text-slate-300">{t('actionsPanel.yourUnit')}</span>
            <span className="text-xs text-slate-500">{t('actionsPanel.yourTotalLabel')}</span>
          </div>
          {profile.total === 0 && (
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-300">
              {emphasise(t('actionsPanel.yourNothingLeft'))}
            </p>
          )}
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-400">
            {t('actionsPanel.yourCompare', {
              fair: decimal(REFERENCES.fairShare),
              world: decimal(REFERENCES.worldPerCapita),
              year: REFERENCES.worldYear,
            })}
          </p>
          {/* Le barre qui sotto sono lunghe quanto quelle della classifica, e
              portano lo stesso trattino: senza dirlo, un trattino verticale in
              mezzo a una barra non spiega niente. */}
          {numeric.length > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="h-3 w-px bg-white/40" />
              {t('actionsPanel.refFairShare')} · {decimal(REFERENCES.fairShare)}{' '}
              {t('actionsPanel.savesUnit')}
            </p>
          )}
          {top && top.tonnes !== null && profile.total > 0 && (
            <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-300">
              {emphasise(
                t('actionsPanel.yourTopLine', {
                  name: leverText(top.id, locale).name,
                  share: Math.round((top.tonnes / profile.total) * 100),
                }),
              )}
            </p>
          )}

          <div className="mt-4 space-y-3">
            {profile.levers.map((lever) => {
              const text = leverText(lever.id, locale);
              return (
                <article key={lever.id}>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-sm text-slate-100">{text.name}</span>
                    {lever.tonnes === null ? (
                      <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wider text-slate-500">
                        {t('actionsPanel.yourNoNumber')}
                      </span>
                    ) : (
                      <>
                        <span className="ml-auto shrink-0 font-mono text-sm font-semibold tabular-nums text-white">
                          {decimal(lever.tonnes, lever.tonnes < 1 ? 2 : 1)}
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-600">
                          {t('actionsPanel.savesUnit')}
                        </span>
                      </>
                    )}
                  </div>
                  {/* La leva senza numero non prende una barra lunga zero, che
                      si leggerebbe come «non vale niente»: prende un filo
                      verticale, che è un'altra cosa. */}
                  {lever.tonnes === null ? (
                    <div
                      className="mt-1 h-1.5 border-l-2 border-dashed border-white/25"
                      aria-hidden
                    />
                  ) : (
                    <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="absolute inset-y-0 left-0 rounded-r-[3px]"
                        style={{
                          width: `max(2px, ${pct(lever.tonnes)}%)`,
                          background: BAR_COLOR,
                        }}
                      />
                      <div
                        className="absolute inset-y-0 w-px bg-white/40"
                        style={{ left: `${pct(REFERENCES.fairShare)}%` }}
                        aria-hidden
                      />
                    </div>
                  )}
                  <p className="mt-1.5 max-w-3xl text-[11px] leading-relaxed text-slate-500">
                    {text.note}
                  </p>
                </article>
              );
            })}
          </div>

          {profile.missing.length > 0 && (
            <div className="mt-5 border-t border-white/5 pt-3.5">
              <h4 className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                {t('actionsPanel.yourMissingHeading')}
              </h4>
              <ul className="mt-2 space-y-1.5">
                {profile.missing.map((m) => {
                  const line = missingText(m.id, m.reason, locale);
                  return line ? (
                    <li
                      key={`${m.id}-${m.reason}`}
                      className="text-[11px] leading-relaxed text-slate-500"
                    >
                      {line}
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          )}

          <p className="mt-4 max-w-3xl border-t border-white/5 pt-3 text-[11px] leading-relaxed text-slate-500">
            {emphasise(t('actionsPanel.yourCaveat'))}{' '}
            {t('actionsPanel.yourTopTen', { total: decimal(FOOTPRINT_SOURCE.topTenTotal) })}
          </p>
          <p className="mt-2 text-[10px] text-slate-600">
            <a
              href={FOOTPRINT_SOURCE.primaryUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 transition hover:text-slate-400"
            >
              {FOOTPRINT_SOURCE.primary}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </p>
        </div>
      )}
    </section>
  );
}

function ActionRow({
  action,
  locale,
  decimal,
  excluded,
}: {
  action: ClimateAction;
  locale: Locale;
  decimal: (v: number, digits?: number) => string;
  /** Perché il profilo esclude questa riga, o `undefined` se ti riguarda. */
  excluded?: MissingReason;
}) {
  const { t } = useI18n();
  const text = actionText(action.id, locale);
  const pct = (v: number) => (v / REFERENCES.worldPerCapita) * 100;

  return (
    // Spenta, non nascosta: che vivere senza auto valga 2,4 t resta vero anche
    // per chi l'auto non ce l'ha, e toglierle la riga gliela nasconderebbe.
    <article className={excluded ? 'opacity-40' : undefined}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm text-slate-100">{text.name}</span>
        {excluded && (
          <span className="rounded-full border border-white/15 px-1.5 py-0.5 text-[10px] text-slate-400">
            {t(
              excluded === 'alreadyDone'
                ? 'actionsPanel.badgeAlreadyDone'
                : 'actionsPanel.badgeNotApplicable',
            )}
          </span>
        )}
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
