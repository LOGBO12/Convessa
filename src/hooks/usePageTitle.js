import { useEffect } from 'react';

/**
 * Définit le titre de l'onglet navigateur pour la page courante.
 * @param {string} title - Titre de la page (ex: "Tableau de bord")
 */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title
      ? `Convessa | ${title}`
      : 'Convessa : API WhatsApp pour développeurs';
    return () => {
      document.title = 'Convessa : API WhatsApp pour développeurs';
    };
  }, [title]);
}
