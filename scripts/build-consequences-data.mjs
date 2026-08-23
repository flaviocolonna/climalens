/**
 * Cosa fa il riscaldamento: il mare, e chi ci vive accanto.
 *
 * Tutto il resto dell'app misura la **causa** — chi emette, chi ha emesso, chi
 * promette, chi mantiene. La mappa dice che si scalda e non dice mai cosa il
 * riscaldamento faccia. Questo file porta la metà mancante, nella sola forma in
 * cui si può portarla onestamente da una pipeline: una misura globale già
 * avvenuta, e l'esposizione per paese.
 *
 * Due fonti:
 *   - NOAA Climate.gov via OWID — livello medio del mare, trimestrale dal 1880.
 *     Church & White 2011 fino al 2013, poi le maree di UHSLC.
 *     https://ourworldindata.org/grapher/sea-level
 *   - Banca Mondiale (dati CIESIN) — quota di popolazione e di superficie sotto
 *     i cinque metri di quota. È l'unico indicatore di esposizione al mare che
 *     esista per quasi tutti i paesi, ed è per questo che c'è.
 *
 * **Quello che questo file non contiene**, e per scelta: le proiezioni. Stanno
 * a mano in src/lib/consequences.ts, prese dalla tabella dell'IPCC come già
 * fanno gli scenari di temperatura in src/lib/future.ts. Una proiezione non è
 * una serie da scaricare, è una riga di un rapporto, e va citata come tale.
 *
 *   node scripts/build-consequences-data.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, '.cache');
const OUT_DIR = join(ROOT, 'public', 'data');

const SEA_SLUG = 'sea-level';

/**
 * Popolazione e superficie sotto i cinque metri. Due indicatori e non uno: un
 * paese può avere molta terra bassa e pochi abitanti sopra (l'Australia), o
 * pochissima terra bassa e mezza popolazione lì sopra. Tenerli separati è
 * l'unico modo di vedere la differenza.
 */
const EXPOSURE = {
  population: 'EN.POP.EL5M.ZS',
  land: 'AG.LND.EL5M.ZS',
};

const ISO_RE = /^[A-Z]{3}$/;

/** Gli aggregati della Banca Mondiale hanno `region.id === 'NA'`. */
const AGGREGATE_REGION = 'NA';

/** Quanti paesi mostrare nella classifica dell'esposizione. */
const TOP_EXPOSED = 12;

// ---------------------------------------------------------------------------

async function fetchText(url) {
  console.log(`· downloading ${url.slice(0, 96)}…`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status} for ${url}`);
  return res.text();
}

async function cached(file, fetcher) {
  const path = join(CACHE, file);
  if (existsSync(path)) {
    console.log(`· using cached ${file}`);
    return readFileSync(path, 'utf8');
  }
  mkdirSync(CACHE, { recursive: true });
  const body = await fetcher();
  writeFileSync(path, body);
  return body;
}

/** Riga CSV con campi fra virgolette. */
function splitCsv(line) {
  const out = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      out.push(field);
      field = '';
    } else field += c;
  }
  out.push(field);
  return out;
}

/** `Number('')` è `0`: una cella vuota è assenza di dato e resta `null`. */
function num(field) {
  if (field === undefined || field === null || String(field).trim() === '') return null;
  const v = Number(field);
  return Number.isFinite(v) ? v : null;
}

const round = (v, d) => {
  const f = 10 ** d;
  return Math.round(v * f) / f;
};

// ---------------------------------------------------------------------------
// Il mare
// ---------------------------------------------------------------------------

/**
 * La serie è trimestrale, e un grafico da 560 punti su una colonna di pannello
 * non mostra niente che 140 punti non mostrino già. Si media per anno — non si
 * prende un trimestre a caso: il livello del mare ha un ciclo stagionale, e
 * pescare sempre lo stesso trimestre lo lascerebbe dentro come se fosse
 * tendenza.
 *
 * La colonna usata è la media delle due serie, che è quella che OWID stessa
 * mostra: sono due ricostruzioni dello stesso fenomeno con periodi di
 * copertura diversi, e alternarle senza dirlo produrrebbe uno scalino.
 */
function readSeaLevel(text) {
  const lines = text.trim().split(/\r?\n/);
  const head = splitCsv(lines[0]);
  const iQuarter = head.indexOf('quarter');
  const iValue = head.indexOf('sea_level_average');
  if (iQuarter < 0 || iValue < 0) throw new Error('colonne attese non trovate nel CSV del mare');

  const byYear = new Map();
  for (const line of lines.slice(1)) {
    const cells = splitCsv(line);
    const year = num(String(cells[iQuarter] ?? '').slice(0, 4));
    const value = num(cells[iValue]);
    if (year === null || value === null) continue;
    const bucket = byYear.get(year) ?? [];
    bucket.push(value);
    byYear.set(year, bucket);
  }

  const series = [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    // Un anno rappresentato da un trimestre solo non è una media annuale: sui
    // due estremi della serie capita, e lascerebbe dentro la stagionalità.
    .filter(([, values]) => values.length >= 3)
    .map(([year, values]) => [year, round(values.reduce((s, v) => s + v, 0) / values.length, 1)]);

  if (series.length < 100) throw new Error(`serie del mare troppo corta: ${series.length} anni`);
  return series;
}

// ---------------------------------------------------------------------------
// L'esposizione
// ---------------------------------------------------------------------------

async function realCountryCodes() {
  const body = await cached('wb-countries.json', () =>
    fetchText('https://api.worldbank.org/v2/country?format=json&per_page=400'),
  );
  const rows = JSON.parse(body)?.[1] ?? [];
  const codes = new Map();
  for (const row of rows) {
    if (row.region?.id === AGGREGATE_REGION) continue;
    if (ISO_RE.test(row.id ?? '')) codes.set(row.id, row.name);
  }
  if (codes.size < 150) throw new Error(`elenco paesi sospetto: ${codes.size} voci`);
  console.log(`· ${codes.size} paesi veri (aggregati esclusi)`);
  return codes;
}

/**
 * `mrnev=1` chiede il valore più recente non vuoto per ogni paese. Gli anni
 * possono quindi differire da un paese all'altro: si tiene traccia di quali
 * sono, e il pannello dichiara l'intervallo invece di far finta che sia uno.
 */
async function readIndicator(indicator, realCodes) {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&per_page=400&mrnev=1`;
  const body = await cached(`wb-${indicator}.json`, () => fetchText(url));
  const rows = JSON.parse(body)?.[1] ?? [];
  if (!rows.length) throw new Error(`World Bank: nessuna riga per ${indicator}`);

  const values = new Map();
  const years = new Set();
  for (const row of rows) {
    const iso = row.countryiso3code;
    if (!realCodes.has(iso ?? '')) continue;
    const value = num(row.value);
    const year = num(row.date);
    if (value === null || year === null) continue;
    values.set(iso, round(value, 1));
    years.add(year);
  }
  console.log(`  ${indicator.padEnd(16)} ${values.size} paesi · anni ${[...years].sort().join(', ')}`);
  return { values, years: [...years].sort((a, b) => a - b) };
}

// ---------------------------------------------------------------------------

async function build() {
  const seaCsv = await cached(`owid-${SEA_SLUG}.csv`, () =>
    fetchText(
      `https://ourworldindata.org/grapher/${SEA_SLUG}.csv?csvType=full&useColumnShortNames=true`,
    ),
  );
  const series = readSeaLevel(seaCsv);
  console.log(`· livello del mare: ${series.length} anni, ${series[0][0]}–${series[series.length - 1][0]}`);

  const realCodes = await realCountryCodes();
  const population = await readIndicator(EXPOSURE.population, realCodes);
  const land = await readIndicator(EXPOSURE.land, realCodes);

  /**
   * La classifica è ordinata sulla **popolazione** e non sulla superficie: la
   * domanda del pannello è quante persone vivono là sotto, non quanti
   * chilometri quadrati. La superficie viaggia accanto perché è il confronto
   * che rende leggibile la prima.
   */
  const exposed = [...population.values.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_EXPOSED)
    .map(([iso, share]) => ({
      iso,
      name: realCodes.get(iso),
      population: share,
      land: land.values.get(iso) ?? null,
    }));

  const out = {
    meta: {
      seaSource: 'NOAA Climate.gov · via Our World in Data',
      seaSourceUrl: 'https://ourworldindata.org/grapher/sea-level',
      /** Il livello è espresso come scarto da questa media, non da zero. */
      seaBaseline: '1993–2008',
      seaFrom: series[0][0],
      seaTo: series[series.length - 1][0],
      exposureSource: 'World Bank · CIESIN',
      exposureSourceUrl: 'https://data.worldbank.org/indicator/EN.POP.EL5M.ZS',
      exposureYears: [...new Set([...population.years, ...land.years])].sort((a, b) => a - b),
      exposureCoverage: population.values.size,
      generatedAt: new Date().toISOString().slice(0, 10),
    },
    /** [anno, millimetri rispetto alla media 1993–2008]. */
    sea: series,
    exposed,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const json = JSON.stringify(out);
  writeFileSync(join(OUT_DIR, 'consequences.json'), json);
  console.log(`\n✓ consequences.json (${(json.length / 1024).toFixed(1)} KB)`);
  console.log(`  mare ${series.length} anni · esposizione ${exposed.length} paesi in classifica`);
  console.log(`  più esposto: ${exposed[0].name} — ${exposed[0].population}% della popolazione`);
}

await build();
