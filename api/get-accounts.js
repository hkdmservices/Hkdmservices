import { db } from './firebase-admin.js'; // or require depending on your setup

export default async function handler(req, res) {
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
}
