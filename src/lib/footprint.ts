/**
 * Il tuo numero: non quanto emetti, ma **quanto puoi togliere**.
 *
 * Il pannello accanto classifica le leve del mondo, e chi non ha l'auto legge
 * «vivere senza auto» al primo posto e chiude la pagina. Sei domande bastano a
 * sapere quali opzioni sono davvero aperte a una persona, e a metterle in
 * ordine per lei.
 *
 * **Non è una calcolatrice dell'impronta, ed è una scelta.** Stimare quanto
 * emetti da sei risposte richiede una decina di fattori che dipendono dal
 * paese, dalla casa, dalla stagione: uscirebbe una cifra con due decimali e un
 * errore del trenta per cento, cioè un numero che sembra tuo e non lo è. Qui
 * ogni riga è invece una **mediana pubblicata** — Ivanova et al. 2020, che ha
 * passato in rassegna quasi settemila stime e ne ha ricavato il potenziale di
 * riduzione di ogni opzione — e il totale è la somma delle sole righe che ti
 * riguardano. È un numero più piccolo e più difendibile.
 *
 * Due cose che il totale non fa:
 *
 *   - **Non somma alternative.** Vivere senza auto e passare all'elettrico
 *     hanno la stessa mediana, 2,0: sono la stessa leva presa da due lati, e
 *     contarle entrambe raddoppierebbe un risparmio che si può avere una volta
 *     sola. Sta in una riga, con l'alternativa nella nota.
 *   - **Non chiude il conto.** L'ultima domanda non ha tonnellate, e non è una
 *     dimenticanza: è la leva di cui questo pannello sostiene da sempre che
 *     conta di più, e darle un numero inventato la indebolirebbe.
 */

export type QuestionId = 'car' | 'flights' | 'electricity' | 'home' | 'diet' | 'voice';

export interface Question {
  id: QuestionId;
  /** In ordine dal più pesante al più leggero: la prima opzione non è la neutra. */
  options: string[];
}

export const QUESTIONS: Question[] = [
  { id: 'car', options: ['combustion', 'electric', 'none'] },
  { id: 'flights', options: ['frequent', 'long', 'medium', 'none'] },
  { id: 'electricity', options: ['standard', 'renewable', 'own'] },
  { id: 'home', options: ['old', 'rented', 'renovated'] },
  { id: 'diet', options: ['meatDaily', 'meatWeekly', 'veg'] },
  { id: 'voice', options: ['never', 'sometimes', 'often'] },
];

export type Answers = Partial<Record<QuestionId, string>>;

export type LeverId =
  | 'carFree'
  | 'flightLongTwo'
  | 'flightLong'
  | 'flightMedium'
  | 'renewableElectricity'
  | 'ownElectricity'
  | 'renovation'
  | 'plantBased'
  | 'vegetarian'
  | 'voice';

/**
 * Perché una leva non compare. Sono due cose diverse e il pannello le tiene
 * distinte: «non ce l'hai» non è un merito, «lo fai già» sì.
 */
export type MissingReason = 'notApplicable' | 'alreadyDone';

export interface Lever {
  id: LeverId;
  /** t CO₂e evitate in un anno. `null` = questa leva non si misura così. */
  tonnes: number | null;
}

export interface Missing {
  id: LeverId;
  reason: MissingReason;
}

export interface Profile {
  /** Le leve aperte, dalla più pesante alla più leggera. Quella senza numero in fondo. */
  levers: Lever[];
  missing: Missing[];
  /** Somma delle sole leve con un numero. */
  total: number;
  /** Quante domande hanno una risposta: sotto il totale non si mostra niente. */
  answered: number;
}

/**
 * Le mediane, come le riporta lo studio. Stanno qui come costanti nominate e
 * non sparse nel codice, così un aggiornamento della fonte è una riga sola e
 * si vede nel diff.
 */
const MEDIAN = {
  /** Vivere senza auto — e, con la stessa mediana, passare all'elettrico. */
  carFree: 2.0,
  /** Un volo intercontinentale di andata e ritorno in meno. */
  flightLong: 1.7,
  /** Un volo di media percorrenza di andata e ritorno in meno. */
  flightMedium: 0.6,
  renewableElectricity: 1.6,
  ownElectricity: 0.6,
  renovation: 0.9,
  /** Dieta vegana. */
  plantBased: 0.9,
  /** Dieta vegetariana. */
  vegetarian: 0.5,
} as const;

export const FOOTPRINT_SOURCE = {
  primary: 'Ivanova et al. · Environmental Research Letters 2020',
  primaryUrl: 'https://iopscience.iop.org/article/10.1088/1748-9326/ab8589',
  /** Le dieci opzioni più efficaci, tutte insieme, secondo lo stesso studio. */
  topTenTotal: 9.2,
} as const;

/**
 * Chi vola spesso non ha una leva sola: la mediana è **per volo evitato**, e
 * rinunciare a due intercontinentali vale il doppio di rinunciarne a uno. È
 * l'unica moltiplicazione di questo file, e si ferma a due perché oltre si
 * comincerebbe a estrapolare invece che ad applicare.
 */
const FREQUENT_FLIGHTS_AVOIDED = 2;

export function buildProfile(answers: Answers): Profile {
  const levers: Lever[] = [];
  const missing: Missing[] = [];

  const add = (id: LeverId, tonnes: number | null) => levers.push({ id, tonnes });
  const skip = (id: LeverId, reason: MissingReason) => missing.push({ id, reason });

  switch (answers.car) {
    case 'combustion':
      add('carFree', MEDIAN.carFree);
      break;
    case 'electric':
      skip('carFree', 'alreadyDone');
      break;
    case 'none':
      skip('carFree', 'notApplicable');
      break;
  }

  switch (answers.flights) {
    case 'frequent':
      add('flightLongTwo', MEDIAN.flightLong * FREQUENT_FLIGHTS_AVOIDED);
      break;
    case 'long':
      add('flightLong', MEDIAN.flightLong);
      break;
    case 'medium':
      add('flightMedium', MEDIAN.flightMedium);
      break;
    case 'none':
      skip('flightLong', 'notApplicable');
      break;
  }

  switch (answers.electricity) {
    case 'standard':
      add('renewableElectricity', MEDIAN.renewableElectricity);
      break;
    case 'renewable':
      // Chi ha già la tariffa verde non ha finito: produrre la propria è una
      // leva distinta nello studio, e più piccola.
      add('ownElectricity', MEDIAN.ownElectricity);
      break;
    case 'own':
      skip('ownElectricity', 'alreadyDone');
      break;
  }

  switch (answers.home) {
    case 'old':
      add('renovation', MEDIAN.renovation);
      break;
    case 'renovated':
      skip('renovation', 'alreadyDone');
      break;
    case 'rented':
      // Non è una leva che hai perso: è una leva che ha qualcun altro, ed è
      // esattamente il ponte verso la parte del pannello sul voto e sulla
      // pressione collettiva.
      skip('renovation', 'notApplicable');
      break;
  }

  switch (answers.diet) {
    case 'meatDaily':
      add('plantBased', MEDIAN.plantBased);
      break;
    case 'meatWeekly':
      add('vegetarian', MEDIAN.vegetarian);
      break;
    case 'veg':
      skip('plantBased', 'alreadyDone');
      break;
  }

  // Sempre disponibile, sempre in fondo, sempre senza numero.
  if (answers.voice) add('voice', null);

  levers.sort((a, b) => (b.tonnes ?? -1) - (a.tonnes ?? -1));

  return {
    levers,
    missing,
    total: levers.reduce((sum, l) => sum + (l.tonnes ?? 0), 0),
    answered: QUESTIONS.filter((q) => answers[q.id]).length,
  };
}

/**
 * Cosa il profilo dice della classifica qui sotto, che viene da un altro
 * studio e resta nel **suo** ordine.
 *
 * Riordinarla con i numeri di Ivanova mescolerebbe due fonti dentro una
 * tabella sola, e quella tabella esiste per un confronto preciso — cosa
 * consigliano scuole e governi contro cosa funziona — che un rimescolamento
 * distruggerebbe. Quello che il profilo può dire senza toccarla è **se una
 * riga ti riguarda**, e le righe che non ti riguardano si spengono invece di
 * sparire: che «vivere senza auto» valga 2,4 t resta vero anche per chi
 * l'auto non ce l'ha.
 */
export function applicability(answers: Answers): Record<string, MissingReason | undefined> {
  return {
    carFree: answers.car === 'none' ? 'notApplicable' : answers.car === 'electric' ? 'alreadyDone' : undefined,
    electricCar:
      answers.car === 'none'
        ? 'notApplicable'
        : answers.car === 'electric'
          ? 'alreadyDone'
          : undefined,
    flight: answers.flights === 'none' ? 'notApplicable' : undefined,
    greenEnergy:
      answers.electricity === 'renewable' || answers.electricity === 'own'
        ? 'alreadyDone'
        : undefined,
    plantBased: answers.diet === 'veg' ? 'alreadyDone' : undefined,
  };
}
