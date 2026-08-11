import { admin, db } from "../firebase-admin.js";

import {
    hkdmservicesOfficialServicePriceCatalogue
} from "../services.js";

import {
    sendTelegramNotification
} from "../telegram.js";



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
        } = req.body || {};


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
        // 5. VALIDATE QUANTITY
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
                                comment ?? ""
                            ).trim()
                    )
                    .filter(
                        comment =>
                            comment.length > 0
                    );


            if (
                cleanedComments.length < 100
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Minimum order is 100 comments. You provided ${cleanedComments.length}.`

                });

            }


            numericQuantity =
                cleanedComments.length;


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
        // 8. CALCULATE TOTAL
        // ====================================================

        let total;


        if (
            selectedService.ratePer1000 === null
        ) {

            total =
                Number(
                    selectedService.fixedPrice
                ) *
                numericQuantity;

        } else {

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


        if (
            !Number.isFinite(total) ||
            total <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid order amount."

            });

        }



        // ====================================================
        // 9. USER REFERENCE
        // ====================================================

        const userRef =
            db.ref(
                `users/${uid}`
            );



        // ====================================================
        // 10. GET CURRENT USER
        // ====================================================

        const userSnapshot =
            await userRef.once(
                "value"
            );


        if (
            !userSnapshot.exists()
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "User account could not be found."

            });

        }


        const userData =
            userSnapshot.val();


        const currentBalance =
            Number(
                userData.wallet
            );


        if (
            !Number.isFinite(
                currentBalance
            )
        ) {

            return res.status(500).json({

                success: false,

                message:
                    "Your wallet balance is invalid."

            });

        }



        // ====================================================
        // 11. CHECK BALANCE
        // ====================================================

        if (
            currentBalance < total
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Insufficient wallet balance. Your balance is ₦${currentBalance.toLocaleString(
                        "en-NG",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    )}, but this order costs ₦${total.toLocaleString(
                        "en-NG",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    )}.`

            });

        }



        // ====================================================
        // 12. DEDUCT WALLET
        // ====================================================

        let walletTransaction;


        try {

            walletTransaction =
                await userRef.transaction(

                    currentUserData => {

                        /*
                         * IMPORTANT:
                         *
                         * Firebase may call the transaction
                         * handler with null on the first attempt.
                         *
                         * If that happens, DO NOT abort.
                         * Return null so Firebase can continue
                         * the transaction process.
                         */

                        if (
                            currentUserData === null
                        ) {

                            return null;

                        }


                        /*
                         * Make a copy.
                         */

                        const updatedUser =
                            {
                                ...currentUserData
                            };


                        /*
                         * Read wallet.
                         */

                        const balance =
                            Number(
                                updatedUser.wallet
                            );


                        /*
                         * Invalid balance.
                         */

                        if (
                            !Number.isFinite(
                                balance
                            )
                        ) {

                            throw new Error(
                                "Invalid wallet balance inside transaction."
                            );

                        }


                        /*
                         * Balance changed and is
                         * no longer enough.
                         */

                        if (
                            balance < total
                        ) {

                            throw new Error(
                                "INSUFFICIENT_BALANCE"
                            );

                        }


                        /*
                         * Deduct money.
                         */

                        updatedUser.wallet =
                            Number(
                                (
                                    balance -
                                    total
                                ).toFixed(2)
                            );


                        /*
                         * Return the complete
                         * updated user object.
                         */

                        return updatedUser;

                    }

                );

        } catch (
            walletError
        ) {

            console.error(
                "WALLET TRANSACTION ERROR:",
                walletError
            );


            if (
                walletError.message ===
                "INSUFFICIENT_BALANCE"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Insufficient wallet balance."

                });

            }


            return res.status(500).json({

                success: false,

                message:
                    "Unable to process wallet transaction.",

                error:
                    walletError.message

            });

        }



        // ====================================================
        // 13. CONFIRM TRANSACTION
        // ====================================================

        if (
            !walletTransaction ||
            !walletTransaction.committed
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Wallet transaction was not committed. Your balance was not charged. Please try again."

            });

        }



        // ====================================================
        // 14. GET NEW BALANCE
        // ====================================================

        const committedUser =
            walletTransaction
                .snapshot
                .val();


        const newBalance =
            Number(
                committedUser.wallet
            );


        if (
            !Number.isFinite(
                newBalance
            )
        ) {

            return res.status(500).json({

                success: false,

                message:
                    "Unable to confirm new wallet balance."

            });

        }



        // ====================================================
        // 15. CREATE ORDER
        // ====================================================

        const orderRef =
            db
                .ref("orders")
                .push();


        const orderId =
            orderRef.key;



        // ====================================================
        // 16. ORDER DATA
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
                Date.now(),
            
            email: userData.email || 'N/A' // Added to populate user email in Telegram

        };


        if (
            isCommentService
        ) {

            orderData.comments =
                cleanedComments;

        }



        // ====================================================
        // 17. SAVE ORDER
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
             * Refund wallet.
             */

            try {

                await userRef.transaction(

                    currentUserData => {

                        if (
                            !currentUserData
                        ) {

                            return null;

                        }


                        const refundUser =
                            {
                                ...currentUserData
                            };


                        const balance =
                            Number(
                                refundUser.wallet
                            );


                        if (
                            !Number.isFinite(
                                balance
                            )
                        ) {

                            return null;

                        }


                        refundUser.wallet =
                            Number(
                                (
                                    balance +
                                    total
                                ).toFixed(2)
                            );


                        return refundUser;

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
                    "Order could not be created. Your wallet deduction was reversed."

            });

        }



        // ====================================================
        // 18. SAVE TRANSACTION RECORD
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
            transactionError
        ) {

            console.error(
                "TRANSACTION RECORD ERROR:",
                transactionError
            );


            /*
             * Remove order.
             */

            try {

                await orderRef.remove();

            } catch (
                removeError
            ) {

                console.error(
                    "ORDER REMOVE ERROR:",
                    removeError
                );

            }


            /*
             * Refund wallet.
             */

            try {

                await userRef.transaction(

                    currentUserData => {

                        if (
                            !currentUserData
                        ) {

                            return null;

                        }


                        const refundUser =
                            {
                                ...currentUserData
                            };


                        const balance =
                            Number(
                                refundUser.wallet
                            );


                        if (
                            !Number.isFinite(
                                balance
                            )
                        ) {

                            return null;

                        }


                        refundUser.wallet =
                            Number(
                                (
                                    balance +
                                    total
                                ).toFixed(2)
                            );


                        return refundUser;

                    }

                );

            } catch (
                refundError
            ) {

                console.error(
                    "TRANSACTION REFUND ERROR:",
                    refundError
                );

            }


            return res.status(500).json({

                success: false,

                message:
                    "The order could not be completed. Your wallet deduction was reversed."

            });

        }



        // ====================================================
        // 19. SEND TELEGRAM NOTIFICATION
        // ====================================================

        try {
            await sendTelegramNotification(orderData);
        } catch (telegramError) {
            console.error("TELEGRAM NOTIFICATION ERROR:", telegramError);
            // We don't want to fail the order if Telegram fails, so we just log it
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
