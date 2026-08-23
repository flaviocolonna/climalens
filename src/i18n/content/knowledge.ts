/**
 * Testi per src/lib/knowledge.ts: cosa è successo in ogni tappa, e cosa vuol
 * dire ogni convenzione. Anni, nomi e id restano nel modulo dati.
 */
import type { Locale } from '@/i18n/locale';

const MILESTONES: Record<Locale, Record<string, string>> = {
  it: {
    foote: 'Misura in laboratorio che l’aria carica di CO₂ si scalda di più al sole, e scrive che un’atmosfera con più anidride carbonica darebbe alla Terra una temperatura più alta.',
    tyndall: 'Dimostra quali gas assorbono il calore infrarosso e quali no: è il meccanismo fisico dell’effetto serra, misurato.',
    arrhenius: 'Calcola a mano di quanto salirebbe la temperatura raddoppiando la CO₂. Gli viene 5-6 °C: alto rispetto alle stime di oggi, ma l’ordine di grandezza è quello.',
    callendar: 'Mette insieme le misure di 147 stazioni e mostra che la Terra si è già scaldata, e che il carbonio bruciato basta a spiegarlo. Viene largamente ignorato.',
    revelle: 'Scoprono che l’oceano non assorbirà tutta la CO₂ in eccesso: «gli esseri umani stanno conducendo un esperimento geofisico su vasta scala».',
    keeling: 'Inizia a misurare la CO₂ a Mauna Loa. La curva che porta il suo nome sale ancora oggi, senza interruzioni.',
    johnson: 'Il comitato scientifico della Casa Bianca consegna a Lyndon Johnson un rapporto che elenca le conseguenze dell’anidride carbonica. È il primo allarme formale a un capo di governo.',
    charney: 'Il primo rapporto di sintesi indipendente stima che raddoppiare la CO₂ scalderebbe di 1,5-4,5 °C. Quarant’anni e migliaia di studi dopo, l’intervallo si è ristretto ma non spostato.',
    hansen: 'Testimonia al Senato che il riscaldamento è già in corso e attribuibile all’uomo. Il giorno dopo è in prima pagina: da qui in avanti nessuno può dire di non sapere.',
    ipcc: 'Il primo rapporto IPCC. Da allora ne sono usciti altri cinque, tutti nella stessa direzione.',
    paris: 'Centonovantacinque paesi si impegnano a restare «ben sotto i 2 °C». Gli scenari di questa app misurano la distanza fra quella firma e la traiettoria vera.',
  },
  en: {
    foote: 'Measures in the lab that CO₂-laden air heats up more in sunlight, and writes that an atmosphere with more carbon dioxide would give Earth a higher temperature.',
    tyndall: 'Shows which gases absorb infrared heat and which do not: the physical mechanism of the greenhouse effect, measured.',
    arrhenius: 'Calculates by hand how much the temperature would rise if CO₂ doubled. He gets 5-6 °C: high against today’s estimates, but the order of magnitude is right.',
    callendar: 'Pulls together records from 147 stations and shows Earth has already warmed, and that burnt carbon is enough to explain it. He is largely ignored.',
    revelle: 'They find the ocean will not absorb all the excess CO₂: "human beings are now carrying out a large scale geophysical experiment".',
    keeling: 'Begins measuring CO₂ at Mauna Loa. The curve that carries his name is still rising today, without a break.',
    johnson: 'The White House science committee hands Lyndon Johnson a report listing the consequences of carbon dioxide. It is the first formal warning to a head of government.',
    charney: 'The first independent synthesis estimates that doubling CO₂ would warm the planet by 1.5-4.5 °C. Forty years and thousands of studies later, the range has narrowed but not moved.',
    hansen: 'Testifies to the Senate that warming is already under way and attributable to humans. It is front-page news the next day: from here on nobody can claim not to know.',
    ipcc: 'The first IPCC report. Five more have followed, all pointing the same way.',
    paris: 'One hundred and ninety-five countries commit to staying "well below 2 °C". This app’s scenarios measure the distance between that signature and the real trajectory.',
  },
  es: {
    foote: 'Mide en el laboratorio que el aire cargado de CO₂ se calienta más al sol, y escribe que una atmósfera con más dióxido de carbono daría a la Tierra una temperatura más alta.',
    tyndall: 'Demuestra qué gases absorben el calor infrarrojo y cuáles no: el mecanismo físico del efecto invernadero, medido.',
    arrhenius: 'Calcula a mano cuánto subiría la temperatura al duplicar el CO₂. Le salen 5-6 °C: alto frente a las estimaciones de hoy, pero el orden de magnitud es ese.',
    callendar: 'Reúne los registros de 147 estaciones y muestra que la Tierra ya se ha calentado, y que el carbono quemado basta para explicarlo. Se le ignora en gran medida.',
    revelle: 'Descubren que el océano no absorberá todo el CO₂ sobrante: «los seres humanos están llevando a cabo un experimento geofísico a gran escala».',
    keeling: 'Empieza a medir el CO₂ en Mauna Loa. La curva que lleva su nombre sigue subiendo hoy, sin interrupción.',
    johnson: 'El comité científico de la Casa Blanca entrega a Lyndon Johnson un informe que enumera las consecuencias del dióxido de carbono. Es la primera alerta formal a un jefe de gobierno.',
    charney: 'La primera síntesis independiente estima que duplicar el CO₂ calentaría entre 1,5 y 4,5 °C. Cuarenta años y miles de estudios después, el intervalo se ha estrechado pero no se ha movido.',
    hansen: 'Declara ante el Senado que el calentamiento ya está en marcha y es atribuible al ser humano. Al día siguiente está en portada: a partir de aquí nadie puede decir que no sabía.',
    ipcc: 'El primer informe del IPCC. Desde entonces han salido cinco más, todos en la misma dirección.',
    paris: 'Ciento noventa y cinco países se comprometen a quedarse «muy por debajo de 2 °C». Los escenarios de esta app miden la distancia entre esa firma y la trayectoria real.',
  },
};

export interface GlossaryText {
  term: string;
  body: string;
}

const GLOSSARY: Record<Locale, Record<string, GlossaryText>> = {
  it: {
    baseline: {
      term: 'Baseline (periodo di riferimento)',
      body: 'Uno «zero» scelto per convenzione. La mappa usa il 1951-1980, la convenzione GISTEMP; l’IPCC usa il 1850-1900, cioè il preindustriale. Fra i due corre circa un quarto di grado: sommare numeri riferiti a basi diverse è l’errore più comune che si legge in giro, ed è il motivo per cui gli scenari di questa app stanno in un grafico a parte.',
    },
    anomaly: {
      term: 'Anomalia',
      body: 'Non la temperatura, ma la differenza dalla media del periodo di riferimento. Si usa perché le anomalie sono confrontabili fra luoghi con climi diversissimi, mentre le temperature assolute no.',
    },
    co2e: {
      term: 'CO₂ equivalente (CO₂e)',
      body: 'Tutti i gas serra convertiti nella quantità di CO₂ che scalderebbe allo stesso modo. Serve a sommare metano e protossido d’azoto con l’anidride carbonica — ma il metano scalda molto e dura poco, quindi la conversione dipende dall’orizzonte temporale che si sceglie.',
    },
    gwp: {
      term: 'GWP a 100 anni',
      body: 'L’orizzonte con cui si fa quella conversione. Su 100 anni il metano vale circa 28 volte la CO₂; su 20 anni ne varrebbe più di 80. Nessuno dei due è sbagliato: sono due domande diverse, e chi pubblica un numero deve dire quale ha usato.',
    },
    territorial: {
      term: 'Territoriali contro consumi',
      body: 'Le emissioni territoriali sono quelle uscite dentro i confini di un paese; quelle basate sui consumi seguono le merci fino a chi le compra. La differenza è la metrica «import/export» della mappa: la stessa tonnellata cambia proprietario a seconda di quale delle due si guarda.',
    },
    upstream: {
      term: 'A monte contro a valle',
      body: 'La CO₂ del petrolio la emette chi lo brucia (a valle), ma qualcuno l’ha estratto (a monte). Sono la stessa quantità contata da due capi opposti della filiera: la lente «chi le estrae» è a monte, tutto il resto dell’app è a valle. Sommarle sarebbe doppio conteggio.',
    },
    perCapita: {
      term: 'Pro capite',
      body: 'Emissioni divise per abitanti. Risponde a «quanto pesa una persona di qui», non a «quanto pesa questo paese»: la Cina è prima per totale e ventesima abbondante per persona. Nessuna delle due è la risposta giusta da sola.',
    },
    referenceYear: {
      term: 'Anno di riferimento',
      body: 'Ogni metrica di questa app mostra un anno solo, uguale per tutti i paesi, e chi non ha quel dato resta grigio. La tentazione opposta — tenere il valore più recente di ciascuno — metterebbe il 2015 di uno accanto al 2024 di un altro, e i colori smetterebbero di essere confrontabili, che è l’unica cosa per cui esiste una mappa coropletica.',
    },
    coverage: {
      term: 'Copertura',
      body: 'Quanti paesi hanno davvero quel dato. Sta scritta sotto ogni legenda perché una mappa con 115 paesi su 205 non è la stessa cosa di una con 200, e la differenza non si vede guardando i colori.',
    },
  },
  en: {
    baseline: {
      term: 'Baseline (reference period)',
      body: 'A "zero" chosen by convention. The map uses 1951-1980, the GISTEMP convention; the IPCC uses 1850-1900, i.e. pre-industrial. About a quarter of a degree separates them: adding numbers on different baselines is the most common error you will read anywhere, and it is why this app’s scenarios live in a separate chart.',
    },
    anomaly: {
      term: 'Anomaly',
      body: 'Not the temperature, but the difference from the reference period average. It is used because anomalies are comparable between places with wildly different climates, while absolute temperatures are not.',
    },
    co2e: {
      term: 'CO₂ equivalent (CO₂e)',
      body: 'All greenhouse gases converted into the amount of CO₂ that would warm the same. It lets methane and nitrous oxide be added to carbon dioxide — but methane warms hard and lasts briefly, so the conversion depends on the time horizon you pick.',
    },
    gwp: {
      term: 'GWP over 100 years',
      body: 'The horizon used for that conversion. Over 100 years methane is worth about 28 times CO₂; over 20 years it would be worth more than 80. Neither is wrong: they are two different questions, and whoever publishes a number has to say which one they asked.',
    },
    territorial: {
      term: 'Territorial vs consumption',
      body: 'Territorial emissions are those released inside a country’s borders; consumption-based ones follow goods to whoever buys them. The difference is the map’s "imports/exports" metric: the same tonne changes owner depending on which of the two you look at.',
    },
    upstream: {
      term: 'Upstream vs downstream',
      body: 'The CO₂ from oil is emitted by whoever burns it (downstream), but somebody extracted it (upstream). They are the same quantity counted from opposite ends of the chain: the "who extracts it" lens is upstream, the rest of the app is downstream. Adding them would be double counting.',
    },
    perCapita: {
      term: 'Per capita',
      body: 'Emissions divided by population. It answers "how much does one person here account for", not "how much does this country account for": China is first by total and well outside the top twenty per person. Neither is the right answer on its own.',
    },
    referenceYear: {
      term: 'Reference year',
      body: 'Every metric in this app shows a single year, the same for all countries, and whoever lacks it stays grey. The opposite temptation — keeping each country’s most recent value — would put one country’s 2015 next to another’s 2024, and the colours would stop being comparable, which is the only thing a choropleth is for.',
    },
    coverage: {
      term: 'Coverage',
      body: 'How many countries actually have that datum. It sits under every legend because a map with 115 countries out of 205 is not the same as one with 200, and the difference is invisible in the colours.',
    },
  },
  es: {
    baseline: {
      term: 'Línea base (periodo de referencia)',
      body: 'Un «cero» elegido por convención. El mapa usa 1951-1980, la convención GISTEMP; el IPCC usa 1850-1900, es decir el preindustrial. Entre ambos hay cerca de un cuarto de grado: sumar números referidos a bases distintas es el error más común que se lee por ahí, y por eso los escenarios de esta app están en un gráfico aparte.',
    },
    anomaly: {
      term: 'Anomalía',
      body: 'No la temperatura, sino la diferencia respecto a la media del periodo de referencia. Se usa porque las anomalías son comparables entre lugares con climas muy distintos, y las temperaturas absolutas no.',
    },
    co2e: {
      term: 'CO₂ equivalente (CO₂e)',
      body: 'Todos los gases de efecto invernadero convertidos a la cantidad de CO₂ que calentaría igual. Permite sumar metano y óxido nitroso con el dióxido de carbono — pero el metano calienta mucho y dura poco, así que la conversión depende del horizonte temporal que se elija.',
    },
    gwp: {
      term: 'GWP a 100 años',
      body: 'El horizonte con el que se hace esa conversión. A 100 años el metano vale unas 28 veces el CO₂; a 20 años valdría más de 80. Ninguno de los dos está mal: son dos preguntas distintas, y quien publica un número debe decir cuál usó.',
    },
    territorial: {
      term: 'Territoriales frente a consumo',
      body: 'Las emisiones territoriales son las que salen dentro de las fronteras de un país; las de consumo siguen a las mercancías hasta quien las compra. La diferencia es la métrica «importación/exportación» del mapa: la misma tonelada cambia de dueño según cuál de las dos se mire.',
    },
    upstream: {
      term: 'Aguas arriba frente a aguas abajo',
      body: 'El CO₂ del petróleo lo emite quien lo quema (aguas abajo), pero alguien lo extrajo (aguas arriba). Son la misma cantidad contada desde dos extremos opuestos de la cadena: la lente «quién lo extrae» es aguas arriba, el resto de la app es aguas abajo. Sumarlas sería doble conteo.',
    },
    perCapita: {
      term: 'Per cápita',
      body: 'Emisiones divididas entre habitantes. Responde a «cuánto le corresponde a una persona de aquí», no a «cuánto pesa este país»: China es primera por total y bastante fuera del top veinte por persona. Ninguna de las dos es la respuesta correcta por sí sola.',
    },
    referenceYear: {
      term: 'Año de referencia',
      body: 'Cada métrica de esta app muestra un solo año, el mismo para todos los países, y quien no lo tiene queda en gris. La tentación contraria — quedarse con el valor más reciente de cada uno — pondría el 2015 de uno junto al 2024 de otro, y los colores dejarían de ser comparables, que es lo único para lo que existe un mapa coroplético.',
    },
    coverage: {
      term: 'Cobertura',
      body: 'Cuántos países tienen realmente ese dato. Está escrita bajo cada leyenda porque un mapa con 115 países de 205 no es lo mismo que uno con 200, y la diferencia no se ve en los colores.',
    },
  },
};

export function milestoneText(id: string, locale: Locale): string {
  return MILESTONES[locale][id] ?? MILESTONES.en[id] ?? id;
}

export function glossaryText(id: string, locale: Locale): GlossaryText {
  return GLOSSARY[locale][id] ?? GLOSSARY.en[id] ?? { term: id, body: '' };
}
