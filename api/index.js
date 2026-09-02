import express from "express";
import { admin, db } from "./firebase-admin.js";

const app = express();

app.use(express.json());


/* =====================================================
   AUTHENTICATION HELPER
===================================================== */

async function getAuthenticatedUser(req) {

    const authorization =
        req.headers.authorization || "";

    if (
        !authorization.startsWith("Bearer ")
    ) {
        throw new Error(
            "AUTHENTICATION_REQUIRED"
        );
    }

    const idToken =
        authorization.substring(
            7
        ).trim();

    if (!idToken) {
        throw new Error(
            "AUTHENTICATION_REQUIRED"
        );
    }

    return await admin
        .auth()
        .verifyIdToken(idToken);
}


/* =====================================================
   ADMIN AUTHENTICATION
===================================================== */

async function requireAdmin(req) {

    const decodedUser =
        await getAuthenticatedUser(req);

    const userSnapshot =
        await db
            .ref(
                `users/${decodedUser.uid}`
            )
            .once("value");

    const userData =
        userSnapshot.val() || {};

    const isAdmin =
        userData.role === "admin" ||
        userData.isAdmin === true;

    if (!isAdmin) {

        throw new Error(
            "ADMIN_REQUIRED"
        );

    }

    return {
        decodedUser,
        userData
    };

}


/* =====================================================
   1. ADD SOCIAL ACCOUNT
   ADMIN ONLY
===================================================== */

app.post(
    "/api/add-account",
    async (req, res) => {

        try {

            await requireAdmin(req);

            const {
                platform,
                niche,
                followers,
                price,
                accountAge,
                credentials,
                username,
                password,
                description,
                title
            } = req.body;


            if (
                !platform ||
                price === undefined ||
                price === null ||
                Number(price) <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Missing required fields: platform and valid price."
                });

            }


            let finalCredentials =
                credentials;


            if (
                !finalCredentials &&
                (
                    username ||
                    password
                )
            ) {

                finalCredentials =
                    `Username: ${username || ""} | Password: ${password || ""}`;

            }


            if (!finalCredentials) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Missing account credentials."
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

                title:
                    title ||
                    `${platform} Social Account`,

                niche:
                    niche ||
                    "General",

                followers:
                    Number(followers) || 0,

                price:
                    Number(price),

                accountAge:
                    accountAge ||
                    "N/A",

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

                success:
                    true,

                message:
                    "Account listed successfully.",

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

                return res.status(401).json({
                    success: false,
                    message:
                        "Authentication required."
                });

            }


            if (
                error.message ===
                "ADMIN_REQUIRED"
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Administrator access required."
                });

            }


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to add account.",

                error:
                    error.message

            });

        }

    }
);


/* =====================================================
   2. GET PUBLIC MARKETPLACE ACCOUNTS
=====================================================

   IMPORTANT:

   Credentials are NEVER returned here.

   Accounts with missing status are treated as
   available for compatibility with older records.
===================================================== */

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


            const accounts = {};


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
                            !Number.isFinite(
                                price
                            ) ||
                            price <= 0
                        ) {
                            return;
                        }


                        /*
                         * PUBLIC DATA ONLY.
                         *
                         * credentials,
                         * username,
                         * password,
                         * buyerUid
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
                                `${account.platform || "Social"} Account`,

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

                            price:
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

                accounts

            });


        } catch (error) {

            console.error(
                "GET ACCOUNTS ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to load marketplace accounts."

            });

        }

    }
);


/* =====================================================
   3. GET ALL ACCOUNTS
   ADMIN ONLY
===================================================== */

app.get(
    "/api/admin/get-accounts",
    async (req, res) => {

        try {

            await requireAdmin(req);


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

                return res.status(401).json({
                    success: false,
                    message:
                        "Authentication required."
                });

            }


            if (
                error.message ===
                "ADMIN_REQUIRED"
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Administrator access required."
                });

            }


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to load accounts."

            });

        }

    }
);


/* =====================================================
   4. DELETE ACCOUNT
   ADMIN ONLY
===================================================== */

app.delete(
    "/api/admin/delete-account/:id",
    async (req, res) => {

        try {

            await requireAdmin(req);


            const accountId =
                req.params.id;


            if (!accountId) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Missing account ID."

                });

            }


            const accountRef =
                db.ref(
                    `accounts/${accountId}`
                );


            const snapshot =
                await accountRef.once(
                    "value"
                );


            if (
                !snapshot.exists()
            ) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "Account not found."

                });

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

                return res.status(401).json({
                    success: false,
                    message:
                        "Authentication required."
                });

            }


            if (
                error.message ===
                "ADMIN_REQUIRED"
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Administrator access required."
                });

            }


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to delete account."

            });

        }

    }
);


/* =====================================================
   5. BUY SOCIAL ACCOUNT WITH WALLET
=====================================================

   Browser sends ONLY:

       accountId

   Authentication comes from:

       Authorization: Bearer FIREBASE_ID_TOKEN

   Server determines:

       user
       wallet balance
       account price
       credentials
       order information

===================================================== */

app.post(
    "/api/buy-account-wallet",
    async (req, res) => {

        let reservedAccountId =
            null;

        let buyerUid =
            null;

        let chargedAmount =
            0;

        try {

            const decodedUser =
                await getAuthenticatedUser(req);


            buyerUid =
                decodedUser.uid;


            const {
                accountId
            } = req.body;


            if (!accountId) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Missing account ID."

                });

            }


            const accountRef =
                db.ref(
                    `accounts/${accountId}`
                );


            /*
             * Reserve the account atomically.
             *
             * This prevents two customers from
             * purchasing the same account at once.
             */

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


                        const price =
                            Number(
                                currentAccount.price
                            );


                        if (
                            !Number.isFinite(
                                price
                            ) ||
                            price <= 0
                        ) {

                            return;

                        }


                        return {

                            ...currentAccount,

                            status:
                                "processing",

                            processingBy:
                                buyerUid,

                            processingAt:
                                Date.now()

                        };

                    }
                );


            if (
                !accountTransaction.committed
            ) {

                return res.status(409).json({

                    success:
                        false,

                    message:
                        "This account is no longer available."

                });

            }


            const accountData =
                accountTransaction
                    .snapshot
                    .val();


            reservedAccountId =
                accountId;


            chargedAmount =
                Number(
                    accountData.price
                );


            if (
                !Number.isFinite(
                    chargedAmount
                ) ||
                chargedAmount <= 0
            ) {

                throw new Error(
                    "INVALID_ACCOUNT_PRICE"
                );

            }


            /* =================================================
               WALLET TRANSACTION
            ================================================= */

            const userRef =
                db.ref(
                    `users/${buyerUid}`
                );


            const walletTransaction =
                await userRef.transaction(
                    currentUserData => {

                        if (
                            !currentUserData
                        ) {

                            return;

                        }


                        const currentBalance =
                            Number(
                                currentUserData.wallet ||
                                currentUserData.balance ||
                                0
                            );


                        if (
                            !Number.isFinite(
                                currentBalance
                            )
                        ) {

                            return;

                        }


                        if (
                            currentBalance <
                            chargedAmount
                        ) {

                            return;

                        }


                        const updatedUser = {

                            ...currentUserData,

                            wallet:
                                Number(
                                    (
                                        currentBalance -
                                        chargedAmount
                                    ).toFixed(2)
                                )

                        };


                        updatedUser.totalSpent =
                            Number(
                                (
                                    Number(
                                        currentUserData.totalSpent ||
                                        0
                                    ) +
                                    chargedAmount
                                ).toFixed(2)
                            );


                        return updatedUser;

                    }
                );


            if (
                !walletTransaction.committed
            ) {

                /*
                 * Release the account reservation.
                 */

                await accountRef.update({

                    status:
                        "available",

                    processingBy:
                        null,

                    processingAt:
                        null

                });


                reservedAccountId =
                    null;


                return res.status(400).json({

                    success:
                        false,

                    message:
                        `Insufficient wallet balance. You need ₦${chargedAmount.toLocaleString()} to purchase this account.`

                });

            }


            /* =================================================
               CREATE ORDER
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
                `${platform} Social Account`;


            const displayTitle =
                String(
                    baseTitle
                )
                    .toLowerCase()
                    .includes(
                        String(platform)
                            .toLowerCase()
                    )
                        ? baseTitle
                        : `${platform} - ${baseTitle}`;


            const orderData = {

                orderId,

                orderType:
                    "social_account",

                uid:
                    buyerUid,

                accountId,

                accountTitle:
                    displayTitle,

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
                    "Verified social media account.",

                amount:
                    chargedAmount,

                price:
                    chargedAmount,

                status:
                    "completed",

                paymentMethod:
                    "wallet",

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
                    ),

                createdAt:
                    Date.now(),

                email:
                    decodedUser.email ||
                    accountData.email ||
                    "N/A"

            };


            await orderRef.set(
                orderData
            );


            /* =================================================
               MARK ACCOUNT AS SOLD
            ================================================= */

            await accountRef.update({

                status:
                    "sold",

                buyerUid:
                    buyerUid,

                soldAt:
                    Date.now(),

                orderId:
                    orderId,

                reference:
                    `WLK-${Date.now()}-${Math.floor(Math.random() * 10000)}`,

                processingBy:
                    null,

                processingAt:
                    null

            });


            reservedAccountId =
                null;


            /* =================================================
               SUCCESS
            ================================================= */

            return res.status(200).json({

                success:
                    true,

                message:
                    "Account purchased successfully.",

                orderId,

                reference:
                    orderData.reference ||
                    `WLK-${Date.now()}`,

                platform,

                amount:
                    chargedAmount

            });


        } catch (error) {

            console.error(
                "BUY ACCOUNT ERROR:",
                error
            );


            /*
             * If something failed after the account was
             * reserved but before it was sold, release it.
             */

            if (
                reservedAccountId
            ) {

                try {

                    await db
                        .ref(
                            `accounts/${reservedAccountId}`
                        )
                        .update({

                            status:
                                "available",

                            processingBy:
                                null,

                            processingAt:
                                null

                        });

                } catch (
                    releaseError
                ) {

                    console.error(
                        "ACCOUNT RELEASE ERROR:",
                        releaseError
                    );

                }

            }


            if (
                error.message ===
                "AUTHENTICATION_REQUIRED"
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "Authentication required. Please log in again."

                });

            }


            if (
                error.message ===
                "INVALID_ACCOUNT_PRICE"
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "This account has an invalid price."

                });

            }


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to complete the purchase. Your wallet was not charged by this request."

            });

        }

    }
);


/* =====================================================
   6. MY SOCIAL ACCOUNT PURCHASE HISTORY
===================================================== */

app.get(
    "/api/my-social-orders",
    async (req, res) => {

        try {

            const decodedUser =
                await getAuthenticatedUser(req);


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


            const orders = [];


            Object.entries(data)
                .forEach(
                    ([key, order]) => {

                        if (!order) {
                            return;
                        }


                        /*
                         * Only social-account purchases
                         * belong on shop.html.
                         */

                        const isSocialOrder =
                            order.orderType ===
                                "social_account"
                            ||
                            !!order.accountId;


                        if (
                            !isSocialOrder
                        ) {

                            return;

                        }


                        orders.push({

                            ...order,

                            id:
                                order.id ||
                                key,

                            orderId:
                                order.orderId ||
                                key

                        });

                    }
                );


            orders.sort(
                (
                    a,
                    b
                ) =>
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

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "Authentication required. Please log in again."

                });

            }


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to load your purchase history."

            });

        }

    }
);


/* =====================================================
   7. HEALTH CHECK
===================================================== */

app.get(
    "/api/health",
    async (req, res) => {

        return res.status(200).json({

            success:
                true,

            message:
                "HKDMservices API is running."

        });

    }
);


/* =====================================================
   EXPORT
===================================================== */

export default app;
