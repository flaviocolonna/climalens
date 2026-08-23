/**
 * Builds the per-country CO2 layer: who *causes* the warming the map shows.
 *
 * Sources:
 *   - Our World in Data / Global Carbon Budget — emissions per country
 *     https://github.com/owid/co2-data  (14MB CSV, ~50 columns, 1750→today)
 *   - Natural Earth 1:110m admin-0 — the country shapes
 *     https://github.com/nvkelso/natural-earth-vector
 *
 * Neither ships in a form a browser wants: the CSV is 99% columns we don't
 * need, and the shapefile carries 80 name translations per feature. We join
 * them into one GeoJSON with the properties the map and the place panel
 * actually read, and coordinates rounded to the precision the zoom range can
 * show.
 *
 * Three of those properties paint the choropleth (`pc`, `cum`, `net`). The
 * rest exist to answer *why* that colour is that colour, in the place panel:
 * what the emissions are made of (coal, oil, gas, cement, forests), how much
 * energy a person here uses and how dirty it is, and how much of the observed
 * warming is attributable to this country.
 *
 *   node scripts/build-emissions-data.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, '.cache');
const OUT_DIR = join(ROOT, 'public', 'data');

const OWID_URL = 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv';
const SHAPES_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';

/**
 * Coordinate precision. The map tops out at zoom 9 and the anomaly grid it
 * sits next to has 2° cells, so ~100m borders are already far past what any
 * view can resolve — and three decimals costs a third of the file.
 */
const COORD_DECIMALS = 3;

/** A country is drawn only if it still exists in the emissions table. */
const ISO_RE = /^[A-Z]{3}$/;

/**
 * The two-letter code, carried alongside the three-letter one so the place
 * panel can attribute a searched place by *code* instead of by polygon. The
 * geocoder answers in ISO-3166 alpha-2, and a code match is exact where a
 * point-in-polygon at 1:110m is not: Singapore has no shape at this scale, and
 * without the code its coordinates fall inside Malaysia.
 */
const ISO2_RE = /^[A-Z]{2}$/;

/**
 * Antarctica has an ISO code and a row of zeros in the emissions table, but no
 * permanent population: "0 t per person" there is a division we shouldn't draw.
 */
const SKIP_ISO = new Set(['ATA']);

/** OWID's world aggregate lives in a row with no ISO code. */
const WORLD_COUNTRY = 'World';

// ---------------------------------------------------------------------------
// Download (cached — these two files together are 15MB)
// ---------------------------------------------------------------------------

async function ensure(url, file) {
  const path = join(CACHE, file);
  if (existsSync(path)) {
    console.log(`· using cached ${file}`);
    return path;
  }
  mkdirSync(CACHE, { recursive: true });
  console.log(`· downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status} for ${url}`);
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  return path;
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

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

/**
 * What we pull out of the CSV, in groups.
 *
 * A group is a set of numbers that has to come from **the same row**, because
 * it is read as one: the fuel split must add up to the total it is a split of,
 * and energy per person must divide the emissions of its own year or the
 * carbon intensity that comes out is fiction. So each group keeps its own
 * reference year instead of the file's — consumption accounting lags
 * production by a year, and silently mixing the two would compare 2024 with
 * 2023.
 *
 * `need` is the column that decides whether a row counts for the group at all;
 * the others are optional. A country with no coal has an *empty* coal cell,
 * and dropping the whole group over it would throw away the rest of the split.
 */
const GROUPS = {
  /** Territorial emissions per person, land use included — the default layer. */
  pc: { need: 'pc', fields: { pc: 'co2_including_luc_per_capita' } },
  /** Share of everything emitted since 1750: the CO2 that is still up there. */
  cum: { need: 'cum', fields: { cum: 'share_global_cumulative_co2_including_luc' } },
  /**
   * How much of the warming this country is responsible for, in °C and as a
   * share of the total. Cumulative, CO2 + CH4 + N2O, from OWID's build of the
   * Jones et al. attribution dataset.
   */
  warm: {
    need: 'tmp',
    fields: { tmp: 'temperature_change_from_ghg', tmpShare: 'share_of_temperature_change_from_ghg' },
  },
  /**
   * The "why" group: what the emissions are made of, and what drives them.
   * `co2` is fossil-only, and so is the fuel split, so the two compare; `land`
   * is the land-use term and can be **negative** where forests are regrowing.
   */
  mix: {
    need: 'co2',
    fields: {
      co2: 'co2',
      shr: 'share_global_co2_including_luc',
      pcFossil: 'co2_per_capita',
      pop: 'population',
      energyPc: 'energy_per_capita',
      coal: 'coal_co2',
      oil: 'oil_co2',
      gas: 'gas_co2',
      cement: 'cement_co2',
      flaring: 'flaring_co2',
      industry: 'other_industry_co2',
      land: 'land_use_change_co2',
    },
  },
  /** All greenhouse gases, to say how much of the total is *not* CO2. */
  ghg: { need: 'ghg', fields: { ghg: 'total_ghg', ch4: 'methane', n2o: 'nitrous_oxide' } },
};

/** The fossil split, in the order the panel stacks it. */
const SOURCE_KEYS = ['coal', 'oil', 'gas', 'cement', 'flaring', 'industry'];

/**
 * How many decimals each field survives with. Rounded here, not in the UI.
 *
 * Megatonnes keep two even though nobody reads the second: the fuel split is
 * shown as *shares of the total*, and one decimal turns Timor-Leste's 0,7 Mt
 * into a split that misses its own total by 14%.
 */
const DECIMALS = {
  pc: 2, cum: 2, net: 2, tmp: 4, tmpShare: 2, shr: 2, pcFossil: 2,
  coal: 2, oil: 2, gas: 2, cement: 2, flaring: 2, industry: 2, land: 2,
  co2: 2, ghg: 2, ch4: 2, n2o: 2, energyPc: 0, pop: 0,
};

const round = (value, decimals) => {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
};

/**
 * Folds the CSV into one record per country — plus one for the world — with
 * one entry per group, each at its own most recent year.
 */
function readEmissions(csvPath) {
  const lines = readFileSync(csvPath, 'utf8').split('\n');
  const head = splitCsv(lines[0]);
  const col = (name) => {
    const i = head.indexOf(name);
    if (i < 0) throw new Error(`column "${name}" missing — has the OWID schema changed?`);
    return i;
  };

  const C = {
    iso: col('iso_code'),
    country: col('country'),
    year: col('year'),
    // The import/export pair. Consumption accounting exists for fossil CO2
    // only, so both halves of the subtraction have to be fossil-only.
    consFossil: col('consumption_co2_per_capita'),
    prodFossil: col('co2_per_capita'),
  };
  /** group → { field → column index }. */
  const G = Object.fromEntries(
    Object.entries(GROUPS).map(([group, spec]) => [
      group,
      Object.fromEntries(Object.entries(spec.fields).map(([k, name]) => [k, col(name)])),
    ]),
  );

  /**
   * An empty CSV cell means "not measured", and `Number('')` is 0 — which would
   * publish a confident zero for every country the dataset stays silent about.
   */
  const num = (field) => {
    if (field === undefined || field.trim() === '') return null;
    const v = Number(field);
    return Number.isFinite(v) ? v : null;
  };

  /** key → { group: { year, values } }, keeping the latest year per group. */
  const byKey = new Map();
  const keep = (key, group, year, values) => {
    const rec = byKey.get(key) ?? {};
    if (!rec[group] || year > rec[group].year) rec[group] = { year, values };
    byKey.set(key, rec);
  };

  const readRow = (key, cells, year) => {
    for (const [group, spec] of Object.entries(GROUPS)) {
      const values = {};
      for (const [field, index] of Object.entries(G[group])) {
        const v = num(cells[index]);
        if (v !== null) values[field] = v;
      }
      if (values[spec.need] === undefined) continue;
      keep(key, group, year, values);
    }

    const cons = num(cells[C.consFossil]);
    const prod = num(cells[C.prodFossil]);
    if (cons !== null && prod !== null) keep(key, 'net', year, { net: cons - prod });
  };

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const c = splitCsv(lines[i]);
    const year = num(c[C.year]);
    if (year === null) continue;

    // OWID mixes countries with aggregates ("World", "Africa", income groups);
    // only real countries carry a plain ISO-3166 alpha-3. The world row has no
    // ISO code at all, and is read on purpose: it is the yardstick behind
    // every "× the world average" the panel prints.
    const iso = c[C.iso];
    if (ISO_RE.test(iso)) {
      if (!SKIP_ISO.has(iso)) readRow(iso, c, year);
    } else if (c[C.country] === WORLD_COUNTRY) {
      readRow(WORLD_COUNTRY, c, year);
    }
  }

  // Every country in a group now shows the same year, or nothing. Keeping one
  // country's stale 2019 figure next to everyone else's 2024 would draw a map
  // whose colours can't be compared to each other — the one thing a choropleth
  // is for — and, in the panel, would divide one year's emissions by another
  // year's energy.
  const years = {};
  for (const [key, rec] of byKey) {
    if (key === WORLD_COUNTRY) continue;
    for (const [group, g] of Object.entries(rec)) {
      years[group] = Math.max(years[group] ?? 0, g.year);
    }
  }
  for (const [key, rec] of byKey) {
    if (key === WORLD_COUNTRY) continue;
    for (const [group, g] of Object.entries(rec)) {
      if (g.year !== years[group]) delete rec[group];
    }
  }

  // The world is pinned to the same years, for the same reason: a ratio whose
  // numerator and denominator come from different years is not a ratio.
  const world = byKey.get(WORLD_COUNTRY) ?? {};
  for (const [group, g] of Object.entries(world)) {
    if (years[group] !== undefined && g.year !== years[group]) delete world[group];
  }

  return { byIso: byKey, world, years };
}

/**
 * Flattens a record's groups into flat, rounded properties.
 * The fuel split goes into a nested object: it is read as a whole and never by
 * a map expression, and nesting keeps it from crowding the metric keys.
 */
function flatten(rec) {
  const props = {};
  const sources = {};
  for (const g of Object.values(rec)) {
    for (const [field, value] of Object.entries(g.values)) {
      const rounded = round(value, DECIMALS[field] ?? 2);
      if (SOURCE_KEYS.includes(field) || field === 'land') sources[field] = rounded;
      else props[field] = rounded;
    }
  }
  if (Object.keys(sources).length) props.src = sources;
  return props;
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

const roundCoord = (v) => Math.round(v * 10 ** COORD_DECIMALS) / 10 ** COORD_DECIMALS;

/**
 * Rounds a ring and drops the duplicate points rounding creates, keeping the
 * closing point. A ring that collapses below a triangle is dropped whole —
 * at this scale it was a rock, and an invalid ring breaks the tessellator.
 */
function roundRing(ring) {
  const out = [];
  for (const [x, y] of ring) {
    const p = [roundCoord(x), roundCoord(y)];
    const last = out[out.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
  }
  const first = out[0];
  const last = out[out.length - 1];
  if (first && (first[0] !== last[0] || first[1] !== last[1])) out.push([first[0], first[1]]);
  return out.length >= 4 ? out : null;
}

function roundGeometry(geom) {
  const polygons = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  const kept = [];
  for (const poly of polygons) {
    const rings = poly.map(roundRing).filter(Boolean);
    // The first ring is the outline; if it went, the holes are meaningless.
    if (rings.length && rings[0]) kept.push(rings);
  }
  if (!kept.length) return null;
  return kept.length === 1
    ? { type: 'Polygon', coordinates: kept[0] }
    : { type: 'MultiPolygon', coordinates: kept };
}

// ---------------------------------------------------------------------------

function build(shapesPath, emissions) {
  const shapes = JSON.parse(readFileSync(shapesPath, 'utf8'));
  const features = [];
  const unmatched = [];

  for (const f of shapes.features) {
    const p = f.properties;
    // ISO_A3 is -99 for a handful of disputed territories; the _EH variant
    // resolves most of them, and ADM0_A3 is the last resort.
    const iso = [p.ISO_A3_EH, p.ISO_A3, p.ADM0_A3].find((v) => ISO_RE.test(v ?? ''));
    const rec = iso ? emissions.byIso.get(iso) : null;
    if (!rec) {
      unmatched.push(p.NAME_IT || p.NAME);
      continue;
    }

    const geometry = roundGeometry(f.geometry);
    if (!geometry) continue;

    const iso2 = [p.ISO_A2_EH, p.ISO_A2, p.WB_A2].find((v) => ISO2_RE.test(v ?? ''));
    // it/en/es display name, for the app's three UI languages — Natural Earth
    // ships all three for every country, each falling back to the next if a
    // specific translation is missing.
    const name = {
      it: p.NAME_IT || p.NAME_EN || p.NAME,
      en: p.NAME_EN || p.NAME,
      es: p.NAME_ES || p.NAME_EN || p.NAME,
    };
    const properties = { iso, name, ...flatten(rec) };
    if (iso2) properties.iso2 = iso2;
    features.push({ type: 'Feature', properties, geometry });
  }

  // One representative property per group: a group is either there whole or
  // not at all, so counting its `need` counts the group.
  const GROUP_KEY = { pc: 'pc', cum: 'cum', net: 'net', warm: 'tmp', mix: 'src', ghg: 'ghg' };
  const covered = (key) => features.filter((f) => f.properties[key] !== undefined).length;

  const out = {
    type: 'FeatureCollection',
    meta: {
      source: 'Our World in Data · Global Carbon Budget',
      sourceUrl: 'https://ourworldindata.org/co2-dataset-sources',
      attribution: 'Jones et al. (2024), via Our World in Data',
      attributionUrl: 'https://ourworldindata.org/contributed-most-global-warming',
      shapes: 'Natural Earth 1:110m',
      generatedAt: new Date().toISOString().slice(0, 10),
      years: emissions.years,
      // The world at those same years: every "× the world average" the panel
      // prints divides by these, so they can't be a number typed from memory.
      world: flatten(emissions.world),
      coverage: {
        pc: covered('pc'),
        cum: covered('cum'),
        net: covered('net'),
        tmp: covered('tmp'),
        src: covered('src'),
        energyPc: covered('energyPc'),
        ghg: covered('ghg'),
        iso2: covered('iso2'),
      },
      countries: features.length,
    },
    features,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const json = JSON.stringify(out);
  writeFileSync(join(OUT_DIR, 'co2-countries.json'), json);

  console.log(`\n✓ ${features.length} paesi → co2-countries.json (${(json.length / 1048576).toFixed(2)} MB)`);
  for (const [group, year] of Object.entries(out.meta.years)) {
    console.log(`  ${group.padEnd(5)} ${year}: ${covered(GROUP_KEY[group]) ?? '—'} paesi`);
  }
  console.log(`  mondo: ${JSON.stringify(out.meta.world)}`);
  if (unmatched.length) console.log(`  senza dati: ${unmatched.join(', ')}`);

  // The split is published as a split *of* `co2`: the day the parts stop
  // adding up to it, every share the panel prints is quietly wrong.
  let worst = { iso: '—', off: 0 };
  for (const f of features) {
    const { src, co2, iso } = f.properties;
    if (!src || !co2) continue;
    const sum = SOURCE_KEYS.reduce((a, k) => a + (src[k] ?? 0), 0);
    const off = Math.abs(sum - co2) / Math.abs(co2);
    if (off > worst.off) worst = { iso, off };
  }
  console.log(`  somma combustibili vs totale fossile: scarto max ${(worst.off * 100).toFixed(2)}% (${worst.iso})`);
}

const csvPath = await ensure(OWID_URL, 'owid-co2-data.csv');
const shapesPath = await ensure(SHAPES_URL, 'ne_110m_admin_0_countries.geojson');
console.log('· joining emissions to shapes');
build(shapesPath, readEmissions(csvPath));
