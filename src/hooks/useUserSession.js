/**
 * Hook pour gérer la session WhatsApp de l'utilisateur connecté.
 * Un utilisateur = une session WhatsApp.
 *
 * La session est retrouvée par Firebase UID (userUid) stocké sur le tenant,
 * ce qui fonctionne quel que soit le mode de connexion (Google, GitHub, téléphone).
 */

import { useState, useEffect, useCallback } from 'react';
import { tenantsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function useUserSession() {
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserSession = useCallback(async () => {
    if (!user) {
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      const response = await tenantsAPI.list();
      const tenants  = response.tenants ?? [];

      // Chercher la session par uid Firebase (fiable quel que soit le provider)
      let userSession = tenants.find(t => t.userUid === user.uid);

      // Fallback : chercher par numéro de téléphone si présent
      if (!userSession && user.phone) {
        const userPhone = user.phone.replace(/[^0-9]/g, '');
        userSession = tenants.find(t => t.phone?.replace(/[^0-9]/g, '') === userPhone);
      }

      setSession(userSession ?? null);
      setError(null);
    } catch (err) {
      console.error('Error fetching user session:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserSession();
  }, [fetchUserSession]);

  return {
    session,
    loading,
    error,
    refresh: fetchUserSession,
    hasSession: !!session,
  };
}

export default useUserSession;
