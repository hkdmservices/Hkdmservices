import axios from "axios";
import { db } from "./firebase-admin.js";

const RECOVERY_REFERENCE =
    "HKDM-1786187655787-ila7bj";

const RECOVERY_AMOUNT = 100;

export default async function handler(req, res) {

    /*
     * This recovery endpoint is locked to the
     * single existing ₦100 payment.
     */

    if (
        req.method !== "GET" &&
        req.method !== "POST"
    ) {

        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });

    }

    try {

        /*
         * Prevent recovery from being run again
         * after the transaction has already been saved.
         */

        const transactionRef =
            db.ref(
                `transactions/${RECOVERY_REFERENCE}`
            );

        const existing =
            await transactionRef.get();

        if (existing.exists()) {

            return res.status(200).json({

                success: true,

                message:
                    "This payment has already been recovered.",

                transaction:
                    existing.val()

            });

        }


        /*
         * Ask Korapay for the original payment.
         */

        const response =
            await axios.get(

                `https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(RECOVERY_REFERENCE)}`,

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
                    "Korapay could not find the payment."

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
                    "The payment is not successful.",

                status:
                    payment.status

            });

        }


        /*
         * Get UID from the original
         * Korapay metadata.
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
                    "Korapay payment does not contain the Firebase UID."

            });

        }


        /*
         * Get the amount accepted by Korapay.
         */

        const amount =
            Number(
                payment.amount_accepted ??
                payment.amount_paid ??
                payment.amount ??
                0
            );


        /*
         * Safety check:
         * this recovery is ONLY for ₦100.
         */

        if (
            amount !== RECOVERY_AMOUNT
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Payment amount does not match the recovery amount.",

                amount

            });

        }


        /*
         * Confirm that the Firebase user exists.
         */

        const userRef =
            db.ref(
                `users/${uid}`
            );

        const userSnapshot =
            await userRef.get();


        if (
            !userSnapshot.exists()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Firebase user was not found."

            });

        }


        /*
         * Read current wallet balance.
         */

        const walletRef =
            db.ref(
                `users/${uid}/wallet`
            );

        const walletSnapshot =
            await walletRef.get();


        const currentBalance =
            walletSnapshot.exists()
                ? Number(walletSnapshot.val())
                : 0;


        /*
         * Credit exactly ₦100.
         */

        const newBalance =
            Number(
                (
                    currentBalance +
                    RECOVERY_AMOUNT
                ).toFixed(2)
            );


        await walletRef.set(
            newBalance
        );


        /*
         * Record the recovered payment.
         */

        await transactionRef.set({

            uid,

            reference:
                RECOVERY_REFERENCE,

            amount:
                RECOVERY_AMOUNT,

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
                "Recovered Korapay wallet funding",

            recovered:
                true,

            createdAt:
                Date.now()

        });


        console.log(
            "RECOVERY SUCCESS:",
            {
                reference:
                    RECOVERY_REFERENCE,

                uid,

                amount:
                    RECOVERY_AMOUNT,

                previousBalance:
                    currentBalance,

                newBalance
            }
        );


        return res.status(200).json({

            success: true,

            message:
                "The ₦100 payment was recovered successfully.",

            reference:
                RECOVERY_REFERENCE,

            amount:
                RECOVERY_AMOUNT,

            newBalance

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
                "Payment recovery failed."

        });

    }

}
