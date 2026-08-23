import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { detectLocale, persistLocale, type Locale } from '@/i18n/locale';
import { DICTIONARIES } from '@/i18n/dictionaries';
import type { Dictionary } from '@/i18n/dictionary';
import { translate } from '@/i18n/t';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dict: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale());
  const dict = DICTIONARIES[locale];

  // Only an explicit switch persists — arriving via browser-language detection
  // should never overwrite a choice the visitor hasn't actually made.
  const setLocale = (next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = dict.app.title;
  }, [locale, dict]);

  const value = useMemo(() => ({ locale, setLocale, dict }), [locale, dict]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale/useT must be used inside <LocaleProvider>');
  return ctx;
}

export function useLocale(): { locale: Locale; setLocale: (locale: Locale) => void } {
  const { locale, setLocale } = useLocaleContext();
  return { locale, setLocale };
}

type Vars = Record<string, string | number>;

export type TFunction = (path: string, vars?: Vars) => string;

/** `t('areaEmissions.netLabel', { year: 2022 })` — flat-string lookup + interpolation. */
export function useT(): TFunction {
  const { dict } = useLocaleContext();
  return (path, vars) => translate(dict, path, vars);
}

/** Full `{locale, setLocale, dict, t}` in one hook, for components that need more than one. */
export function useI18n(): { locale: Locale; setLocale: (locale: Locale) => void; dict: Dictionary; t: TFunction } {
  const { locale, setLocale, dict } = useLocaleContext();
  const t = useT();
  return { locale, setLocale, dict, t };
}

/** One/other pluralization — English/Italian/Spanish only ever need these two categories here. */
export function plural(n: number, forms: { one: string; other: string }): string {
  return n === 1 ? forms.one : forms.other;
}
