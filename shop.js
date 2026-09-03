const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
}

const db = admin.database();

// ============================================================
// AUTHENTICATION MIDDLEWARE (REQUIRED FOR ADMIN ENDPOINTS)
// ============================================================
const verifyAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized: No token provided' 
            });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        
        // Check if user has admin claim
        if (!decodedToken.admin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Forbidden: Admin access required' 
            });
        }

        req.user = decodedToken; // Store user data for later use
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ 
            success: false, 
            message: 'Unauthorized: Invalid token' 
        });
    }
};

// ============================================================
// PUBLIC: Fetch available accounts (No auth required)
// ============================================================
router.get('/api/accounts', async (req, res) => {
    try {
        const snapshot = await db.ref('shop_accounts').once('value');
        const data = snapshot.val() || {};
        const accounts = Object.values(data);
        
        // Remove credentials from public view
        const safeAccounts = accounts.map(account => {
            const { credentials, ...safeAccount } = account;
            return safeAccount;
        });

        res.status(200).json({ success: true, accounts: safeAccounts });
    } catch (error) {
        console.error('GET /api/accounts error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch accounts' });
    }
});

// ============================================================
// ADMIN ONLY: Create a new account listing
// ============================================================
router.post('/api/admin/accounts', verifyAdmin, async (req, res) => {
    try {
        const { platform, title, price, credentials, description } = req.body;

        // Validate required fields
        if (!platform || !title || !price || !credentials) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: platform, title, price, credentials' 
            });
        }

        // Validate price is a number
        if (isNaN(price) || price <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Price must be a positive number' 
            });
        }

        // Create new account in Firebase
        const newAccountRef = db.ref('shop_accounts').push();
        await newAccountRef.set({
            id: newAccountRef.key,
            platform: platform.trim(),
            title: title.trim(),
            price: Number(price),
            credentials: credentials.trim(),
            description: description ? description.trim() : '',
            status: 'Available',
            createdAt: Date.now()
        });

        res.status(200).json({ 
            success: true, 
            message: 'Account listed successfully!',
            accountId: newAccountRef.key
        });
    } catch (error) {
        console.error('POST /api/admin/accounts error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create account listing' 
        });
    }
});

module.exports = router;
