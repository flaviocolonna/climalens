/**
 * Quello che sta già funzionando.
 *
 * Il resto dell'app è un atto d'accusa lungo sei schermate, e chi legge solo
 * quello non diventa più coscienzioso: diventa assente. Questo file porta i
 * numeri dell'altra metà — non consolazione, ma la prova che la variabile non
 * è la fisica, è la decisione.
 *
 * Tutto da Our World in Data, serie mondiali soltanto: qui non serve la mappa,
 * servono quattro curve.
 *
 *   node scripts/build-progress-data.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, '.cache');
const OUT_DIR = join(ROOT, 'public', 'data');

/** Le serie del mondo intero: OWID le marca così. */
const WORLD = 'OWID_WRL';

const SERIES = {
  /** Prezzo dei moduli fotovoltaici, dollari per watt. La curva di apprendimento. */
  solarPrice: { slug: 'solar-pv-prices', column: 'cost', decimals: 3 },
  /** Capacità solare installata nel mondo, GW. */
  solarCapacity: { slug: 'installed-solar-pv-capacity', column: 'solar__total_gw', decimals: 1 },
  /** Quota di elettricità da rinnovabili, %. */
  renewableShare: {
    slug: 'share-electricity-renewables',
    column: 'renewable_share_of_electricity__pct',
    decimals: 1,
  },
};

/** Costo per tecnologia, dollari per kWh: le colonne che interessano. */
const LCOE = {
  slug: 'levelized-cost-of-energy',
  columns: ['solar_photovoltaic', 'onshore_wind', 'offshore_wind', 'hydropower', 'geothermal'],
  decimals: 4,
};

/**
 * La quota rinnovabile parte dal 1900 con numeri altissimi — allora
 * l'elettricità era quasi tutta idroelettrica, e non è la stessa storia che
 * racconta la curva moderna. La serie comincia da qui.
 */
const FROM_YEAR = 1965;

async function cached(file, url) {
  const path = join(CACHE, file);
  if (existsSync(path)) {
    console.log(`· using cached ${file}`);
    return readFileSync(path, 'utf8');
  }
  mkdirSync(CACHE, { recursive: true });
  console.log(`· downloading ${url.slice(0, 80)}…`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status} for ${url}`);
  const body = await res.text();
  writeFileSync(path, body);
  return body;
}

const owidUrl = (slug) =>
  `https://ourworldindata.org/grapher/${slug}.csv?csvType=full&useColumnShortNames=true`;

/** Vuoto significa "non misurato": `Number('')` è 0, e sarebbe uno zero finto. */
function num(field) {
  if (field === undefined || String(field).trim() === '') return null;
  const v = Number(field);
  return Number.isFinite(v) ? v : null;
}

const round = (v, d) => {
  const f = 10 ** d;
  return Math.round(v * f) / f;
};

/** Righe del mondo, come coppie [anno, valore], in ordine. */
function worldSeries(body, column, decimals) {
  const lines = body.trim().split('\n');
  const head = lines[0].split(',');
  const iCode = head.indexOf('code');
  const iYear = head.indexOf('year');
  const iValue = head.indexOf(column);
  if (iValue < 0) throw new Error(`colonna "${column}" assente — lo schema OWID è cambiato?`);

  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(',');
    if (c[iCode] !== WORLD) continue;
    const year = num(c[iYear]);
    const value = num(c[iValue]);
    if (year === null || value === null || year < FROM_YEAR) continue;
    out.push([year, round(value, decimals)]);
  }
  out.sort((a, b) => a[0] - b[0]);
  if (!out.length) throw new Error(`nessuna riga mondiale per "${column}"`);
  return out;
}

async function build() {
  const out = { meta: {}, series: {}, lcoe: {} };

  for (const [key, spec] of Object.entries(SERIES)) {
    const body = await cached(`owid-${spec.slug}.csv`, owidUrl(spec.slug));
    const series = worldSeries(body, spec.column, spec.decimals);
    out.series[key] = series;
    console.log(
      `  ${key.padEnd(15)} ${series.length} punti · ${series[0][0]}: ${series[0][1]} → ${series[series.length - 1][0]}: ${series[series.length - 1][1]}`,
    );
  }

  // Il costo per tecnologia serve solo agli estremi: quanto costava quando la
  // curva è cominciata e quanto costa adesso. La serie intera sarebbe un
  // grafico in più che dice la stessa cosa.
  const lcoeBody = await cached(`owid-${LCOE.slug}.csv`, owidUrl(LCOE.slug));
  for (const column of LCOE.columns) {
    const series = worldSeries(lcoeBody, column, LCOE.decimals);
    out.lcoe[column] = { first: series[0], last: series[series.length - 1] };
    console.log(`  ${column.padEnd(20)} ${series[0][0]}: ${series[0][1]} → ${series[series.length - 1][0]}: ${series[series.length - 1][1]} $/kWh`);
  }

  const solar = out.series.solarPrice;
  out.meta = {
    source: 'Our World in Data (IRENA, Ember, Nemet & Farmer-Lafond)',
    sourceUrl: 'https://ourworldindata.org/energy',
    generatedAt: new Date().toISOString().slice(0, 10),
    /** Il crollo del fotovoltaico, calcolato qui e non a mano nell'interfaccia. */
    solarPriceDropPct: round((1 - solar[solar.length - 1][1] / solar[0][1]) * 100, 1),
    solarPriceFrom: solar[0],
    solarPriceTo: solar[solar.length - 1],
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const json = JSON.stringify(out);
  writeFileSync(join(OUT_DIR, 'progress.json'), json);
  console.log(`\n✓ progress.json (${(json.length / 1024).toFixed(1)} KB)`);
  console.log(`  fotovoltaico: −${out.meta.solarPriceDropPct}% dal ${solar[0][0]}`);
}

await build();
