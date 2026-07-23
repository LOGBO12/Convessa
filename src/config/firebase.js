/**
 * Configuration Firebase pour le frontend
 * Utilise la clé API Web Firebase du projet whatsappservice-50e51
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC1QO7iJdYlu6yRdFWV_LF9_lmw1ZjcZiA",
  authDomain: "whatsappservice-50e51.firebaseapp.com",
  projectId: "whatsappservice-50e51",
  storageBucket: "whatsappservice-50e51.firebasestorage.app",
  messagingSenderId: "1057451803817",
  appId: "1:1057451803817:web:YOUR_APP_ID"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Obtenir l'instance d'authentification
export const auth = getAuth(app);

export default app;
