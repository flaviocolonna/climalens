/**
 * I testi degli otto passaggi del percorso. Stanno qui e non nel dizionario
 * piatto perché sono prosa lunga, uno per passo, e vivono e muoiono con
 * `src/lib/tour.ts`.
 */
import type { Locale } from '@/i18n/locale';

export interface StepText {
  title: string;
  body: string;
}

const STEPS: Record<Locale, Record<string, StepText>> = {
  it: {
    now: {
      title: 'Questo è adesso',
      body: 'Ogni cella è quanto quel pezzo di mondo si è scaldato rispetto alla media 1951-1980. Il rosso non è caldo: è caldo *in più*.',
    },
    then: {
      title: 'La stessa mappa, 75 anni fa',
      body: 'Quasi tutta bianca. Non è un’altra scala né un altro strumento: sono gli stessi dati, spostati indietro sulla linea del tempo.',
    },
    place: {
      title: 'Ora guarda casa tua',
      body: 'Cerca un luogo o clicca un punto qualsiasi: il pannello dice di quanto si è scaldato lì, quanti giorni sopra i 30 °C in più ci sono oggi, che aria si respira — e, se scrivi l’anno di nascita, quanto è successo mentre c’eri.',
    },
    causes: {
      title: 'E adesso ribalta la domanda',
      body: 'Questa è la quota di tutta la CO₂ emessa dal 1750, paese per paese. Confrontala con la prima mappa: non si somigliano affatto. Chi ha scaldato e chi si scalda sono due liste diverse.',
    },
    breathe: {
      title: 'La CO₂ non si respira',
      body: 'Il PM2.5 sì, e uccide adesso. Anche questa mappa è diversa dalle altre due — e le classi non sono numeri tondi ma la soglia dell’OMS e i suoi quattro obiettivi intermedi.',
    },
    cope: {
      title: 'Chi può permettersi di reggerlo',
      body: 'Esposizione più capacità di adattarsi. È la terza mappa che non somiglia alle altre, e insieme fanno l’argomento intero: subisce di più chi ha causato di meno e può difendersi di meno.',
    },
    sectors: {
      title: 'Da cosa viene, davvero',
      body: 'Tre modi di tagliare la stessa torta: da dove esce il gas, a cosa serviva, e chi ha estratto il carbonio. Sono la stessa quantità vista da tre punti diversi — non si sommano, e il pannello lo dice.',
    },
    ahead: {
      title: 'Dove porta questa strada',
      body: 'Cinque scenari, tre gradi di differenza fra il primo e l’ultimo. E, sotto, quello che è già cambiato: il fotovoltaico è calato del 99,8% da quando esiste.',
    },
    you: {
      title: 'E tu?',
      body: 'Le azioni in ordine di quanto pesano davvero — con le due che tutti raccomandano in fondo — e le leve che non si misurano in tonnellate. Fine del percorso: da qui in poi la mappa è tua.',
    },
  },
  en: {
    now: {
      title: 'This is now',
      body: 'Each cell is how much that patch of world has warmed against the 1951-1980 average. Red does not mean hot: it means *hotter than it was*.',
    },
    then: {
      title: 'The same map, 75 years ago',
      body: 'Almost entirely white. Not a different scale or a different instrument: the same data, moved back along the timeline.',
    },
    place: {
      title: 'Now look at where you live',
      body: 'Search a place or click anywhere: the panel says how much it warmed there, how many more days above 30 °C there are now, what the air is like — and, if you type your year of birth, how much of it happened while you were here.',
    },
    causes: {
      title: 'Now flip the question',
      body: 'This is the share of all CO₂ emitted since 1750, country by country. Compare it with the first map: they look nothing alike. Who did the warming and who gets warmed are two different lists.',
    },
    breathe: {
      title: 'You do not breathe CO₂',
      body: 'You do breathe PM2.5, and it kills now. This map is different from the other two as well — and the classes are not round numbers but the WHO guideline and its four interim targets.',
    },
    cope: {
      title: 'Who can afford to cope',
      body: 'Exposure plus the capacity to adapt. It is the third map that resembles neither of the others, and together they make the whole argument: those hit hardest caused the least and can defend themselves least.',
    },
    sectors: {
      title: 'Where it actually comes from',
      body: 'Three ways of cutting the same pie: where the gas comes out, what it was for, and who pulled the carbon out of the ground. Same quantity from three angles — they do not add up, and the panel says so.',
    },
    ahead: {
      title: 'Where this road leads',
      body: 'Five scenarios, three degrees between the first and the last. And below them, what has already changed: solar has fallen 99.8% since it existed.',
    },
    you: {
      title: 'And you?',
      body: 'The actions ranked by what they are actually worth — with the two everyone recommends at the bottom — and the levers that are not measured in tonnes. End of the tour: the map is yours from here.',
    },
  },
  es: {
    now: {
      title: 'Esto es ahora',
      body: 'Cada celda es cuánto se ha calentado ese trozo de mundo respecto a la media de 1951-1980. El rojo no es calor: es calor *de más*.',
    },
    then: {
      title: 'El mismo mapa, hace 75 años',
      body: 'Casi todo blanco. No es otra escala ni otro instrumento: son los mismos datos, movidos atrás en la línea de tiempo.',
    },
    place: {
      title: 'Ahora mira dónde vives',
      body: 'Busca un lugar o haz clic en cualquier punto: el panel dice cuánto se calentó allí, cuántos días por encima de 30 °C hay de más hoy, qué aire se respira — y, si escribes tu año de nacimiento, cuánto pasó mientras tú estabas.',
    },
    causes: {
      title: 'Y ahora dale la vuelta a la pregunta',
      body: 'Esta es la cuota de todo el CO₂ emitido desde 1750, país por país. Compárala con el primer mapa: no se parecen en nada. Quién calentó y quién se calienta son dos listas distintas.',
    },
    breathe: {
      title: 'El CO₂ no se respira',
      body: 'El PM2.5 sí, y mata ahora. Este mapa también es distinto de los otros dos — y las clases no son números redondos sino el umbral de la OMS y sus cuatro objetivos intermedios.',
    },
    cope: {
      title: 'Quién puede permitirse aguantarlo',
      body: 'Exposición más capacidad de adaptarse. Es el tercer mapa que no se parece a ninguno de los otros, y juntos forman el argumento entero: sufre más quien menos causó y menos puede defenderse.',
    },
    sectors: {
      title: 'De dónde viene, de verdad',
      body: 'Tres formas de cortar la misma tarta: por dónde sale el gas, para qué servía, y quién extrajo el carbono. La misma cantidad desde tres ángulos — no se suman, y el panel lo dice.',
    },
    ahead: {
      title: 'Adónde lleva este camino',
      body: 'Cinco escenarios, tres grados entre el primero y el último. Y debajo, lo que ya ha cambiado: la fotovoltaica ha caído un 99,8% desde que existe.',
    },
    you: {
      title: '¿Y tú?',
      body: 'Las acciones ordenadas por lo que valen de verdad — con las dos que todo el mundo recomienda al final — y las palancas que no se miden en toneladas. Fin del recorrido: a partir de aquí el mapa es tuyo.',
    },
  },
};

export function stepText(id: string, locale: Locale): StepText {
  return STEPS[locale][id] ?? STEPS.en[id] ?? { title: id, body: '' };
}
