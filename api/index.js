import express from "express";
import { db } from "./firebase-admin.js";

const app = express();
app.use(express.json());

// 1. ADD ACCOUNT
app.post("/api/add-account", async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { platform, niche, followers, price, credentials, status, createdAt } = req.body;

    if (!platform || !price || !credentials) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    const newAccountRef = db.ref('accounts').push();
    await newAccountRef.set({
      platform,
      niche: niche || 'General',
      followers: followers || 0,
      price: Number(price),
      credentials,
      status: status || 'available',
      createdAt
    });

    return res.status(200).json({ success: true, accountId: newAccountRef.key });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. GET ACCOUNTS
app.get("/api/get-accounts", async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const snapshot = await db.ref('accounts').orderByChild('status').equalTo('available').once('value');
    const accounts = snapshot.val() || {};
    
    return res.status(200).json({ success: true, accounts });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. BUY ACCOUNT WALLET
app.post("/api/buy-account-wallet", async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { accountId, email } = req.body;
    const userId = req.headers['x-user-id'] || req.body.userId;

    if (!accountId || !userId || userId === 'guest') {
      return res.status(400).json({ success: false, message: 'Authentication required or missing account ID.' });
    }

    const accountRef = db.ref(`accounts/${accountId}`);
    const userWalletRef = db.ref(`users/${userId}/wallet`);
    
    const accountSnap = await accountRef.once('value');
    const accountData = accountSnap.val();

    if (!accountData || accountData.status !== 'available') {
      return res.status(400).json({ success: false, message: 'This account is no longer available.' });
    }

    const price = Number(accountData.price);
    const walletSnap = await userWalletRef.once('value');
    const currentBalance = Number(walletSnap.val() || 0);

    if (currentBalance < price) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient wallet balance. You need ₦${price.toLocaleString()} but have ₦${currentBalance.toLocaleString()}. Please fund your wallet first.` 
      });
    }

    const reference = `WLK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await userWalletRef.set(currentBalance - price);
    await accountRef.update({
      status: 'sold',
      soldTo: email,
      soldAt: new Date().toISOString(),
      reference
    });

    return res.status(200).json({
      success: true,
      reference,
      platform: accountData.platform
    });

  } catch (error) {
    console.error('Wallet purchase error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default app;
