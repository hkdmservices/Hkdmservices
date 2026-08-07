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
        message: "Missing payment reference or user ID."
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

    const payment = response.data;

    if (!payment || payment.status !== "success") {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed."
      });
    }

    // Check if we've already processed this payment
    const txRef = db.ref("transactions/" + reference);
    const txSnapshot = await txRef.get();

    if (txSnapshot.exists()) {
      return res.json({
        success: true,
        message: "Payment already processed."
      });
    }

    // Read current wallet
    const userRef = db.ref("users/" + uid);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const user = userSnapshot.val();
    const amount = Number(payment.data.amount);

    await userRef.update({
      wallet: Number(user.wallet || 0) + amount
    });

    await txRef.set({
      uid,
      amount,
      reference,
      provider: "Korapay",
      status: "success",
      createdAt: Date.now()
    });

    return res.json({
      success: true
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }

}
