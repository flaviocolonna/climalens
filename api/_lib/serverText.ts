/**
 * User-facing strings for the discovery endpoint, server-side. Deliberately
 * separate from `src/i18n/` — `api/` must never import from `src/`, the same
 * boundary that keeps the OpenRouter key out of the client bundle (see
 * `openrouter.ts`). Small enough to duplicate the three-locale shape rather
 * than share it.
 */

export type Locale = 'it' | 'en' | 'es';

function isLocale(v: unknown): v is Locale {
  return v === 'it' || v === 'en' || v === 'es';
}

/** Trusts the client-declared language; falls back for anything unexpected. */
export function parseLocale(v: unknown): Locale {
  return isLocale(v) ? v : 'en';
}

export const SERVER_TEXT: Record<
  Locale,
  {
    methodNotAllowed: string;
    internalError: string;
    placeInvalid: string;
    latitudeInvalid: string;
    longitudeInvalid: string;
    dailyLimitReached: string;
    tooManySearches: string;
    apiKeyMissing: string;
    openRouterRateLimited: string;
    openRouterInvalidKey: string;
    openRouterError: string;
    searchTimeout: string;
    searchFailed: (message: string) => string;
    noContent: string;
    noContentWithReason: (reason: string) => string;
    invalidJson: string;
    openRouterGenericError: string;
  }
> = {
  it: {
    methodNotAllowed: 'Metodo non consentito.',
    internalError: 'Errore interno durante la ricerca.',
    placeInvalid: 'Parametro "place" mancante o troppo lungo.',
    latitudeInvalid: 'Latitudine non valida.',
    longitudeInvalid: 'Longitudine non valida.',
    dailyLimitReached: 'Limite giornaliero della demo raggiunto. Riprova domani.',
    tooManySearches: 'Troppe ricerche. Riprova tra qualche minuto.',
    apiKeyMissing: 'OPENROUTER_API_KEY non configurata sul server.',
    openRouterRateLimited: 'Limite di richieste OpenRouter raggiunto. Riprova tra poco.',
    openRouterInvalidKey: 'Chiave OpenRouter non valida o senza credito',
    openRouterError: 'OpenRouter ha risposto',
    searchTimeout: 'La ricerca ha superato il tempo massimo.',
    searchFailed: (message) => `Ricerca non riuscita: ${message}`,
    noContent: 'Il modello non ha restituito alcun contenuto',
    noContentWithReason: (reason) => `Il modello non ha restituito alcun contenuto (finish_reason: ${reason}).`,
    invalidJson: 'Il modello ha restituito JSON non valido.',
    openRouterGenericError: 'Errore OpenRouter.',
  },
  en: {
    methodNotAllowed: 'Method not allowed.',
    internalError: 'Internal error during the search.',
    placeInvalid: 'Missing or too-long "place" parameter.',
    latitudeInvalid: 'Invalid latitude.',
    longitudeInvalid: 'Invalid longitude.',
    dailyLimitReached: 'Daily demo limit reached. Try again tomorrow.',
    tooManySearches: 'Too many searches. Try again in a few minutes.',
    apiKeyMissing: 'OPENROUTER_API_KEY is not configured on the server.',
    openRouterRateLimited: 'OpenRouter request limit reached. Try again shortly.',
    openRouterInvalidKey: 'Invalid or out-of-credit OpenRouter key',
    openRouterError: 'OpenRouter responded',
    searchTimeout: 'The search took too long.',
    searchFailed: (message) => `Search failed: ${message}`,
    noContent: 'The model returned no content',
    noContentWithReason: (reason) => `The model returned no content (finish_reason: ${reason}).`,
    invalidJson: 'The model returned invalid JSON.',
    openRouterGenericError: 'OpenRouter error.',
  },
  es: {
    methodNotAllowed: 'Método no permitido.',
    internalError: 'Error interno durante la búsqueda.',
    placeInvalid: 'Parámetro "place" ausente o demasiado largo.',
    latitudeInvalid: 'Latitud no válida.',
    longitudeInvalid: 'Longitud no válida.',
    dailyLimitReached: 'Límite diario de la demo alcanzado. Vuelve a intentarlo mañana.',
    tooManySearches: 'Demasiadas búsquedas. Vuelve a intentarlo en unos minutos.',
    apiKeyMissing: 'OPENROUTER_API_KEY no está configurada en el servidor.',
    openRouterRateLimited: 'Límite de solicitudes de OpenRouter alcanzado. Vuelve a intentarlo enseguida.',
    openRouterInvalidKey: 'Clave de OpenRouter no válida o sin crédito',
    openRouterError: 'OpenRouter respondió',
    searchTimeout: 'La búsqueda superó el tiempo máximo.',
    searchFailed: (message) => `Búsqueda fallida: ${message}`,
    noContent: 'El modelo no devolvió ningún contenido',
    noContentWithReason: (reason) => `El modelo no devolvió ningún contenido (finish_reason: ${reason}).`,
    invalidJson: 'El modelo devolvió un JSON no válido.',
    openRouterGenericError: 'Error de OpenRouter.',
  },
};
