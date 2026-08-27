/**
 * Composizione settoriale dell'import/export di ogni paese: non emissioni,
 * valore commerciale doganale — cosa c'è dentro il numero "net" della mappa
 * (consumo meno produzione di CO₂, in src/lib/countryEmissions.ts), risposta
 * alla domanda "import di abbigliamento, di energia, di cosa".
 *
 * Fonte: l'API "preview" di UN Comtrade — pubblica, senza chiave, un capitolo
 * doganale (HS a 2 cifre) alla volta, aggregato per paese e anno.
 *   https://comtradeapi.un.org/public/v1/preview/C/A/HS
 *
 * Non è rapida: la preview accetta circa una richiesta ogni 8 secondi prima
 * di rispondere 429, e servono un centinaio di paesi. Una corsa intera dura
 * 30-35 minuti — per questo gira a mano (`npm run data:trade`), fuori dalla
 * catena di `npm run data`, e ogni paese arriva a una sua cache in .cache/:
 * un'interruzione a metà non ricomincia da zero.
 *
 *   node scripts/build-trade-sectors.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, '.cache');
const OUT_DIR = join(ROOT, 'public', 'data');

const REPORTERS_URL = 'https://comtradeapi.un.org/files/v1/app/reference/Reporters.json';
const PREVIEW_URL = 'https://comtradeapi.un.org/public/v1/preview/C/A/HS';

const ISO_RE = /^[A-Z]{3}$/;

/** Tra una richiesta e la successiva, qualunque sia l'esito. */
const REQUEST_SPACING_MS = 9000;
/** Anni da provare, dal più recente: molti paesi pubblicano con un anno o due di ritardo. */
const YEARS_BACK = 6;

// ---------------------------------------------------------------------------
// HS2 → settore. Duplicata in src/lib/tradeSectorTaxonomy.ts: quel modulo è
// TypeScript e questo script è un .mjs a sé (come tutti gli altri build-*, non
// importa nulla da src/) — le due liste di id devono restare identiche a mano.
// ---------------------------------------------------------------------------

const SECTOR_RANGES = {
  'food-beverages': [[1, 24]],
  'minerals-materials': [
    [25, 26],
    [68, 70],
  ],
  'mineral-fuels': [[27, 27]],
  'chemicals-pharma': [[28, 38]],
  'plastics-rubber': [[39, 40]],
  'clothing-fashion': [
    [41, 43],
    [50, 67],
  ],
  'wood-paper': [[44, 49]],
  'jewelry-gems': [[71, 71]],
  metals: [[72, 83]],
  'industrial-machinery': [[84, 84]],
  electronics: [[85, 85]],
  'vehicles-transport': [[86, 89]],
  'precision-instruments': [[90, 92]],
  arms: [[93, 93]],
  'other-manufactured': [[94, 99]],
};

/** Ordine di visualizzazione — deve combaciare con TRADE_SECTOR_IDS lato client. */
const TRADE_SECTOR_IDS = [
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

const FALLBACK_SECTOR = 'other-manufactured';

/** capitolo HS a 2 cifre ("01".."99") → id di settore. */
const HS2_TO_SECTOR = new Map();
for (const [sector, ranges] of Object.entries(SECTOR_RANGES)) {
  for (const [from, to] of ranges) {
    for (let ch = from; ch <= to; ch++) {
      HS2_TO_SECTOR.set(String(ch).padStart(2, '0'), sector);
    }
  }
}

const warnedUnmapped = new Set();
function sectorFor(cmdCode) {
  const sector = HS2_TO_SECTOR.get(cmdCode);
  if (sector) return sector;
  if (!warnedUnmapped.has(cmdCode)) {
    warnedUnmapped.add(cmdCode);
    console.warn(`  ! capitolo HS "${cmdCode}" senza settore mappato, in "${FALLBACK_SECTOR}"`);
  }
  return FALLBACK_SECTOR;
}

// ---------------------------------------------------------------------------
// Rete: una richiesta alla volta, con lo spazio e i tentativi che la preview
// di Comtrade richiede.
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function politeFetch(url, { retries = 5 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.status !== 429) return res;
    if (attempt >= retries) return res;
    const backoff = Math.min(REQUEST_SPACING_MS * 2 ** attempt, 60000);
    console.log(`  · 429, riprovo tra ${Math.round(backoff / 1000)}s`);
    await sleep(backoff);
  }
}

async function cachedFile(file, fetcher) {
  const path = join(CACHE, file);
  if (existsSync(path)) return JSON.parse(readFileSync(path, 'utf8'));
  mkdirSync(CACHE, { recursive: true });
  const data = await fetcher();
  writeFileSync(path, JSON.stringify(data));
  return data;
}

// ---------------------------------------------------------------------------

async function realReporters() {
  return cachedFile('comtrade-reporters.json', async () => {
    console.log(`· downloading ${REPORTERS_URL}`);
    const res = await fetch(REPORTERS_URL);
    if (!res.ok) throw new Error(`download failed: HTTP ${res.status} for ${REPORTERS_URL}`);
    const body = await res.json();
    return (body.results ?? [])
      .filter((r) => r.isGroup === false && ISO_RE.test(r.reporterCodeIsoAlpha3 ?? ''))
      .map((r) => ({ iso3: r.reporterCodeIsoAlpha3, code: r.reporterCode }));
  });
}

/**
 * Un capitolo HS può comparire più volte nella stessa risposta (rettifiche,
 * revisioni): si somma, non si sostituisce, altrimenti un totale silenzioso
 * si perde per strada.
 */
function aggregate(rows) {
  const imports = {};
  const exports = {};
  for (const row of rows) {
    const bucket = row.flowCode === 'M' ? imports : row.flowCode === 'X' ? exports : null;
    if (!bucket) continue;
    const sector = sectorFor(row.cmdCode);
    bucket[sector] = (bucket[sector] ?? 0) + (row.primaryValue ?? 0);
  }
  return { imports, exports };
}

/** Prova gli ultimi YEARS_BACK anni, dal più recente; si ferma al primo che risponde con righe. */
async function fetchReporter(iso3, code) {
  const thisYear = new Date().getUTCFullYear();
  for (let y = thisYear - 1; y >= thisYear - YEARS_BACK; y--) {
    const url =
      `${PREVIEW_URL}?reporterCode=${code}&flowCode=M,X&partnerCode=0&period=${y}` +
      `&cmdCode=AG2&breakdownMode=classic&includeDesc=false`;
    await sleep(REQUEST_SPACING_MS);
    const res = await politeFetch(url);
    if (!res.ok) {
      console.log(`  ${iso3} ${y}: HTTP ${res.status}`);
      continue;
    }
    const body = await res.json();
    const rows = body.data ?? [];
    if (!rows.length) continue;
    const { imports, exports } = aggregate(rows);
    console.log(`  ${iso3} ${y}: ok (${rows.length} righe)`);
    return { iso3, year: y, imports, exports };
  }
  console.log(`  ${iso3}: nessun anno disponibile negli ultimi ${YEARS_BACK}`);
  return { iso3, year: null, imports: {}, exports: {} };
}

async function reporterEntry(iso3, code) {
  const file = `comtrade-${iso3}.json`;
  const path = join(CACHE, file);
  if (existsSync(path)) return JSON.parse(readFileSync(path, 'utf8'));
  const entry = await fetchReporter(iso3, code);
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(path, JSON.stringify(entry));
  return entry;
}

// ---------------------------------------------------------------------------

const round = (v, decimals) => {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
};

/** Somme grezze di valore → quote %, per verso di scambio: import e export sommano a ~100 ciascuno. */
function toShares(sums) {
  const total = Object.values(sums).reduce((a, b) => a + b, 0);
  if (total <= 0) return {};
  const shares = {};
  for (const [sector, value] of Object.entries(sums)) {
    if (value <= 0) continue;
    shares[sector] = round((value / total) * 100, 1);
  }
  return shares;
}

async function build() {
  const reporters = await realReporters();
  console.log(`· ${reporters.length} paesi da interrogare (già in cache saltano la rete)`);

  const countries = {};
  let doneImports = 0;
  let doneExports = 0;

  for (const { iso3, code } of reporters) {
    const entry = await reporterEntry(iso3, code);
    if (entry.year === null) continue;
    const imports = toShares(entry.imports);
    const exports = toShares(entry.exports);
    if (!Object.keys(imports).length && !Object.keys(exports).length) continue;
    countries[iso3] = { year: entry.year, imports, exports };
    if (Object.keys(imports).length) doneImports++;
    if (Object.keys(exports).length) doneExports++;
  }

  const out = {
    meta: {
      source: 'UN Comtrade (preview API, capitoli HS a 2 cifre)',
      sourceUrl: 'https://comtradeapi.un.org/public/v1/preview',
      generatedAt: new Date().toISOString().slice(0, 10),
      sectors: TRADE_SECTOR_IDS,
      coverage: { imports: doneImports, exports: doneExports },
      countries: Object.keys(countries).length,
    },
    countries,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const json = JSON.stringify(out);
  writeFileSync(join(OUT_DIR, 'trade-sectors.json'), json);

  console.log(
    `\n✓ ${out.meta.countries} paesi → trade-sectors.json (${(json.length / 1024).toFixed(0)} KB)`,
  );
  console.log(`  import: ${doneImports} paesi · export: ${doneExports} paesi`);
}

await build();
