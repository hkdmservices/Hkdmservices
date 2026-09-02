import express from "express";
import { admin, db } from "./firebase-admin.js";
const app = express();
app.use(express.json());
/* =========================================================
   HELPER: VERIFY FIREBASE AUTH TOKEN
========================================================= */
async function authenticateUser(req) {
    const authHeader =
        req.headers.authorization || "";
    if (
        !authHeader.startsWith("Bearer ")
    ) {
        throw new Error(
            "AUTHENTICATION_REQUIRED"
        );
    }
    const idToken =
        authHeader.substring(7).trim();
    if (!idToken) {
        throw new Error(
            "AUTHENTICATION_REQUIRED"
        );
    }
    const decodedToken =
        await admin
            .auth()
            .verifyIdToken(idToken);
    return decodedToken;
}
/* =========================================================
   1. ADD ACCOUNT
   =========================================================
   Used by your admin/dashboard.
   Stores marketplace inventory at:
       accounts/{accountId}
   IMPORTANT:
   Credentials are stored privately in Firebase.
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
                status
            } = req.body;
            if (
                !platform ||
                price === undefined ||
                price === null
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Missing required fields."
                });
            }
            const numericPrice =
                Number(price);
            if (
                !Number.isFinite(
                    numericPrice
                ) ||
                numericPrice <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid account price."
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
                    message:
                        "Missing login credentials."
                });
            }
            const newAccountRef =
                db
                    .ref("accounts")
                    .push();
            const accountData = {
                id:
                    newAccountRef.key,
                platform:
                    String(platform),
                niche:
                    niche || "General",
                followers:
                    Number(followers) || 0,
                price:
                    numericPrice,
                accountAge:
                    accountAge || "N/A",
                credentials:
                    String(finalCredentials),
                status:
                    status || "available",
                createdAt:
                    Date.now()
            };
            await newAccountRef.set(
                accountData
            );
            return res.status(200).json({
                success: true,
                message:
                    "Account successfully added to marketplace.",
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
                message:
                    "Unable to add account."
            });
        }
    }
);
/* =========================================================
   2. GET AVAILABLE MARKETPLACE ACCOUNTS
   =========================================================
   Customer endpoint.
   NEVER returns credentials.
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
                    ([id, account]) => {
                        if (!account) {
                            return;
                        }
                        accounts[id] = {
                            id,
                            platform:
                                account.platform ||
                                "Social",
                            niche:
                                account.niche ||
                                "General",
                            title:
                                account.title ||
                                account.handle ||
                                "Social Media Account",
                            followers:
                                account.followers ||
                                account.followerCount ||
                                "N/A",
                            accountAge:
                                account.accountAge ||
                                account.age ||
                                "N/A",
                            price:
                                Number(
                                    account.price || 0
                                ),
                            description:
                                account.description ||
                                "Verified social media account ready for immediate transfer.",
                            status:
                                "available",
                            createdAt:
                                account.createdAt ||
                                null
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
                    "Unable to load marketplace listings."
            });
        }
    }
);
/* =========================================================
   3. ADMIN GET ALL ACCOUNTS
========================================================= */
app.get(
    "/api/admin/get-accounts",
    async (req, res) => {
        try {
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
========================================================= */
app.delete(
    "/api/admin/delete-account/:id",
    async (req, res) => {
        try {
            const accountId =
                req.params.id;
            if (!accountId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Missing account ID."
                });
            }
            await db
                .ref(
                    `accounts/${accountId}`
                )
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
   5. GET MY SOCIAL ACCOUNT PURCHASE HISTORY
=========================================================
   IMPORTANT:
   The browser cannot specify another user's UID.
   UID comes from the verified Firebase ID token.
========================================================= */
app.get(
    "/api/my-social-orders",
    async (req, res) => {
        try {
            const decodedUser =
                await authenticateUser(req);
            const uid =
                decodedUser.uid;
            const snapshot =
                await db
                    .ref("orders")
                    .orderByChild("uid")
                    .equalTo(uid)
                    .once("value");
            const data =
                snapshot.val() || {};
            const orders =
                Object.entries(data)
                    .map(
                        ([firebaseKey, order]) => ({
                            ...order,
                            firebaseKey,
                            orderId:
                                order.orderId ||
                                order.id ||
                                firebaseKey
                        })
                    );
            orders.sort(
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
            if (
                error.message ===
                "AUTHENTICATION_REQUIRED"
            ) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Authentication required. Please log in."
                });
            }
            return res.status(500).json({
                success: false,
                message:
                    "Unable to load your purchase history."
            });
        }
    }
);
/* =========================================================
   6. BUY SOCIAL ACCOUNT WITH WALLET
=========================================================
   SECURITY:
   Client sends ONLY:
       accountId
   Server determines:
       authenticated UID
       email
       real account price
       wallet balance
       credentials
       order information
========================================================= */
app.post(
    "/api/buy-account-wallet",
    async (req, res) => {
        try {
            /* ---------------------------------------------
               VERIFY USER
            --------------------------------------------- */
            const decodedUser =
                await authenticateUser(req);
            const uid =
                decodedUser.uid;
            const email =
                decodedUser.email ||
                "N/A";
            /* ---------------------------------------------
               GET ACCOUNT ID
            --------------------------------------------- */
            const {
                accountId
            } = req.body;
            if (!accountId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Missing account ID."
                });
            }
            /* ---------------------------------------------
               ACCOUNT REFERENCE
            --------------------------------------------- */
            const accountRef =
                db.ref(
                    `accounts/${accountId}`
                );
            const accountSnapshot =
                await accountRef.once(
                    "value"
                );
            const accountData =
                accountSnapshot.val();
            if (!accountData) {
                return res.status(404).json({
                    success: false,
                    message:
                        "This account no longer exists."
                });
            }
            /* ---------------------------------------------
               CHECK ACCOUNT AVAILABILITY
            --------------------------------------------- */
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
            /* ---------------------------------------------
               SERVER-CONTROLLED PRICE
            --------------------------------------------- */
            const price =
                Number(
                    accountData.price
                );
            if (
                !Number.isFinite(price) ||
                price <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This account has an invalid price."
                });
            }
            /* ---------------------------------------------
               USER REFERENCE
            --------------------------------------------- */
            const userRef =
                db.ref(
                    `users/${uid}`
                );
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
                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to read wallet balance."
                });
            }
            /* ---------------------------------------------
               CHECK WALLET
            --------------------------------------------- */
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
            /* ---------------------------------------------
               CREATE REFERENCE
            --------------------------------------------- */
            const reference =
                `ACC-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
            const orderRef =
                db
                    .ref("orders")
                    .push();
            const orderId =
                orderRef.key;
            /* ---------------------------------------------
               ACCOUNT TITLE
            --------------------------------------------- */
            const platform =
                accountData.platform ||
                "Social";
            const baseTitle =
                accountData.title ||
                accountData.handle ||
                "Social Media Account";
            const titleText =
                String(baseTitle);
            const platformText =
                String(platform);
            const accountTitle =
                titleText
                    .toLowerCase()
                    .includes(
                        platformText.toLowerCase()
                    )
                    ? titleText
                    : `${platformText} - ${titleText}`;
            /* ---------------------------------------------
               STEP 1:
               ATOMICALLY MARK ACCOUNT SOLD
            --------------------------------------------- */
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
                            ...currentAccount,
                            status:
                                "sold",
                            buyerUid:
                                uid,
                            buyerEmail:
                                email,
                            soldAt:
                                Date.now(),
                            reference
                        };
                    }
                );
            if (
                !accountTransaction.committed
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This account has just been purchased by another customer."
                });
            }
            /* ---------------------------------------------
               STEP 2:
               ATOMICALLY DEDUCT WALLET
            --------------------------------------------- */
            const walletTransaction =
                await userRef.transaction(
                    currentUser => {
                        if (
                            !currentUser
                        ) {
                            return;
                        }
                        const balance =
                            Number(
                                currentUser.wallet || 0
                            );
                        if (
                            !Number.isFinite(
                                balance
                            ) ||
                            balance < price
                        ) {
                            return;
                        }
                        const updatedUser = {
                            ...currentUser,
                            wallet:
                                Number(
                                    (
                                        balance -
                                        price
                                    ).toFixed(2)
                                ),
                            totalSpent:
                                Number(
                                    currentUser.totalSpent ||
                                    0
                                ) +
                                price
                        };
                        return updatedUser;
                    }
                );
            if (
                !walletTransaction.committed
            ) {
                /* -----------------------------------------
                   WALLET FAILED
                   Release the account again.
                ----------------------------------------- */
                await accountRef.transaction(
                    currentAccount => {
                        if (
                            !currentAccount
                        ) {
                            return;
                        }
                        if (
                            currentAccount.reference ===
                            reference &&
                            currentAccount.buyerUid ===
                            uid &&
                            currentAccount.status ===
                            "sold"
                        ) {
                            const restored =
                                {
                                    ...currentAccount
                                };
                            delete restored.buyerUid;
                            delete restored.buyerEmail;
                            delete restored.soldAt;
                            delete restored.reference;
                            restored.status =
                                "available";
                            return restored;
                        }
                        return;
                    }
                );
                return res.status(400).json({
                    success: false,
                    message:
                        "Insufficient wallet balance. Your account was not charged."
                });
            }
            /* ---------------------------------------------
               CREATE ORDER
            --------------------------------------------- */
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
                    "Social media account purchased from HKDMservices.",
                description:
                    accountData.description ||
                    "Social media account purchased from HKDMservices.",
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
                    Date.now(),
                timestamp:
                    Date.now(),
                email
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
                /* -----------------------------------------
                   REFUND WALLET
                ----------------------------------------- */
                await userRef.transaction(
                    currentUser => {
                        if (
                            !currentUser
                        ) {
                            return;
                        }
                        const balance =
                            Number(
                                currentUser.wallet || 0
                            );
                        const totalSpent =
                            Number(
                                currentUser.totalSpent ||
                                0
                            );
                        return {
                            ...currentUser,
                            wallet:
                                Number(
                                    (
                                        balance +
                                        price
                                    ).toFixed(2)
                                ),
                            totalSpent:
                                Math.max(
                                    0,
                                    totalSpent -
                                    price
                                )
                        };
                    }
                );
                /* -----------------------------------------
                   RELEASE ACCOUNT
                ----------------------------------------- */
                await accountRef.transaction(
                    currentAccount => {
                        if (
                            !currentAccount
                        ) {
                            return;
                        }
                        if (
                            currentAccount.reference ===
                            reference
                        ) {
                            const restored =
                                {
                                    ...currentAccount
                                };
                            delete restored.buyerUid;
                            delete restored.buyerEmail;
                            delete restored.soldAt;
                            delete restored.reference;
                            restored.status =
                                "available";
                            return restored;
                        }
                        return;
                    }
                );
                return res.status(500).json({
                    success: false,
                    message:
                        "Purchase could not be completed. Your wallet was refunded."
                });
            }
            /* ---------------------------------------------
               SAVE TRANSACTION RECORD
            --------------------------------------------- */
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
                    description:
                        `Social Account Purchase - ${accountTitle}`,
                    reference,
                    createdAt:
                        Date.now(),
                    email
                });
            } catch (transactionError) {
                /*
                 * Do not cancel the completed purchase here.
                 *
                 * The order and wallet transaction already
                 * succeeded. We log the transaction error
                 * for investigation.
                 */
                console.error(
                    "SOCIAL TRANSACTION RECORD ERROR:",
                    transactionError
                );
            }
            /* ---------------------------------------------
               SUCCESS
            --------------------------------------------- */
            return res.status(200).json({
                success: true,
                message:
                    "Social account purchased successfully.",
                orderId,
                reference,
                platform,
                accountTitle,
                amount:
                    price
            });
        } catch (error) {
            console.error(
                "BUY ACCOUNT ERROR:",
                error
            );
            if (
                error.message ===
                "AUTHENTICATION_REQUIRED"
            ) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Authentication required. Please log in."
                });
            }
            if (
                error.code ===
                "auth/id-token-expired"
            ) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Your login session has expired. Please log in again."
                });
            }
            if (
                error.code ===
                "auth/argument-error"
            ) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid authentication token. Please log in again."
                });
            }
            return res.status(500).json({
                success: false,
                message:
                    "Unable to complete social account purchase."
            });
        }
    }
);
/* =========================================================
   EXPORT
========================================================= */
export default app;
