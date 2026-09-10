// ============================================================
// HKDMservices Firebase Configuration
// Uses compat SDK to match dashboard.html inline scripts
// ============================================================

import { CONFIG } from './config.js';

// Wait until the global firebase object is available
function waitForFirebase() {
    return new Promise((resolve) => {
        if (typeof firebase !== 'undefined' && firebase.apps) {
            resolve();
        } else {
            setTimeout(() => waitForFirebase().then(resolve), 50);
        }
    });
}

await waitForFirebase();

const firebaseConfig = {
    apiKey: CONFIG.FIREBASE_API_KEY,
    authDomain: CONFIG.FIREBASE_AUTH_DOMAIN,
    databaseURL: CONFIG.FIREBASE_DATABASE_URL,
    projectId: CONFIG.FIREBASE_PROJECT_ID,
    storageBucket: CONFIG.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: CONFIG.FIREBASE_MESSAGING_SENDER_ID,
    appId: CONFIG.FIREBASE_APP_ID
};

// Reuse the same global firebase app (initialized by the compat SDK)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const app = firebase.app();
const auth = firebase.auth();
const database = firebase.database();

// Persistence
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((error) => {
    console.warn("Persistence error:", error);
});

export { app, auth, database };
