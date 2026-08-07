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
        message: "Missing payment reference or user id"
      });
    }


    // Check if this transaction was already processed
    const existingTransaction = await db
      .ref(`transactions/${reference}`)
      .get();


    if (existingTransaction.exists()) {

      return res.status(200).json({
        success: true,
        message: "Payment already processed"
      });

    }


    // Verify payment with Korapay

    const response = await axios.get(
      `https://api.korapay.com/merchant/api/v1/charges/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}`,
          Accept: "application/json"
        }
      }
    );


    const payment = response.data.data;


    if (!payment) {

      return res.status(400).json({
        success: false,
        message: "Payment not found"
      });

    }


    if (payment.status !== "success") {

      return res.status(400).json({
        success: false,
        message: "Payment not successful"
      });

    }


    const amount = Number(payment.amount);


    if (!amount || amount <= 0) {

      return res.status(400).json({
        success: false,
        message: "Invalid payment amount"
      });

    }


    // Get current wallet balance

    const walletRef = db.ref(`users/${uid}/wallet`);

    const walletSnapshot = await walletRef.get();


    const currentBalance = walletSnapshot.exists()
      ? Number(walletSnapshot.val())
      : 0;


    // Update wallet

    await walletRef.set(
      currentBalance + amount
    );


    // Save transaction

    await db.ref(`transactions/${reference}`).set({

      uid: uid,

      reference: reference,

      amount: amount,

      status: "success",

      gateway: "korapay",

      createdAt: Date.now()

    });


    return res.status(200).json({

      success: true,

      message: "Wallet funded successfully"

    });


  } catch (error) {

    console.error(
      "VERIFY PAYMENT ERROR:",
      error.response?.data || error.message
    );


    return res.status(500).json({

      success: false,

      message:
        error.response?.data?.message ||
        "Payment verification failed"

    });

  }

}
