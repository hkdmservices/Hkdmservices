import { admin, db } from "../firebase-admin.js";

import {
    hkdmservicesOfficialServicePriceCatalogue
} from "../services.js";

import {
    hkdmservicesNigeriaServicePriceCatalogue
} from "../nigeria-services-catalogue.js";

import {
    sendTelegramNotification
} from "../telegram.js";

import { sendOrderConfirmation } from './email.js';


export default async function handler(req, res) {

    // ========================================================
    // 1. METHOD CHECK
    // ========================================================

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });

    }


    try {

        // ====================================================
        // 2. VERIFY FIREBASE USER
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
        // 3. GET ORDER DATA
        // ====================================================

        const {
            serviceId,
            link,
            quantity,
            comments,
            catalogue
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
        // 4. SELECT CATALOGUE
        // ====================================================

        const requestedCatalogue =
            String(
                catalogue || "general"
            )
                .trim()
                .toLowerCase();


        const isNigeriaCatalogue =
            requestedCatalogue === "nigeria";


        const selectedCatalogue =
            isNigeriaCatalogue
                ? hkdmservicesNigeriaServicePriceCatalogue
                : hkdmservicesOfficialServicePriceCatalogue;


        const catalogueName =
            isNigeriaCatalogue
                ? "Nigeria"
                : "General";


        console.log(
            `ORDER CATALOGUE: ${catalogueName}`
        );



        // ====================================================
        // 5. FIND SERVICE
        // ====================================================

        const selectedService =
            selectedCatalogue.find(
                service =>
                    String(service.id) ===
                    String(serviceId)
            );


        if (!selectedService) {

            return res.status(400).json({
                success: false,
                message:
                    `Selected service was not found in the ${catalogueName} catalogue.`
            });

        }



        // ====================================================
        // 6. DETERMINE SERVICE TYPE
        // ====================================================

        const serviceName =
            String(
                selectedService.service || ""
            );


        const isCommentService =
            serviceName
                .toLowerCase()
                .includes("comment");


        const isFixedPackage =
            selectedService.ratePer1000 === null ||
            (
                selectedService.fixedPrice !== undefined &&
                selectedService.fixedPrice !== null
            );



        // ====================================================
        // 7. VALIDATE QUANTITY
        // ====================================================

        let cleanedComments = [];

        let numericQuantity;



        // ====================================================
        // COMMENT SERVICES
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
        // FIXED PACKAGE
        // ====================================================

        else if (isFixedPackage) {

            numericQuantity =
                Number(quantity);


            const minimum =
                Number(
                    selectedService.minimumQuantity || 1
                );


            if (
                !Number.isFinite(numericQuantity) ||
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
                !Number.isFinite(numericQuantity) ||
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
        // 8. GET USER
        // ====================================================

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

            return res.status(404).json({
                success: false,
                message:
                    "User account could not be found."
            });

        }


        const userData =
            userSnapshot.val() || {};



        // ====================================================
        // 9. GET USER TIER
        // ====================================================

        const userTier =
            String(
                userData.tier || "regular"
            )
                .trim()
                .toLowerCase();



        // ====================================================
        // 10. SELECT ACTIVE PRICE
        // ====================================================

        let activeRate =
            selectedService.ratePer1000;


        let activeFixedPrice =
            selectedService.fixedPrice;



        // ====================================================
        // RESELLER PRICE
        // ====================================================

        if (
            userTier === "reseller"
        ) {

            if (
                selectedService.resellerRatePer1000 !==
                undefined &&
                selectedService.resellerRatePer1000 !==
                null
            ) {

                activeRate =
                    selectedService.resellerRatePer1000;

            }


            if (
                selectedService.resellerFixedPrice !==
                undefined &&
                selectedService.resellerFixedPrice !==
                null
            ) {

                activeFixedPrice =
                    selectedService.resellerFixedPrice;

            }

        }



        // ====================================================
        // VIP PRICE
        // ====================================================

        else if (
            userTier === "vip"
        ) {

            if (
                selectedService.vipRatePer1000 !==
                undefined &&
                selectedService.vipRatePer1000 !==
                null
            ) {

                activeRate =
                    selectedService.vipRatePer1000;

            }


            if (
                selectedService.vipFixedPrice !==
                undefined &&
                selectedService.vipFixedPrice !==
                null
            ) {

                activeFixedPrice =
                    selectedService.vipFixedPrice;

            }

        }



        // ====================================================
        // 11. VALIDATE ACTIVE PRICE
        // ====================================================

        if (isFixedPackage) {

            if (
                !Number.isFinite(
                    Number(activeFixedPrice)
                ) ||
                Number(activeFixedPrice) <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "This service does not have a valid package price."
                });

            }

        }

        else {

            if (
                !Number.isFinite(
                    Number(activeRate)
                ) ||
                Number(activeRate) <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "This service does not have a valid price."
                });

            }

        }



        // ====================================================
        // 12. CALCULATE TOTAL
        // ====================================================

        let total;


        if (isFixedPackage) {

            // Fixed package = one package price.
            //
            // Example:
            // YouTube 4000hr package
            // quantity = 1
            // total = package price

            total =
                Number(
                    activeFixedPrice
                );

        }

        else {

            // Normal service:
            //
            // price is per 1,000 units.
            //
            // Example:
            // 500 units at ₦39,830.637 / 1000
            //
            // total =
            // 500 / 1000 × 39,830.637

            total =
                (
                    numericQuantity /
                    1000
                ) *
                Number(
                    activeRate
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
        // 13. GET WALLET BALANCE
        // ====================================================

        const currentBalance =
            Number(
                userData.wallet || 0
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
        // 14. CHECK WALLET BALANCE
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
        // 15. DEDUCT WALLET
        // ====================================================

        let walletTransaction;


        try {

            walletTransaction =
                await userRef.transaction(
                    currentUserData => {

                        if (
                            currentUserData === null
                        ) {

                            return null;

                        }


                        const updatedUser =
                            {
                                ...currentUserData
                            };


                        const balance =
                            Number(
                                updatedUser.wallet || 0
                            );


                        if (
                            !Number.isFinite(balance)
                        ) {

                            throw new Error(
                                "INVALID_WALLET_BALANCE"
                            );

                        }


                        if (
                            balance < total
                        ) {

                            throw new Error(
                                "INSUFFICIENT_BALANCE"
                            );

                        }


                        updatedUser.wallet =
                            Number(
                                (
                                    balance -
                                    total
                                ).toFixed(2)
                            );


                        return updatedUser;

                    }
                );

        }

        catch (walletError) {

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
                    "Unable to process wallet transaction."
            });

        }



        // ====================================================
        // 16. CONFIRM WALLET DEDUCTION
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
        // 17. GET NEW BALANCE
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
            !Number.isFinite(newBalance)
        ) {

            return res.status(500).json({
                success: false,
                message:
                    "Unable to confirm new wallet balance."
            });

        }



        // ====================================================
        // 18. CREATE ORDER REFERENCE
        // ====================================================

        const orderRef =
            db
                .ref("orders")
                .push();


        const orderId =
            orderRef.key;



        // ====================================================
        // 19. CREATE ORDER DATA
        // ====================================================

        const orderData = {

            orderId,

            uid,

            catalogue:
                catalogueName,

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

            email:
                userData.email || "N/A"

        };


        if (
            isCommentService
        ) {

            orderData.comments =
                cleanedComments;

        }



        // ====================================================
        // 20. SAVE ORDER
        // ====================================================

        try {

            await orderRef.set(
                orderData
            );

        }

        catch (orderError) {

            console.error(
                "ORDER SAVE ERROR:",
                orderError
            );


            // ==================================================
            // REFUND WALLET
            // ==================================================

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
                                refundUser.wallet || 0
                            );


                        if (
                            !Number.isFinite(balance)
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

            }

            catch (refundError) {

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
        // 21. SAVE ORDER TRANSACTION
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
                    `Order - ${catalogueName} - ${selectedService.platform} ${selectedService.service}`,

                createdAt:
                    Date.now()

            });

        }

        catch (transactionError) {

            console.error(
                "TRANSACTION RECORD ERROR:",
                transactionError
            );


            // ==================================================
            // REMOVE ORDER
            // ==================================================

            try {

                await orderRef.remove();

            }

            catch (removeError) {

                console.error(
                    "ORDER REMOVE ERROR:",
                    removeError
                );

            }


            // ==================================================
            // REFUND WALLET
            // ==================================================

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
                                refundUser.wallet || 0
                            );


                        if (
                            !Number.isFinite(balance)
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

            }

            catch (refundError) {

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
        // 22. UPDATE TOTAL SPENT
        // ====================================================

        let updatedTotalSpent =
            Number(
                userData.totalSpent || 0
            );


        if (
            !Number.isFinite(
                updatedTotalSpent
            )
        ) {

            updatedTotalSpent = 0;

        }


        updatedTotalSpent =
            Number(
                (
                    updatedTotalSpent +
                    total
                ).toFixed(2)
            );



        // ====================================================
        // 23. PREPARE TIER UPDATE
        // ====================================================

        const tierUpdates = {

            totalSpent:
                updatedTotalSpent,

            updatedAt:
                Date.now()

        };


        let finalTier =
            userTier;



        // ====================================================
        // 24. AUTOMATIC VIP
        // ====================================================

        if (
            userTier !== "reseller" &&
            updatedTotalSpent >= 60000
        ) {

            finalTier =
                "vip";


            tierUpdates.tier =
                "vip";


            tierUpdates.vipUnlockedAt =
                userData.vipUnlockedAt ||
                Date.now();


            console.log(
                `VIP UPGRADE: User ${uid} automatically reached ₦${updatedTotalSpent} cumulative spend.`
            );

        }



        // ====================================================
        // 25. SAVE TOTAL SPEND / TIER
        // ====================================================

        try {

            await userRef.update(
                tierUpdates
            );

        }

        catch (tierUpdateError) {

            console.error(
                "TOTAL SPEND / VIP UPDATE ERROR:",
                tierUpdateError
            );

        }



        // ====================================================
        // 26. TELEGRAM NOTIFICATION
        // ====================================================

        try {

            await sendTelegramNotification(
                orderData
            );

        }

        catch (telegramError) {

            console.error(
                "TELEGRAM NOTIFICATION ERROR:",
                telegramError
            );

        }



        // ====================================================
        // 27. SEND ORDER CONFIRMATION EMAIL
        // ====================================================

        try {
            await sendOrderConfirmation(
                userData.email || 'support@hkdmservices.xyz',
                {
                    orderId: orderId,
                    service: selectedService.service,
                    platform: selectedService.platform,
                    quantity: numericQuantity,
                    amount: total,
                    status: 'Pending'
                }
            );
            console.log(`Order confirmation email sent to ${userData.email}`);
        } catch (emailError) {
            console.error('Order confirmation email error:', emailError);
            // Don't fail the order if email fails
        }


        // ====================================================
        // 28. SUCCESS
        // ====================================================

        return res.status(200).json({

            success: true,

            message:
                "Order placed successfully.",

            orderId,

            catalogue:
                catalogueName,

            platform:
                selectedService.platform,

            service:
                selectedService.service,

            amount:
                total,

            quantity:
                numericQuantity,

            newBalance,

            totalSpent:
                updatedTotalSpent,

            tier:
                finalTier,

            vipUnlocked:
                finalTier === "vip"

        });

    }


    // ========================================================
    // 29. GLOBAL ERROR
    // ========================================================

    catch (error) {

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
