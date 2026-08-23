/**
 * I dodici eventi, le regioni e i tipi di evento.
 *
 * Le conclusioni degli studi sono **riassunte**, non tradotte alla lettera: le
 * fonti sono in inglese, e girare una citazione in tre lingue produrrebbe tre
 * virgolettati che nessuno ha mai scritto. Chi vuole le parole esatte segue il
 * collegamento, che sta accanto a ogni riga.
 *
 * I numeri stanno dentro le frasi perché lì sono il verbo: «trenta volte più
 * probabile» non si scompone in un dato e un'etichetta senza perdere il senso.
 * Sono però anche le uniche cifre di questo file, e vanno controllate contro la
 * fonte a ogni modifica.
 */
import type { Locale } from '@/i18n/locale';
import type { EventType, RegionId } from '@/lib/consequences';

interface EventText {
  /** Il luogo, come lo direbbe una persona: non le coordinate. */
  place: string;
  /** Cosa è successo, senza il clima dentro. */
  what: string;
  /** Cosa ha concluso lo studio. `**grassetto**` sul numero. */
  finding: string;
}

const EVENTS: Record<Locale, Record<string, EventText>> = {
  it: {
    europe2003: {
      place: 'Europa occidentale',
      what: 'L’estate più calda mai registrata nel continente, con decine di migliaia di morti in eccesso.',
      finding:
        'Il primo studio di attribuzione della storia: l’influenza umana aveva **almeno raddoppiato** il rischio di un’estate così.',
    },
    reef2016: {
      place: 'Grande Barriera Corallina',
      what: 'Sbiancamento di massa: nella parte settentrionale quasi nessuna barriera esaminata ne è uscita indenne.',
      finding: 'Un marzo così caldo nel Mar dei Coralli è diventato **almeno 175 volte** più probabile.',
    },
    harvey2017: {
      place: 'Houston, Texas',
      what: 'L’uragano Harvey si ferma sulla costa e scarica oltre un metro di pioggia in quattro giorni.',
      finding:
        'Pioggia **circa il 15% più intensa**, e un evento del genere **tre volte** più probabile.',
    },
    japan2018: {
      place: 'Giappone occidentale',
      what: 'Piogge torrenziali su Hiroshima e dintorni: frane, oltre duecento morti.',
      finding:
        'Il totale di pioggia è stato **circa il 7% maggiore** per il rapido riscaldamento dei mari attorno al Giappone. Una cifra piccola, ed è il punto: l’attribuzione non risponde sempre in grande.',
    },
    siberia2020: {
      place: 'Siberia',
      what: 'Sei mesi di caldo fuori scala, fino a 38 °C dentro il Circolo Polare Artico.',
      finding: '**Almeno 600 volte** più probabile per via del riscaldamento di origine umana.',
    },
    westernNorthAmerica2021: {
      place: 'Nord America occidentale',
      what: '49,6 °C a Lytton, record nazionale canadese. Il giorno dopo il paese è bruciato.',
      finding: '**Praticamente impossibile** senza il riscaldamento di origine umana.',
    },
    hornOfAfrica2022: {
      place: 'Corno d’Africa',
      what: 'Cinque stagioni delle piogge fallite di fila, la sequenza peggiore in quarant’anni.',
      finding: 'Siccità di questa gravità sono diventate **circa 100 volte** più probabili.',
    },
    madagascar2022: {
      place: 'Madagascar, Mozambico, Malawi',
      what: 'Sei fra cicloni e tempeste tropicali in sei settimane, sulle stesse coste.',
      finding:
        'Le emissioni di gas serra sono **in parte responsabili** dell’aumento osservato delle piogge che accompagnano questi cicloni.',
    },
    southAsia2022: {
      place: 'India e Pakistan',
      what: 'Ondata di caldo a marzo e aprile, mesi prima della stagione, su un miliardo e mezzo di persone.',
      finding: 'Un evento come quello del 2022 è diventato **circa 30 volte** più probabile.',
    },
    pakistan2022: {
      place: 'Sindh, Pakistan',
      what: 'Un terzo del paese sott’acqua, 33 milioni di persone colpite.',
      finding:
        'Le piogge di cinque giorni su Sindh e Belucistan sono state **circa il 75% più intense** di quanto sarebbero state senza 1,2 °C di riscaldamento.',
    },
    europeDrought2022: {
      place: 'Europa centro-occidentale',
      what: 'Fiumi ridotti a rigagnoli, navigazione ferma sul Reno, raccolti persi.',
      finding:
        'La siccità del suolo superficiale è diventata **da cinque a sei volte** più probabile; quella più profonda da tre a quattro.',
    },
    amazon2023: {
      place: 'Bacino amazzonico',
      what: 'Il Rio Negro al livello più basso mai misurato; delfini di fiume morti per la temperatura dell’acqua.',
      finding:
        'La siccità meteorologica è diventata **dieci volte** più probabile, quella agricola **circa trenta**. Il colpevole non è stato El Niño.',
    },
  },
  en: {
    europe2003: {
      place: 'Western Europe',
      what: 'The hottest summer ever recorded on the continent, with tens of thousands of excess deaths.',
      finding:
        'The first attribution study ever done: human influence had **at least doubled** the risk of a summer like it.',
    },
    reef2016: {
      place: 'Great Barrier Reef',
      what: 'Mass bleaching: in the northern section almost no surveyed reef came through unharmed.',
      finding: 'A March that hot in the Coral Sea became **at least 175 times** more likely.',
    },
    harvey2017: {
      place: 'Houston, Texas',
      what: 'Hurricane Harvey stalls over the coast and drops more than a metre of rain in four days.',
      finding: 'Rainfall **about 15% more intense**, and an event like it **three times** more likely.',
    },
    japan2018: {
      place: 'Western Japan',
      what: 'Torrential rain around Hiroshima: landslides, more than two hundred dead.',
      finding:
        'The rainfall total was **about 7% higher** because of rapid warming in the seas around Japan. A small figure, and that is the point: attribution does not always answer big.',
    },
    siberia2020: {
      place: 'Siberia',
      what: 'Six months of off-the-scale heat, reaching 38 °C inside the Arctic Circle.',
      finding: '**At least 600 times** more likely as a result of human-caused warming.',
    },
    westernNorthAmerica2021: {
      place: 'Western North America',
      what: '49.6 °C at Lytton, a Canadian national record. The next day the town burned down.',
      finding: '**Virtually impossible** without human-caused climate change.',
    },
    hornOfAfrica2022: {
      place: 'Horn of Africa',
      what: 'Five failed rainy seasons in a row, the worst such run in forty years.',
      finding: 'Droughts this severe have become **about 100 times** more likely.',
    },
    madagascar2022: {
      place: 'Madagascar, Mozambique, Malawi',
      what: 'Six cyclones and tropical storms in six weeks, onto the same coastlines.',
      finding:
        'Greenhouse gas emissions are **in part responsible** for the observed increase in the rainfall these cyclones bring.',
    },
    southAsia2022: {
      place: 'India and Pakistan',
      what: 'A heatwave in March and April, months ahead of the season, over one and a half billion people.',
      finding: 'An event like the one in 2022 became **about 30 times** more likely.',
    },
    pakistan2022: {
      place: 'Sindh, Pakistan',
      what: 'A third of the country under water, 33 million people affected.',
      finding:
        'Five-day rainfall over Sindh and Balochistan was **about 75% more intense** than it would have been without 1.2 °C of warming.',
    },
    europeDrought2022: {
      place: 'West-central Europe',
      what: 'Rivers down to trickles, shipping halted on the Rhine, harvests lost.',
      finding:
        'Surface soil-moisture drought became **five to six times** more likely; the deeper root-zone drought three to four.',
    },
    amazon2023: {
      place: 'Amazon basin',
      what: 'The Rio Negro at the lowest level ever measured; river dolphins dying from the water temperature.',
      finding:
        'Meteorological drought became **ten times** more likely, agricultural drought **about thirty**. El Niño was not the culprit.',
    },
  },
  es: {
    europe2003: {
      place: 'Europa occidental',
      what: 'El verano más caluroso jamás registrado en el continente, con decenas de miles de muertes en exceso.',
      finding:
        'El primer estudio de atribución de la historia: la influencia humana había **al menos duplicado** el riesgo de un verano así.',
    },
    reef2016: {
      place: 'Gran Barrera de Coral',
      what: 'Blanqueo masivo: en la parte norte casi ningún arrecife examinado salió indemne.',
      finding: 'Un marzo así de cálido en el mar del Coral pasó a ser **al menos 175 veces** más probable.',
    },
    harvey2017: {
      place: 'Houston, Texas',
      what: 'El huracán Harvey se detiene sobre la costa y descarga más de un metro de lluvia en cuatro días.',
      finding:
        'Lluvia **un 15% más intensa** aproximadamente, y un evento así **tres veces** más probable.',
    },
    japan2018: {
      place: 'Japón occidental',
      what: 'Lluvias torrenciales en torno a Hiroshima: deslizamientos, más de doscientos muertos.',
      finding:
        'El total de lluvia fue **un 7% mayor** aproximadamente por el rápido calentamiento de los mares alrededor de Japón. Una cifra pequeña, y ese es el punto: la atribución no siempre responde a lo grande.',
    },
    siberia2020: {
      place: 'Siberia',
      what: 'Seis meses de calor fuera de escala, hasta 38 °C dentro del Círculo Polar Ártico.',
      finding: '**Al menos 600 veces** más probable a causa del calentamiento de origen humano.',
    },
    westernNorthAmerica2021: {
      place: 'Norteamérica occidental',
      what: '49,6 °C en Lytton, récord nacional canadiense. Al día siguiente el pueblo ardió.',
      finding: '**Prácticamente imposible** sin el calentamiento de origen humano.',
    },
    hornOfAfrica2022: {
      place: 'Cuerno de África',
      what: 'Cinco temporadas de lluvias fallidas seguidas, la peor racha en cuarenta años.',
      finding: 'Las sequías de esta gravedad se han vuelto **unas 100 veces** más probables.',
    },
    madagascar2022: {
      place: 'Madagascar, Mozambique, Malaui',
      what: 'Seis ciclones y tormentas tropicales en seis semanas, sobre las mismas costas.',
      finding:
        'Las emisiones de gases de efecto invernadero son **en parte responsables** del aumento observado en las lluvias que traen estos ciclones.',
    },
    southAsia2022: {
      place: 'India y Pakistán',
      what: 'Ola de calor en marzo y abril, meses antes de la temporada, sobre mil quinientos millones de personas.',
      finding: 'Un evento como el de 2022 pasó a ser **unas 30 veces** más probable.',
    },
    pakistan2022: {
      place: 'Sindh, Pakistán',
      what: 'Un tercio del país bajo el agua, 33 millones de personas afectadas.',
      finding:
        'Las lluvias de cinco días sobre Sindh y Baluchistán fueron **un 75% más intensas** aproximadamente de lo que habrían sido sin 1,2 °C de calentamiento.',
    },
    europeDrought2022: {
      place: 'Europa centro-occidental',
      what: 'Ríos reducidos a hilos de agua, navegación detenida en el Rin, cosechas perdidas.',
      finding:
        'La sequía del suelo superficial pasó a ser **de cinco a seis veces** más probable; la más profunda, de tres a cuatro.',
    },
    amazon2023: {
      place: 'Cuenca amazónica',
      what: 'El Río Negro en el nivel más bajo jamás medido; delfines de río muertos por la temperatura del agua.',
      finding:
        'La sequía meteorológica pasó a ser **diez veces** más probable, la agrícola **unas treinta**. El culpable no fue El Niño.',
    },
  },
};

const TYPES: Record<Locale, Record<EventType, string>> = {
  it: {
    heat: 'Caldo',
    flood: 'Pioggia e alluvioni',
    drought: 'Siccità',
    storm: 'Tempeste',
    ocean: 'Oceano',
  },
  en: {
    heat: 'Heat',
    flood: 'Rain & flooding',
    drought: 'Drought',
    storm: 'Storms',
    ocean: 'Ocean',
  },
  es: {
    heat: 'Calor',
    flood: 'Lluvia e inundaciones',
    drought: 'Sequía',
    storm: 'Tormentas',
    ocean: 'Océano',
  },
};

const REGIONS: Record<Locale, Record<RegionId, string>> = {
  it: {
    easternAsia: 'Asia orientale e sud-orientale',
    europe: 'Europa',
    northernAmerica: 'America settentrionale',
    subSaharanAfrica: 'Africa subsahariana',
    australia: 'Australia e Nuova Zelanda',
    southernAsia: 'Asia centrale e meridionale',
    latinAmerica: 'America Latina e Caraibi',
    arctic: 'Artico',
    northernAfrica: 'Africa settentrionale e Asia occidentale',
    oceania: 'Oceania',
  },
  en: {
    easternAsia: 'Eastern and south-eastern Asia',
    europe: 'Europe',
    northernAmerica: 'Northern America',
    subSaharanAfrica: 'Sub-Saharan Africa',
    australia: 'Australia and New Zealand',
    southernAsia: 'Central and southern Asia',
    latinAmerica: 'Latin America and the Caribbean',
    arctic: 'Arctic',
    northernAfrica: 'Northern Africa and western Asia',
    oceania: 'Oceania',
  },
  es: {
    easternAsia: 'Asia oriental y sudoriental',
    europe: 'Europa',
    northernAmerica: 'América del Norte',
    subSaharanAfrica: 'África subsahariana',
    australia: 'Australia y Nueva Zelanda',
    southernAsia: 'Asia central y meridional',
    latinAmerica: 'América Latina y el Caribe',
    arctic: 'Ártico',
    northernAfrica: 'África del Norte y Asia occidental',
    oceania: 'Oceanía',
  },
};

export function eventText(id: string, locale: Locale): EventText {
  return EVENTS[locale][id] ?? EVENTS.en[id];
}

export function eventTypeName(type: EventType, locale: Locale): string {
  return TYPES[locale][type];
}

export function regionName(id: RegionId, locale: Locale): string {
  return REGIONS[locale][id];
}
