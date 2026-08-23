/**
 * Per-locale text for `src/lib/boundaries.ts`. Same split as the sector tree:
 * the numbers and the transgression status live once, in the data module, so a
 * translation can never move a boundary by accident. Here there are only the
 * name, the control variable in words, and the line that says why it matters.
 */
import type { Locale } from '@/i18n/locale';

export interface BoundaryText {
  name: string;
  /** The measured quantity, spelled out — the unit alone says nothing. */
  variable: string;
  note: string;
}

const TEXT: Record<Locale, Record<string, BoundaryText>> = {
  it: {
    climate: {
      name: 'Cambiamento climatico',
      variable: 'concentrazione di CO₂ in atmosfera',
      note: 'Il confine è la concentrazione oltre la quale il sistema climatico esce dalle condizioni dell’Olocene. È stato superato negli anni Ottanta.',
    },
    biosphere: {
      name: 'Integrità della biosfera',
      variable: 'estinzioni per milione di specie-anno',
      note: 'Le specie si estinguono almeno dieci volte più in fretta del limite, e cento volte più del ritmo di fondo. È il confine più sfondato dei nove.',
    },
    land: {
      name: 'Uso del suolo',
      variable: 'foresta originaria ancora in piedi',
      note: 'Le foreste rimaste rispetto a quelle di partenza. Qui il verso è opposto: si supera il limite scendendo, non salendo.',
    },
    freshwater: {
      name: 'Acqua dolce',
      variable: 'terre emerse con umidità del suolo fuori norma',
      note: 'Non quanta acqua si consuma, ma quanta superficie ha ormai un ciclo dell’acqua diverso da quello in cui è cresciuta l’agricoltura.',
    },
    biogeochemical: {
      name: 'Cicli di azoto e fosforo',
      variable: 'azoto fissato dall’industria e dall’agricoltura',
      note: 'Tre volte il limite. È l’altra faccia dei fertilizzanti: quello che le piante non prendono finisce nei fiumi e crea zone morte in mare.',
    },
    novelEntities: {
      name: 'Entità nuove',
      variable: 'sostanze di sintesi rilasciate senza soglia di sicurezza',
      note: 'Plastiche, pesticidi, PFAS, farmaci: decine di migliaia di sostanze che in natura non esistevano. Superato per definizione, perché immesse più in fretta di quanto se ne possano valutare gli effetti.',
    },
    oceanAcidification: {
      name: 'Acidificazione degli oceani',
      variable: 'saturazione di aragonite nelle acque superficiali',
      note: 'Un terzo della CO₂ emessa finisce in mare e lo acidifica. È il settimo confine superato, dichiarato tale nel 2025: sotto il limite conchiglie e coralli fanno fatica a formarsi.',
    },
    aerosols: {
      name: 'Aerosol in atmosfera',
      variable: 'differenza di opacità fra i due emisferi',
      note: 'Entro il limite a livello globale, ma sfondato in mezza Asia. Sono le stesse polveri che si respirano — e che, raffreddando, mascherano una parte del riscaldamento già causato.',
    },
    ozone: {
      name: 'Ozono stratosferico',
      variable: 'spessore della colonna di ozono',
      note: 'L’unico che sta tornando indietro. Il Protocollo di Montreal ha funzionato: è la prova che un problema ambientale globale si può chiudere.',
    },
  },
  en: {
    climate: {
      name: 'Climate change',
      variable: 'atmospheric CO₂ concentration',
      note: 'The boundary is the concentration beyond which the climate system leaves Holocene conditions. It was crossed in the 1980s.',
    },
    biosphere: {
      name: 'Biosphere integrity',
      variable: 'extinctions per million species-years',
      note: 'Species are going extinct at least ten times faster than the limit, and a hundred times faster than the background rate. It is the most decisively breached of the nine.',
    },
    land: {
      name: 'Land-system change',
      variable: 'original forest still standing',
      note: 'Forest left relative to what was there. Here the direction is reversed: the limit is crossed by falling, not by rising.',
    },
    freshwater: {
      name: 'Freshwater change',
      variable: 'land area with soil moisture outside its normal range',
      note: 'Not how much water is used, but how much of the land surface now has a water cycle different from the one agriculture grew up in.',
    },
    biogeochemical: {
      name: 'Nitrogen and phosphorus cycles',
      variable: 'nitrogen fixed by industry and agriculture',
      note: 'Three times the limit. It is the other face of fertiliser: what plants do not take up runs into rivers and creates dead zones at sea.',
    },
    novelEntities: {
      name: 'Novel entities',
      variable: 'synthetic substances released without a safe threshold',
      note: 'Plastics, pesticides, PFAS, pharmaceuticals: tens of thousands of substances that did not exist in nature. Transgressed by definition, because they are released faster than their effects can be assessed.',
    },
    oceanAcidification: {
      name: 'Ocean acidification',
      variable: 'aragonite saturation in surface waters',
      note: 'A third of emitted CO₂ ends up in the sea and acidifies it. This is the seventh boundary crossed, declared so in 2025: below the limit, shells and corals struggle to form.',
    },
    aerosols: {
      name: 'Atmospheric aerosol loading',
      variable: 'difference in optical depth between the hemispheres',
      note: 'Within the limit globally, but breached across much of Asia. These are the same particles people breathe — and which, by cooling, mask part of the warming already caused.',
    },
    ozone: {
      name: 'Stratospheric ozone depletion',
      variable: 'ozone column thickness',
      note: 'The only one moving back. The Montreal Protocol worked: it is the proof that a global environmental problem can be closed.',
    },
  },
  es: {
    climate: {
      name: 'Cambio climático',
      variable: 'concentración de CO₂ en la atmósfera',
      note: 'El límite es la concentración a partir de la cual el sistema climático sale de las condiciones del Holoceno. Se superó en los años ochenta.',
    },
    biosphere: {
      name: 'Integridad de la biosfera',
      variable: 'extinciones por millón de especies-año',
      note: 'Las especies se extinguen al menos diez veces más rápido que el límite, y cien veces más que el ritmo de fondo. Es el límite más rebasado de los nueve.',
    },
    land: {
      name: 'Cambio de uso del suelo',
      variable: 'bosque original todavía en pie',
      note: 'El bosque que queda respecto al de partida. Aquí el sentido se invierte: el límite se supera bajando, no subiendo.',
    },
    freshwater: {
      name: 'Agua dulce',
      variable: 'superficie con humedad del suelo fuera de rango',
      note: 'No cuánta agua se consume, sino cuánta superficie tiene ya un ciclo del agua distinto de aquel en el que creció la agricultura.',
    },
    biogeochemical: {
      name: 'Ciclos del nitrógeno y el fósforo',
      variable: 'nitrógeno fijado por la industria y la agricultura',
      note: 'Tres veces el límite. Es la otra cara de los fertilizantes: lo que las plantas no absorben acaba en los ríos y crea zonas muertas en el mar.',
    },
    novelEntities: {
      name: 'Entidades nuevas',
      variable: 'sustancias sintéticas liberadas sin umbral seguro',
      note: 'Plásticos, pesticidas, PFAS, fármacos: decenas de miles de sustancias que no existían en la naturaleza. Superado por definición, porque se liberan más rápido de lo que se pueden evaluar sus efectos.',
    },
    oceanAcidification: {
      name: 'Acidificación de los océanos',
      variable: 'saturación de aragonito en aguas superficiales',
      note: 'Un tercio del CO₂ emitido acaba en el mar y lo acidifica. Es el séptimo límite superado, declarado así en 2025: por debajo del umbral, conchas y corales tienen dificultades para formarse.',
    },
    aerosols: {
      name: 'Aerosoles en la atmósfera',
      variable: 'diferencia de opacidad entre los dos hemisferios',
      note: 'Dentro del límite a nivel global, pero rebasado en buena parte de Asia. Son las mismas partículas que se respiran — y que, al enfriar, enmascaran parte del calentamiento ya causado.',
    },
    ozone: {
      name: 'Ozono estratosférico',
      variable: 'espesor de la columna de ozono',
      note: 'El único que va hacia atrás. El Protocolo de Montreal funcionó: es la prueba de que un problema ambiental global se puede cerrar.',
    },
  },
};

export function boundaryText(id: string, locale: Locale): BoundaryText {
  return TEXT[locale][id] ?? TEXT.en[id] ?? { name: id, variable: '', note: '' };
}
