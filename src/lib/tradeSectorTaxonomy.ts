/**
 * I 15 settori merceologici in cui si legge la composizione di import/export
 * di un paese (src/lib/tradeSectors.ts, dati da scripts/build-trade-sectors.mjs).
 *
 * Non è la stessa tassonomia dei "settori" di src/lib/emissions.ts: quella
 * divide le emissioni mondiali per *fonte* (energia, industria, ...); questa
 * divide il valore commerciale per *prodotto* (capitoli del Sistema
 * Armonizzato a 2 cifre). Due id coincidono per nome nell'altra tassonomia
 * ("energy", "machinery") ma con un significato diverso: qui si chiamano
 * `mineral-fuels` e `industrial-machinery` apposta, per non creare un falso
 * amico fra le due liste.
 *
 * La mappa capitolo-HS → settore vive anche in scripts/build-trade-sectors.mjs,
 * duplicata: quello script è un .mjs a sé, senza import da src/. Le due liste
 * di id devono restare identiche — un id aggiunto o rinominato qui va rifatto
 * anche là.
 */
export type TradeSectorId =
  | 'food-beverages'
  | 'minerals-materials'
  | 'mineral-fuels'
  | 'chemicals-pharma'
  | 'plastics-rubber'
  | 'clothing-fashion'
  | 'wood-paper'
  | 'jewelry-gems'
  | 'metals'
  | 'industrial-machinery'
  | 'electronics'
  | 'vehicles-transport'
  | 'precision-instruments'
  | 'arms'
  | 'other-manufactured';

/** Ordine fisso di visualizzazione — non alfabetico, dal più "quotidiano" al più residuale. */
export const TRADE_SECTOR_IDS: TradeSectorId[] = [
  'food-beverages',
  'clothing-fashion',
  'mineral-fuels',
  'electronics',
  'industrial-machinery',
  'vehicles-transport',
  'chemicals-pharma',
  'metals',
  'plastics-rubber',
  'minerals-materials',
  'wood-paper',
  'precision-instruments',
  'jewelry-gems',
  'arms',
  'other-manufactured',
];
