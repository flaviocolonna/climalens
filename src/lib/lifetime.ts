/**
 * Il riscaldamento misurato dentro una vita sola.
 *
 * «+1,3 °C dal periodo preindustriale» è una frase che riguarda l'umanità;
 * «da quando ci sei tu» riguarda chi legge, e i dati sono gli stessi — la
 * serie della cella di griglia già caricata, nessuna richiesta in più.
 *
 * L'anno di nascita resta in `localStorage` e non passa mai per l'URL: è
 * l'unico dato personale che l'app tocca, e un link condiviso non deve
 * portarselo dietro.
 */
import type { SeriesPoint } from '@/lib/climateData';

const STORAGE_KEY = 'climalens.birthYear';

/** Quanti anni attorno alla nascita fanno da riferimento. */
const WINDOW = 10;
/** Quanti valori validi servono in quella finestra perché la media conti. */
const MIN_VALID = 6;
/** La classifica in cui si guarda quanti anni caldi cadono in una vita. */
export const HOTTEST_COUNT = 10;

export interface LifetimeStats {
  /** °C fra il decennio attorno alla nascita e l'ultimo decennio. */
  warming: number | null;
  /** Quanti dei {HOTTEST_COUNT} anni più caldi cadono dalla nascita in poi. */
  hottestInLife: number;
  /** L'ultimo anno della serie con un valore: la fine del "oggi". */
  lastYear: number | null;
}

function meanOf(points: SeriesPoint[]): number | null {
  const valid = points.filter((p): p is { year: number; value: number } => p.value !== null);
  if (valid.length < MIN_VALID) return null;
  return valid.reduce((s, p) => s + p.value, 0) / valid.length;
}

export function lifetimeStats(series: SeriesPoint[], birthYear: number): LifetimeStats {
  const withValues = series.filter((p) => p.value !== null);
  const lastYear = withValues.length ? withValues[withValues.length - 1].year : null;

  // Il decennio *attorno* alla nascita, non l'anno secco: un anno singolo è
  // rumore meteorologico, e il confronto sarebbe con il caso.
  const half = Math.floor(WINDOW / 2);
  const birthWindow = series.filter(
    (p) => p.year >= birthYear - half && p.year < birthYear - half + WINDOW,
  );
  const recent = lastYear === null ? [] : series.filter((p) => p.year > lastYear - WINDOW);

  const base = meanOf(birthWindow);
  const now = meanOf(recent);

  const hottest = [...withValues]
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, HOTTEST_COUNT);

  return {
    warming: base !== null && now !== null ? now - base : null,
    hottestInLife: hottest.filter((p) => p.year >= birthYear).length,
    lastYear,
  };
}

/** Estremi accettati: prima non ci sono misure, dopo non c'è una vita da misurare. */
export function clampBirthYear(value: number, startYear: number, endYear: number): number {
  return Math.min(endYear, Math.max(startYear, Math.round(value)));
}

export function storedBirthYear(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const v = raw === null ? NaN : Number(raw);
    return Number.isFinite(v) && v > 1800 ? v : null;
  } catch {
    return null;
  }
}

export function persistBirthYear(year: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(year));
  } catch {
    // Storage disabilitato: la scelta vale per questa sessione e basta.
  }
}
