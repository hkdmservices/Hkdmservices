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

        const {
            reference
        } = req.body || {};

        if (!reference) {
            return res.status(400).json({
                success: false,
                message: "Payment reference is required"
            });
        }

        /*
         * 1. Check whether this payment
         * has already been processed.
         */

        const transactionRef =
            db.ref(`transactions/${reference}`);

        const existing =
            await transactionRef.get();

        if (existing.exists()) {

            return res.status(200).json({
                success: true,
                message: "Payment already processed",
                transaction: existing.val()
            });

        }

        /*
         * 2. Verify the payment directly
         * with Korapay.
         */

        const response = await axios.get(

            `https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(reference)}`,

            {
                headers: {
                    Authorization:
                        `Bearer ${process.env.KORAPAY_SECRET_KEY}`
                }
            }

        );

        const payment =
            response.data?.data;

        if (!payment) {

            return res.status(400).json({
                success: false,
                message: "Payment not found"
            });

        }

        /*
         * 3. Confirm successful payment.
         */

        if (payment.status !== "success") {

            return res.status(400).json({
                success: false,
                message:
                    "Payment is not successful",
                status:
                    payment.status
            });

        }

        /*
         * 4. Get Firebase UID from
         * verified Korapay metadata.
         */

        const uid =
            payment.metadata?.uid;

        if (!uid) {

            console.error(
                "RECOVERY: UID missing",
                payment.metadata
            );

            return res.status(400).json({
                success: false,
                message:
                    "Firebase UID missing from verified payment metadata"
            });

        }

        /*
         * 5. Use the amount accepted
         * by Korapay.
         */

        const amount =
            Number(
                payment.amount_accepted ??
                payment.amount_paid ??
                payment.amount ??
                0
            );

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid payment amount"
            });

        }

        /*
         * 6. Confirm Firebase user exists.
         */

        const userRef =
            db.ref(`users/${uid}`);

        const userSnapshot =
            await userRef.get();

        if (!userSnapshot.exists()) {

            return res.status(400).json({
                success: false,
                message:
                    "Firebase user not found"
            });

        }

        /*
         * 7. Atomically credit wallet.
         */

        const walletRef =
            db.ref(`users/${uid}/wallet`);

        const walletResult =
            await walletRef.transaction(
                currentValue => {

                    const balance =
                        Number(
                            currentValue || 0
                        );

                    return Number(
                        (
                            balance +
                            amount
                        ).toFixed(2)
                    );

                }
            );

        if (!walletResult.committed) {

            return res.status(500).json({
                success: false,
                message:
                    "Wallet credit failed"
            });

        }

        /*
         * 8. Save transaction.
         */

        await transactionRef.set({

            uid,

            reference,

            amount,

            currency:
                payment.currency || "NGN",

            status: "success",

            type: "wallet_funding",

            gateway: "korapay",

            description:
                "Wallet funding via Korapay",

            createdAt:
                Date.now()

        });

        console.log(
            "RECOVERY SUCCESS:",
            {
                reference,
                uid,
                amount
            }
        );

        return res.status(200).json({

            success: true,

            message:
                "Payment recovered and wallet funded successfully",

            reference,

            amount,

            uid

        });

    } catch (error) {

        console.error(
            "RECOVERY ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Payment recovery failed"

        });

    }

}
