/**
 * Le domande, le risposte e le leve del profilo personale.
 *
 * Stanno qui e non in it.ts / en.ts / es.ts perché non sono cromatura
 * dell'interfaccia: sono il contenuto, e vivono in blocchi che si leggono
 * insieme. Le tonnellate invece non passano mai di qui — sono in
 * src/lib/footprint.ts — così una traduzione non può spostare un numero.
 */
import type { Locale } from '@/i18n/locale';
import type { LeverId, MissingReason, QuestionId } from '@/lib/footprint';

interface QuestionText {
  prompt: string;
  options: Record<string, string>;
}

const QUESTIONS: Record<Locale, Record<QuestionId, QuestionText>> = {
  it: {
    car: {
      prompt: 'Come ti sposti su strada?',
      options: {
        combustion: 'Auto a benzina, diesel o ibrida',
        electric: 'Auto elettrica',
        none: 'Non ho l’auto',
      },
    },
    flights: {
      prompt: 'Quanto voli in un anno?',
      options: {
        frequent: 'Tre o più voli intercontinentali',
        long: 'Uno o due intercontinentali',
        medium: 'Solo voli entro il continente',
        none: 'Non volo',
      },
    },
    electricity: {
      prompt: 'Da dove arriva la tua elettricità?',
      options: {
        standard: 'Tariffa standard',
        renewable: 'Tariffa 100% rinnovabile',
        own: 'La produco io',
      },
    },
    home: {
      prompt: 'Com’è la casa in cui vivi?',
      options: {
        old: 'Da isolare o ristrutturare',
        rented: 'In affitto: non decido io',
        renovated: 'Isolata o ristrutturata di recente',
      },
    },
    diet: {
      prompt: 'Quanta carne mangi?',
      options: {
        meatDaily: 'Quasi tutti i giorni',
        meatWeekly: 'Qualche volta a settimana',
        veg: 'Vegetariana o vegana',
      },
    },
    voice: {
      prompt: 'Ne hai mai parlato con qualcuno?',
      options: {
        never: 'Mai',
        sometimes: 'Ogni tanto, con chi la pensa come me',
        often: 'Sì, anche con chi decide qualcosa',
      },
    },
  },
  en: {
    car: {
      prompt: 'How do you get around by road?',
      options: {
        combustion: 'Petrol, diesel or hybrid car',
        electric: 'Electric car',
        none: 'I don’t have a car',
      },
    },
    flights: {
      prompt: 'How much do you fly in a year?',
      options: {
        frequent: 'Three or more long-haul flights',
        long: 'One or two long-haul',
        medium: 'Only flights within the continent',
        none: 'I don’t fly',
      },
    },
    electricity: {
      prompt: 'Where does your electricity come from?',
      options: {
        standard: 'Standard tariff',
        renewable: '100% renewable tariff',
        own: 'I generate my own',
      },
    },
    home: {
      prompt: 'What is the place you live in like?',
      options: {
        old: 'Needs insulating or refurbishing',
        rented: 'Rented: not my call',
        renovated: 'Recently insulated or refurbished',
      },
    },
    diet: {
      prompt: 'How much meat do you eat?',
      options: {
        meatDaily: 'Most days',
        meatWeekly: 'A few times a week',
        veg: 'Vegetarian or vegan',
      },
    },
    voice: {
      prompt: 'Have you ever talked to anyone about it?',
      options: {
        never: 'Never',
        sometimes: 'Now and then, with people who agree',
        often: 'Yes, including people who decide things',
      },
    },
  },
  es: {
    car: {
      prompt: '¿Cómo te mueves por carretera?',
      options: {
        combustion: 'Coche de gasolina, diésel o híbrido',
        electric: 'Coche eléctrico',
        none: 'No tengo coche',
      },
    },
    flights: {
      prompt: '¿Cuánto vuelas al año?',
      options: {
        frequent: 'Tres o más vuelos intercontinentales',
        long: 'Uno o dos intercontinentales',
        medium: 'Solo vuelos dentro del continente',
        none: 'No vuelo',
      },
    },
    electricity: {
      prompt: '¿De dónde viene tu electricidad?',
      options: {
        standard: 'Tarifa estándar',
        renewable: 'Tarifa 100% renovable',
        own: 'La produzco yo',
      },
    },
    home: {
      prompt: '¿Cómo es la casa en la que vives?',
      options: {
        old: 'Por aislar o reformar',
        rented: 'De alquiler: no decido yo',
        renovated: 'Aislada o reformada hace poco',
      },
    },
    diet: {
      prompt: '¿Cuánta carne comes?',
      options: {
        meatDaily: 'Casi todos los días',
        meatWeekly: 'Algunas veces por semana',
        veg: 'Vegetariana o vegana',
      },
    },
    voice: {
      prompt: '¿Has hablado alguna vez de esto con alguien?',
      options: {
        never: 'Nunca',
        sometimes: 'De vez en cuando, con quien piensa igual',
        often: 'Sí, también con quien decide algo',
      },
    },
  },
};

interface LeverText {
  name: string;
  note: string;
}

const LEVERS: Record<Locale, Record<LeverId, LeverText>> = {
  it: {
    carFree: {
      name: 'Vivere senza auto',
      note: 'La mediana più alta dello studio. Se rinunciarci non è possibile, passare a un’elettrica vale lo stesso — 2,0 — ed è la stessa leva presa dall’altro lato: nel totale conta una volta.',
    },
    flightLongTwo: {
      name: 'Due voli intercontinentali in meno',
      note: 'La mediana è per volo evitato, andata e ritorno. Chi ne fa tre o più ha davanti la leva più grande di tutta la lista, e nessuna delle altre le si avvicina.',
    },
    flightLong: {
      name: 'Un volo intercontinentale in meno',
      note: 'Andata e ritorno. Un solo viaggio pesa quanto un anno intero di scelte alimentari, ed è il confronto che questa lista serve a rendere visibile.',
    },
    flightMedium: {
      name: 'Un volo continentale in meno',
      note: 'Andata e ritorno su media distanza: meno di un terzo di un intercontinentale, ma è la sola leva di volo che ti riguarda.',
    },
    renewableElectricity: {
      name: 'Elettricità da fonte rinnovabile',
      note: 'Cambiare fornitore è la leva più grande che si tira in un pomeriggio. Vale solo dove il contratto è davvero legato a produzione nuova, non a certificati comprati a valle.',
    },
    ownElectricity: {
      name: 'Produrre la propria elettricità',
      note: 'Hai già la tariffa verde: il gradino successivo è generarla. Vale meno — la parte facile l’hai già fatta — ma è quello che aggiunge capacità invece di spostarla.',
    },
    renovation: {
      name: 'Isolare e ristrutturare casa',
      note: 'Costosa e lenta, e per questo quasi mai nelle liste di consigli. È l’unica leva della lista che continua a valere dopo che tu te ne sei andato.',
    },
    plantBased: {
      name: 'Dieta vegetale',
      note: 'La riga più citata e non la più pesante: sotto ai voli e all’auto. Vale ogni giorno, però, e non richiede di comprare niente.',
    },
    vegetarian: {
      name: 'Dieta vegetariana',
      note: 'Mangi già carne solo qualche volta: il passo che ti resta è più corto, e la mediana lo dice.',
    },
    voice: {
      name: 'Parlarne, votare, spostare i risparmi',
      note: 'Senza tonnellate, e non per dimenticanza: attribuire una cifra al voto o al fondo pensione vorrebbe dire inventarla. È l’unica leva della lista che agisce su chi le emissioni le decide.',
    },
  },
  en: {
    carFree: {
      name: 'Living car-free',
      note: 'The highest median in the study. If giving it up is not an option, switching to an electric car is worth the same — 2.0 — and it is the same lever from the other side: the total counts it once.',
    },
    flightLongTwo: {
      name: 'Two fewer long-haul flights',
      note: 'The median is per flight avoided, return. Anyone taking three or more is looking at the largest lever on the whole list, and nothing else comes close.',
    },
    flightLong: {
      name: 'One fewer long-haul flight',
      note: 'Return trip. A single journey weighs as much as a whole year of food choices, and that comparison is what this list exists to make visible.',
    },
    flightMedium: {
      name: 'One fewer continental flight',
      note: 'A medium-distance return: under a third of a long-haul one, but it is the only flying lever that applies to you.',
    },
    renewableElectricity: {
      name: 'Renewable electricity',
      note: 'Switching supplier is the biggest lever you can pull in an afternoon. It only counts where the contract is genuinely tied to new generation, rather than to certificates bought downstream.',
    },
    ownElectricity: {
      name: 'Generating your own electricity',
      note: 'You already have the green tariff: the next step is making it. It is worth less — you have done the easy part — but it adds capacity instead of moving it around.',
    },
    renovation: {
      name: 'Insulating and refurbishing',
      note: 'Expensive and slow, which is why it is almost never on the advice lists. It is the only lever here that keeps working after you have moved out.',
    },
    plantBased: {
      name: 'Plant-based diet',
      note: 'The most quoted line and not the heaviest one: below flying and below the car. It does count every single day, though, and it asks you to buy nothing.',
    },
    vegetarian: {
      name: 'Vegetarian diet',
      note: 'You already eat meat only now and then: the step left is shorter, and the median says so.',
    },
    voice: {
      name: 'Talking, voting, moving your savings',
      note: 'No tonnes, and not by oversight: putting a figure on a vote or a pension fund would mean inventing one. It is the only lever here that acts on the people who decide the emissions.',
    },
  },
  es: {
    carFree: {
      name: 'Vivir sin coche',
      note: 'La mediana más alta del estudio. Si renunciar no es posible, pasarse a uno eléctrico vale lo mismo — 2,0 — y es la misma palanca por el otro lado: en el total cuenta una vez.',
    },
    flightLongTwo: {
      name: 'Dos vuelos intercontinentales menos',
      note: 'La mediana es por vuelo evitado, ida y vuelta. Quien hace tres o más tiene delante la palanca más grande de toda la lista, y ninguna otra se le acerca.',
    },
    flightLong: {
      name: 'Un vuelo intercontinental menos',
      note: 'Ida y vuelta. Un solo viaje pesa tanto como un año entero de decisiones alimentarias, y ese contraste es lo que esta lista sirve para hacer visible.',
    },
    flightMedium: {
      name: 'Un vuelo continental menos',
      note: 'Ida y vuelta en media distancia: menos de un tercio de uno intercontinental, pero es la única palanca de vuelo que te afecta.',
    },
    renewableElectricity: {
      name: 'Electricidad de fuente renovable',
      note: 'Cambiar de compañía es la palanca más grande que se acciona en una tarde. Solo vale donde el contrato está atado de verdad a generación nueva, y no a certificados comprados aguas abajo.',
    },
    ownElectricity: {
      name: 'Producir tu propia electricidad',
      note: 'Ya tienes la tarifa verde: el siguiente escalón es generarla. Vale menos — la parte fácil ya está hecha — pero añade capacidad en lugar de moverla.',
    },
    renovation: {
      name: 'Aislar y reformar la casa',
      note: 'Cara y lenta, y por eso casi nunca aparece en las listas de consejos. Es la única palanca de aquí que sigue valiendo después de que tú te hayas ido.',
    },
    plantBased: {
      name: 'Dieta vegetal',
      note: 'La línea más citada y no la más pesada: por debajo de los vuelos y del coche. Eso sí, cuenta todos los días, y no te pide comprar nada.',
    },
    vegetarian: {
      name: 'Dieta vegetariana',
      note: 'Ya comes carne solo de vez en cuando: el paso que queda es más corto, y la mediana lo dice.',
    },
    voice: {
      name: 'Hablarlo, votar, mover tus ahorros',
      note: 'Sin toneladas, y no por olvido: poner una cifra al voto o al fondo de pensiones sería inventarla. Es la única palanca de aquí que actúa sobre quien decide las emisiones.',
    },
  },
};

/** Perché una leva non compare, detto per esteso e non con un’etichetta sola. */
const MISSING: Record<Locale, Partial<Record<LeverId, Record<MissingReason, string>>>> = {
  it: {
    carFree: {
      notApplicable: 'Non hai l’auto: la leva più grande della lista non ti riguarda, ed è già un vantaggio.',
      alreadyDone: 'Guidi già elettrico: metà della leva l’hai presa.',
    },
    flightLong: {
      notApplicable: 'Non voli. È la voce che pesa di più per chi vola, e non compare nel tuo conto.',
      alreadyDone: '',
    },
    ownElectricity: {
      notApplicable: '',
      alreadyDone: 'Produci già la tua elettricità: su questo fronte non è rimasto niente da tirare.',
    },
    renovation: {
      notApplicable:
        'In affitto la ristrutturazione la decide chi possiede la casa. Non è una leva che hai perso: è una leva che ha qualcun altro — e per quelle c’è la parte qui sotto.',
      alreadyDone: 'Casa già isolata: questa l’hai fatta.',
    },
    plantBased: {
      notApplicable: '',
      alreadyDone: 'Mangi già senza carne: la riga più citata di tutte l’hai già presa.',
    },
  },
  en: {
    carFree: {
      notApplicable: 'You have no car: the biggest lever on the list does not apply to you, and that is already an advantage.',
      alreadyDone: 'You already drive electric: half of the lever is taken.',
    },
    flightLong: {
      notApplicable: 'You do not fly. It is the heaviest item for those who do, and it is absent from your tally.',
      alreadyDone: '',
    },
    ownElectricity: {
      notApplicable: '',
      alreadyDone: 'You already generate your own electricity: nothing left to pull on this front.',
    },
    renovation: {
      notApplicable:
        'In a rented home, refurbishment is the owner’s call. Not a lever you have lost: a lever somebody else holds — and those are what the section below is about.',
      alreadyDone: 'Already insulated: this one is done.',
    },
    plantBased: {
      notApplicable: '',
      alreadyDone: 'You already eat without meat: the most quoted line of them all is taken.',
    },
  },
  es: {
    carFree: {
      notApplicable: 'No tienes coche: la palanca más grande de la lista no te afecta, y eso ya es una ventaja.',
      alreadyDone: 'Ya conduces eléctrico: media palanca está tomada.',
    },
    flightLong: {
      notApplicable: 'No vuelas. Es lo que más pesa para quien vuela, y no aparece en tu cuenta.',
      alreadyDone: '',
    },
    ownElectricity: {
      notApplicable: '',
      alreadyDone: 'Ya produces tu electricidad: por aquí no queda nada que accionar.',
    },
    renovation: {
      notApplicable:
        'De alquiler, la reforma la decide quien posee la casa. No es una palanca que hayas perdido: es una palanca que tiene otro — y de esas va la parte de abajo.',
      alreadyDone: 'Casa ya aislada: esta está hecha.',
    },
    plantBased: {
      notApplicable: '',
      alreadyDone: 'Ya comes sin carne: la línea más citada de todas ya está tomada.',
    },
  },
};

export function questionText(id: QuestionId, locale: Locale): QuestionText {
  return QUESTIONS[locale][id];
}

export function leverText(id: LeverId, locale: Locale): LeverText {
  return LEVERS[locale][id];
}

export function missingText(id: LeverId, reason: MissingReason, locale: Locale): string {
  return MISSING[locale][id]?.[reason] ?? '';
}
