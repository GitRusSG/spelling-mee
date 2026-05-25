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

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'YOUR_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'YOUR_PROJECT.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'YOUR_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'YOUR_PROJECT.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? 'YOUR_SENDER_ID',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? 'YOUR_APP_ID',
};

// Initialize Firebase (avoid re-initializing if already done)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth — uses browser persistence on web, in-memory on native
const auth = getAuth(app);

export { app, auth };
