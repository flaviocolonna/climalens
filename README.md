# ClimaLens

An interactive map of how Earth's temperature has changed from **1880 to 2025**.
Scrub the years, search a place, look at its curve — then flip the map over and
look at who caused that warming.

Real data, no mocks: **NASA GISTEMP v4** for the anomalies, **ERA5** (via
Open-Meteo) for absolute temperatures, felt days and air quality, **Climate
Watch** for sectors, **Global Carbon Budget** for per-country emissions, and a
dozen other open sources named where they are used.

---

## Start here: the tour

The app grew to five full-screen panels, eleven map metrics and a location panel
with eight sections. Content stopped being the bottleneck a while ago; the
bottleneck is that someone arriving sees a map and five buttons with no idea
what order to read them in.

So there is a **nine-step tour**, offered in the hint card on first arrival. Each
step is *a state of the app*, not a new screen — the same map, the same panels —
in the order the argument actually holds together:

> what is happening → the same map 75 years ago → your own town → who caused it
> → what you breathe → who can cope → where it comes from → where it leads →
> what you can do

It only works because the whole state was already addressable by URL: the tour
is, literally, nine internal links. `?tour=3` resumes it at step four.

## How it works

The interesting part is not the map, it is the data pipeline.

GISTEMP publishes monthly anomalies on a 2°×2° grid inside a 57 MB NetCDF-3
file (1,758 months × 90 × 180 cells, Int16). Too much for a browser, and not all
of it is needed: `scripts/build-climate-data.mjs` collapses it into **annual
means** and emits a flat 4.5 MB Int16 binary (~1.5 MB gzipped) plus a JSON
sidecar.

```bash
npm run data     # download, stream-decompress, resample
```

The script includes a minimal NetCDF-3 reader (~90 lines, zero dependencies):
the classic format is simple enough not to justify a library, and the download
runs through `zlib` as a stream so the 57 MB never sit in memory twice.

Quality rules applied at build time:

- a cell only enters the annual mean with **≥ 8** valid months;
- a year is only published with **≥ 25%** global coverage;
- trailing partial years are dropped (the source updates mid-year);
- the global mean is **area-weighted** (`cos(lat)`), not an arithmetic mean of cells.

### The rendering

The grid is equirectangular, the map is Web Mercator. Overlaying one on the
other without reprojecting is the classic mistake: the high latitudes slide.

`src/lib/gridRenderer.ts` samples **in Mercator space**, row by row, with
bilinear interpolation that is aware of missing values (empty cells do not
contaminate their neighbours, and their partial coverage fades the alpha at the
edges instead of producing a step). Row and column tables are precomputed once,
because the inner loop runs about a million times per frame.

The resulting canvas is draped over MapLibre as a `canvas` source. The source
wakes up for a single frame after each repaint instead of leaving the map in a
continuous render loop.

## Who's heating the planet

The map shows the effect; the sectors show the cause: the breakdown of global
greenhouse gas emissions — Climate Watch (WRI), 2016, 49.4 Gt CO₂e — navigable
from four macro-sectors down to a single sub-sector.

It opens from the **top bar** and fills the window, with the total and its
breakdown in a fixed rail on the left and the tree on the right. It was 24 items
across three levels plus six source cards: in a 26rem column you read them
through a letterbox. Full screen, the bars have the length they need to be
compared, and `esc` closes.

Two non-obvious choices.

**One scale, one origin.** Every bar is the share of the world total, not of its
parent, and it restarts from the panel edge by cancelling the hierarchy indent
(`marginLeft: -depth * INDENT`, plus the same amount in `width`). Without that
compensation an identical percentage would draw a shorter bar at every level,
because `%` resolves against the indented row: *Iron and steel* at 7.2% would
look smaller than it is purely for sitting two levels down.

**The shares add up to their parent, and it is verified.** In dev a recursive
check compares the sum of the children against the parent, and the first level
against 100: a figure corrected by hand without updating the rest gets noticed
immediately, instead of staying a silent error in a table nobody re-checks.

The year is declared rather than implied. 2016 is the last one published at this
sub-sector detail; the shares move slowly, the absolute total does not.

### Second lens: what it was for

"Clothing isn't in there" is the right objection, and the answer is not to add a
row. That cut is **by source** — where the gas physically comes out — and
clothing is an **end use**: its emissions are already inside, spread across
petrochemicals (synthetic fibres), other industry (dyeing and finishing),
agriculture (cotton and wool), shipping and landfills. Adding it next to "Energy
73.2%" would count it twice, and the sum check would say so immediately.

So: a second tab, the same pie cut by end use — buildings, food, tourism,
health, clothing, digital. It has three properties the first one does not, all
declared rather than hidden:

- **the items overlap** and do not add to 100 (a holiday flight sits in both
  *tourism* and *transport*);
- **each item has its own source, year and boundaries** — no single study
  computes them all the same way, so the source sits on the row, not in the
  footer, and a different denominator is flagged in amber;
- **where the estimate is contested, the range is drawn.** Clothing sits between
  2 and 4%: the "10% of global emissions" that circulates everywhere has no
  traceable source. The bar is solid up to the low estimate and veiled up to the
  high one — the veiled part is the uncertainty, not an extra value.

Every item has a *where they are already counted* link, which opens the other
lens on the matching sectors and pushes the rest into the background. That is
where the difference between the two questions becomes visible.

### Third lens: who extracts it

Upstream accounting. [Carbon Majors](https://carbonmajors.org/briefing/Carbon-Majors-2024-Data-Update-35466)
traces **34.7 Gt CO₂e in 2024 to 166 entities**, and 70% of all fossil CO₂ of
the industrial era to 178. It takes 32 companies to pass half of world
emissions.

It is not double counting the other two tabs: the CO₂ from oil is emitted by
whoever burns it, this lens says who extracted it — the same quantity seen from
the other end of the chain.

In the same tab, **who packages it**: the brands found in waste collected by the
volunteers of the [Global Brand Audit](https://www.breakfreefromplastic.org/2024/02/07/bffp-movement-unveils-2023-global-brand-audit-results/)
— 8,804 volunteers in 41 countries, 537,719 items counted. It is the other face
of the "mismanaged plastic" metric on the map: countries there, companies here.
And the ranking is **not by number of items** but by how many different countries
find that brand: in 2023 the runner-up left more of them, but across 30 countries
against 40. Counting items would reward the places that collect better, not the
most widespread brands — and since that difference is not obvious, the panel
writes it down.

**These are the only figures in the project copied by hand.** The Carbon Majors
CSV is free but sits behind an interactive download a script cannot walk through
(I tried: it returns the HTML page), and brand audits only come out as annual
PDFs. So no pipeline pretending to update itself: the press-release numbers, with
year and link beside each, and a panel that says they are transcribed.

## Who causes it (the country layer)

The anomaly map shows who **suffers** the warming. The selector at the bottom
left flips it: emissions per country, i.e. who **causes** it. That the two maps
look nothing alike is the strongest argument this app can make.

Three metrics, each with its own question:

| | |
|---|---|
| **Per capita** | how much one person here accounts for, land use included |
| **Historical** | share of all CO₂ emitted since 1750 — the part still up there |
| **Imports/exports** | consumption minus production: buying a T-shirt made elsewhere means buying its emissions |

The first two are **quantities** and take a single-hue red sequential ramp,
**light to dark**: darker = more emissions, the convention anyone who has seen a
map expects. The third has two opposite directions around zero and is the only
**diverging** one, red↔teal; there "worse" does not exist, "further from zero"
does, and the same rule holds on both arms, with the grey middle receding
because *balanced* is not news. Red sits on the importer side: that is the
country whose real footprint is bigger than its territorial number.

On a dark basemap the convention has a cost — the high value is also the least
luminous. Two things pay for it: the darkest step stops where contrast against
the background still holds (2.3:1, measured) and every country has its own light
outline, so a dark fill reads as filled and not as a hole. Alpha stays
**constant** across classes: growing it with the value, the way the anomaly ramp
does, would cancel exactly the lightness ramp that carries the information here.

The ramps are validated against the real basemap, not by eye: lightness
monotonicity, separation between adjacent classes, contrast on the background,
colour-blind separation.

`scripts/build-emissions-data.mjs` joins Global Carbon Budget data (via Our World
in Data, a 14 MB CSV) to Natural Earth 1:110m shapes and makes a 210 KB
per-country GeoJSON. The file downloads **on demand**: when the layer is switched
on, or when a location panel opens — which uses the same shapes to decide which
country a point belongs to, and as a land/sea mask. Whoever only looks at the
anomaly map never downloads it.

Two things the join carries with it:

- `Number('')` is `0`, not `NaN`. Without an explicit check every empty CSV cell
  would have become a confident zero: Taiwan and Antarctica as countries with no
  emissions. Now an empty cell stays "no data" and the country is drawn grey.
- Every metric takes **its own reference year**, and whoever lacks it is not
  coloured. Keeping one country's 2019 next to everyone else's 2024 would produce
  a map whose colours cannot be compared to each other — which is the only thing
  a choropleth is for.

## Beyond CO₂

CO₂ warms, but you do not breathe it — and it is not what kills right now. Three
sections carry the pollution that is not carbon.

### The air here (in the location panel)

PM2.5 for the open point, from **Open-Meteo Air Quality**: the same keyless
provider as the ERA5 archive, with the CAMS model behind it. A single request
(~32 KB gzipped) brings both the current value and the last complete calendar
year.

The big number is not the absolute value but the **ratio to the WHO guideline** —
5 µg/m³ as an annual mean — because "2.4 times the threshold" lands without
knowing what a microgram per cubic metre is. Below it, the days above the daily
guideline (15 µg/m³). Rome: 12.2 µg/m³, 94 days out of 365. Delhi: 80.3 µg/m³,
**365 days out of 365**. Reykjavík: 3.1, zero days.

Two rules keep the count honest, the same ones as the days above 30 °C: a day
only counts with at least 18 measured hours, and a year only with at least 300
days. And the daily threshold applies to the **daily mean**, not to peaks:
counting hours would give a bigger number that means nothing.

The hook into the rest of the app was already there: the country panel explains
that attributed warming exceeds observed warming *because aerosols mask part of
it*. Those aerosols are this PM2.5. The same smoke keeps the planet slightly
cooler and fills people's lungs — the app was writing half the sentence.

### Five more metrics on the map

A third tab in the selector, next to "who suffers it" and "who causes it":

| | |
|---|---|
| **Air (PM2.5)** | population-weighted mean exposure, µg/m³ |
| **Deaths** | deaths attributable to air pollution, per 100,000 |
| **Water** | withdrawals as a share of renewable resources, % |
| **Plastic** | mismanaged plastic waste per capita, kg/year |
| **Nitrogen** | nitrogen fertiliser per hectare of cropland, kg/ha |

A separate tab rather than five more chips at the end of the carbon one: PM2.5
is not a kind of CO₂, and next to "per capita" it would have read as a variant of
the same count.

**The classes are not round numbers.** Where an agreed threshold exists, that is
the boundary: PM2.5 uses the WHO 2021 guideline and its four interim targets (5,
10, 15, 25, 35), water stress uses the UN target 6.4.2 classes — and above 100% a
country withdraws more than renews, which happens to seventeen of them. Inventing
a scale would have made the colours arbitrary exactly where an international
agreement on where the limit sits already exists.

`scripts/build-pollution-data.mjs` joins the **World Bank** API (which
redistributes WHO and FAO) and two **Our World in Data** datasets into a 16 KB
per-ISO3 table **without geometry**: the emissions file already has the shapes,
and the client merges the two on the fly. The usual rule holds — one reference
year per metric, and whoever lacks it stays grey — with one difference: the year
picked is the one that **covers the most countries**, not the most recent, because
the latest published year is almost always half empty.

A trap found along the way: World Bank aggregates (`WLD`, `EUU`, `ARB`) have
legitimate-looking ISO3 codes and pass any format check. The indicator endpoint
does not say which is which — the `region` field comes back `null` for everyone —
so the list of real countries has to be asked of `/country`, where an aggregate
has `region.id === 'NA'`. Without it, the entire world ended up in the ranking as
if it were a country.

### The planet's boundaries

The section that puts climate back in scale. Nine limits, **seven crossed**:
climate is one of the nine and fifth by distance from its limit. Nitrogen and
phosphorus sit at three times the boundary, biosphere integrity at more than ten.

The bars measure **how many times the limit**, not the absolute value: ppm,
teragrammes of nitrogen and Dobson units would not sit on one scale any other
way. Half the track is the boundary; the real number stays written beside each
row. Two rows have the direction inverted — forest remaining and aragonite
saturation are crossed by **falling** — and without declaring that in the data
they would have had their bar on the wrong side.

Values from Richardson et al., *Science Advances* 2023: one assessment,
internally consistent, instead of nine numbers from nine places. The status is
from the **Planetary Health Check 2025**, which declared ocean acidification
crossed as well — the seventh. It is the only row where the two sources overlap,
and it carries the 2025 numbers: declared, rather than blended in silence.

And ozone, within its limit and recovering, sits there as a reminder that a
global environmental problem was closed once.

## Who can afford to cope

The map already answers "who suffers it" and "who causes it". This is the third
question, and it is the one that closes the argument: between those hit hardest
and those with the means to adapt there is almost no overlap.

Three metrics from the **ND-GAIN Country Index**: the overall index, the
**vulnerability** half (exposure, sensitivity, adaptive capacity) and the
**readiness** half (economic conditions, governance, social cohesion).

Watch the **direction**: the index and readiness are "higher is better",
vulnerability is "higher is worse". The project's red ramp says "darker is
worse", so two of the three have their classes reversed — declared in the code,
not left to chance, because a map with the wrong direction lies without anybody
noticing.

The archive is a 4.9 MB zip with 217 CSVs that only downloads if you present a
`Referer` — without one the server answers 403. Three files are needed, so
`scripts/build-adaptation-data.mjs` carries a minimal zip reader (~70 lines, zero
dependencies) in the same spirit as the NetCDF-3 reader in the climate script:
the format is simple enough not to justify a library.

## Why it warms this much here

The location panel used to say **how much**. Now it also says **why this much**,
with measured numbers instead of a sentence written by hand place by place.

It is a ladder of nested comparisons, all read from the same GISTEMP grid:

| | | |
|---|---|---|
| The world | +1.29 °C | |
| The 40°–50° N band | +1.82 °C | +0.53 |
| Land within that band | +2.33 °C | +0.50 |
| This point | +2.64 °C | +0.31 |

Each row is the mean — weighted by `cos(lat)`, since at 60° a cell covers half
the surface of one at the equator — of a narrower set than the row above. The gap
between two rows is **how much that step weighs**, not a cause isolated from the
others: at these scales independent causes do not exist, and the note under the
ladder says so. Beside each row is the mechanism: polar amplification where
retreating ice uncovers dark rock and sea, the thermal capacity of water where
the point falls at sea, continentality where there is only land around.

Three rules keep the ladder honest.

**The text never contradicts the number.** Continentality explains the residual
only if the residual has the right sign. In Delhi the point sits *below* the land
mean of its band — industrial haze, irrigation — and "further from the sea means
more warming" would be a wrong sentence said with confidence. When the sign does
not work out, the row says the remainder cannot be read from here, and lists what
a 2° cell does not separate.

**A row that cannot be measured is not printed.** The 70°–80° S band has
nineteenth-century data on 2% of its cells: below 60% coverage the band mean
disappears, and the reason it is missing takes its place.

**Land and sea are decided by the cell centre**, and when the point and its cell
disagree that is the explanation before any other: in the gulf of Naples the
point is at sea, but the cell measuring it is 56% land, and the value that comes
out sits on the land side.

## How much CO₂ this area causes

The anomaly map answers "who suffers it", the country layer "who causes it", and
the two answers used to live on two different screens. Now the location panel
holds them together on the same point.

The big number is **how many degrees of global warming are attributable to the
greenhouse gases emitted by that country** since 1851 — Italy +0.015 °C, Brazil
+0.088, United States +0.296 — next to the population share, which is the
yardstick it should be read against: Brazil has 5.3% of attributed warming and
2.6% of the people.

And above all: **that contribution warms the whole world, not whoever emits it.**
CO₂ mixes through the atmosphere in months. This point has taken +2.64 °C, almost
all of it caused by others — which is the app's thesis said on a single point
instead of across two maps.

The world total of this attribution (+1.68 °C) is higher than observed warming
(+1.29 °C), and the panel says why instead of leaving an error to be suspected:
it counts the greenhouse effect alone, without the aerosol cooling that masks
part of it.

### Why the emissions

Three pieces, in order of how much they explain.

**Where it comes out.** The year's breakdown by source: coal, oil, gas, cement,
flared gas, forests and land use. It comes first because in half the world it is
already the answer: in Brazil 77% does not come out of an engine but out of a
felled forest, in Qatar 82% is gas. Shares are computed against the total
reconstructed from its parts — not the published one, which file rounding makes
different by up to 2% for countries emitting half a megatonne: a pie whose slices
do not make a hundred is a broken pie. Where land use is a **sink** rather than a
source it does not become a negative slice: it leaves the pie and is stated
separately.

**Why this much.** The identity underneath almost all of the difference between
one country and another:

```
CO₂ per person  =  energy per person  ×  CO₂ per unit of energy
```

that is, *how much* energy a person here consumes and *how dirty* it is. Two
different levers, pulled in different ways, and a single per-capita number
flattens them into one: Norway sits at 4.6× the world average on the first and
0.31× on the second; Qatar is above on both (9.9× and 0.88×); India is below on
energy (0.36×) and above on intensity (1.3×). The two ratios are written beside
the absolute values and **multiply into the third**, which is what makes them
readable instead of two numbers in a row.

**And it is not all CO₂.** The share of methane and nitrous oxide in the
country's greenhouse gas total, when it exceeds 5%: in Kenya it is three
quarters, and without that line the country would look like it emits nothing.

One detail the calculation carries: fossil CO₂ and land use come from the Global
Carbon Budget, the greenhouse gas total from Climate Watch, which estimates land
use differently. Subtracting one from the other would give numbers that do not
add up — for Congo, a total smaller than the sum of its parts — so the non-CO₂
share is computed **only from terms that come from the same source**.

### Which country a point belongs to

Emissions are counted per country: finer than that does not exist, and the panel
declares it rather than implying those numbers belong to the square kilometre
that was clicked. Attribution has four outcomes, all written on the badge:

| | |
|---|---|
| **country of the searched place** | the ISO code comes from the geocoder: exact, and immune to border simplification |
| **point inside the border** | point-in-polygon on the 1:110m shapes, for points clicked on the map |
| **nearest coast · N km** | the point is at sea within 300 km: at that distance the nearest country is the least wrong answer, and the kilometre count is there to judge it |
| **none** | open sea beyond 300 km, or Antarctica: there is no country, and that is the thing to say |

The fifth case is what makes the ISO code useful: Singapore, Malta, Monaco and
the other micro-states have no shape at 1:110m, and their coordinates fall inside
a neighbour. There the panel says that country is not in this file — showing
Malaysia's numbers under the name "Singapore" would be the wrong answer said with
confidence.

## Days you can feel

`+1.8 °C` is an abstraction. "38 nights above 20 degrees instead of 4" is not.

The location panel counts, on the daily ERA5 series, the days above 30 °C, the
nights above 20 and the frost days, averaged over the same two thirty-year
windows as the absolute temperatures. Maxima and minima triple the JSON but not
the bandwidth — about 190 KB gzipped for 86 years, because a column of similar
numbers compresses well.

Two rules keep the count honest:

- a year with gaps would count fewer days over threshold **just because it has
  fewer days in total**, so below the completeness threshold it enters no average;
- a row only appears if it means something in that place. Frost days in Singapore
  and 30 °C days in Tromsø would be two rows of zeros, and a zero that does not
  change says nothing.

The colour of the delta follows **the direction of warming, not the sign of the
number**: more tropical nights and fewer frosts say the same thing.

## Since you have been here

Type a year of birth in the location panel and the same series that draws the
chart is re-read from a different origin: how much **that point** warmed since
then, and how many of the ten hottest years ever measured there fall inside one
lifetime.

Zero extra requests — it is the grid cell already loaded. The comparison is
between the **decade around** the birth year and the most recent decade, not two
single years: one year on its own is weather noise and the comparison would be
with chance. The year lives in `localStorage` and never enters the URL: it is the
only personal datum the app touches, and a shared link should not carry it.

## What can I do

The contrast that holds the section up, from [Wynes & Nicholas 2017](https://iopscience.iop.org/article/10.1088/1748-9326/aa7541):
living car-free is worth **2.4 t/year**, changing lightbulbs **0.10**. The two
actions every campaign mentions are at the bottom, and in the panel they are
tagged "recommended" precisely to make the gap visible between what we are told
to do and what weighs.

The bars are not scaled against each other: the track is as long as **one average
person in the world** (5.29 t, from the app's own world reference), with a mark
at the share compatible with 1.5 °C. So you can see at a glance that not even the
biggest single choice covers half of what an average person emits — and that
living car-free saves more than a whole fair annual share.

**One item is excluded on purpose.** The same study puts "one fewer child" at the
top with 58.6 t/year: it is the most contested figure in the work, because it
assigns the parent a share of the future emissions of all descendants under a
convention that applies to nothing else here. The panel says it exists and why it
is missing, instead of removing it quietly.

### What is on the plate

The "plant-based diet" row is worth 0.8 t a year, and the app never opened the
box. Now it does: kilograms of CO₂e per kilogram of product, stacked by supply
chain stage. Beef ~99 against nuts ~0.4 — two orders of magnitude inside the same
shopping basket.

And the stage breakdown does something on its own: **transport is a median 2.8%
of the total**. It is the number that dismantles "eat local" — changing *what* you
eat weighs far more than changing *where it came from*. Not by saying so, by
showing it.

### How much time is left

Next to the levers and never on its own — a countdown without a lever beside it
produces fatalism, which is the opposite of what that screen is trying to do.

The budget comes from [Indicators of Global Climate Change 2024](https://essd.copernicus.org/articles/17/2641/2025/)
(130 Gt CO₂ from the start of 2025, 50% probability of staying under 1.5 °C); the
**burn rate does not**: it is the 43.2 Gt that come out of `co2-countries.json`'s
world reference, fossil plus land use. The two figures stay consistent with each
other and the arithmetic can be redone by hand.

The number shown is **already net of what has been emitted since 2025** — and the
caption says so, because "130 Gt left from the start of 2025" next to "1.4 years"
looks like a contradiction rather than a subtraction.

### Almost everyone agrees, and almost nobody knows it

Across 130,000 people in 125 countries ([Andre et al., *Nature Climate Change* 2024](https://www.uni-bonn.de/en/news/weltweite-befragung-zeigt-breite-mehrheit-der-weltbevoelkerung-fuer-den-klimaschutz)):
69% are willing to give 1% of their income, 86% endorse pro-climate norms, 89%
demand more political action — **and everyone underestimates everyone else**.

It is the best-documented result in the behavioural climate literature, and it
explains why "talking about it" sits among the levers and not among the
platitudes: people act conditionally, so believing you are in the minority when
you are in the 89% is itself a brake.

Per-country figures are not in any open dataset I could find: the global ones are
here, transcribed like the producers.

### And the bridge that holds it together

If "what can I do" sits next to "178 entities extracted 70% of everything" with
no bridge, the app contradicts itself. The bridge is historical and documented:
the idea of a *personal carbon footprint* as a measure of individual
responsibility was popularised by a **BP advertising campaign in 2004**. Saying
so is not a way to shrug off responsibility, it is a way to see where the lever
is — and the section ends with the levers that are **not measured in tonnes**:
voting, where your money sits, talking about it, doing visible things. There are
no numbers there, deliberately: putting a tonnage on a vote would mean inventing
it. The one number circulating in that field — "moving your pension is 21 times
more effective" — is a campaign figure, not a peer-reviewed one, and the panel
says so.

Last step: the pointer to the projects panel the app already has, where "do
something" stops being a platitude because there is a list of real initiatives
underneath, with URLs verified against actual citations.

## Where we are heading

One panel, and the order of the two sections matters. First **where this road
leads**: the five IPCC SSP scenarios at end of century, from 1.4 to 4.4 °C. Then
**what has already changed** — the other way round the second would look like
consolation after bad news; as it is, it is the answer to the question the fork
leaves open.

On the scenarios there is a trap deliberately avoided: the IPCC measures against
**1850-1900**, this app's map against **1951-1980**. Two different zeros, and
attaching the projections to the end of the timeline would have added a quarter
of a degree while pretending nothing happened. That is why the scenarios live in
a separate chart with their baseline written beside them. And since the IPCC
publishes three twenty-year windows rather than a value per year, the bands are
the *very likely* range and the segments between points are declared as a
connector, not data.

Then the numbers almost nobody knows, all from `npm run data:progress` in 2.2 KB:

| | |
|---|---|
| Solar PV | **−99.8%** since 1975: from $128.27 to $0.26 per watt |
| Installed solar | from 1.2 GW (2000) to **1,866 GW** (2024) |
| Solar per kWh | −90% since 2010 · onshore wind −91% since 1984 |
| Renewable electricity | 33.8% of the world in 2025 |

With one detail kept on purpose: **hydro and geothermal got more expensive**. The
story is not "everything got cheap", it is that two new technologies collapsed
while the old ones did not — and that is a more useful story, because it says
where the learning curve worked and where it did not.

## How we know

Two answers to two objections.

**"Nobody could have known."** A timeline of the science: Eunice Foote in 1856,
Tyndall in 1859, Arrhenius in 1896, Callendar in 1938, Keeling in 1958, the White
House report to Lyndon Johnson in 1965, Charney in 1979, Hansen before the Senate
in 1988, the first IPCC in 1990. The basic physics is 170 years old; the first
formal warning to a head of government is sixty.

**"You're picking these numbers."** Every panel in this app declares, in small
print, the convention it uses — baseline 1951-1980 against 1850-1900, CO₂ against
CO₂e, GWP over 100 years, territorial against consumption, upstream against
downstream, one reference year per metric, coverage. Here they are explained
once, in full, in one place. It is the page that makes the rest checkable, and
the one somebody who wants to trust the app opens first.

## Project search (optional)

The location panel can search the web for environmental projects to join, through
**OpenRouter** with the web search plugin.

**Every URL is verified against the real search results.** A model can write the
plausible URL of a beach clean-up that does not exist; it cannot make it appear
among the citations. `discoverProjects.ts` reads the URLs from the response's
`url_citation` annotations and discards anything that does not match, reporting
how many it dropped. The panel distinguishes *page found* (exact URL among the
citations) from *domain only* (the organisation's site is real, the specific page
is not).

Config aligned with `startup-buddy`: EU routing by default (`eu.openrouter.ai` +
`data_collection: "deny"`, `zdr: true`), the `web` plugin with an explicit
`max_results` instead of the `:online` suffix, and response healing.

`provider.require_parameters: true` is not a detail: without it the router can
pick an endpoint that ignores `response_format`, and the JSON schema silently
decays into a suggestion.

It is the difference between "an AI says there is a clean-up" and "a page exists
that says there is a clean-up". The second still needs checking — and the
interface declares that instead of hiding it.

Cost control: the search only runs **on click**, results are cached per 0.5°
geographic cell (6 hours), and the endpoint has a per-IP cap and a global daily
one.

```bash
cp .env.example .env    # then add OPENROUTER_API_KEY
```

The model is configurable through `OPENROUTER_MODEL` without touching code, and
appears in the provenance line under the results.

Without a key the rest of the app works normally: the projects panel shows an
error, nothing else does.

## Stack

React 18 · TypeScript · Vite · Tailwind · MapLibre GL · Recharts

No API key for the core of the app: the basemap is CARTO Dark Matter, geocoding
and ERA5 are Open-Meteo, all keyless. An OpenRouter key is only needed for
project search — and no SDK: it is a `fetch` to an OpenAI-compatible endpoint.

The interface is available in **Italian, English and Spanish**. Data modules stay
locale-neutral — ids, numbers, colours and sources live once — and the readable
text lives in `src/i18n/`, so a translation can never move a figure by accident.

## Getting started

```bash
npm install
npm run data
npm run dev
```

`npm run data` runs once: `public/data/` is not versioned.

In dev the `/api/discover-projects` endpoint is served by a Vite middleware that
loads the **same** handler as the Vercel function, so local and production cannot
drift. The key stays in the Node process: it has no `VITE_` prefix, so Vite never
puts it in the bundle.

## Commands

| | |
|---|---|
| `npm run dev` | dev server |
| `npm run data` | regenerate every dataset |
| `npm run data:climate` | only the GISTEMP grid |
| `npm run data:emissions` | only the per-country layer |
| `npm run data:pollution` | only the non-CO₂ metrics (air, water, plastic, nitrogen) |
| `npm run data:progress` | only the curves of what is working |
| `npm run data:food` | only the food footprints |
| `npm run data:adaptation` | only the ND-GAIN adaptation index |
| `npm run build` | production build |
| `npm run lint` | typecheck |

## Shareable links

Year, open point, panel, map layer and tour step live in the query string:

```
?year=2003&lat=41.903&lon=12.496&place=Rome&layer=pc&panel=sectors&tour=3
```

Parameter names are English and snake_case; the interface language is **not** in
there — it is detected from the browser and saved in `localStorage`, because a
shared link should not impose the sender's language on whoever opens it.

It is written with `replaceState` and a 250 ms delay: scrubbing the years must
not fill the history with 146 entries the back button cannot escape, nor hammer
the history API during playback.

## Shortcuts

`space` play/pause · `←` `→` previous/next year · click the map to query any
point · `esc` closes a full-screen panel. During the tour the arrows move between
steps instead of scrubbing years.

## Reading notes

Anomalies are relative to the **1951-1980 baseline**, the GISTEMP convention —
not to pre-industrial. The "warming" figure in the detail panel instead compares
`1880-1909` with the most recent decade, which is the more intuitive reading for
a specific place.

Resolution is 2°, so a city inherits the curve of its cell: Naples and Salerno
share the same value. That is the resolution of the available science, not a
limitation of the app — but it should be said rather than left to be assumed.

Transparent areas in the early decades are not zeros: they are **absence of
instrumental coverage**. In 1880 the grid is 68% covered, in 2025 99%.

The country layer **does not depend on the year** chosen on the timeline: it is a
snapshot of the most recent available year, and the legend says so. Kosovo,
Northern Cyprus, Somaliland and Western Sahara are not coloured: they have no ISO
code in the emissions table.

## Sources

- [NASA GISTEMP v4](https://data.giss.nasa.gov/gistemp/) — GHCNv4 + ERSSTv5, 1200 km smoothing
- [Open-Meteo](https://open-meteo.com/) — ERA5 archive and geocoding
- [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) — hourly PM2.5, CAMS model
- [Climate Watch / WRI](https://ourworldindata.org/emissions-by-sector) — emissions by sector, 2016
- [Our World in Data · Global Carbon Budget](https://ourworldindata.org/co2-dataset-sources) — emissions by country
- [Our World in Data · energy](https://ourworldindata.org/energy) — renewable prices and capacity (IRENA, Ember)
- [Natural Earth](https://www.naturalearthdata.com/) — 1:110m borders
- [World Bank · WDI](https://data.worldbank.org/) — PM2.5, air pollution mortality, water stress (WHO and FAO data)
- [Our World in Data](https://ourworldindata.org/plastic-pollution) — mismanaged plastic (Meijer et al. 2021) and nitrogen (FAO)
- [Poore & Nemecek, Science 2018](https://ourworldindata.org/food-choice-vs-eating-local) — food footprints by stage
- [ND-GAIN Country Index](https://gain.nd.edu/our-work/country-index/) — vulnerability and readiness to adapt
- [Richardson et al., Science Advances 2023](https://www.science.org/doi/10.1126/sciadv.adh2458) — the nine planetary boundaries
- [Planetary Health Check 2025](https://www.planetaryhealthcheck.org/) — boundary status (PIK)
- [Carbon Majors](https://carbonmajors.org/) — emissions by fossil and cement producer (InfluenceMap)
- [Break Free From Plastic](https://www.breakfreefromplastic.org/) — global plastic brand audit
- [IPCC AR6 WGI](https://www.ipcc.ch/report/ar6/wg1/) — SSP scenarios, table SPM.1
- [Forster et al. · Indicators of Global Climate Change 2024](https://essd.copernicus.org/articles/17/2641/2025/) — remaining carbon budget
- [Andre et al. · Nature Climate Change 2024](https://www.uni-bonn.de/en/news/weltweite-befragung-zeigt-breite-mehrheit-der-weltbevoelkerung-fuer-den-klimaschutz) — actual and perceived support for climate action
- [Wynes & Nicholas 2017](https://iopscience.iop.org/article/10.1088/1748-9326/aa7541) and [Ivanova et al. 2020](https://iopscience.iop.org/article/10.1088/1748-9326/ab8589) — effectiveness of individual actions
- [CARTO](https://carto.com/basemaps/) — basemap
