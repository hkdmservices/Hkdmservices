// ============================================================
// HKDMservices Firebase Configuration
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    indexedDBLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getDatabase
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

// ============================================================
// Import Config (keys are loaded from config.js)
// ============================================================

import { CONFIG } from './config.js';

// ============================================================
// Firebase Configuration (using CONFIG from config.js)
// ============================================================

const firebaseConfig = {
    apiKey: CONFIG.FIREBASE_API_KEY,
    authDomain: CONFIG.FIREBASE_AUTH_DOMAIN,
    databaseURL: CONFIG.FIREBASE_DATABASE_URL,
    projectId: CONFIG.FIREBASE_PROJECT_ID,
    storageBucket: CONFIG.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: CONFIG.FIREBASE_MESSAGING_SENDER_ID,
    appId: CONFIG.FIREBASE_APP_ID
};

// ============================================================
// Initialize Firebase
// ============================================================

const app = initializeApp(firebaseConfig);

// ============================================================
// Initialize Authentication & Persistence
// ============================================================

const auth = getAuth(app);

// Explicitly handle and apply persistence safely for mobile/iOS Safari
setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
        console.warn("Local persistence failed, falling back to IndexedDB:", error);
        return setPersistence(auth, indexedDBLocalPersistence);
    })
    .catch((err) => {
        console.error("All persistence mechanisms failed:", err);
    });

// ============================================================
// Initialize Realtime Database
// ============================================================

const database = getDatabase(app);

// ============================================================
// Exports
// ============================================================

export {
    app,
    auth,
    database
};
