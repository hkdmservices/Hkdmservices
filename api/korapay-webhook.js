import crypto from "crypto";
import axios from "axios";

import { db } from "./firebase-admin.js";
import { sendPaymentReceipt } from './email.js';


export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({

            success: false,

            message:
                "Method not allowed"

        });

    }


    try {

        const body =
            req.body || {};

        const data =
            body.data || {};


        const receivedSignature =
            req.headers["x-korapay-signature"];


        if (!receivedSignature) {

            console.error(
                "KORAPAY WEBHOOK: Missing signature"
            );

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


        const event =
            body.event;


        if (
            event !== "charge.success"
        ) {

            return res.status(200).json({

                success: true,

                message:
                    "Webhook event ignored",

                event:
                    event || "unknown"

            });

        }


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

        const userData =
            userSnapshot.val() || {};


        const walletRef =
            db.ref(
                `users/${uid}/wallet`
            );


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

            return res.status(500).json({

                success: false,

                message:
                    "Wallet credit was not completed"

            });

        }


        const newBalance =
            Number(
                walletTransaction
                    .snapshot
                    .val()
            );


        // ====================================================
        // ONE-TIME REFERRAL BONUS LOGIC
        // ====================================================

        try {

            if (
                userData.referredBy &&
                amount >= 1000 &&
                !userData.referralBonusPaid
            ) {

                const referrerUid =
                    userData.referredBy;

                const referrerWalletRef =
                    db.ref(`users/${referrerUid}/wallet`);

                const referrerProfileRef =
                    db.ref(`users/${referrerUid}`);


                // Credit referrer wallet ₦200
                await referrerWalletRef.transaction(currentVal => {
                    const bal = Number(currentVal ?? 0);
                    return Number((bal + 200).toFixed(2));
                });


                // Increment referrer statistics
                await referrerProfileRef.transaction(profile => {
                    const current = profile || {};
                    return {
                        ...current,
                        totalReferrals: (current.totalReferrals || 0) + 1,
                        totalReferralEarnings: Number(((current.totalReferralEarnings || 0) + 200).toFixed(2))
                    };
                });


                // Mark user so bonus can never be credited again
                await userRef.update({
                    referralBonusPaid: true
                });

                console.log(
                    `REFERRAL BONUS: Referrer ${referrerUid} credited ₦200 for user ${uid}`
                );

            }

        } catch (refError) {

            console.error(
                "REFERRAL BONUS ERROR:",
                refError
            );

        }


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
        // SEND PAYMENT RECEIPT EMAIL
        // ====================================================

        try {
            const userEmail = userData.email || 'support@hkdmservices.xyz';
            await sendPaymentReceipt(
                userEmail,
                {
                    reference: reference,
                    amount: amount,
                    status: 'Success',
                    paymentMethod: 'Korapay'
                }
            );
            console.log(`Payment receipt email sent to ${userEmail}`);
        } catch (emailError) {
            console.error('Payment receipt email error:', emailError);
            // Don't fail the webhook if email fails
        }


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

        return res.status(500).json({

            success: false,

            message:
                "Webhook processing failed"

        });

    }

}
