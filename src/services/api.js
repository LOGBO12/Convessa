/**
 * Service API pour communiquer avec le backend WhatsApp Service
 * Utilise des chemins relatifs pour passer par le proxy Vite en dev.
 *
 * IMPORTANT — Aucune clé admin (Bridge API Key) ne doit jamais exister dans ce
 * fichier ni dans le bundle frontend. Le frontend tenant s'authentifie
 * uniquement avec le token Firebase (Authorization: Bearer <idToken>) pour
 * tout ce qui concerne sa propre session, et avec sa clé API tenant
 * (X-Api-Key: pk_convessa_...) pour l'envoi de messages.
 */

const API_BASE_URL = '/api/v1';

/**
 * Fonction utilitaire pour effectuer des requêtes HTTP.
 * En cas d'erreur HTTP, l'erreur levée porte aussi `.code`, `.status` et
 * `.data` (corps JSON complet) afin que les appelants puissent réagir à des
 * codes métier précis (ex: 409 USER_ALREADY_HAS_SESSION avec un tenantId).
 */
async function fetchAPI(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Ajouter le token Firebase si nécessaire
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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(data.error?.message || 'Erreur API');
    err.code = data.error?.code;
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

export const authAPI = {
  verifyToken: async () => {
    return fetchAPI('/auth/verify', {
      method: 'POST',
      requiresAuth: true,
    });
  },

  getProfile: async () => {
    return fetchAPI('/auth/me', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  logout: async () => {
    return fetchAPI('/auth/logout', {
      method: 'POST',
      requiresAuth: true,
    });
  },

  registerPhone: async (phone, displayName = null) => {
    return fetchAPI('/auth/phone/register', {
      method: 'POST',
      body: JSON.stringify({ phone, displayName }),
    });
  },

  verifyOTP: async (phone, code) => {
    return fetchAPI('/auth/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  },

  loginPhone: async (phone) => {
    return fetchAPI('/auth/phone/login', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },
};

// ============================================================================
// TENANTS — SELF-SERVICE (chaque tenant gère UNIQUEMENT sa propre session)
// Authentification : token Firebase (Authorization: Bearer <idToken>)
// Aucune de ces routes n'accepte ni ne nécessite d'ID de tenant : le backend
// résout systématiquement "moi" à partir du token vérifié.
// ============================================================================

export const tenantsAPI = {
  /**
   * Créer SA session WhatsApp (démarre le QR).
   */
  create: async ({ phone, name, webhookUrl }) => {
    return fetchAPI('/tenants', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify({ phone, name, webhookUrl }),
    });
  },

  /**
   * Récupérer MA session (404 si pas encore de session).
   */
  getMe: async () => {
    return fetchAPI('/tenants/me', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  /**
   * Récupérer MON QR code courant.
   */
  getQRCode: async () => {
    return fetchAPI('/tenants/me/qr', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  /**
   * Récupérer MA clé API complète déchiffrée.
   */
  getApiKey: async () => {
    return fetchAPI('/tenants/me/api-key', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  /**
   * Déconnecter / supprimer MA session.
   */
  disconnect: async () => {
    return fetchAPI('/tenants/me', {
      method: 'DELETE',
      requiresAuth: true,
    });
  },
};

// ============================================================================
// TENANT SEND API — envoi via la clé API du tenant (pk_convessa_...)
// C'est TOUJOURS le tenant (jamais l'admin) qui est l'émetteur ici.
// ============================================================================

export const tenantSendAPI = {
  /**
   * Envoyer un message en utilisant la clé API WhatsApp du tenant connecté.
   * tenantApiKey = la clé pk_convessa_... stockée dans localStorage.
   */
  sendAsUser: async ({ to, message, media, tenantApiKey }) => {
    if (!tenantApiKey) {
      throw new Error('Clé API introuvable. Reconnectez votre WhatsApp.');
    }
    const response = await fetch(`${API_BASE_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': tenantApiKey,
      },
      body: JSON.stringify({ to, message, media }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(data.error?.message || "Erreur lors de l'envoi");
      err.code = data.error?.code;
      err.status = response.status;
      throw err;
    }
    return data;
  },

  /**
   * Infos sur la session liée à une clé API tenant (statut, limites média...).
   */
  getInfo: async (tenantApiKey) => {
    if (!tenantApiKey) {
      throw new Error('Clé API introuvable. Reconnectez votre WhatsApp.');
    }
    const response = await fetch(`${API_BASE_URL}/send/info`, {
      headers: { 'X-Api-Key': tenantApiKey },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error?.message || 'Erreur récupération info session');
    }
    return data;
  },
};

// ============================================================================
// PLANS — page publique (Tarifs / Pricing)
// Aucune authentification requise.
// ============================================================================

export const plansAPI = {
  /**
   * Récupérer la liste des plans d'abonnement (triés par prix croissant).
   */
  list: async () => {
    return fetchAPI('/plans', {
      method: 'GET',
    });
  },
};

// ============================================================================
// localStorage helpers — clé API tenant par utilisateur Firebase
// ============================================================================

export function saveTenantApiKey(userUid, apiKey) {
  if (!userUid || !apiKey) return;
  localStorage.setItem(`tenant_api_key_${userUid}`, apiKey);
}

export function getTenantApiKey(userUid) {
  if (!userUid) return null;
  return localStorage.getItem(`tenant_api_key_${userUid}`);
}

export function clearTenantApiKey(userUid) {
  if (!userUid) return;
  localStorage.removeItem(`tenant_api_key_${userUid}`);
}

// Export par défaut
export default {
  auth: authAPI,
  tenants: tenantsAPI,
  tenantSend: tenantSendAPI,
  plans: plansAPI,
};