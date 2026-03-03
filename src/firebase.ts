import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// User provided configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRSnnPNDo93eAWLIItCsY_zE32C7Vk6-o",
  authDomain: "lifestyle-9abea.firebaseapp.com",
  databaseURL: "https://lifestyle-9abea-default-rtdb.firebaseio.com",
  projectId: "lifestyle-9abea",
  storageBucket: "lifestyle-9abea.firebasestorage.app",
  messagingSenderId: "899636402390",
  appId: "1:899636402390:web:98bd575711d11d98f79177"
};

// Validate if the databaseURL is a proper URL
const isValidUrl = (url: string | undefined) => {
  if (!url || url.includes('YOUR_DATABASE_URL')) return false;
  try {
    new URL(url);
    return url.startsWith('https://');
  } catch {
    return false;
  }
};

const isConfigured = !!firebaseConfig.apiKey && isValidUrl(firebaseConfig.databaseURL);

const app = isConfigured 
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) 
  : null;

export const db = app ? getDatabase(app) : null;
export const auth = app ? getAuth(app) : null;
export { isConfigured };
