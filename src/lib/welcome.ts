/**
 * Il benvenuto: quando si mostra, e quando invece è meglio tacere.
 *
 * Una schermata che spiega l'app serve, perché ClimaLens si apre su una mappa
 * scura e cinque schede senza dire cosa sia. Ma la stessa schermata, mostrata
 * al momento sbagliato, è la cosa più fastidiosa che un sito possa fare. Le
 * tre regole che la tengono dalla parte giusta stanno qui.
 *
 * 1. **Una volta sola**, non una per sessione: `localStorage`, con lo stesso
 *    riguardo che il modulo della lingua usa per la navigazione privata — se
 *    la memoria non c'è, la scelta semplicemente non si ricorda, e non è un
 *    errore.
 * 2. **Mai davanti a un link condiviso.** Chi apre `?panel=actions` o
 *    `?lat=…&lon=…` sta seguendo un dito puntato su qualcosa: metterci davanti
 *    una presentazione è come rispondere a una domanda con la propria
 *    biografia.
 * 3. **Riapribile.** Chi la chiude di fretta deve poterla ritrovare, o la
 *    spiegazione è persa per sempre: il nome nella barra in alto la riporta.
 */
import type { UrlState } from '@/lib/urlState';

const STORAGE_KEY = 'climalens.welcomed';

export function hasBeenWelcomed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    // Navigazione privata o memoria disattivata: si comporta come una prima
    // visita, che è il verso giusto in cui sbagliare.
    return false;
  }
}

export function rememberWelcome(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Niente da fare: il saluto tornerà alla prossima visita.
  }
}

/**
 * `year` non conta come stato condiviso, ed è deliberato: l'app lo riscrive
 * nell'URL da sola a ogni scatto, quindi dopo mezzo secondo dalla prima
 * apertura *ogni* indirizzo ne ha uno. Usarlo come segnale di intenzione
 * significherebbe non salutare mai nessuno che ha ricaricato la pagina.
 *
 * Gli altri quattro compaiono solo se qualcuno li ha messi lì apposta.
 */
export function shouldWelcome(url: UrlState): boolean {
  if (url.place || url.panel || url.metric || url.tour !== null) return false;
  return !hasBeenWelcomed();
}
