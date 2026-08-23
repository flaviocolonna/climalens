/**
 * Per-locale text for `src/lib/emissions.ts`'s sector tree. Kept separate from
 * the numeric structure (ids, shares, colors) on purpose: emissions.ts has a
 * DEV-mode check that sums children shares against parent shares, and if the
 * numbers were duplicated once per locale instead of shared, a typo in one
 * language's copy could silently drift from the others.
 */
import type { Locale } from '@/i18n/locale';

export interface SectorText {
  name: string;
  /** Context line — only the top-level sectors have one. */
  note?: string;
}

export interface DemandText {
  name: string;
  note: string;
  /** Denominator, when it isn't "all greenhouse gases". */
  basis?: string;
}

const SECTOR_TEXT: Record<Locale, Record<string, SectorText>> = {
  it: {
    energy: {
      name: 'Energia',
      note: 'Bruciare combustibili fossili per elettricità, calore e movimento. Tre quarti del problema stanno qui.',
    },
    'energy-industry': { name: 'Energia usata nell’industria' },
    'other-industry': { name: 'Altra industria' },
    'iron-steel': { name: 'Ferro e acciaio' },
    'chemicals-energy': { name: 'Chimica e petrolchimica' },
    'food-tobacco': { name: 'Alimentare e tabacco' },
    'non-ferrous': { name: 'Metalli non ferrosi' },
    'paper-pulp': { name: 'Carta e cellulosa' },
    machinery: { name: 'Macchinari' },
    'energy-buildings': { name: 'Energia negli edifici' },
    residential: { name: 'Edifici residenziali' },
    commercial: { name: 'Edifici commerciali' },
    transport: { name: 'Trasporti' },
    road: { name: 'Trasporto su strada' },
    aviation: { name: 'Aviazione' },
    shipping: { name: 'Navigazione' },
    rail: { name: 'Ferrovia' },
    pipeline: { name: 'Oleodotti e gasdotti' },
    unallocated: { name: 'Combustione non allocata' },
    fugitive: { name: 'Perdite dalla produzione di energia' },
    'fugitive-oil-gas': { name: 'Petrolio e gas' },
    'fugitive-coal': { name: 'Carbone' },
    'energy-agri': { name: 'Energia in agricoltura e pesca' },
    land: {
      name: 'Agricoltura e uso del suolo',
      note: 'Metano dei ruminanti, protossido d’azoto dei fertilizzanti, carbonio delle foreste tagliate.',
    },
    livestock: { name: 'Allevamento e liquami' },
    'agri-soils': { name: 'Suoli agricoli' },
    'crop-burning': { name: 'Bruciatura dei residui agricoli' },
    deforestation: { name: 'Deforestazione' },
    cropland: { name: 'Terreni coltivati' },
    rice: { name: 'Risaie' },
    grassland: { name: 'Praterie' },
    industry: {
      name: 'Processi industriali',
      note: 'CO₂ liberata dalla reazione chimica in sé, non dal combustibile: resta anche con un forno elettrico.',
    },
    cement: { name: 'Cemento' },
    'chemicals-process': { name: 'Chimica' },
    waste: {
      name: 'Rifiuti',
      note: 'Materia organica che fermenta senza ossigeno e libera metano.',
    },
    landfills: { name: 'Discariche' },
    wastewater: { name: 'Acque reflue' },
  },
  en: {
    energy: {
      name: 'Energy',
      note: 'Burning fossil fuels for electricity, heat, and motion. Three-quarters of the problem is here.',
    },
    'energy-industry': { name: 'Energy used in industry' },
    'other-industry': { name: 'Other industry' },
    'iron-steel': { name: 'Iron and steel' },
    'chemicals-energy': { name: 'Chemicals and petrochemicals' },
    'food-tobacco': { name: 'Food and tobacco' },
    'non-ferrous': { name: 'Non-ferrous metals' },
    'paper-pulp': { name: 'Paper and pulp' },
    machinery: { name: 'Machinery' },
    'energy-buildings': { name: 'Energy in buildings' },
    residential: { name: 'Residential buildings' },
    commercial: { name: 'Commercial buildings' },
    transport: { name: 'Transport' },
    road: { name: 'Road transport' },
    aviation: { name: 'Aviation' },
    shipping: { name: 'Shipping' },
    rail: { name: 'Rail' },
    pipeline: { name: 'Pipelines' },
    unallocated: { name: 'Unallocated fuel combustion' },
    fugitive: { name: 'Fugitive emissions from energy production' },
    'fugitive-oil-gas': { name: 'Oil and gas' },
    'fugitive-coal': { name: 'Coal' },
    'energy-agri': { name: 'Energy in agriculture and fishing' },
    land: {
      name: 'Agriculture and land use',
      note: 'Methane from livestock, nitrous oxide from fertilizers, carbon from cleared forests.',
    },
    livestock: { name: 'Livestock and manure' },
    'agri-soils': { name: 'Agricultural soils' },
    'crop-burning': { name: 'Burning of crop residues' },
    deforestation: { name: 'Deforestation' },
    cropland: { name: 'Cropland' },
    rice: { name: 'Rice cultivation' },
    grassland: { name: 'Grassland' },
    industry: {
      name: 'Industrial processes',
      note: "CO₂ released by the chemical reaction itself, not the fuel: it remains even with an electric furnace.",
    },
    cement: { name: 'Cement' },
    'chemicals-process': { name: 'Chemicals' },
    waste: {
      name: 'Waste',
      note: 'Organic matter fermenting without oxygen, releasing methane.',
    },
    landfills: { name: 'Landfills' },
    wastewater: { name: 'Wastewater' },
  },
  es: {
    energy: {
      name: 'Energía',
      note: 'Quemar combustibles fósiles para electricidad, calor y movimiento. Tres cuartas partes del problema están aquí.',
    },
    'energy-industry': { name: 'Energía usada en la industria' },
    'other-industry': { name: 'Otra industria' },
    'iron-steel': { name: 'Hierro y acero' },
    'chemicals-energy': { name: 'Química y petroquímica' },
    'food-tobacco': { name: 'Alimentación y tabaco' },
    'non-ferrous': { name: 'Metales no férricos' },
    'paper-pulp': { name: 'Papel y celulosa' },
    machinery: { name: 'Maquinaria' },
    'energy-buildings': { name: 'Energía en edificios' },
    residential: { name: 'Edificios residenciales' },
    commercial: { name: 'Edificios comerciales' },
    transport: { name: 'Transporte' },
    road: { name: 'Transporte por carretera' },
    aviation: { name: 'Aviación' },
    shipping: { name: 'Transporte marítimo' },
    rail: { name: 'Ferrocarril' },
    pipeline: { name: 'Oleoductos y gasoductos' },
    unallocated: { name: 'Combustión no asignada' },
    fugitive: { name: 'Emisiones fugitivas de la producción de energía' },
    'fugitive-oil-gas': { name: 'Petróleo y gas' },
    'fugitive-coal': { name: 'Carbón' },
    'energy-agri': { name: 'Energía en agricultura y pesca' },
    land: {
      name: 'Agricultura y uso del suelo',
      note: 'Metano del ganado, óxido nitroso de los fertilizantes, carbono de los bosques talados.',
    },
    livestock: { name: 'Ganadería y estiércol' },
    'agri-soils': { name: 'Suelos agrícolas' },
    'crop-burning': { name: 'Quema de residuos agrícolas' },
    deforestation: { name: 'Deforestación' },
    cropland: { name: 'Tierras de cultivo' },
    rice: { name: 'Cultivo de arroz' },
    grassland: { name: 'Pastizales' },
    industry: {
      name: 'Procesos industriales',
      note: 'CO₂ liberado por la propia reacción química, no por el combustible: persiste incluso con un horno eléctrico.',
    },
    cement: { name: 'Cemento' },
    'chemicals-process': { name: 'Química' },
    waste: {
      name: 'Residuos',
      note: 'Materia orgánica que fermenta sin oxígeno y libera metano.',
    },
    landfills: { name: 'Vertederos' },
    wastewater: { name: 'Aguas residuales' },
  },
};

const DEMAND_TEXT: Record<Locale, Record<string, DemandText>> = {
  it: {
    'buildings-construction': {
      name: 'Edifici e costruzioni',
      basis: 'della CO₂ da energia e processi industriali',
      note: 'Scaldare e raffrescare quello che è già in piedi, più il cemento e l’acciaio per tirare su il resto.',
    },
    food: {
      name: 'Alimentazione',
      note: 'Dal campo al piatto, scarti compresi. Metà arriva dagli animali, che occupano l’83% dei terreni agricoli e danno il 18% delle calorie.',
    },
    tourism: {
      name: 'Turismo',
      note: 'Contato sui consumi: non solo i voli, ma anche il cibo, gli alberghi e i souvenir comprati in viaggio.',
    },
    health: {
      name: 'Sanità',
      note: 'Ospedali, farmaci, monouso, trasporti sanitari. Più di quanto pesi tutta l’aviazione civile.',
    },
    apparel: {
      name: 'Abbigliamento e tessile',
      note: 'Il «10% delle emissioni globali» che gira ovunque non ha una fonte rintracciabile: le stime serie stanno tra il 2 e il 4%.',
    },
    digital: {
      name: 'Digitale',
      note: 'Data center, reti e — soprattutto — fabbricare i dispositivi. L’intervallo dipende da quanto in là si segue la filiera.',
    },
  },
  en: {
    'buildings-construction': {
      name: 'Buildings and construction',
      basis: 'of CO₂ from energy and industrial processes',
      note: "Heating and cooling what's already standing, plus the cement and steel to put up the rest.",
    },
    food: {
      name: 'Food',
      note: 'From field to plate, waste included. Half comes from animals, which occupy 83% of farmland and provide 18% of calories.',
    },
    tourism: {
      name: 'Tourism',
      note: 'Counted on consumption: not just flights, but also the food, hotels, and souvenirs bought while traveling.',
    },
    health: {
      name: 'Health care',
      note: 'Hospitals, medicines, single-use items, medical transport. More than the weight of all civil aviation.',
    },
    apparel: {
      name: 'Apparel and textiles',
      note: 'The "10% of global emissions" that circulates everywhere has no traceable source: serious estimates put it between 2 and 4%.',
    },
    digital: {
      name: 'Digital',
      note: 'Data centers, networks, and — above all — manufacturing the devices. The range depends on how far up the supply chain you go.',
    },
  },
  es: {
    'buildings-construction': {
      name: 'Edificios y construcción',
      basis: 'del CO₂ procedente de la energía y los procesos industriales',
      note: 'Calentar y refrigerar lo que ya está en pie, más el cemento y el acero para levantar el resto.',
    },
    food: {
      name: 'Alimentación',
      note: 'Del campo al plato, desperdicios incluidos. La mitad procede de los animales, que ocupan el 83% de las tierras agrícolas y aportan el 18% de las calorías.',
    },
    tourism: {
      name: 'Turismo',
      note: 'Contado por consumo: no solo los vuelos, también la comida, los hoteles y los recuerdos comprados de viaje.',
    },
    health: {
      name: 'Sanidad',
      note: 'Hospitales, medicamentos, material desechable, transporte sanitario. Más de lo que pesa toda la aviación civil.',
    },
    apparel: {
      name: 'Ropa y textil',
      note: 'El «10% de las emisiones globales» que circula por todas partes no tiene una fuente rastreable: las estimaciones serias lo sitúan entre el 2 y el 4%.',
    },
    digital: {
      name: 'Digital',
      note: 'Centros de datos, redes y, sobre todo, fabricar los dispositivos. El rango depende de hasta dónde se siga la cadena de suministro.',
    },
  },
};

export function sectorText(id: string, locale: Locale): SectorText | undefined {
  return SECTOR_TEXT[locale][id];
}

export function demandSectorText(id: string, locale: Locale): DemandText | undefined {
  return DEMAND_TEXT[locale][id];
}
