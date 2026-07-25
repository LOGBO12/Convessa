/**
 * SessionContext — Partage la session WhatsApp de l'utilisateur
 * dans toute l'application via un seul appel API.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tenantsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSession = useCallback(async () => {
    // Ne pas appeler tant que Firebase Auth charge encore
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setSession(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // IMPORTANT — on ne doit JAMAIS récupérer la liste globale des tenants
      // depuis le frontend (fuite entre comptes). Le backend résout "moi"
      // lui-même à partir du token Firebase vérifié (GET /tenants/me).
      const response = await tenantsAPI.getMe();
      // GET /tenants/me renvoie directement { success, tenantId, phone, status, ... }
      setSession(response ?? null);
      setError(null);
    } catch (err) {
      // 404 = pas encore de session WhatsApp pour cet utilisateur, ce n'est pas une erreur
      if (err.status === 404) {
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
  }, [user, authLoading]);

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
