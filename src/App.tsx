import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Compass, Loader2, MousePointerClick } from 'lucide-react';
import { ClimateMap } from '@/components/ClimateMap';
import { LayerControls } from '@/components/LayerControls';
import { NavBar } from '@/components/NavBar';
import { ActionsPanel } from '@/components/ActionsPanel';
import { BoundariesPanel } from '@/components/BoundariesPanel';
import { KnowledgePanel } from '@/components/KnowledgePanel';
import { Tour } from '@/components/Tour';
import { FuturePanel } from '@/components/FuturePanel';
import { SectorsPanel } from '@/components/SectorsPanel';
import { TimelineSlider } from '@/components/TimelineSlider';
import { loadClimateGrid, type ClimateGrid } from '@/lib/climateData';
import { loadCountryEmissions, type CountryEmissions } from '@/lib/countryEmissions';
import {
  isAdaptationMetric,
  isPledgeMetric,
  isPollutionMetric,
  resolveMetric,
  type AnyMetricId,
} from '@/lib/mapMetrics';
import { loadAdaptation, mergeAdaptation, type AdaptationTable } from '@/lib/adaptation';
import { loadPollution, mergeIntoCountries, type PollutionTable } from '@/lib/pollution';
import { loadPledges, mergePledges, type PledgeTable } from '@/lib/pledges';
import { placeSubtitle } from '@/lib/format';
import type { Place } from '@/lib/openMeteo';
import { readUrlState, writeUrlState, type PanelId } from '@/lib/urlState';
import { TOUR_STEPS, type TourStep } from '@/lib/tour';
import type { SelectedPlace } from '@/types';
import { useI18n } from '@/i18n/LocaleProvider';

/** Letto una volta sola: da qui in poi l'URL lo scrive l'app, non lo legge. */
const INITIAL = readUrlState();

/** L'URL si riscrive a scatti fermi: scorrere gli anni non deve martellarlo. */
const URL_WRITE_DELAY_MS = 250;

// Recharts is ~160KB gzipped and only needed once a place is opened.
const LocationPanel = lazy(() =>
  import('@/components/LocationPanel').then((m) => ({ default: m.LocationPanel })),
);

export default function App() {
  const { locale, t } = useI18n();
  const [grid, setGrid] = useState<ClimateGrid | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [place, setPlace] = useState<SelectedPlace | null>(INITIAL.place);
  const [panel, setPanel] = useState<PanelId | null>(INITIAL.panel);
  const [tourStep, setTourStep] = useState<number | null>(INITIAL.tour);
  const [metric, setMetric] = useState<AnyMetricId | null>(null);
  const [countries, setCountries] = useState<CountryEmissions | null>(null);
  const [pollution, setPollution] = useState<PollutionTable | null>(null);
  const [adaptation, setAdaptation] = useState<AdaptationTable | null>(null);
  const [pledges, setPledges] = useState<PledgeTable | null>(null);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadClimateGrid(controller.signal)
      .then((g) => {
        setGrid(g);
        // Open on the most recent year: the present is the point — a meno che
        // il link non chieda un anno preciso, e che quell'anno esista davvero.
        const asked = INITIAL.year;
        setYear(asked !== null && g.yearIndex(asked) >= 0 ? asked : g.meta.endYear);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setError(err.message);
      });
    return () => controller.abort();
  }, []);

  const handleSelectPlace = useCallback(
    (p: Place) => {
      setPlace({
        key: `geo-${p.id}`,
        name: p.name,
        subtitle: placeSubtitle(p.admin1, p.country) || t('app.placeFallback'),
        latitude: p.latitude,
        longitude: p.longitude,
        population: p.population,
        country: p.country,
        countryCode: p.countryCode,
      });
    },
    [t],
  );

  const handlePickPoint = useCallback(
    (lat: number, lon: number) => {
      setPlace({
        key: `pt-${lat.toFixed(3)}-${lon.toFixed(3)}`,
        name: t('app.unnamedPoint'),
        // The panel already prints the coordinates on their own line.
        subtitle: t('app.gridCellSubtitle', {
          latStep: Math.abs(grid?.meta.latStep ?? 2),
          lonStep: Math.abs(grid?.meta.lonStep ?? 2),
        }),
        latitude: lat,
        longitude: lon,
        isUnnamedPoint: true,
      });
    },
    [grid, t],
  );

  /**
   * I 210KB delle forme arrivano solo se qualcuno accende davvero un layer, e
   * i 16KB dell'inquinamento solo con la scheda che li usa: chi guarda la CO₂
   * non scarica il PM2.5 e viceversa.
   */
  const countriesRequested = useRef(false);
  const pollutionRequested = useRef(false);
  const adaptationRequested = useRef(false);
  const pledgesRequested = useRef(false);
  const handleMetricChange = useCallback((next: AnyMetricId | null) => {
    setMetric(next);
    if (!next) return;

    // I layer per paese sono fermi al loro anno di riferimento, e con loro
    // sparisce la linea del tempo: lasciare l'animazione accesa vorrebbe dire
    // far scorrere gli anni sotto una mappa che non li usa, e riconsegnare al
    // ritorno un anno diverso da quello che si era lasciato.
    setPlaying(false);

    if (!countriesRequested.current) {
      countriesRequested.current = true;
      setCountriesLoading(true);
      setCountriesError(null);
      loadCountryEmissions()
        .then(setCountries)
        .catch((err: Error) => {
          setCountriesError(err.message);
          countriesRequested.current = false; // un altro click riprova
        })
        .finally(() => setCountriesLoading(false));
    }

    if (isPollutionMetric(next) && !pollutionRequested.current) {
      pollutionRequested.current = true;
      loadPollution()
        .then(setPollution)
        .catch((err: Error) => {
          setCountriesError(err.message);
          pollutionRequested.current = false;
        });
    }

    if (isAdaptationMetric(next) && !adaptationRequested.current) {
      adaptationRequested.current = true;
      loadAdaptation()
        .then(setAdaptation)
        .catch((err: Error) => {
          setCountriesError(err.message);
          adaptationRequested.current = false;
        });
    }

    if (isPledgeMetric(next) && !pledgesRequested.current) {
      pledgesRequested.current = true;
      loadPledges()
        .then(setPledges)
        .catch((err: Error) => {
          setCountriesError(err.message);
          pledgesRequested.current = false;
        });
    }
  }, []);

  /**
   * Le tabelle laterali diventano una collezione sola. L'identità cambia solo
   * quando ne cambia una, così la mappa rifà `setData` una volta e non a ogni
   * render.
   */
  const mapCountries = useMemo(() => {
    if (!countries) return null;
    let merged = countries;
    if (pollution) merged = mergeIntoCountries(merged, pollution);
    if (adaptation) merged = mergeAdaptation(merged, adaptation);
    if (pledges) merged = mergePledges(merged, pledges);
    return merged;
  }, [countries, pollution, adaptation, pledges]);

  /**
   * Un passo del percorso è uno stato dell'app, non una schermata: applica
   * anno, layer e pannello e poi si toglie di mezzo. Passa da
   * handleMetricChange perché è quella la porta che fa partire i download.
   */
  const applyTourStep = useCallback(
    (index: number) => {
      const step: TourStep | undefined = TOUR_STEPS[index];
      if (!step) return;
      setTourStep(index);
      if (step.metric !== undefined) handleMetricChange(step.metric);
      if (step.panel !== undefined) setPanel(step.panel);
      if (step.year !== undefined && grid) {
        setPlaying(false);
        setYear(step.year === 'latest' ? grid.meta.endYear : step.year);
      }
    },
    [grid, handleMetricChange],
  );

  // Il percorso ripreso da un link va applicato una volta sola, e solo quando
  // la griglia c'è: prima di allora non esiste un anno da mostrare.
  const tourApplied = useRef(false);
  useEffect(() => {
    if (tourApplied.current || INITIAL.tour === null || !grid) return;
    tourApplied.current = true;
    applyTourStep(INITIAL.tour);
  }, [grid, applyTourStep]);

  // Il layer chiesto dal link entra dalla stessa porta di un click: è quella
  // che fa partire il download dei paesi.
  useEffect(() => {
    if (INITIAL.metric) handleMetricChange(INITIAL.metric);
  }, [handleMetricChange]);

  useEffect(() => {
    if (year === null) return;
    const id = setTimeout(
      () => writeUrlState({ year, place, panel, metric, tour: tourStep }),
      URL_WRITE_DELAY_MS,
    );
    return () => clearTimeout(id);
  }, [year, place, panel, metric, tourStep]);

  // Keyboard scrubbing, ignored while the search field has focus — e mentre il
  // pannello a tutto schermo è aperto: lì "spazio" non deve animare una mappa
  // che nessuno sta guardando. Idem con un layer per paese acceso: la linea del
  // tempo non è sullo schermo, e i tasti non devono muovere uno stato invisibile.
  useEffect(() => {
    if (!grid || year === null || panel || tourStep !== null || metric) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      const { startYear, endYear } = grid.meta;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === 'ArrowLeft') {
        setPlaying(false);
        setYear((y) => Math.max(startYear, (y ?? endYear) - 1));
      } else if (e.key === 'ArrowRight') {
        setPlaying(false);
        setYear((y) => Math.min(endYear, (y ?? endYear) + 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [grid, year, panel, tourStep, metric]);

  const marker = useMemo(
    () => (place ? { latitude: place.latitude, longitude: place.longitude, label: place.name } : null),
    [place],
  );

  if (error) {
    return (
      <Centered>
        <AlertTriangle className="h-7 w-7 text-amber-400" />
        <h1 className="text-lg font-semibold text-white">{t('app.dataErrorTitle')}</h1>
        <p className="max-w-sm text-center text-sm text-slate-400">{error}</p>
        <code className="rounded-md bg-white/5 px-3 py-1.5 font-mono text-xs text-slate-300">
          npm run data
        </code>
      </Centered>
    );
  }

  if (!grid || year === null) {
    return (
      <Centered>
        <Loader2 className="h-7 w-7 animate-spin text-sky-400" />
        <p className="text-sm text-slate-400">{t('app.loading')}</p>
      </Centered>
    );
  }

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-ink-950">
      <ClimateMap
        grid={grid}
        year={year}
        marker={marker}
        onPickPoint={handlePickPoint}
        countries={mapCountries}
        metric={metric}
      />

      {/* Overlay chrome. The wrapper ignores pointer events so the map stays draggable. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col gap-4 p-4">
        <NavBar
          years={`${grid.meta.startYear}–${grid.meta.endYear}`}
          onSelectPlace={handleSelectPlace}
          panel={panel}
          onTogglePanel={(next) => setPanel((current) => (current === next ? null : next))}
        />

        <div className="flex min-h-0 flex-1 items-start justify-between gap-4">
          <div className="w-[26rem] max-w-[calc(100vw-2rem)] shrink-0">
            {!place && (
              <div className="pointer-events-auto flex items-start gap-2.5 rounded-xl border border-white/10 bg-ink-900/70 px-4 py-3 text-xs leading-relaxed text-slate-400 shadow-xl backdrop-blur-md animate-fade-up">
                <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <span>
                  {t('app.hintIntro')}
                  {/* I tasti si nominano solo quando fanno qualcosa: con un
                      layer per paese acceso la linea del tempo non c'è, e
                      pubblicizzare scorciatoie morte è peggio che tacere. */}
                  {!metric && (
                    <>
                      {' '}
                      {t('app.hintPressPrefix')} <Kbd>{t('app.spaceKey')}</Kbd>{' '}
                      {t('app.hintPressMid')} <Kbd>←</Kbd> <Kbd>→</Kbd>{' '}
                      {t('app.hintPressSuffix')}
                    </>
                  )}
                  {/* Il percorso si offre qui e non in barra: è il posto dove
                      guarda chi è appena arrivato e non sa da dove cominciare. */}
                  <button
                    onClick={() => applyTourStep(0)}
                    className="mt-2 flex items-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-500/10 px-2.5 py-1.5 text-[11px] font-medium text-sky-200 transition hover:border-sky-400/50 hover:bg-sky-500/20"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    {t('tour.start')}
                  </button>
                </span>
              </div>
            )}
          </div>

          {place && (
            <Suspense
              fallback={
                <div className="pointer-events-auto grid h-32 w-[26rem] place-items-center rounded-2xl border border-white/10 bg-ink-900/90 shadow-2xl backdrop-blur-xl">
                  <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
                </div>
              }
            >
              <LocationPanel grid={grid} place={place} year={year} onClose={() => setPlace(null)} />
            </Suspense>
          )}
        </div>

        <div className="flex items-end gap-4">
          <div className="hidden lg:block">
            <LayerControls
              baseline={grid.meta.baseline}
              metric={metric}
              onMetricChange={handleMetricChange}
              meta={countries?.meta ?? null}
              pollutionMeta={pollution?.meta ?? null}
              adaptationMeta={adaptation?.meta ?? null}
              pledgeMeta={pledges?.meta ?? null}
              loading={countriesLoading}
              error={countriesError}
            />
          </div>
          {/* La linea del tempo vale per una mappa sola. Le anomalie hanno un
              valore per ogni anno dal 1880; i layer per paese sono fermi al
              loro anno di riferimento — e uno slider che non muove niente non
              è un controllo inerte, è una promessa che la mappa non mantiene. */}
          <div className="min-w-0 flex-1">
            {metric === null ? (
              <TimelineSlider
                years={grid.years}
                year={year}
                globalAnomaly={grid.globalAnomaly(year)}
                playing={playing}
                onYearChange={setYear}
                onPlayingChange={setPlaying}
              />
            ) : (
              /* Solo sotto lg, dove i controlli dei layer sono nascosti: lì,
                 senza slider, un link `?layer=…` aperto sul telefono non
                 avrebbe più nessuna via d'uscita. Sopra lg il pannello sta
                 già qui accanto e dice tutto, anno di riferimento compreso. */
              <button
                onClick={() => handleMetricChange(null)}
                className="pointer-events-auto flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-ink-900/85 px-4 py-3 text-left shadow-2xl backdrop-blur-md transition hover:border-white/20 lg:hidden"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs text-slate-200">
                    {resolveMetric(metric, locale).title}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-slate-500">
                    {t('layerControls.fixedYear')}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-sky-300">
                  {t('layerControls.backToAnomaly')}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fuori dal chrome: copre tutto, mappa compresa. */}
      {panel === 'sectors' && <SectorsPanel onClose={() => setPanel(null)} />}
      {panel === 'boundaries' && <BoundariesPanel onClose={() => setPanel(null)} />}
      {panel === 'actions' && <ActionsPanel onClose={() => setPanel(null)} />}
      {panel === 'future' && <FuturePanel onClose={() => setPanel(null)} />}
      {panel === 'knowledge' && <KnowledgePanel onClose={() => setPanel(null)} />}

      {tourStep !== null && (
        <Tour step={tourStep} onStep={applyTourStep} onExit={() => setTourStep(null)} />
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] w-screen flex-col items-center justify-center gap-3 bg-ink-950">
      {children}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
      {children}
    </kbd>
  );
}
