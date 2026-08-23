import type { Dictionary } from '@/i18n/dictionary';

export const es = {
  common: {
    noData: 'sin datos',
  },
  app: {
    title: 'ClimaLens — 145 años de calentamiento global',
    dataErrorTitle: 'Datos no cargados',
    loading: 'Cargando 146 años de mediciones de la NASA…',
    hintIntro: 'Busca un lugar o haz clic en el mapa para ver cómo ha cambiado su temperatura.',
    hintPressPrefix: 'Pulsa',
    hintPressMid: 'para animar los años,',
    hintPressSuffix: 'para recorrerlos.',
    spaceKey: 'espacio',
    placeFallback: 'Lugar',
    gridCellSubtitle: 'Celda de cuadrícula de {latStep}°×{lonStep}°',
    unnamedPoint: 'Punto seleccionado',
  },
  nav: {
    tagline: '{years} · anomalías de temperatura',
    sectorsShort: 'Sectores',
    sectorsLong: 'Quién calienta el planeta',
    languageAria: 'Cambiar idioma',
  },
  search: {
    placeholderInline: 'Busca un lugar…',
    placeholderStandalone: 'Busca una ciudad, un país, un lugar…',
    ariaLabel: 'Busca un lugar',
    clearAria: 'Borrar búsqueda',
    noResults: 'Sin resultados',
    searchFailed: 'Búsqueda fallida',
  },
  timeline: {
    pause: 'Pausar',
    play: 'Iniciar animación',
    yearLabel: 'año',
    selectYearAria: 'Selecciona el año',
    globalMeanLabel: 'media global',
  },
  legend: {
    title: 'Anomalía de temperatura',
    subtitle: '°C respecto a la media de {baseline}',
    mapAriaLabel: 'Mapa de las anomalías de temperatura',
  },
  layerControls: {
    beyondCo2: 'Más allá del CO₂',
    whoCopes: 'Quién aguanta',
    whoDelivers: 'Quién cumple',
    fixedYear: 'Fijo en su año de referencia',
    backToAnomaly: 'Volver a las anomalías',
    whoSuffers: 'Quién lo sufre',
    whoCauses: 'Quién lo causa',
    loadingCountries: 'Cargando datos por país…',
    generateFileHint: 'Genera el archivo con',
    metaLine:
      'Datos {year} · {coverage} de {countries} países · {source}. Fijos en ese año: por eso aquí no hay línea de tiempo.',
  },
  locationPanel: {
    closeAria: 'Cerrar panel',
    noInstrumentalData: 'No hay datos instrumentales para esta celda de cuadrícula.',
    warmingBetween: 'calentamiento entre {from0}–{from1} y {to0}–{to1}',
    anomalyInYear: 'Anomalía en {year}',
    trend: 'Tendencia',
    annualAnomalyHeading: 'Anomalía anual · {start}–{end}',
    chartFootnote: 'Barras: anomalía anual. Línea: media móvil de {n} años.',
    avgAnnualTempHeading: 'Temperatura media anual',
    loadingEra5: 'Cargando la serie ERA5…',
    era5RateLimited:
      'Demasiadas solicitudes a Open-Meteo en poco tiempo: vuelve a intentarlo en un minuto.',
    era5Unavailable: 'Serie ERA5 no disponible para este punto.',
    era5SeriesUnavailable: 'Serie histórica no disponible (HTTP {status})',
    footer:
      'Anomalías: {source}, celda de {latStep}°×{lonStep}°, referencia {baseline}. Absolutas: ERA5 vía Open-Meteo.',
    feltDaysHeading: 'Días que se sienten',
    feltDaysFootnote:
      'Días al año, media {f0}–{f1} → {l0}–{l1}. Noche tropical: mínima por encima de {t}°C.',
    indicatorHotDay: 'Días por encima de {t}°C',
    indicatorTropicalNight: 'Noches por encima de {t}°C',
    indicatorFrost: 'Días de helada',
    lifetimeHeading: 'Desde que tú estás aquí',
    lifetimeLabel: 'Año de nacimiento',
    lifetimeWarming: 'calentamiento aquí desde {year} hasta hoy',
    lifetimeHottest:
      '{hot} de los {total} años más cálidos jamás medidos en este punto caen en tu vida.',
    lifetimeCaption:
      'Comparación entre la década en torno a {year} y la última década, en la misma celda.',
    lifetimeNoData: 'No hay suficientes mediciones en torno a ese año para este punto.',
  },
  airQuality: {
    heading: 'Qué aire se respira',
    loading: 'Cargando la serie CAMS…',
    unavailable: 'Datos de calidad del aire no disponibles para este punto.',
    noAnnualSeries: 'Serie anual incompleta: no basta para una media.',
    unit: 'µg/m³ de PM2.5',
    timesGuideline: '{times}× el umbral de la OMS',
    annualCaption:
      'media anual en {year}. La guía de la OMS es {guideline} µg/m³ — es un umbral sanitario, no un límite legal: esos son más permisivos.',
    daysOverLabel: 'Días por encima de {daily} µg/m³',
    nowLabel: 'Ahora',
    aqi: 'AQI europeo {value}',
    footnote:
      'Modelo CAMS vía Open-Meteo, no una estación: en una ciudad el valor real cambia de calle en calle. Son los mismos aerosoles que enfrían el planeta enmascarando parte del calentamiento.',
  },
  boundaries: {
    navShort: 'Límites',
    navLong: 'Los límites del planeta',
    heading: 'Los límites del planeta',
    subheading: 'Nueve límites dentro de los cuales la Tierra sigue siendo el planeta que conocemos',
    close: 'Cerrar',
    crossedOf: 'de 9',
    crossedCaption:
      'límites planetarios superados. El clima es uno de los nueve, y no es el que está peor.',
    statusCrossed: 'superado',
    statusSafe: 'dentro del límite',
    boundaryLabel: 'límite',
    currentLabel: 'hoy',
    controlVariable: 'Variable de control',
    safeZone: 'espacio operativo seguro',
    riskZone: 'zona de riesgo creciente',
    noQuantified: 'sin límite cuantificado',
    footnote:
      'Superar un límite no es un umbral tras el cual ocurre todo de golpe: es salir de las condiciones en las que la humanidad se desarrolló, y el riesgo crece con la distancia.',
    sourceValues: 'Valores: Richardson et al., Science Advances 2023',
    sourceStatus: 'Estado: Planetary Health Check 2025 (PIK)',
  },
  actionsPanel: {
    navShort: 'Acciones',
    navLong: 'Qué puedo hacer',
    heading: 'Qué puedo hacer',
    subheading: 'Cuánto pesa de verdad un gesto, y dónde está la palanca real',
    close: 'Cerrar',
    rankingHeading: 'Las acciones, por lo que valen',
    rankingIntro:
      'Toneladas de CO₂e evitadas en un año, en un país rico. Las marcadas son las que escuelas y gobiernos recomiendan más a menudo — y casi todas están al final.',
    advisedBadge: 'recomendada',
    savesUnit: 't/año',
    refWorld: 'media mundial por persona ({year})',
    refFairShare: 'cuota compatible con 1,5 °C',
    excludedHeading: 'Una entrada que no encontrarás aquí',
    excludedBody:
      'El mismo estudio pone en primer lugar «un hijo menos», {saves} t/año. Es la cifra más discutida del trabajo: atribuye a quien engendra una parte de las emisiones futuras de todos sus descendientes, con una convención que no se aplica a nada más en esta app. En el gráfico aplastaría todo lo demás bajo una sola barra.',
    contextHeading: 'De dónde viene la idea de «huella personal»',
    contextBody:
      'La idea de que la contaminación es una responsabilidad que se calcula persona por persona la popularizó una campaña publicitaria de BP en 2004, que difundió la calculadora de huella de carbono individual. Decirlo no sirve para quitarse la responsabilidad: sirve para ver dónde está la palanca. El recorte directo de una persona es pequeño frente a las {gt} Gt que diez empresas extraen en un año. Lo que no es pequeño es todo lo demás.',
    multipliersHeading: 'Las palancas que no se miden en toneladas',
    multipliersIntro:
      'Aquí no hay números, y es deliberado: poner un tonelaje al voto o al fondo de pensiones sería inventarlo. Pero es por este lado por donde una sola persona toca cantidades que no son las suyas.',
    handoffHeading: 'Y luego, algo concreto',
    handoffBody:
      'Abre un lugar en el mapa y busca los proyectos activos cerca: la app los busca en la web y verifica cada dirección contra las citas reales, en vez de inventarlos.',
    sourceNote: 'Cifras para un país rico: lo que valen depende de dónde vivas.',
    budgetHeading: 'Cuánto tiempo queda',
    budgetYears: 'años',
    budgetCaption:
      'al ritmo actual ({annual} Gt CO₂ al año). El presupuesto compatible con 1,5 °C es de {gt} Gt desde principios de {from}, con un {probability}% de probabilidad: la cifra de arriba ya descuenta lo emitido desde entonces.',
    budgetStrict:
      'Pidiendo un {probability}% de probabilidad en lugar del 50, el presupuesto de partida baja a {gt} Gt y lo que queda pasa a ser {years} años.',
    supportHeading: 'Casi todos están de acuerdo, y casi nadie lo sabe',
    supportIntro:
      'Encuesta a {people} personas en {countries} países. Las tres líneas de abajo son lo que la gente piensa de verdad.',
    supportWilling: 'dispuesto a aportar el 1% de su renta',
    supportNorms: 'comparte las normas sociales proclima',
    supportDemands: 'exige más acción política',
    supportGap:
      'Y aquí está el punto: **todos subestiman a los demás**. Las personas actúan de forma condicional — hago mi parte si creo que los demás hacen la suya — así que creerse en minoría cuando se está en el {demands}% es ya un freno. Por eso «hablar de ello» es una palanca y no una frase hecha.',
    foodHeading: 'Qué hay en el plato',
    foodIntro:
      'La fila «dieta vegetal» de arriba vale 0,8 t al año, pero esconde dos órdenes de magnitud dentro de la misma compra. Kilogramos de CO₂e por kilo de producto, del campo a la mesa.',
    foodUnit: 'kg CO₂e por kg',
    foodTransportNote:
      'El transporte es de media el {share}% del total. Es el número que desmonta el «come local»: cambiar **qué** se come pesa mucho más que cambiar **de dónde viene**.',
    foodLandLabel: '{value} m² de tierra por kg',
    foodLoading: 'Cargando los datos de alimentos…',
    foodUnavailable: 'Datos de alimentos no disponibles. Genéralos con',
    yourHeading: 'Tu número',
    yourIntro:
      'La clasificación de abajo es la del mundo. Seis preguntas bastan para saber cuáles de esas palancas están de verdad a tu alcance, y para ponerlas en tu orden.',
    yourPrivacy:
      'Las respuestas se quedan en esta página: no se guardan, no van a la barra de direcciones, no salen de aquí.',
    yourIncomplete: 'Responde las seis para ver tu lista.',
    yourProgress: '{answered} de {total}',
    yourReset: 'Empezar de nuevo',
    yourTotalLabel: 'lo que puedes quitar en un año',
    yourUnit: 't CO₂e',
    yourCompare:
      'La cuota compatible con 1,5 °C es de {fair} t por persona. Una persona media del mundo emite {world} ({year}).',
    yourTopLine: 'Por sí sola, **{name}** vale el {share}% de todo lo que puedes quitar.',
    yourMissingHeading: 'Lo que no te afecta',
    yourCaveat:
      'Son **medianas de un solo estudio**, sacadas sobre todo de países ricos: un orden de magnitud, no tu cuenta. Y no se suman de verdad — quien deja a la vez de volar y de conducir no obtiene exactamente la suma de las dos líneas.',
    yourTopTen:
      'Las diez opciones más eficaces, todas juntas, valen {total} t al año según el mismo estudio.',
    yourNoNumber: 'sin número, a propósito',
    yourNothingLeft:
      'Cero no quiere decir que no emitas: quiere decir que no te queda ninguna palanca **medible en toneladas**. Lo que queda es la última línea, la que no tiene número.',
    badgeNotApplicable: 'no te afecta',
    badgeAlreadyDone: 'ya lo haces',
    rankingProfileNote:
      'Las filas apagadas son las que tus respuestas descartan. El orden sigue siendo el del estudio: ahí está el contraste entre lo que se aconseja y lo que funciona.',
  },
  futurePanel: {
    navShort: 'Futuro',
    navLong: 'Hacia dónde vamos',
    heading: 'Hacia dónde vamos',
    subheading: 'Los caminos que siguen abiertos, y lo que ya está funcionando',
    close: 'Cerrar',
    scenariosHeading: 'La bifurcación',
    scenariosIntro:
      'El calentamiento a final de siglo depende de cuánto se emita de aquí en adelante. No es una predicción: son cinco caminos, y entre el primero y el último hay tres grados.',
    scenariosBaseline:
      'Respecto a {baseline} — la convención del IPCC, no la del mapa (1951-1980). Son dos ceros distintos: sumarlos fallaría en torno a un cuarto de grado, y por eso este gráfico está aquí y no al final de la línea de tiempo.',
    scenariosInterpolated:
      'El IPCC publica tres ventanas de veinte años, no un valor por año: los segmentos entre puntos son un enlace, no datos.',
    scenarioSsp119: 'emisiones a cero hacia 2050',
    scenarioSsp126: 'a cero después de 2050',
    scenarioSsp245: 'a medio camino, sin giro',
    scenarioSsp370: 'emisiones que siguen creciendo',
    scenarioSsp585: 'crecimiento sin frenos',
    workingHeading: 'Lo que ya está funcionando',
    workingIntro:
      'El resto de esta app es una acusación. Esta parte no: son las cosas que cambiaron de verdad, y deprisa. No consuelan — demuestran que la variable no es la física, es la decisión.',
    solarHeadline: 'menos la fotovoltaica',
    solarCaption:
      'de {fromYear} a {toYear}: de {fromCost} a {toCost} dólares por vatio. Es el desplome de precio más rápido jamás registrado en una tecnología energética.',
    capacityLine:
      'Capacidad solar instalada en el mundo: de {fromValue} GW en {fromYear} a {toValue} GW en {toYear}.',
    shareLine: 'Electricidad mundial de fuentes renovables: {value}% en {year}.',
    lcoeHeading: 'Cuánto cuesta producir un kWh',
    lcoeCaption: 'Dólares por kWh, desde el primer año con datos mundiales hasta hoy.',
    lcoeRose:
      'Las dos últimas subieron, y merece la pena notarlo: la historia no es «todo se abarató», es que dos tecnologías nuevas se desplomaron mientras las viejas no.',
    lcoeSolar: 'Fotovoltaica',
    lcoeOnshore: 'Eólica terrestre',
    lcoeOffshore: 'Eólica marina',
    lcoeHydro: 'Hidroeléctrica',
    lcoeGeothermal: 'Geotérmica',
    loading: 'Cargando las series…',
    unavailable: 'Datos no disponibles. Genéralos con',
  },
  tour: {
    start: 'Enséñamelo en orden',
    next: 'Siguiente',
    prev: 'Atrás',
    finish: 'Entendido',
    exit: 'Salir del recorrido',
  },
  knowledge: {
    navShort: 'Método',
    navLong: 'Cómo lo sabemos',
    heading: 'Cómo lo sabemos',
    subheading: 'Desde cuándo lo sabemos, y con qué convenciones se mide',
    close: 'Cerrar',
    timelineHeading: 'Cuándo lo supimos',
    timelineIntro:
      'La física básica es de 1856, el primer cálculo de 1896, la primera alerta formal a un jefe de gobierno de 1965. «No se podía saber» nunca fue una opción.',
    methodHeading: 'Las convenciones, explicadas una vez',
    methodIntro:
      'Cada panel de esta app declara en letra pequeña la convención que está usando. Aquí están explicadas por extenso: son las trampas en las que cae casi todo lo que se lee por ahí, y también la forma de comprobar si esta app ha caído en ellas.',
  },
  consequences: {
    navShort: 'Efectos',
    navLong: 'Qué provoca',
    heading: 'Qué provoca el calentamiento',
    subheading: 'El mar que sube, y los días en que ya ha pasado',
    close: 'Cerrar',
    loading: 'Cargando las medidas…',
    unavailable: 'Datos de consecuencias no disponibles. Genéralos con',
    seaHeading: 'El mar que sube',
    seaIntro:
      'No es un asunto de 2100: entre 1901 y 2018 el nivel medio del mar subió **{cm} centímetros**, y ningún siglo había visto otro tanto en los últimos {years} años.',
    seaChartNote: 'Nivel medio global {from}–{to}, en milímetros respecto a la media de {baseline}.',
    seaChartAria: 'Nivel medio global del mar desde 1880 hasta hoy: una curva que sube y acelera.',
    ratesHeading: 'Y acelera',
    ratesUnit: 'mm al año',
    projectionHeading: 'Adónde llega para 2100',
    projectionIntro:
      'Mediana e intervalo probable para cada escenario, en metros respecto a la media de {baseline}. Es una tercera base de referencia, distinta de la del mapa y de la de los escenarios de temperatura: está escrita aquí a propósito.',
    metres: 'm',
    commitment:
      'La parte que no se negocia: **aunque el calentamiento se detenga en {degrees} °C**, el mar seguiría subiendo {low}-{high} metros durante los {years} años siguientes. El océano responde durante siglos a un calor que ya ha absorbido.',
    exposureHeading: 'Quién vive al lado',
    exposureIntro:
      'La proporción de población que vive por debajo de los cinco metros de altitud. La marca clara es la proporción de **superficie** que está ahí abajo: donde cae muy a la izquierda de la barra, un país entero está apiñado en su franja baja.',
    exposurePeople: 'población',
    exposureLand: 'superficie',
    exposureNote: 'Datos {year} · {coverage} países ·',
    eventsHeading: 'Los días en que ya ha pasado',
    eventsIntro:
      '«Siempre ha habido mal tiempo» tiene una respuesta precisa, y no es «el clima cambia»: es **cuántas veces más probable** se volvió aquel día concreto. Doce eventos, cada uno con el estudio que lo midió.',
    readStudy: 'Leer el estudio',
    eventsClickHint: 'Cada fila abre su lugar en el mapa.',
    researchHeading: 'Dónde mira la investigación',
    researchIntro:
      'En la lista pública de Carbon Brief hay **{total} estudios** sobre eventos y tendencias: {moreLikely} concluyen que el calentamiento hizo el evento más probable o más intenso, {noInfluence} no encuentran una influencia distinguible, {lessLikely} la encuentran en sentido contrario.',
    researchGap:
      'Pero este no es un mapa de dónde ocurren los extremos: es un mapa de **dónde se estudian**. Europa tiene veinte veces más que el norte de África, y los países menos estudiados son casi siempre los que la pestaña «quién aguanta» muestra peor equipados para aguantarlo.',
    researchNote: 'Recuentos nuestros sobre la lista pública, {counted}. La recopilación completa es de',
  },
  producers: {
    tab: 'Quién lo extrae',
    heading: 'Quién saca el carbono',
    intro:
      'Contabilidad aguas arriba: el CO₂ del petróleo lo emite quien lo quema, esta lente dice quién lo extrajo. No es un doble conteo de las otras dos pestañas, es la misma cantidad vista desde el otro extremo de la cadena.',
    tracedLine: '{gt} Gt CO₂e atribuidas en {year} a {active} entidades, de {total} en la base de datos.',
    halfLine: 'Bastan {n} empresas para superar la mitad de las emisiones fósiles mundiales.',
    stateBadge: 'estatal',
    investorBadge: 'privada',
    brandsHeading: 'Y quién lo envasa',
    brandsIntro:
      'El plástico encontrado en los residuos recogidos por voluntarios, contado marca por marca. Es la otra cara de la métrica «plástico mal gestionado» del mapa: allí los países, aquí las empresas.',
    brandsLeaderLine: '{items} piezas en {countries} países · primero desde hace {years} años',
    brandsMethod:
      'La clasificación no es por número de piezas sino por en cuántos países distintos aparece esa marca — y cambia el podio: en {year} el segundo dejó más piezas que el primero, pero en {runnerUp} países frente a {leader}. Contar piezas premiaría a los lugares donde más se recoge, no a las marcas más extendidas.',
    brandsAuditLine:
      '{volunteers} voluntarios en {countries} países, {items} piezas contadas, {brands} marcas de {parents} empresas.',
    copiedByHand:
      'Las únicas cifras del proyecto copiadas a mano y no generadas por un script: el CSV de Carbon Majors está tras una descarga interactiva y los brand audits solo salen en PDF. El año y la fuente están junto a cada una.',
  },
  warmingWhy: {
    heading: 'Por qué aquí se calienta así',
    bandMissingNote:
      'La media de la franja {band} no aparece porque no se puede medir: en la etapa preindustrial la cuadrícula aquí cubre solo el {pct}% de las celdas, y una media construida con tan poco solo tendría apariencia de medición.',
    footerNote:
      'Cada fila es la media medida de un conjunto más estrecho que el de arriba, ponderada por el área de las celdas: la diferencia entre dos filas es lo que pesa ese paso, no una causa aislada de las demás. La tierra y el mar los decide el centro de la celda, sobre las mismas formas que colorean la capa de emisiones.',
  },
  areaEmissions: {
    heading: 'Cuánto CO₂ causa esta zona',
    notAvailable: 'Datos por país no disponibles: {error}',
    loadingCountries: 'Cargando las emisiones por país…',
    badgeFromSearch: 'país del lugar buscado',
    badgeInside: 'punto dentro de la frontera',
    badgeNearest: 'costa más cercana · {km} km',
    nearestNote:
      'El punto cae en el mar a menos de {max} km de la costa: las fronteras están simplificadas, y a esta distancia el país más cercano sigue siendo la respuesta menos equivocada.',
    contributionNoPoint: 'La contribución es al calentamiento del mundo, no de este punto.',
    contributionWithPoint:
      'Esa contribución calienta el mundo entero, no el territorio de quien la emite: el CO₂ se mezcla en la atmósfera en pocos meses y no se queda sobre quien lo quemó. Este punto ha sufrido {value} de calentamiento — casi todo causado por otros.',
    perCapitaLabel: 'Per cápita ({year})',
    perCapitaValue: '{value} t por persona',
    netValue: '{value} t por persona',
    perCapitaExtra: '{times} la media mundial',
    perCapitaWhy: 'Cuánto le corresponde a una persona de aquí en un año, uso del suelo incluido.',
    historicalLabel: 'Históricas ({year})',
    historicalExtra: 'de todo el CO₂ emitido desde 1750',
    historicalWhy:
      'El CO₂ permanece en la atmósfera durante siglos: el calentamiento de hoy lo cargó quien quemó primero.',
    netLabel: 'Importadas/exportadas ({year})',
    netBalanced: 'en equilibrio entre lo que produce y lo que consume',
    netImports: 'compra más de lo que produce',
    netExports: 'produce para otros',
    netWhyImports:
      'Emisiones de bienes fabricados en otro lugar y consumidos aquí: no aparecen en el conteo territorial, pero se encargaron desde aquí.',
    netWhyExports:
      'Parte de estas emisiones no son para quienes viven aquí: están dentro de cosas que se consumirán en otro lugar.',
    sourceHeading: 'De dónde sale · {mass} en {year}',
    whyMuchHeading: 'Por qué tanto',
    footerPrefix: 'Emisiones: {source}, año de referencia según cada caso arriba. Calentamiento atribuido:',
    footerSuffix:
      '— suma de CO₂, metano y óxido nitroso desde 1851. El total mundial calculado así ({worldTmp}) es más alto que el calentamiento observado: cuenta solo el efecto invernadero, sin el enfriamiento de los aerosoles que enmascara una parte. La atribución del punto usa las formas {shapes}.',
    energyNoIdentity:
      'A este país le falta el dato de energía consumida, así que la parte de la respuesta que distingue «usa mucha» de «la tiene sucia» no se puede dar aquí.',
    unnamedCountryFallback: 'Este país',
    offshoreAntarcticaMain:
      'Aquí no hay un país: la Antártida no tiene población estable ni una fila en la tabla de emisiones, así que ni siquiera está entre las formas {shapes} sobre las que se construye este archivo.',
    offshoreAntarcticaNote:
      'Es el único continente que sufre el calentamiento sin haberlo causado en ninguna medida.',
    offshoreSeaMain:
      'Este punto está en mar abierto, a más de {max} km de la costa más cercana: no hay un país al que atribuir emisiones.',
    offshoreSeaNote:
      'El mar, por sí mismo, no emite: absorbe. Cerca del 90% del calor extra retenido por el sistema climático ha terminado en los océanos (IPCC AR6), y por eso la superficie del mar, en este mapa, se calienta mucho más despacio que la tierra — no porque allí el problema sea menor, sino porque el calor se lo lleva hacia abajo.',
    unlistedMain: 'Las emisiones de {name} no están en este archivo.',
    unlistedNote:
      'Los datos por país están vinculados a las formas {shapes}, y a esa escala los estados más pequeños no tienen un límite propio: sus coordenadas caen dentro del vecino. Mostrar los números del vecino bajo este nombre sería la respuesta equivocada dicha con seguridad.',
  },
  sectorsPanel: {
    heading: 'Quién calienta el planeta',
    subheading: 'Emisiones globales de gases de efecto invernadero por sector',
    close: 'Cerrar',
    totalCaption: 'de CO₂ equivalente emitidos en el mundo en un año ({year}).',
    totalCaptionSource: 'Aquí está de dónde vienen.',
    totalCaptionDemand: 'Aquí está para qué se usaban.',
    sourceFootnote:
      '· {year}, todos los gases en CO₂e (PCG a 100 años), uso del suelo incluido. Es el último año publicado con este nivel de detalle por subsector: las cuotas se mueven despacio, el total absoluto no.',
    demandFootnote:
      'Cada entrada tiene su propia fuente, su año y sus límites: son estudios distintos, no un único conjunto de datos. Compararlas es orientativo; sumarlas es un error.',
    tabSource: 'De dónde salen',
    tabDemand: 'Para qué sirven',
    highlightPrefix: 'Resaltadas las entradas ya contadas en',
    highlightReset: 'borrar',
    sectorsHeading: 'Sectores, de mayor a menor',
    demandWarningPrefix: 'Estas entradas',
    demandWarningEmphasis: 'se superponen',
    demandWarningSuffix:
      'y no suman 100: un vuelo de vacaciones cuenta tanto en «turismo» como en «transporte». Son la misma tarta cortada por uso final.',
    revealLink: 'dónde ya están contadas',
    totalBarAriaLabel: 'Reparto: {label}',
  },
  projectsPanel: {
    heading: 'Proyectos activos en la zona',
    intro:
      'Busca en la web iniciativas ambientales en las que puedas participar. Los resultados vienen de una búsqueda automática: hay que verificarlos antes de presentarte a un evento.',
    searchButton: 'Buscar proyectos',
    loadingPrefix: 'Buscando en la web proyectos cerca de {place}…',
    loadingHint: 'Tarda unos segundos: la búsqueda consulta varias fuentes.',
    retry: 'Reintentar',
    noProjects:
      'No se encontró ningún proyecto verificable para esta zona. Eso no significa que no los haya — solo que la búsqueda no encontró fuentes fiables.',
    source: 'Fuente',
    howToParticipate: 'Cómo participar: ',
    evidenceExact: 'página encontrada',
    evidenceDomain: 'solo dominio',
    evidenceDomainTitle:
      'El sitio de la organización es real, pero esta página en concreto no estaba entre los resultados de búsqueda.',
    sourcesConsulted: { one: '{n} fuente consultada', other: '{n} fuentes consultadas' },
    droppedUnverified: { one: '{n} resultado descartado', other: '{n} resultados descartados' },
    droppedReason: 'porque la URL no aparecía entre los resultados de búsqueda',
    cached: 'de la caché',
    refresh: 'actualizar',
    searchFailed: 'Búsqueda fallida (HTTP {status})',
    invalidResponse: 'Respuesta no válida del servidor.',
  },
} satisfies Dictionary;
