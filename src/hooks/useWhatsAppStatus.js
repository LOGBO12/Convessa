/**
 * Hook personnalisé pour récupérer le status WhatsApp en temps réel
 * Effectue un polling toutes les 5 secondes
 */

import { useState, useEffect, useCallback } from 'react';
import { statusAPI } from '../services/api';

export function useWhatsAppStatus(pollingInterval = 5000) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await statusAPI.getStatus();
      setStatus(response);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching WhatsApp status:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch immédiat au montage
    fetchStatus();

    // Polling
    const interval = setInterval(fetchStatus, pollingInterval);

    // Cleanup
    return () => clearInterval(interval);
  }, [fetchStatus, pollingInterval]);

  return {
    status,
    loading,
    error,
    refresh: fetchStatus,
  };
}

export default useWhatsAppStatus;
