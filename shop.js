const express = require('express');
const router = express.Router();
// Assuming you have initialized firebase admin or database reference as 'db'
const db = require('../config/firebase'); // Adjust based on your project structure

// Admin creates a social account listing
router.post('/api/admin/accounts', async (req, res) => {
    try {
        const { platform, title, price, credentials, description } = req.body;
        
        const newAccountRef = db.ref('shop_accounts').push();
        await newAccountRef.set({
            id: newAccountRef.key,
            platform,
            title,
            price,
            credentials,
            description,
            status: 'Available',
            createdAt: Date.now()
        });

        res.status(200).json({ success: true, message: 'Account listed successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Customers fetch available accounts for shop.html
router.get('/api/accounts', async (req, res) => {
    try {
        const snapshot = await db.ref('shop_accounts').once('value');
        const data = snapshot.val() || {};
        const accounts = Object.values(data);
        res.status(200).json({ success: true, accounts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
