import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { searchPlaces, type Place } from '@/lib/openMeteo';
import { compactNumber, placeSubtitle } from '@/lib/format';
import { useI18n } from '@/i18n/LocaleProvider';

const DEBOUNCE_MS = 250;

interface Props {
  onSelect: (place: Place) => void;
  /** Dentro la barra di navigazione: niente cornice propria, la porta già lei. */
  inline?: boolean;
}

export function SearchBar({ onSelect, inline }: Props) {
  const { locale, t } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(-1);

  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /**
   * Picking a result writes the place name back into the field. Without this
   * guard that write looks like fresh typing and re-opens the dropdown a beat
   * after the user has already chosen.
   */
  const committedRef = useRef<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (committedRef.current === q) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchPlaces(q, locale, controller.signal);
        setResults(found);
        setError(found.length ? null : t('search.noResults'));
        setCursor(found.length ? 0 : -1);
        setOpen(true);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError(t('search.searchFailed'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale, t]);

  // Dismiss the dropdown when focus moves elsewhere on the page.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const choose = (place: Place) => {
    onSelect(place);
    committedRef.current = place.name.trim();
    setQuery(place.name);
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open || !results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => (c + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => (c - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && cursor >= 0) {
      e.preventDefault();
      choose(results[cursor]);
    }
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={boxRef} className="pointer-events-auto relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            committedRef.current = null;
            setQuery(e.target.value);
          }}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={inline ? t('search.placeholderInline') : t('search.placeholderStandalone')}
          aria-label={t('search.ariaLabel')}
          className={`w-full pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 ${
            inline
              ? 'rounded-lg border border-white/10 bg-white/5 py-2'
              : 'rounded-xl border border-white/10 bg-ink-900/85 py-3 shadow-2xl backdrop-blur-md'
          }`}
        />
        {loading ? (
          <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500" />
        ) : query ? (
          <button
            onClick={clear}
            aria-label={t('search.clearAria')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {open && (results.length > 0 || error) && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-white/10 bg-ink-900/95 shadow-2xl backdrop-blur-md animate-fade-up">
          {error && !results.length ? (
            <div className="px-4 py-3 text-sm text-slate-500">{error}</div>
          ) : (
            <ul role="listbox">
              {results.map((place, i) => (
                <li key={place.id}>
                  <button
                    onClick={() => choose(place)}
                    onMouseEnter={() => setCursor(i)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                      i === cursor ? 'bg-sky-400/10' : ''
                    }`}
                  >
                    <MapPin
                      className={`h-3.5 w-3.5 shrink-0 ${i === cursor ? 'text-sky-400' : 'text-slate-600'}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-slate-100">{place.name}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {placeSubtitle(place.admin1, place.country)}
                      </span>
                    </span>
                    {place.population ? (
                      <span className="shrink-0 font-mono text-[10px] text-slate-600">
                        {compactNumber(place.population, locale)}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
