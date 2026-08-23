/**
 * Builds the browser-ready temperature grid from NASA GISTEMP.
 *
 * Source: GISTEMP v4, 1200km smoothing, 2°x2° grid, monthly anomalies
 *         relative to the 1951-1980 baseline.
 *         https://data.giss.nasa.gov/gistemp/
 *
 * The upstream file is a 57MB NetCDF-3 classic archive of Int16 monthly
 * values. We collapse it to annual means and ship an Int16 binary
 * (~4.5MB, ~1.5MB over the wire once gzipped) plus a metadata sidecar.
 *
 *   node scripts/build-climate-data.mjs
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, '.cache');
const NC_PATH = join(CACHE, 'gistemp1200.nc');
const OUT_DIR = join(ROOT, 'public', 'data');
const SOURCE_URL =
  'https://data.giss.nasa.gov/pub/gistemp/gistemp1200_GHCNv4_ERSSTv5.nc.gz';

/** Annual mean needs at least this many valid months, otherwise the cell is void. */
const MIN_MONTHS_PER_CELL = 8;
/** A year needs this much global coverage to be published at all. */
const MIN_YEAR_COVERAGE = 0.25;
const FILL_OUT = -32768;

// ---------------------------------------------------------------------------
// Minimal NetCDF-3 classic reader.
// Format spec: https://docs.unidata.ucar.edu/nug/current/file_structure_and_performance.html
// We only need what GISTEMP uses: fixed-size vars, big-endian, no records.
// ---------------------------------------------------------------------------

const TYPES = {
  1: { name: 'byte', size: 1, read: (b, p) => b.readInt8(p) },
  2: { name: 'char', size: 1, read: (b, p) => b.readInt8(p) },
  3: { name: 'short', size: 2, read: (b, p) => b.readInt16BE(p) },
  4: { name: 'int', size: 4, read: (b, p) => b.readInt32BE(p) },
  5: { name: 'float', size: 4, read: (b, p) => b.readFloatBE(p) },
  6: { name: 'double', size: 8, read: (b, p) => b.readDoubleBE(p) },
};

function parseNetCDF3(buf) {
  if (buf.toString('latin1', 0, 3) !== 'CDF') throw new Error('not a NetCDF-3 file');
  let p = 4;

  const i32 = () => {
    const v = buf.readInt32BE(p);
    p += 4;
    return v;
  };
  // Names and attribute payloads are padded to 4-byte boundaries.
  const pad = (n) => (4 - (n % 4)) % 4;
  const name = () => {
    const n = i32();
    const s = buf.toString('latin1', p, p + n);
    p += n + pad(n);
    return s;
  };
  const attrs = () => {
    const out = {};
    i32(); // NC_ATTRIBUTE tag (or absent-marker)
    const count = i32();
    for (let i = 0; i < count; i++) {
      const key = name();
      const type = TYPES[i32()];
      const nvals = i32();
      let value;
      if (type.name === 'char') {
        value = buf.toString('latin1', p, p + nvals);
      } else {
        value = [];
        for (let j = 0; j < nvals; j++) value.push(type.read(buf, p + j * type.size));
        if (value.length === 1) value = value[0];
      }
      const bytes = nvals * type.size;
      p += bytes + pad(bytes);
      out[key] = value;
    }
    return out;
  };

  i32(); // numrecs
  i32(); // NC_DIMENSION tag
  const ndims = i32();
  const dims = [];
  for (let i = 0; i < ndims; i++) dims.push({ name: name(), size: i32() });

  attrs(); // global attributes

  i32(); // NC_VARIABLE tag
  const nvars = i32();
  const vars = {};
  for (let i = 0; i < nvars; i++) {
    const varName = name();
    const ndimsVar = i32();
    const shape = [];
    for (let j = 0; j < ndimsVar; j++) shape.push(dims[i32()]);
    const attributes = attrs();
    const type = TYPES[i32()];
    i32(); // vsize
    const offset = i32();
    vars[varName] = { name: varName, shape, attributes, type, offset };
  }

  return { dims, vars, buffer: buf };
}

/** Reads a whole variable as a flat typed array of raw (unscaled) values. */
function readVar(nc, varName) {
  const v = nc.vars[varName];
  if (!v) throw new Error(`variable "${varName}" not found`);
  const count = v.shape.reduce((a, d) => a * d.size, 1);
  const out = v.type.name === 'short' ? new Int16Array(count) : new Float64Array(count);
  for (let i = 0; i < count; i++) out[i] = v.type.read(nc.buffer, v.offset + i * v.type.size);
  return out;
}

// ---------------------------------------------------------------------------

async function ensureSource() {
  if (existsSync(NC_PATH)) {
    console.log(`· using cached ${NC_PATH}`);
    return;
  }
  mkdirSync(CACHE, { recursive: true });
  console.log(`· downloading ${SOURCE_URL}`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
  // Stream through gunzip so the 57MB never sits in memory twice.
  await pipeline(Readable.fromWeb(res.body), createGunzip(), createWriteStream(NC_PATH));
  console.log(`· decompressed to ${NC_PATH}`);
}

function build() {
  console.log('· parsing NetCDF header');
  const nc = parseNetCDF3(readFileSync(NC_PATH));

  const lats = readVar(nc, 'lat');
  const lons = readVar(nc, 'lon');
  const times = readVar(nc, 'time');
  const raw = readVar(nc, 'tempanomaly');

  const nLat = lats.length;
  const nLon = lons.length;
  const nTime = times.length;
  const cells = nLat * nLon;

  const tv = nc.vars.tempanomaly;
  const scale = Array.isArray(tv.attributes.scale_factor)
    ? tv.attributes.scale_factor[0]
    : tv.attributes.scale_factor;
  const fillIn = Array.isArray(tv.attributes._FillValue)
    ? tv.attributes._FillValue[0]
    : tv.attributes._FillValue;

  console.log(`  grid ${nLat}x${nLon}, ${nTime} months, scale=${scale}, fill=${fillIn}`);

  // "days since 1800-01-01" -> calendar year
  const EPOCH = Date.UTC(1800, 0, 1);
  const yearOf = (days) => new Date(EPOCH + days * 86400000).getUTCFullYear();

  const firstYear = yearOf(times[0]);
  const lastYear = yearOf(times[nTime - 1]);

  // Accumulate per (year, cell)
  const nYears = lastYear - firstYear + 1;
  const sums = new Float64Array(nYears * cells);
  const counts = new Uint8Array(nYears * cells);
  const monthsSeen = new Uint8Array(nYears);

  for (let t = 0; t < nTime; t++) {
    const yi = yearOf(times[t]) - firstYear;
    monthsSeen[yi]++;
    const tBase = t * cells;
    const yBase = yi * cells;
    for (let c = 0; c < cells; c++) {
      const v = raw[tBase + c];
      if (v === fillIn) continue;
      sums[yBase + c] += v * scale;
      counts[yBase + c]++;
    }
  }

  // Latitude weights for the area-weighted global mean.
  const wLat = new Float64Array(nLat);
  for (let i = 0; i < nLat; i++) wLat[i] = Math.cos((lats[i] * Math.PI) / 180);

  const grid = [];
  const globalSeries = [];
  const years = [];

  for (let yi = 0; yi < nYears; yi++) {
    const year = firstYear + yi;
    // Drop partial years at the tail (the source updates mid-year).
    if (monthsSeen[yi] < 12) {
      console.log(`  skipping ${year}: only ${monthsSeen[yi]} months available`);
      continue;
    }

    const plane = new Int16Array(cells).fill(FILL_OUT);
    let filled = 0;
    let wSum = 0;
    let vSum = 0;

    for (let la = 0; la < nLat; la++) {
      for (let lo = 0; lo < nLon; lo++) {
        const c = la * nLon + lo;
        const n = counts[yi * cells + c];
        if (n < MIN_MONTHS_PER_CELL) continue;
        const mean = sums[yi * cells + c] / n;
        plane[c] = Math.round(mean * 100); // centi-kelvin
        filled++;
        vSum += mean * wLat[la];
        wSum += wLat[la];
      }
    }

    const coverage = filled / cells;
    if (coverage < MIN_YEAR_COVERAGE) {
      console.log(`  skipping ${year}: coverage ${(coverage * 100).toFixed(0)}%`);
      continue;
    }

    years.push(year);
    grid.push(plane);
    globalSeries.push(Math.round((vSum / wSum) * 1000) / 1000);
  }

  // Flatten to one contiguous Int16 buffer: [year][lat][lon]
  const out = Buffer.alloc(years.length * cells * 2);
  grid.forEach((plane, i) => {
    for (let c = 0; c < cells; c++) out.writeInt16LE(plane[c], (i * cells + c) * 2);
  });

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, 'temp-grid.bin'), out);

  const meta = {
    source: 'NASA GISTEMP v4 (GHCNv4 + ERSSTv5, 1200km smoothing)',
    sourceUrl: 'https://data.giss.nasa.gov/gistemp/',
    variable: 'Surface temperature anomaly',
    units: '°C',
    baseline: '1951-1980',
    generatedAt: new Date().toISOString().slice(0, 10),
    years,
    startYear: years[0],
    endYear: years[years.length - 1],
    nLat,
    nLon,
    // Cell centres; the grid is regular so a start+step is enough.
    latStart: lats[0],
    latStep: lats[1] - lats[0],
    lonStart: lons[0],
    lonStep: lons[1] - lons[0],
    scale: 0.01,
    fill: FILL_OUT,
    globalAnnualAnomaly: globalSeries,
  };
  writeFileSync(join(OUT_DIR, 'temp-meta.json'), JSON.stringify(meta));

  const mb = (out.length / 1048576).toFixed(2);
  console.log(`\n✓ ${years.length} years (${meta.startYear}–${meta.endYear}) → temp-grid.bin (${mb} MB)`);
  console.log(`  global anomaly ${meta.startYear}: ${globalSeries[0].toFixed(2)}°C`);
  console.log(`  global anomaly ${meta.endYear}: ${globalSeries[globalSeries.length - 1].toFixed(2)}°C`);
}

await ensureSource();
build();
