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
        // 5. VALIDATE LINK
        // ====================================================

        const cleanedLink =
            String(link).trim();


        if (!cleanedLink) {

            return res.status(400).json({
                success: false,
                message: "Please provide a valid link."
            });

        }


        // ====================================================
        // 6. VALIDATE QUANTITY / COMMENTS
        // ====================================================

        let cleanedComments = [];

        let numericQuantity;


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
                    .map(comment =>
                        String(comment ?? "").trim()
                    )
                    .filter(comment =>
                        comment.length > 0
                    );


            if (cleanedComments.length < 100) {

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
        // 7. FIXED PACKAGE SERVICE
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
                !Number.isFinite(numericQuantity) ||
                numericQuantity !== 1 ||
                numericQuantity < minimum
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        `This is a fixed-price package. Quantity must be ${minimum}.`
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
                !Number.isFinite(numericQuantity) ||
                !Number.isInteger(numericQuantity) ||
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
            db.ref(`users/${uid}`);


        const userSnapshot =
            await userRef.once("value");


        if (!userSnapshot.exists()) {

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
        // 10. SELECT CUSTOMER RATE
        // ====================================================

        let activeRate =
            selectedService.ratePer1000;


        let activeFixedPrice =
            selectedService.fixedPrice;


        if (userTier === "reseller") {

            if (
                selectedService.resellerRatePer1000 !==
                undefined
            ) {

                activeRate =
                    selectedService.resellerRatePer1000;

            }


            if (
                selectedService.resellerFixedPrice !==
                undefined
            ) {

                activeFixedPrice =
                    selectedService.resellerFixedPrice;

            }

        }


        else if (userTier === "vip") {

            if (
                selectedService.vipRatePer1000 !==
                undefined
            ) {

                activeRate =
                    selectedService.vipRatePer1000;

            }


            if (
                selectedService.vipFixedPrice !==
                undefined
            ) {

                activeFixedPrice =
                    selectedService.vipFixedPrice;

            }

        }


        // ====================================================
        // 11. CALCULATE TOTAL
        // ====================================================

        let total;


        if (
            selectedService.ratePer1000 === null
        ) {

            // Fixed package = one fixed charge.
            total =
                Number(activeFixedPrice);

        }


        else {

            total =
                (
                    numericQuantity / 1000
                ) *
                Number(activeRate);

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
        // 12. CHECK WALLET
        // ====================================================

        const currentBalance =
            Number(
                userData.wallet || 0
            );


        if (
            !Number.isFinite(currentBalance)
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
        // 13. ATOMIC WALLET DEDUCTION
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
        // 14. CONFIRM DEDUCTION
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

            link:
                cleanedLink,

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


        if (isCommentService) {

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

        }


        catch (orderError) {

            console.error(
                "ORDER SAVE ERROR:",
                orderError
            );


            // REFUND WALLET

            try {

                await userRef.transaction(
                    currentUserData => {

                        if (!currentUserData) {
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
        // 18. SAVE TRANSACTION
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

        }


        catch (transactionError) {

            console.error(
                "TRANSACTION RECORD ERROR:",
                transactionError
            );


            try {

                await orderRef.remove();

            }

            catch (removeError) {

                console.error(
                    "ORDER REMOVE ERROR:",
                    removeError
                );

            }


            // REFUND WALLET

            try {

                await userRef.transaction(
                    currentUserData => {

                        if (!currentUserData) {
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
        // 19. UPDATE TOTAL SPEND
        // ====================================================

        let updatedTotalSpent =
            Number(
                userData.totalSpent || 0
            );


        if (
            !Number.isFinite(updatedTotalSpent)
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


        const tierUpdates = {

            totalSpent:
                updatedTotalSpent,

            updatedAt:
                Date.now()

        };


        // ====================================================
        // 20. AUTOMATIC VIP
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
                `VIP UPGRADE: User ${uid} reached ₦${updatedTotalSpent} cumulative spend.`
            );

        }


        // ====================================================
        // 21. SAVE SPEND / TIER
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
        // 22. TELEGRAM NOTIFICATION
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
        // 23. SUCCESS
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

            success: false,

            message:
                "Unable to place order."

        });

    }

}
