/**
 * Per-locale text for the trade-sector ids in `src/lib/tradeSectorTaxonomy.ts`.
 * Kept separate from the id list itself, come src/i18n/content/sectors.ts fa
 * per la tassonomia delle emissioni — qui non c'è un controllo di somma da
 * proteggere, ma la separazione tiene comunque i tre elenchi di nomi allineati
 * a un'unica fonte di id.
 */
import type { Locale } from '@/i18n/locale';
import type { TradeSectorId } from '@/lib/tradeSectorTaxonomy';

export interface TradeSectorText {
  name: string;
}

const TRADE_SECTOR_TEXT: Record<Locale, Record<TradeSectorId, TradeSectorText>> = {
  it: {
    'food-beverages': { name: 'Alimentari e bevande' },
    'minerals-materials': { name: 'Minerali e materiali da costruzione' },
    'mineral-fuels': { name: 'Combustibili fossili' },
    'chemicals-pharma': { name: 'Chimica e farmaceutica' },
    'plastics-rubber': { name: 'Plastica e gomma' },
    'clothing-fashion': { name: 'Abbigliamento e moda' },
    'wood-paper': { name: 'Legno e carta' },
    'jewelry-gems': { name: 'Gioielli e pietre preziose' },
    metals: { name: 'Metalli' },
    'industrial-machinery': { name: 'Macchinari industriali' },
    electronics: { name: 'Elettronica' },
    'vehicles-transport': { name: 'Veicoli e mezzi di trasporto' },
    'precision-instruments': { name: 'Strumenti di precisione' },
    arms: { name: 'Armi e munizioni' },
    'other-manufactured': { name: 'Altri manufatti' },
  },
  en: {
    'food-beverages': { name: 'Food and beverages' },
    'minerals-materials': { name: 'Minerals and building materials' },
    'mineral-fuels': { name: 'Mineral fuels' },
    'chemicals-pharma': { name: 'Chemicals and pharmaceuticals' },
    'plastics-rubber': { name: 'Plastics and rubber' },
    'clothing-fashion': { name: 'Clothing and fashion' },
    'wood-paper': { name: 'Wood and paper' },
    'jewelry-gems': { name: 'Jewelry and gemstones' },
    metals: { name: 'Metals' },
    'industrial-machinery': { name: 'Industrial machinery' },
    electronics: { name: 'Electronics' },
    'vehicles-transport': { name: 'Vehicles and transport equipment' },
    'precision-instruments': { name: 'Precision instruments' },
    arms: { name: 'Arms and ammunition' },
    'other-manufactured': { name: 'Other manufactured goods' },
  },
  es: {
    'food-beverages': { name: 'Alimentos y bebidas' },
    'minerals-materials': { name: 'Minerales y materiales de construcción' },
    'mineral-fuels': { name: 'Combustibles fósiles' },
    'chemicals-pharma': { name: 'Química y farmacéutica' },
    'plastics-rubber': { name: 'Plástico y caucho' },
    'clothing-fashion': { name: 'Ropa y moda' },
    'wood-paper': { name: 'Madera y papel' },
    'jewelry-gems': { name: 'Joyería y piedras preciosas' },
    metals: { name: 'Metales' },
    'industrial-machinery': { name: 'Maquinaria industrial' },
    electronics: { name: 'Electrónica' },
    'vehicles-transport': { name: 'Vehículos y transporte' },
    'precision-instruments': { name: 'Instrumentos de precisión' },
    arms: { name: 'Armas y municiones' },
    'other-manufactured': { name: 'Otros manufacturados' },
  },
};

export function tradeSectorText(id: TradeSectorId, locale: Locale): TradeSectorText {
  return TRADE_SECTOR_TEXT[locale][id];
}
