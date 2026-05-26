/**
 * Firebase configuration and initialization.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Email/Password authentication in Authentication > Sign-in method
 * 3. Register a Web app in Project Settings > General > Your apps
 * 4. Copy the config values into a `.env` file at the project root
 *    (see `.env.example` for the required variables)
 *
 * The app uses EXPO_PUBLIC_ prefixed env vars so they're available at runtime
 * in both web and native Expo builds.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyAAziAfq_-6Gnfm12d1FLsKeyM_19rt5ro',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'spelling-mee.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'spelling-mee',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'spelling-mee.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '944263571630',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:944263571630:web:03f7a98db1cca1fd90a53f',
};

// Initialize Firebase (avoid re-initializing if already done)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth — uses browser persistence on web, in-memory on native
const auth = getAuth(app);

// Initialize Firestore — used for user profiles, shared lists, dictation metadata
const db = getFirestore(app);

// Initialize Firebase Storage — used for dictation audio file uploads/downloads
const storage = getStorage(app);

export { app, auth, db, storage };
