/**
 * Service d'authentification - gère Firebase Auth + Backend API
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
import { authAPI } from './api';

// Providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

/**
 * Sauvegarde le token Firebase dans localStorage et met à jour les headers API
 */
function saveToken(token) {
  localStorage.setItem('firebaseToken', token);
}

/**
 * Supprime le token du localStorage
 */
function clearToken() {
  localStorage.removeItem('firebaseToken');
  localStorage.removeItem('userData');
}

// ============================================================================
// AUTH WITH GOOGLE
// ============================================================================

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    saveToken(token);

    // Vérifier le token côté backend et créer/mettre à jour le profil
    const response = await authAPI.verifyToken(token);
    localStorage.setItem('userData', JSON.stringify(response.user));

    return {
      success: true,
      user: response.user,
    };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// AUTH WITH GITHUB
// ============================================================================

export async function signInWithGithub() {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    const token = await result.user.getIdToken();
    saveToken(token);

    // Vérifier le token côté backend
    const response = await authAPI.verifyToken(token);
    localStorage.setItem('userData', JSON.stringify(response.user));

    return {
      success: true,
      user: response.user,
    };
  } catch (error) {
    console.error('GitHub Sign-In Error:', error);
    
    // Messages d'erreur plus explicites
    let errorMessage = error.message;
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Connexion annulée';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Popup bloquée par le navigateur. Autorisez les popups pour ce site.';
    } else if (error.code === 'auth/unauthorized-domain') {
      errorMessage = 'Domaine non autorisé. Vérifiez la configuration Firebase.';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'GitHub OAuth non activé. Contactez l\'administrateur.';
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================================================
// AUTH WITH PHONE (OTP via WhatsApp)
// ============================================================================

/**
 * Étape 1: Envoyer le code OTP via WhatsApp
 * @param {string} phone - Numéro au format international (ex: 22960000000)
 * @param {boolean} isRegistration - true pour inscription, false pour connexion
 */
export async function sendPhoneOTP(phone, isRegistration = true) {
  try {
    let response;
    
    if (isRegistration) {
      response = await authAPI.registerPhone(phone);
    } else {
      response = await authAPI.loginPhone(phone);
    }

    return {
      success: true,
      message: response.message,
      // En mode dev, le backend peut renvoyer le code OTP
      devOtp: response.devOtp,
    };
  } catch (error) {
    console.error('Send OTP Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Étape 2: Vérifier le code OTP et obtenir le token Firebase
 * @param {string} phone - Numéro au format international
 * @param {string} code - Code OTP à 6 chiffres
 */
export async function verifyPhoneOTP(phone, code) {
  try {
    // Vérifier l'OTP côté backend et obtenir un custom token
    const response = await authAPI.verifyOTP(phone, code);

    // Échanger le custom token contre un ID token Firebase
    const userCredential = await signInWithCustomToken(auth, response.customToken);
    const idToken = await userCredential.user.getIdToken();
    saveToken(idToken);

    // Sauvegarder les données utilisateur
    localStorage.setItem('userData', JSON.stringify(response.user));

    return {
      success: true,
      user: response.user,
    };
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// GET CURRENT USER
// ============================================================================

/**
 * Obtenir le profil de l'utilisateur connecté depuis le backend
 */
export async function getCurrentUser() {
  try {
    const response = await authAPI.getProfile();
    localStorage.setItem('userData', JSON.stringify(response.user));
    return {
      success: true,
      user: response.user,
    };
  } catch (error) {
    console.error('Get User Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Obtenir les données utilisateur depuis le cache localStorage
 */
export function getCachedUser() {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
}

// ============================================================================
// SIGN OUT
// ============================================================================

export async function signOut() {
  try {
    // Révoquer les tokens côté backend
    await authAPI.logout().catch(() => {
      // Ignorer les erreurs - continuer la déconnexion
    });

    // Déconnexion Firebase
    await firebaseSignOut(auth);

    // Nettoyer le localStorage
    clearToken();

    return {
      success: true,
    };
  } catch (error) {
    console.error('Sign Out Error:', error);
    // Même en cas d'erreur, nettoyer le localStorage
    clearToken();
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// AUTH STATE OBSERVER
// ============================================================================

/**
 * Écouter les changements d'état d'authentification Firebase
 * @param {Function} callback - Fonction appelée quand l'état change
 * @returns {Function} Fonction pour se désabonner
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Utilisateur connecté - obtenir le token
      const token = await firebaseUser.getIdToken();
      saveToken(token);

      // Construire l'objet user à partir de Firebase directement
      // (évite l'appel à /auth/me qui rejette les providers 'phone')
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
      // Utilisateur déconnecté
      clearToken();
      localStorage.removeItem('userData');
      callback(null);
    }
  });
}

// Export par défaut
export default {
  signInWithGoogle,
  signInWithGithub,
  sendPhoneOTP,
  verifyPhoneOTP,
  getCurrentUser,
  getCachedUser,
  signOut,
  onAuthChange,
};
