/**
 * Diverging colour ramp for temperature anomalies, tuned to sit on top of a
 * dark basemap: near-zero values stay translucent so geography reads through,
 * extremes go opaque and saturated.
 */

type Stop = { at: number; rgb: [number, number, number]; alpha: number };

// Anchored on the anomaly range that actually occurs in GISTEMP cells.
const STOPS: Stop[] = [
  { at: -4.0, rgb: [12, 44, 132], alpha: 0.92 },
  { at: -2.5, rgb: [30, 92, 189], alpha: 0.86 },
  { at: -1.5, rgb: [52, 138, 221], alpha: 0.76 },
  { at: -0.8, rgb: [96, 182, 236], alpha: 0.6 },
  { at: -0.3, rgb: [158, 214, 245], alpha: 0.34 },
  { at: 0.0, rgb: [226, 232, 240], alpha: 0.12 },
  { at: 0.3, rgb: [253, 224, 148], alpha: 0.34 },
  { at: 0.8, rgb: [250, 176, 74], alpha: 0.62 },
  { at: 1.5, rgb: [239, 114, 48], alpha: 0.78 },
  { at: 2.5, rgb: [214, 45, 40], alpha: 0.88 },
  { at: 4.0, rgb: [140, 12, 30], alpha: 0.95 },
];

export const ANOMALY_MIN = STOPS[0].at;
export const ANOMALY_MAX = STOPS[STOPS.length - 1].at;

/** RGBA for one anomaly value, each channel 0-255. */
export function anomalyColor(v: number): [number, number, number, number] {
  if (v <= STOPS[0].at) {
    const s = STOPS[0];
    return [s.rgb[0], s.rgb[1], s.rgb[2], Math.round(s.alpha * 255)];
  }
  const last = STOPS[STOPS.length - 1];
  if (v >= last.at) {
    return [last.rgb[0], last.rgb[1], last.rgb[2], Math.round(last.alpha * 255)];
  }
  let i = 0;
  while (i < STOPS.length - 2 && v > STOPS[i + 1].at) i++;
  const a = STOPS[i];
  const b = STOPS[i + 1];
  const t = (v - a.at) / (b.at - a.at);
  return [
    Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t),
    Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t),
    Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t),
    Math.round((a.alpha + (b.alpha - a.alpha) * t) * 255),
  ];
}

/** Opaque CSS colour for chart marks and text, ignoring the map's alpha ramp. */
export function anomalyCss(v: number): string {
  const [r, g, b] = anomalyColor(v);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * A 512-entry lookup table over [ANOMALY_MIN, ANOMALY_MAX].
 * The map renderer touches a million pixels per frame — this keeps the inner
 * loop to an index and four array reads.
 */
export function buildColorLut(size = 512): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(size * 4);
  for (let i = 0; i < size; i++) {
    const v = ANOMALY_MIN + ((ANOMALY_MAX - ANOMALY_MIN) * i) / (size - 1);
    const [r, g, b, a] = anomalyColor(v);
    lut[i * 4] = r;
    lut[i * 4 + 1] = g;
    lut[i * 4 + 2] = b;
    lut[i * 4 + 3] = a;
  }
  return lut;
}

/** CSS gradient string for the legend, sampled off the same ramp. */
export function legendGradient(): string {
  const steps = STOPS.map((s) => {
    const pct = ((s.at - ANOMALY_MIN) / (ANOMALY_MAX - ANOMALY_MIN)) * 100;
    return `rgb(${s.rgb[0]}, ${s.rgb[1]}, ${s.rgb[2]}) ${pct.toFixed(1)}%`;
  });
  return `linear-gradient(to right, ${steps.join(', ')})`;
}
