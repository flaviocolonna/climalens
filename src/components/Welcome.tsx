import { useEffect, useRef } from 'react';
import { Compass, Globe2, Layers, MousePointerClick, PanelsTopLeft } from 'lucide-react';
import { useI18n } from '@/i18n/LocaleProvider';

interface Props {
  /** Chiude e basta: chi esplora da solo non deve essere accompagnato. */
  onDismiss: () => void;
  /** Chiude e parte dal primo passo del percorso. */
  onStartTour: () => void;
}

/**
 * Le chiavi sono scritte per intero e non composte da un id: una chiave
 * costruita con un template sfugge al controllo dei tipi e al `grep`, e questa
 * app ha già pagato quel prezzo altrove.
 */
const POINTS = [
  { icon: MousePointerClick, title: 'welcome.placeTitle', body: 'welcome.placeBody' },
  { icon: Layers, title: 'welcome.layersTitle', body: 'welcome.layersBody' },
  { icon: PanelsTopLeft, title: 'welcome.panelsTitle', body: 'welcome.panelsBody' },
] as const;

/**
 * Che cos'è ClimaLens, detto una volta a chi arriva.
 *
 * L'app si apre su una mappa scura, una barra con sei voci e un selettore con
 * cinque schede, e non dice da nessuna parte cosa sia. Il riquadro in basso a
 * sinistra spiega *come si usa*, che è un'altra domanda: questa schermata
 * risponde a *cos'è*, e poi si toglie di mezzo.
 *
 * Tre scelte la tengono breve. Non ripete le scorciatoie da tastiera, che sono
 * già nel riquadro e che nessuno memorizza da un dialogo. Non elenca i sei
 * pannelli uno per uno, perché diventerebbe un indice invece di una
 * presentazione. E chiude sulla riga che distingue davvero quest'app dalle
 * altre — ogni numero con la sua fonte, il grigio dove il dato manca — perché
 * è la sola promessa che vale la pena fare prima ancora di mostrare qualcosa.
 *
 * I due pulsanti sono alternative vere, non un sì e un no travestiti: chi
 * vuole essere accompagnato prende il percorso, chi vuole guardarsi intorno
 * chiude. Nessuno dei due è la scelta sbagliata, e le etichette lo dicono.
 */
export function Welcome({ onDismiss, onStartTour }: Props) {
  const { t } = useI18n();
  const tourRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Il fuoco parte da dentro il dialogo: senza, il primo Tab andrebbe alla
    // barra in alto, che sta sotto e che non si può nemmeno cliccare.
    tourRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm"
      // Il fondo chiude, come ci si aspetta da un dialogo. Il riquadro no:
      // ferma il click, o selezionare una parola del testo lo chiuderebbe.
      onClick={onDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl animate-fade-up sm:p-7"
      >
        <div className="flex items-center gap-2.5">
          <Globe2 className="h-6 w-6 shrink-0 text-sky-400" />
          <h2 id="welcome-title" className="text-lg font-semibold leading-tight text-white">
            {t('welcome.heading')}
          </h2>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-300">{t('welcome.lead')}</p>

        <ul className="mt-5 space-y-3.5">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-100">{t(title)}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{t(body)}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* La promessa, prima ancora di mostrare un numero. Non è una nota a
            piè di pagina e non ne prende il colore: è la riga che distingue
            quest'app da una qualunque mappa colorata. */}
        <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-relaxed text-slate-400">
          {t('welcome.promise')}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            ref={tourRef}
            onClick={onStartTour}
            className="flex items-center gap-2 rounded-lg border border-sky-400/40 bg-sky-500/15 px-3.5 py-2 text-xs font-medium text-sky-100 transition hover:border-sky-400/60 hover:bg-sky-500/25"
          >
            <Compass className="h-4 w-4" />
            {t('welcome.takeTour')}
          </button>
          <button
            onClick={onDismiss}
            className="rounded-lg border border-white/10 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            {t('welcome.explore')}
          </button>
        </div>
      </div>
    </div>
  );
}
