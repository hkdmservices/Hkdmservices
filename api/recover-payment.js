import axios from "axios";
import { admin, db } from "./firebase-admin.js";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });
    }

    try {

        /*
         * Firebase ID token must be supplied
         * in the Authorization header.
         */

        const authorization =
            req.headers.authorization || "";

        if (
            !authorization.startsWith("Bearer ")
        ) {

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });

        }

        const idToken =
            authorization.substring(7);

        /*
         * Verify the Firebase login.
         */

        const decodedToken =
            await admin.auth()
                .verifyIdToken(idToken);

        const loggedInUid =
            decodedToken.uid;


        /*
         * Payment reference.
         */

        const {
            reference
        } = req.body || {};

        if (!reference) {

            return res.status(400).json({
                success: false,
                message:
                    "Payment reference is required"
            });

        }


        /*
         * Check whether this payment
         * has already been processed.
         */

        const transactionRef =
            db.ref(
                `transactions/${reference}`
            );

        const existing =
            await transactionRef.get();

        if (existing.exists()) {

            return res.status(200).json({

                success: true,

                message:
                    "Payment already processed",

                transaction:
                    existing.val()

            });

        }


        /*
         * Verify the payment directly
         * with Korapay.
         */

        const response =
            await axios.get(

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

                message:
                    "Payment not found"

            });

        }


        /*
         * Payment must be successful.
         */

        if (
            payment.status !== "success"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Payment is not successful",

                status:
                    payment.status

            });

        }


        /*
         * Get UID from the verified
         * Korapay metadata.
         */

        const paymentUid =
            payment.metadata?.uid;


        if (!paymentUid) {

            console.error(
                "RECOVERY: UID missing",
                payment.metadata
            );

            return res.status(400).json({

                success: false,

                message:
                    "Firebase UID missing from payment metadata"

            });

        }


        /*
         * VERY IMPORTANT:
         *
         * The logged-in Firebase user must
         * be the same user attached to the
         * Korapay payment.
         */

        if (
            paymentUid !== loggedInUid
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This payment does not belong to the logged-in user"

            });

        }


        /*
         * Get verified amount.
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

                message:
                    "Invalid payment amount"

            });

        }


        /*
         * Confirm Firebase user exists.
         */

        const userRef =
            db.ref(
                `users/${paymentUid}`
            );

        const userSnapshot =
            await userRef.get();


        if (
            !userSnapshot.exists()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Firebase user not found"

            });

        }


        /*
         * Credit wallet atomically.
         */

        const walletRef =
            db.ref(
                `users/${paymentUid}/wallet`
            );


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


        if (
            !walletResult.committed
        ) {

            return res.status(500).json({

                success: false,

                message:
                    "Wallet credit failed"

            });

        }


        /*
         * Record transaction.
         */

        await transactionRef.set({

            uid:
                paymentUid,

            reference,

            amount,

            currency:
                payment.currency ||
                "NGN",

            status:
                "success",

            type:
                "wallet_funding",

            gateway:
                "korapay",

            description:
                "Wallet funding via Korapay",

            createdAt:
                Date.now()

        });


        console.log(
            "RECOVERY SUCCESS:",
            {
                reference,
                uid: paymentUid,
                amount
            }
        );


        return res.status(200).json({

            success: true,

            message:
                "Payment recovered and wallet funded successfully",

            reference,

            amount

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
