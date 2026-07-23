/**
 * Hook pour gérer la session WhatsApp de l'utilisateur connecté
 * Un utilisateur = une session WhatsApp avec son propre numéro
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
      setLoading(false);
      return;
    }

    try {
      // Récupérer toutes les sessions
      const response = await tenantsAPI.list();
      
      // Trouver la session de l'utilisateur connecté via son userUid Firebase
      if (user.uid) {
        const userSession = response.tenants?.find(
          t => t.userUid === user.uid
        );
        setSession(userSession || null);
      } else {
        setSession(null);
      }
      
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
