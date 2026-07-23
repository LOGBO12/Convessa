/**
 * Service API pour communiquer avec le backend WhatsApp Service
 * Base URL: http://localhost:3005/api/v1
 */

const API_BASE_URL = 'http://localhost:3005/api/v1';
const API_KEY = 'a2054a71236e85e152d3e1903d6dc81e94bbff54c3dd01b1591aec940c5b6024';

/**
 * Fonction utilitaire pour effectuer des requêtes HTTP
 */
async function fetchAPI(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Ajouter la clé API si nécessaire
  if (options.requiresApiKey) {
    headers['X-Api-Key'] = API_KEY;
  }

  // Ajouter le token Firebase si disponible
  if (options.requiresAuth) {
    const token = localStorage.getItem('firebaseToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Erreur API');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

export const authAPI = {
  /**
   * Vérifier un token Firebase et créer/mettre à jour le profil
   */
  verifyToken: async (idToken) => {
    return fetchAPI('/auth/verify', {
      method: 'POST',
      requiresAuth: true,
    });
  },

  /**
   * Obtenir le profil de l'utilisateur connecté
   */
  getProfile: async () => {
    return fetchAPI('/auth/me', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  /**
   * Déconnexion - révocation des tokens Firebase
   */
  logout: async () => {
    return fetchAPI('/auth/logout', {
      method: 'POST',
      requiresAuth: true,
    });
  },

  /**
   * Inscription par téléphone - envoi OTP via WhatsApp
   */
  registerPhone: async (phone, displayName = null) => {
    return fetchAPI('/auth/phone/register', {
      method: 'POST',
      body: JSON.stringify({ phone, displayName }),
    });
  },

  /**
   * Vérification OTP après inscription
   */
  verifyOTP: async (phone, code) => {
    return fetchAPI('/auth/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  },

  /**
   * Connexion par téléphone - renvoi OTP
   */
  loginPhone: async (phone) => {
    return fetchAPI('/auth/phone/login', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },
};

// ============================================================================
// STATUS ENDPOINT
// ============================================================================

export const statusAPI = {
  /**
   * Obtenir l'état de la connexion WhatsApp
   */
  getStatus: async () => {
    return fetchAPI('/status', {
      method: 'GET',
      requiresApiKey: true,
    });
  },
};

// ============================================================================
// MESSAGES ENDPOINTS
// ============================================================================

export const messagesAPI = {
  /**
   * Envoyer un message WhatsApp
   */
  send: async ({ to, message, media }) => {
    return fetchAPI('/messages/send', {
      method: 'POST',
      requiresApiKey: true,
      body: JSON.stringify({ to, message, media }),
    });
  },

  /**
   * Obtenir le statut d'un message
   */
  getStatus: async (messageId) => {
    return fetchAPI(`/messages/${messageId}`, {
      method: 'GET',
      requiresApiKey: true,
    });
  },

  /**
   * Obtenir les limites des médias
   */
  getMediaLimits: async () => {
    return fetchAPI('/messages/media-limits', {
      method: 'GET',
      requiresApiKey: true,
    });
  },
};

// ============================================================================
// SESSION ENDPOINTS
// ============================================================================

export const sessionAPI = {
  /**
   * Déconnecter et supprimer la session WhatsApp principale
   */
  disconnect: async () => {
    return fetchAPI('/session', {
      method: 'DELETE',
      requiresApiKey: true,
    });
  },
};

// ============================================================================
// TENANTS ENDPOINTS (Multi-sessions)
// ============================================================================

export const tenantsAPI = {
  /**
   * Créer un nouveau tenant (session WhatsApp)
   */
  create: async ({ phone, name, webhookUrl }) => {
    return fetchAPI('/tenants', {
      method: 'POST',
      requiresApiKey: true,
      body: JSON.stringify({ phone, name, webhookUrl }),
    });
  },

  /**
   * Obtenir le QR code d'un tenant
   */
  getQRCode: async (tenantId) => {
    return fetchAPI(`/tenants/${tenantId}/qr`, {
      method: 'GET',
      requiresApiKey: true,
    });
  },

  /**
   * Obtenir le statut d'un tenant
   */
  getStatus: async (tenantId) => {
    return fetchAPI(`/tenants/${tenantId}`, {
      method: 'GET',
      requiresApiKey: true,
    });
  },

  /**
   * Obtenir la clé API complète d'un tenant (pour affichage dashboard)
   */
  getApiKey: async (tenantId) => {
    return fetchAPI(`/tenants/${tenantId}/api-key`, {
      method: 'GET',
      requiresApiKey: true,
    });
  },

  /**
   * Supprimer un tenant
   */
  delete: async (tenantId) => {
    return fetchAPI(`/tenants/${tenantId}`, {
      method: 'DELETE',
      requiresApiKey: true,
    });
  },

  /**
   * Lister tous les tenants
   */
  list: async () => {
    return fetchAPI('/tenants', {
      method: 'GET',
      requiresApiKey: true,
    });
  },
};

// Export par défaut
export default {
  auth: authAPI,
  status: statusAPI,
  messages: messagesAPI,
  session: sessionAPI,
  tenants: tenantsAPI,
};
