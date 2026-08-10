import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Définit le titre de l'onglet navigateur pour la page courante, traduit
 * dans la langue active, et le met à jour automatiquement si l'utilisateur
 * change de langue pendant qu'il est sur la page.
 *
 * @param {string} titleKey - Clé i18n du titre (ex: "pageTitles.dashboard").
 *                             Si omise, seul le titre par défaut du site est utilisé.
 */
export function usePageTitle(titleKey) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const siteName = t('common.siteName');
    const defaultTitle = t('common.defaultTitle');

    document.title = titleKey ? `${siteName} | ${t(titleKey)}` : defaultTitle;

    return () => {
      document.title = defaultTitle;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleKey, i18n.language]);
}
