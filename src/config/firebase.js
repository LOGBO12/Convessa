/**
 * Configuration Firebase pour le frontend
 * Projet : Convessa (convessa-1da63)
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            "AIzaSyBqpElvBfYFxT2pE1Ectg8tt-aXnUapDSw",
  authDomain:        "convessa-1da63.firebaseapp.com",
  projectId:         "convessa-1da63",
  storageBucket:     "convessa-1da63.firebasestorage.app",
  messagingSenderId: "411445755590",
  appId:             "1:411445755590:web:98809e4e7c6080cf1a61c7",
  measurementId:     "G-HF3KWXHQY",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
