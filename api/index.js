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
   FIREBASE AUTHENTICATION
========================================================= */

async function authenticateUser(req) {

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
   ADMIN AUTHENTICATION
========================================================= */

async function authenticateAdmin(req) {

    const decodedToken =
        await authenticateUser(req);

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
   1. ADD ACCOUNT
   ADMIN ONLY
========================================================= */

app.post(
    "/api/add-account",
    async (req, res) => {

        try {

            await authenticateAdmin(req);

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
                    "Please provide a valid account price."
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


            const accountRef =
                db
                    .ref("accounts")
                    .push();


            const accountData = {

                id:
                    accountRef.key,

                platform:
                    String(platform).trim(),

                title:
                    String(
                        title ||
                        `${platform} Social Account`
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

                description:
                    description ||
                    "Verified social media account ready for immediate transfer.",

                /*
                 * IMPORTANT:
                 * Credentials stay in Firebase backend data.
                 * They are NEVER returned by /api/get-accounts.
                 */
                credentials:
                    String(finalCredentials),

                status:
                    "available",

                createdAt:
                    Date.now(),

                createdBy:
                    req.auth?.uid || null

            };


            await accountRef.set(
                accountData
            );


            return res.status(200).json({

                success:
                    true,

                message:
                    "Account successfully listed on the marketplace.",

                accountId:
                    accountRef.key

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


/* =========================================================
   2. GET AVAILABLE ACCOUNTS
   PUBLIC LISTING
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


            const rawAccounts =
                snapshot.val() || {};


            const accounts = {};


            Object.entries(
                rawAccounts
            ).forEach(
                ([id, account]) => {

                    if (!account) {
                        return;
                    }


                    /*
                     * SECURITY:
                     * Never send credentials to the browser.
                     */
                    accounts[id] = {

                        id,

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
                            0,

                        accountAge:
                            account.accountAge ||
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


/* =========================================================
   3. GET ALL ACCOUNTS
   ADMIN ONLY
========================================================= */

app.get(
    "/api/admin/get-accounts",
    async (req, res) => {

        try {

            await authenticateAdmin(req);


            const snapshot =
                await db
                    .ref("accounts")
                    .once("value");


            const accounts =
                snapshot.val() || {};


            /*
             * Admin is allowed to see credentials.
             * This endpoint must NEVER be exposed to regular users.
             */

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


/* =========================================================
   4. DELETE ACCOUNT
   ADMIN ONLY
========================================================= */

app.delete(
    "/api/admin/delete-account/:id",
    async (req, res) => {

        try {

            await authenticateAdmin(req);


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


/* =========================================================
   5. BUY SOCIAL ACCOUNT FROM WALLET
========================================================= */

app.post(
    "/api/buy-account-wallet",
    async (req, res) => {

        try {

            const decodedToken =
                await authenticateUser(req);


            const uid =
                decodedToken.uid;


            const {
                accountId
            } = req.body || {};


            if (!accountId) {

                return sendError(
                    res,
                    400,
                    "Missing account ID."
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
                    "This account no longer exists."
                );

            }


            const accountStatus =
                String(
                    accountData.status ||
                    ""
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
                    "This account is no longer available."
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
                    500,
                    "This account has an invalid price."
                );

            }


            /*
             * ATOMIC ACCOUNT PURCHASE
             *
             * We lock the account by changing its status
             * through a Firebase transaction.
             *
             * This prevents two customers from successfully
             * purchasing the same account at the same time.
             */

            const claimResult =
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
                !claimResult.committed
            ) {

                return sendError(
                    res,
                    409,
                    "This account is currently unavailable. Please choose another account."
                );

            }


            /*
             * Read user after claiming account.
             */

            const userSnapshot =
                await userRef.once(
                    "value"
                );


            const userData =
                userSnapshot.val();


            if (!userData) {

                await accountRef.update({

                    status:
                        "available",

                    processingBy:
                        null,

                    processingAt:
                        null

                });


                return sendError(
                    res,
                    404,
                    "User account not found."
                );

            }


            const currentBalance =
                Number(
                    userData.wallet || 0
                );


            if (
                !Number.isFinite(
                    currentBalance
                ) ||
                currentBalance < price
            ) {

                /*
                 * Release account because
                 * purchase cannot continue.
                 */

                await accountRef.update({

                    status:
                        "available",

                    processingBy:
                        null,

                    processingAt:
                        null

                });


                return sendError(
                    res,
                    400,
                    `Insufficient wallet balance. You need ₦${price.toLocaleString("en-NG")} but have ₦${currentBalance.toLocaleString("en-NG")}.`
                );

            }


            const newBalance =
                Number(
                    (
                        currentBalance -
                        price
                    ).toFixed(2)
                );


            const oldTotalSpent =
                Number(
                    userData.totalSpent || 0
                );


            const newTotalSpent =
                Number(
                    (
                        oldTotalSpent +
                        price
                    ).toFixed(2)
                );


            const orderRef =
                db
                    .ref("socialAccountOrders")
                    .push();


            const orderId =
                orderRef.key;


            const platform =
                accountData.platform ||
                "Social";


            const baseTitle =
                accountData.title ||
                "Social Media Account";


            const displayTitle =
                String(
                    baseTitle
                )
                    .toLowerCase()
                    .includes(
                        String(
                            platform
                        ).toLowerCase()
                    )
                        ? baseTitle
                        : `${platform} - ${baseTitle}`;


            const now =
                Date.now();


            const reference =
                `SOC-${now}-${Math.floor(
                    Math.random() * 100000
                )}`;


            /*
             * Save everything together.
             *
             * Credentials are copied into the customer's
             * private order record only.
             */

            const updates = {};


            updates[
                `users/${uid}/wallet`
            ] =
                newBalance;


            updates[
                `users/${uid}/totalSpent`
            ] =
                newTotalSpent;


            updates[
                `accounts/${accountId}`
            ] = {

                ...accountData,

                status:
                    "sold",

                buyerUid:
                    uid,

                buyerEmail:
                    decodedToken.email ||
                    userData.email ||
                    null,

                soldAt:
                    now,

                reference,

                processingBy:
                    null,

                processingAt:
                    null

            };


            updates[
                `socialAccountOrders/${orderId}`
            ] = {

                orderId,

                uid,

                accountId,

                accountTitle:
                    displayTitle,

                title:
                    displayTitle,

                platform,

                niche:
                    accountData.niche ||
                    "General",

                followers:
                    accountData.followers ||
                    0,

                accountAge:
                    accountData.accountAge ||
                    "N/A",

                accountDescription:
                    accountData.description ||
                    "",

                amount:
                    price,

                price,

                status:
                    "completed",

                paymentMethod:
                    "wallet",

                reference,

                createdAt:
                    now,

                email:
                    decodedToken.email ||
                    userData.email ||
                    "N/A",

                /*
                 * IMPORTANT:
                 * Credentials are only stored in the user's
                 * private order record.
                 */
                credentials:
                    accountData.credentials ||
                    (
                        "Username: " +
                        (
                            accountData.username ||
                            "N/A"
                        ) +
                        " | Password: " +
                        (
                            accountData.password ||
                            "N/A"
                        )
                    )

            };


            /*
             * Also create a transaction record so the
             * purchase appears in transaction history.
             */

            const transactionRef =
                db
                    .ref("transactions")
                    .push();


            const transactionId =
                transactionRef.key;


            updates[
                `transactions/${transactionId}`
            ] = {

                uid,

                orderId,

                accountId,

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
                    `Social Account Purchase - ${displayTitle}`,

                createdAt:
                    now

            };


            try {

                await db.ref().update(
                    updates
                );

            } catch (writeError) {

                console.error(
                    "PURCHASE WRITE ERROR:",
                    writeError
                );


                /*
                 * Return the account to available
                 * if the multi-location write failed.
                 */

                try {

                    await accountRef.update({

                        status:
                            "available",

                        processingBy:
                            null,

                        processingAt:
                            null

                    });

                } catch (
                    rollbackError
                ) {

                    console.error(
                        "ACCOUNT ROLLBACK ERROR:",
                        rollbackError
                    );

                }


                return sendError(
                    res,
                    500,
                    "Purchase could not be completed. Your wallet was not charged."
                );

            }


            return res.status(200).json({

                success:
                    true,

                message:
                    "Purchase successful.",

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
                "Unable to process your purchase."
            );

        }

    }
);


/* =========================================================
   6. MY SOCIAL ACCOUNT PURCHASE HISTORY
========================================================= */

app.get(
    "/api/my-social-orders",
    async (req, res) => {

        try {

            const decodedToken =
                await authenticateUser(req);


            const uid =
                decodedToken.uid;


            const snapshot =
                await db
                    .ref("socialAccountOrders")
                    .orderByChild("uid")
                    .equalTo(uid)
                    .once("value");


            const data =
                snapshot.val() || {};


            const orders =
                Object.values(data)
                    .sort(
                        (a, b) =>
                            Number(
                                b.createdAt || 0
                            ) -
                            Number(
                                a.createdAt || 0
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


/* =========================================================
   7. HEALTH CHECK
========================================================= */

app.get(
    "/api/health",
    (req, res) => {

        return res.status(200).json({

            success:
                true,

            message:
                "HKDMservices API is running."

        });

    }
);


/* =========================================================
   EXPORT
========================================================= */

export default app;
