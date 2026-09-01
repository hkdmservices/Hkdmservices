import { db } from './firebase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { platform, niche, followers, price, credentials, status, createdAt } = req.body;

    if (!platform || !price || !credentials) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    // Push new entry into the accounts node
    const newAccountRef = db.ref('accounts').push();
    await newAccountRef.set({
      platform,
      niche: niche || 'General',
      followers: followers || 0,
      price: Number(price),
      credentials, // Admin can view this later to hand over via WhatsApp
      status: status || 'available',
      createdAt
    });

    return res.status(200).json({ success: true, accountId: newAccountRef.key });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
