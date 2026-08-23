/**
 * Open-Meteo clients. Both endpoints are free and keyless.
 *  - geocoding: place search for the search bar
 *  - archive:   ERA5 reanalysis, used to put an *absolute* temperature next to
 *               the anomaly (GISTEMP only ships anomalies)
 */
import type { Locale } from '@/i18n/locale';
import { DICTIONARIES } from '@/i18n/dictionaries';
import { translate } from '@/i18n/t';

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

/** ERA5 in Open-Meteo's archive starts here. */
export const ERA5_START_YEAR = 1940;

export interface Place {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  countryCode?: string;
  admin1?: string;
  population?: number;
  elevation?: number;
}

interface GeocodeResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    country_code?: string;
    admin1?: string;
    population?: number;
    elevation?: number;
  }>;
}

export async function searchPlaces(
  query: string,
  locale: Locale,
  signal?: AbortSignal,
): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = `${GEOCODE_URL}?name=${encodeURIComponent(q)}&count=8&language=${locale}&format=json`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(translate(DICTIONARIES[locale], 'search.searchFailed'));
  }

  const json = (await res.json()) as GeocodeResponse;
  return (json.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country,
    countryCode: r.country_code,
    admin1: r.admin1,
    population: r.population,
    elevation: r.elevation,
  }));
}

/**
 * Soglie giornaliere. Sono convenzioni climatologiche comuni, non definizioni
 * universali: la notte tropicale a 20°C è quella usata in Europa, il giorno di
 * gelo è definito sulla minima e non sulla media.
 */
export const THRESHOLDS = {
  /** Giorno caldo: massima ≥ 30 °C. */
  hotDay: 30,
  /** Notte tropicale: minima ≥ 20 °C — quella in cui non ci si rinfresca. */
  tropicalNight: 20,
  /** Giorno di gelo: minima ≤ 0 °C. */
  frost: 0,
} as const;

export type ThresholdId = keyof typeof THRESHOLDS;

/** Giorni all'anno, mediati su una finestra trentennale. */
export type ThresholdDays = Record<ThresholdId, number | null>;

/** Le due finestre di riferimento, le stesse usate per le medie assolute. */
export const NORMALS = {
  first: [1941, 1970],
  last: [1995, 2024],
} as const;

export interface AbsoluteTemps {
  /** Annual mean of daily mean temperature, °C. */
  byYear: Array<{ year: number; value: number }>;
  firstNormal: number | null; // 1941-1970 mean
  lastNormal: number | null; // 1995-2024 mean
  /** Giorni oltre soglia per anno, nelle due finestre. */
  firstDays: ThresholdDays;
  lastDays: ThresholdDays;
}

/** A year needs this many daily values before its mean is trustworthy. */
const MIN_DAYS = 300;

const EMPTY_DAYS: ThresholdDays = { hotDay: null, tropicalNight: null, frost: null };

/**
 * Pulls the full daily series for a point and folds it into annual means plus
 * the counts of days over the thresholds people actually feel.
 *
 * Massime e minime triplicano il JSON ma non la banda: sono ~190KB gzippati
 * per 86 anni, perché una colonna di numeri simili si comprime bene. Resta un
 * arricchimento di sfondo, non qualcosa su cui bloccare l'interfaccia.
 */
export function fetchAbsoluteTemps(
  lat: number,
  lon: number,
  locale: Locale,
  signal?: AbortSignal,
): Promise<AbsoluteTemps> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  let pending = cache.get(key);
  if (!pending) {
    // Le risposte riuscite sono solo numeri, condivisibili fra lingue; un
    // rifiuto invece porta un messaggio nella lingua di chi ha fatto la
    // richiesta, quindi esce subito dalla cache e non resta a metà.
    pending = request(lat, lon, locale);
    cache.set(key, pending);
    pending.catch(() => cache.delete(key));
  }
  // La richiesta continua anche se chi l'ha chiesta se ne va: chiudere il
  // pannello un attimo prima non deve buttare via i 190KB già in volo.
  return signal ? untilAborted(pending, signal) : pending;
}

/**
 * Una richiesta per punto e per sessione. Serve anche a StrictMode, che in dev
 * monta ogni effetto due volte: senza cache sarebbero due chiamate identiche a
 * un'API che conta il peso di quello che chiedi.
 */
const cache = new Map<string, Promise<AbsoluteTemps>>();

/**
 * Lascia correre la richiesta e rifiuta solo la promessa di chi ha annullato:
 * chiudere un pannello un attimo prima non deve buttare via dati già in volo,
 * che restano in cache per il prossimo che li chiede. Esportata perché la
 * qualità dell'aria parla con lo stesso fornitore e vuole lo stesso patto.
 */
export function untilAborted<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  // Mai mostrato: il chiamante scarta gli AbortError prima di leggere il
  // messaggio, quindi non ha bisogno di essere nella lingua dell'interfaccia.
  const aborted = () => new DOMException('Request aborted', 'AbortError');
  if (signal.aborted) return Promise.reject(aborted());
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(aborted());
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

async function request(lat: number, lon: number, locale: Locale): Promise<AbsoluteTemps> {
  const endYear = new Date().getUTCFullYear() - 1;
  const url =
    `${ARCHIVE_URL}?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    `&start_date=${ERA5_START_YEAR}-01-01&end_date=${endYear}-12-31` +
    `&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min&timezone=UTC`;

  const res = await fetch(url);
  const dict = DICTIONARIES[locale];
  // Open-Meteo pesa le richieste per giorni × variabili, e questa è grossa:
  // vale la pena distinguere "il limite è pieno" da "qui non c'è niente".
  if (res.status === 429) {
    throw new Error(translate(dict, 'locationPanel.era5RateLimited'));
  }
  if (!res.ok) {
    throw new Error(translate(dict, 'locationPanel.era5SeriesUnavailable', { status: res.status }));
  }
  const json = (await res.json()) as {
    daily?: {
      time: string[];
      temperature_2m_mean: (number | null)[];
      temperature_2m_max: (number | null)[];
      temperature_2m_min: (number | null)[];
    };
  };
  const daily = json.daily;
  if (!daily?.time) {
    return {
      byYear: [],
      firstNormal: null,
      lastNormal: null,
      firstDays: EMPTY_DAYS,
      lastDays: EMPTY_DAYS,
    };
  }

  interface YearAcc {
    sum: number;
    n: number;
    hotDay: number;
    tropicalNight: number;
    frost: number;
  }
  const years = new Map<number, YearAcc>();

  for (let i = 0; i < daily.time.length; i++) {
    const year = Number(daily.time[i].slice(0, 4));
    let acc = years.get(year);
    if (!acc) {
      acc = { sum: 0, n: 0, hotDay: 0, tropicalNight: 0, frost: 0 };
      years.set(year, acc);
    }
    const mean = daily.temperature_2m_mean[i];
    if (mean !== null && mean !== undefined) {
      acc.sum += mean;
      acc.n++;
    }
    const max = daily.temperature_2m_max[i];
    if (max !== null && max !== undefined && max >= THRESHOLDS.hotDay) acc.hotDay++;
    const min = daily.temperature_2m_min[i];
    if (min !== null && min !== undefined) {
      if (min >= THRESHOLDS.tropicalNight) acc.tropicalNight++;
      if (min <= THRESHOLDS.frost) acc.frost++;
    }
  }

  // Un anno con buchi conterebbe meno giorni sopra soglia solo perché ne ha
  // meno in tutto: sotto la soglia di completezza non entra in nessuna media.
  const complete = [...years.entries()]
    .filter(([, a]) => a.n >= MIN_DAYS)
    .sort((a, b) => a[0] - b[0]);

  const byYear = complete.map(([year, a]) => ({ year, value: a.sum / a.n }));

  const inWindow = (from: number, to: number) => complete.filter(([y]) => y >= from && y <= to);

  const normal = (from: number, to: number) => {
    const w = inWindow(from, to);
    return w.length ? w.reduce((s, [, a]) => s + a.sum / a.n, 0) / w.length : null;
  };

  const days = (from: number, to: number): ThresholdDays => {
    const w = inWindow(from, to);
    if (!w.length) return EMPTY_DAYS;
    const mean = (key: ThresholdId) => w.reduce((s, [, a]) => s + a[key], 0) / w.length;
    return { hotDay: mean('hotDay'), tropicalNight: mean('tropicalNight'), frost: mean('frost') };
  };

  return {
    byYear,
    firstNormal: normal(...NORMALS.first),
    lastNormal: normal(...NORMALS.last),
    firstDays: days(...NORMALS.first),
    lastDays: days(...NORMALS.last),
  };
}
