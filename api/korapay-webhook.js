import crypto from "crypto";
import axios from "axios";

import { db } from "./firebase-admin.js";


export default async function handler(req, res) {

    // ====================================================
    // 1. ONLY ACCEPT POST
    // ====================================================

    if (req.method !== "POST") {

        return res.status(405).json({

            success: false,

            message:
                "Method not allowed"

        });

    }


    try {

        // ====================================================
        // 2. GET WEBHOOK BODY
        // ====================================================

        const body =
            req.body || {};

        const data =
            body.data || {};


        // ====================================================
        // 3. VERIFY KORAPAY SIGNATURE
        // ====================================================

        const receivedSignature =
            req.headers["x-korapay-signature"];


        if (!receivedSignature) {

            console.error(
                "KORAPAY WEBHOOK: Missing signature"
            );

            /*
                Return 200 so invalid requests are
                not repeatedly retried.
            */

            return res.status(200).json({

                success: false,

                message:
                    "Invalid webhook request"

            });

        }


        const secretKey =
            process.env.KORAPAY_SECRET_KEY;


        if (!secretKey) {

            console.error(
                "KORAPAY WEBHOOK: KORAPAY_SECRET_KEY is missing"
            );

            return res.status(500).json({

                success: false,

                message:
                    "Webhook configuration error"

            });

        }


        /*
            Korapay signs ONLY the data object.
        */

        const generatedSignature =
            crypto
                .createHmac(
                    "sha256",
                    secretKey
                )
                .update(
                    JSON.stringify(data)
                )
                .digest("hex");


        /*
            Use timingSafeEqual to prevent
            timing attacks.
        */

        let signatureIsValid = false;


        try {

            const receivedBuffer =
                Buffer.from(
                    String(
                        receivedSignature
                    ),
                    "utf8"
                );


            const generatedBuffer =
                Buffer.from(
                    generatedSignature,
                    "utf8"
                );


            if (
                receivedBuffer.length ===
                generatedBuffer.length
            ) {

                signatureIsValid =
                    crypto.timingSafeEqual(
                        receivedBuffer,
                        generatedBuffer
                    );

            }

        } catch (
            signatureError
        ) {

            console.error(
                "KORAPAY SIGNATURE ERROR:",
                signatureError
            );

            signatureIsValid =
                false;

        }


        if (!signatureIsValid) {

            console.error(
                "KORAPAY WEBHOOK: Invalid signature"
            );

            return res.status(200).json({

                success: false,

                message:
                    "Invalid webhook signature"

            });

        }



        // ====================================================
        // 4. CHECK EVENT
        // ====================================================

        const event =
            body.event;


        if (
            event !== "charge.success"
        ) {

            /*
                We only fund wallets when
                Korapay confirms charge.success.
            */

            return res.status(200).json({

                success: true,

                message:
                    "Webhook event ignored",

                event:
                    event || "unknown"

            });

        }



        // ====================================================
        // 5. GET PAYMENT REFERENCE
        // ====================================================

        const reference =
            data.reference ||
            data.payment_reference;


        if (!reference) {

            console.error(
                "KORAPAY WEBHOOK: Missing payment reference"
            );

            return res.status(200).json({

                success: false,

                message:
                    "Missing payment reference"

            });

        }



        // ====================================================
        // 6. DUPLICATE CHECK
        // ====================================================

        const transactionRef =
            db.ref(
                `transactions/${reference}`
            );


        const existingTransaction =
            await transactionRef.once(
                "value"
            );


        if (
            existingTransaction.exists()
        ) {

            return res.status(200).json({

                success: true,

                message:
                    "Transaction already processed",

                reference

            });

        }



        // ====================================================
        // 7. VERIFY PAYMENT DIRECTLY WITH KORAPAY
        // ====================================================

        const verificationResponse =
            await axios.get(

                `https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(reference)}`,

                {

                    headers: {

                        Authorization:
                            `Bearer ${secretKey}`

                    }

                }

            );


        const payment =
            verificationResponse
                .data
                ?.data;


        if (!payment) {

            console.error(
                "KORAPAY WEBHOOK: Payment not found",
                reference
            );

            return res.status(200).json({

                success: false,

                message:
                    "Payment could not be verified"

            });

        }



        // ====================================================
        // 8. VERIFY PAYMENT STATUS
        // ====================================================

        if (
            payment.status !== "success"
        ) {

            return res.status(200).json({

                success: true,

                message:
                    "Payment is not successful",

                status:
                    payment.status ||
                    "unknown",

                reference

            });

        }



        // ====================================================
        // 9. GET UID FROM VERIFIED PAYMENT
        // ====================================================

        const uid =
            payment.metadata?.uid ||
            data.metadata?.uid;


        if (!uid) {

            console.error(

                "KORAPAY WEBHOOK: UID missing",

                {
                    reference,
                    metadata:
                        payment.metadata ||
                        data.metadata
                }

            );

            return res.status(200).json({

                success: false,

                message:
                    "User ID missing from payment metadata"

            });

        }



        // ====================================================
        // 10. VERIFY AMOUNT
        // ====================================================

        const amount =
            Number(

                payment.amount_paid ??
                payment.amount ??
                data.amount ??
                0

            );


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            console.error(

                "KORAPAY WEBHOOK: Invalid amount",

                {
                    reference,
                    amount
                }

            );

            return res.status(200).json({

                success: false,

                message:
                    "Invalid payment amount"

            });

        }



        // ====================================================
        // 11. VERIFY CURRENCY
        // ====================================================

        const currency =
            String(

                payment.currency ||
                data.currency ||
                "NGN"

            ).toUpperCase();


        if (
            currency !== "NGN"
        ) {

            console.error(

                "KORAPAY WEBHOOK: Unsupported currency",

                {
                    reference,
                    currency
                }

            );

            return res.status(200).json({

                success: false,

                message:
                    "Unsupported payment currency"

            });

        }



        // ====================================================
        // 12. CHECK FIREBASE USER
        // ====================================================

        const userRef =
            db.ref(
                `users/${uid}`
            );


        const userSnapshot =
            await userRef.once(
                "value"
            );


        if (
            !userSnapshot.exists()
        ) {

            console.error(

                "KORAPAY WEBHOOK: User not found",

                {
                    uid,
                    reference
                }

            );

            return res.status(200).json({

                success: false,

                message:
                    "Firebase user not found"

            });

        }



        // ====================================================
        // 13. WALLET REFERENCE
        // ====================================================

        const walletRef =
            db.ref(
                `users/${uid}/wallet`
            );



        // ====================================================
        // 14. CREDIT WALLET
        // ====================================================

        const walletTransaction =
            await walletRef.transaction(

                currentValue => {

                    const currentBalance =
                        Number(
                            currentValue ?? 0
                        );


                    if (
                        !Number.isFinite(
                            currentBalance
                        )
                    ) {

                        return;

                    }


                    return Number(

                        (
                            currentBalance +
                            amount

                        ).toFixed(2)

                    );

                }

            );



        // ====================================================
        // 15. CONFIRM WALLET CREDIT
        // ====================================================

        if (
            !walletTransaction.committed
        ) {

            console.error(

                "KORAPAY WEBHOOK: Wallet transaction not committed",

                {
                    uid,
                    reference,
                    amount
                }

            );

            /*
                Return non-200 so Korapay can retry
                the webhook.
            */

            return res.status(500).json({

                success: false,

                message:
                    "Wallet credit was not completed"

            });

        }



        // ====================================================
        // 16. GET NEW BALANCE
        // ====================================================

        const newBalance =
            Number(
                walletTransaction
                    .snapshot
                    .val()
            );



        // ====================================================
        // 17. SAVE FUNDING TRANSACTION
        // ====================================================

        try {

            await transactionRef.set({

                uid,

                reference,

                amount,

                currency,

                status:
                    "success",

                type:
                    "wallet_funding",

                description:
                    "Wallet funding via Korapay",

                gateway:
                    "korapay",

                createdAt:
                    Date.now()

            });

        } catch (
            transactionSaveError
        ) {

            /*
                IMPORTANT:
                The wallet has already been credited.

                Do NOT credit it again if saving the
                transaction record fails.

                Log the error so it can be repaired
                manually.
            */

            console.error(

                "KORAPAY TRANSACTION RECORD ERROR:",

                {
                    reference,
                    uid,
                    amount,
                    error:
                        transactionSaveError
                }

            );

        }



        // ====================================================
        // 18. SUCCESS
        // ====================================================

        console.log(

            "KORAPAY WEBHOOK: WALLET FUNDED",

            {
                reference,
                uid,
                amount,
                newBalance
            }

        );


        return res.status(200).json({

            success: true,

            message:
                "Wallet funded successfully",

            reference,

            amount,

            newBalance

        });


    } catch (error) {

        console.error(

            "KORAPAY WEBHOOK ERROR:",

            error.response?.data ||
            error.message ||
            error

        );


        /*
            Return 500 for genuine processing errors.
            Korapay can retry the webhook.
        */

        return res.status(500).json({

            success: false,

            message:
                "Webhook processing failed"

        });

    }

}
