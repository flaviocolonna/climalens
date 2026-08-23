import { useEffect, useState } from 'react';
import { ChevronRight, ExternalLink, Factory, Layers, X } from 'lucide-react';
import {
  DEMAND_SECTORS,
  EMISSION_SECTORS,
  EMISSIONS_META,
  SECTOR_COLORS,
  SECTOR_PATHS,
  demandSectorText,
  gigatonnesLabel,
  percent,
  percentRange,
  sectorText,
  type DemandSector,
  type EmissionSector,
} from '@/lib/emissions';
import { CARBON_MAJORS, PLASTIC_BRANDS } from '@/lib/producers';
import { LOCALE_TAG, type Locale } from '@/i18n/locale';
import { useI18n, useT } from '@/i18n/LocaleProvider';
import type { TFunction } from '@/i18n/LocaleProvider';

/** Aperto all'avvio: l'energia è il 73% e il suo dettaglio è la parte interessante. */
const INITIALLY_OPEN = ['energy'];

/** Rientro di un livello di gerarchia, in px. Le barre lo compensano. */
const INDENT = 24;

/** Le voci per uso finale non sono categorie: una tinta sola, come una lente. */
const DEMAND_COLOR = '#38bdf8';

/** I produttori usano il rosso della mappa: stessa lingua, «più = peggio». */
const PRODUCER_COLOR = '#bf2621';

type Lens = 'source' | 'demand' | 'producers';

interface Props {
  onClose: () => void;
}

/**
 * Da dove arriva il riscaldamento che la mappa mostra, in due tagli della
 * stessa torta: per sorgente (dove il gas esce) e per uso finale (a cosa
 * serviva). Il secondo taglio esiste perché "abbigliamento" o "cibo" non sono
 * righe mancanti nel primo — sono già dentro, distribuite altrove.
 *
 * Occupa tutta la finestra: sono 24 voci su tre livelli più sei schede con le
 * fonti, e in una colonna da 26rem si leggevano attraverso una feritoia.
 */
export function SectorsPanel({ onClose }: Props) {
  const { locale, t } = useI18n();
  const [lens, setLens] = useState<Lens>('source');
  const [open, setOpen] = useState<Set<string>>(() => new Set(INITIALLY_OPEN));
  // Si tiene l'id, non il nome già tradotto: se la lingua cambia mentre
  // l'evidenziazione è attiva, il banner deve leggere il nome giusto al volo,
  // non restare fermo alla lingua di quando è stata accesa.
  const [highlight, setHighlight] = useState<{ fromId: string; ids: Set<string> } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  /** Porta l'altra lente sulle righe in cui una voce di consumo è già contata. */
  const revealSpans = (d: DemandSector) => {
    setOpen((prev) => {
      const next = new Set(prev);
      for (const id of d.spans) for (const ancestor of SECTOR_PATHS.get(id) ?? []) next.add(ancestor);
      return next;
    });
    setHighlight({ fromId: d.id, ids: new Set(d.spans) });
    setLens('source');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('sectorsPanel.heading')}
      className="fixed inset-0 z-50 flex flex-col bg-ink-950/95 backdrop-blur-xl animate-fade-up"
    >
      {/* Stesso contenitore del corpo: il titolo si allinea al rail, non al
          bordo della finestra, o le due metà sembrano due schermate diverse. */}
      <header className="shrink-0 border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Factory className="h-5 w-5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight text-white">
              {t('sectorsPanel.heading')}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-400">{t('sectorsPanel.subheading')}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
            {t('sectorsPanel.close')}
            <kbd className="hidden rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline">
              esc
            </kbd>
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-8 px-5 py-7 sm:px-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
          {/* Rail: il totale e la sua ripartizione restano fermi mentre si
              naviga l'albero, perché sono la cornice di tutte e due le lenti. */}
          <aside className="space-y-5 lg:sticky lg:top-0 lg:h-max">
            <div>
              <div className="font-mono text-4xl font-bold leading-none tracking-tight text-white">
                {EMISSIONS_META.totalGt.toLocaleString(LOCALE_TAG[locale], { minimumFractionDigits: 1 })} Gt
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {t('sectorsPanel.totalCaption', { year: EMISSIONS_META.year })}{' '}
                {lens === 'source'
                  ? t('sectorsPanel.totalCaptionSource')
                  : lens === 'demand'
                    ? t('sectorsPanel.totalCaptionDemand')
                    : ''}
              </p>
            </div>

            <TotalBar locale={locale} />

            <p className="border-t border-white/10 pt-4 text-[10px] leading-relaxed text-slate-600">
              {lens === 'source' ? (
                <>
                  <a
                    href={EMISSIONS_META.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-500 transition hover:text-slate-300"
                  >
                    {EMISSIONS_META.source}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>{' '}
                  {t('sectorsPanel.sourceFootnote', { year: EMISSIONS_META.year })}
                </>
              ) : lens === 'demand' ? (
                t('sectorsPanel.demandFootnote')
              ) : (
                t('producers.copiedByHand')
              )}
            </p>
          </aside>

          <div className="min-w-0">
            <div className="mb-5 flex max-w-md gap-1 rounded-lg bg-white/5 p-0.5">
              <LensTab active={lens === 'source'} onClick={() => setLens('source')}>
                {t('sectorsPanel.tabSource')}
              </LensTab>
              <LensTab active={lens === 'demand'} onClick={() => setLens('demand')}>
                {t('sectorsPanel.tabDemand')}
              </LensTab>
              <LensTab active={lens === 'producers'} onClick={() => setLens('producers')}>
                {t('producers.tab')}
              </LensTab>
            </div>

            {lens === 'source' ? (
              <>
                {highlight && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg border border-sky-400/25 bg-sky-500/10 px-3 py-2 text-xs leading-relaxed text-sky-100/90">
                    <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" />
                    <div className="min-w-0">
                      {t('sectorsPanel.highlightPrefix')}{' '}
                      <span className="font-medium text-white">
                        {demandSectorText(highlight.fromId, locale)?.name}
                      </span>
                      .
                      <button
                        onClick={() => setHighlight(null)}
                        className="ml-1.5 underline transition hover:text-white"
                      >
                        {t('sectorsPanel.highlightReset')}
                      </button>
                    </div>
                  </div>
                )}

                <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  {t('sectorsPanel.sectorsHeading')}
                </h3>
                <div className="space-y-3">
                  {EMISSION_SECTORS.map((sector) => (
                    <SectorRow
                      key={sector.id}
                      sector={sector}
                      color={SECTOR_COLORS[sector.id]}
                      depth={0}
                      open={open}
                      onToggle={toggle}
                      highlight={highlight?.ids ?? null}
                      locale={locale}
                    />
                  ))}
                </div>
              </>
            ) : lens === 'demand' ? (
              <DemandLens onReveal={revealSpans} locale={locale} t={t} />
            ) : (
              <ProducersLens locale={locale} t={t} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LensTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
        active ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

/** I quattro settori di primo livello come parti di un intero. */
function TotalBar({ locale }: { locale: Locale }) {
  const t = useT();
  const label = EMISSION_SECTORS.map(
    (s) => `${sectorText(s.id, locale)?.name} ${percent(s.share, locale)}`,
  ).join(', ');

  return (
    <div>
      <div
        className="flex h-2.5 gap-[2px]"
        role="img"
        aria-label={t('sectorsPanel.totalBarAriaLabel', { label })}
      >
        {EMISSION_SECTORS.map((s, i) => (
          <div
            key={s.id}
            // I pesi flex ricostruiscono le proporzioni al netto dei distacchi di 2px.
            style={{ flex: `${s.share} 1 0%`, background: SECTOR_COLORS[s.id] }}
            className={`h-full ${i === 0 ? 'rounded-l-full' : ''} ${
              i === EMISSION_SECTORS.length - 1 ? 'rounded-r-full' : ''
            }`}
          />
        ))}
      </div>
      <div className="mt-2.5 space-y-1.5">
        {EMISSION_SECTORS.map((s) => (
          <div key={s.id} className="flex items-center gap-2 text-[11px] leading-tight">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: SECTOR_COLORS[s.id] }}
            />
            <span className="min-w-0 truncate text-slate-400">{sectorText(s.id, locale)?.name}</span>
            <span className="ml-auto shrink-0 font-mono tabular-nums text-slate-300">
              {percent(s.share, locale)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RowProps {
  sector: EmissionSector;
  color: string;
  depth: number;
  open: Set<string>;
  onToggle: (id: string) => void;
  highlight: Set<string> | null;
  locale: Locale;
}

function SectorRow({ sector, color, depth, open, onToggle, highlight, locale }: RowProps) {
  const children = sector.children;
  const isOpen = open.has(sector.id);
  const top = depth === 0;
  const marked = highlight?.has(sector.id) ?? false;
  // Con un'evidenziazione attiva il resto arretra, invece di competere con lei.
  const dimmed = !!highlight && !marked;
  const text = sectorText(sector.id, locale);

  const line = (
    <>
      <div className="flex items-center gap-1.5">
        {children ? (
          <ChevronRight
            className={`h-3 w-3 shrink-0 text-slate-500 transition-transform ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span
          className={`min-w-0 truncate ${
            marked
              ? 'text-sm font-semibold text-sky-200'
              : top
                ? 'text-sm font-medium text-slate-100'
                : 'text-sm text-slate-300'
          }`}
        >
          {text?.name}
        </span>
        <span
          className={`ml-auto shrink-0 font-mono tabular-nums ${
            top ? 'text-sm font-semibold text-white' : 'text-xs text-slate-300'
          }`}
        >
          {percent(sector.share, locale)}
        </span>
        <span className="w-14 shrink-0 text-right font-mono text-[11px] tabular-nums text-slate-500">
          {gigatonnesLabel(sector.share, locale)}
        </span>
      </div>
      {/*
        La barra annulla il rientro e riparte sempre dal bordo della colonna: una
        sola origine e una sola scala per tutti i livelli, così un sotto-settore
        si legge come la porzione del suo genitore che è. Senza la compensazione
        la percentuale si risolverebbe su una riga più stretta a ogni livello.
      */}
      <div
        style={{ marginLeft: -depth * INDENT, width: `calc(100% + ${depth * INDENT}px)` }}
        className={`mt-1 overflow-hidden rounded-full bg-white/[0.06] ${top ? 'h-1.5' : 'h-1'}`}
      >
        <div
          // Il minimo di 2px tiene visibili le voci sotto l'1%.
          style={{ width: `max(2px, ${sector.share}%)`, background: color }}
          className="h-full rounded-r-[3px]"
        />
      </div>
    </>
  );

  return (
    <div className={dimmed ? 'opacity-45 transition-opacity' : 'transition-opacity'}>
      {children ? (
        <button
          onClick={() => onToggle(sector.id)}
          aria-expanded={isOpen}
          className="w-full rounded-md text-left transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400/60"
        >
          {line}
        </button>
      ) : (
        line
      )}

      {text?.note && (
        <p className="ml-[1.125rem] mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-500">
          {text.note}
        </p>
      )}

      {children && isOpen && (
        <div style={{ marginLeft: INDENT }} className="mt-2.5 space-y-2.5">
          {children.map((child) => (
            <SectorRow
              key={child.id}
              sector={child}
              color={color}
              depth={depth + 1}
              open={open}
              onToggle={onToggle}
              highlight={highlight}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Le voci per uso finale: si sovrappongono, e la prima cosa che si legge lo dice. */
function DemandLens({
  onReveal,
  locale,
  t,
}: {
  onReveal: (d: DemandSector) => void;
  locale: Locale;
  t: TFunction;
}) {
  return (
    <>
      <p className="mb-5 max-w-3xl rounded-lg border border-amber-400/20 bg-amber-400/5 px-3.5 py-2.5 text-xs leading-relaxed text-amber-100/80">
        {t('sectorsPanel.demandWarningPrefix')}{' '}
        <span className="font-medium text-amber-100">{t('sectorsPanel.demandWarningEmphasis')}</span>{' '}
        {t('sectorsPanel.demandWarningSuffix')}
      </p>

      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {DEMAND_SECTORS.map((d) => (
          <DemandRow key={d.id} sector={d} onReveal={onReveal} locale={locale} t={t} />
        ))}
      </div>
    </>
  );
}

function DemandRow({
  sector,
  onReveal,
  locale,
  t,
}: {
  sector: DemandSector;
  onReveal: (d: DemandSector) => void;
  locale: Locale;
  t: TFunction;
}) {
  const text = demandSectorText(sector.id, locale);
  return (
    <article className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-100">
          {text?.name}
        </span>
        <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-white">
          {percentRange(sector.min, sector.max, locale)}
        </span>
      </div>

      {/* Intervallo: pieno fino alla stima minima, velato fino alla massima. La
          parte velata è l'incertezza, non un valore in più. */}
      <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="absolute inset-y-0 left-0 rounded-r-[3px] opacity-40"
          style={{ width: `max(2px, ${sector.max}%)`, background: DEMAND_COLOR }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-r-[3px]"
          style={{ width: `max(2px, ${sector.min}%)`, background: DEMAND_COLOR }}
        />
      </div>

      <p className="mt-2 text-xs leading-relaxed text-slate-500">{text?.note}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-600">
        <a
          href={sector.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 transition hover:text-slate-400"
        >
          {sector.source}
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
        <span>· {sector.year}</span>
        {text?.basis && <span className="text-amber-500/70">· {text.basis}</span>}
      </div>

      <button
        onClick={() => onReveal(sector)}
        className="mt-2 inline-flex items-center gap-0.5 text-xs text-sky-400 transition hover:text-sky-300"
      >
        {t('sectorsPanel.revealLink')}
        <ChevronRight className="h-3 w-3" />
      </button>
    </article>
  );
}

/**
 * Chi estrae il carbonio e chi confeziona la plastica: la stessa domanda —
 * quali imprese — su due inquinanti diversi.
 *
 * Le barre dei produttori sono in scala fra loro e basta: rapportarle al totale
 * mondiale le renderebbe tutte invisibili (il primo vale il 5% scarso), e la
 * riga sopra dice già quanto pesano tutti insieme.
 */
function ProducersLens({ locale, t }: { locale: Locale; t: TFunction }) {
  const max = CARBON_MAJORS.top[0].mt;
  const number = (v: number) => v.toLocaleString(LOCALE_TAG[locale]);

  return (
    <>
      <p className="mb-4 max-w-3xl text-xs leading-relaxed text-slate-400">
        {t('producers.intro')}
      </p>

      <div className="mb-5 max-w-3xl rounded-lg border border-white/5 bg-white/[0.02] px-3.5 py-3">
        <p className="text-xs leading-relaxed text-slate-300">
          {t('producers.tracedLine', {
            gt: CARBON_MAJORS.tracedGt.toLocaleString(LOCALE_TAG[locale], {
              minimumFractionDigits: 1,
            }),
            year: CARBON_MAJORS.year,
            active: CARBON_MAJORS.activeEntities,
            total: CARBON_MAJORS.totalEntities,
          })}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          {t('producers.halfLine', { n: CARBON_MAJORS.halfWorldCount })}
        </p>
      </div>

      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {t('producers.heading')}
      </h3>
      <div className="space-y-2.5">
        {CARBON_MAJORS.top.map((p) => (
          <div key={p.name}>
            <div className="flex items-baseline gap-2">
              <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{p.name}</span>
              {p.kind && (
                <span className="shrink-0 rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {p.kind === 'state' ? t('producers.stateBadge') : t('producers.investorBadge')}
                </span>
              )}
              <span className="w-20 shrink-0 text-right font-mono text-xs tabular-nums text-slate-300">
                {number(p.mt)} Mt
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-r-[3px]"
                style={{ width: `${(p.mt / max) * 100}%`, background: PRODUCER_COLOR }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[10px] text-slate-600">
        <a
          href={CARBON_MAJORS.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 transition hover:text-slate-400"
        >
          {CARBON_MAJORS.source}
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </p>

      <section className="mt-7 border-t border-white/10 pt-5">
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {t('producers.brandsHeading')}
        </h3>
        <p className="mb-3 max-w-3xl text-xs leading-relaxed text-slate-400">
          {t('producers.brandsIntro')}
        </p>

        <ol className="max-w-2xl space-y-1.5">
          {PLASTIC_BRANDS.top.map((brand, i) => (
            <li key={brand} className="flex items-baseline gap-3 text-sm">
              <span className="w-4 shrink-0 text-right font-mono text-xs tabular-nums text-slate-600">
                {i + 1}
              </span>
              <span className={i === 0 ? 'font-medium text-white' : 'text-slate-300'}>{brand}</span>
              {i === 0 && (
                <span className="ml-auto shrink-0 text-[11px] text-slate-500">
                  {t('producers.brandsLeaderLine', {
                    items: number(PLASTIC_BRANDS.leaderItems),
                    countries: PLASTIC_BRANDS.leaderCountries,
                    years: PLASTIC_BRANDS.leaderYearsFirst,
                  })}
                </span>
              )}
            </li>
          ))}
        </ol>

        <p className="mt-3 max-w-3xl text-[11px] leading-relaxed text-slate-500">
          {t('producers.brandsMethod', {
            year: PLASTIC_BRANDS.year,
            runnerUp: PLASTIC_BRANDS.runnerUpCountries,
            leader: PLASTIC_BRANDS.leaderCountries,
          })}
        </p>
        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">
          {t('producers.brandsAuditLine', {
            volunteers: number(PLASTIC_BRANDS.volunteers),
            countries: PLASTIC_BRANDS.countries,
            items: number(PLASTIC_BRANDS.items),
            brands: number(PLASTIC_BRANDS.brandsFound),
            parents: number(PLASTIC_BRANDS.parentCompanies),
          })}{' '}
          <a
            href={PLASTIC_BRANDS.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 transition hover:text-slate-400"
          >
            {PLASTIC_BRANDS.source}
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </p>
      </section>
    </>
  );
}
