/**
 * L'inquinamento che non è CO₂, per paese.
 *
 * La CO₂ scalda ma non si respira. Questo file porta le altre cinque domande:
 * che aria c'è, quante persone uccide, quanta plastica finisce fuori da
 * qualunque impianto, quanta acqua si preleva rispetto a quella che c'è, e
 * quanto azoto va sui campi per poi finire nei fiumi.
 *
 * Fonti (tutte aperte, nessuna chiave):
 *   - Banca Mondiale (World Development Indicators) — PM2.5, mortalità, stress
 *     idrico. Ridistribuisce i dati OMS e FAO in un'unica API JSON per ISO3.
 *   - Our World in Data — plastica mal gestita (Meijer et al. 2021) e azoto
 *     (FAO), che nella Banca Mondiale non ci sono.
 *
 * Esce una tabella per codice ISO3 **senza geometrie**: le forme le ha già
 * co2-countries.json, e ripeterle costerebbe 200 KB per ridire le stesse
 * frontiere. Il client unisce i due file quando servono entrambi.
 *
 *   node scripts/build-pollution-data.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, '.cache');
const OUT_DIR = join(ROOT, 'public', 'data');

const ISO_RE = /^[A-Z]{3}$/;

/**
 * Gli aggregati della Banca Mondiale hanno un ISO3 dall'aria legittima — WLD
 * per il mondo, EUU per l'Unione Europea, ARB per i paesi arabi — e passano
 * qualunque controllo sul formato del codice.
 *
 * L'endpoint degli indicatori non dice quali sono: il campo `region` c'è nello
 * schema ma torna `null` per tutti, aggregati e paesi. La distinzione vive
 * sull'endpoint `/country`, dove un aggregato ha `region.id === 'NA'`. Si
 * scarica una volta e si tiene in cache.
 */
const AGGREGATE_REGION = 'NA';

async function realCountryCodes() {
  const body = await cached('wb-countries.json', () =>
    fetchText('https://api.worldbank.org/v2/country?format=json&per_page=400'),
  );
  const rows = JSON.parse(body)?.[1] ?? [];
  const codes = new Set();
  for (const row of rows) {
    if (row.region?.id === AGGREGATE_REGION) continue;
    if (ISO_RE.test(row.id ?? '')) codes.add(row.id);
  }
  if (codes.size < 150) throw new Error(`elenco paesi sospetto: ${codes.size} voci`);
  console.log(`· ${codes.size} paesi veri (aggregati esclusi)`);
  return codes;
}

/**
 * Da che anno in poi guardare. Ogni indicatore pubblica su cadenze diverse —
 * l'OMS ogni tanto, la FAO ogni anno — quindi non si può fissare un anno solo
 * per tutti: si prende, indicatore per indicatore, l'anno con più copertura.
 */
const FROM_YEAR = 2010;

/**
 * Un anno di riferimento per metrica, e chi non ce l'ha resta grigio.
 *
 * La tentazione è tenere il valore più recente di ciascun paese, ma così la
 * mappa mette il 2015 di uno accanto al 2023 di un altro e i colori smettono
 * di essere confrontabili — che è l'unica cosa per cui esiste una coropletica.
 * Si sceglie l'anno che copre più paesi, non il più recente: l'ultimo anno
 * pubblicato è quasi sempre mezzo vuoto.
 */
const WORLD_BANK = {
  pm25: {
    indicator: 'EN.ATM.PM25.MC.M3',
    label: 'PM2.5, esposizione media della popolazione (µg/m³)',
    decimals: 1,
  },
  airDeaths: {
    indicator: 'SH.STA.AIRP.P5',
    label: 'Morti attribuibili all’inquinamento dell’aria (per 100.000)',
    decimals: 1,
  },
  waterStress: {
    indicator: 'ER.H2O.FWST.ZS',
    label: 'Prelievi d’acqua dolce sulle risorse rinnovabili (%)',
    decimals: 1,
  },
};

const OWID = {
  plastic: {
    slug: 'mismanaged-plastic-waste-per-capita',
    label: 'Plastica mal gestita pro capite (kg/anno)',
    decimals: 2,
  },
  nitrogen: {
    slug: 'nitrogen-fertilizer-application-per-hectare-of-cropland',
    label: 'Azoto da fertilizzanti per ettaro coltivato (kg/ha)',
    decimals: 1,
  },
};

// ---------------------------------------------------------------------------

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

async function fetchText(url) {
  console.log(`· downloading ${url.slice(0, 96)}…`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status} for ${url}`);
  return res.text();
}

/** Splits one CSV line, honouring double-quoted fields. */
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

/** Vuoto significa "non misurato": `Number('')` è 0, e sarebbe uno zero finto. */
function num(field) {
  if (field === undefined || field === null || String(field).trim() === '') return null;
  const v = Number(field);
  return Number.isFinite(v) ? v : null;
}

/**
 * Da `{ iso: { year: value } }` all'anno con più paesi, e ai soli valori di
 * quell'anno. A parità di copertura vince il più recente.
 */
function pickBestYear(byIso) {
  const perYear = new Map();
  for (const years of byIso.values()) {
    for (const year of Object.keys(years)) {
      perYear.set(Number(year), (perYear.get(Number(year)) ?? 0) + 1);
    }
  }
  if (!perYear.size) return { year: null, values: new Map() };

  let best = null;
  for (const [year, count] of perYear) {
    if (!best || count > best.count || (count === best.count && year > best.year)) {
      best = { year, count };
    }
  }

  const values = new Map();
  for (const [iso, years] of byIso) {
    const v = years[best.year];
    if (v !== undefined) values.set(iso, v);
  }
  return { year: best.year, values };
}

// ---------------------------------------------------------------------------

async function readWorldBank(key, { indicator }, realCodes) {
  const url =
    `https://api.worldbank.org/v2/country/all/indicator/${indicator}` +
    `?format=json&per_page=20000&date=${FROM_YEAR}:${new Date().getUTCFullYear()}`;
  const body = await cached(`wb-${indicator}.json`, () => fetchText(url));
  const parsed = JSON.parse(body);
  const rows = Array.isArray(parsed?.[1]) ? parsed[1] : [];
  if (!rows.length) throw new Error(`World Bank: nessuna riga per ${indicator}`);

  const byIso = new Map();
  for (const row of rows) {
    const iso = row.countryiso3code;
    if (!realCodes.has(iso ?? '')) continue;
    const value = num(row.value);
    const year = num(row.date);
    if (value === null || year === null) continue;
    const years = byIso.get(iso) ?? {};
    years[year] = value;
    byIso.set(iso, years);
  }
  console.log(`  ${key}: ${byIso.size} paesi nella finestra`);
  return pickBestYear(byIso);
}

async function readOwid(key, { slug }, realCodes) {
  const url = `https://ourworldindata.org/grapher/${slug}.csv?csvType=full&useColumnShortNames=true`;
  const body = await cached(`owid-${slug}.csv`, async () => {
    // Il grapher risponde 301 verso il CDN: `redirect: follow` è il default,
    // ma vale la pena dirlo, perché senza si scarica un corpo vuoto.
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`download failed: HTTP ${res.status} for ${url}`);
    return res.text();
  });

  const lines = body.split('\n');
  const head = splitCsv(lines[0]);
  // entity,code,year,<colonna del dato> — il nome dell'ultima cambia per slug.
  const valueCol = head.length - 1;
  const codeCol = head.indexOf('code');
  const yearCol = head.indexOf('year');
  if (codeCol < 0 || yearCol < 0) throw new Error(`OWID: intestazione inattesa per ${slug}`);

  const byIso = new Map();
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const c = splitCsv(lines[i]);
    const iso = c[codeCol];
    if (!realCodes.has(iso ?? '')) continue;
    const value = num(c[valueCol]);
    const year = num(c[yearCol]);
    if (value === null || year === null || year < FROM_YEAR) continue;
    const years = byIso.get(iso) ?? {};
    years[year] = value;
    byIso.set(iso, years);
  }
  console.log(`  ${key}: ${byIso.size} paesi nella finestra`);
  return pickBestYear(byIso);
}

// ---------------------------------------------------------------------------

const round = (value, decimals) => {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
};

async function build() {
  const realCodes = await realCountryCodes();
  const groups = {};
  for (const [key, spec] of Object.entries(WORLD_BANK)) {
    groups[key] = { ...(await readWorldBank(key, spec, realCodes)), decimals: spec.decimals };
  }
  for (const [key, spec] of Object.entries(OWID)) {
    groups[key] = { ...(await readOwid(key, spec, realCodes)), decimals: spec.decimals };
  }

  const countries = {};
  for (const [key, group] of Object.entries(groups)) {
    for (const [iso, value] of group.values) {
      (countries[iso] ??= {})[key] = round(value, group.decimals);
    }
  }

  const years = {};
  const coverage = {};
  for (const [key, group] of Object.entries(groups)) {
    years[key] = group.year;
    coverage[key] = group.values.size;
  }

  const out = {
    meta: {
      sources: {
        worldBank: 'Banca Mondiale · World Development Indicators (OMS, FAO)',
        worldBankUrl: 'https://data.worldbank.org/',
        owid: 'Our World in Data (Meijer et al. 2021 · FAO)',
        owidUrl: 'https://ourworldindata.org/plastic-pollution',
      },
      labels: Object.fromEntries(
        [...Object.entries(WORLD_BANK), ...Object.entries(OWID)].map(([k, v]) => [k, v.label]),
      ),
      generatedAt: new Date().toISOString().slice(0, 10),
      years,
      coverage,
      countries: Object.keys(countries).length,
    },
    countries,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const json = JSON.stringify(out);
  writeFileSync(join(OUT_DIR, 'pollution-countries.json'), json);

  console.log(`\n✓ ${out.meta.countries} paesi → pollution-countries.json (${(json.length / 1024).toFixed(0)} KB)`);
  for (const key of Object.keys(groups)) {
    console.log(`  ${key.padEnd(12)} ${years[key]}: ${coverage[key]} paesi`);
  }
}

await build();
