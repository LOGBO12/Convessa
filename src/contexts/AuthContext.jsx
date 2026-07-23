/**
 * Contexte d'authentification React
 * Gère l'état global de l'utilisateur connecté
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // S'abonner aux changements d'état d'authentification
    const unsubscribe = onAuthChange((userData) => {
      setUser(userData);
      setLoading(false);
    });

    // Se désabonner au démontage
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personnalisé pour utiliser le contexte
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
