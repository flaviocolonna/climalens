/**
 * Lo stato che vale la pena condividere, in query string.
 *
 * Fino a ieri un link a ClimaLens portava sempre al 2025 senza contesto: la
 * cosa interessante l'aveva vista solo chi la mandava. Qui dentro finiscono
 * l'anno, il punto aperto, il pannello a tutto schermo aperto e il layer della mappa.
 *
 * Si scrive con `replaceState`: scorrere gli anni non deve riempire la
 * cronologia di 146 voci da cui il tasto "indietro" non esce più.
 *
 * I nomi dei parametri sono in inglese e snake_case (`year`, `place`,
 * `country_code`, …) — la lingua dell'interfaccia invece resta solo
 * client-side (rilevata dal browser, salvata in localStorage) e non passa
 * mai per l'URL: un link condiviso non deve imporre la lingua di chi lo manda
 * a chi lo apre.
 */
import { isMetricId, type AnyMetricId } from '@/lib/mapMetrics';
import { clampStep } from '@/lib/tour';
import type { SelectedPlace } from '@/types';
import { detectLocale } from '@/i18n/locale';
import { DICTIONARIES } from '@/i18n/dictionaries';
import { translate } from '@/i18n/t';

/** I pannelli a tutto schermo: se ne apre uno per volta, e l'URL se lo ricorda. */
export type PanelId = 'sectors' | 'boundaries' | 'actions' | 'future' | 'knowledge';

const PANEL_IDS: PanelId[] = ['sectors', 'boundaries', 'actions', 'future', 'knowledge'];

export interface UrlState {
  year: number | null;
  place: SelectedPlace | null;
  panel: PanelId | null;
  metric: AnyMetricId | null;
  /** Passo del percorso guidato, o null se non è in corso. */
  tour: number | null;
}


/** Same fallback grid step App.tsx uses before the real grid has loaded. */
const DEFAULT_GRID_STEP = 2;

export function readUrlState(): UrlState {
  const q = new URLSearchParams(window.location.search);

  const year = Number(q.get('year'));
  const lat = Number(q.get('lat'));
  const lon = Number(q.get('lon'));
  const hasPoint = q.has('lat') && q.has('lon') && Number.isFinite(lat) && Number.isFinite(lon);

  const metric = q.get('layer');

  const name = q.get('place');
  const dict = DICTIONARIES[detectLocale()];

  return {
    year: Number.isFinite(year) && year > 0 ? year : null,
    place: hasPoint
      ? {
          // La chiave identifica il punto, non la sessione: due link uguali
          // devono produrre lo stesso `key`, o il pannello si ricarica a vuoto.
          key: `url-${lat.toFixed(3)}-${lon.toFixed(3)}`,
          name: name || translate(dict, 'app.unnamedPoint'),
          subtitle:
            q.get('subtitle') ||
            translate(dict, 'app.gridCellSubtitle', {
              latStep: DEFAULT_GRID_STEP,
              lonStep: DEFAULT_GRID_STEP,
            }),
          latitude: clamp(lat, -90, 90),
          longitude: clamp(lon, -180, 180),
          country: q.get('country') || undefined,
          // Il codice del paese viaggia con il link: senza, un punto ricaricato
          // da un URL verrebbe riattribuito dai confini, che sui micro-stati
          // sbagliano.
          countryCode: q.get('country_code')?.toUpperCase() || undefined,
          isUnnamedPoint: !name,
        }
      : null,
    panel: PANEL_IDS.includes(q.get('panel') as PanelId) ? (q.get('panel') as PanelId) : null,
    metric: isMetricId(metric) ? metric : null,
    tour: clampStep(q.has('tour') ? Number(q.get('tour')) : null),
  };
}

export function writeUrlState(state: UrlState): void {
  const q = new URLSearchParams();
  if (state.year !== null) q.set('year', String(state.year));
  if (state.place) {
    q.set('lat', state.place.latitude.toFixed(3));
    q.set('lon', state.place.longitude.toFixed(3));
    // Un punto senza nome non ne scrive uno: il testo che l'app mostra oggi è
    // solo un'etichetta tradotta, non un nome reale da rimettere nell'URL.
    if (!state.place.isUnnamedPoint) {
      q.set('place', state.place.name);
      q.set('subtitle', state.place.subtitle);
    }
    if (state.place.country) q.set('country', state.place.country);
    if (state.place.countryCode) q.set('country_code', state.place.countryCode);
  }
  if (state.panel) q.set('panel', state.panel);
  if (state.metric) q.set('layer', state.metric);
  if (state.tour !== null) q.set('tour', String(state.tour));

  const query = q.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ''}`;
  if (next !== `${window.location.pathname}${window.location.search}`) {
    window.history.replaceState(null, '', next);
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
