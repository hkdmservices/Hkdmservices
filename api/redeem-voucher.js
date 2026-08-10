import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    // If you use a service account file, add credential: cert(...) here,
    // otherwise it will pick up default environment credentials if hosted on Vercel/Firebase.
    databaseURL: "YOUR_FIREBASE_DATABASE_URL" 
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 1. Verify user's ID token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided.' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // 2. Get voucher code from request body
    const { voucherCode } = req.body;
    if (!voucherCode) {
      return res.status(400).json({ message: 'Voucher code is required.' });
    }

    const db = getDatabase();
    const voucherRef = db.ref(`vouchers/${voucherCode}`);
    
    // 3. Check voucher validity
    const snapshot = await voucherRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'Invalid or non-existent voucher code.' });
    }

    const voucherData = snapshot.val();
    if (voucherData.isUsed) {
      return res.status(400).json({ message: 'This voucher has already been used.' });
    }

    const voucherAmount = Number(voucherData.amount);

    // 4. Update User's Balance & Mark Voucher as Used atomically using a transaction
    const userRef = db.ref(`users/${userId}`);
    
    // Update user balance safely
    await db.ref(`users/${userId}/balance`).transaction((currentBalance) => {
      return (currentBalance || 0) + voucherAmount;
    });

    // Mark voucher as used (or delete it)
    await voucherRef.update({ isUsed: true, usedBy: userId, usedAt: Date.now() });

    // Optional: Log transaction
    const transactionRef = db.ref(`transactions/${userId}`).push();
    await transactionRef.set({
      type: 'voucher_redeem',
      amount: voucherAmount,
      code: voucherCode,
      timestamp: Date.now()
    });

    return res.status(200).json({ 
      success: true, 
      message: `Successfully redeemed ₦${voucherAmount.toLocaleString()}!` 
    });

  } catch (error) {
    console.error('VOUCHER REDEMPTION ERROR:', error);
    return res.status(500).json({ message: 'Internal server error during redemption.' });
  }
}
