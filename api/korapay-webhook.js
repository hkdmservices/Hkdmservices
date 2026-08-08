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

        const body = req.body || {};

        const data =
            body.data || {};


        /*
            Korapay webhook provides the
            payment reference here.
        */

        const reference =
            data.reference ||
            data.payment_reference;


        if (!reference) {

            console.error(
                "KORAPAY WEBHOOK: Missing reference"
            );

            return res.status(400).json({
                success: false,
                message: "Missing payment reference"
            });

        }



        /*
            Prevent duplicate processing.
        */

        const transactionRef =
            db.ref(
                `transactions/${reference}`
            );


        const existingTransaction =
            await transactionRef.get();


        if (existingTransaction.exists()) {

            return res.status(200).json({

                success: true,

                message:
                    "Transaction already processed"

            });

        }



        /*
            VERIFY THE PAYMENT DIRECTLY
            WITH KORAPAY.
        */

        const verificationResponse =
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
            verificationResponse.data?.data;


        if (!payment) {

            console.error(
                "KORAPAY WEBHOOK: Payment not found",
                reference
            );

            return res.status(400).json({

                success: false,

                message:
                    "Payment could not be verified"

            });

        }



        /*
            Only successful payments
            can fund the wallet.
        */

        if (
            payment.status !== "success"
        ) {

            return res.status(200).json({

                success: true,

                message:
                    "Payment is not successful",

                status:
                    payment.status

            });

        }



        /*
            GET UID FROM THE VERIFIED
            KORAPAY CHARGE METADATA.

            This is the important fix.
        */

        const uid =
            payment.metadata?.uid;


        if (!uid) {

            console.error(

                "KORAPAY WEBHOOK: UID missing from verified payment",

                reference,

                payment.metadata

            );

            return res.status(400).json({

                success: false,

                message:
                    "User ID missing from payment metadata"

            });

        }



        /*
            Get the amount from Korapay's
            verified transaction.

            amount_accepted is preferred.
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

            console.error(

                "KORAPAY WEBHOOK: Invalid amount",

                reference,
                amount

            );

            return res.status(400).json({

                success: false,

                message:
                    "Invalid payment amount"

            });

        }



        /*
            Currency check.
        */

        const currency =
            payment.currency ||
            "NGN";


        if (
            currency !== "NGN"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Unsupported payment currency"

            });

        }



        /*
            Check that the Firebase user
            actually exists.
        */

        const userRef =
            db.ref(
                `users/${uid}`
            );


        const userSnapshot =
            await userRef.get();


        if (!userSnapshot.exists()) {

            console.error(

                "KORAPAY WEBHOOK: Firebase user not found",

                uid

            );

            return res.status(400).json({

                success: false,

                message:
                    "Firebase user not found"

            });

        }



        /*
            Get wallet.
        */

        const walletRef =
            db.ref(
                `users/${uid}/wallet`
            );


        /*
            Atomically add the payment.
        */

        const walletTransaction =
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
            !walletTransaction.committed
        ) {

            console.error(

                "KORAPAY WEBHOOK: Wallet transaction failed",

                reference

            );

            return res.status(500).json({

                success: false,

                message:
                    "Wallet credit was not completed"

            });

        }



        /*
            Save funding transaction.
        */

        await transactionRef.set({

            uid,

            reference,

            amount,

            currency,

            status: "success",

            type: "wallet_funding",

            description:
                "Wallet funding via Korapay",

            gateway:
                "korapay",

            createdAt:
                Date.now()

        });



        console.log(

            "KORAPAY WEBHOOK: Wallet funded successfully",

            {
                reference,
                uid,
                amount
            }

        );


        return res.status(200).json({

            success: true,

            message:
                "Wallet funded successfully",

            reference,

            amount

        });


    } catch (error) {

        console.error(

            "KORAPAY WEBHOOK ERROR:",

            error.response?.data ||
            error.message ||
            error

        );


        return res.status(500).json({

            success: false,

            message:
                "Webhook processing failed"

        });

    }

}
