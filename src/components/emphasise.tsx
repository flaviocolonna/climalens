/**
 * Il grassetto dentro una stringa tradotta.
 *
 * Le traduzioni hanno bisogno di poter spostare l'enfasi dove la loro sintassi
 * la mette, e spezzare la frase in tre chiavi lo impedirebbe. Marcatore minimo,
 * nessun HTML in ingresso: quello che sta fra `**` diventa un `<strong>`, tutto
 * il resto è testo.
 *
 * **Attenzione a dove si usa.** Vale solo per il testo che passa di qui: una
 * stringa con i marcatori mostrata altrove — la didascalia di una metrica sulla
 * mappa, per esempio — stampa gli asterischi così come sono.
 */
export function emphasise(text: string): React.ReactNode {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-medium text-white">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}
