// api/firebase-admin.js
import admin from "firebase-admin";

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    databaseURL: "https://hkdmservices-7d59f-default-rtdb.firebaseio.com",
  });
}

const db = admin.database();
const auth = admin.auth();

export { admin, db, auth };
