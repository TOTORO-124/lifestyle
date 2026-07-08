/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const dbUrlEnv = import.meta.env.VITE_FIREBASE_DATABASE_URL;
let finalDbUrl = "https://lifestyle-9abea-default-rtdb.firebaseio.com";
if (dbUrlEnv && dbUrlEnv.trim() !== '') {
  if (dbUrlEnv.startsWith('http')) {
    finalDbUrl = dbUrlEnv;
  } else {
    // If it's just a project ID or some string, convert it to a valid Firebase RTDB URL
    finalDbUrl = `https://${dbUrlEnv}-default-rtdb.firebaseio.com`;
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBRSnnPNDo93eAWLIItCsY_zE32C7Vk6-o",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lifestyle-9abea.firebaseapp.com",
  databaseURL: finalDbUrl,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lifestyle-9abea",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lifestyle-9abea.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "899636402390",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:899636402390:web:98bd575711d11d98f79177"
};

const isConfigured = !!firebaseConfig.apiKey;

const app = isConfigured 
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
  : null;

export const db = app ? getDatabase(app) : null;
export const firestore = app ? getFirestore(app, import.meta.env.VITE_FIREBASE_DATABASE_ID || undefined) : null;
export const auth = app ? getAuth(app) : null;

export { isConfigured };
