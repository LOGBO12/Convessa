/**
 * Composant pour protéger les routes nécessitant une authentification
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Afficher un loader pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-whatsapp-light">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  // Rediriger vers la page d'accueil si non connecté
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Afficher le contenu protégé
  return children;
}

export default ProtectedRoute;
