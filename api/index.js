import express from "express";
import { admin, db } from "./firebase-admin.js";
const app = express();
app.use(express.json());
/* ============================================================
   HELPERS
============================================================ */
function sendError(res, status, message) {
    return res.status(status).json({
        success: false,
        message
    });
}
/* ============================================================
   VERIFY FIREBASE ID TOKEN
============================================================ */
async function verifyUser(req) {
    const authorization =
        req.headers.authorization || "";
    if (!authorization.startsWith("Bearer ")) {
        throw new Error("AUTHENTICATION_REQUIRED");
    }
    const idToken =
        authorization.substring(7);
    if (!idToken) {
        throw new Error("AUTHENTICATION_REQUIRED");
    }
    return await admin
        .auth()
        .verifyIdToken(idToken);
}
/* ============================================================
   VERIFY ADMIN
============================================================ */
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
        userData.isAdmin === true ||
        decodedToken.admin === true;
    if (!isAdmin) {
        throw new Error("ADMIN_REQUIRED");
    }
    return {
        decodedToken,
        uid,
        userData
    };
}
/* ============================================================
   FORMAT ACCOUNT TITLE
============================================================ */
function buildAccountTitle(account) {
    const platform =
        String(
            account.platform || "Social"
        );
    const title =
        String(
            account.title ||
            "Social Media Account"
        );
    if (
        title
            .toLowerCase()
            .includes(
                platform.toLowerCase()
            )
    ) {
        return title;
    }
    return `${platform} - ${title}`;
}
/* ============================================================
   1. ADD ACCOUNT
   ADMIN ONLY
   Credentials are stored privately in Firebase.
   They are NEVER returned by the public marketplace endpoint.
============================================================ */
app.post(
    "/api/add-account",
    async (req, res) => {
        try {
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
            /* --------------------------------------------
               ADMIN AUTHENTICATION
            -------------------------------------------- */
            await verifyAdmin(req);
            /* --------------------------------------------
               VALIDATION
            -------------------------------------------- */
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
                !Number.isFinite(
                    numericPrice
                ) ||
                numericPrice <= 0
            ) {
                return sendError(
                    res,
                    400,
                    "Please provide a valid account price."
                );
            }
            let finalCredentials =
                typeof credentials === "string"
                    ? credentials.trim()
                    : "";
            if (
                !finalCredentials &&
                (username || password)
            ) {
                finalCredentials =
                    `Username: ${username || "N/A"}\n` +
                    `Password: ${password || "N/A"}`;
            }
            if (!finalCredentials) {
                return sendError(
                    res,
                    400,
                    "Account login credentials are required."
                );
            }
            /* --------------------------------------------
               CREATE ACCOUNT
            -------------------------------------------- */
            const accountRef =
                db
                    .ref("accounts")
                    .push();
            const accountId =
                accountRef.key;
            const accountData = {
                id:
                    accountId,
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
                    Number(
                        numericPrice.toFixed(2)
                    ),
                accountAge:
                    String(
                        accountAge ||
                        "N/A"
                    ).trim(),
                description:
                    String(
                        description ||
                        "Verified social media account ready for immediate transfer."
                    ).trim(),
                /*
                 * PRIVATE FIELD.
                 *
                 * This field must never be returned
                 * from /api/get-accounts.
                 */
                credentials:
                    finalCredentials,
                status:
                    "available",
                createdAt:
                    Date.now()
            };
            await accountRef.set(
                accountData
            );
            return res.status(200).json({
                success:
                    true,
                message:
                    "Account successfully added to the marketplace.",
                accountId
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
                    "Administrator access required."
                );
            }
            return sendError(
                res,
                500,
                "Unable to add account."
            );
        }
    }
);
/* ============================================================
   2. GET AVAILABLE ACCOUNTS
   PUBLIC MARKETPLACE
   CRITICAL:
   Credentials are deliberately removed from the response.
============================================================ */
app.get(
    "/api/get-accounts",
    async (req, res) => {
        try {
            const snapshot =
                await db
                    .ref("accounts")
                    .orderByChild("status")
                    .equalTo("available")
                    .once("value");
            const rawAccounts =
                snapshot.val() || {};
            const accounts = {};
            Object.entries(
                rawAccounts
            ).forEach(
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
                    /*
                     * PUBLIC DATA ONLY.
                     *
                     * credentials,
                     * username,
                     * password,
                     * buyerUid,
                     * soldTo
                     * and other sensitive fields
                     * are deliberately excluded.
                     */
                    accounts[key] = {
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
                        price:
                            Number(
                                account.price || 0
                            ),
                        accountAge:
                            account.accountAge ||
                            account.age ||
                            "N/A",
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
                accounts
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
/* ============================================================
   3. GET ALL ACCOUNTS
   ADMIN ONLY
   This endpoint can include credentials because it is
   protected by Firebase authentication + admin verification.
============================================================ */
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
                    "Administrator access required."
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
/* ============================================================
   4. DELETE ACCOUNT
   ADMIN ONLY
============================================================ */
app.delete(
    "/api/admin/delete-account/:id",
    async (req, res) => {
        try {
            await verifyAdmin(req);
            const accountId =
                String(
                    req.params.id || ""
                ).trim();
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
                await accountRef.once(
                    "value"
                );
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
                    "Administrator access required."
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
/* ============================================================
   5. BUY ACCOUNT WITH WALLET
   AUTHENTICATED USERS ONLY
   SECURITY MODEL:
   Browser sends ONLY:
       accountId
   Server determines:
       authenticated UID
       account price
       wallet balance
       credentials
       order ID
   Browser cannot choose:
       price
       wallet balance
       buyer UID
       credentials
============================================================ */
app.post(
    "/api/buy-account-wallet",
    async (req, res) => {
        let uid = null;
        let accountId = null;
        let accountRef = null;
        let userRef = null;
        let orderRef = null;
        let accountReserved = false;
        let walletDeducted = false;
        let orderCreated = false;
        let purchasePrice = 0;
        try {
            /* --------------------------------------------
               VERIFY AUTHENTICATED USER
            -------------------------------------------- */
            const decodedToken =
                await verifyUser(req);
            uid =
                decodedToken.uid;
            /* --------------------------------------------
               ONLY ACCEPT ACCOUNT ID
            -------------------------------------------- */
            accountId =
                String(
                    req.body?.accountId || ""
                ).trim();
            if (!accountId) {
                return sendError(
                    res,
                    400,
                    "Account ID is required."
                );
            }
            accountRef =
                db.ref(
                    `accounts/${accountId}`
                );
            userRef =
                db.ref(
                    `users/${uid}`
                );
            /* --------------------------------------------
               READ ACCOUNT
            -------------------------------------------- */
            const accountSnapshot =
                await accountRef.once(
                    "value"
                );
            const accountData =
                accountSnapshot.val();
            if (!accountData) {
                return sendError(
                    res,
                    404,
                    "This account is no longer available."
                );
            }
            const currentStatus =
                String(
                    accountData.status ||
                    ""
                )
                    .trim()
                    .toLowerCase();
            if (
                currentStatus !==
                "available"
            ) {
                return sendError(
                    res,
                    409,
                    "This account has already been sold or is unavailable."
                );
            }
            /* --------------------------------------------
               SERVER-CONTROLLED PRICE
            -------------------------------------------- */
            purchasePrice =
                Number(
                    accountData.price
                );
            if (
                !Number.isFinite(
                    purchasePrice
                ) ||
                purchasePrice <= 0
            ) {
                return sendError(
                    res,
                    400,
                    "This account has an invalid price."
                );
            }
            purchasePrice =
                Number(
                    purchasePrice.toFixed(2)
                );
            /* --------------------------------------------
               RESERVE ACCOUNT ATOMICALLY
            -------------------------------------------- */
            const accountTransaction =
                await accountRef.transaction(
                    currentAccount => {
                        if (
                            !currentAccount
                        ) {
                            return;
                        }
                        const status =
                            String(
                                currentAccount.status ||
                                ""
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
                            ...currentAccount,
                            status:
                                "processing",
                            processingBy:
                                uid,
                            processingAt:
                                Date.now()
                        };
                    }
                );
            if (
                !accountTransaction.committed
            ) {
                return sendError(
                    res,
                    409,
                    "This account was just purchased by another customer. Please choose another account."
                );
            }
            accountReserved = true;
            /* --------------------------------------------
               GET USER DATA
            -------------------------------------------- */
            const userSnapshot =
                await userRef.once(
                    "value"
                );
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
                throw new Error(
                    "INVALID_WALLET"
                );
            }
            if (
                currentBalance <
                purchasePrice
            ) {
                /*
                 * Release account reservation.
                 */
                await accountRef.transaction(
                    currentAccount => {
                        if (
                            !currentAccount
                        ) {
                            return null;
                        }
                        if (
                            currentAccount.processingBy !==
                            uid
                        ) {
                            return currentAccount;
                        }
                        return {
                            ...currentAccount,
                            status:
                                "available",
                            processingBy:
                                null,
                            processingAt:
                                null
                        };
                    }
                );
                accountReserved = false;
                return sendError(
                    res,
                    400,
                    `Insufficient wallet balance. You need ₦${purchasePrice.toLocaleString("en-NG")} but have ₦${currentBalance.toLocaleString("en-NG")}.`
                );
            }
            /* --------------------------------------------
               DEDUCT WALLET ATOMICALLY
            -------------------------------------------- */
            const walletTransaction =
                await userRef.transaction(
                    currentUser => {
                        if (
                            !currentUser
                        ) {
                            return null;
                        }
                        const balance =
                            Number(
                                currentUser.wallet || 0
                            );
                        if (
                            !Number.isFinite(
                                balance
                            ) ||
                            balance <
                            purchasePrice
                        ) {
                            return;
                        }
                        const updatedUser =
                            {
                                ...currentUser
                            };
                        updatedUser.wallet =
                            Number(
                                (
                                    balance -
                                    purchasePrice
                                ).toFixed(2)
                            );
                        updatedUser.totalSpent =
                            Number(
                                currentUser.totalSpent ||
                                0
                            ) +
                            purchasePrice;
                        return updatedUser;
                    }
                );
            if (
                !walletTransaction.committed
            ) {
                throw new Error(
                    "WALLET_TRANSACTION_FAILED"
                );
            }
            walletDeducted = true;
            /* --------------------------------------------
               CREATE ORDER
            -------------------------------------------- */
            orderRef =
                db
                    .ref("orders")
                    .push();
            const orderId =
                orderRef.key;
            const platform =
                accountData.platform ||
                "Social";
            const accountTitle =
                buildAccountTitle(
                    accountData
                );
            const credentials =
                accountData.credentials ||
                (
                    "Username: " +
                    (
                        accountData.username ||
                        "N/A"
                    ) +
                    "\nPassword: " +
                    (
                        accountData.password ||
                        "N/A"
                    )
                );
            const orderData = {
                orderId,
                id:
                    orderId,
                uid,
                accountId,
                accountTitle,
                title:
                    accountTitle,
                platform,
                niche:
                    accountData.niche ||
                    "General",
                followers:
                    accountData.followers ||
                    accountData.followerCount ||
                    "N/A",
                accountAge:
                    accountData.accountAge ||
                    accountData.age ||
                    "N/A",
                accountDescription:
                    accountData.description ||
                    "No description provided.",
                amount:
                    purchasePrice,
                price:
                    purchasePrice,
                paymentMethod:
                    "wallet",
                status:
                    "completed",
                credentials,
                createdAt:
                    Date.now(),
                email:
                    decodedToken.email ||
                    userData.email ||
                    "N/A"
            };
            await orderRef.set(
                orderData
            );
            orderCreated = true;
            /* --------------------------------------------
               COMPLETE ACCOUNT SALE
            -------------------------------------------- */
            await accountRef.update({
                status:
                    "sold",
                buyerUid:
                    uid,
                soldTo:
                    decodedToken.email ||
                    userData.email ||
                    "N/A",
                soldAt:
                    Date.now(),
                purchaseOrderId:
                    orderId,
                purchaseReference:
                    `WALLET-${orderId}`,
                processingBy:
                    null,
                processingAt:
                    null
            });
            accountReserved = false;
            /* --------------------------------------------
               SUCCESS
            -------------------------------------------- */
            return res.status(200).json({
                success:
                    true,
                message:
                    "Purchase successful.",
                orderId,
                reference:
                    `WALLET-${orderId}`,
                platform,
                amount:
                    purchasePrice
            });
        } catch (error) {
            console.error(
                "BUY ACCOUNT ERROR:",
                error
            );
            /* =================================================
               ROLLBACK
            ================================================= */
            /*
             * If the wallet was deducted but the order failed,
             * refund the customer.
             */
            if (
                walletDeducted &&
                !orderCreated &&
                userRef
            ) {
                try {
                    await userRef.transaction(
                        currentUser => {
                            if (
                                !currentUser
                            ) {
                                return null;
                            }
                            const balance =
                                Number(
                                    currentUser.wallet ||
                                    0
                                );
                            if (
                                !Number.isFinite(
                                    balance
                                )
                            ) {
                                return currentUser;
                            }
                            return {
                                ...currentUser,
                                wallet:
                                    Number(
                                        (
                                            balance +
                                            purchasePrice
                                        ).toFixed(2)
                                    ),
                                totalSpent:
                                    Math.max(
                                        0,
                                        Number(
                                            currentUser.totalSpent ||
                                            0
                                        ) -
                                        purchasePrice
                                    )
                            };
                        }
                    );
                } catch (refundError) {
                    console.error(
                        "WALLET REFUND ERROR:",
                        refundError
                    );
                }
            }
            /*
             * If an account was reserved but sale did not
             * complete, return it to available.
             */
            if (
                accountReserved &&
                accountRef &&
                uid
            ) {
                try {
                    await accountRef.transaction(
                        currentAccount => {
                            if (
                                !currentAccount
                            ) {
                                return null;
                            }
                            if (
                                currentAccount.processingBy !==
                                uid
                            ) {
                                return currentAccount;
                            }
                            return {
                                ...currentAccount,
                                status:
                                    "available",
                                processingBy:
                                    null,
                                processingAt:
                                    null
                            };
                        }
                    );
                } catch (releaseError) {
                    console.error(
                        "ACCOUNT RELEASE ERROR:",
                        releaseError
                    );
                }
            }
            /* --------------------------------------------
               ERROR RESPONSES
            -------------------------------------------- */
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
                "INVALID_WALLET"
            ) {
                return sendError(
                    res,
                    500,
                    "Your wallet balance is invalid."
                );
            }
            if (
                error.message ===
                "WALLET_TRANSACTION_FAILED"
            ) {
                return sendError(
                    res,
                    400,
                    "Insufficient wallet balance or the wallet could not be updated."
                );
            }
            return sendError(
                res,
                500,
                "Purchase could not be completed. Your wallet was not charged if the purchase was unsuccessful."
            );
        }
    }
);
/* ============================================================
   6. MY SOCIAL ACCOUNT PURCHASE HISTORY
   AUTHENTICATED USER ONLY
   Returns ONLY orders belonging to the Firebase UID
   from the verified ID token.
============================================================ */
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
            const rawOrders =
                snapshot.val() || {};
            const orders =
                Object.values(
                    rawOrders
                );
            orders.sort(
                (a, b) => {
                    return (
                        Number(
                            b.createdAt ||
                            b.timestamp ||
                            0
                        )
                        -
                        Number(
                            a.createdAt ||
                            a.timestamp ||
                            0
                        )
                    );
                }
            );
            /*
             * Only return orders belonging to this UID.
             *
             * Credentials are included because this endpoint
             * is authenticated and scoped to the current user.
             */
            const safeOrders =
                orders.map(
                    order => ({
                        orderId:
                            order.orderId ||
                            order.id ||
                            "N/A",
                        id:
                            order.id ||
                            order.orderId ||
                            "N/A",
                        uid,
                        accountId:
                            order.accountId ||
                            "N/A",
                        accountTitle:
                            order.accountTitle ||
                            order.title ||
                            "Social Media Account",
                        title:
                            order.title ||
                            order.accountTitle ||
                            "Social Media Account",
                        platform:
                            order.platform ||
                            "Social",
                        niche:
                            order.niche ||
                            "General",
                        followers:
                            order.followers ||
                            "N/A",
                        accountAge:
                            order.accountAge ||
                            "N/A",
                        accountDescription:
                            order.accountDescription ||
                            order.description ||
                            "No description provided.",
                        amount:
                            Number(
                                order.amount !== undefined
                                    ? order.amount
                                    : order.price || 0
                            ),
                        price:
                            Number(
                                order.price !== undefined
                                    ? order.price
                                    : order.amount || 0
                            ),
                        paymentMethod:
                            order.paymentMethod ||
                            "wallet",
                        status:
                            order.status ||
                            "completed",
                        credentials:
                            order.credentials ||
                            "Credentials are not available for this purchase.",
                        createdAt:
                            order.createdAt ||
                            order.timestamp ||
                            null
                    })
                );
            return res.status(200).json({
                success:
                    true,
                orders:
                    safeOrders
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
                    "Please log in again."
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
/* ============================================================
   HEALTH CHECK
============================================================ */
app.get(
    "/api/health",
    (req, res) => {
        return res.status(200).json({
            success:
                true,
            service:
                "HKDMservices API",
            status:
                "online"
        });
    }
);
/* ============================================================
   EXPORT
============================================================ */
export default app;
