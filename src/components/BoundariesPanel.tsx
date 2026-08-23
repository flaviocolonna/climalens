import { useEffect } from 'react';
import { ExternalLink, Globe, X } from 'lucide-react';
import {
  BOUNDARIES,
  CROSSED_COUNT,
  PRESSURE_SCALE_MAX,
  SOURCE_STATUS_URL,
  SOURCE_VALUES_URL,
  pressure,
  type Boundary,
} from '@/lib/boundaries';
import { boundaryText } from '@/i18n/content/boundaries';
import { useI18n } from '@/i18n/LocaleProvider';
import { LOCALE_TAG, type Locale } from '@/i18n/locale';

/** Rosso e verde-azzurro già in uso sulla mappa: superato / entro il limite. */
const CROSSED_COLOR = '#bf2621';
const SAFE_COLOR = '#308e63';

interface Props {
  onClose: () => void;
}

/**
 * I nove confini planetari, in ordine di quanto sono stati sfondati.
 *
 * Serve a rimettere il clima in scala: è uno dei nove, ed è il quinto per
 * distanza dal limite. Chi apre questa app pensando che «inquinamento» voglia
 * dire CO₂ trova qui azoto, biosfera, plastica e acqua — e l'ozono, l'unico che
 * sta tornando indietro.
 *
 * Le barre misurano **quante volte il limite**, non il valore assoluto: ppm,
 * teragrammi e unità Dobson non si potrebbero mettere sulla stessa scala in
 * nessun altro modo. Il numero vero resta scritto accanto a ogni riga.
 */
export function BoundariesPanel({ onClose }: Props) {
  const { locale, t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prima i superati, e fra questi i più lontani dal limite: l'ordine è la
  // prima informazione della pagina.
  const rows = [...BOUNDARIES].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'crossed' ? -1 : 1;
    return (pressure(b) ?? 0) - (pressure(a) ?? 0);
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('boundaries.heading')}
      className="fixed inset-0 z-50 flex flex-col bg-ink-950/95 backdrop-blur-xl animate-fade-up"
    >
      <header className="shrink-0 border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Globe className="h-5 w-5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight text-white">
              {t('boundaries.heading')}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-400">{t('boundaries.subheading')}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
            {t('boundaries.close')}
            <kbd className="hidden rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline">
              esc
            </kbd>
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-8 px-5 py-7 sm:px-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="space-y-5 lg:sticky lg:top-0 lg:h-max">
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className="font-mono text-5xl font-bold leading-none tracking-tight"
                  style={{ color: CROSSED_COLOR }}
                >
                  {CROSSED_COUNT}
                </span>
                <span className="font-mono text-2xl font-semibold text-slate-500">
                  {t('boundaries.crossedOf')}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {t('boundaries.crossedCaption')}
              </p>
            </div>

            <p className="border-t border-white/10 pt-4 text-[11px] leading-relaxed text-slate-500">
              {t('boundaries.footnote')}
            </p>

            <div className="space-y-1 text-[10px] leading-relaxed text-slate-600">
              <a
                href={SOURCE_VALUES_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition hover:text-slate-400"
              >
                {t('boundaries.sourceValues')}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
              <a
                href={SOURCE_STATUS_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 transition hover:text-slate-400"
              >
                {t('boundaries.sourceStatus')}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </aside>

          <div className="min-w-0 space-y-5">
            {rows.map((b) => (
              <BoundaryRow key={b.id} boundary={b} locale={locale} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BoundaryRow({ boundary, locale }: { boundary: Boundary; locale: Locale }) {
  const { t } = useI18n();
  const text = boundaryText(boundary.id, locale);
  const crossed = boundary.status === 'crossed';
  const color = crossed ? CROSSED_COLOR : SAFE_COLOR;
  const p = pressure(boundary);

  const format = (v: number) =>
    v.toLocaleString(LOCALE_TAG[locale], {
      minimumFractionDigits: boundary.decimals,
      maximumFractionDigits: boundary.decimals,
    });

  return (
    <article className="border-b border-white/5 pb-5 last:border-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="text-sm font-medium text-slate-100">{text.name}</h3>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ color, background: `${color}1f` }}
        >
          {crossed ? t('boundaries.statusCrossed') : t('boundaries.statusSafe')}
        </span>
        {p !== null && (
          <span className="ml-auto shrink-0 font-mono text-sm font-semibold tabular-nums text-white">
            {boundary.atLeast ? '>' : ''}
            {p.toLocaleString(LOCALE_TAG[locale], {
              // Vicino al confine una cifra sola scrive "1×" sia sopra sia
              // sotto: proprio dove la differenza è tutta la notizia.
              maximumFractionDigits: Math.abs(p - 1) < 0.1 ? 2 : 1,
            })}
            ×
          </span>
        )}
      </div>

      <p className="mt-0.5 text-[11px] text-slate-500">
        {t('boundaries.controlVariable')}: {text.variable}
      </p>

      {/*
        Scala condivisa: metà traccia = il limite. Una riga a tre volte il
        limite riempie tutto e mostra la punta, invece di far credere che la
        scala arrivi fin lì — il numero esatto è scritto qui sopra.
      */}
      <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        {p === null ? (
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(148,163,184,0.18)_0_6px,transparent_6px_12px)]" />
        ) : (
          <div
            className="absolute inset-y-0 left-0 rounded-r-[3px]"
            style={{
              width: `${(Math.min(p, PRESSURE_SCALE_MAX) / PRESSURE_SCALE_MAX) * 100}%`,
              background: color,
            }}
          />
        )}
        <div
          className="absolute inset-y-0 w-px bg-white/40"
          style={{ left: `${(1 / PRESSURE_SCALE_MAX) * 100}%` }}
          aria-hidden
        />
      </div>

      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[11px]">
        {boundary.boundary !== null && boundary.current !== null ? (
          <>
            <span className="font-mono tabular-nums text-slate-400">
              {t('boundaries.boundaryLabel')} {format(boundary.boundary)} {boundary.unit}
            </span>
            <span className="font-mono tabular-nums text-slate-200">
              {t('boundaries.currentLabel')} {boundary.atLeast ? '>' : ''}
              {format(boundary.current)} {boundary.unit}
            </span>
          </>
        ) : (
          <span className="text-slate-500">{t('boundaries.noQuantified')}</span>
        )}
        <span className="font-mono text-[10px] text-slate-600">{boundary.year}</span>
      </div>

      <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-400">{text.note}</p>
    </article>
  );
}
