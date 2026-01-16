
// This file reads the Firebase config from environment variables.
// These variables are defined in the .env file and exposed to the client
// in next.config.ts.

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Try to read from environment variables first
const getEnvVar = (key: string, fallback: string = '') => {
  if (isBrowser) {
    // In browser, Next.js exposes env vars prefixed with NEXT_PUBLIC_
    return (window as any).__NEXT_DATA__?.props?.pageProps?.[key] || fallback;
  }
  // On server, use process.env
  return process.env[key] || fallback;
};

// Parse FIREBASE_CONFIG if available (for App Hosting)
let parsedConfig: any = {};
try {
  const firebaseConfigStr = process.env.FIREBASE_CONFIG;
  if (firebaseConfigStr) {
    parsedConfig = JSON.parse(firebaseConfigStr);
  }
} catch (e) {
  console.warn('Failed to parse FIREBASE_CONFIG:', e);
}

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || parsedConfig.apiKey || "API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || parsedConfig.authDomain || "PROJECT_ID.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || parsedConfig.projectId || "PROJECT_ID",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || parsedConfig.storageBucket || "PROJECT_ID.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || parsedConfig.messagingSenderId || "SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || parsedConfig.appId || "APP_ID",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || parsedConfig.measurementId || "G-MEASUREMENT_ID",
};

// Validate configuration
const isConfigValid = () => {
  return firebaseConfig.apiKey !== "API_KEY" && 
         firebaseConfig.projectId !== "PROJECT_ID" &&
         firebaseConfig.apiKey.length > 0;
};

if (!isConfigValid() && isBrowser) {
  console.warn(
    '⚠️ Firebase configuration not properly set. ' +
    'Please configure Firebase credentials in .env.local or disable Firebase features.'
  );
}
