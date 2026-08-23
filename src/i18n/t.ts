import type { Dictionary } from '@/i18n/dictionary';

type Vars = Record<string, string | number>;

/** Reads a dot path (e.g. "areaEmissions.netLabel") out of a dictionary. */
function resolve(dict: Dictionary, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => {
    if (node && typeof node === 'object' && key in node) {
      return (node as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict);
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/**
 * Plain-function string lookup + interpolation, usable outside React (e.g.
 * `urlState.ts`, which runs at module scope before any provider mounts).
 * `useT()` in `LocaleProvider.tsx` is a thin hook wrapper around this.
 */
export function translate(dict: Dictionary, path: string, vars?: Vars): string {
  const value = resolve(dict, path);
  if (typeof value !== 'string') {
    if (import.meta.env.DEV) console.warn(`[i18n] missing string key: ${path}`);
    return path;
  }
  return interpolate(value, vars);
}
