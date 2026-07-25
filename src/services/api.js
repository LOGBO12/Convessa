/**
 * Service API pour communiquer avec le backend WhatsApp Service
 * Utilise des chemins relatifs pour passer par le proxy Vite en dev.
 *
 * IMPORTANT — Aucune clé admin (Bridge API Key) ne doit jamais exister dans ce
 * fichier ni dans le bundle frontend. Le frontend tenant s'authentifie
 * uniquement avec le token Firebase (Authorization: Bearer <idToken>) pour
 * tout ce qui concerne sa propre session, et avec sa clé API tenant
 * (X-Api-Key: pk_convessa_...) pour l'envoi de messages et la gestion des groupes.
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

/**
 * Requête authentifiée par la clé API tenant (X-Api-Key), utilisée pour
 * /send et /groups. Même contrat d'erreur que fetchAPI (.code/.status/.data).
 */
async function fetchWithTenantKey(endpoint, tenantApiKey, options = {}) {
  if (!tenantApiKey) {
    const err = new Error('Clé API introuvable. Reconnectez votre WhatsApp.');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': tenantApiKey,
      ...options.headers,
    },
  });
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
   * Aucun numéro n'est demandé : il est déduit automatiquement du compte
   * WhatsApp scanné, jamais saisi manuellement.
   */
  create: async ({ name, webhookUrl } = {}) => {
    return fetchAPI('/tenants', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify({ name, webhookUrl }),
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

  /**
   * Activer MA session après un scan de QR réussi : génère la clé API en
   * appliquant les privilèges d'un code de parrainage (s'il est valide) ou,
   * à défaut, ceux du plan gratuit. `referralCode` peut être vide/undefined.
   */
  activate: async (referralCode) => {
    return fetchAPI('/tenants/me/activate', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify({ referralCode: referralCode || undefined }),
    });
  },
};

// ============================================================================
// TENANT SEND API — envoi via la clé API du tenant (pk_convessa_...)
// C'est TOUJOURS le tenant (jamais l'admin) qui est l'émetteur ici.
//
// IMPORTANT — sendAsUser() répond dès que le backend a ACCEPTÉ le message
// (statut "queued"), pas quand il est réellement délivré. Le statut final
// (sent/failed) arrive séparément via l'événement Socket.io `message_status`
// (voir services/socket.js → onMessageStatus) ou en interrogeant getStatus().
// Ne jamais traiter l'absence de confirmation immédiate comme un échec.
// ============================================================================

export const tenantSendAPI = {
  /**
   * Envoyer un message en utilisant la clé API WhatsApp du tenant connecté.
   * `to` : numéro, tableau de numéros (broadcast), ou groupId (voir groupsAPI).
   * Retourne { messageId, status:'queued', ... } — pas le statut final.
   */
  sendAsUser: async ({ to, message, media, tenantApiKey }) => {
    return fetchWithTenantKey('/send', tenantApiKey, {
      method: 'POST',
      body: JSON.stringify({ to, message, media }),
    });
  },

  /**
   * Infos sur la session liée à une clé API tenant (statut, limites média...).
   */
  getInfo: async (tenantApiKey) => {
    return fetchWithTenantKey('/send/info', tenantApiKey, { method: 'GET' });
  },

  /**
   * Statut à jour d'un message précis (complément du Socket.io — utile après
   * un rechargement de page ou si le socket a raté l'événement).
   */
  getStatus: async (messageId, tenantApiKey) => {
    return fetchWithTenantKey(`/send/status/${messageId}`, tenantApiKey, { method: 'GET' });
  },

  /**
   * Historique des messages envoyés par le tenant.
   */
  getHistory: async (tenantApiKey, limit = 50) => {
    return fetchWithTenantKey(`/send/history?limit=${limit}`, tenantApiKey, { method: 'GET' });
  },
};

// ============================================================================
// GROUPS API — création et gestion des groupes WhatsApp du tenant
// ============================================================================

export const groupsAPI = {
  /**
   * Créer un groupe (idempotent par nom : rappeler avec le même nom renvoie
   * le groupe existant plutôt que d'en créer un doublon).
   */
  create: async ({ name, participants }, tenantApiKey) => {
    return fetchWithTenantKey('/groups', tenantApiKey, {
      method: 'POST',
      body: JSON.stringify({ name, participants }),
    });
  },

  list: async (tenantApiKey) => {
    return fetchWithTenantKey('/groups', tenantApiKey, { method: 'GET' });
  },

  getById: async (groupId, tenantApiKey) => {
    return fetchWithTenantKey(`/groups/${groupId}`, tenantApiKey, { method: 'GET' });
  },

  getInviteLink: async (groupId, tenantApiKey) => {
    return fetchWithTenantKey(`/groups/${groupId}/invite`, tenantApiKey, { method: 'GET' });
  },

  addParticipants: async (groupId, participants, tenantApiKey) => {
    return fetchWithTenantKey(`/groups/${groupId}/participants`, tenantApiKey, {
      method: 'POST',
      body: JSON.stringify({ participants }),
    });
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
  groups: groupsAPI,
  plans: plansAPI,
};