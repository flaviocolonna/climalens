/**
 * Frasi dinamiche di AreaEmissions.tsx — quelle che in italiano si appoggiano
 * su `articleIt()` (l'articolo elide davanti ai numeri). L'inglese non ha
 * bisogno di un articolo qui, lo spagnolo usa sempre "el"/"al": non è una
 * sostituzione di parola, è grammatica diversa, quindi ogni lingua ha la sua
 * frase intera invece di un template condiviso con un buco per l'articolo.
 */
import { LOCALE_TAG, type Locale } from '@/i18n/locale';
import { emissionsMass, share, times } from '@/lib/emissionsProfile';
import { articleIt } from '@/i18n/content/itGrammar';

export function contributionDetail(
  vars: { tmpShare?: number; popShare?: number },
  locale: Locale,
): string {
  const { tmpShare, popShare } = vars;
  if (locale === 'it') {
    let s = 'di riscaldamento globale attribuibile ai gas serra emessi qui dal 1851';
    if (tmpShare !== undefined) s += `: ${articleIt(tmpShare)}${share(tmpShare, locale)} del totale attribuito`;
    if (popShare !== undefined) s += `, con ${articleIt(popShare)}${share(popShare, locale)} della popolazione mondiale`;
    return `${s}.`;
  }
  if (locale === 'es') {
    let s = 'de calentamiento global atribuible a los gases de efecto invernadero emitidos aquí desde 1851';
    if (tmpShare !== undefined) s += `: el ${share(tmpShare, locale)} del total atribuido`;
    if (popShare !== undefined) s += `, frente al ${share(popShare, locale)} de la población mundial`;
    return `${s}.`;
  }
  let s = 'of global warming attributable to the greenhouse gases emitted here since 1851';
  if (tmpShare !== undefined) s += `: ${share(tmpShare, locale)} of the total attributed`;
  if (popShare !== undefined) s += `, against ${share(popShare, locale)} of the world's population`;
  return `${s}.`;
}

export function sinkNote(vars: { sinkMt: number; totalMt: number }, locale: Locale): string {
  const pct = Math.round((vars.sinkMt / vars.totalMt) * 100);
  const mass = emissionsMass(vars.sinkMt, locale);
  if (locale === 'it') {
    return `E in più i boschi ne riassorbono ${mass}, ${articleIt(pct)}${pct}% di quello che emette: qui l’uso del suolo è un pozzo, non una sorgente.`;
  }
  if (locale === 'es') {
    return `Además, los bosques reabsorben ${mass}, el ${pct}% de lo que emite: aquí el uso del suelo es un sumidero, no una fuente.`;
  }
  return `On top of that, forests reabsorb ${mass}, ${pct}% of what it emits: here land use is a sink, not a source.`;
}

export function landDominantPrefix(vars: { landPct: number }, locale: Locale): string {
  const { landPct } = vars;
  if (locale === 'it') {
    return `Il grosso qui non esce da un motore: ${articleIt(landPct)}${landPct}% arriva dalle foreste e dall’uso del suolo, cioè dal carbonio che era negli alberi e nel terreno. `;
  }
  if (locale === 'es') {
    return `Aquí el grueso no sale de un motor: el ${landPct}% procede de los bosques y el uso del suelo, es decir, del carbono que estaba en los árboles y el suelo. `;
  }
  return `Most of it here doesn't come from an engine: ${landPct}% comes from forests and land use — carbon that used to be in trees and soil. `;
}

export function energyIdentityText(
  vars: {
    landDominant: boolean;
    energyPc: number;
    energyRatio: number;
    intensity: number;
    intensityRatio: number;
    pcRatio: number;
  },
  locale: Locale,
): string {
  const energyPcText = Math.round(vars.energyPc).toLocaleString(LOCALE_TAG[locale]);
  const intensityText = Math.round(vars.intensity).toLocaleString(LOCALE_TAG[locale]);
  const energyRatioText = times(vars.energyRatio, locale);
  const intensityRatioText = times(vars.intensityRatio, locale);
  const pcRatioText = times(vars.pcRatio, locale);

  if (locale === 'it') {
    const lead = vars.landDominant ? 'Sull’energia, ogni persona ne consuma ' : 'Ogni persona qui consuma ';
    return `${lead}${energyPcText} kWh all’anno (${energyRatioText} la media mondiale) e ogni kWh costa ${intensityText} g di CO₂ (${intensityRatioText}). I due fattori si moltiplicano fra loro: è così che vengono ${pcRatioText} la media mondiale di CO₂ fossile a testa. Quanta energia serve a una vita di qui, e quanto è sporca quell’energia: sono due leve diverse, e si tirano in modi diversi.`;
  }
  if (locale === 'es') {
    const lead = vars.landDominant ? 'En cuanto a energía, cada persona consume ' : 'Cada persona de aquí consume ';
    return `${lead}${energyPcText} kWh al año (${energyRatioText} la media mundial) y cada kWh cuesta ${intensityText} g de CO₂ (${intensityRatioText}). Los dos factores se multiplican entre sí: así se llega a ${pcRatioText} la media mundial de CO₂ fósil per cápita. Cuánta energía necesita una vida de aquí, y cuán sucia es esa energía: son dos palancas distintas, y se mueven de formas distintas.`;
  }
  const lead = vars.landDominant ? 'On energy, each person here uses ' : 'Each person here uses ';
  return `${lead}${energyPcText} kWh a year (${energyRatioText} the world average) and each kWh costs ${intensityText} g of CO₂ (${intensityRatioText}). The two factors multiply together: that's how you get ${pcRatioText} the world average of fossil CO₂ per person. How much energy a life here needs, and how dirty that energy is: two different levers, pulled in different ways.`;
}

export function nonCo2Note(vars: { ch4Pct: number; n2oPct: number }, locale: Locale): string {
  const total = vars.ch4Pct + vars.n2oPct;
  if (locale === 'it') {
    return `E non è tutta CO₂: ${articleIt(total)}${total}% dei gas serra del paese è metano (${vars.ch4Pct}%) e protossido d’azoto (${vars.n2oPct}%) — allevamento, risaie, discariche, perdite di gas, fertilizzanti. Contano in CO₂ equivalente: è quanto scalderebbe la stessa quantità di CO₂ in un secolo.`;
  }
  if (locale === 'es') {
    return `Y no es todo CO₂: el ${total}% de los gases de efecto invernadero del país es metano (${vars.ch4Pct}%) y óxido nitroso (${vars.n2oPct}%) — ganadería, arrozales, vertederos, fugas de gas, fertilizantes. Se cuentan en CO₂ equivalente: lo que calentaría esa misma cantidad de CO₂ en un siglo.`;
  }
  return `And it's not all CO₂: ${total}% of the country's greenhouse gases is methane (${vars.ch4Pct}%) and nitrous oxide (${vars.n2oPct}%) — livestock, rice paddies, landfills, gas leaks, fertilizer. They're counted in CO₂ equivalent: how much the same amount of CO₂ would warm things over a century.`;
}
