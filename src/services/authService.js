/**
 * Service d'authentification - gère Firebase Auth + Backend API
 * Flux : Registration (register OTP → verify-otp) + Login (login OTP → login/verify-otp) + OAuth
 */

import {
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithCustomToken,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { getCachedMachineHash } from './deviceFingerprint';

// ---------------------------------------------------------------------------
// Providers OAuth
// ---------------------------------------------------------------------------
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// ---------------------------------------------------------------------------
// Error code → French message map
// ---------------------------------------------------------------------------
const ERROR_MESSAGES = {
  DEVICE_ALREADY_REGISTERED:      'Cet appareil a déjà un compte. Utilisez la connexion.',
  DEVICE_BOUND_TO_ANOTHER_ACCOUNT:'Cet appareil est lié à un autre compte. Accès refusé.',
  PHONE_ALREADY_REGISTERED:       'Ce numéro est déjà inscrit. Utilisez la connexion.',
  DEVICE_BLOCKED:                 'Cet appareil a été bloqué. Contactez le support.',
  PHONE_NOT_REGISTERED:           'Aucun compte avec ce numéro. Inscrivez-vous d\'abord.',
  ACCOUNT_DISABLED:               'Ce compte a été désactivé.',
  INVALID:                        'Code incorrect.',
  EXPIRED:                        'Code expiré. Demandez un nouveau code.',
  EXCEEDED:                       'Trop de tentatives. Demandez un nouveau code.',
  WHATSAPP_UNAVAILABLE:           'Service temporairement indisponible. Réessayez plus tard.',
};

function mapErrorCode(code, fallbackMessage) {
  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }
  return fallbackMessage || 'Une erreur est survenue.';
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * apiFetch – wraps fetch with JSON headers, error mapping and network guard.
 * Throws an object `{ code, message }` on non-OK responses.
 */
async function apiFetch(path, options = {}) {
  const { headers: extraHeaders, ...rest } = options;

  // Envoyer le machine hash dans chaque requête auth
  // Le backend l'utilise pour enforcer la règle "un appareil = un compte"
  let machineHash = '';
  try {
    machineHash = await getCachedMachineHash();
  } catch { /* silently ignore */ }

  const headers = {
    'Content-Type': 'application/json',
    ...(machineHash ? { 'X-Machine-Hash': machineHash } : {}),
    ...extraHeaders,
  };

  let response;
  try {
    response = await fetch(`/api/v1${path}`, { headers, ...rest });
  } catch (_networkErr) {
    throw { code: 'NETWORK_ERROR', message: 'Impossible de joindre le serveur.' };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const code = data?.error?.code || data?.code || null;
    const backendMsg = data?.error?.message || data?.message || null;
    throw {
      code,
      message: mapErrorCode(code, backendMsg),
    };
  }

  return data;
}

function saveToken(token) {
  localStorage.setItem('firebaseToken', token);
}

function clearStorage() {
  localStorage.removeItem('firebaseToken');
  localStorage.removeItem('userData');
}

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

async function _handleOAuthPopup(provider) {
  try {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    saveToken(idToken);

    const data = await apiFetch('/auth/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
    });

    localStorage.setItem('userData', JSON.stringify(data.user));

    return { success: true, user: data.user, isNewAccount: data.isNewAccount ?? false };
  } catch (err) {
    // Firebase popup errors
    if (err?.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Connexion annulée.' };
    }
    if (err?.code === 'auth/popup-blocked') {
      return { success: false, error: 'Popup bloquée par le navigateur. Autorisez les popups pour ce site.' };
    }
    if (err?.code === 'auth/unauthorized-domain') {
      return { success: false, error: 'Domaine non autorisé. Vérifiez la configuration Firebase.' };
    }
    if (err?.code === 'auth/operation-not-allowed') {
      return { success: false, error: 'Ce fournisseur OAuth n\'est pas activé. Contactez l\'administrateur.' };
    }

    // apiFetch errors (have .message already mapped)
    const message = err?.message || 'Une erreur est survenue.';
    return { success: false, error: message };
  }
}

export async function signInWithGoogle() {
  return _handleOAuthPopup(googleProvider);
}

export async function signInWithGithub() {
  return _handleOAuthPopup(githubProvider);
}

// ---------------------------------------------------------------------------
// Registration flow
// ---------------------------------------------------------------------------

/**
 * Step 1 – send OTP for registration.
 * POST /auth/phone/register { phone }
 * Returns { success, devOtp?, error? }
 */
export async function sendRegisterOTP(phone) {
  try {
    const data = await apiFetch('/auth/phone/register', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    return { success: true, devOtp: data.devOtp ?? null };
  } catch (err) {
    return { success: false, error: err.message, code: err.code };
  }
}

/**
 * Step 2 – verify OTP for registration.
 * POST /auth/phone/verify-otp { phone, code }
 * Then signInWithCustomToken.
 * Returns { success, user, isNewAccount, error? }
 */
export async function verifyRegisterOTP(phone, code) {
  try {
    const data = await apiFetch('/auth/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });

    const userCredential = await signInWithCustomToken(auth, data.customToken);
    const idToken = await userCredential.user.getIdToken();
    saveToken(idToken);

    const user = data.user || {
      uid: userCredential.user.uid,
      phone: userCredential.user.phoneNumber,
    };
    localStorage.setItem('userData', JSON.stringify(user));

    return { success: true, user, isNewAccount: data.isNewAccount ?? true };
  } catch (err) {
    // Firebase custom token errors
    if (err?.code?.startsWith?.('auth/')) {
      return { success: false, error: 'Erreur lors de la connexion Firebase. Réessayez.' };
    }
    return { success: false, error: err.message || 'Une erreur est survenue.' };
  }
}

// ---------------------------------------------------------------------------
// Login flow
// ---------------------------------------------------------------------------

/**
 * Step 1 – send OTP for login.
 * POST /auth/phone/login { phone }
 * Returns { success, devOtp?, error? }
 */
export async function sendLoginOTP(phone) {
  try {
    const data = await apiFetch('/auth/phone/login', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    return { success: true, devOtp: data.devOtp ?? null };
  } catch (err) {
    return { success: false, error: err.message, code: err.code };
  }
}

/**
 * Step 2 – verify OTP for login.
 * POST /auth/phone/login/verify-otp { phone, code }
 * Then signInWithCustomToken.
 * Returns { success, user, error? }
 */
export async function verifyLoginOTP(phone, code) {
  try {
    const data = await apiFetch('/auth/phone/login/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });

    const userCredential = await signInWithCustomToken(auth, data.customToken);
    const idToken = await userCredential.user.getIdToken();
    saveToken(idToken);

    const user = data.user || {
      uid: userCredential.user.uid,
      phone: userCredential.user.phoneNumber,
    };
    localStorage.setItem('userData', JSON.stringify(user));

    return { success: true, user };
  } catch (err) {
    if (err?.code?.startsWith?.('auth/')) {
      return { success: false, error: 'Erreur lors de la connexion Firebase. Réessayez.' };
    }
    return { success: false, error: err.message || 'Une erreur est survenue.' };
  }
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export async function signOut() {
  try {
    const token = localStorage.getItem('firebaseToken');
    if (token) {
      await apiFetch('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    await firebaseSignOut(auth);
  } catch (_err) {
    // Intentionally swallowed – always complete sign-out
  } finally {
    clearStorage();
  }
  return { success: true };
}

export function getCachedUser() {
  const raw = localStorage.getItem('userData');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Subscribe to Firebase auth state changes.
 * @param {(user: object|null) => void} callback
 * @returns unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken();
      saveToken(token);

      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoUrl: firebaseUser.photoURL,
        phone: firebaseUser.phoneNumber,
        provider: firebaseUser.providerData[0]?.providerId || 'phone',
      };
      localStorage.setItem('userData', JSON.stringify(userData));
      callback(userData);
    } else {
      clearStorage();
      callback(null);
    }
  });
}

export default {
  signInWithGoogle,
  signInWithGithub,
  sendRegisterOTP,
  verifyRegisterOTP,
  sendLoginOTP,
  verifyLoginOTP,
  signOut,
  getCachedUser,
  onAuthChange,
};
