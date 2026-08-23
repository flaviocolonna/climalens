/**
 * Chi può permettersi di reggerlo.
 *
 * La mappa risponde già a «chi lo subisce» e «chi lo causa». Manca la terza
 * domanda, quella che chiude l'argomento: chi ha i mezzi per adattarsi. E la
 * terza mappa non somiglia a nessuna delle altre due.
 *
 * Fonte: ND-GAIN Country Index (University of Notre Dame), che scompone il
 * problema in due metà — quanto un paese è **vulnerabile** (esposizione,
 * sensibilità, capacità di adattamento) e quanto è **pronto** ad assorbire
 * investimenti in adattamento. L'indice complessivo è la differenza fra le due.
 *
 * L'archivio è uno zip da 4,9 MB con 217 CSV, e si scarica solo presentandosi
 * con un Referer: senza, il server risponde 403. Ne servono tre file, quindi
 * qui sotto c'è un lettore zip minimale (~70 righe, zero dipendenze) nello
 * stesso spirito del lettore NetCDF-3 di build-climate-data.mjs: il formato è
 * abbastanza semplice da non giustificare una libreria.
 *
 *   node scripts/build-adaptation-data.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, '.cache');
const OUT_DIR = join(ROOT, 'public', 'data');

const ARCHIVE_URL = 'https://gain.nd.edu/assets/647440/ndgain_countryindex_2026.zip';
const REFERER = 'https://gain.nd.edu/our-work/country-index/download-data/';

/**
 * I tre CSV che servono, dentro l'archivio, con i decimali che ognuno merita:
 * l'indice complessivo sta su 0-100, le due metà su 0-1. Arrotondare anche
 * queste a un decimale le appiattirebbe su quattro valori distinti in tutto.
 */
const WANTED = {
  gain: { path: 'resources 2/gain/gain.csv', decimals: 1 },
  vulnerability: { path: 'resources 2/vulnerability/vulnerability.csv', decimals: 3 },
  readiness: { path: 'resources 2/readiness/readiness.csv', decimals: 3 },
};

const ISO_RE = /^[A-Z]{3}$/;

// ---------------------------------------------------------------------------
// Lettore zip minimale: solo quello che serve a tirare fuori tre file per nome.
// Spec: PKWARE APPNOTE, sezioni 4.3.6 (local header) e 4.3.12 (central dir).
// ---------------------------------------------------------------------------

const SIG_EOCD = 0x06054b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_LOCAL = 0x04034b50;

function findEndOfCentralDirectory(buf) {
  // Il record finale è in coda, ma può avere fino a 64KB di commento dopo:
  // si scorre all'indietro invece di assumerlo nell'ultima riga di byte.
  const min = Math.max(0, buf.length - 0x10000 - 22);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === SIG_EOCD) return i;
  }
  throw new Error('zip: record di fine archivio non trovato');
}

/** Nome file → { offset, method, compressedSize } dalla directory centrale. */
function readCentralDirectory(buf) {
  const eocd = findEndOfCentralDirectory(buf);
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);

  const entries = new Map();
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== SIG_CENTRAL) throw new Error(`zip: voce ${i} malformata`);
    const method = buf.readUInt16LE(p + 10);
    const compressedSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const offset = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    entries.set(name, { offset, method, compressedSize });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function extract(buf, entry, name) {
  if (buf.readUInt32LE(entry.offset) !== SIG_LOCAL) throw new Error(`zip: header locale rotto (${name})`);
  // I campi variabili dell'header locale possono differire da quelli della
  // directory centrale: vanno riletti qui, o i dati partono spostati.
  const nameLen = buf.readUInt16LE(entry.offset + 26);
  const extraLen = buf.readUInt16LE(entry.offset + 28);
  const start = entry.offset + 30 + nameLen + extraLen;
  const raw = buf.subarray(start, start + entry.compressedSize);
  if (entry.method === 0) return raw;
  if (entry.method === 8) return inflateRawSync(raw);
  throw new Error(`zip: metodo di compressione ${entry.method} non gestito (${name})`);
}

// ---------------------------------------------------------------------------

async function ensureArchive() {
  const path = join(CACHE, 'ndgain.zip');
  if (existsSync(path)) {
    console.log('· using cached ndgain.zip');
    return readFileSync(path);
  }
  mkdirSync(CACHE, { recursive: true });
  console.log(`· downloading ${ARCHIVE_URL}`);
  // Senza Referer il server risponde 403: non è un blocco al riuso, è un
  // controllo contro l'hotlinking, e presentarsi correttamente lo soddisfa.
  const res = await fetch(ARCHIVE_URL, { headers: { Referer: REFERER } });
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(path, buf);
  return buf;
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

function num(field) {
  if (field === undefined || String(field).trim() === '') return null;
  const v = Number(field);
  return Number.isFinite(v) ? v : null;
}

/**
 * Il CSV è largo: una riga per paese, una colonna per anno. Si prende l'anno
 * più recente in cui **almeno metà** dei paesi ha un valore — l'ultima colonna
 * pubblicata è spesso quasi vuota, e prenderla darebbe una mappa a chiazze.
 */
function readWideCsv(text, decimals) {
  const lines = text.trim().split(/\r?\n/);
  const head = splitCsv(lines[0]);
  const years = head
    .map((h, i) => ({ year: Number(h), i }))
    .filter((c) => Number.isFinite(c.year) && c.year > 1900);
  if (!years.length) throw new Error('nessuna colonna-anno riconosciuta');

  const rows = lines.slice(1).map(splitCsv).filter((c) => ISO_RE.test(c[0] ?? ''));
  let chosen = null;
  for (const col of [...years].reverse()) {
    const filled = rows.filter((c) => num(c[col.i]) !== null).length;
    if (filled >= rows.length / 2) {
      chosen = { ...col, filled };
      break;
    }
  }
  if (!chosen) throw new Error('nessun anno con copertura sufficiente');

  const values = new Map();
  for (const c of rows) {
    const v = num(c[chosen.i]);
    if (v !== null) {
      const f = 10 ** decimals;
      values.set(c[0], Math.round(v * f) / f);
    }
  }
  return { year: chosen.year, values };
}

async function build() {
  const zip = await ensureArchive();
  const entries = readCentralDirectory(zip);
  console.log(`· ${entries.size} voci nell'archivio`);

  const groups = {};
  for (const [key, spec] of Object.entries(WANTED)) {
    const entry = entries.get(spec.path);
    if (!entry) throw new Error(`file assente nell'archivio: ${spec.path}`);
    const parsed = readWideCsv(extract(zip, entry, spec.path).toString('utf8'), spec.decimals);
    groups[key] = parsed;
    console.log(`  ${key.padEnd(14)} ${parsed.year}: ${parsed.values.size} paesi`);
  }

  const countries = {};
  for (const [key, group] of Object.entries(groups)) {
    for (const [iso, value] of group.values) (countries[iso] ??= {})[key] = value;
  }

  const out = {
    meta: {
      source: 'ND-GAIN Country Index · University of Notre Dame',
      sourceUrl: 'https://gain.nd.edu/our-work/country-index/',
      generatedAt: new Date().toISOString().slice(0, 10),
      years: Object.fromEntries(Object.entries(groups).map(([k, g]) => [k, g.year])),
      coverage: Object.fromEntries(Object.entries(groups).map(([k, g]) => [k, g.values.size])),
      countries: Object.keys(countries).length,
    },
    countries,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const json = JSON.stringify(out);
  writeFileSync(join(OUT_DIR, 'adaptation-countries.json'), json);
  console.log(`\n✓ ${out.meta.countries} paesi → adaptation-countries.json (${(json.length / 1024).toFixed(1)} KB)`);
}

await build();
