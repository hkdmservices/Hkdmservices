// ============================================================
// HKDMservices Firebase Configuration
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getAuth,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getDatabase
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


// ============================================================
// Firebase Configuration
// ============================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyADhpdfM0GaMJIkeQw7Q6eBK3u9CaWUC9k",

    authDomain:
        "hkdmservices-7d59f.firebaseapp.com",

    databaseURL:
        "https://hkdmservices-7d59f-default-rtdb.firebaseio.com",

    projectId:
        "hkdmservices-7d59f",

    storageBucket:
        "hkdmservices-7d59f.firebasestorage.app",

    messagingSenderId:
        "839538334772",

    appId:
        "1:839538334772:web:7d8785f87363b6e5d8fe61"

};


// ============================================================
// Initialize Firebase
// ============================================================

const app =
    initializeApp(firebaseConfig);


// ============================================================
// Initialize Authentication
// ============================================================

const auth =
    getAuth(app);


// ============================================================
// Authentication Persistence
// ============================================================

const authPersistence =
    setPersistence(
        auth,
        browserLocalPersistence
    );


// ============================================================
// Initialize Realtime Database
// ============================================================

const database =
    getDatabase(app);


// ============================================================
// Exports
// ============================================================

export {
    app,
    auth,
    database,
    authPersistence
};
