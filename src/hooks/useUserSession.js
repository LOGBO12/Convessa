/**
 * useUserSession — wrapper qui utilise le SessionContext partagé.
 * Un seul appel API pour toute l'application, état cohérent entre toutes les pages.
 */
import { useSession } from '../contexts/SessionContext';

export function useUserSession() {
  const { session, loading, error, refresh } = useSession();

  return {
    session,
    loading,
    error,
    refresh,
    hasSession: !!session,
  };
}

export default useUserSession;