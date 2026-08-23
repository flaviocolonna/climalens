/**
 * Quanto pesa quello che c'è nel piatto.
 *
 * L'app dice già «alimentazione: 26% delle emissioni» nella lente dei consumi
 * e «dieta vegetale: 0,8 t/anno» in quella delle azioni, e poi non apre mai la
 * scatola. Qui dentro c'è la scatola aperta: manzo contro piselli, due ordini
 * di grandezza dentro la stessa spesa.
 *
 * E soprattutto la **scomposizione per fase**, che serve a smontare il
 * «mangia locale»: per quasi tutti gli alimenti il trasporto è una fetta
 * minima, mentre uso del suolo e allevamento sono quasi tutto. Cambiare *cosa*
 * si mangia pesa molto più di cambiare *da dove viene*.
 *
 * Fonte: Poore & Nemecek (Science 2018) via Our World in Data.
 *
 *   node scripts/build-food-data.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, '.cache');
const OUT_DIR = join(ROOT, 'public', 'data');

const TOTAL_SLUG = 'ghg-per-kg-poore';
const CHAIN_SLUG = 'food-emissions-supply-chain';
const LAND_SLUG = 'land-use-per-kg-poore';

/**
 * Le fasi, nell'ordine in cui si impilano dal campo alla tavola. `transport`
 * sta in mezzo di proposito: nel grafico si vede quanto è sottile.
 */
const STAGES = [
  'food_emissions_land_use',
  'food_emissions_farm',
  'food_emissions_animal_feed',
  'food_emissions_processing',
  'food_emissions_transport',
  'food_emissions_retail',
  'food_emissions_packaging',
];

/**
 * Quali alimenti mostrare, e in che ordine. L'elenco completo di OWID ne ha
 * una cinquantina, molti dei quali varianti dello stesso prodotto: questi
 * coprono l'intervallo — dal più pesante al più leggero — restando una lista
 * che si legge in una schermata.
 */
const KEEP = [
  'Beef (beef herd)',
  'Lamb & Mutton',
  'Beef (dairy herd)',
  'Cheese',
  'Prawns (farmed)',
  'Pig Meat',
  'Poultry Meat',
  'Eggs',
  'Rice',
  'Milk',
  'Tofu',
  'Peas',
  'Bananas',
  'Nuts',
];

async function cached(file, url) {
  const path = join(CACHE, file);
  if (existsSync(path)) {
    console.log(`· using cached ${file}`);
    return readFileSync(path, 'utf8');
  }
  mkdirSync(CACHE, { recursive: true });
  console.log(`· downloading ${url.slice(0, 78)}…`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
  const body = await res.text();
  writeFileSync(path, body);
  return body;
}

const owidUrl = (slug) =>
  `https://ourworldindata.org/grapher/${slug}.csv?csvType=full&useColumnShortNames=true`;

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

function num(field) {
  if (field === undefined || String(field).trim() === '') return null;
  const v = Number(field);
  return Number.isFinite(v) ? v : null;
}

const round = (v, d) => {
  const f = 10 ** d;
  return Math.round(v * f) / f;
};

/** entity → riga, per un CSV OWID in cui l'entità è l'alimento. */
function byEntity(body) {
  const lines = body.trim().split(/\r?\n/);
  const head = splitCsv(lines[0]);
  const rows = new Map();
  for (let i = 1; i < lines.length; i++) {
    const c = splitCsv(lines[i]);
    if (c[0]) rows.set(c[0], c);
  }
  return { head, rows };
}

async function build() {
  const total = byEntity(await cached(`owid-${TOTAL_SLUG}.csv`, owidUrl(TOTAL_SLUG)));
  const chain = byEntity(await cached(`owid-${CHAIN_SLUG}.csv`, owidUrl(CHAIN_SLUG)));
  const land = byEntity(await cached(`owid-${LAND_SLUG}.csv`, owidUrl(LAND_SLUG)));

  const totalCol = total.head.length - 1;
  const landCol = land.head.length - 1;
  const stageCols = STAGES.map((s) => {
    const i = chain.head.indexOf(s);
    if (i < 0) throw new Error(`colonna "${s}" assente — schema OWID cambiato?`);
    return i;
  });

  const foods = [];
  const missing = [];
  for (const name of KEEP) {
    const totalRow = total.rows.get(name);
    const chainRow = chain.rows.get(name);
    if (!totalRow || !chainRow) {
      missing.push(name);
      continue;
    }
    const kg = num(totalRow[totalCol]);
    if (kg === null) {
      missing.push(name);
      continue;
    }
    const stages = STAGES.map((_, i) => round(num(chainRow[stageCols[i]]) ?? 0, 2));
    const landRow = land.rows.get(name);
    foods.push({
      name,
      kg: round(kg, 1),
      stages,
      land: landRow ? round(num(landRow[landCol]) ?? 0, 1) : null,
    });
  }

  foods.sort((a, b) => b.kg - a.kg);

  // Il trasporto è la fetta che tutti sopravvalutano: il numero che smonta il
  // «mangia locale» viene calcolato qui, non lasciato dedurre a chi guarda.
  const transportIndex = STAGES.indexOf('food_emissions_transport');
  const transportShares = foods
    .map((f) => (f.kg > 0 ? (f.stages[transportIndex] / f.kg) * 100 : 0))
    .filter((v) => Number.isFinite(v));
  const medianTransport = round(
    [...transportShares].sort((a, b) => a - b)[Math.floor(transportShares.length / 2)],
    1,
  );

  const out = {
    meta: {
      source: 'Poore & Nemecek, Science 2018 · via Our World in Data',
      sourceUrl: 'https://ourworldindata.org/food-choice-vs-eating-local',
      generatedAt: new Date().toISOString().slice(0, 10),
      stages: STAGES.map((s) => s.replace('food_emissions_', '')),
      medianTransportShare: medianTransport,
      unit: 'kg CO₂e per kg di prodotto',
    },
    foods,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const json = JSON.stringify(out);
  writeFileSync(join(OUT_DIR, 'food.json'), json);

  console.log(`\n✓ ${foods.length} alimenti → food.json (${(json.length / 1024).toFixed(1)} KB)`);
  console.log(`  ${foods[0].name}: ${foods[0].kg} vs ${foods[foods.length - 1].name}: ${foods[foods.length - 1].kg} kg CO₂e/kg`);
  console.log(`  trasporto: mediana ${medianTransport}% del totale`);
  if (missing.length) console.log(`  non trovati: ${missing.join(', ')}`);
}

await build();
