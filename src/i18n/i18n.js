import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';
import es from './locales/es.json';

export const SUPPORTED_LANGUAGES = ['fr', 'en', 'es'];
const STORAGE_KEY = 'convessa_lang';

/**
 * Détermine la langue initiale, dans cet ordre de priorité :
 * 1. Choix déjà sauvegardé par l'utilisateur (localStorage)
 * 2. Langue du navigateur (si supportée)
 * 3. Français par défaut
 * Aucune dépendance externe : reste volontairement léger.
 */
function detectInitialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
  } catch {
    // localStorage indisponible (mode privé, SSR...) : on ignore
  }

  const browserLangs = navigator.languages || [navigator.language];
  for (const lang of browserLangs) {
    const short = lang?.slice(0, 2).toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(short)) return short;
  }

  return 'fr';
}

const initialLang = detectInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
    },
    lng: initialLang,
    fallbackLng: 'fr',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false,
    },
    returnEmptyString: false,
  });

// Garde le <html lang="..."> synchronisé (SEO + accessibilité)
document.documentElement.lang = initialLang;

// Persiste chaque changement de langue et met à jour <html lang>
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore si localStorage indisponible
  }
});

export default i18n;
