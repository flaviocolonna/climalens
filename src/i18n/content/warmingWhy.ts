/**
 * Testo per la scala di confronti di WarmingWhy.tsx. La logica che decide
 * *quale* spiegazione si applica (`reasonKey`/`headlineKey`) è scritta una
 * sola volta ed è locale-neutra — legge solo i numeri di `WarmingExplanation`.
 * Le tabelle `REASON_TEXT`/`HEADLINE_TEXT` sono per lingua: libere di
 * ricomporre la frase intera, non solo di sostituire una parola — è per
 * questo che esistono, invece di un `t()` piatto: l'articolo italiano davanti
 * a un numero non ha equivalente diretto in inglese o spagnolo.
 */
import { LOCALE_TAG, type Locale } from '@/i18n/locale';
import { signedDegrees } from '@/lib/format';
import type { StepId, WarmingExplanation } from '@/lib/warmingWhy';
import { articleIt } from '@/i18n/content/itGrammar';

// --- step labels -------------------------------------------------------------

export function stepLabel(id: StepId, why: WarmingExplanation, locale: Locale): string {
  if (id === 'world') return { it: 'Il mondo', en: 'The world', es: 'El mundo' }[locale];
  if (id === 'band') {
    const word = { it: 'Fascia', en: 'Band', es: 'Franja' }[locale];
    return `${word} ${why.band.label}`;
  }
  if (id === 'surface') {
    const sea = why.surface === 'sea';
    return {
      it: sea ? 'Il mare di questa fascia' : 'La terra di questa fascia',
      en: sea ? 'The sea in this band' : 'The land in this band',
      es: sea ? 'El mar de esta franja' : 'La tierra de esta franja',
    }[locale];
  }
  return { it: 'Questo punto', en: 'This point', es: 'Este punto' }[locale];
}

// --- headline ----------------------------------------------------------------

type HeadlineKey = 'noRatio' | 'above' | 'below' | 'roughly';

function headlineKey(why: WarmingExplanation): HeadlineKey {
  if (why.ratio === null || why.world === null) return 'noRatio';
  if (why.ratio >= 1.15) return 'above';
  if (why.ratio <= 0.85) return 'below';
  return 'roughly';
}

const HEADLINE_TEXT: Record<Locale, Record<HeadlineKey, (ratio: string) => string>> = {
  it: {
    noRatio: () =>
      'Quanto si è scaldato questo punto, confrontato con la sua fascia di latitudine e con il pianeta.',
    above: (r) => `Questo punto si è scaldato ${r} volte la media del pianeta. Non è un caso, ed è misurabile da dove sta.`,
    below: (r) => `Questo punto si è scaldato meno della media del pianeta — ${r} volte. Anche il "meno" ha un motivo.`,
    roughly: () =>
      'Questo punto si è scaldato più o meno quanto la media del pianeta. Vale comunque la pena vedere da cosa è fatto quel numero.',
  },
  en: {
    noRatio: () => 'How much this point has warmed, compared with its latitude band and with the planet.',
    above: (r) =>
      `This point has warmed ${r} times the planet's average. It's not a coincidence, and it's measurable from where it sits.`,
    below: (r) => `This point has warmed less than the planet's average — ${r} times. Even the "less" has a reason.`,
    roughly: () =>
      "This point has warmed roughly as much as the planet's average. Still worth seeing what that number is made of.",
  },
  es: {
    noRatio: () => 'Cuánto se ha calentado este punto, comparado con su franja de latitud y con el planeta.',
    above: (r) => `Este punto se ha calentado ${r} veces la media del planeta. No es casualidad, y se puede medir por dónde está.`,
    below: (r) => `Este punto se ha calentado menos que la media del planeta — ${r} veces. Hasta el "menos" tiene un motivo.`,
    roughly: () =>
      'Este punto se ha calentado más o menos lo mismo que la media del planeta. Aun así vale la pena ver de qué está hecho ese número.',
  },
};

export function headline(why: WarmingExplanation, locale: Locale): string {
  const key = headlineKey(why);
  const ratioText =
    why.ratio === null ? '' : why.ratio.toLocaleString(LOCALE_TAG[locale], { maximumFractionDigits: 1 });
  return HEADLINE_TEXT[locale][key](ratioText);
}

// --- reason --------------------------------------------------------------

type ReasonKey =
  | 'world'
  | 'band.polarWarming'
  | 'band.polarAntarctic'
  | 'band.tropicalDamped'
  | 'band.aboveAvg'
  | 'band.belowAvg'
  | 'surface.sea'
  | 'surface.land'
  | 'point.coastMismatchSea'
  | 'point.coastMismatchLand'
  | 'point.landDominant'
  | 'point.waterDominant'
  | 'point.residualSmall'
  | 'point.residualUnexplained';

interface ReasonVars {
  onOther?: number | null;
  cellPct?: number;
  landPct?: number;
  waterPct?: number;
}

/** Stessa logica decisionale di prima — decide solo QUALE spiegazione, non il testo. */
function reasonKey(id: StepId, why: WarmingExplanation): { key: ReasonKey; vars: ReasonVars } {
  const lat = (why.band.from + why.band.to) / 2;
  const polar = Math.abs(lat) >= 60;
  const tropical = Math.abs(lat) < 25;
  const bandDelta = why.steps.find((s) => s.id === 'band')?.delta ?? 0;

  switch (id) {
    case 'world':
      return { key: 'world', vars: {} };

    case 'band':
      if (polar && bandDelta > 0) return { key: 'band.polarWarming', vars: {} };
      if (polar) return { key: 'band.polarAntarctic', vars: {} };
      if (tropical && bandDelta < 0.1) return { key: 'band.tropicalDamped', vars: {} };
      return { key: bandDelta >= 0 ? 'band.aboveAvg' : 'band.belowAvg', vars: {} };

    case 'surface':
      return { key: why.surface === 'sea' ? 'surface.sea' : 'surface.land', vars: { onOther: why.onOther } };

    case 'point': {
      const land = why.landFraction;
      const cell = why.cellLandFraction;
      const residual = why.steps.find((s) => s.id === 'point')?.delta ?? 0;

      if (why.surface !== null && cell !== null) {
        if (why.surface === 'sea' && cell >= 0.5) {
          return { key: 'point.coastMismatchSea', vars: { cellPct: Math.round(cell * 100) } };
        }
        if (why.surface === 'land' && cell <= 0.5) {
          return { key: 'point.coastMismatchLand', vars: { cellPct: Math.round((1 - cell) * 100) } };
        }
      }

      if (land !== null && land >= 0.75 && residual > 0.05) {
        return { key: 'point.landDominant', vars: { landPct: Math.round(land * 100) } };
      }
      if (land !== null && land <= 0.25 && residual < -0.05) {
        return { key: 'point.waterDominant', vars: { waterPct: Math.round((1 - land) * 100) } };
      }
      if (Math.abs(residual) < 0.15) return { key: 'point.residualSmall', vars: {} };
      return { key: 'point.residualUnexplained', vars: {} };
    }

    default:
      return { key: 'world', vars: {} };
  }
}

const SCALE_NOTE: Record<Locale, string> = {
  it: ' A questa scala, dentro una cella di 2°×2°, restano cose che la griglia non separa: correnti marine, copertura nevosa, quota, foschia industriale, irrigazione, calore delle città.',
  en: " At this scale, inside a 2°×2° cell, things remain that the grid can't separate: ocean currents, snow cover, elevation, industrial haze, irrigation, urban heat.",
  es: ' A esta escala, dentro de una celda de 2°×2°, quedan cosas que la cuadrícula no separa: corrientes marinas, cobertura de nieve, altitud, neblina industrial, riego, calor urbano.',
};

type ReasonLeaf = (v: ReasonVars, locale: Locale) => string;

const REASON_TEXT: Record<Locale, Record<ReasonKey, ReasonLeaf>> = {
  it: {
    world: () =>
      'Il riscaldamento medio della superficie terrestre fra la fine dell’Ottocento e oggi: è il punto di partenza di tutti gli altri.',
    'band.polarWarming': () =>
      'Amplificazione polare: il ghiaccio e la neve che si ritirano scoprono roccia e mare, che sono scuri e assorbono la luce invece di rimandarla indietro. In più l’aria fredda d’inverno è stabile e tiene il calore vicino al suolo, e a temperature basse l’energia in più diventa temperatura invece di evaporazione.',
    'band.polarAntarctic': () =>
      'Attorno all’Antartide il riscaldamento è più lento: l’Oceano Australe rimescola il calore verso il fondo e i venti che girano intorno al continente lo spostano via prima che si accumuli in superficie.',
    'band.tropicalDamped': () =>
      'Ai tropici buona parte dell’energia in più se ne va in evaporazione invece che in temperatura, e questa fascia è quasi tutta oceano: il termometro sale meno anche dove il calore accumulato è tanto.',
    'band.aboveAvg': () =>
      'Le fasce di latitudine non si scaldano allo stesso modo: contano quanta terra contengono, quanto ghiaccio hanno ancora da perdere e come le correnti spostano il calore. Questa sta sopra la media mondiale.',
    'band.belowAvg': () =>
      'Le fasce di latitudine non si scaldano allo stesso modo: contano quanta terra contengono, quanto ghiaccio hanno ancora da perdere e come le correnti spostano il calore. Questa sta sotto la media mondiale.',
    'surface.sea': (v, locale) => {
      const other = v.onOther == null ? '' : ` Nella stessa fascia, la terra è a ${signedDegrees(v.onOther, locale)}.`;
      return `Il punto cade in mare. L’acqua ha una capacità termica enorme e mescola il calore verso il fondo per centinaia di metri: lo stesso surplus di energia le alza la temperatura molto meno che alla terraferma.${other}`;
    },
    'surface.land': (v, locale) => {
      const other = v.onOther == null ? '' : ` Nella stessa fascia, il mare è a ${signedDegrees(v.onOther, locale)}.`;
      return `Il punto cade sulla terraferma. Il suolo scalda solo i primi centimetri e non ha dove mandare il calore in profondità; e dove è asciutto manca l’evaporazione che se lo porterebbe via, così l’energia resta come temperatura.${other}`;
    },
    'point.coastMismatchSea': (v) =>
      `Ma la cella di griglia che lo misura è per ${articleIt(v.cellPct!)}${v.cellPct}% terraferma: a 2° la costa non sta dentro una cella sola, e il valore che esce è un misto delle due superfici, molto più vicino a quello della terra.`,
    'point.coastMismatchLand': (v) =>
      `Ma la cella di griglia che lo misura è per ${articleIt(v.cellPct!)}${v.cellPct}% acqua: a 2° una costa non sta dentro una cella sola, e il mare intorno tiene giù anche il valore della terra che ci sta dentro.`,
    'point.landDominant': (v) =>
      `Intorno a questo punto c’è terra per ${articleIt(v.landPct!)}${v.landPct}%: senza un mare vicino che faccia da volano termico, il riscaldamento corre più veloce che sulla costa.${SCALE_NOTE.it}`,
    'point.waterDominant': (v) =>
      `Intorno a questo punto c’è acqua per ${articleIt(v.waterPct!)}${v.waterPct}%: l’inerzia termica del mare frena anche l’aria che ci sta sopra.${SCALE_NOTE.it}`,
    'point.residualSmall': () =>
      `Quello che resta è poco: questo punto si comporta come il resto della sua fascia.${SCALE_NOTE.it}`,
    'point.residualUnexplained': () =>
      `Quello che resta non ha una causa sola leggibile da qui.${SCALE_NOTE.it}`,
  },
  en: {
    world: () =>
      "The average warming of Earth's surface between the late 1800s and today: it's the starting point for everything else.",
    'band.polarWarming': () =>
      "Polar amplification: retreating ice and snow uncover dark rock and sea, which absorb light instead of reflecting it back. On top of that, cold winter air is stable and holds heat near the ground, and at low temperatures extra energy becomes heat instead of evaporation.",
    'band.polarAntarctic': () =>
      "Around Antarctica warming is slower: the Southern Ocean mixes heat down toward the depths, and the winds circling the continent carry it away before it can build up at the surface.",
    'band.tropicalDamped': () =>
      "In the tropics much of the extra energy goes into evaporation rather than temperature, and this band is almost all ocean: the thermometer rises less even where a lot of heat has built up.",
    'band.aboveAvg': () =>
      "Latitude bands don't warm the same way: what matters is how much land they contain, how much ice they still have to lose, and how currents move heat around. This one sits above the world average.",
    'band.belowAvg': () =>
      "Latitude bands don't warm the same way: what matters is how much land they contain, how much ice they still have to lose, and how currents move heat around. This one sits below the world average.",
    'surface.sea': (v, locale) => {
      const other = v.onOther == null ? '' : ` In the same band, the land is at ${signedDegrees(v.onOther, locale)}.`;
      return `The point falls in the sea. Water has an enormous heat capacity and mixes heat down for hundreds of metres: the same energy surplus raises its temperature far less than it would on land.${other}`;
    },
    'surface.land': (v, locale) => {
      const other = v.onOther == null ? '' : ` In the same band, the sea is at ${signedDegrees(v.onOther, locale)}.`;
      return `The point falls on land. Soil only heats the first few centimetres and has nowhere to send heat downward; and where it's dry there's no evaporation to carry it away, so the energy stays as heat.${other}`;
    },
    'point.coastMismatchSea': (v) =>
      `But the grid cell measuring it is ${v.cellPct}% land: at 2° a coastline doesn't fit inside a single cell, and the value that comes out is a mix of both surfaces, much closer to the land's.`,
    'point.coastMismatchLand': (v) =>
      `But the grid cell measuring it is ${v.cellPct}% water: at 2° a coastline doesn't fit inside a single cell, and the surrounding sea holds down the value of the land inside it too.`,
    'point.landDominant': (v) =>
      `The area around this point is ${v.landPct}% land: with no nearby sea to act as a thermal flywheel, warming runs faster than it would on the coast.${SCALE_NOTE.en}`,
    'point.waterDominant': (v) =>
      `The area around this point is ${v.waterPct}% water: the sea's thermal inertia holds back the air above it too.${SCALE_NOTE.en}`,
    'point.residualSmall': () =>
      `What's left is small: this point behaves like the rest of its band.${SCALE_NOTE.en}`,
    'point.residualUnexplained': () =>
      `What's left doesn't have a single cause that's readable from here.${SCALE_NOTE.en}`,
  },
  es: {
    world: () =>
      'El calentamiento medio de la superficie terrestre entre finales del siglo XIX y hoy: es el punto de partida de todos los demás.',
    'band.polarWarming': () =>
      'Amplificación polar: el hielo y la nieve al retirarse dejan al descubierto roca y mar oscuros, que absorben la luz en vez de reflejarla. Además, el aire frío de invierno es estable y retiene el calor cerca del suelo, y a temperaturas bajas la energía extra se convierte en temperatura en vez de evaporación.',
    'band.polarAntarctic': () =>
      'Alrededor de la Antártida el calentamiento es más lento: el Océano Austral mezcla el calor hacia el fondo, y los vientos que giran en torno al continente lo desplazan antes de que se acumule en la superficie.',
    'band.tropicalDamped': () =>
      'En los trópicos, buena parte de la energía extra se va en evaporación en vez de en temperatura, y esta franja es casi toda océano: el termómetro sube menos aunque el calor acumulado sea mucho.',
    'band.aboveAvg': () =>
      'Las franjas de latitud no se calientan de la misma manera: importa cuánta tierra tienen, cuánto hielo les queda por perder y cómo mueven el calor las corrientes. Esta está por encima de la media mundial.',
    'band.belowAvg': () =>
      'Las franjas de latitud no se calientan de la misma manera: importa cuánta tierra tienen, cuánto hielo les queda por perder y cómo mueven el calor las corrientes. Esta está por debajo de la media mundial.',
    'surface.sea': (v, locale) => {
      const other = v.onOther == null ? '' : ` En la misma franja, la tierra está a ${signedDegrees(v.onOther, locale)}.`;
      return `El punto cae en el mar. El agua tiene una capacidad térmica enorme y mezcla el calor hacia el fondo durante cientos de metros: el mismo exceso de energía le sube la temperatura mucho menos que en tierra firme.${other}`;
    },
    'surface.land': (v, locale) => {
      const other = v.onOther == null ? '' : ` En la misma franja, el mar está a ${signedDegrees(v.onOther, locale)}.`;
      return `El punto cae en tierra firme. El suelo solo calienta los primeros centímetros y no tiene adónde mandar el calor en profundidad; y donde está seco falta la evaporación que se lo llevaría, así que la energía se queda como temperatura.${other}`;
    },
    'point.coastMismatchSea': (v) =>
      `Pero la celda de la cuadrícula que lo mide es ${v.cellPct}% tierra: a 2° la costa no cabe en una sola celda, y el valor resultante es una mezcla de ambas superficies, mucho más cercano al de la tierra.`,
    'point.coastMismatchLand': (v) =>
      `Pero la celda de la cuadrícula que lo mide es ${v.cellPct}% agua: a 2° una costa no cabe en una sola celda, y el mar de alrededor también frena el valor de la tierra que hay dentro.`,
    'point.landDominant': (v) =>
      `Alrededor de este punto hay tierra en un ${v.landPct}%: sin un mar cercano que actúe de volante térmico, el calentamiento avanza más rápido que en la costa.${SCALE_NOTE.es}`,
    'point.waterDominant': (v) =>
      `Alrededor de este punto hay agua en un ${v.waterPct}%: la inercia térmica del mar frena también el aire que está encima.${SCALE_NOTE.es}`,
    'point.residualSmall': () =>
      `Lo que queda es poco: este punto se comporta como el resto de su franja.${SCALE_NOTE.es}`,
    'point.residualUnexplained': () =>
      `Lo que queda no tiene una única causa legible desde aquí.${SCALE_NOTE.es}`,
  },
};

export function reason(id: StepId, why: WarmingExplanation, locale: Locale): string {
  const { key, vars } = reasonKey(id, why);
  return REASON_TEXT[locale][key](vars, locale);
}
