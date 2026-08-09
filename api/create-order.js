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
        // 4. CHECK IF COMMENT SERVICE
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
                Comments must be an array.
            */

            if (!Array.isArray(comments)) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please provide your comments, one per line."

                });

            }



            /*
                Remove empty lines and
                trim each comment.
            */

            cleanedComments =
                comments
                    .map(
                        comment =>
                            String(comment || "").trim()
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
                Quantity is automatically
                the number of comments.
            */

            numericQuantity =
                cleanedComments.length;



            /*
                Make sure the quantity sent
                by the browser matches the
                actual number of comments.
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


        if (
            selectedService.ratePer1000 === null
        ) {

            /*
                Fixed-price package.

                Example:
                Watch Time package
                = ₦100,000 per package.
            */

            total =
                Number(
                    selectedService.fixedPrice
                ) *
                numericQuantity;

        } else {

            /*
                Per-1,000 service.
            */

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



        // ====================================================
        // 9. WALLET REFERENCE
        // ====================================================

        const walletRef =
            db.ref(
                `users/${uid}/wallet`
            );



        // ====================================================
        // 10. READ WALLET
        // ====================================================

        const walletSnapshot =
            await walletRef.once(
                "value"
            );


        const currentBalance =
            Number(
                walletSnapshot.val() || 0
            );



        // ====================================================
        // 11. CHECK BALANCE
        // ====================================================

        if (
            currentBalance < total
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Insufficient wallet balance."

            });

        }



        // ====================================================
        // 12. DEDUCT WALLET
        // ====================================================

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
                            Prevent negative balance.
                        */

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
        // 13. CONFIRM WALLET TRANSACTION
        // ====================================================

        if (
            !transactionResult.committed
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Wallet transaction was not committed."

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



        // ====================================================
        // 15. ORDER DATA
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



        /*
            Save comments only for
            comment services.
        */

        if (
            isCommentService
        ) {

            orderData.comments =
                cleanedComments;

        }



        // ====================================================
        // 16. SAVE ORDER
        // ====================================================

        await orderRef.set(
            orderData
        );



        // ====================================================
        // 17. SAVE TRANSACTION
        // ====================================================

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

            newBalance:
                Number(
                    transactionResult
                        .snapshot
                        .val()
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
