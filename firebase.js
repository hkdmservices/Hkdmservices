// ============================================================
// HKDMservices Firebase Configuration
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

// Import Config (keys are loaded from config.js)
import { CONFIG } from './config.js';

// Firebase Configuration
const firebaseConfig = {
  apiKey: CONFIG.FIREBASE_API_KEY,
  authDomain: CONFIG.FIREBASE_AUTH_DOMAIN,
  databaseURL: CONFIG.FIREBASE_DATABASE_URL,
  projectId: CONFIG.FIREBASE_PROJECT_ID,
  storageBucket: CONFIG.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: CONFIG.FIREBASE_MESSAGING_SENDER_ID,
  appId: CONFIG.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Set persistence
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.warn("Persistence error:", error);
  });

export { app, auth, database };
