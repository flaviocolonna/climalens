/**
 * Nomi degli alimenti e delle fasi della filiera.
 *
 * I dati arrivano da OWID con le etichette inglesi come chiave: restano quelle
 * nel JSON — sono l'identità della riga — e qui c'è solo come si scrivono nelle
 * tre lingue. Se la fonte rinomina un alimento, il pannello mostra la chiave
 * grezza invece di sparire, ed è visibile subito.
 */
import type { Locale } from '@/i18n/locale';

const FOOD_NAMES: Record<Locale, Record<string, string>> = {
  it: {
    'Beef (beef herd)': 'Manzo (da carne)',
    'Lamb & Mutton': 'Agnello e montone',
    'Beef (dairy herd)': 'Manzo (da latte)',
    Cheese: 'Formaggio',
    'Pig Meat': 'Maiale',
    'Poultry Meat': 'Pollame',
    Eggs: 'Uova',
    Rice: 'Riso',
    Milk: 'Latte',
    Tofu: 'Tofu',
    Peas: 'Piselli',
    Bananas: 'Banane',
    Nuts: 'Frutta secca',
  },
  en: {
    'Beef (beef herd)': 'Beef (beef herd)',
    'Lamb & Mutton': 'Lamb & mutton',
    'Beef (dairy herd)': 'Beef (dairy herd)',
    Cheese: 'Cheese',
    'Pig Meat': 'Pork',
    'Poultry Meat': 'Poultry',
    Eggs: 'Eggs',
    Rice: 'Rice',
    Milk: 'Milk',
    Tofu: 'Tofu',
    Peas: 'Peas',
    Bananas: 'Bananas',
    Nuts: 'Nuts',
  },
  es: {
    'Beef (beef herd)': 'Ternera (de carne)',
    'Lamb & Mutton': 'Cordero y oveja',
    'Beef (dairy herd)': 'Ternera (de leche)',
    Cheese: 'Queso',
    'Pig Meat': 'Cerdo',
    'Poultry Meat': 'Pollo',
    Eggs: 'Huevos',
    Rice: 'Arroz',
    Milk: 'Leche',
    Tofu: 'Tofu',
    Peas: 'Guisantes',
    Bananas: 'Plátanos',
    Nuts: 'Frutos secos',
  },
};

const STAGE_NAMES: Record<Locale, Record<string, string>> = {
  it: {
    land_use: 'Uso del suolo',
    farm: 'Allevamento e campo',
    animal_feed: 'Mangimi',
    processing: 'Lavorazione',
    transport: 'Trasporto',
    retail: 'Vendita',
    packaging: 'Imballaggio',
  },
  en: {
    land_use: 'Land use',
    farm: 'Farm',
    animal_feed: 'Animal feed',
    processing: 'Processing',
    transport: 'Transport',
    retail: 'Retail',
    packaging: 'Packaging',
  },
  es: {
    land_use: 'Uso del suelo',
    farm: 'Granja y campo',
    animal_feed: 'Piensos',
    processing: 'Procesado',
    transport: 'Transporte',
    retail: 'Venta',
    packaging: 'Envasado',
  },
};

export function foodName(key: string, locale: Locale): string {
  return FOOD_NAMES[locale][key] ?? FOOD_NAMES.en[key] ?? key;
}

export function stageName(key: string, locale: Locale): string {
  return STAGE_NAMES[locale][key] ?? STAGE_NAMES.en[key] ?? key;
}

/** Colori delle fasi: una scala categorica già validata sul fondo scuro. */
export const STAGE_COLORS: Record<string, string> = {
  land_use: '#d95926',
  farm: '#bf2621',
  animal_feed: '#c98500',
  processing: '#199e70',
  transport: '#3987e5',
  retail: '#8560c6',
  packaging: '#5b6676',
};
