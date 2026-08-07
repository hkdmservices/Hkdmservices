// Firebase Authentication for HKDMServices

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADhpdfM0GaMJIkeQw7Q6eBK3u9CaWUC9k",
  authDomain: "hkdmservices-7d59f.firebaseapp.com",
  projectId: "hkdmservices-7d59f",
  storageBucket: "hkdmservices-7d59f.firebasestorage.app",
  messagingSenderId: "839538334772",
  appId: "1:839538334772:web:7d8785f87363b6e5d8fe61"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

console.log("Firebase Connected");
