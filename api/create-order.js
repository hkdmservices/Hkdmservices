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

        // ====================================================
        // 1. VERIFY FIREBASE USER
        // ====================================================

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



        // ====================================================
        // 2. GET ORDER DATA
        // ====================================================

        const {
            serviceId,
            link,
            quantity,
            comments
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



        // ====================================================
        // 3. FIND SERVICE
        // ====================================================

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



        // ====================================================
        // 4. DETECT COMMENT SERVICE
        // ====================================================

        const isCommentService =
            String(
                selectedService.service || ""
            )
                .toLowerCase()
                .includes("comment");



        // ====================================================
        // 5. VALIDATE QUANTITY / COMMENTS
        // ====================================================

        let cleanedComments = [];

        let numericQuantity;



        // ====================================================
        // COMMENT SERVICE
        // ====================================================

        if (isCommentService) {

            if (!Array.isArray(comments)) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please provide your comments, one per line."

                });

            }



            cleanedComments =
                comments
                    .map(
                        comment =>
                            String(
                                comment || ""
                            ).trim()
                    )
                    .filter(
                        comment =>
                            comment.length > 0
                    );



            // Minimum 100 comments

            if (
                cleanedComments.length < 100
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Minimum order is 100 comments. You provided ${cleanedComments.length}.`

                });

            }



            // Quantity = actual comment count

            numericQuantity =
                cleanedComments.length;



            // Browser quantity must match comments

            if (
                Number(quantity) !==
                numericQuantity
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Comment quantity does not match the number of comments provided."

                });

            }

        }



        // ====================================================
        // 6. FIXED PACKAGE
        // ====================================================

        else if (
            selectedService.ratePer1000 === null
        ) {

            numericQuantity =
                Number(quantity);


            const minimum =
                Number(
                    selectedService.minimumQuantity || 1
                );


            if (
                !Number.isFinite(
                    numericQuantity
                ) ||
                numericQuantity < minimum
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Minimum package quantity is ${minimum}.`

                });

            }

        }



        // ====================================================
        // 7. NORMAL SERVICE
        // ====================================================

        else {

            numericQuantity =
                Number(quantity);


            const minimum =
                Number(
                    selectedService.minimumQuantity || 100
                );


            if (
                !Number.isFinite(
                    numericQuantity
                ) ||
                numericQuantity < minimum
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Minimum quantity is ${minimum}.`

                });

            }

        }



        // ====================================================
        // 8. CALCULATE PRICE
        // ====================================================

        let total;



        // Fixed package

        if (
            selectedService.ratePer1000 === null
        ) {

            total =
                Number(
                    selectedService.fixedPrice
                ) *
                numericQuantity;

        }



        // Per 1,000

        else {

            total =
                (
                    numericQuantity /
                    1000
                ) *
                Number(
                    selectedService.ratePer1000
                );

        }


        total =
            Number(
                total.toFixed(2)
            );



        // ====================================================
        // 9. WALLET REFERENCE
        // ====================================================

        const walletRef =
            db.ref(
                `users/${uid}/wallet`
            );



        // ====================================================
        // 10. CHECK CURRENT WALLET
        // ====================================================

        const initialWalletSnapshot =
            await walletRef.once(
                "value"
            );


        const initialBalance =
            Number(
                initialWalletSnapshot.val() || 0
            );



        // ====================================================
        // 11. INITIAL INSUFFICIENT BALANCE CHECK
        // ====================================================

        if (
            !Number.isFinite(
                initialBalance
            )
        ) {

            return res.status(500).json({

                success: false,

                message:
                    "Your wallet balance is invalid."

            });

        }


        if (
            initialBalance < total
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Insufficient wallet balance. Your balance is ₦${initialBalance.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}, but this order costs ₦${total.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}.`

            });

        }



        // ====================================================
        // 12. DEDUCT WALLET USING TRANSACTION
        // ====================================================

        let walletTransaction;


        try {

            walletTransaction =
                await walletRef.transaction(
                    currentValue => {

                        const balance =
                            Number(
                                currentValue ?? 0
                            );


                        /*
                            If another transaction changed
                            the balance and there is no longer
                            enough money, abort safely.
                        */

                        if (
                            !Number.isFinite(
                                balance
                            )
                        ) {

                            return;

                        }


                        if (
                            balance < total
                        ) {

                            return;

                        }


                        /*
                            Deduct the order amount.
                        */

                        return Number(
                            (
                                balance -
                                total
                            ).toFixed(2)
                        );

                    }
                );

        } catch (
            walletError
        ) {

            console.error(
                "WALLET TRANSACTION ERROR:",
                walletError
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to process wallet transaction."

            });

        }



        // ====================================================
        // 13. HANDLE TRANSACTION NOT COMMITTED
        // ====================================================

        if (
            !walletTransaction.committed
        ) {

            /*
                The transaction did NOT deduct money.

                Read the wallet again so we can determine
                whether this was actually an insufficient
                balance situation.
            */

            const latestWalletSnapshot =
                await walletRef.once(
                    "value"
                );


            const latestBalance =
                Number(
                    latestWalletSnapshot.val() || 0
                );


            if (
                latestBalance < total
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Insufficient wallet balance. Your balance is ₦${latestBalance.toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}, but this order costs ₦${total.toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}.`

                });

            }


            return res.status(409).json({

                success: false,

                message:
                    "Wallet transaction could not be completed. Please try again."

            });

        }



        // ====================================================
        // 14. GET NEW BALANCE
        // ====================================================

        const newBalance =
            Number(
                walletTransaction
                    .snapshot
                    .val()
            );



        // ====================================================
        // 15. CREATE ORDER ID
        // ====================================================

        const orderRef =
            db
                .ref("orders")
                .push();


        const orderId =
            orderRef.key;



        // ====================================================
        // 16. CREATE ORDER DATA
        // ====================================================

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



        // ====================================================
        // 17. SAVE COMMENTS
        // ====================================================

        if (
            isCommentService
        ) {

            orderData.comments =
                cleanedComments;

        }



        // ====================================================
        // 18. SAVE ORDER
        // ====================================================

        try {

            await orderRef.set(
                orderData
            );

        } catch (
            orderError
        ) {

            console.error(
                "ORDER SAVE ERROR:",
                orderError
            );


            /*
                ORDER FAILED AFTER WALLET DEDUCTION.

                REFUND CUSTOMER.
            */

            try {

                await walletRef.transaction(
                    currentValue => {

                        const balance =
                            Number(
                                currentValue ?? 0
                            );


                        return Number(
                            (
                                balance +
                                total
                            ).toFixed(2)
                        );

                    }
                );

            } catch (
                refundError
            ) {

                console.error(
                    "REFUND ERROR:",
                    refundError
                );

            }


            return res.status(500).json({

                success: false,

                message:
                    "Order could not be created. Your wallet deduction has been reversed."

            });

        }



        // ====================================================
        // 19. SAVE TRANSACTION RECORD
        // ====================================================

        try {

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

        } catch (
            transactionRecordError
        ) {

            console.error(
                "TRANSACTION RECORD ERROR:",
                transactionRecordError
            );

        }



        // ====================================================
        // 20. SUCCESS
        // ====================================================

        return res.status(200).json({

            success: true,

            message:
                "Order placed successfully.",

            orderId,

            amount:
                total,

            quantity:
                numericQuantity,

            newBalance

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
