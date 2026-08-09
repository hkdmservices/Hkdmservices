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
        // 5. VALIDATE COMMENTS
        // ====================================================

        let cleanedComments = [];

        let numericQuantity;


        if (isCommentService) {

            /*
                Comments must arrive as an array.
            */

            if (!Array.isArray(comments)) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please provide your comments, one per line."

                });

            }


            /*
                Clean comments.

                Empty lines are ignored.
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
                Quantity MUST equal
                the actual number of comments.
            */

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
        // 8. CALCULATE ORDER PRICE
        // ====================================================

        let total;


        /*
            FIXED PACKAGE
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
            PER-1000 SERVICE
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
        // 9. WALLET REFERENCE
        // ====================================================

        const walletRef =
            db.ref(
                `users/${uid}/wallet`
            );



        // ====================================================
        // 10. ATOMIC WALLET TRANSACTION
        // ====================================================
        /*
            IMPORTANT:

            We do NOT read the wallet first.

            Firebase gives the transaction the
            current wallet balance.

            If the balance is enough,
            subtract the order amount.

            If the balance is not enough,
            abort the transaction.

            This prevents race conditions and
            prevents the wallet from becoming negative.
        */

        let transactionResult;


        try {

            transactionResult =
                await walletRef.transaction(
                    currentValue => {

                        /*
                            Convert Firebase value
                            into a number.
                        */

                        const balance =
                            Number(
                                currentValue || 0
                            );


                        /*
                            Invalid wallet balance.
                        */

                        if (
                            !Number.isFinite(
                                balance
                            )
                        ) {

                            console.error(
                                "INVALID WALLET BALANCE:",
                                currentValue
                            );

                            return;

                        }


                        /*
                            INSUFFICIENT BALANCE

                            Returning undefined aborts
                            the transaction.
                        */

                        if (
                            balance < total
                        ) {

                            return;

                        }


                        /*
                            SUFFICIENT BALANCE

                            Deduct the order amount.
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
                    "Unable to update wallet balance."

            });

        }



        // ====================================================
        // 11. TRANSACTION WAS ABORTED
        // ====================================================

        if (
            !transactionResult.committed
        ) {

            /*
                Read the latest balance only so
                we can give the user the correct
                error message.
            */

            let latestBalance = 0;


            try {

                const latestSnapshot =
                    await walletRef.once(
                        "value"
                    );


                latestBalance =
                    Number(
                        latestSnapshot.val() || 0
                    );

            } catch (
                balanceError
            ) {

                console.error(
                    "BALANCE CHECK ERROR:",
                    balanceError
                );

            }



            /*
                If balance is genuinely insufficient,
                tell the user exactly what happened.
            */

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


            /*
                If balance is enough but transaction
                still didn't commit, report the
                transaction problem.
            */

            return res.status(409).json({

                success: false,

                message:
                    "Wallet transaction could not be completed. Please try again."

            });

        }



        // ====================================================
        // 12. GET NEW WALLET BALANCE
        // ====================================================

        const newBalance =
            Number(
                transactionResult
                    .snapshot
                    .val() || 0
            );



        // ====================================================
        // 13. CREATE ORDER ID
        // ====================================================

        const orderRef =
            db
                .ref("orders")
                .push();


        const orderId =
            orderRef.key;



        // ====================================================
        // 14. CREATE ORDER DATA
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
        // 15. SAVE COMMENTS
        // ====================================================

        if (
            isCommentService
        ) {

            orderData.comments =
                cleanedComments;

        }



        // ====================================================
        // 16. SAVE ORDER
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
                IMPORTANT:

                Wallet has already been deducted.

                We therefore attempt to refund the
                wallet if saving the order fails.
            */

            try {

                await walletRef.transaction(
                    currentValue => {

                        const balance =
                            Number(
                                currentValue || 0
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
                    "Unable to save your order. Your wallet was not charged."

            });

        }



        // ====================================================
        // 17. SAVE TRANSACTION RECORD
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

            /*
                The order has already been created
                and wallet has already been charged.

                We do NOT refund here because the
                actual order exists successfully.
            */

        }



        // ====================================================
        // 18. SUCCESS
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
