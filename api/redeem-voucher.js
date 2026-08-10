import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import './firebase-admin.js'; // Uses your project's existing shared admin initialization

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

    const cleanCode = voucherCode.trim().toUpperCase();
    const db = getDatabase();
    const voucherRef = db.ref(`vouchers/${cleanCode}`);
    
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

    // 4. Update User's Wallet Balance atomically
    await db.ref(`users/${userId}/wallet`).transaction((currentWallet) => {
      return (Number(currentWallet) || 0) + voucherAmount;
    });

    // 5. Mark voucher as used
    await voucherRef.update({ 
      isUsed: true, 
      usedBy: userId, 
      usedAt: Date.now() 
    });

    // 6. Log transaction
    const transactionRef = db.ref(`transactions`).push();
    await transactionRef.set({
      transactionId: "VCR-" + Math.floor(100000 + Math.random() * 900000),
      uid: userId,
      type: 'Voucher Redeem',
      description: `Redeemed voucher code: ${cleanCode}`,
      amount: voucherAmount,
      status: 'completed',
      createdAt: Date.now()
    });

    return res.status(200).json({ 
      success: true, 
      message: `Successfully redeemed ₦${voucherAmount.toLocaleString()} to your wallet!` 
    });

  } catch (error) {
    console.error('VOUCHER REDEMPTION ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error during redemption.' });
  }
}
