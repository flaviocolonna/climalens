/**
 * Framework-agnostic core of the discovery endpoint: validation, rate limiting,
 * and error shaping. Both the Vercel function and the Vite dev middleware wrap
 * this, so local and deployed behaviour cannot drift apart.
 */
import { discoverProjects, DiscoveryError, type DiscoveryInput } from './discoverProjects';
import { parseLocale, SERVER_TEXT } from './serverText';

export interface HandlerResponse {
  status: number;
  body: unknown;
}

/**
 * Every discovery call costs real money, so the endpoint is capped twice:
 * per-caller (stops one user hammering it) and globally (bounds the bill even
 * if the per-caller limit is evaded).
 */
const PER_IP_LIMIT = 8;
const PER_IP_WINDOW_MS = 60 * 60 * 1000;
const GLOBAL_DAILY_LIMIT = 200;

const ipHits = new Map<string, number[]>();
let globalCount = 0;
let globalWindowStart = Date.now();

function rateLimit(ip: string, language: ReturnType<typeof parseLocale>): string | null {
  const now = Date.now();
  const text = SERVER_TEXT[language];

  if (now - globalWindowStart > 24 * 60 * 60 * 1000) {
    globalWindowStart = now;
    globalCount = 0;
  }
  if (globalCount >= GLOBAL_DAILY_LIMIT) {
    return text.dailyLimitReached;
  }

  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < PER_IP_WINDOW_MS);
  if (hits.length >= PER_IP_LIMIT) {
    return text.tooManySearches;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  globalCount++;
  return null;
}

function parseInput(body: unknown): DiscoveryInput {
  const b = (body ?? {}) as Record<string, unknown>;
  // Analizzata per prima: serve a scegliere la lingua dei messaggi di errore
  // per tutti i controlli che seguono, compresi quelli su questo stesso corpo.
  const language = parseLocale(b.language);
  const text = SERVER_TEXT[language];

  const place = typeof b.place === 'string' ? b.place.trim() : '';
  const latitude = Number(b.latitude);
  const longitude = Number(b.longitude);

  if (!place || place.length > 120) {
    throw new DiscoveryError(text.placeInvalid, 400);
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new DiscoveryError(text.latitudeInvalid, 400);
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new DiscoveryError(text.longitudeInvalid, 400);
  }

  const country = typeof b.country === 'string' ? b.country.trim().slice(0, 80) : undefined;
  return { place, country: country || undefined, latitude, longitude, language };
}

export async function handleDiscovery(body: unknown, ip: string): Promise<HandlerResponse> {
  let language = parseLocale((body as Record<string, unknown> | null)?.language);
  try {
    const input = parseInput(body);
    language = input.language;

    const limited = rateLimit(ip, language);
    if (limited) return { status: 429, body: { error: limited } };

    return { status: 200, body: await discoverProjects(input) };
  } catch (err) {
    if (err instanceof DiscoveryError) {
      return { status: err.status, body: { error: err.message } };
    }
    // Never leak an internal stack trace to the client.
    console.error('[discover-projects]', err);
    return { status: 500, body: { error: SERVER_TEXT[language].internalError } };
  }
}
