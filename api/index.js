import express from "express";
import { admin, db } from "./firebase-admin.js";
const app = express();
app.use(express.json());
/* =========================================================
   HELPERS
========================================================= */
function getBearerToken(req) {
    const authorization =
        req.headers.authorization || "";
    if (!authorization.startsWith("Bearer ")) {
        return null;
    }
    return authorization.substring(7).trim();
}
async function requireAuth(req, res) {
    const idToken =
        getBearerToken(req);
    if (!idToken) {
        res.status(401).json({
            success: false,
            message: "Please log in again."
        });
        return null;
    }
    try {
        const decodedToken =
            await admin
                .auth()
                .verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error(
            "AUTH VERIFICATION ERROR:",
            error
        );
        res.status(401).json({
            success: false,
            message: "Authentication expired. Please log in again."
        });
        return null;
    }
}
/* =========================================================
   1. ADD ACCOUNT
   Admin inventory is stored in:
       accounts/{accountId}
   Credentials stay in the database and are NEVER returned
   by the public marketplace endpoint.
========================================================= */
app.post(
    "/api/add-account",
    async (req, res) => {
        try {
            const {
                platform,
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
                return res.status(400).json({
                    success: false,
                    message: "Platform is required."
                });
            }
            const numericPrice =
                Number(price);
            if (
                !Number.isFinite(numericPrice) ||
                numericPrice <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid account price."
                });
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
                return res.status(400).json({
                    success: false,
                    message: "Account credentials are required."
                });
            }
            const newAccountRef =
                db.ref("accounts").push();
            const accountData = {
                id:
                    newAccountRef.key,
                platform:
                    String(platform),
                niche:
                    niche || "General",
                followers:
                    followers !== undefined
                        ? followers
                        : "N/A",
                price:
                    numericPrice,
                accountAge:
                    accountAge || "N/A",
                credentials:
                    String(finalCredentials),
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
                success: true,
                message:
                    "Account successfully listed.",
                accountId:
                    newAccountRef.key
            });
        } catch (error) {
            console.error(
                "ADD ACCOUNT ERROR:",
                error
            );
            return res.status(500).json({
                success: false,
                message: "Unable to add account."
            });
        }
    }
);
/* =========================================================
   2. GET AVAILABLE ACCOUNTS
   PUBLIC ENDPOINT.
   CRITICAL:
   Credentials are deliberately removed before sending
   account data to the customer browser.
========================================================= */
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
            const data =
                snapshot.val() || {};
            const accounts = {};
            Object.entries(data)
                .forEach(
                    ([key, account]) => {
                        if (!account) {
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
                        accounts[key] = {
                            id:
                                account.id ||
                                key,
                            platform:
                                account.platform ||
                                "Social",
                            niche:
                                account.niche ||
                                "General",
                            title:
                                account.title ||
                                account.platform ||
                                "Social Media Account",
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
                success: true,
                accounts
            });
        } catch (error) {
            console.error(
                "GET ACCOUNTS ERROR:",
                error
            );
            return res.status(500).json({
                success: false,
                message:
                    "Unable to load marketplace accounts."
            });
        }
    }
);
/* =========================================================
   3. GET ALL ACCOUNTS
   ADMIN INVENTORY.
   This endpoint is kept separate from the public endpoint.
========================================================= */
app.get(
    "/api/admin/get-accounts",
    async (req, res) => {
        try {
            const decodedToken =
                await requireAuth(
                    req,
                    res
                );
            if (!decodedToken) {
                return;
            }
            const userSnapshot =
                await db
                    .ref(
                        `users/${decodedToken.uid}`
                    )
                    .once("value");
            const userData =
                userSnapshot.val() || {};
            const isAdmin =
                userData.role === "admin" ||
                userData.isAdmin === true;
            if (!isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: "Administrator access required."
                });
            }
            const snapshot =
                await db
                    .ref("accounts")
                    .once("value");
            const accounts =
                snapshot.val() || {};
            return res.status(200).json({
                success: true,
                accounts
            });
        } catch (error) {
            console.error(
                "ADMIN GET ACCOUNTS ERROR:",
                error
            );
            return res.status(500).json({
                success: false,
                message:
                    "Unable to load account inventory."
            });
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
            const decodedToken =
                await requireAuth(
                    req,
                    res
                );
            if (!decodedToken) {
                return;
            }
            const userSnapshot =
                await db
                    .ref(
                        `users/${decodedToken.uid}`
                    )
                    .once("value");
            const userData =
                userSnapshot.val() || {};
            const isAdmin =
                userData.role === "admin" ||
                userData.isAdmin === true;
            if (!isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: "Administrator access required."
                });
            }
            const accountId =
                req.params.id;
            if (!accountId) {
                return res.status(400).json({
                    success: false,
                    message: "Account ID is required."
                });
            }
            await db
                .ref(`accounts/${accountId}`)
                .remove();
            return res.status(200).json({
                success: true,
                message:
                    "Account deleted successfully."
            });
        } catch (error) {
            console.error(
                "DELETE ACCOUNT ERROR:",
                error
            );
            return res.status(500).json({
                success: false,
                message:
                    "Unable to delete account."
            });
        }
    }
);
/* =========================================================
   5. BUY ACCOUNT USING WALLET
   SECURITY MODEL:
   Customer sends:
       accountId
   Authentication comes from:
       Authorization: Bearer FIREBASE_ID_TOKEN
   Customer DOES NOT send:
       uid
       wallet balance
       price
       credentials
       email
   The server determines all sensitive values.
========================================================= */
app.post(
    "/api/buy-account-wallet",
    async (req, res) => {
        try {
            /* -------------------------------------------------
               VERIFY AUTHENTICATION
            ------------------------------------------------- */
            const decodedToken =
                await requireAuth(
                    req,
                    res
                );
            if (!decodedToken) {
                return;
            }
            const uid =
                decodedToken.uid;
            /* -------------------------------------------------
               VALIDATE ACCOUNT ID
            ------------------------------------------------- */
            const {
                accountId
            } = req.body || {};
            if (!accountId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Account ID is required."
                });
            }
            /* -------------------------------------------------
               REFERENCES
            ------------------------------------------------- */
            const accountRef =
                db.ref(
                    `accounts/${accountId}`
                );
            const userRef =
                db.ref(
                    `users/${uid}`
                );
            /* -------------------------------------------------
               READ ACCOUNT
            ------------------------------------------------- */
            const accountSnapshot =
                await accountRef.once("value");
            const accountData =
                accountSnapshot.val();
            if (!accountData) {
                return res.status(404).json({
                    success: false,
                    message:
                        "This account no longer exists."
                });
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
                return res.status(409).json({
                    success: false,
                    message:
                        "This account is no longer available."
                });
            }
            /* -------------------------------------------------
               VALIDATE SERVER PRICE
            ------------------------------------------------- */
            const price =
                Number(
                    accountData.price
                );
            if (
                !Number.isFinite(price) ||
                price <= 0
            ) {
                return res.status(500).json({
                    success: false,
                    message:
                        "This account has an invalid price."
                });
            }
            /* -------------------------------------------------
               READ USER
            ------------------------------------------------- */
            const userSnapshot =
                await userRef.once("value");
            const userData =
                userSnapshot.val();
            if (!userData) {
                return res.status(404).json({
                    success: false,
                    message:
                        "User account could not be found."
                });
            }
            const currentBalance =
                Number(
                    userData.wallet || 0
                );
            if (
                !Number.isFinite(
                    currentBalance
                ) ||
                currentBalance < 0
            ) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Your wallet balance is invalid."
                });
            }
            /* -------------------------------------------------
               CHECK BALANCE
            ------------------------------------------------- */
            if (
                currentBalance <
                price
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Insufficient wallet balance. You need ₦${price.toLocaleString("en-NG")} but have ₦${currentBalance.toLocaleString("en-NG")}.`
                });
            }
            /* -------------------------------------------------
               CREATE ORDER ID
            ------------------------------------------------- */
            const orderRef =
                db.ref("orders").push();
            const orderId =
                orderRef.key;
            const now =
                Date.now();
            const platform =
                accountData.platform ||
                "Social";
            const title =
                accountData.title ||
                `${platform} Account`;
            const followers =
                accountData.followers ||
                accountData.followerCount ||
                "N/A";
            const accountAge =
                accountData.accountAge ||
                accountData.age ||
                "N/A";
            const description =
                accountData.description ||
                "Verified social media account ready for immediate transfer.";
            /* -------------------------------------------------
               NEW WALLET BALANCE
            ------------------------------------------------- */
            const newBalance =
                Number(
                    (
                        currentBalance -
                        price
                    ).toFixed(2)
                );
            const newTotalSpent =
                Number(
                    (
                        Number(
                            userData.totalSpent || 0
                        ) +
                        price
                    ).toFixed(2)
                );
            /* -------------------------------------------------
               PURCHASE REFERENCE
            ------------------------------------------------- */
            const reference =
                `SOC-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
            /* -------------------------------------------------
               ORDER DATA
            -------------------------------------------------
               Credentials are intentionally stored in the
               customer's order because the purchaser needs
               them after successful payment.
               They are NOT returned by /api/get-accounts.
            ------------------------------------------------- */
            const orderData = {
                orderId,
                id:
                    orderId,
                uid,
                accountId,
                accountTitle:
                    title,
                title,
                platform,
                followers,
                accountAge,
                accountDescription:
                    description,
                description,
                amount:
                    price,
                price,
                paymentMethod:
                    "wallet",
                status:
                    "completed",
                reference,
                credentials:
                    accountData.credentials ||
                    `Username: ${accountData.username || "N/A"} | Password: ${accountData.password || "N/A"}`,
                createdAt:
                    now,
                timestamp:
                    now,
                email:
                    userData.email ||
                    decodedToken.email ||
                    "N/A"
            };
            /* -------------------------------------------------
               ATOMIC MULTI-PATH UPDATE
            -------------------------------------------------
               Wallet deduction
               +
               account sale
               +
               order creation
               +
               transaction record
               are committed together.
               This is much safer than performing separate
               set/update operations.
            ------------------------------------------------- */
            const transactionRef =
                db
                    .ref("transactions")
                    .push();
            const transactionId =
                transactionRef.key;
            const transactionData = {
                id:
                    transactionId,
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
                description:
                    `Social Account Purchase - ${platform} - ${title}`,
                reference,
                createdAt:
                    now
            };
            const updates = {};
            /* USER */
            updates[
                `users/${uid}/wallet`
            ] =
                newBalance;
            updates[
                `users/${uid}/totalSpent`
            ] =
                newTotalSpent;
            /* ACCOUNT */
            updates[
                `accounts/${accountId}/status`
            ] =
                "sold";
            updates[
                `accounts/${accountId}/buyerUid`
            ] =
                uid;
            updates[
                `accounts/${accountId}/buyerEmail`
            ] =
                userData.email ||
                decodedToken.email ||
                "N/A";
            updates[
                `accounts/${accountId}/soldAt`
            ] =
                now;
            updates[
                `accounts/${accountId}/orderId`
            ] =
                orderId;
            updates[
                `accounts/${accountId}/reference`
            ] =
                reference;
            /* ORDER */
            updates[
                `orders/${orderId}`
            ] =
                orderData;
            /* TRANSACTION */
            updates[
                `transactions/${transactionId}`
            ] =
                transactionData;
            /* -------------------------------------------------
               COMMIT EVERYTHING
            ------------------------------------------------- */
            await db
                .ref()
                .update(
                    updates
                );
            /* -------------------------------------------------
               SUCCESS
            ------------------------------------------------- */
            return res.status(200).json({
                success: true,
                message:
                    "Purchase completed successfully.",
                orderId,
                reference,
                platform,
                newWalletBalance:
                    newBalance
            });
        } catch (error) {
            console.error(
                "BUY ACCOUNT ERROR:",
                error
            );
            return res.status(500).json({
                success: false,
                message:
                    "Unable to complete the purchase. No purchase was confirmed."
            });
        }
    }
);
/* =========================================================
   6. MY SOCIAL ACCOUNT PURCHASE HISTORY
   AUTHENTICATED USERS ONLY.
   The UID comes ONLY from the verified Firebase token.
   The browser cannot request another user's orders by
   supplying another UID.
========================================================= */
app.get(
    "/api/my-social-orders",
    async (req, res) => {
        try {
            const decodedToken =
                await requireAuth(
                    req,
                    res
                );
            if (!decodedToken) {
                return;
            }
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
                success: true,
                orders
            });
        } catch (error) {
            console.error(
                "MY SOCIAL ORDERS ERROR:",
                error
            );
            return res.status(500).json({
                success: false,
                message:
                    "Unable to load your purchase history."
            });
        }
    }
);
/* =========================================================
   7. HEALTH CHECK
========================================================= */
app.get(
    "/api/health",
    (req, res) => {
        return res.status(200).json({
            success: true,
            message:
                "HKDMservices API is running."
        });
    }
);
/* =========================================================
   EXPORT
========================================================= */
export default app;
