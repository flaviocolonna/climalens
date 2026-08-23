/**
 * L'aria che si respira in un punto, da Open-Meteo Air Quality.
 *
 * È lo stesso fornitore dell'archivio ERA5 che il pannello usa già, senza
 * chiave: dietro c'è CAMS (il servizio atmosferico europeo), con l'orario che
 * risale al 2013. Una sola richiesta porta il valore di adesso e un anno
 * intero di storico per ~32 KB gzippati.
 *
 * Perché sta in un'app sul clima: il PM2.5 è la parte di inquinamento che
 * uccide adesso, non fra decenni — e sono gli stessi aerosol che il pannello
 * di un paese già cita come motivo per cui il riscaldamento attribuito è più
 * alto di quello osservato. Lo stesso fumo maschera una parte del caldo e
 * riempie i polmoni: l'app raccontava metà della frase.
 */
import { untilAborted } from '@/lib/openMeteo';

const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

/**
 * Linee guida OMS 2021 per il PM2.5. Sono raccomandazioni sanitarie, non
 * limiti di legge: quelli europei e nazionali sono più permissivi, ed è il
 * motivo per cui un posto può essere "a norma" e stare comunque quattro volte
 * sopra la soglia sotto la quale l'OMS dice che i danni si vedono.
 */
export const WHO_PM25 = {
  /** Media annua raccomandata, µg/m³. */
  annual: 5,
  /** Media giornaliera da non superare più di 3-4 giorni l'anno, µg/m³. */
  daily: 15,
} as const;

/** Un giorno entra nel conteggio solo con abbastanza ore misurate. */
const MIN_HOURS_PER_DAY = 18;
/** E un anno solo se ha abbastanza giorni: mezzo anno non è una media annua. */
const MIN_DAYS_PER_YEAR = 300;

export interface AirQuality {
  /** Adesso, o null se la stazione modello non risponde per questo punto. */
  now: { pm25: number | null; europeanAqi: number | null } | null;
  /** L'anno solare completo su cui sono calcolate le statistiche. */
  year: number;
  /** Media annua del PM2.5, µg/m³. */
  annualMean: number | null;
  /** Giorni sopra la linea guida giornaliera OMS. */
  daysOverDaily: number | null;
  /** Giorni con abbastanza ore per contare — il denominatore vero. */
  daysCounted: number;
}

const cache = new Map<string, Promise<AirQuality>>();

export function fetchAirQuality(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<AirQuality> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = request(lat, lon);
    cache.set(key, pending);
    pending.catch(() => cache.delete(key));
  }
  return signal ? untilAborted(pending, signal) : pending;
}

async function request(lat: number, lon: number): Promise<AirQuality> {
  // L'ultimo anno solare chiuso: quello in corso darebbe una "media annua"
  // fatta di mesi che non ci sono ancora, e in inverno peserebbe il doppio.
  const year = new Date().getUTCFullYear() - 1;
  const url =
    `${AIR_QUALITY_URL}?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    `&current=pm2_5,european_aqi&hourly=pm2_5` +
    `&start_date=${year}-01-01&end_date=${year}-12-31&timezone=UTC`;

  const res = await fetch(url);
  if (res.status === 429) {
    throw new Error('rate-limited');
  }
  if (!res.ok) throw new Error(`air quality: HTTP ${res.status}`);

  const json = (await res.json()) as {
    error?: boolean;
    reason?: string;
    current?: { pm2_5?: number | null; european_aqi?: number | null };
    hourly?: { time: string[]; pm2_5: (number | null)[] };
  };
  if (json.error) throw new Error(json.reason ?? 'air quality: errore sconosciuto');

  const now = json.current
    ? { pm25: json.current.pm2_5 ?? null, europeanAqi: json.current.european_aqi ?? null }
    : null;

  const hourly = json.hourly;
  if (!hourly?.time?.length) {
    return { now, year, annualMean: null, daysOverDaily: null, daysCounted: 0 };
  }

  // Ore → giorni. La soglia giornaliera è definita sulla media del giorno, non
  // sui picchi: contare le singole ore sopra 15 darebbe un numero più grande e
  // che non vuol dire niente.
  const perDay = new Map<string, { sum: number; n: number }>();
  for (let i = 0; i < hourly.time.length; i++) {
    const v = hourly.pm2_5[i];
    if (v === null || v === undefined) continue;
    const day = hourly.time[i].slice(0, 10);
    const acc = perDay.get(day) ?? { sum: 0, n: 0 };
    acc.sum += v;
    acc.n++;
    perDay.set(day, acc);
  }

  const means = [...perDay.values()]
    .filter((d) => d.n >= MIN_HOURS_PER_DAY)
    .map((d) => d.sum / d.n);

  if (means.length < MIN_DAYS_PER_YEAR) {
    return { now, year, annualMean: null, daysOverDaily: null, daysCounted: means.length };
  }

  return {
    now,
    year,
    annualMean: means.reduce((a, b) => a + b, 0) / means.length,
    daysOverDaily: means.filter((m) => m > WHO_PM25.daily).length,
    daysCounted: means.length,
  };
}
