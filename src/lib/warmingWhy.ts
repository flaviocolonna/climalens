/**
 * Perché *questo* punto si è scaldato di *questo* tanto.
 *
 * La risposta non è un testo scritto a mano posto per posto: è una scala di
 * confronti annidati, tutti misurati sulla stessa griglia GISTEMP che la mappa
 * disegna.
 *
 *   il mondo                +1,29 °C
 *   fascia 40°–50° N        +1,82 °C   ← quanto pesa stare a questa latitudine
 *   la terra di quella fascia +2,33 °C ← quanto pesa essere terra e non mare
 *   questo punto            +2,64 °C   ← quello che resta è del posto
 *
 * Ogni riga è la media di un insieme più stretto della riga sopra, quindi la
 * differenza fra due righe è quanto pesa quel passaggio — non una scomposizione
 * in cause indipendenti, che a queste scale non esiste. Il residuo dell'ultima
 * riga non è un errore: dentro una cella di 2° ci sono correnti, neve, quota,
 * foschia industriale e città, e la scala si ferma dove finiscono i dati.
 *
 * Una riga che non si può misurare non si stampa. Nel 1880 la griglia è coperta
 * al 68%, e ai poli molto meno: una media di fascia costruita sul 2% delle sue
 * celle sarebbe un numero con l'aria di essere una misura.
 */
import type { ClimateGrid } from '@/lib/climateData';
import { LAND_MASK_MIN_LAT, type CountryIndex } from '@/lib/geoLookup';

/** Ampiezza della fascia di latitudine, in gradi. */
const BAND_DEG = 10;

/** Sotto questa copertura, la fascia non ha una media da dichiarare. */
const MIN_BAND_COVERAGE = 0.6;

/** E una superficie dentro la fascia ha bisogno di abbastanza celle sue. */
const MIN_SURFACE_CELLS = 25;

/** Il raggio dell'intorno su cui si misura la continentalità, in gradi. */
const CONTINENTALITY_RADIUS = 5;

/** Metà cella di griglia: serve a sapere se la cella è di costa. */
const CELL_RADIUS = 1;

export type Surface = 'land' | 'sea';

export type StepId = 'world' | 'band' | 'surface' | 'point';

export interface Step {
  id: StepId;
  value: number;
  /** Scarto rispetto alla riga precedente: è lì che sta la spiegazione. */
  delta: number | null;
}

export interface WarmingExplanation {
  /** Il riscaldamento del punto: lo stesso numero del titolo del pannello. */
  point: number | null;
  world: number | null;
  band: { from: number; to: number; label: string };
  /** Quota di celle della fascia con dati in entrambe le finestre. */
  bandCoverage: number;
  /** Terra o mare secondo le forme dei confini, o null dove la maschera non vale. */
  surface: Surface | null;
  /** Media della fascia sulla superficie del punto, e sull'altra. */
  onSurface: number | null;
  onOther: number | null;
  /** Terra intorno al punto: 1 = interno continentale, 0 = oceano aperto. */
  landFraction: number | null;
  /** Terra dentro la cella di griglia: fra i due estremi, è una cella di costa. */
  cellLandFraction: number | null;
  /** Quante volte il punto si scalda rispetto alla media del pianeta. */
  ratio: number | null;
  steps: Step[];
}

/** La fascia di dieci gradi in cui cade una latitudine, allineata alle decine. */
export function bandOf(lat: number): { from: number; to: number; label: string } {
  const from = Math.max(-90, Math.min(80, Math.floor(lat / BAND_DEG) * BAND_DEG));
  const to = from + BAND_DEG;
  const label = from >= 0 ? `${from}°–${to}° N` : `${Math.abs(to)}°–${Math.abs(from)}° S`;
  return { from, to, label };
}

export function explainWarming(
  grid: ClimateGrid,
  lat: number,
  lon: number,
  index: CountryIndex | null,
): WarmingExplanation {
  const point = grid.warmingAt(lat, lon);
  const world = grid.globalWarming();
  const band = bandOf(lat);

  const field = grid.warmingField();
  // Il peso è cos(lat): a 60° una cella di 2°×2° copre metà della superficie di
  // una all'equatore, e sommarle alla pari gonfierebbe le alte latitudini.
  const bandMean = new Weighted();
  const landMean = new Weighted();
  const seaMean = new Weighted();
  let cellsInBand = 0;

  // La maschera terra/mare vale solo dove i confini ci sono: l'Antartide non è
  // nel file (nessuna popolazione, nessuna riga di emissioni) e il continente
  // risulterebbe oceano.
  const maskUsable = index !== null && band.from >= LAND_MASK_MIN_LAT;

  for (let i = 0; i < field.length; i++) {
    const cellLat = grid.cellLat(i);
    if (cellLat < band.from || cellLat >= band.to) continue;
    cellsInBand++;
    const value = field[i];
    if (Number.isNaN(value)) continue;
    const weight = Math.cos((cellLat * Math.PI) / 180);
    bandMean.add(value, weight);
    if (!maskUsable) continue;
    // Il centro della cella decide: a 2° una cella costiera contiene entrambe
    // le cose, e non c'è modo di dividerla che non inventi dati.
    (index.at(cellLat, grid.cellLon(i)) ? landMean : seaMean).add(value, weight);
  }

  const bandCoverage = cellsInBand ? bandMean.count / cellsInBand : 0;
  const bandValue = bandCoverage >= MIN_BAND_COVERAGE ? bandMean.value : null;

  const surface: Surface | null = !maskUsable ? null : index.isLand(lat, lon) ? 'land' : 'sea';
  const pick = (m: Weighted) => (m.count >= MIN_SURFACE_CELLS ? m.value : null);
  // Senza la media della fascia non c'è nemmeno il gradino successivo: sarebbe
  // uno scarto misurato rispetto a una riga che non c'è.
  const onSurface =
    bandValue === null ? null : pick(surface === 'land' ? landMean : surface === 'sea' ? seaMean : new Weighted());
  const onOther =
    bandValue === null ? null : pick(surface === 'land' ? seaMean : surface === 'sea' ? landMean : new Weighted());

  const steps: Step[] = [];
  let previous: number | null = null;
  const push = (id: StepId, value: number | null) => {
    if (value === null) return;
    steps.push({ id, value, delta: previous === null ? null : value - previous });
    previous = value;
  };

  push('world', world);
  push('band', bandValue);
  push('surface', onSurface);
  push('point', point);

  return {
    point,
    world,
    band,
    bandCoverage,
    surface,
    onSurface,
    onOther,
    landFraction: index ? index.landFraction(lat, lon, CONTINENTALITY_RADIUS) : null,
    cellLandFraction: index ? index.landFraction(lat, lon, CELL_RADIUS) : null,
    ratio: point !== null && world !== null && world !== 0 ? point / world : null,
    steps,
  };
}

/** Media pesata che tiene anche il conto di quante celle ha visto. */
class Weighted {
  private sum = 0;
  private weight = 0;
  count = 0;

  add(value: number, weight: number): void {
    this.sum += value * weight;
    this.weight += weight;
    this.count++;
  }

  get value(): number | null {
    return this.count > 0 && this.weight > 0 ? this.sum / this.weight : null;
  }
}
