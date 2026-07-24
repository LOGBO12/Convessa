/**
 * SessionContext — Partage la session WhatsApp de l'utilisateur
 * dans toute l'application sans refaire d'appel API à chaque page.
 *
 * Un seul appel API est fait au niveau du Provider, toutes les pages
 * consomment le même état via useSession().
 *
 * IMPORTANT — On n'appelle JAMAIS tenantsAPI.list() ici : cette route est
 * réservée au backoffice admin et renvoie les données de TOUS les tenants.
 * On utilise exclusivement /tenants/me (self-service, résolu depuis le
 * token Firebase côté backend) afin qu'un tenant ne voie jamais les données
 * d'un autre tenant.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tenantsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetchSession = useCallback(async () => {
    if (!user) {
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await tenantsAPI.getMe();
      setSession(data);
      setError(null);
    } catch (err) {
      if (err.status === 404) {
        // Cas normal : l'utilisateur n'a pas encore de session WhatsApp
        setSession(null);
        setError(null);
      } else {
        console.error('[SessionContext] Erreur:', err.message);
        setError(err.message);
        setSession(null);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Charger au montage et quand l'utilisateur change
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return (
    <SessionContext.Provider value={{ session, loading, error, refresh: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession doit être utilisé dans SessionProvider');
  return ctx;
}

export default SessionContext;
