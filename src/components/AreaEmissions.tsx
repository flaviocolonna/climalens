import { useMemo } from 'react';
import { Factory, Loader2 } from 'lucide-react';
import {
  NET_EXPORT_COLOR,
  NET_IMPORT_COLOR,
  type CountryEmissions,
  type CountryProps,
} from '@/lib/countryEmissions';
import {
  emissionsMass,
  energyIdentity,
  nonCo2Share,
  populationShare,
  share as pct,
  sourceBreakdown,
  times,
} from '@/lib/emissionsProfile';
import { signedDegrees } from '@/lib/format';
import type { Attribution, CountryIndex } from '@/lib/geoLookup';
import { LAND_MASK_MIN_LAT, NEAREST_MAX_KM } from '@/lib/geoLookup';
import type { TradeSectorTable } from '@/lib/tradeSectors';
import type { TradeSectorId } from '@/lib/tradeSectorTaxonomy';
import { useI18n } from '@/i18n/LocaleProvider';
import { LOCALE_TAG, type Locale } from '@/i18n/locale';
import type { TFunction } from '@/i18n/LocaleProvider';
import { tradeSectorText } from '@/i18n/content/tradeSectors';
import {
  contributionDetail,
  energyIdentityText,
  landDominantPrefix,
  nonCo2Note,
  sinkNote,
} from '@/i18n/content/areaEmissions';

/** Tinta unica per le barre: sono pezzi della stessa torta, non categorie. */
const BAR = '#3987e5';
/** Il verso opposto — un pozzo non è "poca emissione". Stessa tinta del layer. */
const ABSORBS = '#308e63';

/** Righe piene per verso di scambio, oltre le quali il resto va in "altro". */
const TOP_SECTOR_ROWS = 6;

/** Sopra questa quota, la storia del paese non è quella dei combustibili. */
const LAND_DOMINATES = 40;
/** Sotto questa quota, i gas diversi dalla CO₂ non meritano una riga. */
const MIN_NON_CO2 = 5;

/** Mezza tonnellata a testa in un verso o nell'altro: la stessa soglia del layer. */
const NET_BALANCED = 0.5;

interface Props {
  latitude: number;
  longitude: number;
  /** Codice e nome del paese quando il punto arriva dalla ricerca. */
  countryCode?: string;
  countryName?: string;
  /** Null finché il file dei paesi non è arrivato. */
  data: CountryEmissions | null;
  index: CountryIndex | null;
  error: string | null;
  /** Il riscaldamento misurato in questo punto, per l'unico confronto che conta. */
  warming: number | null;
  /** Null finché non è arrivato — o se non arriva mai, la sezione resta silenziosa. */
  sectors: TradeSectorTable | null;
}

/**
 * L'altra metà della domanda: questo punto il riscaldamento non lo subisce
 * soltanto, lo causa anche — o meglio, lo causa la zona in cui sta.
 *
 * Il dato più fine che esiste è per paese: le emissioni si contano dove sono
 * dichiarate, e nessun inventario le divide per cella di griglia. Quindi il
 * pannello attribuisce il punto a un paese e lo dichiara, invece di far
 * credere che questi numeri appartengano al chilometro quadrato che è stato
 * cliccato.
 */
export function AreaEmissions({
  latitude,
  longitude,
  countryCode,
  countryName,
  data,
  index,
  error,
  warming,
  sectors,
}: Props) {
  const { locale, t } = useI18n();
  const attribution = useMemo<Attribution | null>(
    () => (index ? index.attribute(latitude, longitude, countryCode) : null),
    [index, latitude, longitude, countryCode],
  );

  return (
    <section className="mt-4 border-t border-white/10 pt-4">
      <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        <Factory className="h-3 w-3 text-slate-500" />
        {t('areaEmissions.heading')}
      </h3>

      {error ? (
        <p className="text-xs leading-relaxed text-slate-500">
          {t('areaEmissions.notAvailable', { error })}
        </p>
      ) : !data || !attribution ? (
        <div className="flex items-center gap-2 py-1 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t('areaEmissions.loadingCountries')}
        </div>
      ) : attribution.kind === 'offshore' ? (
        <Offshore latitude={latitude} shapes={data.meta.shapes} t={t} />
      ) : attribution.kind === 'unlisted' ? (
        <Unlisted
          name={countryName ?? countryCode ?? t('areaEmissions.unnamedCountryFallback')}
          shapes={data.meta.shapes}
          t={t}
        />
      ) : (
        <Country
          props={attribution.props}
          km={attribution.kind === 'nearest' ? attribution.km : null}
          fromSearch={attribution.kind === 'code'}
          data={data}
          warming={warming}
          locale={locale}
          t={t}
          sectors={sectors}
        />
      )}
    </section>
  );
}

function Country({
  props,
  km,
  fromSearch,
  data,
  warming,
  locale,
  t,
  sectors,
}: {
  props: CountryProps;
  km: number | null;
  fromSearch: boolean;
  data: CountryEmissions;
  warming: number | null;
  locale: Locale;
  t: TFunction;
  sectors: TradeSectorTable | null;
}) {
  const { world, years, source, attribution, attributionUrl, shapes } = data.meta;
  const breakdown = sourceBreakdown(props, locale);
  const identity = energyIdentity(props, world);
  const nonCo2 = nonCo2Share(props);
  const popShare = populationShare(props, world);
  const landShare = breakdown?.rows.find((r) => r.id === 'land')?.share ?? 0;
  const landDominant = landShare >= LAND_DOMINATES;
  const sectorEntry = sectors?.countries[props.iso];
  const otherLabel = t('areaEmissions.tradeSectorsOther');

  return (
    <>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-100">
          {props.name[locale]}
        </span>
        <span className="shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
          {fromSearch
            ? t('areaEmissions.badgeFromSearch')
            : km === null
              ? t('areaEmissions.badgeInside')
              : t('areaEmissions.badgeNearest', { km: Math.round(km) })}
        </span>
      </div>

      {km !== null && (
        <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
          {t('areaEmissions.nearestNote', { max: NEAREST_MAX_KM })}
        </p>
      )}

      {props.tmp !== undefined && (
        <div className="mb-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5">
          {/* Niente rampa delle anomalie qui: quella scala dice "quanto si è
              scaldato un posto", e centesimi di grado di contributo ci
              starebbero dentro solo moltiplicati per un fattore inventato. */}
          <div className="font-mono text-2xl font-bold leading-none tabular-nums text-white">
            {signedDegrees(props.tmp, locale, 3)}
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
            {contributionDetail({ tmpShare: props.tmpShare, popShare: popShare ?? undefined }, locale)}
          </p>
        </div>
      )}

      <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
        {warming === null ? (
          t('areaEmissions.contributionNoPoint')
        ) : (
          t('areaEmissions.contributionWithPoint', { value: signedDegrees(warming, locale) })
        )}
      </p>

      {/* Groenlandia e Taiwan hanno l'attribuzione ma non le metriche della
          mappa: senza questa guardia resterebbe un blocco vuoto con il suo
          margine. */}
      <dl
        className={
          props.pc === undefined && props.cum === undefined && props.net === undefined
            ? 'hidden'
            : 'mb-4 space-y-1.5'
        }
      >
        <Metric
          label={t('areaEmissions.perCapitaLabel', { year: years.pc })}
          value={
            props.pc === undefined
              ? null
              : t('areaEmissions.perCapitaValue', {
                  value: props.pc.toLocaleString(LOCALE_TAG[locale], { maximumFractionDigits: 1 }),
                })
          }
          extra={
            props.pc !== undefined && world.pc
              ? t('areaEmissions.perCapitaExtra', { times: times(props.pc / world.pc, locale) })
              : null
          }
          why={t('areaEmissions.perCapitaWhy')}
        />
        <Metric
          label={t('areaEmissions.historicalLabel', { year: years.cum })}
          value={props.cum === undefined ? null : pct(props.cum, locale)}
          extra={t('areaEmissions.historicalExtra')}
          why={t('areaEmissions.historicalWhy')}
        />
        <Metric
          label={t('areaEmissions.netLabel', { year: years.net })}
          value={
            props.net === undefined
              ? null
              : t('areaEmissions.netValue', {
                  value: `${props.net > 0 ? '+' : props.net < 0 ? '−' : ''}${Math.abs(props.net).toLocaleString(LOCALE_TAG[locale], { maximumFractionDigits: 1 })}`,
                })
          }
          extra={
            props.net === undefined
              ? null
              : Math.abs(props.net) < NET_BALANCED
                ? t('areaEmissions.netBalanced')
                : props.net > 0
                  ? t('areaEmissions.netImports')
                  : t('areaEmissions.netExports')
          }
          why={
            props.net !== undefined && props.net > 0
              ? t('areaEmissions.netWhyImports')
              : t('areaEmissions.netWhyExports')
          }
        />
      </dl>

      {breakdown && (
        <>
          <h4 className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            {t('areaEmissions.sourceHeading', {
              mass: emissionsMass(breakdown.totalMt, locale),
              year: years.mix,
            })}
          </h4>
          <div className="space-y-1">
            {breakdown.rows.map((row) => (
              <div
                key={row.id}
                className="relative overflow-hidden rounded border border-white/5 bg-white/[0.03]"
              >
                <div
                  className="absolute inset-y-0 left-0"
                  style={{ width: `${row.share}%`, background: `${BAR}40` }}
                />
                <div className="relative flex items-baseline gap-2 px-2 py-1 text-xs">
                  <span className="min-w-0 flex-1 truncate text-slate-200">{row.label}</span>
                  <span className="shrink-0 font-mono tabular-nums text-slate-300">
                    {Math.round(row.share)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          {breakdown.sinkMt !== null && (
            <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: ABSORBS }}>
              {sinkNote({ sinkMt: breakdown.sinkMt, totalMt: breakdown.totalMt }, locale)}
            </p>
          )}
        </>
      )}

      {sectors && (
        <>
          <h4 className="mb-1.5 mt-4 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            {t('areaEmissions.tradeSectorsHeading')}
          </h4>
          {!sectorEntry ? (
            <p className="text-[11px] leading-relaxed text-slate-500">
              {t('areaEmissions.tradeSectorsNoData')}
            </p>
          ) : (
            <>
              <SectorRows
                label={t('areaEmissions.tradeSectorsImports')}
                rows={topSectorRows(sectorEntry.imports, locale, otherLabel)}
                color={NET_IMPORT_COLOR}
              />
              <SectorRows
                label={t('areaEmissions.tradeSectorsExports')}
                rows={topSectorRows(sectorEntry.exports, locale, otherLabel)}
                color={NET_EXPORT_COLOR}
              />
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">
                {t('areaEmissions.tradeSectorsFootnote', {
                  source: sectors.meta.source,
                  year: sectorEntry.year,
                })}
              </p>
            </>
          )}
        </>
      )}

      <h4 className="mb-1.5 mt-4 text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {t('areaEmissions.whyMuchHeading')}
      </h4>
      <p className="text-[11px] leading-relaxed text-slate-400">
        {landDominant && landDominantPrefix({ landPct: Math.round(landShare) }, locale)}
        {identity
          ? energyIdentityText(
              {
                landDominant,
                energyPc: identity.energyPc,
                energyRatio: identity.energyRatio,
                intensity: identity.intensity,
                intensityRatio: identity.intensityRatio,
                pcRatio: identity.pcRatio,
              },
              locale,
            )
          : t('areaEmissions.energyNoIdentity')}
      </p>

      {nonCo2 && nonCo2.share >= MIN_NON_CO2 && (
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
          {nonCo2Note({ ch4Pct: Math.round(nonCo2.ch4), n2oPct: Math.round(nonCo2.n2o) }, locale)}
        </p>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-slate-600">
        {t('areaEmissions.footerPrefix', { source })}{' '}
        <a
          href={attributionUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="underline transition hover:text-slate-400"
        >
          {attribution}
        </a>{' '}
        {t('areaEmissions.footerSuffix', {
          worldTmp: world.tmp !== undefined ? signedDegrees(world.tmp, locale, 2) : '—',
          shapes,
        })}
      </p>
    </>
  );
}

function Metric({
  label,
  value,
  extra,
  why,
}: {
  label: string;
  value: string | null;
  extra: string | null;
  why: string;
}) {
  if (value === null) return null;
  return (
    <div>
      <div className="flex items-baseline gap-2 text-xs">
        <dt className="min-w-0 flex-1 truncate text-slate-300">{label}</dt>
        <dd className="shrink-0 font-mono font-semibold tabular-nums text-white">{value}</dd>
      </div>
      <dd className="text-[11px] leading-relaxed text-slate-500">
        {extra && <span className="text-slate-400">{extra}. </span>}
        {why}
      </dd>
    </div>
  );
}

/** Le prime {TOP_SECTOR_ROWS} voci per quota, il resto ripiegato in "altro". */
function topSectorRows(
  record: Partial<Record<TradeSectorId, number>>,
  locale: Locale,
  otherLabel: string,
): Array<{ key: string; label: string; share: number }> {
  const sorted = (Object.entries(record) as Array<[TradeSectorId, number]>)
    .filter(([, share]) => share > 0)
    .sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, TOP_SECTOR_ROWS);
  const rest = sorted.slice(TOP_SECTOR_ROWS).reduce((sum, [, share]) => sum + share, 0);
  const rows = top.map(([id, share]) => ({
    key: id as string,
    label: tradeSectorText(id, locale).name,
    share,
  }));
  if (rest > 0.5) rows.push({ key: 'other', label: otherLabel, share: rest });
  return rows;
}

function SectorRows({
  label,
  rows,
  color,
}: {
  label: string;
  rows: Array<{ key: string; label: string; share: number }>;
  color: string;
}) {
  if (!rows.length) return null;
  return (
    <div className="mb-2">
      <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <div className="space-y-1">
        {rows.map((row) => (
          <div
            key={row.key}
            className="relative overflow-hidden rounded border border-white/5 bg-white/[0.03]"
          >
            <div
              className="absolute inset-y-0 left-0"
              style={{ width: `${row.share}%`, background: `${color}40` }}
            />
            <div className="relative flex items-baseline gap-2 px-2 py-1 text-xs">
              <span className="min-w-0 flex-1 truncate text-slate-200">{row.label}</span>
              <span className="shrink-0 font-mono tabular-nums text-slate-300">
                {Math.round(row.share)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** In mezzo all'oceano non c'è nessuno a cui attribuire niente — e va detto. */
function Offshore({ latitude, shapes, t }: { latitude: number; shapes: string; t: TFunction }) {
  if (latitude < LAND_MASK_MIN_LAT) {
    return (
      <p className="text-xs leading-relaxed text-slate-400">
        {t('areaEmissions.offshoreAntarcticaMain', { shapes })}{' '}
        <span className="text-slate-500">{t('areaEmissions.offshoreAntarcticaNote')}</span>
      </p>
    );
  }
  return (
    <p className="text-xs leading-relaxed text-slate-400">
      {t('areaEmissions.offshoreSeaMain', { max: NEAREST_MAX_KM })}{' '}
      <span className="text-slate-500">{t('areaEmissions.offshoreSeaNote')}</span>
    </p>
  );
}

/**
 * Il paese esiste, i suoi dati anche, ma non in questo file: le emissioni sono
 * agganciate alle forme, e a 1:110m un micro-stato non ha una forma. Meglio
 * dirlo che stampare i numeri del vicino sotto il nome sbagliato.
 */
function Unlisted({ name, shapes, t }: { name: string; shapes: string; t: TFunction }) {
  return (
    <p className="text-xs leading-relaxed text-slate-400">
      {t('areaEmissions.unlistedMain', { name })}{' '}
      <span className="text-slate-500">{t('areaEmissions.unlistedNote', { shapes })}</span>
    </p>
  );
}
