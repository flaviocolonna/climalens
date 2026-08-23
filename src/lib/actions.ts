/**
 * Cosa cambia davvero, se lo si fa da soli.
 *
 * Il contrasto che regge la sezione: le due azioni che tutti raccomandano —
 * riciclare e cambiare le lampadine — stanno in fondo, dieci volte sotto quelle
 * di cui non parla nessuno. Non è un'opinione, è la tabella di Wynes & Nicholas
 * 2017, che ha confrontato l'efficacia reale con quello che scuole e governi
 * consigliano.
 *
 * **Una voce è esclusa apposta.** Lo stesso studio mette in cima «un figlio in
 * meno» a 58,6 t/anno: è la cifra più contestata del lavoro, perché attribuisce
 * al genitore una quota delle emissioni future di tutti i discendenti, con una
 * convenzione contabile che non si applica a nient'altro in questa app. Messa
 * nel grafico schiaccerebbe tutto il resto sotto una barra sola e trasformerebbe
 * una lista di scelte in un argomento morale. Il pannello dice che esiste e
 * perché non c'è, invece di toglierla in silenzio.
 *
 * Le tonnellate valgono per un paese ricco. È il motivo per cui accanto alle
 * barre ci sono due righe di riferimento: la media mondiale pro capite e la
 * quota compatibile con 1,5 °C. Vivere senza auto risparmia quanto un'intera
 * persona media emette in mezzo pianeta.
 */

export interface ClimateAction {
  id: string;
  /** t CO₂e evitate in un anno, contesto paese ricco. */
  saves: number;
  /**
   * `advised` = compare nelle raccomandazioni di scuole e governi analizzate
   * dallo studio. È la metà del confronto che rende la tabella interessante.
   */
  advised: boolean;
}

/** In ordine decrescente: l'ordine è la prima informazione della sezione. */
export const ACTIONS: ClimateAction[] = [
  { id: 'carFree', saves: 2.4, advised: false },
  { id: 'flight', saves: 1.6, advised: false },
  { id: 'greenEnergy', saves: 1.5, advised: false },
  { id: 'electricCar', saves: 1.15, advised: false },
  { id: 'plantBased', saves: 0.8, advised: true },
  { id: 'coldWash', saves: 0.25, advised: true },
  { id: 'recycle', saves: 0.21, advised: true },
  { id: 'hangDry', saves: 0.21, advised: true },
  { id: 'lightbulbs', saves: 0.1, advised: true },
];

export const ACTIONS_SOURCE = {
  primary: 'Wynes & Nicholas · Environmental Research Letters 2017',
  primaryUrl: 'https://iopscience.iop.org/article/10.1088/1748-9326/aa7541',
  corroborating: 'Ivanova et al. · Environmental Research Letters 2020',
  corroboratingUrl: 'https://iopscience.iop.org/article/10.1088/1748-9326/ab8589',
  /** La voce lasciata fuori, con il suo valore, per poterla nominare. */
  excludedChildSaves: 58.6,
} as const;

/**
 * Le due righe con cui confrontare qualunque barra.
 *
 * `worldPerCapita` rispecchia il riferimento mondiale di co2-countries.json per
 * il 2024 (uso del suolo incluso): è scritto qui a mano perché questo pannello
 * si apre dalla barra in alto e non deve tirarsi dietro 210 KB di forme per un
 * numero solo. Se quel file cambia anno, questo va aggiornato con lui.
 */
export const REFERENCES = {
  worldPerCapita: 5.29,
  worldYear: 2024,
  /**
   * Quota pro capite compatibile con 1,5 °C intorno al 2030: ~2,3 t. È un
   * ordine di grandezza ricavato dal bilancio di carbonio diviso per la
   * popolazione, non un obiettivo negoziato — e come tale va letto.
   */
  fairShare: 2.3,
} as const;

/**
 * Le leve che non si misurano in tonnellate.
 *
 * Qui non ci sono numeri, ed è deliberato: dare un valore in t CO₂e al voto o
 * al fondo pensione vorrebbe dire inventarlo. Il taglio diretto di una persona
 * è piccolo davanti a 34,7 Gt; quello che non è piccolo è che i gesti visibili
 * si propagano e che i soldi e i voti cambiano le regole di chi quelle 34,7 Gt
 * le estrae.
 */
export const MULTIPLIERS = ['vote', 'money', 'talk', 'visible'] as const;

export type MultiplierId = (typeof MULTIPLIERS)[number];
