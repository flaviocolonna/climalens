import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Loader2, X } from 'lucide-react';
import {
  PRE_INDUSTRIAL,
  trendPerDecade,
  type ClimateGrid,
  type SeriesPoint,
} from '@/lib/climateData';
import { anomalyCss } from '@/lib/colorScale';
import {
  loadCountryEmissions,
  type CountryEmissions,
} from '@/lib/countryEmissions';
import { loadTradeSectors, type TradeSectorTable } from '@/lib/tradeSectors';
import { coords, degrees, signed, signedDegrees } from '@/lib/format';
import { countryIndex } from '@/lib/geoLookup';
import {
  NORMALS,
  THRESHOLDS,
  fetchAbsoluteTemps,
  type AbsoluteTemps,
  type ThresholdId,
} from '@/lib/openMeteo';
import { AirQuality } from '@/components/AirQuality';
import { Lifetime } from '@/components/Lifetime';
import { AreaEmissions } from '@/components/AreaEmissions';
import { ProjectsPanel } from '@/components/ProjectsPanel';
import { WarmingWhy } from '@/components/WarmingWhy';
import type { SelectedPlace } from '@/types';
import { useI18n } from '@/i18n/LocaleProvider';
import type { Locale } from '@/i18n/locale';
import type { TFunction } from '@/i18n/LocaleProvider';

/** Width of the centred smoothing window on the chart. */
const SMOOTH_WINDOW = 11;

/** Sotto un giorno all'anno in entrambe le finestre non è un fenomeno del posto. */
const MIN_RELEVANT_DAYS = 1;

interface Props {
  grid: ClimateGrid;
  place: SelectedPlace;
  year: number;
  onClose: () => void;
}

export function LocationPanel({ grid, place, year, onClose }: Props) {
  const { locale, t } = useI18n();
  const [absolute, setAbsolute] = useState<AbsoluteTemps | null>(null);
  const [absLoading, setAbsLoading] = useState(false);
  const [absError, setAbsError] = useState<string | null>(null);

  const series = useMemo(
    () => grid.seriesAt(place.latitude, place.longitude),
    [grid, place.latitude, place.longitude],
  );

  const hasData = series.some((p) => p.value !== null);

  const stats = useMemo(
    () => ({
      // Una definizione sola di "riscaldamento", quella della griglia: il
      // titolo qui sopra e la scala dei confronti più in basso devono per forza
      // stampare lo stesso numero.
      warming: grid.warmingAt(place.latitude, place.longitude),
      trend: trendPerDecade(series),
      current: grid.valueAt(year, place.latitude, place.longitude),
      recentWindow: grid.recentWindow,
    }),
    [series, grid, year, place.latitude, place.longitude],
  );

  const chartData = useMemo(() => withSmoothing(series), [series]);

  // ERA5 absolute temperatures are a nice-to-have; the panel is useful without them.
  useEffect(() => {
    const controller = new AbortController();
    setAbsolute(null);
    setAbsError(null);
    setAbsLoading(true);
    fetchAbsoluteTemps(place.latitude, place.longitude, locale, controller.signal)
      .then((r) => setAbsolute(r))
      .catch((err: Error) => {
        // Arricchimento, non contenuto: si dice cosa è andato storto e si va
        // avanti. Un annullamento non è un errore da mostrare.
        if (err.name !== 'AbortError') setAbsError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setAbsLoading(false);
      });
    return () => controller.abort();
  }, [place.key, place.latitude, place.longitude, locale]);

  // Le forme dei paesi servono a due cose diverse in questo pannello: dire a
  // quale paese attribuire il punto — le emissioni si contano per paese, più
  // fine di così non esiste — e fare da maschera terra/mare al confronto
  // termico. È lo stesso file del layer delle emissioni, e la stessa promessa:
  // se è già stato scaricato non parte una seconda richiesta.
  const [countries, setCountries] = useState<CountryEmissions | null>(null);
  const [countriesError, setCountriesError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadCountryEmissions()
      .then((data) => {
        if (alive) setCountries(data);
      })
      .catch((err: Error) => {
        if (alive) setCountriesError(err.message);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Composizione settoriale del commercio: un dettaglio in più per chi apre
  // il pannello, non un dato di cui dipenda nessun'altra parte dello schermo —
  // un fallimento resta silenzioso, AreaEmissions mostra il proprio messaggio
  // di "nessun dato" quando `sectors` non arriva.
  const [tradeSectors, setTradeSectors] = useState<TradeSectorTable | null>(null);

  useEffect(() => {
    let alive = true;
    loadTradeSectors()
      .then((data) => {
        if (alive) setTradeSectors(data);
      })
      .catch(() => { });
    return () => {
      alive = false;
    };
  }, []);

  const index = useMemo(() => (countries ? countryIndex(countries) : null), [countries]);

  // Un punto senza nome cade dentro un confine molto più spesso di quanto
  // suggerisca "Punto selezionato": chi clicca (o clicca il nome) di un paese
  // sulla mappa si aspetta di leggere quel nome in testa al pannello, non
  // un'etichetta generica — il point-in-polygon è lo stesso che il resto del
  // pannello usa già per attribuire le emissioni a questo punto.
  const insideCountry = useMemo(
    () => (place.isUnnamedPoint && index ? index.at(place.latitude, place.longitude) : null),
    [index, place.isUnnamedPoint, place.latitude, place.longitude],
  );

  // Il testo che accompagna un punto senza nome è un'etichetta tradotta, non
  // un dato salvato: si ricalcola a ogni render così un cambio di lingua a
  // pannello aperto non lascia scritto il nome nella lingua di prima.
  const displayName = place.isUnnamedPoint
    ? (insideCountry?.name[locale] ?? t('app.unnamedPoint'))
    : place.name;
  const displaySubtitle = place.isUnnamedPoint
    ? insideCountry
      ? null
      : t('app.gridCellSubtitle', {
        latStep: Math.abs(grid.meta.latStep),
        lonStep: Math.abs(grid.meta.lonStep),
      })
    : place.subtitle;

  return (
    <div className="pointer-events-auto flex max-h-full min-h-[75vh] w-[30rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900/90 shadow-2xl backdrop-blur-xl animate-fade-up">
      <header className="flex items-start gap-3 border-b border-white/10 px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold leading-tight text-white">{displayName}</h2>
          {displaySubtitle && (
            <p className="mt-0.5 truncate text-xs text-slate-400">{displaySubtitle}</p>
          )}
          <p className="mt-1 font-mono text-[10px] text-slate-600">
            {coords(place.latitude, place.longitude, locale)}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label={t('locationPanel.closeAria')}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {!hasData ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          {t('locationPanel.noInstrumentalData')}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {stats.warming !== null && (
            <section className="mb-5">
              <div
                className="font-mono text-4xl font-bold leading-none tracking-tight tabular-nums"
                style={{ color: anomalyCss(stats.warming) }}
              >
                {signedDegrees(stats.warming, locale)}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {t('locationPanel.warmingBetween', {
                  from0: PRE_INDUSTRIAL[0],
                  from1: PRE_INDUSTRIAL[1],
                  to0: stats.recentWindow[0],
                  to1: stats.recentWindow[1],
                })}
              </p>
            </section>
          )}

          <section className="mb-5 grid grid-cols-2 gap-3">
            <Stat
              label={t('locationPanel.anomalyInYear', { year })}
              value={stats.current === null ? '—' : signedDegrees(stats.current, locale)}
              color={stats.current === null ? undefined : anomalyCss(stats.current)}
            />
            <Stat
              label={t('locationPanel.trend')}
              value={stats.trend === null ? '—' : `${signed(stats.trend, locale)} °C/dec`}
              color={stats.trend === null ? undefined : anomalyCss(stats.trend * 5)}
            />
          </section>

          <section className="mb-5">
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {t('locationPanel.annualAnomalyHeading', {
                start: grid.meta.startYear,
                end: grid.meta.endYear,
              })}
            </h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 4, right: 2, bottom: 0, left: -22 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="2 4" vertical={false} />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#1e293b' }}
                    ticks={[1900, 1940, 1980, 2020]}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    tickFormatter={(v: number) => (v > 0 ? `+${v}` : `${v}`)}
                  />
                  <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
                  <ReferenceLine x={year} stroke="#38bdf8" strokeWidth={1} strokeDasharray="3 3" />
                  <Tooltip
                    content={<ChartTooltip locale={locale} t={t} />}
                    cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                  />
                  <Bar dataKey="value" isAnimationActive={false} maxBarSize={6}>
                    {chartData.map((d) => (
                      <Cell
                        key={d.year}
                        fill={d.value === null ? 'transparent' : anomalyCss(d.value)}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="smooth"
                    stroke="#e2e8f0"
                    strokeWidth={1.75}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-600">
              {t('locationPanel.chartFootnote', { n: SMOOTH_WINDOW })}
            </p>
          </section>

          <WarmingWhy
            grid={grid}
            latitude={place.latitude}
            longitude={place.longitude}
            index={index}
          />

          <section className="border-t border-white/10 pt-4">
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {t('locationPanel.avgAnnualTempHeading')}
            </h3>
            {absLoading ? (
              <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t('locationPanel.loadingEra5')}
              </div>
            ) : absolute?.firstNormal != null && absolute.lastNormal != null ? (
              <div className="flex items-end gap-3">
                <Normal
                  label={`${NORMALS.first[0]}–${NORMALS.first[1]}`}
                  value={absolute.firstNormal}
                  locale={locale}
                />
                <div className="pb-1.5 text-slate-600">→</div>
                <Normal
                  label={`${NORMALS.last[0]}–${NORMALS.last[1]}`}
                  value={absolute.lastNormal}
                  locale={locale}
                  highlight
                />
                <div
                  className="ml-auto pb-1.5 font-mono text-sm font-semibold"
                  style={{ color: anomalyCss(absolute.lastNormal - absolute.firstNormal) }}
                >
                  {signed(absolute.lastNormal - absolute.firstNormal, locale, 1)}
                </div>
              </div>
            ) : (
              <p className="py-1 text-xs text-slate-600">
                {absError ?? t('locationPanel.era5Unavailable')}
              </p>
            )}
          </section>

          {absolute && <FeltDays absolute={absolute} t={t} />}

          <Lifetime
            series={series}
            startYear={grid.meta.startYear}
            endYear={grid.meta.endYear}
          />

          <AirQuality
            placeKey={place.key}
            latitude={place.latitude}
            longitude={place.longitude}
          />

          <AreaEmissions
            latitude={place.latitude}
            longitude={place.longitude}
            countryCode={place.countryCode}
            countryName={place.country}
            data={countries}
            index={index}
            error={countriesError}
            warming={stats.warming}
            sectors={tradeSectors}
          />

          <ProjectsPanel place={place} country={place.country} />
        </div>
      )}

      <footer className="border-t border-white/10 px-5 py-2.5 text-[10px] leading-relaxed text-slate-600">
        {t('locationPanel.footer', {
          source: grid.meta.source,
          latStep: Math.abs(grid.meta.latStep),
          lonStep: Math.abs(grid.meta.lonStep),
          baseline: grid.meta.baseline,
        })}
      </footer>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5">
      <div className="text-[10px] uppercase leading-tight tracking-wider text-slate-500">{label}</div>
      <div
        className="mt-1 font-mono text-base font-semibold tabular-nums"
        style={{ color: color ?? '#94a3b8' }}
      >
        {value}
      </div>
    </div>
  );
}

/**
 * Le soglie che si sentono, nelle stesse due finestre delle medie.
 * Vengono mostrate solo quelle che in questo posto significano qualcosa: le
 * gelate a Singapore e i giorni sopra i 30 °C a Tromsø sarebbero due righe di
 * zeri, e uno zero che non cambia non racconta niente.
 */
function FeltDays({ absolute, t }: { absolute: AbsoluteTemps; t: TFunction }) {
  /**
   * "Il riscaldamento che si sente addosso": more felt than the anomaly, so
   * the labels live with the component instead of a module-scope constant —
   * a frozen array built once would keep whatever language was active on
   * first render.
   */
  const indicators: Array<{ id: ThresholdId; label: string; warmSign: 1 | -1 }> = [
    { id: 'hotDay', label: t('locationPanel.indicatorHotDay', { t: THRESHOLDS.hotDay }), warmSign: 1 },
    {
      id: 'tropicalNight',
      label: t('locationPanel.indicatorTropicalNight', { t: THRESHOLDS.tropicalNight }),
      warmSign: 1,
    },
    { id: 'frost', label: t('locationPanel.indicatorFrost'), warmSign: -1 },
  ];

  const rows = indicators
    .map((ind) => {
      const from = absolute.firstDays[ind.id];
      const to = absolute.lastDays[ind.id];
      if (from === null || to === null) return null;
      const a = Math.round(from);
      const b = Math.round(to);
      if (Math.max(a, b) < MIN_RELEVANT_DAYS) return null;
      return { ...ind, from: a, to: b, delta: b - a };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (!rows.length) return null;

  return (
    <section className="mt-4 border-t border-white/10 pt-4">
      <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {t('locationPanel.feltDaysHeading')}
      </h3>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.id} className="flex items-baseline gap-2 text-xs">
            <span className="min-w-0 flex-1 truncate text-slate-300">{r.label}</span>
            <span className="shrink-0 font-mono tabular-nums text-slate-500">{r.from}</span>
            <span className="shrink-0 text-slate-600">→</span>
            <span className="w-7 shrink-0 text-right font-mono font-semibold tabular-nums text-white">
              {r.to}
            </span>
            <span
              className="w-10 shrink-0 text-right font-mono text-[11px] font-semibold tabular-nums"
              // Il verso del riscaldamento, non il segno del numero: meno gelate
              // e più notti tropicali sono la stessa cosa.
              style={{ color: anomalyCss(r.delta === 0 ? 0 : r.delta * r.warmSign > 0 ? 1.6 : -1.6) }}
            >
              {r.delta > 0 ? `+${r.delta}` : r.delta}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
        {t('locationPanel.feltDaysFootnote', {
          f0: NORMALS.first[0],
          f1: NORMALS.first[1],
          l0: NORMALS.last[0],
          l1: NORMALS.last[1],
          t: THRESHOLDS.tropicalNight,
        })}
      </p>
    </section>
  );
}

function Normal({
  label,
  value,
  highlight,
  locale,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  locale: Locale;
}) {
  return (
    <div>
      <div className="text-[10px] tracking-wide text-slate-500">{label}</div>
      <div
        className={`font-mono text-lg font-semibold tabular-nums ${highlight ? 'text-white' : 'text-slate-300'
          }`}
      >
        {degrees(value, locale)}
      </div>
    </div>
  );
}

interface ChartRow extends SeriesPoint {
  smooth: number | null;
}

function ChartTooltip({
  active,
  payload,
  locale,
  t,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
  locale: Locale;
  t: TFunction;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-ink-950/95 px-3 py-2 shadow-xl backdrop-blur">
      <div className="font-mono text-xs font-semibold text-white">{row.year}</div>
      <div
        className="font-mono text-sm tabular-nums"
        style={{ color: row.value === null ? '#64748b' : anomalyCss(row.value) }}
      >
        {row.value === null ? t('common.noData') : signedDegrees(row.value, locale)}
      </div>
    </div>
  );
}

/** Adds a centred moving average, shrinking the window at the series edges. */
function withSmoothing(series: SeriesPoint[]): ChartRow[] {
  const half = Math.floor(SMOOTH_WINDOW / 2);
  return series.map((point, i) => {
    let sum = 0;
    let n = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(series.length - 1, i + half); j++) {
      const v = series[j].value;
      if (v !== null) {
        sum += v;
        n++;
      }
    }
    return { ...point, smooth: n >= half ? sum / n : null };
  });
}
