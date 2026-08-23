/**
 * Locale primitives. Kept dependency-free and callable outside React: `App.tsx`
 * reads URL state at module scope, before any provider mounts, and needs a
 * locale before it exists.
 */

export type Locale = 'it' | 'en' | 'es';

export const LOCALES: Locale[] = ['it', 'en', 'es'];

export const DEFAULT_LOCALE: Locale = 'en';

/** For `toLocaleString` — decimal/grouping conventions per language. */
export const LOCALE_TAG: Record<Locale, string> = {
  it: 'it-IT',
  en: 'en-US',
  es: 'es-ES',
};

/**
 * Cardinal-direction letters for `coords()`. Italian and Spanish both elide
 * "west" to O (Ovest / Oeste); English is the odd one out with W.
 */
export const WEST_LETTER: Record<Locale, string> = {
  it: 'O',
  en: 'W',
  es: 'O',
};

const STORAGE_KEY = 'climalens.locale';

function isLocale(v: string | null | undefined): v is Locale {
  return v === 'it' || v === 'en' || v === 'es';
}

/** Reads a previously-saved choice. Never writes — only an explicit switch does. */
export function storedLocale(): Locale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isLocale(v) ? v : null;
  } catch {
    // Private browsing / disabled storage: fall through to detection.
    return null;
  }
}

export function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Nothing to do if storage is unavailable; the choice just won't stick.
  }
}

/** Browser language, matched to a supported locale by its two-letter prefix. */
function browserLocale(): Locale | null {
  if (typeof navigator === 'undefined') return null;
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const lang of candidates) {
    const prefix = lang?.slice(0, 2).toLowerCase();
    if (isLocale(prefix)) return prefix;
  }
  return null;
}

/**
 * localStorage → browser language → default. Synchronous and side-effect-free
 * (aside from reading storage), so it can run at module scope before React
 * mounts.
 */
export function detectLocale(): Locale {
  return storedLocale() ?? browserLocale() ?? DEFAULT_LOCALE;
}
