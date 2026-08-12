const { admin, database } = require('./firebase-admin');

module.exports = async function handler(req, res) {
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

        const userRef = database.ref(`users/${uid}`);
        const snapshot = await userRef.get();

        if (!snapshot.exists()) {
            return res.status(404).json({ success: false, message: "User profile not found." });
        }

        const userData = snapshot.val();
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
        
        await userRef.update({
            wallet: newWalletBalance,
            tier: 'reseller',
            resellerUnlockedAt: Date.now()
        });

        return res.json({
            success: true,
            message: "Reseller tier unlocked successfully! Reloading..."
        });

    } catch (error) {
        console.error("Reseller Upgrade Error:", error);
        return res.status(500).json({ success: false, message: error.message || "Internal server error." });
    }
};
