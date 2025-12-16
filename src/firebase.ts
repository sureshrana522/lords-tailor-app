
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1. Try to get config from Local Storage (Dynamic Setup via UI)
const getStoredConfig = () => {
  try {
    const stored = localStorage.getItem('LB_FIREBASE_CONFIG');
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error("Invalid config in storage");
  }
  return null;
};

const userConfig = getStoredConfig();

// 2. Try to get config from Environment Variables (Professional Production Setup)
const envConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || process.env.REACT_APP_FIREBASE_APP_ID
};

// 3. HARDCODED CONFIGURATION (Provided directly)
const defaultConfig = {
  apiKey: "AIzaSyB62Cm6am_4sXoyIkTDwq-Ewerpqr79C3o",
  authDomain: "lords-tailor-5d768.firebaseapp.com",
  projectId: "lords-tailor-5d768",
  storageBucket: "lords-tailor-5d768.firebasestorage.app",
  messagingSenderId: "388897303244",
  appId: "1:388897303244:web:42bf72e4571b23306e3069",
  measurementId: "G-ZCX98QW7J5"
};

// Logic: User Config (UI) -> Env Config -> Hardcoded Default
const finalConfig = (userConfig && userConfig.apiKey) 
    ? userConfig 
    : (envConfig.apiKey ? envConfig : defaultConfig);

// Initialize Firebase
let app;
let auth;
let db;

if (finalConfig && finalConfig.apiKey) {
    try {
        app = initializeApp(finalConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        console.log("🔥 Firebase Connected Successfully via " + (userConfig ? "Manual Code" : (envConfig.apiKey ? "Env Vars" : "Default Config")));
    } catch (e) {
        console.error("Firebase Initialization Error:", e);
    }
} else {
    console.warn("⚠️ Firebase Config Missing. App running in Offline/Demo Mode.");
}

export { auth, db };
export default app;
