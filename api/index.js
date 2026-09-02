import express from "express";
import { admin, db } from "./firebase-admin.js";
const app = express();
app.use(express.json());
/* =========================================================
   HELPERS
========================================================= */
function sendError(res, status, message) {
    return res.status(status).json({
        success: false,
        message
    });
}
/* =========================================================
   VERIFY FIREBASE AUTH TOKEN
========================================================= */
async function verifyUser(req) {
    const authorization =
        req.headers.authorization || "";
    if (!authorization.startsWith("Bearer ")) {
        throw new Error("AUTHENTICATION_REQUIRED");
    }
    const idToken =
        authorization.substring(7).trim();
    if (!idToken) {
        throw new Error("AUTHENTICATION_REQUIRED");
    }
    return await admin
        .auth()
        .verifyIdToken(idToken);
}
/* =========================================================
   VERIFY ADMIN
========================================================= */
async function verifyAdmin(req) {
    const decodedToken =
        await verifyUser(req);
    const uid =
        decodedToken.uid;
    const userSnapshot =
        await db
            .ref(`users/${uid}`)
            .once("value");
    const userData =
        userSnapshot.val() || {};
    const isAdmin =
        userData.role === "admin" ||
        userData.isAdmin === true;
    if (!isAdmin) {
        throw new Error("ADMIN_REQUIRED");
    }
    return {
        uid,
        decodedToken,
        userData
    };
}
/* =========================================================
   1. ADD SOCIAL ACCOUNT
   ADMIN ONLY
========================================================= */
app.post(
    "/api/add-account",
    async (req, res) => {
        try {
            await verifyAdmin(req);
            const {
                platform,
                title,
                niche,
                followers,
                price,
                accountAge,
                credentials,
                username,
                password,
                description
            } = req.body || {};
            if (!platform) {
                return sendError(
                    res,
                    400,
                    "Platform is required."
                );
            }
            const numericPrice =
                Number(price);
            if (
                !Number.isFinite(numericPrice) ||
                numericPrice <= 0
            ) {
                return sendError(
                    res,
                    400,
                    "Please enter a valid account price."
                );
            }
            let finalCredentials =
                credentials;
            if (
                !finalCredentials &&
                (username || password)
            ) {
                finalCredentials =
                    `Username: ${username || "N/A"} | Password: ${password || "N/A"}`;
            }
            if (!finalCredentials) {
                return sendError(
                    res,
                    400,
                    "Account login credentials are required."
                );
            }
            const newAccountRef =
                db.ref("accounts").push();
            const accountData = {
                id:
                    newAccountRef.key,
                platform:
                    String(platform).trim(),
                title:
                    String(
                        title ||
                        "Social Media Account"
                    ).trim(),
                niche:
                    String(
                        niche ||
                        "General"
                    ).trim(),
                followers:
                    Number(followers) || 0,
                price:
                    numericPrice,
                accountAge:
                    accountAge ||
                    "N/A",
                credentials:
                    finalCredentials,
                description:
                    description ||
                    "Verified social media account ready for immediate transfer.",
                status:
                    "available",
                createdAt:
                    Date.now()
            };
            await newAccountRef.set(
                accountData
            );
            return res.status(200).json({
                success:
                    true,
                message:
                    "Account successfully listed on the marketplace.",
                accountId:
                    newAccountRef.key
            });
        } catch (error) {
            console.error(
                "ADD ACCOUNT ERROR:",
                error
            );
            if (
                error.message ===
                "AUTHENTICATION_REQUIRED"
            ) {
                return sendError(
                    res,
                    401,
                    "Please log in again."
                );
            }
            if (
                error.message ===
                "ADMIN_REQUIRED"
            ) {
                return sendError(
                    res,
                    403,
                    "Administrator access is required."
                );
            }
            return sendError(
                res,
                500,
                "Unable to add the account."
            );
        }
    }
);
/* =========================================================
   2. GET AVAILABLE MARKETPLACE ACCOUNTS
   PUBLIC ENDPOINT
   IMPORTANT:
   Credentials are NEVER returned here.
========================================================= */
app.get(
    "/api/get-accounts",
    async (req, res) => {
        try {
            const snapshot =
                await db
                    .ref("accounts")
                    .once("value");
            const data =
                snapshot.val() || {};
            const publicAccounts = {};
            Object.entries(data)
                .forEach(
                    ([key, account]) => {
                        if (!account) {
                            return;
                        }
                        const status =
                            String(
                                account.status ||
                                "available"
                            )
                                .trim()
                                .toLowerCase();
                        if (
                            status !==
                            "available"
                        ) {
                            return;
                        }
                        const price =
                            Number(
                                account.price
                            );
                        if (
                            !Number.isFinite(price) ||
                            price <= 0
                        ) {
                            return;
                        }
                        /*
                         * NEVER expose:
                         *
                         * credentials
                         * username
                         * password
                         * buyerUid
                         * soldTo
                         */
                        publicAccounts[key] = {
                            id:
                                account.id ||
                                key,
                            platform:
                                account.platform ||
                                "Social",
                            title:
                                account.title ||
                                "Social Media Account",
                            niche:
                                account.niche ||
                                "General",
                            followers:
                                account.followers ||
                                account.followerCount ||
                                "N/A",
                            accountAge:
                                account.accountAge ||
                                account.age ||
                                "N/A",
                            price,
                            description:
                                account.description ||
                                "Verified social media account ready for immediate transfer.",
                            status:
                                "available"
                        };
                    }
                );
            return res.status(200).json({
                success:
                    true,
                accounts:
                    publicAccounts
            });
        } catch (error) {
            console.error(
                "GET ACCOUNTS ERROR:",
                error
            );
            return sendError(
                res,
                500,
                "Unable to load marketplace accounts."
            );
        }
    }
);
/* =========================================================
   3. GET ALL ACCOUNTS
   ADMIN ONLY
========================================================= */
app.get(
    "/api/admin/get-accounts",
    async (req, res) => {
        try {
            await verifyAdmin(req);
            const snapshot =
                await db
                    .ref("accounts")
                    .once("value");
            const accounts =
                snapshot.val() || {};
            return res.status(200).json({
                success:
                    true,
                accounts
            });
        } catch (error) {
            console.error(
                "ADMIN GET ACCOUNTS ERROR:",
                error
            );
            if (
                error.message ===
                "AUTHENTICATION_REQUIRED"
            ) {
                return sendError(
                    res,
                    401,
                    "Please log in again."
                );
            }
            if (
                error.message ===
                "ADMIN_REQUIRED"
            ) {
                return sendError(
                    res,
                    403,
                    "Administrator access is required."
                );
            }
            return sendError(
                res,
                500,
                "Unable to load account inventory."
            );
        }
    }
);
/* =========================================================
   4. DELETE ACCOUNT
   ADMIN ONLY
========================================================= */
app.delete(
    "/api/admin/delete-account/:id",
    async (req, res) => {
        try {
            await verifyAdmin(req);
            const accountId =
                req.params.id;
            if (!accountId) {
                return sendError(
                    res,
                    400,
                    "Account ID is required."
                );
            }
            const accountRef =
                db.ref(
                    `accounts/${accountId}`
                );
            const snapshot =
                await accountRef.once("value");
            if (!snapshot.exists()) {
                return sendError(
                    res,
                    404,
                    "Account not found."
                );
            }
            await accountRef.remove();
            return res.status(200).json({
                success:
                    true,
                message:
                    "Account deleted successfully."
            });
        } catch (error) {
            console.error(
                "DELETE ACCOUNT ERROR:",
                error
            );
            if (
                error.message ===
                "AUTHENTICATION_REQUIRED"
            ) {
                return sendError(
                    res,
                    401,
                    "Please log in again."
                );
            }
            if (
                error.message ===
                "ADMIN_REQUIRED"
            ) {
                return sendError(
                    res,
                    403,
                    "Administrator access is required."
                );
            }
            return sendError(
                res,
                500,
                "Unable to delete account."
            );
        }
    }
);
/* =========================================================
   5. BUY SOCIAL ACCOUNT FROM WALLET
   CLIENT SENDS ONLY:
       accountId
   SERVER DETERMINES:
       authenticated user
       real account
       real price
       wallet balance
       credentials
       order details
========================================================= */
app.post(
    "/api/buy-account-wallet",
    async (req, res) => {
        try {
            const decodedToken =
                await verifyUser(req);
            const uid =
                decodedToken.uid;
            const accountId =
                req.body?.accountId;
            if (!accountId) {
                return sendError(
                    res,
                    400,
                    "Account ID is required."
                );
            }
            const accountRef =
                db.ref(
                    `accounts/${accountId}`
                );
            const userRef =
                db.ref(
                    `users/${uid}`
                );
            /* =================================================
               GET ACCOUNT
            ================================================= */
            const accountSnapshot =
                await accountRef.once("value");
            const accountData =
                accountSnapshot.val();
            if (!accountData) {
                return sendError(
                    res,
                    404,
                    "This account is no longer available."
                );
            }
            const accountStatus =
                String(
                    accountData.status ||
                    "available"
                )
                    .trim()
                    .toLowerCase();
            if (
                accountStatus !==
                "available"
            ) {
                return sendError(
                    res,
                    409,
                    "This account has already been sold or is no longer available."
                );
            }
            const price =
                Number(
                    accountData.price
                );
            if (
                !Number.isFinite(price) ||
                price <= 0
            ) {
                return sendError(
                    res,
                    400,
                    "This account has an invalid price."
                );
            }
            /* =================================================
               GET USER
            ================================================= */
            const userSnapshot =
                await userRef.once("value");
            const userData =
                userSnapshot.val() || {};
            const currentBalance =
                Number(
                    userData.wallet || 0
                );
            if (
                !Number.isFinite(
                    currentBalance
                )
            ) {
                return sendError(
                    res,
                    500,
                    "Unable to read your wallet balance."
                );
            }
            if (
                currentBalance <
                price
            ) {
                return sendError(
                    res,
                    400,
                    `Insufficient wallet balance. You need ₦${price.toLocaleString("en-NG")} but have ₦${currentBalance.toLocaleString("en-NG")}.`
                );
            }
            /* =================================================
               GENERATE ORDER DATA
            ================================================= */
            const orderRef =
                db
                    .ref("orders")
                    .push();
            const orderId =
                orderRef.key;
            const platform =
                accountData.platform ||
                "Social";
            const baseTitle =
                accountData.title ||
                "Social Media Account";
            const title =
                String(baseTitle)
                    .toLowerCase()
                    .includes(
                        String(platform)
                            .toLowerCase()
                    )
                    ? baseTitle
                    : `${platform} - ${baseTitle}`;
            const now =
                Date.now();
            const reference =
                `ACC-${now}-${Math.floor(
                    Math.random() * 10000
                )}`;
            /* =================================================
               DEDUCT WALLET SAFELY
               Firebase transaction prevents two simultaneous
               purchases from spending the same balance.
            ================================================= */
            const walletTransaction =
                await userRef.transaction(
                    currentUserData => {
                        if (
                            !currentUserData
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
                            !Number.isFinite(
                                balance
                            )
                        ) {
                            return null;
                        }
                        if (
                            balance <
                            price
                        ) {
                            return null;
                        }
                        updatedUser.wallet =
                            Number(
                                (
                                    balance -
                                    price
                                ).toFixed(2)
                            );
                        updatedUser.totalSpent =
                            Number(
                                updatedUser.totalSpent ||
                                0
                            ) + price;
                        return updatedUser;
                    }
                );
            if (
                !walletTransaction.committed
            ) {
                return sendError(
                    res,
                    400,
                    "Insufficient wallet balance or wallet transaction failed. No money was deducted."
                );
            }
            /* =================================================
               MARK ACCOUNT SOLD
               This transaction protects against two users
               attempting to buy the same account.
            ================================================= */
            const accountTransaction =
                await accountRef.transaction(
                    currentAccountData => {
                        if (
                            !currentAccountData
                        ) {
                            return;
                        }
                        const status =
                            String(
                                currentAccountData.status ||
                                "available"
                            )
                                .trim()
                                .toLowerCase();
                        if (
                            status !==
                            "available"
                        ) {
                            return;
                        }
                        return {
                            ...currentAccountData,
                            status:
                                "sold",
                            buyerUid:
                                uid,
                            soldAt:
                                new Date(
                                    now
                                ).toISOString(),
                            reference
                        };
                    }
                );
            if (
                !accountTransaction.committed
            ) {
                /*
                 * Account was taken by somebody else
                 * after we deducted the wallet.
                 *
                 * Refund the customer.
                 */
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
                                    price
                                ).toFixed(2)
                            );
                        refundUser.totalSpent =
                            Math.max(
                                0,
                                Number(
                                    refundUser.totalSpent ||
                                    0
                                ) - price
                            );
                        return refundUser;
                    }
                );
                return sendError(
                    res,
                    409,
                    "This account was purchased by another customer before your transaction completed. Your wallet has been refunded."
                );
            }
            /* =================================================
               CREATE SOCIAL ACCOUNT ORDER
               Credentials are stored only in the user's order.
               They are NOT returned by /api/get-accounts.
            ================================================= */
            const orderData = {
                orderId,
                uid,
                accountId,
                platform,
                accountTitle:
                    title,
                title,
                accountDescription:
                    accountData.description ||
                    "Verified social media account.",
                description:
                    accountData.description ||
                    "Verified social media account.",
                followers:
                    accountData.followers ||
                    accountData.followerCount ||
                    "N/A",
                accountAge:
                    accountData.accountAge ||
                    accountData.age ||
                    "N/A",
                amount:
                    price,
                price,
                credentials:
                    accountData.credentials ||
                    `Username: ${accountData.username || "N/A"} | Password: ${accountData.password || "N/A"}`,
                status:
                    "completed",
                paymentMethod:
                    "wallet",
                reference,
                createdAt:
                    now
            };
            try {
                await orderRef.set(
                    orderData
                );
            } catch (orderError) {
                console.error(
                    "SOCIAL ORDER SAVE ERROR:",
                    orderError
                );
                /*
                 * The wallet was already charged and the account
                 * marked sold. Reverse both if order creation fails.
                 */
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
                        refundUser.wallet =
                            Number(
                                (
                                    balance +
                                    price
                                ).toFixed(2)
                            );
                        refundUser.totalSpent =
                            Math.max(
                                0,
                                Number(
                                    refundUser.totalSpent ||
                                    0
                                ) - price
                            );
                        return refundUser;
                    }
                );
                await accountRef.update({
                    status:
                        "available",
                    buyerUid:
                        null,
                    soldAt:
                        null,
                    reference:
                        null
                });
                return sendError(
                    res,
                    500,
                    "The purchase could not be completed. Your wallet has been refunded."
                );
            }
            /* =================================================
               SAVE TRANSACTION RECORD
            ================================================= */
            try {
                const transactionRef =
                    db
                        .ref("transactions")
                        .push();
                await transactionRef.set({
                    uid,
                    orderId,
                    type:
                        "social_account_purchase",
                    amount:
                        price,
                    status:
                        "success",
                    paymentMethod:
                        "wallet",
                    reference,
                    description:
                        `Social Account Purchase - ${platform} - ${title}`,
                    createdAt:
                        now
                });
            } catch (transactionError) {
                /*
                 * Do NOT reverse the purchase here.
                 * The actual order already exists and the
                 * account has already been sold. A missing
                 * transaction log should not accidentally
                 * give the customer a free account.
                 */
                console.error(
                    "SOCIAL ACCOUNT TRANSACTION LOG ERROR:",
                    transactionError
                );
            }
            /* =================================================
               SUCCESS
            ================================================= */
            const newUserSnapshot =
                await userRef.once("value");
            const newUserData =
                newUserSnapshot.val() || {};
            const newWalletBalance =
                Number(
                    newUserData.wallet || 0
                );
            return res.status(200).json({
                success:
                    true,
                message:
                    "Social account purchased successfully.",
                orderId,
                reference,
                platform,
                title,
                amount:
                    price,
                newWalletBalance
            });
        } catch (error) {
            console.error(
                "SOCIAL ACCOUNT PURCHASE ERROR:",
                error
            );
            if (
                error.message ===
                "AUTHENTICATION_REQUIRED"
            ) {
                return sendError(
                    res,
                    401,
                    "Please log in again."
                );
            }
            if (
                error.code ===
                "auth/id-token-expired"
            ) {
                return sendError(
                    res,
                    401,
                    "Your session has expired. Please log in again."
                );
            }
            if (
                error.code ===
                "auth/argument-error"
            ) {
                return sendError(
                    res,
                    401,
                    "Invalid authentication token. Please log in again."
                );
            }
            return sendError(
                res,
                500,
                "An unexpected error occurred while processing your purchase."
            );
        }
    }
);
/* =========================================================
   6. MY SOCIAL ACCOUNT PURCHASE HISTORY
   AUTHENTICATED USER ONLY
   Returns ONLY orders belonging to the current Firebase UID.
========================================================= */
app.get(
    "/api/my-social-orders",
    async (req, res) => {
        try {
            const decodedToken =
                await verifyUser(req);
            const uid =
                decodedToken.uid;
            const snapshot =
                await db
                    .ref("orders")
                    .orderByChild("uid")
                    .equalTo(uid)
                    .once("value");
            const data =
                snapshot.val() || {};
            const orders =
                Object.values(data)
                    .filter(
                        order =>
                            order &&
                            String(order.uid) ===
                            String(uid) &&
                            order.accountId
                    )
                    .sort(
                        (a, b) =>
                            Number(
                                b.createdAt ||
                                b.timestamp ||
                                0
                            ) -
                            Number(
                                a.createdAt ||
                                a.timestamp ||
                                0
                            )
                    );
            return res.status(200).json({
                success:
                    true,
                orders
            });
        } catch (error) {
            console.error(
                "MY SOCIAL ORDERS ERROR:",
                error
            );
            if (
                error.message ===
                "AUTHENTICATION_REQUIRED"
            ) {
                return sendError(
                    res,
                    401,
                    "Please log in to view your purchase history."
                );
            }
            return sendError(
                res,
                500,
                "Unable to load your purchase history."
            );
        }
    }
);
/* =========================================================
   EXPORT
========================================================= */
export default app;
