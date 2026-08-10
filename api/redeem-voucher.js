import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import "./firebase-admin.js";

export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            message: "Method not allowed"
        });

    }


    try {

        // Verify user token
        const authHeader = req.headers.authorization;


        if (!authHeader || !authHeader.startsWith("Bearer ")) {

            return res.status(401).json({
                message: "Unauthorized"
            });

        }


        const token =
            authHeader.split("Bearer ")[1];


        const decodedToken =
            await getAuth().verifyIdToken(token);


        const userId =
            decodedToken.uid;



        // Get voucher code
        const { voucherCode } =
            req.body;


        if (!voucherCode) {

            return res.status(400).json({
                message: "Voucher code required"
            });

        }



        const cleanCode =
            voucherCode.trim().toUpperCase();



        const db =
            getDatabase();



        const voucherRef =
            db.ref(`vouchers/${cleanCode}`);



        const snapshot =
            await voucherRef.once("value");



        // Voucher does not exist
        if (!snapshot.exists()) {

            return res.status(404).json({
                message: "Invalid voucher"
            });

        }



        const voucher =
            snapshot.val();



        // Prevent reuse
        if (voucher.isUsed === true) {

            return res.status(400).json({
                message: "Voucher already used"
            });

        }



        const amount =
            Number(voucher.amount);



        if (!Number.isFinite(amount) || amount <= 0) {

            return res.status(400).json({
                message: "Invalid voucher amount"
            });

        }



        // Add wallet balance safely
        const walletRef =
            db.ref(`users/${userId}/wallet`);



        await walletRef.transaction(
            currentWallet => {

                return (Number(currentWallet) || 0) + amount;

            }
        );



        // Mark voucher used
        await voucherRef.update({

            isUsed: true,

            usedBy: userId,

            usedAt: Date.now()

        });



        // Create transaction record
        const transactionRef =
            db.ref("transactions").push();



        await transactionRef.set({

            transactionId:
                "VCR-" + Date.now(),

            uid:
                userId,

            type:
                "Voucher Redeem",

            description:
                `Redeemed voucher ${cleanCode}`,

            amount:
                amount,

            status:
                "completed",

            createdAt:
                Date.now()

        });



        return res.status(200).json({

            success: true,

            message:
                `₦${amount.toLocaleString()} added to wallet`

        });



    } catch(error) {


        console.error(
            "VOUCHER REDEEM ERROR:",
            error
        );


        return res.status(500).json({

            message:
                error.message ||
                "Server error"

        });


    }

}
