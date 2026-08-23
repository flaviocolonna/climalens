import { LOCALE_TAG, WEST_LETTER, type Locale } from '@/i18n/locale';

const NBSP = ' ';

/** Signed anomaly, always with sign and a fixed decimal count. */
export function signed(value: number, locale: Locale, digits = 2): string {
  const s = value.toLocaleString(LOCALE_TAG[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return value > 0 ? `+${s}` : s;
}

export function degrees(value: number, locale: Locale, digits = 1): string {
  return `${value.toLocaleString(LOCALE_TAG[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}${NBSP}°C`;
}

export function signedDegrees(value: number, locale: Locale, digits = 2): string {
  return `${signed(value, locale, digits)}${NBSP}°C`;
}

export function compactNumber(value: number, locale: Locale): string {
  return value.toLocaleString(LOCALE_TAG[locale], { notation: 'compact', maximumFractionDigits: 1 });
}

/**
 * Italiano e spagnolo scrivono "O"/"Oeste" per ovest; l'inglese usa "W".
 * Nord/Sud/Est sono le stesse lettere nelle tre lingue.
 */
export function coords(lat: number, lon: number, locale: Locale): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : WEST_LETTER[locale];
  return `${Math.abs(lat).toFixed(2)}°${ns}${NBSP}${Math.abs(lon).toFixed(2)}°${ew}`;
}

/** "Roma, Lazio · Italia" from the parts a geocoding hit gives us. */
export function placeSubtitle(admin1?: string, country?: string): string {
  return [admin1, country].filter(Boolean).join(' · ');
}
