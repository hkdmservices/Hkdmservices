import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import "./firebase-admin.js";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed."
        });
    }

    try {

        /* =====================================================
           1. VERIFY USER
        ===================================================== */

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided."
            });

        }

        const token =
            authHeader.substring(7);

        const decodedToken =
            await getAuth().verifyIdToken(token);

        const userId =
            decodedToken.uid;


        /* =====================================================
           2. GET VOUCHER CODE
        ===================================================== */

        const { voucherCode } =
            req.body || {};

        if (
            typeof voucherCode !== "string" ||
            !voucherCode.trim()
        ) {

            return res.status(400).json({
                success: false,
                message: "Voucher code is required."
            });

        }


        const cleanCode =
            voucherCode
                .trim()
                .toUpperCase();


        /* =====================================================
           3. DATABASE REFERENCES
        ===================================================== */

        const db =
            getDatabase();

        const voucherRef =
            db.ref(
                `vouchers/${cleanCode}`
            );


        /* =====================================================
           4. ATOMICALLY RESERVE VOUCHER
           
           This prevents two requests from redeeming
           the same voucher at the same time.
        ===================================================== */

        const voucherTransaction =
            await voucherRef.transaction(
                (currentVoucher) => {

                    if (!currentVoucher) {

                        return;

                    }

                    if (
                        currentVoucher.isUsed === true
                    ) {

                        return;

                    }

                    return {
                        ...currentVoucher,

                        isUsed: true,

                        usedBy: userId,

                        usedAt: Date.now()
                    };

                }
            );


        /* =====================================================
           5. CHECK WHETHER VOUCHER WAS ACTUALLY RESERVED
        ===================================================== */

        if (
            !voucherTransaction.committed
        ) {

            const currentVoucher =
                voucherTransaction.snapshot.exists()
                    ? voucherTransaction.snapshot.val()
                    : null;


            if (!currentVoucher) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Invalid or non-existent voucher code."
                });

            }


            if (
                currentVoucher.isUsed === true
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "This voucher has already been used."
                });

            }


            return res.status(400).json({
                success: false,
                message:
                    "Unable to redeem this voucher. Please try again."
            });

        }


        /* =====================================================
           6. GET VOUCHER AMOUNT
        ===================================================== */

        const voucherData =
            voucherTransaction.snapshot.val();


        const voucherAmount =
            Number(
                voucherData.amount
            );


        if (
            !Number.isFinite(voucherAmount) ||
            voucherAmount <= 0
        ) {

            /*
              Roll the voucher back because the voucher
              itself is invalid.
            */

            await voucherRef.update({
                isUsed: false,
                usedBy: null,
                usedAt: null
            });


            return res.status(400).json({
                success: false,
                message:
                    "This voucher has an invalid amount."
            });

        }


        /* =====================================================
           7. CREDIT USER WALLET
        ===================================================== */

        const userWalletRef =
            db.ref(
                `users/${userId}/wallet`
            );


        const walletTransaction =
            await userWalletRef.transaction(
                (currentWallet) => {

                    return (
                        Number(currentWallet) || 0
                    ) + voucherAmount;

                }
            );


        if (
            !walletTransaction.committed
        ) {

            /*
              Wallet could not be updated.
              Release the voucher so it can be
              redeemed again.
            */

            await voucherRef.update({
                isUsed: false,
                usedBy: null,
                usedAt: null
            });


            return res.status(500).json({
                success: false,
                message:
                    "Unable to credit your wallet. Please try again."
            });

        }


        /* =====================================================
           8. CREATE TRANSACTION RECORD
        ===================================================== */

        const transactionRef =
            db.ref("transactions").push();


        const transactionId =
            "VCR-" +
            Math.floor(
                100000 +
                Math.random() * 900000
            );


        await transactionRef.set({

            transactionId,

            uid: userId,

            type: "Voucher Redeem",

            description:
                `Redeemed voucher code: ${cleanCode}`,

            amount:
                voucherAmount,

            status:
                "completed",

            createdAt:
                Date.now()

        });


        /* =====================================================
           9. SUCCESS
        ===================================================== */

        return res.status(200).json({

            success: true,

            message:
                `Successfully redeemed ₦${voucherAmount.toLocaleString("en-NG")} to your wallet!`

        });


    } catch (error) {

        console.error(
            "VOUCHER REDEMPTION ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Internal server error during voucher redemption."

        });

    }

}
