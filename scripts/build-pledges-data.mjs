/**
 * Promesse contro traiettoria.
 *
 * La mappa sa già chi causa il riscaldamento, chi lo subisce e chi può
 * permettersi di reggerlo. Manca l'unico asse che si muove nel tempo: **se un
 * paese sta facendo quello che ha detto**. Sono due informazioni diverse e
 * vanno tenute separate — quanto è vincolante l'impegno, e cosa hanno fatto le
 * emissioni negli ultimi dieci anni — più una terza che le mette a confronto.
 *
 * Fonti:
 *   - Net Zero Tracker, via Our World in Data — stato dell'impegno e anno
 *     obiettivo.
 *     https://ourworldindata.org/grapher/net-zero-targets
 *   - Global Carbon Budget via OWID — la CO2 fossile territoriale, lo stesso
 *     file che alimenta il layer delle emissioni: nessun secondo download, e
 *     soprattutto nessun rischio che le due mappe raccontino anni diversi.
 *
 * **Il divario è calcolato qui, non trovato da qualche parte.** È l'unica cifra
 * dell'app che non viene da una fonte ma da un'ipotesi dichiarata: discesa
 * lineare fino a zero dall'anno di riferimento all'anno obiettivo. Il perché di
 * ogni scelta sta nel commento sopra la funzione che lo calcola.
 *
 *   node scripts/build-pledges-data.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, '.cache');
const OUT_DIR = join(ROOT, 'public', 'data');

const TARGETS_URL =
  'https://ourworldindata.org/grapher/net-zero-targets.csv?csvType=full&useColumnShortNames=true';
const OWID_CO2_URL = 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv';

/**
 * La finestra su cui si misura la traiettoria. Dieci anni sono abbastanza
 * lunghi da non far dipendere il verdetto da un singolo anno anomalo: il 2020
 * cadrebbe dentro qualunque finestra più corta e regalerebbe a tutti un calo
 * che nessuno ha deciso.
 */
const TREND_YEARS = 10;

/**
 * Sotto questo orizzonte l'anno obiettivo non entra nel calcolo del divario.
 * La fonte avverte che la serie include obiettivi di net zero **e altri
 * obiettivi di riduzione**: un "2030" in questa tabella è quasi sempre una
 * riduzione parziale, e trattarlo come azzeramento totale produrrebbe divari
 * enormi e falsi. Dieci anni di distanza dall'anno di riferimento è la soglia
 * sotto cui non ci si fida.
 */
const MIN_HORIZON = 10;

const ISO_RE = /^[A-Z]{3}$/;

/**
 * La scala dell'impegno, dal più debole al più forte, come la descrive la
 * fonte. È un ordinale, non una quantità: il numero serve alla mappa, che sa
 * dipingere soglie e non stringhe. Le etichette leggibili stanno in
 * src/lib/pledges.ts, insieme alle traduzioni.
 */
const LADDER = [
  'No target',
  'Proposed / in discussion',
  'Declaration / pledge',
  'In policy document',
  'In law',
  'Achieved (self-declared)',
  'Achieved (externally validated)',
];

// ---------------------------------------------------------------------------

async function ensure(url, file) {
  const path = join(CACHE, file);
  if (existsSync(path)) {
    console.log(`· using cached ${file}`);
    return readFileSync(path, 'utf8');
  }
  mkdirSync(CACHE, { recursive: true });
  console.log(`· downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status} for ${url}`);
  const text = await res.text();
  writeFileSync(path, text);
  return text;
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

/**
 * `Number('')` è `0`, e uno zero inventato qui diventerebbe "questo paese non
 * emette nulla" sulla mappa. Una cella vuota è assenza di dato e resta `null`.
 */
function num(field) {
  if (field === undefined || String(field).trim() === '') return null;
  const v = Number(field);
  return Number.isFinite(v) ? v : null;
}

// ---------------------------------------------------------------------------
// Le promesse
// ---------------------------------------------------------------------------

/**
 * Il valore della fonte impacchetta due informazioni in una stringa sola:
 * `In law (2050)`. La parentesi con l'anno obiettivo va cercata **in coda**,
 * perché uno degli stati ne contiene già una propria: `Achieved
 * (self-declared) (2050)`.
 */
function parseStatus(raw) {
  const value = raw.trim();
  const m = value.match(/\((\d{4})\)$/);
  const status = (m ? value.slice(0, m.index) : value).trim();
  const rank = LADDER.indexOf(status);
  if (rank < 0) throw new Error(`stato non previsto dalla scala: "${status}"`);
  return { rank, target: m ? Number(m[1]) : null };
}

function readTargets(text) {
  const lines = text.trim().split(/\r?\n/);
  const head = splitCsv(lines[0]);
  const iCode = head.indexOf('code');
  const iYear = head.indexOf('year');
  const iStatus = head.indexOf('net_zero_status');
  if (iCode < 0 || iStatus < 0) {
    throw new Error('colonne attese non trovate nel CSV degli obiettivi');
  }

  const targets = new Map();
  let published = null;
  for (const line of lines.slice(1)) {
    const cells = splitCsv(line);
    const iso = cells[iCode];
    if (!ISO_RE.test(iso ?? '')) continue;
    targets.set(iso, parseStatus(cells[iStatus]));
    published = num(cells[iYear]) ?? published;
  }
  return { targets, published };
}

// ---------------------------------------------------------------------------
// La traiettoria
// ---------------------------------------------------------------------------

/**
 * CO2 fossile territoriale per paese e per anno. Fossile e non "uso del suolo
 * incluso" apposta: la componente forestale viene rivista all'indietro di
 * parecchio a ogni edizione, e su una finestra di dieci anni sposterebbe il
 * verdetto di un paese senza che quel paese abbia fatto niente di diverso.
 */
function readEmissions(text) {
  const lines = text.trim().split(/\r?\n/);
  const head = splitCsv(lines[0]);
  const iIso = head.indexOf('iso_code');
  const iYear = head.indexOf('year');
  const iCo2 = head.indexOf('co2');
  if (iIso < 0 || iYear < 0 || iCo2 < 0) {
    throw new Error('colonne attese non trovate nel CSV OWID');
  }

  const series = new Map();
  for (const line of lines.slice(1)) {
    const cells = splitCsv(line);
    const iso = cells[iIso];
    if (!ISO_RE.test(iso ?? '')) continue;
    const year = num(cells[iYear]);
    const co2 = num(cells[iCo2]);
    if (year === null || co2 === null) continue;
    if (!series.has(iso)) series.set(iso, new Map());
    series.get(iso).set(year, co2);
  }
  return series;
}

/**
 * L'anno più recente in cui almeno metà dei paesi ha una cifra. L'ultima riga
 * pubblicata è spesso una stima parziale: prenderla darebbe una mappa a chiazze
 * e una traiettoria misurata su un anno che verrà riscritto.
 */
function pickReferenceYear(series) {
  const counts = new Map();
  for (const years of series.values()) {
    for (const year of years.keys()) counts.set(year, (counts.get(year) ?? 0) + 1);
  }
  const years = [...counts.keys()].sort((a, b) => b - a);
  for (const year of years) {
    if (counts.get(year) >= series.size / 2) return year;
  }
  throw new Error('nessun anno con copertura sufficiente nella serie delle emissioni');
}

// ---------------------------------------------------------------------------
// Il divario
// ---------------------------------------------------------------------------

/**
 * Quanto manca, in punti percentuali all'anno, fra il ritmo che l'obiettivo
 * dichiarato richiede e quello che il paese sta tenendo.
 *
 * Due ritmi, entrambi espressi **come quota delle emissioni di oggi**, che è
 * l'unico modo di renderli confrontabili:
 *
 *   richiesto = 100 / (anno obiettivo - anno di riferimento)
 *   ottenuto  = (CO2 di dieci anni fa - CO2 di oggi) / 10 / CO2 di oggi * 100
 *
 * Il taglio richiesto assume una **discesa lineare fino a zero**: è l'ipotesi
 * più semplice possibile ed è quasi certamente sbagliata nel dettaglio, perché
 * nessun paese scende in linea retta. Serve a rispondere a una domanda sola,
 * "al ritmo di adesso ci arriva?", e per quella un'ipotesi lineare dichiarata
 * vale più di una curva plausibile costruita su parametri invisibili.
 *
 * Positivo = deve accelerare. Negativo o zero = il ritmo attuale basterebbe.
 */
function computeGap({ target, refYear, now, past }) {
  const required = 100 / (target - refYear);
  const achieved = ((past - now) / TREND_YEARS / now) * 100;
  return required - achieved;
}

const round = (v, d) => {
  const f = 10 ** d;
  return Math.round(v * f) / f;
};

// ---------------------------------------------------------------------------

async function build() {
  const [targetsCsv, co2Csv] = await Promise.all([
    ensure(TARGETS_URL, 'owid-net-zero-targets.csv'),
    ensure(OWID_CO2_URL, 'owid-co2-data.csv'),
  ]);

  const { targets, published } = readTargets(targetsCsv);
  console.log(`· ${targets.size} paesi con uno stato dichiarato (edizione ${published})`);

  const series = readEmissions(co2Csv);
  const refYear = pickReferenceYear(series);
  const pastYear = refYear - TREND_YEARS;
  console.log(`· traiettoria misurata da ${pastYear} a ${refYear}`);

  const countries = {};
  const coverage = { pledge: 0, trend: 0, gap: 0 };
  let skippedHorizon = 0;

  for (const [iso, { rank, target }] of targets) {
    const row = { pledge: rank };
    if (target !== null) row.target = target;
    coverage.pledge++;

    const years = series.get(iso);
    const now = years?.get(refYear) ?? null;
    const past = years?.get(pastYear) ?? null;
    // Un paese che dieci anni fa emetteva zero non ha una variazione
    // percentuale: ha una divisione per zero travestita da record.
    if (now !== null && past !== null && past > 0 && now > 0) {
      row.trend = round((now / past - 1) * 100, 1);
      coverage.trend++;

      if (target !== null && rank > 0) {
        if (target - refYear >= MIN_HORIZON) {
          row.gap = round(computeGap({ target, refYear, now, past }), 1);
          coverage.gap++;
        } else {
          skippedHorizon++;
        }
      }
    }
    countries[iso] = row;
  }

  console.log(
    `· ${skippedHorizon} paesi fuori dal divario: obiettivo entro il ${refYear + MIN_HORIZON}, ` +
      'quasi sempre una riduzione parziale e non un azzeramento',
  );

  const out = {
    meta: {
      source: 'Net Zero Tracker · via Our World in Data',
      sourceUrl: 'https://ourworldindata.org/grapher/net-zero-targets',
      trajectorySource: 'Global Carbon Budget · via Our World in Data',
      // Il divario non viene da nessuna delle due: le mette insieme. Citarne
      // una sola scaricherebbe su quella un calcolo che non ha fatto.
      combinedSource: 'Net Zero Tracker + Global Carbon Budget · via Our World in Data',
      trajectorySourceUrl: 'https://github.com/owid/co2-data',
      generatedAt: new Date().toISOString().slice(0, 10),
      ladder: LADDER,
      years: { pledge: published, trend: refYear, gap: refYear },
      trendFrom: pastYear,
      trendYears: TREND_YEARS,
      minHorizon: MIN_HORIZON,
      coverage,
      countries: Object.keys(countries).length,
    },
    countries,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const json = JSON.stringify(out);
  writeFileSync(join(OUT_DIR, 'pledges-countries.json'), json);
  console.log(
    `\n✓ ${out.meta.countries} paesi → pledges-countries.json (${(json.length / 1024).toFixed(1)} KB)`,
  );
  console.log(
    `  impegno ${coverage.pledge} · traiettoria ${coverage.trend} · divario ${coverage.gap}`,
  );
}

await build();
