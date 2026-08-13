import admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY
                    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                    : undefined
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });

        console.log('Firebase Admin initialized successfully.');
    } catch (err) {
        console.error('Firebase initialization error:', err);
    }
}

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        // =====================================================
        // VERIFY USER
        // =====================================================

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No token provided.'
            });
        }

        const idToken = authHeader.substring(7);

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // =====================================================
        // FIREBASE DATABASE
        // =====================================================

        const db = admin.database();

        const userRef = db.ref(`users/${uid}`);

        const snapshot = await userRef.once('value');

        if (!snapshot.exists()) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found.'
            });
        }

        const userData = snapshot.val();

        // =====================================================
        // CURRENT ACCOUNT INFORMATION
        // =====================================================

        const currentWallet = Number(userData.wallet || 0);

        const currentTier = String(
            userData.tier || 'regular'
        ).toLowerCase();

        // =====================================================
        // CHECK IF ALREADY RESELLER
        // =====================================================

        if (currentTier === 'reseller') {
            return res.status(400).json({
                success: false,
                message: 'You are already an official Reseller!'
            });
        }

        // =====================================================
        // RESELLER UPGRADE COST
        // =====================================================

        const cost = 100000;

        // =====================================================
        // CHECK WALLET BALANCE
        // =====================================================

        if (currentWallet < cost) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient wallet balance to unlock Reseller tier.'
            });
        }

        // =====================================================
        // CALCULATE NEW BALANCE
        // =====================================================

        const newWalletBalance = currentWallet - cost;

        const now = Date.now();

        // =====================================================
        // CREATE TRANSACTION FIRST
        // =====================================================

        const transactionRef = db.ref('transactions').push();

        const transactionId =
            `RES-${now}-${uid.substring(0, 6).toUpperCase()}`;

        const transactionData = {
            transactionId: transactionId,
            uid: uid,
            email: userData.email || decodedToken.email || '—',

            type: 'Reseller Upgrade',

            description:
                'Official Reseller account upgrade',

            amount: cost,

            status: 'completed',

            createdAt: now,

            tier: 'reseller',

            previousTier: currentTier,

            newTier: 'reseller'
        };

        // =====================================================
        // UPDATE USER + TRANSACTION TOGETHER
        // =====================================================

        const updates = {};

        updates[`users/${uid}/wallet`] = newWalletBalance;
        updates[`users/${uid}/tier`] = 'reseller';
        updates[`users/${uid}/resellerUnlockedAt`] = now;
        updates[`users/${uid}/updatedAt`] = now;

        updates[`transactions/${transactionRef.key}`] =
            transactionData;

        await db.ref().update(updates);

        console.log(
            `Reseller upgrade successful for UID: ${uid}`
        );

        console.log(
            `Transaction created: ${transactionId}`
        );

        // =====================================================
        // SUCCESS RESPONSE
        // =====================================================

        return res.status(200).json({
            success: true,

            message:
                'Reseller tier unlocked successfully!',

            transactionId: transactionId,

            amount: cost,

            previousTier: currentTier,

            newTier: 'reseller',

            newWalletBalance: newWalletBalance
        });

    } catch (error) {

        console.error(
            'Reseller Upgrade Error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                'Internal server error.'
        });
    }
}
