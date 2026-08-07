import axios from "axios";
import { db } from "./firebase-admin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const { reference, uid } = req.body;

    if (!reference || !uid) {
      return res.status(400).json({
        success: false,
        message: "Missing reference or uid"
      });
    }

    const response = await axios.get(
      `https://api.korapay.com/merchant/api/v1/charges/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}`
        }
      }
    );

    const payment = response.data.data;

    if (!payment || payment.status !== "success") {
      return res.status(400).json({
        success: false,
        message: "Payment not successful"
      });
    }

    const amount = Number(payment.amount);

    const walletRef = db.ref(`users/${uid}/wallet`);
    const snapshot = await walletRef.get();

    const currentBalance = snapshot.exists()
      ? Number(snapshot.val())
      : 0;

    await walletRef.set(currentBalance + amount);

    await db.ref(`transactions/${reference}`).set({
      uid,
      reference,
      amount,
      status: "success",
      createdAt: Date.now()
    });

    return res.status(200).json({
      success: true,
      message: "Wallet funded successfully"
    });

  } catch (error) {
    console.error(error.response?.data || error);

    return res.status(500).json({
      success: false,
      message: "Verification failed"
    });
  }
}
