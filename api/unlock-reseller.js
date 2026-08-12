import admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
            }),
            databaseURL: "https://hkdm-services-default-rtdb.firebaseio.com"
        });
    } catch (err) {
        console.error('Firebase initialization error:', err);
    }
}

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: "Unauthorized: No token provided." });
        }
        
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Generate short-lived access token with explicit Firebase database scopes
        const cert = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
        });
        const appToken = await cert.getAccessToken([
            'https://www.googleapis.com/auth/firebase.database',
            'https://www.googleapis.com/auth/userinfo.email'
        ]);

        const dbUrl = `https://hkdm-services-default-rtdb.firebaseio.com/users/${uid}.json`;
        
        // Fetch user profile via instant REST API
        const getRes = await fetch(dbUrl, {
            headers: {
                'Authorization': `Bearer ${appToken.access_token}`
            }
        });

        if (!getRes.ok) {
            throw new Error("Failed to fetch user data from database.");
        }

        const userData = await getRes.json();

        if (!userData) {
            return res.status(404).json({ success: false, message: "User profile not found." });
        }

        const currentWallet = Number(userData.wallet || 0);
        const currentTier = (userData.tier || 'regular').toLowerCase();

        if (currentTier === 'reseller') {
            return res.status(400).json({ success: false, message: "You are already an official Reseller!" });
        }

        const cost = 100000;
        if (currentWallet < cost) {
            return res.status(400).json({ success: false, message: "Insufficient wallet balance to unlock Reseller tier." });
        }

        const newWalletBalance = currentWallet - cost;
        
        // Update user profile via instant REST PATCH
        const patchRes = await fetch(dbUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${appToken.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wallet: newWalletBalance,
                tier: 'reseller',
                resellerUnlockedAt: Date.now()
            })
        });

        if (!patchRes.ok) {
            throw new Error("Failed to update user profile in database.");
        }

        return res.status(200).json({
            success: true,
            message: "Reseller tier unlocked successfully! Reloading..."
        });

    } catch (error) {
        console.error("Reseller Upgrade Error:", error);
        return res.status(500).json({ success: false, message: error.message || "Internal server error." });
    }
}
