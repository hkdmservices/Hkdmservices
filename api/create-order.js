import { admin, db } from "../firebase-admin.js";

import {
    hkdmservicesOfficialServicePriceCatalogue
} from "../services.js";


export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });

    }


    try {

        /*
            ============================================
            1. VERIFY FIREBASE USER
            ============================================
        */

        const authorization =
            req.headers.authorization || "";


        if (!authorization.startsWith("Bearer ")) {

            return res.status(401).json({
                success: false,
                message: "Please log in again."
            });

        }


        const idToken =
            authorization.substring(7);


        const decodedToken =
            await admin
                .auth()
                .verifyIdToken(idToken);


        const uid =
            decodedToken.uid;



        /*
            ============================================
            2. GET ORDER DATA
            ============================================
        */

        const {
            serviceId,
            link,
            quantity,
            comment
        } = req.body;


        if (
            !serviceId ||
            !link ||
            quantity === undefined
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please provide the service, link and quantity."
            });

        }



        /*
            ============================================
            3. FIND SERVICE
            ============================================
        */

        const selectedService =
            hkdmservicesOfficialServicePriceCatalogue.find(
                item =>
                    item.id === serviceId
            );


        if (!selectedService) {

            return res.status(400).json({
                success: false,
                message:
                    "Selected service was not found."
            });

        }



        /*
            ============================================
            4. DETERMINE SERVICE TYPE
            ============================================
        */

        const isFixedPrice =
            selectedService.ratePer1000 === null;


        const numericQuantity =
            Number(quantity);



        /*
            ============================================
            5. QUANTITY VALIDATION
            ============================================
        */

        if (
            !Number.isFinite(numericQuantity) ||
            numericQuantity < 1
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Minimum quantity is 1."
            });

        }


        /*
            FIXED PRICE SERVICES
            Example:
            YouTube Watch Time
            X/Twitter Live Listeners
        */

        if (isFixedPrice) {

            if (numericQuantity < 1) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Minimum package quantity is 1."
                });

            }

        }


        /*
            STANDARD SERVICES
            Minimum quantity = 100
        */

        else {

            if (numericQuantity < 100) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Minimum quantity is 100."
                });

            }

        }



        /*
            ============================================
            6. COMMENT VALIDATION
            ============================================
        */

        const isCommentService =
            selectedService.service
                .toLowerCase()
                .includes("comment");


        let customComment = "";


        if (isCommentService) {

            customComment =
                String(comment || "").trim();


            if (!customComment) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Please enter the comment you want to use."
                });

            }

        }



        /*
            ============================================
            7. CALCULATE PRICE
            ============================================
        */

        let total;


        /*
            FIXED PRICE PACKAGE
        */

        if (isFixedPrice) {

            total =
                Number(
                    selectedService.fixedPrice
                ) *
                numericQuantity;

        }


        /*
            STANDARD PER-1,000 SERVICE
        */

        else {

            total =
                (
                    numericQuantity / 1000
                ) *
                Number(
                    selectedService.ratePer1000
                );

        }


        total =
            Number(
                total.toFixed(2)
            );



        /*
            ============================================
            8. WALLET REFERENCE
            ============================================
        */

        const walletRef =
            db.ref(
                `users/${uid}/wallet`
            );



        /*
            READ CURRENT WALLET BALANCE
        */

        const walletSnapshot =
            await walletRef.once("value");


        const currentBalance =
            Number(
                walletSnapshot.val() || 0
            );



        /*
            CHECK BALANCE
        */

        if (currentBalance < total) {

            return res.status(400).json({
                success: false,
                message:
                    "Insufficient wallet balance."
            });

        }



        /*
            ============================================
            9. DEDUCT WALLET
            ============================================
        */

        let transactionResult;


        try {

            transactionResult =
                await walletRef.transaction(
                    currentValue => {

                        const balance =
                            Number(
                                currentValue || 0
                            );


                        /*
                            Prevent negative wallet
                            balance during transaction.
                        */

                        if (balance < total) {

                            return;

                        }


                        return Number(
                            (
                                balance - total
                            ).toFixed(2)
                        );

                    }
                );

        } catch (transactionError) {

            console.error(
                "WALLET TRANSACTION ERROR:",
                transactionError
            );


            return res.status(500).json({
                success: false,
                message:
                    "Unable to update wallet balance."
            });

        }



        /*
            ============================================
            10. CONFIRM WALLET TRANSACTION
            ============================================
        */

        if (!transactionResult.committed) {

            return res.status(409).json({
                success: false,
                message:
                    "Wallet transaction was not committed."
            });

        }



        /*
            ============================================
            11. CREATE ORDER ID
            ============================================
        */

        const orderRef =
            db.ref("orders").push();


        const orderId =
            orderRef.key;



        /*
            ============================================
            12. CREATE ORDER DATA
            ============================================
        */

        const orderData = {

            orderId,

            uid,

            platform:
                selectedService.platform,

            serviceId:
                selectedService.id,

            service:
                selectedService.service,

            link,

            quantity:
                numericQuantity,

            amount:
                total,

            status:
                "pending",

            paymentMethod:
                "wallet",

            createdAt:
                Date.now()

        };



        /*
            SAVE CUSTOM COMMENT
            ONLY FOR COMMENT SERVICES
        */

        if (isCommentService) {

            orderData.comment =
                customComment;

        }



        /*
            ============================================
            13. SAVE ORDER
            ============================================
        */

        await orderRef.set(
            orderData
        );



        /*
            ============================================
            14. SAVE TRANSACTION
            ============================================
        */

        const transactionRef =
            db
                .ref("transactions")
                .push();


        await transactionRef.set({

            uid,

            orderId,

            type:
                "order",

            amount:
                total,

            status:
                "success",

            description:
                `Order - ${selectedService.platform} ${selectedService.service}`,

            createdAt:
                Date.now()

        });



        /*
            ============================================
            15. SUCCESS
            ============================================
        */

        return res.status(200).json({

            success: true,

            message:
                "Order placed successfully.",

            orderId,

            amount:
                total,

            newBalance:
                Number(
                    transactionResult.snapshot.val()
                )

        });


    } catch (error) {

        console.error(
            "CREATE ORDER ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to place order."

        });

    }

}
