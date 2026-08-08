import axios from "axios";
import { db } from "./firebase-admin.js";

export default async function handler(req, res) {

    /*
        Korapay webhook must use POST.
    */

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });

    }


    try {

        const body =
            req.body || {};

        const data =
            body.data || body;


        /*
            Get the payment reference.

            Korapay documentation uses
            data.reference for transaction
            references. We also support
            payment_reference because some
            charge responses use that field.
        */

        const reference =
            data.reference ||
            data.payment_reference;


        if (!reference) {

            console.error(
                "KORAPAY WEBHOOK: Missing reference",
                body
            );

            return res.status(400).json({
                success: false,
                message: "Missing payment reference"
            });

        }



        /*
            Get Firebase UID.

            Our wallet.js sends:

            metadata: {
                uid: currentUser.uid
            }

            We support both possible locations.
        */

        const uid =
            data.metadata?.uid ||
            body.metadata?.uid;


        if (!uid) {

            console.error(
                "KORAPAY WEBHOOK: Missing UID",
                reference
            );

            return res.status(400).json({
                success: false,
                message: "Missing user ID"
            });

        }



        /*
            Prevent duplicate processing.

            If this reference already exists
            in transactions, we do not credit
            the wallet again.
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
            IMPORTANT:
            Verify the payment directly with
            Korapay before touching Firebase.
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
                    "Payment is not successful"

            });

        }



        /*
            Use the amount actually accepted
            by Korapay.

            amount_accepted is preferred when
            available.
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
                payment
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
            data.currency ||
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
            Get user's wallet.
        */

        const walletRef =
            db.ref(
                `users/${uid}/wallet`
            );


        /*
            Atomically credit the wallet.

            This prevents two simultaneous
            webhook requests from overwriting
            each other's balance.
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
                "KORAPAY WEBHOOK: Wallet transaction not committed",
                reference
            );

            return res.status(500).json({

                success: false,

                message:
                    "Wallet credit was not completed"

            });

        }



        /*
            Save the funding transaction.

            We only write this AFTER the wallet
            transaction succeeds.
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

            gateway: "korapay",

            createdAt:
                Date.now()

        });



        /*
            Successful webhook response.
        */

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
