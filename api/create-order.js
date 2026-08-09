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



            /*
                Clean comments.

                Empty lines are removed.
                Spaces around comments are removed.
            */

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



            /*
                Minimum 100 comments.
            */

            if (
                cleanedComments.length < 100
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Minimum order is 100 comments. You provided ${cleanedComments.length}.`

                });

            }



            /*
                Quantity is ALWAYS the
                actual number of comments.
            */

            numericQuantity =
                cleanedComments.length;



            /*
                Prevent the browser from
                sending a fake quantity.
            */

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
        // FIXED PACKAGE
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
        // NORMAL SERVICE
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
        // 6. CALCULATE TOTAL
        // ====================================================

        let total;



        /*
            Fixed-price package
        */

        if (
            selectedService.ratePer1000 === null
        ) {

            total =
                Number(
                    selectedService.fixedPrice
                ) *
                numericQuantity;

        }



        /*
            Per-1000 service
        */

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
        // 7. WALLET TRANSACTION
        // ====================================================

        const walletRef =
            db.ref(
                `users/${uid}/wallet`
            );



        let transactionResult;


        try {

            transactionResult =
                await walletRef.transaction(
                    currentValue => {

                        /*
                            Firebase may give us null
                            if the wallet does not exist.
                        */

                        const balance =
                            Number(
                                currentValue ?? 0
                            );


                        /*
                            Safety check for invalid
                            wallet data.
                        */

                        if (
                            !Number.isFinite(
                                balance
                            )
                        ) {

                            console.error(
                                "INVALID WALLET VALUE:",
                                currentValue
                            );


                            /*
                                Abort transaction.
                            */

                            return;

                        }



                        /*
                            IMPORTANT:
                            If balance is insufficient,
                            return the CURRENT VALUE,
                            NOT undefined.

                            This allows us to detect
                            the failed transaction cleanly.
                        */

                        if (
                            balance < total
                        ) {

                            return balance;

                        }



                        /*
                            Deduct amount.
                        */

                        const newBalance =
                            Number(
                                (
                                    balance -
                                    total
                                ).toFixed(2)
                            );


                        return newBalance;

                    }
                );

        } catch (
            transactionError
        ) {

            console.error(
                "WALLET TRANSACTION ERROR:",
                transactionError
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to process wallet transaction."

            });

        }



        // ====================================================
        // 8. CHECK TRANSACTION RESULT
        // ====================================================

        if (
            !transactionResult.committed
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Wallet transaction could not be completed. Please try again."

            });

        }



        // ====================================================
        // 9. GET NEW BALANCE
        // ====================================================

        const newBalance =
            Number(
                transactionResult
                    .snapshot
                    .val()
            );



        /*
            If the transaction committed but
            the balance did not decrease,
            the wallet was insufficient.
        */

        if (
            newBalance ===
            Number(
                transactionResult
                    .snapshot
                    .val()
            )
            &&
            newBalance < total
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Insufficient wallet balance."

            });

        }



        // ====================================================
        // 10. CREATE ORDER
        // ====================================================

        const orderRef =
            db
                .ref("orders")
                .push();


        const orderId =
            orderRef.key;



        // ====================================================
        // 11. ORDER DATA
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
        // 12. SAVE COMMENTS
        // ====================================================

        if (
            isCommentService
        ) {

            orderData.comments =
                cleanedComments;

        }



        // ====================================================
        // 13. SAVE ORDER
        // ====================================================

        try {

            await orderRef.set(
                orderData
            );

        } catch (orderError) {

            console.error(
                "ORDER SAVE ERROR:",
                orderError
            );


            /*
                IMPORTANT:
                If order saving fails after
                wallet deduction, refund the wallet.
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

            } catch (refundError) {

                console.error(
                    "WALLET REFUND ERROR:",
                    refundError
                );

            }


            return res.status(500).json({

                success: false,

                message:
                    "Order could not be saved. Your wallet deduction has been reversed."

            });

        }



        // ====================================================
        // 14. SAVE TRANSACTION RECORD
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

        } catch (transactionRecordError) {

            console.error(
                "TRANSACTION RECORD ERROR:",
                transactionRecordError
            );

            /*
                We don't cancel the order here because
                the wallet and order have already succeeded.
            */

        }



        // ====================================================
        // 15. SUCCESS
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
