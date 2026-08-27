/**
 * Client for the project-discovery endpoint.
 *
 * These types mirror the wire format produced by `api/_lib/discoverProjects.ts`.
 * They are duplicated rather than imported because that module pulls in the
 * Anthropic SDK, which must never reach the browser bundle.
 */
import type { Locale } from '@/i18n/locale';
import { DICTIONARIES } from '@/i18n/dictionaries';
import { translate } from '@/i18n/t';

export type ProjectCategory =
  | 'pulizia'
  | 'riforestazione'
  | 'conservazione'
  | 'energia'
  | 'educazione'
  | 'ricerca'
  | 'advocacy'
  | 'altro';

export interface DiscoveredProject {
  name: string;
  organization: string;
  category: ProjectCategory;
  description: string;
  location: string;
  howToParticipate: string;
  sourceUrl: string;
  sourceDate: string | null;
}

export interface DiscoveryResult {
  place: string;
  projects: DiscoveredProject[];
  searchedAt: string;
  cached: boolean;
  model: string;
}

/** Category ids stay as internal identifiers (never rendered directly) — only their labels localize. */
export const CATEGORY_LABELS: Record<Locale, Record<ProjectCategory, string>> = {
  it: {
    pulizia: 'Pulizia',
    riforestazione: 'Riforestazione',
    conservazione: 'Conservazione',
    energia: 'Energia',
    educazione: 'Educazione',
    ricerca: 'Citizen science',
    advocacy: 'Advocacy',
    altro: 'Altro',
  },
  en: {
    pulizia: 'Cleanup',
    riforestazione: 'Reforestation',
    conservazione: 'Conservation',
    energia: 'Energy',
    educazione: 'Education',
    ricerca: 'Citizen science',
    advocacy: 'Advocacy',
    altro: 'Other',
  },
  es: {
    pulizia: 'Limpieza',
    riforestazione: 'Reforestación',
    conservazione: 'Conservación',
    energia: 'Energía',
    educazione: 'Educación',
    ricerca: 'Ciencia ciudadana',
    advocacy: 'Activismo',
    altro: 'Otro',
  },
};

export async function discoverProjects(
  input: { place: string; country?: string; latitude: number; longitude: number; language: Locale },
  signal?: AbortSignal,
): Promise<DiscoveryResult> {
  const dict = DICTIONARIES[input.language];
  const res = await fetch('/api/discover-projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  });

  const payload = (await res.json().catch(() => null)) as
    | (DiscoveryResult & { error?: string })
    | null;

  if (!res.ok) {
    throw new Error(payload?.error ?? translate(dict, 'projectsPanel.searchFailed', { status: res.status }));
  }
  if (!payload) throw new Error(translate(dict, 'projectsPanel.invalidResponse'));
  return payload;
}
