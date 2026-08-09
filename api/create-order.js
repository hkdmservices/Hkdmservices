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
                                comment ?? ""
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


            // Quantity automatically equals
            // the number of non-empty comments

            numericQuantity =
                cleanedComments.length;


            // Browser quantity must match

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
                    "Unable to calculate a valid order amount."

            });

        }



        // ====================================================
        // 9. WALLET REFERENCE
        // ====================================================

        const walletRef =
            db.ref(
                `users/${uid}/wallet`
            );



        // ====================================================
        // 10. READ WALLET FIRST
        // ====================================================

        const walletSnapshot =
            await walletRef.once(
                "value"
            );


        const walletValue =
            walletSnapshot.val();


        const currentBalance =
            Number(
                walletValue
            );


        if (
            walletValue === null ||
            walletValue === undefined
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Wallet balance could not be found."

            });

        }


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
        // 11. ATOMIC WALLET TRANSACTION
        // ====================================================

        let walletTransaction;


        try {

            walletTransaction =
                await walletRef.transaction(

                    currentValue => {

                        if (
                            currentValue === null ||
                            currentValue === undefined
                        ) {

                            return;

                        }


                        const balance =
                            Number(
                                currentValue
                            );


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
                    "Unable to process wallet transaction. Please try again.",

                error:
                    walletError.message

            });

        }



        // ====================================================
        // 12. VERIFY WALLET TRANSACTION
        // ====================================================

        if (
            !walletTransaction ||
            !walletTransaction.committed
        ) {

            const latestSnapshot =
                await walletRef.once(
                    "value"
                );


            const latestValue =
                latestSnapshot.val();


            const latestBalance =
                Number(
                    latestValue
                );


            if (
                Number.isFinite(
                    latestBalance
                ) &&
                latestBalance < total
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Insufficient wallet balance. Your balance is ₦${latestBalance.toLocaleString(
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


            return res.status(409).json({

                success: false,

                message:
                    "Wallet transaction was not committed. Your balance was not charged. Please try again."

            });

        }



        // ====================================================
        // 13. GET NEW BALANCE
        // ====================================================

        const newBalance =
            Number(
                walletTransaction
                    .snapshot
                    .val()
            );


        if (
            !Number.isFinite(
                newBalance
            )
        ) {

            return res.status(500).json({

                success: false,

                message:
                    "New wallet balance could not be confirmed."

            });

        }



        // ====================================================
        // 14. CREATE ORDER
        // ====================================================

        const orderRef =
            db
                .ref("orders")
                .push();


        const orderId =
            orderRef.key;


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


        // Save comments for comment services

        if (
            isCommentService
        ) {

            orderData.comments =
                cleanedComments;

        }



        // ====================================================
        // 15. SAVE ORDER
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


            // ----------------------------------------------
            // REFUND WALLET
            // ----------------------------------------------

            try {

                await walletRef.transaction(

                    currentValue => {

                        const balance =
                            Number(
                                currentValue
                            );


                        if (
                            !Number.isFinite(
                                balance
                            )
                        ) {

                            return;

                        }


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
                    "ORDER REFUND ERROR:",
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
        // 16. SAVE TRANSACTION RECORD
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


            // Remove incomplete order

            try {

                await orderRef.remove();

            } catch (
                removeError
            ) {

                console.error(
                    "ORDER ROLLBACK ERROR:",
                    removeError
                );

            }


            // Refund wallet

            try {

                await walletRef.transaction(

                    currentValue => {

                        const balance =
                            Number(
                                currentValue
                            );


                        if (
                            !Number.isFinite(
                                balance
                            )
                        ) {

                            return;

                        }


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
        // 17. SUCCESS
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
