/**
 * L'articolo giusto davanti a un numero: «il 60%», ma «l'80%» e «lo 0,9%».
 * In italiano l'articolo segue come il numero si *legge*, non come si scrive —
 * uno, otto, undici, diciotto e gli ottanta cominciano per vocale, zero per z.
 * Torna già con lo spazio quando ce ne vuole uno.
 *
 * Solo l'italiano ha bisogno di questa logica: l'inglese non elide un
 * articolo davanti a un numero, lo spagnolo usa sempre "el". Le versioni
 * inglese e spagnola delle frasi in warmingWhy.ts/areaEmissions.ts non
 * chiamano questa funzione — la grammatica è scritta direttamente nella frase.
 */
export function articleIt(value: number): string {
  const n = Math.abs(Math.trunc(value));
  if (n === 0) return 'lo ';
  if (n === 1 || n === 8 || n === 11 || n === 18 || (n >= 80 && n <= 89)) return 'l’';
  return 'il ';
}
