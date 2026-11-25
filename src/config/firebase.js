/**
 * Configuration Firebase pour le frontend
 * Projet : CONVESSA (convessa-b3ecd)
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            "AIzaSyDBhRKRGnZ9Ew8LMFBBA2lIanKA3CorW4w",
  authDomain:        "convessa-b3ecd.firebaseapp.com",
  projectId:         "convessa-b3ecd",
  storageBucket:     "convessa-b3ecd.firebasestorage.app",
  messagingSenderId: "577193495652",
  appId:             "1:577193495652:web:0cc4cae569e4ba90112371",
  measurementId:     "G-1JMPK0FWTM",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
