import crypto from "crypto";
import { db } from "./firebase-admin.js";

export default async function handler(req, res) {

  // Korapay sends webhook notifications using POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {

    const signature = req.headers["x-korapay-signature"];

    // Reject requests without Korapay signature
    if (!signature) {
      return res.status(401).json({
        success: false,
        message: "Missing Korapay signature"
      });
    }

    const { event, data } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Missing webhook data"
      });
    }

    // Verify that the webhook actually came from Korapay
    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.KORAPAY_SECRET_KEY
      )
      .update(JSON.stringify(data))
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(401).json({
        success: false,
        message: "Invalid Korapay signature"
      });
    }

    // We only credit successful collection payments
    if (
      event !== "charge.success" ||
      data.status !== "success"
    ) {
      return res.status(200).json({
        success: true,
        message: "Webhook received"
      });
    }

    const reference =
      data.payment_reference || data.reference;

    const amount = Number(data.amount);

    if (!reference || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment data"
      });
    }

    /*
      Prevent duplicate wallet credits.

      Korapay can retry a webhook if it doesn't receive
      a successful response.
    */
    const transactionRef = db.ref(
      `transactions/${reference}`
    );

    const existingTransaction =
      await transactionRef.get();

    if (existingTransaction.exists()) {
      return res.status(200).json({
        success: true,
        message: "Transaction already processed"
      });
    }

    // Get UID from transaction metadata
    const uid = data.metadata?.uid;

    if (!uid) {
      console.error(
        "Webhook missing Firebase UID:",
        reference
      );

      return res.status(400).json({
        success: false,
        message: "Missing user ID"
      });
    }

    // Get current wallet
    const walletRef = db.ref(
      `users/${uid}/wallet`
    );

    const walletSnapshot =
      await walletRef.get();

    const currentBalance =
      walletSnapshot.exists()
        ? Number(walletSnapshot.val())
        : 0;

    // Credit wallet
    await walletRef.set(
      currentBalance + amount
    );

    // Save transaction
    await transactionRef.set({
      uid,
      reference,
      amount,
      currency: data.currency || "NGN",
      status: "success",
      gateway: "korapay",
      event,
      createdAt: Date.now()
    });

    return res.status(200).json({
      success: true,
      message: "Wallet funded successfully"
    });

  } catch (error) {

    console.error(
      "KORAPAY WEBHOOK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed"
    });
  }
}
