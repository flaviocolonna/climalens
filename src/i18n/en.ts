import type { Dictionary } from '@/i18n/dictionary';

export const en = {
  common: {
    noData: 'no data',
  },
  app: {
    title: 'ClimaLens — 145 years of global warming',
    dataErrorTitle: 'Data not loaded',
    loading: 'Loading 146 years of NASA measurements…',
    hintIntro: "Search for a place or click the map to see how its temperature has changed.",
    hintPressPrefix: 'Press',
    hintPressMid: 'to animate the years,',
    hintPressSuffix: 'to step through them.',
    spaceKey: 'space',
    placeFallback: 'Place',
    gridCellSubtitle: '{latStep}°×{lonStep}° grid cell',
    unnamedPoint: 'Selected point',
  },
  nav: {
    tagline: '{years} · temperature anomalies',
    sectorsShort: 'Sectors',
    sectorsLong: "Who's heating the planet",
    languageAria: 'Change language',
  },
  search: {
    placeholderInline: 'Search a place…',
    placeholderStandalone: 'Search a city, country, or place…',
    ariaLabel: 'Search a place',
    clearAria: 'Clear search',
    noResults: 'No results',
    searchFailed: 'Search failed',
  },
  timeline: {
    pause: 'Pause',
    play: 'Start animation',
    yearLabel: 'year',
    selectYearAria: 'Select year',
    globalMeanLabel: 'global mean',
  },
  legend: {
    title: 'Temperature anomaly',
    subtitle: '°C relative to the {baseline} average',
    mapAriaLabel: 'Map of temperature anomalies',
  },
  layerControls: {
    beyondCo2: 'Beyond CO₂',
    whoCopes: 'Who copes',
    whoSuffers: 'Who suffers it',
    whoCauses: 'Who causes it',
    loadingCountries: 'Loading country data…',
    generateFileHint: 'Generate the file with',
    metaLine:
      'Data {year} · {coverage} of {countries} countries · {source}. Independent of the year selected on the timeline.',
  },
  locationPanel: {
    closeAria: 'Close panel',
    noInstrumentalData: 'No instrumental data for this grid cell.',
    warmingBetween: 'warming between {from0}–{from1} and {to0}–{to1}',
    anomalyInYear: 'Anomaly in {year}',
    trend: 'Trend',
    annualAnomalyHeading: 'Annual anomaly · {start}–{end}',
    chartFootnote: 'Bars: annual anomaly. Line: {n}-year moving average.',
    avgAnnualTempHeading: 'Average annual temperature',
    loadingEra5: 'Loading the ERA5 series…',
    era5RateLimited: 'Too many requests to Open-Meteo in a short time: try again in a minute.',
    era5Unavailable: 'ERA5 series not available for this point.',
    era5SeriesUnavailable: 'Historical series not available (HTTP {status})',
    footer:
      'Anomalies: {source}, {latStep}°×{lonStep}° cell, {baseline} baseline. Absolute: ERA5 via Open-Meteo.',
    feltDaysHeading: 'Days you can feel',
    feltDaysFootnote:
      'Days per year, average {f0}–{f1} → {l0}–{l1}. Tropical night: low above {t}°C.',
    indicatorHotDay: 'Days above {t}°C',
    indicatorTropicalNight: 'Nights above {t}°C',
    indicatorFrost: 'Frost days',
    lifetimeHeading: 'Since you have been here',
    lifetimeLabel: 'Year of birth',
    lifetimeWarming: 'warming here from {year} to today',
    lifetimeHottest:
      '{hot} of the {total} hottest years ever measured at this point fall within your lifetime.',
    lifetimeCaption:
      'Comparing the decade around {year} with the most recent decade, on the same grid cell.',
    lifetimeNoData: 'Not enough measurements around that year for this point.',
  },
  airQuality: {
    heading: 'The air here',
    loading: 'Loading the CAMS series…',
    unavailable: 'Air quality data unavailable for this point.',
    noAnnualSeries: 'Incomplete annual series: not enough for a mean.',
    unit: 'µg/m³ of PM2.5',
    timesGuideline: '{times}× the WHO guideline',
    annualCaption:
      'annual mean in {year}. The WHO guideline is {guideline} µg/m³ — a health threshold, not a legal limit: those are more permissive.',
    daysOverLabel: 'Days above {daily} µg/m³',
    nowLabel: 'Right now',
    aqi: 'European AQI {value}',
    footnote:
      'CAMS model via Open-Meteo, not a monitoring station: in a city the real value changes street by street. These are the same aerosols that cool the planet by masking part of the warming.',
  },
  boundaries: {
    navShort: 'Boundaries',
    navLong: 'The planet’s boundaries',
    heading: 'The planet’s boundaries',
    subheading: 'Nine limits within which Earth stays the planet we know',
    close: 'Close',
    crossedOf: 'of 9',
    crossedCaption:
      'planetary boundaries transgressed. Climate is one of the nine, and not the worst off.',
    statusCrossed: 'transgressed',
    statusSafe: 'within the limit',
    boundaryLabel: 'limit',
    currentLabel: 'today',
    controlVariable: 'Control variable',
    safeZone: 'safe operating space',
    riskZone: 'zone of increasing risk',
    noQuantified: 'no quantified limit',
    footnote:
      'Crossing a boundary is not a threshold beyond which everything happens at once: it is leaving the conditions humanity developed in, and the risk grows with the distance.',
    sourceValues: 'Values: Richardson et al., Science Advances 2023',
    sourceStatus: 'Status: Planetary Health Check 2025 (PIK)',
  },
  actionsPanel: {
    navShort: 'Actions',
    navLong: 'What can I do',
    heading: 'What can I do',
    subheading: 'What a personal choice actually weighs, and where the real lever is',
    close: 'Close',
    rankingHeading: 'The actions, by what they are worth',
    rankingIntro:
      'Tonnes of CO₂e avoided in a year, in a rich country. The marked ones are those schools and governments recommend most often — and nearly all of them are at the bottom.',
    advisedBadge: 'recommended',
    savesUnit: 't/year',
    refWorld: 'world average per person ({year})',
    refFairShare: 'share compatible with 1.5 °C',
    excludedHeading: 'One item you will not find here',
    excludedBody:
      'The same study puts "one fewer child" at the top, {saves} t/year. It is the most contested figure in the work: it assigns to the parent a share of the future emissions of all descendants, under a convention that applies to nothing else in this app. On the chart it would flatten everything else under a single bar.',
    contextHeading: 'Where the idea of a "personal footprint" comes from',
    contextBody:
      'The idea that pollution is a responsibility to be computed person by person was popularised by a BP advertising campaign in 2004, which spread the individual carbon-footprint calculator. Saying so is not a way to shrug off responsibility: it is a way to see where the lever is. One person\'s direct cut is small against the {gt} Gt that ten companies extract in a year. What is not small is everything else.',
    multipliersHeading: 'The levers that are not measured in tonnes',
    multipliersIntro:
      'There are no numbers here, and that is deliberate: putting a tonnage on a vote or a pension fund would mean inventing it. But this is the side where one person touches quantities that are not their own.',
    handoffHeading: 'And then, something concrete',
    handoffBody:
      'Open a place on the map and search for active projects nearby: the app searches the web and checks every address against the real citations, instead of inventing them.',
    sourceNote: 'Figures for a rich country: what they are worth depends on where you live.',
    budgetHeading: 'How much time is left',
    budgetYears: 'years',
    budgetCaption:
      'at the current rate ({annual} Gt CO₂ a year). The budget compatible with 1.5 °C is {gt} Gt from the start of {from}, at {probability}% probability: the figure above is already net of what has been emitted since.',
    budgetStrict:
      'Asking for a {probability}% chance instead of 50 drops the starting budget to {gt} Gt, and what is left becomes {years} years.',
    supportHeading: 'Almost everyone agrees, and almost nobody knows it',
    supportIntro:
      'A survey of {people} people across {countries} countries. The three lines below are what people actually think.',
    supportWilling: 'willing to give 1% of their own income',
    supportNorms: 'endorse pro-climate social norms',
    supportDemands: 'demand more political action',
    supportGap:
      'And here is the point: **everyone underestimates everyone else**. People act conditionally — I do my part if I think others do theirs — so believing you are in the minority when you are in the {demands}% is itself a brake. It is why "talking about it" is a lever and not a platitude.',
    foodHeading: 'What is on the plate',
    foodIntro:
      'The "plant-based diet" row above is worth 0.8 t a year, but it hides two orders of magnitude inside the same shopping basket. Kilograms of CO₂e per kilogram of product, from field to table.',
    foodUnit: 'kg CO₂e per kg',
    foodTransportNote:
      'Transport is on average {share}% of the total. It is the number that dismantles "eat local": changing **what** you eat weighs far more than changing **where it came from**.',
    foodLandLabel: '{value} m² of land per kg',
    foodLoading: 'Loading the food data…',
    foodUnavailable: 'Food data unavailable. Generate it with',
  },
  futurePanel: {
    navShort: 'Future',
    navLong: 'Where we are heading',
    heading: 'Where we are heading',
    subheading: 'The roads still open, and what is already working',
    close: 'Close',
    scenariosHeading: 'The fork',
    scenariosIntro:
      'End-of-century warming depends on how much is emitted from here on. This is not a forecast: it is five roads, and three degrees separate the first from the last.',
    scenariosBaseline:
      'Relative to {baseline} — the IPCC convention, not the map’s (1951-1980). Those are two different zeros: adding them would be off by about a quarter of a degree, which is why this chart lives here and not at the end of the timeline.',
    scenariosInterpolated:
      'The IPCC publishes three twenty-year windows, not a value per year: the segments between points are a connector, not data.',
    scenarioSsp119: 'emissions to zero around 2050',
    scenarioSsp126: 'to zero after 2050',
    scenarioSsp245: 'halfway, no turning point',
    scenarioSsp370: 'emissions that keep growing',
    scenarioSsp585: 'growth with no brakes',
    workingHeading: 'What is already working',
    workingIntro:
      'The rest of this app is an indictment. This part is not: these are the things that genuinely changed, and fast. They are not consolation — they show the variable is not physics, it is the decision.',
    solarHeadline: 'off solar',
    solarCaption:
      'from {fromYear} to {toYear}: from ${fromCost} to ${toCost} per watt. It is the fastest price collapse ever recorded for an energy technology.',
    capacityLine:
      'Solar capacity installed worldwide: from {fromValue} GW in {fromYear} to {toValue} GW in {toYear}.',
    shareLine: 'World electricity from renewables: {value}% in {year}.',
    lcoeHeading: 'What a kWh costs to produce',
    lcoeCaption: 'Dollars per kWh, from the first year with world data to today.',
    lcoeRose:
      'The last two went up, and it is worth noticing: the story is not "everything got cheap", it is that two new technologies collapsed while the old ones did not.',
    lcoeSolar: 'Solar PV',
    lcoeOnshore: 'Onshore wind',
    lcoeOffshore: 'Offshore wind',
    lcoeHydro: 'Hydropower',
    lcoeGeothermal: 'Geothermal',
    loading: 'Loading the series…',
    unavailable: 'Data unavailable. Generate it with',
  },
  tour: {
    start: 'Show me in order',
    next: 'Next',
    prev: 'Back',
    finish: 'Got it',
    exit: 'Leave the tour',
  },
  knowledge: {
    navShort: 'Method',
    navLong: 'How we know',
    heading: 'How we know',
    subheading: 'Since when we have known, and by what conventions it is measured',
    close: 'Close',
    timelineHeading: 'When we found out',
    timelineIntro:
      'The basic physics is from 1856, the first calculation from 1896, the first formal warning to a head of government from 1965. "Nobody could have known" was never on the table.',
    methodHeading: 'The conventions, explained once',
    methodIntro:
      'Every panel in this app declares, in small print, the convention it is using. Here they are spelled out: they are the traps almost everything you read falls into, and also the way to check whether this app fell into them.',
  },
  producers: {
    tab: 'Who extracts it',
    heading: 'Who pulls the carbon out',
    intro:
      'Upstream accounting: the CO₂ from oil is emitted by whoever burns it, this lens says who extracted it. It is not double counting the other two tabs, it is the same quantity seen from the other end of the chain.',
    tracedLine: '{gt} Gt CO₂e traced in {year} to {active} entities, out of {total} in the database.',
    halfLine: 'It takes {n} companies to pass half of the world’s fossil emissions.',
    stateBadge: 'state-owned',
    investorBadge: 'investor-owned',
    brandsHeading: 'And who packages it',
    brandsIntro:
      'The plastic found in waste collected by volunteers, counted brand by brand. It is the other face of the "mismanaged plastic" metric on the map: countries there, companies here.',
    brandsLeaderLine: '{items} items across {countries} countries · first for {years} years running',
    brandsMethod:
      'The ranking is not by number of items but by how many different countries find that brand — and it changes the podium: in {year} the runner-up left more items than the leader, but across {runnerUp} countries against {leader}. Counting items would reward the places where more is collected, not the most widespread brands.',
    brandsAuditLine:
      '{volunteers} volunteers in {countries} countries, {items} items counted, {brands} brands from {parents} companies.',
    copiedByHand:
      'The only figures in the project copied by hand rather than generated by a script: the Carbon Majors CSV sits behind an interactive download, and brand audits come out only as PDFs. Year and source sit beside each one.',
  },
  warmingWhy: {
    heading: 'Why it warms like this here',
    bandMissingNote:
      "The {band} band average is missing because it can't be measured: in the pre-industrial period the grid here covers only {pct}% of cells, and an average built on that little would only look like a measurement.",
    footerNote:
      "Each row is the measured average of a narrower set than the one above it, weighted by cell area: the gap between two rows is how much that step weighs, not a cause isolated from the others. Land and sea are decided by the cell's centre, on the same shapes that colour the emissions layer.",
  },
  areaEmissions: {
    heading: 'How much CO₂ this area causes',
    notAvailable: 'Country data not available: {error}',
    loadingCountries: 'Loading country emissions…',
    badgeFromSearch: 'country of the searched place',
    badgeInside: 'point inside the border',
    badgeNearest: 'nearest coast · {km} km',
    nearestNote:
      "The point falls in the sea within {max} km of the coast: borders are simplified, and at this distance the nearest country is still the least-wrong answer.",
    contributionNoPoint: 'The contribution is to the warming of the world, not of this point.',
    contributionWithPoint:
      "That contribution warms the whole world, not the territory of whoever emits it: CO₂ mixes into the atmosphere within months and doesn't stay above whoever burned it. This point has experienced {value} of warming — almost all of it caused by others.",
    perCapitaLabel: 'Per capita ({year})',
    perCapitaValue: '{value} t per person',
    netValue: '{value} t per person',
    perCapitaExtra: '{times} the world average',
    perCapitaWhy: 'How much one person here accounts for in a year, land use included.',
    historicalLabel: 'Historical ({year})',
    historicalExtra: 'of all CO₂ emitted since 1750',
    historicalWhy:
      "CO₂ stays in the atmosphere for centuries: today's warming was loaded by whoever burned it first.",
    netLabel: 'Imports/exports ({year})',
    netBalanced: 'roughly balanced between what it produces and what it consumes',
    netImports: 'buys more than it produces',
    netExports: 'produces for others',
    netWhyImports:
      "Emissions from goods made elsewhere and consumed here: they don't show up in the territorial count, but they were ordered from here.",
    netWhyExports:
      "Part of these emissions aren't for the people who live here: they're embedded in things that will be consumed elsewhere.",
    sourceHeading: 'Where it comes from · {mass} in {year}',
    whyMuchHeading: 'Why so much',
    footerPrefix: 'Emissions: {source}, year by reference year above. Attributed warming:',
    footerSuffix:
      "— sum of CO₂, methane, and nitrous oxide since 1851. The world total calculated this way ({worldTmp}) is higher than observed warming: it counts only the greenhouse effect, without the cooling from aerosols that masks part of it. The point's attribution uses the {shapes} shapes.",
    energyNoIdentity:
      'This country is missing energy-consumption data, so the part of the answer that distinguishes "uses a lot" from "has it dirty" can\'t be given here.',
    unnamedCountryFallback: 'This country',
    offshoreAntarcticaMain:
      "There's no country here: Antarctica has no permanent population and no row in the emissions table, so it isn't even among the {shapes} shapes this file is built on.",
    offshoreAntarcticaNote:
      "It's the only continent that experiences the warming without having caused any of it.",
    offshoreSeaMain:
      "This point is in open sea, more than {max} km from the nearest coast: there's no country to attribute emissions to.",
    offshoreSeaNote:
      "The sea itself doesn't emit: it absorbs. About 90% of the extra heat trapped by the climate system has ended up in the oceans (IPCC AR6), which is why the sea surface warms far more slowly than land on this map — not because the problem is smaller there, but because the heat gets carried down.",
    unlistedMain: "{name}'s emissions aren't in this file.",
    unlistedNote:
      "Country data is tied to the {shapes} shapes, and at that scale the smallest states don't have their own boundary: their coordinates fall inside their neighbor. Showing the neighbor's numbers under this name would be the wrong answer stated with confidence.",
  },
  sectorsPanel: {
    heading: "Who's heating the planet",
    subheading: 'Global greenhouse gas emissions by sector',
    close: 'Close',
    totalCaption: 'of CO₂ equivalent emitted worldwide in a year ({year}).',
    totalCaptionSource: "Here's where it comes from.",
    totalCaptionDemand: "Here's what it was for.",
    sourceFootnote:
      "· {year}, all gases in CO₂e (100-year GWP), land use included. It's the last year published with this level of sub-sector detail: shares move slowly, the absolute total doesn't.",
    demandFootnote:
      "Each entry has its own source, year, and boundaries: these are different studies, not a single dataset. Comparing them is indicative; adding them up is wrong.",
    tabSource: 'Where it comes from',
    tabDemand: "What it's for",
    highlightPrefix: 'Highlighted the entries already counted in',
    highlightReset: 'clear',
    sectorsHeading: 'Sectors, largest to smallest',
    demandWarningPrefix: 'These entries',
    demandWarningEmphasis: 'overlap',
    demandWarningSuffix:
      'and don\'t add up to 100: a flight for a vacation counts under both "tourism" and "transport". They\'re the same pie cut by end use.',
    revealLink: 'where these are already counted',
    totalBarAriaLabel: 'Breakdown: {label}',
  },
  projectsPanel: {
    heading: 'Active projects in the area',
    intro:
      'Search the web for environmental initiatives you can join. Results come from an automated search: verify them before showing up to an event.',
    searchButton: 'Search projects',
    loadingPrefix: 'Searching the web for projects near {place}…',
    loadingHint: 'Takes a few seconds: the search queries multiple sources.',
    retry: 'Retry',
    noProjects:
      "No verifiable project found for this area. That doesn't mean there aren't any — only that the search didn't turn up reliable sources.",
    source: 'Source',
    howToParticipate: 'How to join: ',
    evidenceExact: 'page found',
    evidenceDomain: 'domain only',
    evidenceDomainTitle:
      "The organization's site is real, but this specific page wasn't among the search results.",
    sourcesConsulted: { one: '{n} source consulted', other: '{n} sources consulted' },
    droppedUnverified: { one: '{n} result dropped', other: '{n} results dropped' },
    droppedReason: "because the URL didn't appear among the search results",
    cached: 'from cache',
    refresh: 'refresh',
    searchFailed: 'Search failed (HTTP {status})',
    invalidResponse: 'Invalid response from the server.',
  },
} satisfies Dictionary;
