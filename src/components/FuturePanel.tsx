import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, TrendingUp, X } from 'lucide-react';
import { SCENARIOS, SCENARIOS_SOURCE, type Scenario } from '@/lib/future';
import { LCOE_TECHS, changePct, loadProgress, type ProgressData } from '@/lib/progress';
import { useI18n } from '@/i18n/LocaleProvider';
import { LOCALE_TAG, type Locale } from '@/i18n/locale';

/**
 * Il colore degli scenari viene dalla rampa delle anomalie: lo stesso verso
 * che la mappa usa per i gradi, così 4,4 °C qui e 4,4 °C là si somigliano.
 */
const SCENARIO_COLOR: Record<string, string> = {
  ssp119: '#60b6ec',
  ssp126: '#9ed6f5',
  ssp245: '#fab04a',
  ssp370: '#ef7230',
  ssp585: '#d62d28',
};

/** Le etichette, esplicite: costruire la chiave a pezzi dal nome tecnico
 * risparmiava cinque righe e rompeva in silenzio al primo rinominamento. */
const SCENARIO_LABEL: Record<string, string> = {
  ssp119: 'futurePanel.scenarioSsp119',
  ssp126: 'futurePanel.scenarioSsp126',
  ssp245: 'futurePanel.scenarioSsp245',
  ssp370: 'futurePanel.scenarioSsp370',
  ssp585: 'futurePanel.scenarioSsp585',
};

const LCOE_LABEL: Record<string, string> = {
  solar_photovoltaic: 'futurePanel.lcoeSolar',
  onshore_wind: 'futurePanel.lcoeOnshore',
  offshore_wind: 'futurePanel.lcoeOffshore',
  hydropower: 'futurePanel.lcoeHydro',
  geothermal: 'futurePanel.lcoeGeothermal',
};

/** Massimo dell'asse: sopra i 6 °C non c'è nessuno scenario da mostrare. */
const AXIS_MAX = 6;

interface Props {
  onClose: () => void;
}

/**
 * L'unica parte dell'app che guarda avanti.
 *
 * Due sezioni, e l'ordine conta: prima il bivio (dove porta questa strada),
 * poi quello che sta già funzionando. Al contrario, la seconda sembrerebbe una
 * consolazione dopo la brutta notizia; così com'è, è la risposta alla domanda
 * che il bivio lascia aperta — si può ancora cambiare strada?
 */
export function FuturePanel({ onClose }: Props) {
  const { locale, t } = useI18n();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    loadProgress()
      .then(setProgress)
      .catch(() => setFailed(true));
  }, []);

  const n = (v: number, digits = 0) =>
    v.toLocaleString(LOCALE_TAG[locale], {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('futurePanel.heading')}
      className="fixed inset-0 z-50 flex flex-col bg-ink-950/95 backdrop-blur-xl animate-fade-up"
    >
      <header className="shrink-0 border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <TrendingUp className="h-5 w-5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight text-white">
              {t('futurePanel.heading')}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-400">{t('futurePanel.subheading')}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
            {t('futurePanel.close')}
            <kbd className="hidden rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline">
              esc
            </kbd>
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl space-y-9 px-5 py-7 sm:px-8">
          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {t('futurePanel.scenariosHeading')}
            </h3>
            <p className="mb-5 mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-400">
              {t('futurePanel.scenariosIntro')}
            </p>

            <div className="space-y-4">
              {SCENARIOS.map((s) => (
                <ScenarioRow key={s.id} scenario={s} locale={locale} />
              ))}
            </div>

            <p className="mt-4 max-w-3xl text-[10px] leading-relaxed text-slate-600">
              {t('futurePanel.scenariosBaseline', { baseline: SCENARIOS_SOURCE.baseline })}{' '}
              {t('futurePanel.scenariosInterpolated')}{' '}
              <a
                href={SCENARIOS_SOURCE.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition hover:text-slate-400"
              >
                {SCENARIOS_SOURCE.name}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
          </section>

          <section className="border-t border-white/10 pt-7">
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {t('futurePanel.workingHeading')}
            </h3>
            <p className="mb-5 mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-400">
              {t('futurePanel.workingIntro')}
            </p>

            {failed ? (
              <p className="text-xs text-slate-500">
                {t('futurePanel.unavailable')}{' '}
                <code className="font-mono text-slate-400">npm run data:progress</code>.
              </p>
            ) : !progress ? (
              <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t('futurePanel.loading')}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-5xl font-bold leading-none tracking-tight text-[#2f7d5b]">
                    −{n(progress.meta.solarPriceDropPct, 1)}%
                  </span>
                  <span className="text-sm text-slate-300">{t('futurePanel.solarHeadline')}</span>
                </div>
                <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-400">
                  {t('futurePanel.solarCaption', {
                    fromYear: progress.meta.solarPriceFrom[0],
                    toYear: progress.meta.solarPriceTo[0],
                    fromCost: n(progress.meta.solarPriceFrom[1], 2),
                    toCost: n(progress.meta.solarPriceTo[1], 2),
                  })}
                </p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <p>
                    {t('futurePanel.capacityLine', {
                      fromYear: progress.series.solarCapacity[0][0],
                      fromValue: n(progress.series.solarCapacity[0][1], 1),
                      toYear: progress.series.solarCapacity[progress.series.solarCapacity.length - 1][0],
                      toValue: n(
                        progress.series.solarCapacity[progress.series.solarCapacity.length - 1][1],
                      ),
                    })}
                  </p>
                  <p>
                    {t('futurePanel.shareLine', {
                      year: progress.series.renewableShare[progress.series.renewableShare.length - 1][0],
                      value: n(
                        progress.series.renewableShare[progress.series.renewableShare.length - 1][1],
                        1,
                      ),
                    })}
                  </p>
                </div>

                <h4 className="mt-6 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  {t('futurePanel.lcoeHeading')}
                </h4>
                <p className="mb-3 mt-1 text-[10px] text-slate-600">
                  {t('futurePanel.lcoeCaption')}
                </p>
                <div className="max-w-3xl space-y-2">
                  {LCOE_TECHS.map((tech) => {
                    const range = progress.lcoe[tech];
                    if (!range) return null;
                    const delta = changePct(range);
                    const label = t(LCOE_LABEL[tech]);
                    return (
                      <div key={tech} className="flex items-baseline gap-2 text-xs">
                        <span className="min-w-0 flex-1 truncate text-slate-300">{label}</span>
                        <span className="shrink-0 font-mono tabular-nums text-slate-500">
                          {range.first[0]}: {n(range.first[1], 3)}
                        </span>
                        <span className="shrink-0 text-slate-600">→</span>
                        <span className="w-16 shrink-0 text-right font-mono tabular-nums text-slate-200">
                          {n(range.last[1], 3)}
                        </span>
                        <span
                          className="w-14 shrink-0 text-right font-mono text-[11px] font-semibold tabular-nums"
                          style={{ color: delta < 0 ? '#2f7d5b' : '#bf2621' }}
                        >
                          {delta > 0 ? '+' : '−'}
                          {n(Math.abs(delta))}%
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 max-w-3xl text-[11px] leading-relaxed text-slate-500">
                  {t('futurePanel.lcoeRose')}
                </p>
                <p className="mt-2 text-[10px] text-slate-600">
                  <a
                    href={progress.meta.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 transition hover:text-slate-400"
                  >
                    {progress.meta.source}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </p>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ScenarioRow({ scenario, locale }: { scenario: Scenario; locale: Locale }) {
  const { t } = useI18n();
  const color = SCENARIO_COLOR[scenario.id];
  const end = scenario.points[scenario.points.length - 1];
  const pct = (v: number) => Math.min(100, (v / AXIS_MAX) * 100);
  const decimal = (v: number) =>
    v.toLocaleString(LOCALE_TAG[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <article>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-mono text-sm font-medium text-slate-100">{scenario.code}</span>
        <span className="text-[11px] text-slate-500">
          {t(SCENARIO_LABEL[scenario.id])}
        </span>
        <span className="ml-auto shrink-0 font-mono text-sm font-semibold tabular-nums text-white">
          {decimal(end.best)} °C
        </span>
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-600">
          {decimal(end.low)}–{decimal(end.high)}
        </span>
      </div>

      {/* La banda è l'intervallo molto probabile a fine secolo, il segno è la
          stima migliore: disegnare solo il secondo darebbe una precisione che
          l'IPCC non rivendica. */}
      <div className="relative mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="absolute inset-y-0 rounded-sm opacity-35"
          style={{
            left: `${pct(end.low)}%`,
            width: `${pct(end.high) - pct(end.low)}%`,
            background: color,
          }}
        />
        <div
          className="absolute inset-y-0 w-[3px] rounded-sm"
          style={{ left: `calc(${pct(end.best)}% - 1.5px)`, background: color }}
        />
      </div>

      <div className="mt-1 flex gap-4 text-[10px] text-slate-600">
        {scenario.points.map((p) => (
          <span key={p.from} className="font-mono tabular-nums">
            {p.from}–{p.to}: {decimal(p.best)}
          </span>
        ))}
      </div>
    </article>
  );
}
