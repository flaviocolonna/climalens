import type { Locale } from '@/i18n/locale';
import type { Dictionary } from '@/i18n/dictionary';
import { it } from '@/i18n/it';
import { en } from '@/i18n/en';
import { es } from '@/i18n/es';

export const DICTIONARIES: Record<Locale, Dictionary> = { it, en, es };
