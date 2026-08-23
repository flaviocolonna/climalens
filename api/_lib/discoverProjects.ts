/**
 * Live discovery of climate/environmental projects near a place, via OpenRouter
 * with the web-search plugin.
 *
 * The one thing to preserve when editing this file:
 *
 * Every project the model returns is checked against the URLs that search
 * actually returned — read from the response's `url_citation` annotations.
 * A model can write a plausible URL for a beach cleanup that does not exist;
 * it cannot make that URL appear in the citations. Anything unmatched is
 * dropped, and the count is reported to the caller. This is the difference
 * between "an AI said there's a cleanup" and "a page exists that says there's
 * a cleanup".
 */
import {
  citationUrls,
  OPENROUTER_CHAT_URL,
  OPENROUTER_HEADERS,
  OPENROUTER_MODEL,
  OPENROUTER_PROVIDER,
  type ChatCompletion,
} from './openrouter';
import { cacheGet, cacheSet } from './cache';
import { SERVER_TEXT, type Locale } from './serverText';

export const CATEGORIES = [
  'pulizia',
  'riforestazione',
  'conservazione',
  'energia',
  'educazione',
  'ricerca',
  'advocacy',
  'altro',
] as const;

export type ProjectCategory = (typeof CATEGORIES)[number];

export interface DiscoveredProject {
  name: string;
  organization: string;
  category: ProjectCategory;
  description: string;
  location: string;
  howToParticipate: string;
  sourceUrl: string;
  /** Any date the source itself states; null when the page gives none. */
  sourceDate: string | null;
  /**
   * exact  — the model's URL is one search returned
   * domain — only the host matches; the specific page was not in the results
   */
  evidence: 'exact' | 'domain';
}

export interface DiscoveryResult {
  place: string;
  projects: DiscoveredProject[];
  searchedAt: string;
  /** Distinct URLs the web search actually returned. */
  sourcesConsulted: number;
  /** Projects discarded because their URL never appeared in the citations. */
  droppedUnverified: number;
  cached: boolean;
  model: string;
}

export interface DiscoveryInput {
  place: string;
  country?: string;
  latitude: number;
  longitude: number;
  language: Locale;
}

// --- tuning knobs -----------------------------------------------------------

const MAX_SEARCH_RESULTS = 10;
const MAX_PROJECTS = 8;
// gpt-5-mini spends part of this budget on internal reasoning tokens before
// writing the JSON body; reasoning.effort below caps that share so content
// isn't starved (see REASONING_EFFORT).
const MAX_TOKENS = 6000;
const REASONING_EFFORT = 'low';
const REQUEST_TIMEOUT_MS = 90_000;

/**
 * Il prompt chiede esplicitamente la lingua dei campi testuali, e lo schema
 * sotto è tradotto con lui: sono istruzioni AL modello, e lasciarle in
 * italiano mentre gli si chiede inglese o spagnolo inviterebbe a mescolare le
 * lingue nell'output.
 */
const SYSTEM_PROMPT: Record<Locale, string> = {
  it: `Sei un ricercatore che individua progetti ambientali e climatici concreti a cui una persona comune può partecipare.

Usa i risultati di ricerca web che ti vengono forniti per trovare progetti attivi vicino al luogo indicato: pulizie di spiagge e fiumi, riforestazione, monitoraggio civico, citizen science, gruppi di volontariato, iniziative comunali o di ONG.

Regole non negoziabili:
- Ogni progetto DEVE avere un sourceUrl preso dai risultati di ricerca che hai effettivamente ricevuto. Non costruire, indovinare o ricordare URL.
- Non inventare progetti. Se le ricerche non producono risultati utili, restituisci meno progetti — o nessuno. Un array vuoto è una risposta corretta e utile.
- Non presentare come "in corso" un'iniziativa la cui pagina non lo dice. Riporta in sourceDate solo una data che la fonte afferma; altrimenti stringa vuota.
- Preferisci iniziative ricorrenti o con un canale di contatto stabile a eventi singoli già passati.

Scrivi i campi testuali in italiano, in modo asciutto e concreto. description: una o due frasi su cosa fa il progetto. howToParticipate: come ci si unisce in pratica, non una parafrasi della descrizione.

Rispondi esclusivamente con l'oggetto JSON richiesto.`,
  en: `You are a researcher who finds concrete environmental and climate projects an ordinary person can join.

Use the web search results you are given to find active projects near the indicated place: beach and river cleanups, reforestation, civic monitoring, citizen science, volunteer groups, municipal or NGO initiatives.

Non-negotiable rules:
- Every project MUST have a sourceUrl taken from the search results you actually received. Do not construct, guess, or recall a URL.
- Do not invent projects. If the searches don't produce useful results, return fewer projects — or none. An empty array is a correct and useful answer.
- Do not present as "ongoing" an initiative whose page doesn't say so. Only put a date in sourceDate if the source explicitly states one; otherwise an empty string.
- Prefer recurring initiatives or ones with a stable contact channel over single events that have already passed.

Write the text fields in English, plainly and concretely. description: one or two sentences on what the project does. howToParticipate: how to actually join, not a paraphrase of the description.

Respond only with the requested JSON object.`,
  es: `Eres un investigador que localiza proyectos ambientales y climáticos concretos en los que una persona común puede participar.

Usa los resultados de búsqueda web que se te proporcionan para encontrar proyectos activos cerca del lugar indicado: limpiezas de playas y ríos, reforestación, monitoreo cívico, ciencia ciudadana, grupos de voluntariado, iniciativas municipales o de ONG.

Reglas no negociables:
- Cada proyecto DEBE tener un sourceUrl tomado de los resultados de búsqueda que realmente recibiste. No construyas, adivines ni recuerdes una URL.
- No inventes proyectos. Si las búsquedas no producen resultados útiles, devuelve menos proyectos, o ninguno. Un array vacío es una respuesta correcta y útil.
- No presentes como "en curso" una iniciativa cuya página no lo indique. Indica en sourceDate solo una fecha que la fuente declare explícitamente; si no, una cadena vacía.
- Prefiere iniciativas recurrentes o con un canal de contacto estable frente a eventos puntuales ya pasados.

Escribe los campos de texto en español, de forma clara y concreta. description: una o dos frases sobre qué hace el proyecto. howToParticipate: cómo unirse en la práctica, no una paráfrasis de la descripción.

Responde únicamente con el objeto JSON solicitado.`,
};

function responseSchema(language: Locale) {
  const d = {
    it: {
      projects: `Massimo ${MAX_PROJECTS} progetti. Array vuoto se non hai trovato nulla di verificabile.`,
      name: "Nome del progetto o dell'iniziativa",
      organization: 'Ente, ONG o gruppo che lo organizza',
      description: 'Una o due frasi su cosa fa',
      location: 'Dove si svolge',
      howToParticipate: 'Come partecipare in pratica',
      sourceUrl: 'URL preso dai risultati di ricerca ricevuti. Mai inventato.',
      sourceDate:
        'Data dichiarata esplicitamente dalla fonte (es. "12 marzo 2026" o "ogni sabato"). Stringa vuota se la fonte non indica alcuna data.',
    },
    en: {
      projects: `At most ${MAX_PROJECTS} projects. Empty array if you found nothing verifiable.`,
      name: 'Name of the project or initiative',
      organization: 'Organization, NGO, or group running it',
      description: 'One or two sentences on what it does',
      location: 'Where it takes place',
      howToParticipate: 'How to participate in practice',
      sourceUrl: 'URL taken from the search results received. Never invented.',
      sourceDate:
        'Date explicitly stated by the source (e.g. "March 12, 2026" or "every Saturday"). Empty string if the source states no date.',
    },
    es: {
      projects: `Máximo ${MAX_PROJECTS} proyectos. Array vacío si no encontraste nada verificable.`,
      name: 'Nombre del proyecto o la iniciativa',
      organization: 'Entidad, ONG o grupo que lo organiza',
      description: 'Una o dos frases sobre qué hace',
      location: 'Dónde se lleva a cabo',
      howToParticipate: 'Cómo participar en la práctica',
      sourceUrl: 'URL tomada de los resultados de búsqueda recibidos. Nunca inventada.',
      sourceDate:
        'Fecha declarada explícitamente por la fuente (p. ej. "12 de marzo de 2026" o "cada sábado"). Cadena vacía si la fuente no indica ninguna fecha.',
    },
  }[language];

  return {
    name: 'environmental_projects',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        projects: {
          type: 'array',
          description: d.projects,
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: d.name },
              organization: { type: 'string', description: d.organization },
              category: { type: 'string', enum: [...CATEGORIES] },
              description: { type: 'string', description: d.description },
              location: { type: 'string', description: d.location },
              howToParticipate: { type: 'string', description: d.howToParticipate },
              sourceUrl: { type: 'string', description: d.sourceUrl },
              // Plain string rather than a ["string","null"] union: strict mode
              // restricts which JSON Schema features are available, and an empty
              // string is normalised to null below anyway.
              sourceDate: { type: 'string', description: d.sourceDate },
            },
            required: [
              'name',
              'organization',
              'category',
              'description',
              'location',
              'howToParticipate',
              'sourceUrl',
              'sourceDate',
            ],
            additionalProperties: false,
          },
        },
      },
      required: ['projects'],
      additionalProperties: false,
    },
  };
}

// --- cache ------------------------------------------------------------------

/** Keyed by a coarse geographic cell so neighbouring lookups share an entry. */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_CELL_DEGREES = 0.5;

function cacheKey(input: DiscoveryInput): string {
  const la = Math.round(input.latitude / CACHE_CELL_DEGREES);
  const lo = Math.round(input.longitude / CACHE_CELL_DEGREES);
  // La lingua entra nella chiave: senza, un utente in spagnolo potrebbe
  // ricevere in cache la descrizione italiana scritta per il vicino di cella.
  return `discovery:${input.language}:${la}:${lo}`;
}

// --- URL evidence -----------------------------------------------------------

function normaliseUrl(raw: string): { href: string; host: string } | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    const path = u.pathname.replace(/\/$/, '');
    return { href: `${host}${path}`, host };
  } catch {
    return null;
  }
}

/** Some models still wrap JSON in a markdown fence despite the schema. */
function parseJsonContent(content: string): unknown {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
  return JSON.parse(cleaned);
}

// --- main -------------------------------------------------------------------

export class DiscoveryError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'DiscoveryError';
  }
}

export async function discoverProjects(input: DiscoveryInput): Promise<DiscoveryResult> {
  const text = SERVER_TEXT[input.language];
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new DiscoveryError(text.apiKeyMissing, 500);
  }

  const key = cacheKey(input);
  const hit = await cacheGet<DiscoveryResult>(key, CACHE_TTL_MS);
  if (hit) {
    return { ...hit, cached: true };
  }

  const where = [input.place, input.country].filter(Boolean).join(', ');
  const userPrompt =
    `Luogo: ${where} (${input.latitude.toFixed(3)}, ${input.longitude.toFixed(3)}).\n\n` +
    `Trova progetti ambientali e climatici attivi in questa zona o nella regione circostante, ` +
    `a cui una persona che vive lì potrebbe partecipare. Massimo ${MAX_PROJECTS}.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let completion: ChatCompletion;
  try {
    const res = await fetch(OPENROUTER_CHAT_URL, {
      method: 'POST',
      headers: { ...OPENROUTER_HEADERS, Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT[input.language] },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: MAX_TOKENS,
        reasoning: { effort: REASONING_EFFORT },
        response_format: { type: 'json_schema', json_schema: responseSchema(input.language) },
        plugins: [
          // Explicit plugin config rather than the `:online` model suffix, so
          // max_results is ours to set instead of defaulting to 5.
          { id: 'web', max_results: MAX_SEARCH_RESULTS },
          { id: 'response-healing' },
        ],
        provider: OPENROUTER_PROVIDER,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      if (res.status === 429) {
        throw new DiscoveryError(text.openRouterRateLimited, 429);
      }
      if (res.status === 401 || res.status === 403) {
        throw new DiscoveryError(
          `${text.openRouterInvalidKey}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
          502,
        );
      }
      throw new DiscoveryError(
        `${text.openRouterError} ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
        502,
      );
    }

    completion = (await res.json()) as ChatCompletion;
  } catch (err) {
    if (err instanceof DiscoveryError) throw err;
    if ((err as Error).name === 'AbortError') {
      throw new DiscoveryError(text.searchTimeout, 504);
    }
    throw new DiscoveryError(text.searchFailed((err as Error).message), 502);
  } finally {
    clearTimeout(timeout);
  }

  if (completion.error) {
    throw new DiscoveryError(completion.error.message ?? text.openRouterGenericError, 502);
  }

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    const reason = completion.choices?.[0]?.finish_reason;
    throw new DiscoveryError(reason ? text.noContentWithReason(reason) : `${text.noContent}.`, 502);
  }

  let parsed: unknown;
  try {
    parsed = parseJsonContent(content);
  } catch {
    throw new DiscoveryError(text.invalidJson, 502);
  }

  const raw = Array.isArray((parsed as { projects?: unknown })?.projects)
    ? ((parsed as { projects: unknown[] }).projects as Record<string, unknown>[])
    : [];

  // Keep only what the search citations can actually back up.
  const searchUrls = new Set(citationUrls(completion));
  const searchHosts = new Set<string>();
  const searchHrefs = new Set<string>();
  for (const u of searchUrls) {
    const n = normaliseUrl(u);
    if (!n) continue;
    searchHosts.add(n.host);
    searchHrefs.add(n.href);
  }

  const projects: DiscoveredProject[] = [];
  let dropped = 0;

  for (const p of raw) {
    const sourceUrl = typeof p.sourceUrl === 'string' ? p.sourceUrl : '';
    const n = normaliseUrl(sourceUrl);
    if (!n) {
      dropped++;
      continue;
    }
    const evidence: 'exact' | 'domain' | null = searchHrefs.has(n.href)
      ? 'exact'
      : searchHosts.has(n.host)
        ? 'domain'
        : null;
    if (!evidence) {
      dropped++;
      continue;
    }

    projects.push({
      name: String(p.name ?? '').trim(),
      organization: String(p.organization ?? '').trim(),
      category: (CATEGORIES as readonly string[]).includes(p.category as string)
        ? (p.category as ProjectCategory)
        : 'altro',
      description: String(p.description ?? '').trim(),
      location: String(p.location ?? '').trim(),
      howToParticipate: String(p.howToParticipate ?? '').trim(),
      sourceUrl,
      sourceDate: typeof p.sourceDate === 'string' && p.sourceDate.trim() ? p.sourceDate.trim() : null,
      evidence,
    });
  }

  const result: DiscoveryResult = {
    place: where,
    projects: projects.slice(0, MAX_PROJECTS),
    searchedAt: new Date().toISOString(),
    sourcesConsulted: searchUrls.size,
    droppedUnverified: dropped,
    cached: false,
    model: OPENROUTER_MODEL,
  };

  await cacheSet(key, result, CACHE_TTL_MS);
  return result;
}
