/**
 * Shared OpenRouter configuration.
 *
 * Mirrors the convention used in the startup-buddy project's
 * `supabase/functions/_shared/openrouter.ts`: EU-only routing is on by default
 * for GDPR, which pins requests to the EU endpoint and constrains provider
 * routing to zero data retention / no training.
 *
 * Ported from Deno to Node — `process.env` rather than `Deno.env.get`.
 */

const flag = (process.env.OPENROUTER_EU ?? 'true').toLowerCase();
export const OPENROUTER_EU = flag !== 'false' && flag !== '0';

export const OPENROUTER_BASE_URL = OPENROUTER_EU
  ? 'https://eu.openrouter.ai/api/v1'
  : 'https://openrouter.ai/api/v1';

export const OPENROUTER_CHAT_URL = `${OPENROUTER_BASE_URL}/chat/completions`;

/** Swappable without touching code — see .env.example. */
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? 'openai/gpt-5-mini';

/**
 * Provider preferences merged into every request body.
 *
 * `require_parameters` is not just a nicety here: without it the router may
 * pick an endpoint that ignores `response_format`, and the JSON schema is
 * silently downgraded to a suggestion.
 */
export const OPENROUTER_PROVIDER: Record<string, unknown> = {
  require_parameters: true,
  ...(OPENROUTER_EU
    ? {
      data_collection: 'deny',
      allow_fallbacks: true,
      zdr: true,
    }
    : {}),
};

export const OPENROUTER_HEADERS = {
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://climalens.app',
  'X-Title': 'ClimaLens Project Discovery',
  'X-OpenRouter-Opt-Out': 'true',
};

// --- response shapes --------------------------------------------------------

/** Web search results come back as message annotations, not as tool blocks. */
export interface UrlCitation {
  type: 'url_citation';
  url_citation: {
    url: string;
    title?: string;
    content?: string;
    start_index?: number;
    end_index?: number;
  };
}

export interface ChatCompletion {
  choices?: Array<{
    finish_reason?: string;
    message?: {
      content?: string | null;
      annotations?: UrlCitation[];
    };
  }>;
  error?: { message?: string; code?: number };
}

/** Every URL the web search actually surfaced, in order. */
export function citationUrls(completion: ChatCompletion): string[] {
  const annotations = completion.choices?.[0]?.message?.annotations ?? [];
  return annotations
    .filter((a) => a?.type === 'url_citation' && typeof a.url_citation?.url === 'string')
    .map((a) => a.url_citation.url);
}
