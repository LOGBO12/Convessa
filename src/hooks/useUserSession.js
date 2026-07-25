/**
 * useUserSession — wrapper qui utilise le SessionContext partagé.
 * Un seul appel API pour toute l'application, état cohérent entre toutes les pages.
 */
import { useSession } from '../contexts/SessionContext';

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
<<<<<<<<< Temporary merge branch 1
      
      // Trouver la session de l'utilisateur connecté via son userUid Firebase
      if (user.uid) {
        const userSession = response.tenants?.find(
          t => t.userUid === user.uid
        );
        setSession(userSession || null);
      } else {
        setSession(null);
=========
      const tenants  = response.tenants ?? [];

      // Chercher la session par uid Firebase (fiable quel que soit le provider)
      let userSession = tenants.find(t => t.userUid === user.uid);

      // Fallback : chercher par numéro de téléphone si présent
      if (!userSession && user.phone) {
        const userPhone = user.phone.replace(/[^0-9]/g, '');
        userSession = tenants.find(t => t.phone?.replace(/[^0-9]/g, '') === userPhone);
>>>>>>>>> Temporary merge branch 2
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