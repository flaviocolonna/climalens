import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, Waves, X } from 'lucide-react';
import {
  ATTRIBUTION_DB,
  EVENTS,
  SEA_2100,
  SEA_FACTS,
  SEA_PROJECTION_BASELINE,
  SEA_RATES,
  SEA_SOURCE,
  STUDIES_BY_REGION,
  loadConsequences,
  type AttributedEvent,
  type ConsequencesData,
} from '@/lib/consequences';
import { eventText, eventTypeName, regionName } from '@/i18n/content/consequences';
import { emphasise } from '@/components/emphasise';
import { useI18n } from '@/i18n/LocaleProvider';
import { LOCALE_TAG } from '@/i18n/locale';

/** Il rosso della mappa: qui è il mare che sale, ma è la stessa causa. */
const BAR_COLOR = '#bf2621';
/** Fuori rampa, per la parte già decisa: non è «più rosso», è un'altra cosa. */
const COMMITTED_COLOR = '#8560c6';

interface Props {
  onClose: () => void;
  /** Apre l'evento sulla mappa: il pannello si chiude e il punto si seleziona. */
  onOpenEvent: (event: AttributedEvent) => void;
}

/**
 * Cosa fa il riscaldamento.
 *
 * Il resto dell'app misura la causa. Questa schermata è l'unica che misura
 * l'effetto, e risponde a due obiezioni diverse con due metà diverse.
 *
 * A sinistra **il mare**, per chi lo considera una faccenda del 2100: sale da
 * un secolo, è misurato, accelera, e una parte è già decisa a prescindere da
 * quello che si sceglie adesso. Sotto, chi ci vive accanto — dove la classifica
 * per popolazione e quella per superficie divergono, e la divergenza è la
 * notizia.
 *
 * A destra **gli eventi attribuiti**, per chi dice che il maltempo c'è sempre
 * stato: non «il clima cambia», ma quel giorno, lì, e quante volte più
 * probabile è diventato. Ogni riga si apre sulla mappa, che è il solo modo di
 * far atterrare un elenco su un luogo.
 *
 * In fondo a destra la sezione più scomoda: **dove guarda la ricerca**. Non è
 * una mappa di dove succedono gli estremi, è una mappa di dove si studiano, e
 * le due divergono nel verso peggiore.
 */
export function ConsequencesPanel({ onClose, onOpenEvent }: Props) {
  const { locale, t } = useI18n();
  const [data, setData] = useState<ConsequencesData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    loadConsequences()
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  const decimal = (v: number, digits = 1) =>
    v.toLocaleString(LOCALE_TAG[locale], {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('consequences.heading')}
      className="fixed inset-0 z-50 flex flex-col bg-ink-950/95 backdrop-blur-xl animate-fade-up"
    >
      <header className="shrink-0 border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Waves className="h-5 w-5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight text-white">
              {t('consequences.heading')}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {t('consequences.subheading')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
            {t('consequences.close')}
            <kbd className="hidden rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline">
              esc
            </kbd>
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-9 px-5 py-7 sm:px-8 lg:grid-cols-2">
          <div className="min-w-0 space-y-8">
            <SeaSection data={data} failed={failed} decimal={decimal} />
            <ExposureSection data={data} decimal={decimal} />
          </div>

          <div className="min-w-0 space-y-8">
            <EventsSection onOpenEvent={onOpenEvent} />
            <ResearchSection />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function SeaSection({
  data,
  failed,
  decimal,
}: {
  data: ConsequencesData | null;
  failed: boolean;
  decimal: (v: number, digits?: number) => string;
}) {
  const { locale, t } = useI18n();

  return (
    <section>
      <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {t('consequences.seaHeading')}
      </h3>
      <p className="mb-4 mt-1.5 text-xs leading-relaxed text-slate-400">
        {emphasise(
          t('consequences.seaIntro', {
            cm: SEA_FACTS.risenCm,
            years: SEA_FACTS.unprecedentedYears.toLocaleString(LOCALE_TAG[locale]),
          }),
        )}
      </p>

      {failed ? (
        <p className="text-xs text-slate-500">
          {t('consequences.unavailable')}{' '}
          <code className="font-mono text-slate-400">npm run data:consequences</code>.
        </p>
      ) : !data ? (
        <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t('consequences.loading')}
        </div>
      ) : (
        <>
          <SeaChart series={data.sea} />
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">
            {t('consequences.seaChartNote', {
              from: data.meta.seaFrom,
              to: data.meta.seaTo,
              baseline: data.meta.seaBaseline,
            })}{' '}
            <a
              href={data.meta.seaSourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 transition hover:text-slate-400"
            >
              {data.meta.seaSource}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </p>
        </>
      )}

      {/* L'accelerazione detta in cifre, perché su un grafico lungo 140 anni si
          vede come una curva e si legge come «sale», che è metà del fatto. */}
      <h4 className="mt-5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {t('consequences.ratesHeading')}
      </h4>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
        {SEA_RATES.map((rate) => (
          <div key={rate.from}>
            <div className="font-mono text-lg font-semibold leading-none tabular-nums text-white">
              {decimal(rate.mmPerYear)}
            </div>
            <div className="mt-1 text-[10px] text-slate-500">
              {t('consequences.ratesUnit')}
              <br />
              {rate.from}–{rate.to}
            </div>
          </div>
        ))}
      </div>

      <h4 className="mt-6 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {t('consequences.projectionHeading')}
      </h4>
      <p className="mb-3 mt-1.5 text-xs leading-relaxed text-slate-400">
        {t('consequences.projectionIntro', { baseline: SEA_PROJECTION_BASELINE })}
      </p>
      <div className="space-y-2.5">
        {SEA_2100.map((p) => (
          <div key={p.id}>
            <div className="flex items-baseline gap-2 text-xs">
              <span className="w-20 shrink-0 font-mono text-[11px] text-slate-300">{p.code}</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-white">
                {decimal(p.median, 2)}
              </span>
              <span className="text-[10px] text-slate-600">
                {t('consequences.metres')} · {decimal(p.low, 2)}–{decimal(p.high, 2)}
              </span>
            </div>
            {/* La barra piena è la mediana, il tratto chiaro l'intervallo
                probabile: una barra sola spaccerebbe una stima per una misura. */}
            <div className="relative ml-[5.5rem] mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="absolute inset-y-0 rounded-[3px] bg-white/20"
                style={{ left: `${(p.low / 1.1) * 100}%`, width: `${((p.high - p.low) / 1.1) * 100}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-r-[3px]"
                style={{ width: `${(p.median / 1.1) * 100}%`, background: BAR_COLOR }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Il pezzo che non dipende più da niente di quello che si decide ora. */}
      <div
        className="mt-5 rounded-lg border-l-2 bg-white/[0.02] px-3.5 py-3"
        style={{ borderColor: COMMITTED_COLOR }}
      >
        <p className="text-xs leading-relaxed text-slate-300">
          {emphasise(
            t('consequences.commitment', {
              degrees: SEA_FACTS.commitmentAtC.toLocaleString(LOCALE_TAG[locale], {
                minimumFractionDigits: 1,
              }),
              low: SEA_FACTS.commitmentLowM,
              high: SEA_FACTS.commitmentHighM,
              years: SEA_FACTS.commitmentYears.toLocaleString(LOCALE_TAG[locale]),
            }),
          )}
        </p>
      </div>
      <p className="mt-2 text-[10px] text-slate-600">
        <a
          href={SEA_SOURCE.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 transition hover:text-slate-400"
        >
          {SEA_SOURCE.name}
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </p>
    </section>
  );
}

/**
 * Il grafico è disegnato a mano e non con la libreria che usa il pannello di un
 * luogo: quella pesa 160KB compressi e vive in un pezzo caricato a parte, e
 * tirarla dentro una schermata della barra la farebbe scaricare a chiunque
 * apra questa. Una polilinea su 141 punti non ha bisogno di aiuto.
 */
function SeaChart({ series }: { series: Array<[number, number]> }) {
  const { t } = useI18n();
  const W = 100;
  const H = 34;
  const years = series.map(([y]) => y);
  const values = series.map(([, v]) => v);
  const minYear = years[0];
  const maxYear = years[years.length - 1];
  const min = Math.min(...values);
  const max = Math.max(...values);

  const x = (year: number) => ((year - minYear) / (maxYear - minYear)) * W;
  const y = (value: number) => H - ((value - min) / (max - min)) * H;

  const line = series.map(([yr, v], i) => `${i ? 'L' : 'M'}${x(yr).toFixed(2)},${y(v).toFixed(2)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  const zero = y(0);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={t('consequences.seaChartAria')}
      className="h-28 w-full"
    >
      {/* Lo zero della serie non è il livello «naturale» del mare: è la media
          del periodo di riferimento, e la riga tratteggiata lo ricorda. */}
      <line
        x1="0"
        x2={W}
        y1={zero}
        y2={zero}
        stroke="rgba(226,232,240,0.25)"
        strokeWidth="0.3"
        strokeDasharray="1.5 1.5"
        vectorEffect="non-scaling-stroke"
      />
      <path d={area} fill={BAR_COLOR} fillOpacity="0.16" />
      <path
        d={line}
        fill="none"
        stroke={BAR_COLOR}
        strokeWidth="1.4"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------

function ExposureSection({
  data,
  decimal,
}: {
  data: ConsequencesData | null;
  decimal: (v: number, digits?: number) => string;
}) {
  const { t } = useI18n();
  if (!data) return null;

  return (
    <section className="border-t border-white/10 pt-6">
      <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {t('consequences.exposureHeading')}
      </h3>
      <p className="mb-3 mt-1.5 text-xs leading-relaxed text-slate-400">
        {emphasise(t('consequences.exposureIntro'))}
      </p>

      <div className="space-y-1.5">
        {data.exposed.map((country) => (
          <div key={country.iso} className="flex items-center gap-2 text-xs">
            <span className="w-36 shrink-0 truncate text-slate-200">{country.name}</span>
            {/* La barra sono le persone; la tacca chiara è la **superficie**.
                Disegnare anche la superficie come barra dietro sembrava più
                ricco e non lo era: dove la terra bassa è poca e la gente tanta
                — Guyana, 5% di territorio e 78% di abitanti — la barra dietro
                spariva sotto quella davanti, cioè proprio nei casi che questa
                sezione esiste per mostrare. Una tacca resta visibile sempre. */}
            <span className="relative h-3 min-w-0 flex-1 overflow-hidden rounded-[3px] bg-white/[0.06]">
              <span
                className="absolute inset-y-0 left-0 rounded-r-[2px]"
                style={{ width: `max(2px, ${country.population}%)`, background: BAR_COLOR }}
              />
              {country.land !== null && (
                <span
                  className="absolute inset-y-0 w-0.5 bg-white/70"
                  style={{ left: `${country.land}%` }}
                />
              )}
            </span>
            <span className="w-11 shrink-0 text-right font-mono tabular-nums text-white">
              {decimal(country.population)}%
            </span>
          </div>
        ))}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm" style={{ background: BAR_COLOR }} />
          {t('consequences.exposurePeople')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-white/70" />
          {t('consequences.exposureLand')}
        </span>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
        {t('consequences.exposureNote', {
          year: data.meta.exposureYears.join(', '),
          coverage: data.meta.exposureCoverage,
        })}{' '}
        <a
          href={data.meta.exposureSourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 transition hover:text-slate-400"
        >
          {data.meta.exposureSource}
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------

function EventsSection({ onOpenEvent }: { onOpenEvent: (event: AttributedEvent) => void }) {
  const { locale, t } = useI18n();

  return (
    <section>
      <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {t('consequences.eventsHeading')}
      </h3>
      <p className="mb-4 mt-1.5 text-xs leading-relaxed text-slate-400">
        {emphasise(t('consequences.eventsIntro'))}
      </p>

      <ol className="space-y-3.5">
        {EVENTS.map((event) => {
          const text = eventText(event.id, locale);
          return (
            <li key={event.id}>
              <button
                onClick={() => onOpenEvent(event)}
                className="group w-full rounded-lg border border-white/5 bg-white/[0.02] px-3.5 py-3 text-left transition hover:border-white/15 hover:bg-white/[0.04]"
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-mono text-sm font-semibold tabular-nums text-white">
                    {event.year}
                  </span>
                  <span className="text-sm text-slate-100 transition group-hover:text-white">
                    {text.place}
                  </span>
                  <span className="ml-auto shrink-0 rounded-full border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-400">
                    {eventTypeName(event.type, locale)}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{text.what}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  {emphasise(text.finding)}
                </p>
                <p className="mt-1.5 text-[10px] text-slate-600">{event.source}</p>
              </button>
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 px-3.5 text-[10px] text-slate-600 transition hover:text-slate-400"
              >
                {t('consequences.readStudy')}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        {t('consequences.eventsClickHint')}
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------

function ResearchSection() {
  const { locale, t } = useI18n();
  const max = STUDIES_BY_REGION[0].studies;
  const number = (v: number) => v.toLocaleString(LOCALE_TAG[locale]);

  return (
    <section className="border-t border-white/10 pt-6">
      <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {t('consequences.researchHeading')}
      </h3>
      <p className="mb-3 mt-1.5 text-xs leading-relaxed text-slate-400">
        {emphasise(
          t('consequences.researchIntro', {
            total: number(ATTRIBUTION_DB.total),
            moreLikely: number(ATTRIBUTION_DB.moreLikely),
            noInfluence: number(ATTRIBUTION_DB.noInfluence),
            lessLikely: number(ATTRIBUTION_DB.lessLikely),
          }),
        )}
      </p>

      <div className="space-y-1.5">
        {STUDIES_BY_REGION.map((region) => (
          <div key={region.id} className="flex items-center gap-2 text-xs">
            <span className="w-44 shrink-0 truncate text-slate-300">
              {regionName(region.id, locale)}
            </span>
            <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <span
                className="block h-full rounded-r-[3px] bg-slate-500"
                style={{ width: `max(2px, ${(region.studies / max) * 100}%)` }}
              />
            </span>
            <span className="w-8 shrink-0 text-right font-mono tabular-nums text-slate-300">
              {region.studies}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        {emphasise(t('consequences.researchGap'))}
      </p>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
        {t('consequences.researchNote', { counted: ATTRIBUTION_DB.countedOn })}{' '}
        <a
          href={ATTRIBUTION_DB.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 transition hover:text-slate-400"
        >
          {ATTRIBUTION_DB.source}
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </p>
    </section>
  );
}
