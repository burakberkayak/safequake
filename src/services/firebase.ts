import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'your_api_key' && 
  firebaseConfig.apiKey.trim() !== ''
);

let app: any = null;
let auth: any = null;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    // Initialize Firebase App
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

    // Initialize Firebase Auth with AsyncStorage Persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

    // Initialize Firestore
    db = getFirestore(app);
  } catch (err) {
    console.error('Firebase initialization failed:', err);
  }
}

// Fallbacks for offline / unconfigured demo mode
if (!auth) {
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback: any) => {
      // Immediately trigger callback with null to prevent infinite spinner
      setTimeout(() => callback(null), 100);
      return () => {};
    },
  };
}

export { app, auth, db };
