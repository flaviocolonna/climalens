import { BookOpen, Factory, Globe, Globe2, Sparkles, TrendingUp, Waves } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import type { Place } from '@/lib/openMeteo';
import { useI18n } from '@/i18n/LocaleProvider';
import { LOCALES, type Locale } from '@/i18n/locale';
import type { PanelId } from '@/lib/urlState';

interface Props {
  /** "1880–2025", già formattato: la barra non conosce la griglia. */
  years: string;
  onSelectPlace: (place: Place) => void;
  /** Il pannello a tutto schermo aperto, se ce n'è uno: sono alternativi. */
  panel: PanelId | null;
  onTogglePanel: (panel: PanelId) => void;
}

/**
 * Barra in cima: identità, ricerca e le voci che aprono un'altra schermata.
 *
 * `relative z-30` non è decorativo: il menu a tendina della ricerca esce dalla
 * barra e deve passare sopra i pannelli che vengono dopo nel DOM.
 */
export function NavBar({ years, onSelectPlace, panel, onTogglePanel }: Props) {
  const { t } = useI18n();
  return (
    <nav className="pointer-events-auto relative z-30 flex items-center gap-3 rounded-xl border border-white/10 bg-ink-900/80 px-3 py-2.5 shadow-2xl backdrop-blur-md sm:px-4">
      <div className="flex shrink-0 items-center gap-2.5">
        <Globe2 className="h-5 w-5 shrink-0 text-sky-400" />
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold leading-tight text-white">ClimaLens</h1>
          <p className="text-[11px] leading-tight text-slate-400">
            {t('nav.tagline', { years })}
          </p>
        </div>
      </div>

      <div className="min-w-0 flex-1 sm:ml-2 sm:max-w-sm">
        <SearchBar onSelect={onSelectPlace} inline />
      </div>

      <LanguageSwitcher />

      <PanelButton
        active={panel === 'sectors'}
        onClick={() => onTogglePanel('sectors')}
        icon={Factory}
        long={t('nav.sectorsLong')}
        short={t('nav.sectorsShort')}
      />
      <PanelButton
        active={panel === 'boundaries'}
        onClick={() => onTogglePanel('boundaries')}
        icon={Globe}
        long={t('boundaries.navLong')}
        short={t('boundaries.navShort')}
      />
      <PanelButton
        active={panel === 'actions'}
        onClick={() => onTogglePanel('actions')}
        icon={Sparkles}
        long={t('actionsPanel.navLong')}
        short={t('actionsPanel.navShort')}
      />
      <PanelButton
        active={panel === 'future'}
        onClick={() => onTogglePanel('future')}
        icon={TrendingUp}
        long={t('futurePanel.navLong')}
        short={t('futurePanel.navShort')}
      />
      <PanelButton
        active={panel === 'consequences'}
        onClick={() => onTogglePanel('consequences')}
        icon={Waves}
        long={t('consequences.navLong')}
        short={t('consequences.navShort')}
      />
      <PanelButton
        active={panel === 'knowledge'}
        onClick={() => onTogglePanel('knowledge')}
        icon={BookOpen}
        long={t('knowledge.navLong')}
        short={t('knowledge.navShort')}
      />
    </nav>
  );
}

function PanelButton({
  active,
  onClick,
  icon: Icon,
  long,
  short,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Factory;
  long: string;
  short: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-expanded={active}
      // Sotto lg il pulsante è solo un'icona: senza un nome accessibile
      // sarebbe un bottone muto per chi usa uno screen reader.
      aria-label={long}
      title={long}
      className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
        active
          ? 'border-sky-400/40 bg-sky-500/15 text-sky-200'
          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-sky-300' : 'text-slate-400'}`} />
      {/* Tre livelli, e le soglie sono misurate, non scelte a occhio: con sei
          voci le etichette lunghe stanno solo oltre i 1536px, e sotto i 1280
          nemmeno quelle corte — a quel punto il campo di ricerca, che è l'unico
          elemento che può restringersi, veniva schiacciato a zero. Sotto xl
          restano le sole icone, e il nome se lo prendono `title` e
          `aria-label`. */}
      <span className="hidden 2xl:inline">{long}</span>
      <span className="hidden xl:inline 2xl:hidden">{short}</span>
    </button>
  );
}

const LANGUAGE_LABEL: Record<Locale, string> = { it: 'IT', en: 'EN', es: 'ES' };

function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t('nav.languageAria')}
      className="ml-auto flex shrink-0 items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 p-0.5 text-[11px] font-medium"
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={l === locale}
          className={`rounded-md px-2 py-1 transition ${
            l === locale ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {LANGUAGE_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
