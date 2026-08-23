/**
 * Per-locale text for `src/lib/actions.ts` and the multiplier levers. Same
 * split as the sectors and the boundaries: the tonnes live once, in the data
 * module, so no translation can move a number by accident.
 */
import type { Locale } from '@/i18n/locale';

export interface ActionText {
  name: string;
  /** One line of context — what the figure actually covers. */
  note: string;
}

const ACTION_TEXT: Record<Locale, Record<string, ActionText>> = {
  it: {
    carFree: {
      name: 'Vivere senza auto',
      note: 'La voce più grande, e quella che dipende di più da dove abiti: in una città con i mezzi è una scelta, in un paese di campagna non è disponibile.',
    },
    flight: {
      name: 'Un volo transatlantico in meno',
      note: 'Andata e ritorno. Un solo viaggio pesa quanto sette anni di raccolta differenziata.',
    },
    greenEnergy: {
      name: 'Elettricità rinnovabile',
      note: 'Cambiare fornitore, non pannelli sul tetto. Vale tanto quanto quello che consumi e quanto è sporca la rete di partenza.',
    },
    electricCar: {
      name: 'Passare all’auto elettrica',
      note: 'Meno che rinunciare all’auto, più che tutto il resto messo insieme. Dipende da com’è fatta l’elettricità del posto.',
    },
    plantBased: {
      name: 'Dieta vegetale',
      note: 'La metà delle emissioni del cibo viene dagli animali, che occupano l’83% dei terreni agricoli e danno il 18% delle calorie.',
    },
    coldWash: { name: 'Lavare a freddo', note: 'Quasi tutta l’energia di una lavatrice serve a scaldare l’acqua.' },
    recycle: {
      name: 'Riciclare',
      note: 'Utile, e raccomandato ovunque. Ma vale un dodicesimo di rinunciare all’auto.',
    },
    hangDry: { name: 'Stendere invece di asciugare', note: 'Stesso ordine di grandezza del riciclo.' },
    lightbulbs: {
      name: 'Cambiare le lampadine',
      note: 'L’azione più citata dalle campagne, e l’ultima della lista: ventiquattro volte sotto la prima.',
    },
  },
  en: {
    carFree: {
      name: 'Living car-free',
      note: 'The biggest item, and the one that depends most on where you live: in a city with transit it is a choice, in a rural village it is not on offer.',
    },
    flight: {
      name: 'One fewer transatlantic flight',
      note: 'Round trip. A single journey weighs as much as seven years of recycling.',
    },
    greenEnergy: {
      name: 'Renewable electricity',
      note: 'Switching supplier, not panels on the roof. Worth as much as you consume, and as dirty as the grid you start from.',
    },
    electricCar: {
      name: 'Switching to an electric car',
      note: 'Less than giving up the car, more than everything else combined. Depends on how the local electricity is made.',
    },
    plantBased: {
      name: 'Plant-based diet',
      note: 'Half of food emissions come from animals, which take up 83% of farmland and provide 18% of calories.',
    },
    coldWash: { name: 'Washing in cold water', note: 'Almost all of a washing machine’s energy goes into heating water.' },
    recycle: {
      name: 'Recycling',
      note: 'Useful, and recommended everywhere. But worth a twelfth of giving up the car.',
    },
    hangDry: { name: 'Hang-drying laundry', note: 'The same order of magnitude as recycling.' },
    lightbulbs: {
      name: 'Changing lightbulbs',
      note: 'The action campaigns mention most, and the last on the list: twenty-four times below the first.',
    },
  },
  es: {
    carFree: {
      name: 'Vivir sin coche',
      note: 'La partida más grande, y la que más depende de dónde vives: en una ciudad con transporte es una elección, en un pueblo no está disponible.',
    },
    flight: {
      name: 'Un vuelo transatlántico menos',
      note: 'Ida y vuelta. Un solo viaje pesa lo mismo que siete años de reciclaje.',
    },
    greenEnergy: {
      name: 'Electricidad renovable',
      note: 'Cambiar de compañía, no paneles en el tejado. Vale tanto como lo que consumes y como de sucia sea la red de partida.',
    },
    electricCar: {
      name: 'Pasar al coche eléctrico',
      note: 'Menos que renunciar al coche, más que todo lo demás junto. Depende de cómo se hace la electricidad del lugar.',
    },
    plantBased: {
      name: 'Dieta vegetal',
      note: 'La mitad de las emisiones de la comida viene de los animales, que ocupan el 83% de la tierra agrícola y dan el 18% de las calorías.',
    },
    coldWash: { name: 'Lavar en frío', note: 'Casi toda la energía de una lavadora sirve para calentar el agua.' },
    recycle: {
      name: 'Reciclar',
      note: 'Útil, y recomendado en todas partes. Pero vale una doceava parte de renunciar al coche.',
    },
    hangDry: { name: 'Tender en vez de secadora', note: 'El mismo orden de magnitud que el reciclaje.' },
    lightbulbs: {
      name: 'Cambiar las bombillas',
      note: 'La acción que más citan las campañas, y la última de la lista: veinticuatro veces por debajo de la primera.',
    },
  },
};

export interface MultiplierText {
  name: string;
  note: string;
}

const MULTIPLIER_TEXT: Record<Locale, Record<string, MultiplierText>> = {
  it: {
    vote: {
      name: 'Votare, e non solo alle politiche',
      note: 'Le regole su cosa si può estrarre, costruire e vendere le scrive qualcuno. È la leva con cui una persona sola tocca le 34,7 Gt invece delle sue due.',
    },
    money: {
      name: 'Spostare i soldi',
      note: 'Conto, banca, fondo pensione. Chi presta capitale a chi estrae decide quanto costa estrarre. Attenzione ai moltiplicatori che girano — «21 volte più efficace» è un numero di campagna, non di letteratura.',
    },
    talk: {
      name: 'Parlarne',
      note: 'La cosa che quasi nessuno fa: la maggioranza delle persone è preoccupata e crede di essere in minoranza. Dirlo ad alta voce corregge un errore di percezione condiviso.',
    },
    visible: {
      name: 'Fare cose che si vedono',
      note: 'I pannelli solari si installano a grappoli fra vicini. Un gesto visibile vale più del suo peso in CO₂ perché sposta quello che agli altri sembra normale.',
    },
  },
  en: {
    vote: {
      name: 'Voting, and not only nationally',
      note: 'Somebody writes the rules on what can be extracted, built and sold. It is the lever with which one person touches the 34.7 Gt instead of their own two.',
    },
    money: {
      name: 'Moving your money',
      note: 'Account, bank, pension fund. Whoever lends capital to the extractors sets what extraction costs. Beware the multipliers going around — "21 times more effective" is a campaign figure, not a peer-reviewed one.',
    },
    talk: {
      name: 'Talking about it',
      note: 'The thing almost nobody does: most people are worried and believe they are in the minority. Saying it out loud corrects a shared misperception.',
    },
    visible: {
      name: 'Doing things that are visible',
      note: 'Solar panels get installed in clusters among neighbours. A visible act is worth more than its weight in CO₂ because it moves what looks normal to everyone else.',
    },
  },
  es: {
    vote: {
      name: 'Votar, y no solo en las generales',
      note: 'Alguien escribe las reglas sobre qué se puede extraer, construir y vender. Es la palanca con la que una persona toca las 34,7 Gt en vez de sus dos.',
    },
    money: {
      name: 'Mover el dinero',
      note: 'Cuenta, banco, fondo de pensiones. Quien presta capital a quien extrae decide cuánto cuesta extraer. Cuidado con los multiplicadores que circulan: «21 veces más eficaz» es una cifra de campaña, no de literatura científica.',
    },
    talk: {
      name: 'Hablar de ello',
      note: 'Lo que casi nadie hace: la mayoría está preocupada y cree estar en minoría. Decirlo en voz alta corrige un error de percepción compartido.',
    },
    visible: {
      name: 'Hacer cosas que se vean',
      note: 'Las placas solares se instalan en racimos entre vecinos. Un gesto visible vale más que su peso en CO₂ porque mueve lo que a los demás les parece normal.',
    },
  },
};

export function actionText(id: string, locale: Locale): ActionText {
  return ACTION_TEXT[locale][id] ?? ACTION_TEXT.en[id] ?? { name: id, note: '' };
}

export function multiplierText(id: string, locale: Locale): MultiplierText {
  return MULTIPLIER_TEXT[locale][id] ?? MULTIPLIER_TEXT.en[id] ?? { name: id, note: '' };
}
