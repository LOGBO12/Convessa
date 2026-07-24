/**
 * SessionContext — Partage la session WhatsApp de l'utilisateur
 * dans toute l'application sans refaire d'appel API à chaque page.
 *
 * Un seul appel API est fait au niveau du Provider, toutes les pages
 * consomment le même état via useSession().
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
      const response = await tenantsAPI.list();
      const tenants  = response.tenants ?? [];

      // Chercher par UID Firebase en priorité
      let found = tenants.find(t => t.userUid === user.uid);

      // Fallback : numéro de téléphone
      if (!found && user.phone) {
        const userPhone = user.phone.replace(/[^0-9]/g, '');
        found = tenants.find(t => t.phone?.replace(/[^0-9]/g, '') === userPhone);
      }

      setSession(found ?? null);
      setError(null);
    } catch (err) {
      console.error('[SessionContext] Erreur:', err.message);
      setError(err.message);
      setSession(null);
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
