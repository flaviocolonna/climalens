import type { Dictionary } from '@/i18n/dictionary';

export const it = {
  common: {
    noData: 'nessun dato',
  },
  app: {
    title: 'ClimaLens — 145 anni di riscaldamento globale',
    dataErrorTitle: 'Dati non caricati',
    loading: 'Carico 146 anni di misurazioni NASA…',
    hintIntro:
      'Cerca un luogo o clicca sulla mappa per vedere come è cambiata la sua temperatura.',
    hintPressPrefix: 'Premi',
    hintPressMid: 'per animare gli anni,',
    hintPressSuffix: 'per scorrerli.',
    spaceKey: 'spazio',
    placeFallback: 'Luogo',
    gridCellSubtitle: 'Cella di griglia {latStep}°×{lonStep}°',
    unnamedPoint: 'Punto selezionato',
  },
  nav: {
    tagline: '{years} · anomalie di temperatura',
    sectorsShort: 'Settori',
    sectorsLong: 'Chi scalda il pianeta',
    languageAria: 'Cambia lingua',
  },
  search: {
    placeholderInline: 'Cerca un luogo…',
    placeholderStandalone: 'Cerca una città, un paese, un luogo…',
    ariaLabel: 'Cerca un luogo',
    clearAria: 'Cancella ricerca',
    noResults: 'Nessun risultato',
    searchFailed: 'Ricerca non riuscita',
  },
  timeline: {
    pause: 'Metti in pausa',
    play: 'Avvia animazione',
    yearLabel: 'anno',
    selectYearAria: 'Seleziona anno',
    globalMeanLabel: 'media globale',
  },
  legend: {
    title: 'Anomalia di temperatura',
    subtitle: '°C rispetto alla media {baseline}',
    mapAriaLabel: 'Mappa delle anomalie di temperatura',
  },
  layerControls: {
    beyondCo2: 'Oltre la CO₂',
    whoCopes: 'Chi lo regge',
    whoDelivers: 'Chi mantiene',
    fixedYear: 'Fermo al suo anno di riferimento',
    backToAnomaly: 'Torna alle anomalie',
    whoSuffers: 'Chi lo subisce',
    whoCauses: 'Chi lo causa',
    loadingCountries: 'Carico i dati per paese…',
    generateFileHint: 'Genera il file con',
    metaLine:
      'Dati {year} · {coverage} paesi su {countries} · {source}. Fermi a quell’anno: per questo qui la linea del tempo non c’è.',
  },
  locationPanel: {
    closeAria: 'Chiudi pannello',
    noInstrumentalData: 'Nessun dato strumentale per questa cella di griglia.',
    warmingBetween: 'riscaldamento tra {from0}–{from1} e {to0}–{to1}',
    anomalyInYear: 'Anomalia nel {year}',
    trend: 'Tendenza',
    annualAnomalyHeading: 'Anomalia annuale · {start}–{end}',
    chartFootnote: 'Barre: anomalia annuale. Linea: media mobile a {n} anni.',
    avgAnnualTempHeading: 'Temperatura media annua',
    loadingEra5: 'Carico la serie ERA5…',
    era5RateLimited: 'Troppe richieste a Open-Meteo in poco tempo: riprova tra un minuto.',
    era5Unavailable: 'Serie ERA5 non disponibile per questo punto.',
    era5SeriesUnavailable: 'Serie storica non disponibile (HTTP {status})',
    footer:
      'Anomalie: {source}, cella {latStep}°×{lonStep}°, baseline {baseline}. Assolute: ERA5 via Open-Meteo.',
    feltDaysHeading: 'Giorni che si sentono',
    feltDaysFootnote:
      "Giorni all'anno, media {f0}–{f1} → {l0}–{l1}. Notte tropicale: minima sopra {t}°C.",
    indicatorHotDay: 'Giorni sopra {t}°C',
    indicatorTropicalNight: 'Notti sopra {t}°C',
    indicatorFrost: 'Giorni di gelo',
    lifetimeHeading: 'Da quando ci sei tu',
    lifetimeLabel: 'Anno di nascita',
    lifetimeWarming: 'riscaldamento qui dal {year} a oggi',
    lifetimeHottest:
      '{hot} dei {total} anni più caldi mai misurati in questo punto cadono nella tua vita.',
    lifetimeCaption:
      'Confronto fra il decennio attorno al {year} e l’ultimo decennio, sulla stessa cella di griglia.',
    lifetimeNoData: 'Non ci sono abbastanza misure attorno a quell’anno per questo punto.',
  },
  airQuality: {
    heading: 'Che aria si respira',
    loading: 'Carico la serie CAMS…',
    unavailable: 'Dati sulla qualità dell’aria non disponibili per questo punto.',
    noAnnualSeries: 'Serie annuale incompleta: non basta per una media.',
    unit: 'µg/m³ di PM2.5',
    timesGuideline: '{times}× la soglia OMS',
    annualCaption:
      'media annua nel {year}. La linea guida OMS è {guideline} µg/m³ — è una soglia sanitaria, non un limite di legge: quelli sono più permissivi.',
    daysOverLabel: 'Giorni sopra i {daily} µg/m³',
    nowLabel: 'Adesso',
    aqi: 'AQI europeo {value}',
    footnote:
      'Modello CAMS via Open-Meteo, non una centralina: in città il valore vero cambia di strada in strada. Sono gli stessi aerosol che raffreddano il pianeta mascherando parte del riscaldamento.',
  },
  boundaries: {
    navShort: 'Confini',
    navLong: 'I confini del pianeta',
    heading: 'I confini del pianeta',
    subheading: 'Nove limiti entro cui la Terra resta il pianeta che conosciamo',
    close: 'Chiudi',
    crossedOf: 'su 9',
    crossedCaption:
      'confini planetari superati. Il clima è uno dei nove, e non è quello messo peggio.',
    statusCrossed: 'superato',
    statusSafe: 'entro il limite',
    boundaryLabel: 'limite',
    currentLabel: 'oggi',
    controlVariable: 'Variabile di controllo',
    safeZone: 'spazio operativo sicuro',
    riskZone: 'zona di rischio crescente',
    noQuantified: 'nessun limite quantificato',
    footnote:
      'Il superamento di un confine non è una soglia oltre la quale succede tutto insieme: è l’uscita dalle condizioni in cui l’umanità si è sviluppata, e il rischio cresce con la distanza.',
    sourceValues: 'Valori: Richardson et al., Science Advances 2023',
    sourceStatus: 'Stato: Planetary Health Check 2025 (PIK)',
  },
  actionsPanel: {
    navShort: 'Azioni',
    navLong: 'Cosa posso fare',
    heading: 'Cosa posso fare',
    subheading: 'Quanto pesa davvero un gesto, e dove sta la leva vera',
    close: 'Chiudi',
    rankingHeading: 'Le azioni, per quanto valgono',
    rankingIntro:
      'Tonnellate di CO₂e evitate in un anno, in un paese ricco. Le voci segnate sono quelle che scuole e governi raccomandano più spesso — e sono quasi tutte in fondo.',
    advisedBadge: 'raccomandata',
    savesUnit: 't/anno',
    refWorld: 'media mondiale a testa ({year})',
    refFairShare: 'quota compatibile con 1,5 °C',
    excludedHeading: 'Una voce che non troverai qui',
    excludedBody:
      'Lo stesso studio mette in cima «un figlio in meno», {saves} t/anno. È la cifra più contestata del lavoro: attribuisce a chi genera una quota delle emissioni future di tutti i discendenti, con una convenzione che non si applica a nient’altro in questa app. Nel grafico schiaccerebbe tutto il resto sotto una barra sola.',
    contextHeading: 'Da dove viene l’idea di «impronta personale»',
    contextBody:
      'L’idea che l’inquinamento sia una responsabilità da calcolare persona per persona è stata resa popolare da una campagna pubblicitaria di BP del 2004, che diffuse il calcolatore di impronta di carbonio individuale. Dirlo non serve a togliersi la responsabilità: serve a capire dove sta la leva. Il taglio diretto di una persona è piccolo davanti alle {gt} Gt che dieci imprese estraggono in un anno. Quello che non è piccolo è tutto il resto.',
    multipliersHeading: 'Le leve che non si misurano in tonnellate',
    multipliersIntro:
      'Qui non ci sono numeri, ed è voluto: dare un valore in tonnellate al voto o al fondo pensione vorrebbe dire inventarlo. Ma è da questa parte che una persona sola tocca quantità che non sono le sue.',
    handoffHeading: 'E poi, qualcosa di concreto',
    handoffBody:
      'Apri un luogo sulla mappa e cerca i progetti attivi lì intorno: l’app li cerca sul web e verifica ogni indirizzo contro le citazioni reali, invece di inventarli.',
    sourceNote: 'Valori per un paese ricco: quanto valgono dipende da dove vivi.',
    budgetHeading: 'Quanto tempo resta',
    budgetYears: 'anni',
    budgetCaption:
      'al ritmo attuale ({annual} Gt CO₂ all’anno). Il bilancio compatibile con 1,5 °C è di {gt} Gt dall’inizio del {from}, con il {probability}% di probabilità: il numero qui sopra è già al netto di quanto è stato emesso da allora.',
    budgetStrict:
      'Chiedendo il {probability}% di probabilità invece del 50, il bilancio di partenza scende a {gt} Gt e quello che resta diventa {years} anni.',
    supportHeading: 'Quasi tutti sono d’accordo, e quasi nessuno lo sa',
    supportIntro:
      'Indagine su {people} persone in {countries} paesi. Le tre righe qui sotto sono quello che la gente pensa davvero.',
    supportWilling: 'disposto a versare l’1% del proprio reddito',
    supportNorms: 'condivide le norme sociali pro-clima',
    supportDemands: 'chiede più azione politica',
    supportGap:
      'E qui sta il punto: **tutti sottostimano gli altri**. Le persone agiscono in modo condizionale — faccio la mia parte se penso che la facciano anche gli altri — quindi credere di essere in minoranza quando si è nell’{demands}% è di per sé un freno. È il motivo per cui «parlarne» è una leva e non un modo di dire.',
    foodHeading: 'Cosa c’è nel piatto',
    foodIntro:
      'La riga «dieta vegetale» qui sopra vale 0,8 t all’anno, ma nasconde due ordini di grandezza dentro la stessa spesa. Chilogrammi di CO₂e per chilo di prodotto, dal campo alla tavola.',
    foodUnit: 'kg CO₂e per kg',
    foodTransportNote:
      'Il trasporto è in media il {share}% del totale. È il numero che smonta il «mangia locale»: cambiare **cosa** si mangia pesa molto più di cambiare **da dove viene**.',
    foodLandLabel: '{value} m² di terra per kg',
    foodLoading: 'Carico i dati sugli alimenti…',
    foodUnavailable: 'Dati sugli alimenti non disponibili. Generali con',
    yourHeading: 'Il tuo numero',
    yourIntro:
      'La classifica qui sotto è quella del mondo. Sei domande bastano a sapere quali di quelle leve sono davvero aperte a te, e a metterle nel tuo ordine.',
    yourPrivacy:
      'Le risposte restano in questa pagina: non vengono salvate, non finiscono nell’indirizzo, non escono da qui.',
    yourIncomplete: 'Rispondi a tutte e sei per vedere la tua lista.',
    yourProgress: '{answered} di {total}',
    yourReset: 'Ricomincia',
    yourTotalLabel: 'quello che puoi togliere in un anno',
    yourUnit: 't CO₂e',
    yourCompare:
      'La quota compatibile con 1,5 °C è {fair} t a testa. Una persona media del mondo ne emette {world} ({year}).',
    yourTopLine: 'Da sola, **{name}** vale il {share}% di tutto quello che puoi togliere.',
    yourMissingHeading: 'Cosa non ti riguarda',
    yourCaveat:
      'Sono **mediane di un solo studio**, ricavate soprattutto da paesi ricchi: un ordine di grandezza, non il tuo conto. E non si sommano davvero — chi smette insieme di volare e di guidare non ottiene esattamente la somma delle due righe.',
    yourTopTen:
      'Le dieci opzioni più efficaci, tutte insieme, valgono {total} t all’anno secondo lo stesso studio.',
    yourNoNumber: 'senza numero, apposta',
    yourNothingLeft:
      'Zero non vuol dire che non emetti: vuol dire che di leve **misurabili in tonnellate** non te ne è rimasta nessuna. Quello che ti resta è l’ultima riga, che un numero non ce l’ha.',
    badgeNotApplicable: 'non ti riguarda',
    badgeAlreadyDone: 'lo fai già',
    rankingProfileNote:
      'Le righe spente sono quelle che le tue risposte escludono. L’ordine resta quello dello studio: è lì che sta il confronto fra ciò che viene consigliato e ciò che funziona.',
  },
  futurePanel: {
    navShort: 'Futuro',
    navLong: 'Dove stiamo andando',
    heading: 'Dove stiamo andando',
    subheading: 'Le strade che restano aperte, e quello che sta già funzionando',
    close: 'Chiudi',
    scenariosHeading: 'Il bivio',
    scenariosIntro:
      'Il riscaldamento a fine secolo dipende da quanto si emette da qui in avanti. Non è una previsione: sono cinque strade, e la differenza fra la prima e l’ultima è di tre gradi.',
    scenariosBaseline:
      'Rispetto al {baseline} — la convenzione IPCC, non quella della mappa (1951-1980). Sono due zeri diversi: sommarli sbaglierebbe di circa un quarto di grado, ed è il motivo per cui questo grafico sta qui e non in coda alla linea del tempo.',
    scenariosInterpolated:
      'L’IPCC pubblica tre finestre ventennali, non un valore per ogni anno: i segmenti fra i punti sono un collegamento, non dati.',
    scenarioSsp119: 'emissioni azzerate intorno al 2050',
    scenarioSsp126: 'azzerate dopo il 2050',
    scenarioSsp245: 'a metà strada, nessuna svolta',
    scenarioSsp370: 'emissioni che continuano a crescere',
    scenarioSsp585: 'crescita senza freni',
    workingHeading: 'Quello che sta già funzionando',
    workingIntro:
      'Il resto di quest’app è un atto d’accusa. Questa parte no: sono le cose che sono cambiate davvero, e in fretta. Non consolano — dimostrano che la variabile non è la fisica, è la decisione.',
    solarHeadline: 'in meno il fotovoltaico',
    solarCaption:
      'dal {fromYear} al {toYear}: da {fromCost} a {toCost} dollari per watt. È il crollo di prezzo più rapido mai registrato per una tecnologia energetica.',
    capacityLine:
      'Capacità solare installata nel mondo: da {fromValue} GW nel {fromYear} a {toValue} GW nel {toYear}.',
    shareLine: 'Elettricità mondiale da fonti rinnovabili: {value}% nel {year}.',
    lcoeHeading: 'Quanto costa produrre un kWh',
    lcoeCaption: 'Dollari per kWh, dal primo anno con dati mondiali a oggi.',
    lcoeRose:
      'Le ultime due sono salite, e vale la pena notarlo: la storia non è «tutto è diventato economico», è che due tecnologie nuove sono crollate mentre le vecchie no.',
    lcoeSolar: 'Fotovoltaico',
    lcoeOnshore: 'Eolico a terra',
    lcoeOffshore: 'Eolico in mare',
    lcoeHydro: 'Idroelettrico',
    lcoeGeothermal: 'Geotermico',
    loading: 'Carico le serie…',
    unavailable: 'Dati non disponibili. Generali con',
  },
  tour: {
    start: 'Fammi vedere in ordine',
    next: 'Avanti',
    prev: 'Indietro',
    finish: 'Ho capito',
    exit: 'Esci dal percorso',
  },
  knowledge: {
    navShort: 'Metodo',
    navLong: 'Come lo sappiamo',
    heading: 'Come lo sappiamo',
    subheading: 'Da quando lo sappiamo, e con che convenzioni si misura',
    close: 'Chiudi',
    timelineHeading: 'Quando l’abbiamo saputo',
    timelineIntro:
      'La fisica di base è del 1856, il primo calcolo del 1896, il primo allarme formale a un capo di governo del 1965. «Non si poteva sapere» non è mai stata un’opzione.',
    methodHeading: 'Le convenzioni, spiegate una volta',
    methodIntro:
      'Ogni pannello di quest’app dichiara in piccolo la convenzione che sta usando. Qui sono spiegate per esteso: sono le trappole in cui cade quasi tutto quello che si legge in giro, ed è anche il modo per controllare se questa app ci è caduta.',
  },
  consequences: {
    navShort: 'Effetti',
    navLong: 'Cosa fa',
    heading: 'Cosa fa il riscaldamento',
    subheading: 'Il mare che sale, e i giorni in cui è già successo',
    close: 'Chiudi',
    loading: 'Carico le misure…',
    unavailable: 'Dati sulle conseguenze non disponibili. Generali con',
    seaHeading: 'Il mare che sale',
    seaIntro:
      'Non è una faccenda del 2100: fra il 1901 e il 2018 il livello medio del mare è salito di **{cm} centimetri**, e nessun secolo ne aveva visto altrettanto negli ultimi {years} anni.',
    seaChartNote: 'Livello medio globale {from}–{to}, in millimetri rispetto alla media {baseline}.',
    seaChartAria: 'Livello medio globale del mare dal 1880 a oggi: una curva che sale e accelera.',
    ratesHeading: 'E accelera',
    ratesUnit: 'mm all’anno',
    projectionHeading: 'Dove arriva entro il 2100',
    projectionIntro:
      'Mediana e intervallo probabile per ciascuno scenario, in metri rispetto alla media {baseline}. È una terza base di riferimento, diversa da quelle della mappa e degli scenari di temperatura: sta scritta qui accanto apposta.',
    metres: 'm',
    commitment:
      'La parte che non si negozia: **anche fermando il riscaldamento a {degrees} °C**, il mare continuerebbe a salire di {low}-{high} metri nei {years} anni successivi. L’oceano risponde per secoli a un calore che ha già assorbito.',
    exposureHeading: 'Chi ci vive accanto',
    exposureIntro:
      'La quota di popolazione che vive sotto i cinque metri di quota. La tacca chiara è la quota di **superficie** che sta là sotto: dove cade molto a sinistra della barra, un paese intero è stipato sulla propria striscia bassa.',
    exposurePeople: 'popolazione',
    exposureLand: 'superficie',
    exposureNote: 'Dati {year} · {coverage} paesi ·',
    eventsHeading: 'I giorni in cui è già successo',
    eventsIntro:
      '«Il maltempo c’è sempre stato» ha una risposta precisa, e non è «il clima cambia»: è **quante volte più probabile** è diventato quel giorno lì. Dodici eventi, ognuno con lo studio che l’ha misurato.',
    readStudy: 'Leggi lo studio',
    eventsClickHint: 'Ogni riga apre il suo luogo sulla mappa.',
    researchHeading: 'Dove guarda la ricerca',
    researchIntro:
      'Sull’elenco pubblico di Carbon Brief ci sono **{total} studi** su eventi e tendenze: {moreLikely} concludono che il riscaldamento ha reso l’evento più probabile o più intenso, {noInfluence} non trovano un’influenza distinguibile, {lessLikely} la trovano nel verso opposto.',
    researchGap:
      'Ma questa non è una mappa di dove succedono gli estremi: è una mappa di **dove si studiano**. L’Europa ne ha venti volte più dell’Africa settentrionale, e i paesi meno studiati sono quasi sempre quelli che la scheda «chi lo regge» mostra meno attrezzati a reggerlo.',
    researchNote: 'Conteggi nostri sull’elenco pubblico, {counted}. La raccolta completa è di',
  },
  producers: {
    tab: 'Chi le estrae',
    heading: 'Chi tira fuori il carbonio',
    intro:
      'Contabilità a monte: la CO₂ del petrolio la emette chi lo brucia, questa lente dice chi l’ha estratto. Non è un doppio conteggio delle altre due schede, è la stessa quantità guardata dall’altro capo della filiera.',
    tracedLine: '{gt} Gt CO₂e tracciate nel {year} a {active} soggetti, su {total} nel database.',
    halfLine: 'Bastano {n} imprese per superare metà delle emissioni fossili mondiali.',
    stateBadge: 'statale',
    investorBadge: 'privata',
    brandsHeading: 'E chi la confeziona',
    brandsIntro:
      'La plastica ritrovata nei rifiuti raccolti dai volontari, contata marchio per marchio. È l’altra faccia della metrica «plastica mal gestita» sulla mappa: lì i paesi, qui le aziende.',
    brandsLeaderLine: '{items} pezzi in {countries} paesi · primo da {years} anni di fila',
    brandsMethod:
      'La classifica non è per numero di pezzi ma per quanti paesi diversi ritrovano quel marchio — e cambia il podio: nel {year} il secondo ha lasciato più pezzi del primo, ma in {runnerUp} paesi contro {leader}. Contare i pezzi premierebbe i posti dove si raccoglie di più, non i marchi più diffusi.',
    brandsAuditLine:
      '{volunteers} volontari in {countries} paesi, {items} pezzi contati, {brands} marchi di {parents} aziende.',
    copiedByHand:
      'Le uniche cifre del progetto copiate a mano e non generate da uno script: il CSV di Carbon Majors sta dietro un download interattivo, i brand audit escono solo in PDF. Anno e fonte stanno accanto a ciascuna.',
  },
  warmingWhy: {
    heading: 'Perché qui si scalda così',
    bandMissingNote:
      "La media della fascia {band} non compare perché non si può misurare: nel preindustriale la griglia qui copre il {pct}% delle celle, e una media costruita su quel poco avrebbe solo l'aria di essere una misura.",
    footerNote:
      "Ogni riga è la media misurata di un insieme più stretto di quello sopra, pesata per l'area delle celle: lo scarto fra due righe è quanto pesa quel passaggio, non una causa isolata dalle altre. Terra e mare sono decisi dal centro della cella, sulle stesse forme che colorano il layer delle emissioni.",
  },
  areaEmissions: {
    heading: 'Quanta CO₂ causa questa zona',
    notAvailable: 'Dati per paese non disponibili: {error}',
    loadingCountries: 'Carico le emissioni per paese…',
    badgeFromSearch: 'paese del luogo cercato',
    badgeInside: 'punto dentro il confine',
    badgeNearest: 'costa più vicina · {km} km',
    nearestNote:
      'Il punto cade in mare entro {max} km dalla costa: i confini sono semplificati, e a questa distanza il paese più vicino è ancora la risposta meno sbagliata.',
    contributionNoPoint: 'Il contributo è al riscaldamento del mondo, non di questo punto.',
    contributionWithPoint:
      "Quel contributo scalda il mondo intero, non il territorio di chi emette: la CO₂ si mescola in atmosfera in pochi mesi e non resta sopra chi l'ha bruciata. Questo punto, di riscaldamento, ne ha subito {value} — quasi tutto causato da altri.",
    perCapitaLabel: 'Pro capite ({year})',
    perCapitaValue: '{value} t a testa',
    netValue: '{value} t a testa',
    perCapitaExtra: '{times} la media mondiale',
    perCapitaWhy: "Quanto pesa una persona di qui in un anno, uso del suolo incluso.",
    historicalLabel: 'Storiche ({year})',
    historicalExtra: 'di tutta la CO₂ dal 1750',
    historicalWhy:
      'La CO₂ resta in atmosfera per secoli: il riscaldamento di oggi lo ha caricato chi ha bruciato per primo.',
    netLabel: 'Import/export ({year})',
    netBalanced: 'in pari fra quello che produce e quello che consuma',
    netImports: 'compra più di quanto produce',
    netExports: 'produce per gli altri',
    netWhyImports:
      'Le emissioni delle merci fatte altrove e consumate qui: non compaiono nel conto territoriale, ma sono state ordinate da qui.',
    netWhyExports:
      'Una parte di queste emissioni non serve a chi vive qui: sta dentro le cose che verranno consumate altrove.',
    sourceHeading: 'Da dove esce · {mass} nel {year}',
    whyMuchHeading: 'Perché proprio tanto',
    footerPrefix: 'Emissioni: {source}, anno per anno di riferimento sopra. Riscaldamento attribuito:',
    footerSuffix:
      '— somma di CO₂, metano e protossido dal 1851. Il totale mondiale così calcolato ({worldTmp}) è più alto del riscaldamento osservato: conta il solo effetto serra, senza il raffreddamento degli aerosol che ne maschera una parte. L’attribuzione del punto usa le forme {shapes}.',
    energyNoIdentity:
      "Per questo paese manca il dato sull'energia consumata, quindi la parte di risposta che distingue «ne usa tanta» da «ce l'ha sporca» qui non si può dare.",
    unnamedCountryFallback: 'Questo paese',
    offshoreAntarcticaMain:
      "Qui non c'è un paese: l'Antartide non ha popolazione stabile e non ha una riga nella tabella delle emissioni, quindi non è nemmeno fra le forme {shapes} su cui questo file è costruito.",
    offshoreAntarcticaNote:
      "È l'unico continente che il riscaldamento lo subisce senza averlo causato in nessuna misura.",
    offshoreSeaMain:
      "Questo punto è in mare aperto, a più di {max} km dalla costa più vicina: non c'è un paese a cui attribuire delle emissioni.",
    offshoreSeaNote:
      'Il mare, di suo, non emette: assorbe. Circa il 90% del calore in più trattenuto dal sistema climatico è finito negli oceani (IPCC AR6), ed è il motivo per cui la superficie del mare, in questa mappa, si scalda molto più lentamente della terra — non perché lì il problema sia minore, ma perché il calore se lo porta sotto.',
    unlistedMain: 'Le emissioni di {name} non sono in questo file.',
    unlistedNote:
      'I dati per paese sono agganciati alle forme {shapes}, e a quella scala gli stati più piccoli non hanno un confine proprio: le loro coordinate cadono dentro il vicino. Mostrare i numeri del vicino sotto questo nome sarebbe la risposta sbagliata detta con sicurezza.',
  },
  sectorsPanel: {
    heading: 'Chi scalda il pianeta',
    subheading: 'Emissioni globali di gas serra per settore',
    close: 'Chiudi',
    totalCaption: 'di CO₂ equivalente emessi nel mondo in un anno ({year}).',
    totalCaptionSource: 'Ecco da dove arrivano.',
    totalCaptionDemand: 'Ecco a cosa servivano.',
    sourceFootnote:
      "· {year}, tutti i gas in CO₂e (GWP 100 anni), uso del suolo incluso. È l'ultimo anno pubblicato con questo dettaglio per sotto-settore: le quote si muovono lentamente, il totale assoluto no.",
    demandFootnote:
      'Ogni voce ha la sua fonte, il suo anno e i suoi confini: sono studi diversi, non un unico dataset. Confrontarle fra loro è indicativo, sommarle è sbagliato.',
    tabSource: 'Da dove escono',
    tabDemand: 'A cosa servono',
    highlightPrefix: 'Evidenziate le voci in cui è già contato',
    highlightReset: 'azzera',
    sectorsHeading: 'Settori, dal più grande al più piccolo',
    demandWarningPrefix: 'Queste voci',
    demandWarningEmphasis: 'si sovrappongono',
    demandWarningSuffix:
      'e non sommano a 100: un volo per una vacanza sta sia in «turismo» sia in «trasporti». Sono la stessa torta tagliata per uso finale.',
    revealLink: 'dove sono già contate',
    totalBarAriaLabel: 'Ripartizione: {label}',
  },
  projectsPanel: {
    heading: 'Progetti attivi nella zona',
    intro:
      'Cerca sul web iniziative ambientali a cui puoi partecipare. I risultati arrivano da una ricerca automatica: vanno verificati prima di presentarsi a un evento.',
    searchButton: 'Cerca progetti',
    loadingPrefix: 'Cerco sul web progetti vicino a {place}…',
    loadingHint: 'Richiede qualche secondo: la ricerca interroga più fonti.',
    retry: 'Riprova',
    noProjects:
      'Nessun progetto verificabile trovato per questa zona. Non significa che non ce ne siano — solo che la ricerca non ha trovato fonti attendibili.',
    source: 'Fonte',
    howToParticipate: 'Come partecipare: ',
    evidenceExact: 'pagina trovata',
    evidenceDomain: 'solo dominio',
    evidenceDomainTitle:
      "Il sito dell'organizzazione è reale, ma questa pagina specifica non era tra i risultati di ricerca.",
    sourcesConsulted: { one: '{n} fonte consultata', other: '{n} fonti consultate' },
    droppedUnverified: { one: '{n} risultato scartato', other: '{n} risultati scartati' },
    droppedReason: "perché l'URL non compariva tra i risultati di ricerca",
    cached: 'da cache',
    refresh: 'aggiorna',
    searchFailed: 'Ricerca non riuscita (HTTP {status})',
    invalidResponse: 'Risposta non valida dal server.',
  },
} satisfies Dictionary;
