import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ExternalLink, Loader2, Search, Sparkles } from 'lucide-react';
import {
  CATEGORY_LABELS,
  discoverProjects,
  type DiscoveredProject,
  type DiscoveryResult,
} from '@/lib/projects';
import type { SelectedPlace } from '@/types';
import { useI18n } from '@/i18n/LocaleProvider';

interface Props {
  place: SelectedPlace;
  country?: string;
}

/**
 * On-demand rather than automatic: each search costs an API call, and a user
 * scrubbing the map should not be spending money with every click.
 */
export function ProjectsPanel({ place, country }: Props) {
  const { locale, t } = useI18n();
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // A result belongs to the place it was fetched for — reset on change.
  useEffect(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setResult(null);
    setError(null);
    setLoading(false);
  }, [place.key]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const run = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const found = await discoverProjects(
        {
          place: place.isUnnamedPoint ? place.subtitle : place.name,
          country,
          latitude: place.latitude,
          longitude: place.longitude,
          language: locale,
        },
        controller.signal,
      );
      setResult(found);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError((err as Error).message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  return (
    <section className="border-t border-white/10 pt-4">
      <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        <Sparkles className="h-3 w-3 text-sky-400" />
        {t('projectsPanel.heading')}
      </h3>

      {!result && !loading && !error && (
        <>
          <p className="mb-3 text-xs leading-relaxed text-slate-500">{t('projectsPanel.intro')}</p>
          <button
            onClick={run}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-400/30 bg-sky-500/10 py-2.5 text-sm font-medium text-sky-300 transition hover:border-sky-400/50 hover:bg-sky-500/15 active:scale-[0.99]"
          >
            <Search className="h-3.5 w-3.5" />
            {t('projectsPanel.searchButton')}
          </button>
        </>
      )}

      {loading && (
        <div className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-4 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-400" />
          <span>
            {t('projectsPanel.loadingPrefix', { place: place.isUnnamedPoint ? t('app.unnamedPoint') : place.name })}
            <span className="mt-0.5 block text-slate-600">{t('projectsPanel.loadingHint')}</span>
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2.5 text-xs text-amber-200/90">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          <div className="min-w-0">
            <p>{error}</p>
            <button onClick={run} className="mt-1.5 text-amber-300 underline hover:text-amber-200">
              {t('projectsPanel.retry')}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-2.5">
          {result.projects.length === 0 ? (
            <p className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-4 text-xs leading-relaxed text-slate-400">
              {t('projectsPanel.noProjects')}
            </p>
          ) : (
            result.projects.map((p) => <ProjectCard key={p.sourceUrl + p.name} project={p} />)
          )}

          <Provenance result={result} onRefresh={run} />
        </div>
      )}
    </section>
  );
}

function ProjectCard({ project }: { project: DiscoveredProject }) {
  const { locale, t } = useI18n();
  return (
    <article className="rounded-lg border border-white/5 bg-white/[0.03] p-3 transition hover:border-white/10">
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-tight text-slate-100">{project.name}</h4>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
          {CATEGORY_LABELS[locale][project.category]}
        </span>
      </div>

      <p className="text-[11px] text-slate-500">{project.organization}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{project.description}</p>

      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        <span className="text-slate-500">{t('projectsPanel.howToParticipate')}</span>
        {project.howToParticipate}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-white/5 pt-2">
        <a
          href={project.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-[11px] text-sky-400 transition hover:text-sky-300"
        >
          <ExternalLink className="h-3 w-3" />
          {t('projectsPanel.source')}
        </a>
        {project.sourceDate && (
          <span className="font-mono text-[10px] text-slate-600">{project.sourceDate}</span>
        )}
      </div>
    </article>
  );
}

function Provenance({ result, onRefresh }: { result: DiscoveryResult; onRefresh: () => void }) {
  const { t } = useI18n();
  return (
    <div className="pt-1 text-[10px] leading-relaxed text-slate-600">
      {result.cached && `${t('projectsPanel.cached')} · `}
      <span className="font-mono">{result.model}</span>
      {' · '}
      <button onClick={onRefresh} className="underline transition hover:text-slate-400">
        {t('projectsPanel.refresh')}
      </button>
    </div>
  );
}
