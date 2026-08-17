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


// ============================================================
// HKDMservices CREATE ORDER API
//
// Supports:
// - General / Official catalogue
// - Nigeria catalogue
// - Regular pricing
// - Reseller pricing
// - VIP pricing
// - Comment services
// - Fixed-price packages
// - Wallet deduction
// - Order creation
// - Transaction records
// - Automatic VIP upgrade
// ============================================================


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

        if (
            !authorization.startsWith("Bearer ")
        ) {

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
        // 2. GET REQUEST DATA
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
        // 3. SELECT CATALOGUE
        // ====================================================

        const catalogueName =
            String(
                catalogue || "general"
            ).toLowerCase();


        let activeCatalogue;


        if (
            catalogueName === "nigeria"
        ) {

            activeCatalogue =
                hkdmservicesNigeriaServicePriceCatalogue;

        } else {

            activeCatalogue =
                hkdmservicesOfficialServicePriceCatalogue;

        }


        // ====================================================
        // 4. FIND SERVICE IN SELECTED CATALOGUE
        // ====================================================

        const selectedService =
            activeCatalogue.find(
                item =>
                    String(item.id) ===
                    String(serviceId)
            );


        if (!selectedService) {

            return res.status(400).json({
                success: false,
                message:
                    "Selected service was not found in the requested catalogue."
            });

        }


        // ====================================================
        // 5. DETECT COMMENT SERVICE
        // ====================================================

        const isCommentService =
            String(
                selectedService.service || ""
            )
                .toLowerCase()
                .includes("comment");


        // ====================================================
        // 6. VALIDATE QUANTITY
        // ====================================================

        let cleanedComments = [];

        let numericQuantity;


        // ====================================================
        // COMMENT SERVICE
        // ====================================================

        if (isCommentService) {

            if (
                !Array.isArray(comments)
            ) {

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
        // 7. FIXED PACKAGE
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
        // 8. NORMAL SERVICE
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
        // 9. GET USER
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


        const userTier =
            String(
                userData.tier || "regular"
            ).toLowerCase();


        // ====================================================
        // 10. DETERMINE ACTIVE PRICING
        // ====================================================

        let activeRate =
            selectedService.ratePer1000;


        let activeFixedPrice =
            selectedService.fixedPrice;


        // ====================================================
        // RESELLER
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
        // VIP
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
        // 11. CALCULATE TOTAL
        // ====================================================

        let total;


        // Fixed package
        if (
            selectedService.ratePer1000 === null
        ) {

            const packagePrice =
                Number(
                    activeFixedPrice
                );


            if (
                !Number.isFinite(
                    packagePrice
                ) ||
                packagePrice <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "This package does not have a valid price."
                });

            }


            total =
                packagePrice *
                numericQuantity;

        }


        // Normal / comments service
        else {

            const rate =
                Number(
                    activeRate
                );


            if (
                !Number.isFinite(rate) ||
                rate <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "This service does not have a valid price."
                });

            }


            total =
                (
                    numericQuantity /
                    1000
                ) *
                rate;

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
        // 12. GET WALLET BALANCE
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
        // 13. CHECK BALANCE
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
        // 14. DEDUCT WALLET
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
                                "INVALID_WALLET"
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
        // 15. CONFIRM WALLET TRANSACTION
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
        // 16. NEW BALANCE
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
        // 17. CREATE ORDER
        // ====================================================

        const orderRef =
            db
                .ref("orders")
                .push();


        const orderId =
            orderRef.key;


        // ====================================================
        // 18. ORDER DATA
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

            ratePer1000:
                selectedService.ratePer1000,

            chargedRate:
                selectedService.ratePer1000 === null
                    ? null
                    : Number(activeRate),

            tier:
                userTier,

            status:
                "pending",

            paymentMethod:
                "wallet",

            createdAt:
                Date.now(),

            email:
                userData.email || "N/A"

        };


        // ====================================================
        // SAVE COMMENTS
        // ====================================================

        if (
            isCommentService
        ) {

            orderData.comments =
                cleanedComments;

        }


        // ====================================================
        // 19. SAVE ORDER
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


            // ----------------------------------------------
            // REFUND WALLET
            // ----------------------------------------------

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
        // 20. SAVE TRANSACTION
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

                catalogue:
                    catalogueName,

                tier:
                    userTier,

                createdAt:
                    Date.now()

            });

        }
        catch (transactionError) {

            console.error(
                "TRANSACTION RECORD ERROR:",
                transactionError
            );


            // Remove order
            try {

                await orderRef.remove();

            }
            catch (removeError) {

                console.error(
                    "ORDER REMOVE ERROR:",
                    removeError
                );

            }


            // Refund wallet
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
        // 21. UPDATE TOTAL SPEND
        //
        // Only successful orders count.
        // Wallet funding does not count.
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

            updatedTotalSpent =
                0;

        }


        updatedTotalSpent =
            Number(
                (
                    updatedTotalSpent +
                    total
                ).toFixed(2)
            );


        const tierUpdates = {

            totalSpent:
                updatedTotalSpent,

            updatedAt:
                Date.now()

        };


        // ====================================================
        // 22. AUTOMATIC VIP
        //
        // VIP threshold = ₦60,000
        //
        // Reseller remains reseller.
        // ====================================================

        let finalTier =
            userTier;


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
                `VIP UPGRADE: ${uid} reached ₦${updatedTotalSpent} cumulative order spend.`
            );

        }


        // ====================================================
        // 23. SAVE SPEND / TIER
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

            // Order has already succeeded.
            // Do not refund the customer.

        }


        // ====================================================
        // 24. TELEGRAM NOTIFICATION
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
        // 25. SUCCESS
        // ====================================================

        return res.status(200).json({

            success:
                true,

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
    catch (error) {

        console.error(
            "CREATE ORDER ERROR:",
            error
        );


        return res.status(500).json({

            success:
                false,

            message:
                "Unable to place order."

        });

    }

}
