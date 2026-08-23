/**
 * Rasterises a GISTEMP year-plane into a canvas that can be draped over a
 * MapLibre viewport.
 *
 * The source grid is equirectangular (constant degrees per cell) while the map
 * is Web Mercator, so sampling row-by-row in *Mercator* space is what keeps the
 * overlay aligned with the basemap. Row/column lookup tables are computed once
 * because the inner loop runs ~1M times per frame.
 */
import { ANOMALY_MAX, ANOMALY_MIN, buildColorLut } from './colorScale';
import type { ClimateMeta } from './climateData';

/** Latitude at which Web Mercator is clipped. */
export const MAX_MERCATOR_LAT = 85.0511287798066;

const LUT_SIZE = 512;
/** Below this much valid neighbour weight a pixel is treated as "no data". */
const MIN_COVERAGE = 0.35;

export class AnomalyRenderer {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly image: ImageData;
  private readonly lut: Uint8ClampedArray;
  private readonly meta: ClimateMeta;

  // Per-row (latitude) and per-column (longitude) bilinear taps.
  private readonly rowA: Int32Array;
  private readonly rowB: Int32Array;
  private readonly rowF: Float32Array;
  private readonly colA: Int32Array;
  private readonly colB: Int32Array;
  private readonly colF: Float32Array;

  constructor(meta: ClimateMeta, width = 1024, height = 1024) {
    this.meta = meta;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.ctx = ctx;
    this.image = ctx.createImageData(width, height);
    this.lut = buildColorLut(LUT_SIZE);

    const { nLat, nLon, latStart, latStep, lonStart, lonStep } = meta;

    this.rowA = new Int32Array(height);
    this.rowB = new Int32Array(height);
    this.rowF = new Float32Array(height);

    const yTop = mercatorY(MAX_MERCATOR_LAT);
    const yBottom = mercatorY(-MAX_MERCATOR_LAT);
    for (let py = 0; py < height; py++) {
      const t = (py + 0.5) / height;
      const lat = inverseMercatorY(yTop + (yBottom - yTop) * t);
      const g = (lat - latStart) / latStep;
      const a = Math.floor(g);
      this.rowF[py] = g - a;
      this.rowA[py] = clamp(a, 0, nLat - 1);
      this.rowB[py] = clamp(a + 1, 0, nLat - 1);
    }

    this.colA = new Int32Array(width);
    this.colB = new Int32Array(width);
    this.colF = new Float32Array(width);
    for (let px = 0; px < width; px++) {
      const lon = -180 + (360 * (px + 0.5)) / width;
      const g = (lon - lonStart) / lonStep;
      const a = Math.floor(g);
      this.colF[px] = g - a;
      // Longitude wraps, so both taps stay in range by modulo.
      this.colA[px] = ((a % nLon) + nLon) % nLon;
      this.colB[px] = (((a + 1) % nLon) + nLon) % nLon;
    }
  }

  /** Paints one year. Passing null clears the overlay. */
  render(plane: Int16Array | null): void {
    const { width, height } = this.canvas;
    const px = this.image.data;

    if (!plane) {
      px.fill(0);
      this.ctx.putImageData(this.image, 0, 0);
      return;
    }

    const { nLon, fill, scale } = this.meta;
    const lut = this.lut;
    const span = ANOMALY_MAX - ANOMALY_MIN;
    const lutMax = LUT_SIZE - 1;

    let o = 0;
    for (let py = 0; py < height; py++) {
      const ra = this.rowA[py] * nLon;
      const rb = this.rowB[py] * nLon;
      const fy = this.rowF[py];
      const wTop = 1 - fy;

      for (let ix = 0; ix < width; ix++) {
        const ca = this.colA[ix];
        const cb = this.colB[ix];
        const fx = this.colF[ix];
        const wLeft = 1 - fx;

        // Fill-aware bilinear: only valid cells contribute, and the weight
        // they carry doubles as a coverage measure for the edges.
        let acc = 0;
        let wSum = 0;
        let v = plane[ra + ca];
        if (v !== fill) {
          const w = wTop * wLeft;
          acc += v * w;
          wSum += w;
        }
        v = plane[ra + cb];
        if (v !== fill) {
          const w = wTop * fx;
          acc += v * w;
          wSum += w;
        }
        v = plane[rb + ca];
        if (v !== fill) {
          const w = fy * wLeft;
          acc += v * w;
          wSum += w;
        }
        v = plane[rb + cb];
        if (v !== fill) {
          const w = fy * fx;
          acc += v * w;
          wSum += w;
        }

        if (wSum < MIN_COVERAGE) {
          px[o] = 0;
          px[o + 1] = 0;
          px[o + 2] = 0;
          px[o + 3] = 0;
          o += 4;
          continue;
        }

        const value = (acc / wSum) * scale;
        let idx = (((value - ANOMALY_MIN) / span) * lutMax) | 0;
        idx = idx < 0 ? 0 : idx > lutMax ? lutMax : idx;
        const l = idx * 4;

        px[o] = lut[l];
        px[o + 1] = lut[l + 1];
        px[o + 2] = lut[l + 2];
        // Soften the ragged boundary where the source data runs out.
        px[o + 3] = wSum >= 1 ? lut[l + 3] : lut[l + 3] * wSum;
        o += 4;
      }
    }

    this.ctx.putImageData(this.image, 0, 0);
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function mercatorY(latDeg: number): number {
  const r = (latDeg * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + r / 2));
}

function inverseMercatorY(y: number): number {
  return ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI;
}
