import express from "express";
import { admin, db } from "./firebase-admin.js";

const app = express();

app.use(express.json());

/* =========================================================
   HELPERS
========================================================= */

async function verifyUser(req) {
    const authorization =
        req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
        throw new Error("UNAUTHENTICATED");
    }

    const idToken =
        authorization.substring(7);

    return await admin
        .auth()
        .verifyIdToken(idToken);
}

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
        throw new Error("FORBIDDEN");
    }

    return {
        decodedToken,
        uid,
        userData
    };
}

function publicAccount(account, accountId) {
    return {
        id: accountId,
        platform: account.platform || "Social",
        title: account.title || "Social Media Account",
        niche: account.niche || "General",
        followers:
            Number(
                account.followers ||
                account.followerCount ||
                0
            ),
        price:
            Number(account.price || 0),
        accountAge:
            account.accountAge ||
            account.age ||
            "N/A",
        description:
            account.description ||
            "Verified social media account ready for immediate transfer.",
        status:
            account.status || "available",
        createdAt:
            account.createdAt || Date.now()
    };
}

/* =========================================================
   1. ADD ACCOUNT
   ADMIN ONLY
========================================================= */

app.post("/api/add-account", async (req, res) => {
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
            description,
            status,
            createdAt
        } = req.body || {};

        if (!platform || price === undefined) {
            return res.status(400).json({
                success: false,
                message:
                    "Missing required fields (platform or price)."
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
                message: "Invalid account price."
            });
        }

        let finalCredentials =
            credentials;

        if (
            !finalCredentials &&
            (username || password)
        ) {
            finalCredentials =
                `Username: ${username || ""} | Password: ${password || ""}`;
        }

        if (!finalCredentials) {
            return res.status(400).json({
                success: false,
                message:
                    "Missing login credentials."
            });
        }

        const newAccountRef =
            db.ref("accounts").push();

        await newAccountRef.set({
            id: newAccountRef.key,
            platform,
            title:
                title ||
                "Social Media Account",
            niche:
                niche ||
                "General",
            followers:
                Number(followers) || 0,
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
                status || "available",
            createdAt:
                createdAt || Date.now()
        });

        return res.status(200).json({
            success: true,
            accountId:
                newAccountRef.key,
            message:
                "Account successfully added."
        });

    } catch (error) {
        console.error(
            "ADD ACCOUNT ERROR:",
            error
        );

        if (
            error.message ===
            "UNAUTHENTICATED"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required."
            });
        }

        if (
            error.message ===
            "FORBIDDEN"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Admin access required."
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to add account."
        });
    }
});

/* =========================================================
   2. GET AVAILABLE ACCOUNTS
   PUBLIC DATA ONLY
   NEVER RETURNS CREDENTIALS
========================================================= */

app.get("/api/get-accounts", async (req, res) => {
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

        Object.entries(data).forEach(
            ([accountId, account]) => {
                if (!account) {
                    return;
                }

                accounts[accountId] =
                    publicAccount(
                        account,
                        accountId
                    );
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
                "Unable to load accounts."
        });
    }
});

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
                success: true,
                accounts
            });

        } catch (error) {
            console.error(
                "ADMIN GET ACCOUNTS ERROR:",
                error
            );

            if (
                error.message ===
                "UNAUTHENTICATED"
            ) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Authentication required."
                });
            }

            if (
                error.message ===
                "FORBIDDEN"
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Admin access required."
                });
            }

            return res.status(500).json({
                success: false,
                message:
                    "Unable to load inventory."
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
            await verifyAdmin(req);

            const accountId =
                req.params.id;

            if (!accountId) {
                return res.status(400).json({
                    success: false,
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

            if (!snapshot.exists()) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Account not found."
                });
            }

            await accountRef.remove();

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

            if (
                error.message ===
                "UNAUTHENTICATED"
            ) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Authentication required."
                });
            }

            if (
                error.message ===
                "FORBIDDEN"
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Admin access required."
                });
            }

            return res.status(500).json({
                success: false,
                message:
                    "Unable to delete account."
            });
        }
    }
);

/* =========================================================
   5. BUY SOCIAL ACCOUNT
   SECURE SERVER-SIDE PURCHASE
========================================================= */

app.post(
    "/api/buy-account-wallet",
    async (req, res) => {
        let uid = null;
        let accountId = null;
        let purchasePrice = 0;
        let accountClaimed = false;
        let walletDeducted = false;
        let orderId = null;

        try {
            /* ---------------------------------------------
               VERIFY FIREBASE USER
            --------------------------------------------- */

            const decodedToken =
                await verifyUser(req);

            uid =
                decodedToken.uid;

            const buyerEmail =
                decodedToken.email ||
                "N/A";

            accountId =
                req.body?.accountId;

            if (!accountId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Missing account ID."
                });
            }

            /* ---------------------------------------------
               GET ACCOUNT
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

            if (
                !accountData ||
                String(
                    accountData.status ||
                    ""
                ).toLowerCase() !==
                    "available"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This account is no longer available."
                });
            }

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
                return res.status(400).json({
                    success: false,
                    message:
                        "This account has an invalid price."
                });
            }

            /* ---------------------------------------------
               ATOMICALLY CLAIM ACCOUNT
               Prevents two users buying the same account.
            --------------------------------------------- */

            const accountTransaction =
                await accountRef.transaction(
                    currentAccount => {
                        if (
                            currentAccount ===
                            null
                        ) {
                            return;
                        }

                        const currentStatus =
                            String(
                                currentAccount.status ||
                                ""
                            )
                                .trim()
                                .toLowerCase();

                        if (
                            currentStatus !==
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
                            soldAt:
                                Date.now()
                        };
                    }
                );

            if (
                !accountTransaction ||
                !accountTransaction.committed
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This account has just been purchased by another customer."
                });
            }

            accountClaimed = true;

            const claimedAccount =
                accountTransaction
                    .snapshot
                    .val();

            purchasePrice =
                Number(
                    claimedAccount.price
                );

            /* ---------------------------------------------
               GET BUYER
            --------------------------------------------- */

            const userRef =
                db.ref(
                    `users/${uid}`
                );

            const userSnapshot =
                await userRef.once(
                    "value"
                );

            if (!userSnapshot.exists()) {
                throw new Error(
                    "USER_NOT_FOUND"
                );
            }

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
                throw new Error(
                    "INSUFFICIENT_BALANCE"
                );
            }

            /* ---------------------------------------------
               ATOMIC WALLET DEDUCTION
            --------------------------------------------- */

            const walletTransaction =
                await userRef.transaction(
                    currentUserData => {
                        if (
                            currentUserData ===
                            null
                        ) {
                            return;
                        }

                        const updatedUser =
                            {
                                ...currentUserData
                            };

                        const balance =
                            Number(
                                updatedUser.wallet ||
                                0
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

                        updatedUser.wallet =
                            Number(
                                (
                                    balance -
                                    purchasePrice
                                ).toFixed(2)
                            );

                        updatedUser.totalSpent =
                            Number(
                                (
                                    Number(
                                        updatedUser.totalSpent ||
                                        0
                                    ) +
                                    purchasePrice
                                ).toFixed(2)
                            );

                        return updatedUser;
                    }
                );

            if (
                !walletTransaction ||
                !walletTransaction.committed
            ) {
                throw new Error(
                    "INSUFFICIENT_BALANCE"
                );
            }

            walletDeducted = true;

            /* ---------------------------------------------
               CREATE ORDER
               Same core structure as normal orders.
            --------------------------------------------- */

            const orderRef =
                db
                    .ref("orders")
                    .push();

            orderId =
                orderRef.key;

            if (!orderId) {
                throw new Error(
                    "ORDER_ID_FAILED"
                );
            }

            const platform =
                claimedAccount.platform ||
                "Social";

            const baseTitle =
                claimedAccount.title ||
                "Social Media Account";

            const platformText =
                String(platform);

            const titleText =
                String(baseTitle);

            const orderTitle =
                titleText
                    .toLowerCase()
                    .includes(
                        platformText.toLowerCase()
                    )
                    ? titleText
                    : `${platformText} - ${titleText}`;

            const now =
                Date.now();

            const orderData = {
                orderId,
                uid,
                catalogue:
                    "Social Accounts",
                platform,
                serviceId:
                    accountId,
                service:
                    orderTitle,
                link:
                    "",
                quantity:
                    1,
                amount:
                    purchasePrice,
                status:
                    "completed",
                paymentMethod:
                    "wallet",
                createdAt:
                    now,
                email:
                    buyerEmail,

                accountId:
                    accountId,

                accountTitle:
                    orderTitle,

                accountDescription:
                    claimedAccount.description ||
                    "",

                followers:
                    Number(
                        claimedAccount.followers ||
                        claimedAccount.followerCount ||
                        0
                    ),

                accountAge:
                    claimedAccount.accountAge ||
                    claimedAccount.age ||
                    "N/A",

                credentials:
                    String(
                        claimedAccount.credentials ||
                        (
                            "Username: " +
                            (
                                claimedAccount.username ||
                                "N/A"
                            ) +
                            " | Password: " +
                            (
                                claimedAccount.password ||
                                "N/A"
                            )
                        )
                    )
            };

            await orderRef.set(
                orderData
            );

            /* ---------------------------------------------
               CREATE TRANSACTION
            --------------------------------------------- */

            try {
                const transactionRef =
                    db
                        .ref(
                            "transactions"
                        )
                        .push();

                await transactionRef.set({
                    uid,
                    orderId,
                    type:
                        "order",
                    amount:
                        purchasePrice,
                    status:
                        "success",
                    description:
                        `Social Account Purchase - ${platform} - ${orderTitle}`,
                    createdAt:
                        now
                });

            } catch (transactionError) {
                console.error(
                    "SOCIAL ACCOUNT TRANSACTION ERROR:",
                    transactionError
                );

                await orderRef.remove();

                throw new Error(
                    "TRANSACTION_FAILED"
                );
            }

            /* ---------------------------------------------
               SUCCESS
            --------------------------------------------- */

            return res.status(200).json({
                success: true,
                orderId,
                reference:
                    orderId,
                platform,
                message:
                    "Purchase successful."
            });

        } catch (error) {
            console.error(
                "SOCIAL ACCOUNT CHECKOUT ERROR:",
                error
            );

            /* ---------------------------------------------
               REFUND WALLET IF DEDUCTED
            --------------------------------------------- */

            if (
                walletDeducted &&
                uid &&
                purchasePrice > 0
            ) {
                try {
                    const userRef =
                        db.ref(
                            `users/${uid}`
                        );

                    await userRef.transaction(
                        currentUserData => {
                            if (
                                currentUserData ===
                                null
                            ) {
                                return null;
                            }

                            const refundUser =
                                {
                                    ...currentUserData
                                };

                            const balance =
                                Number(
                                    refundUser.wallet ||
                                    0
                                );

                            refundUser.wallet =
                                Number(
                                    (
                                        balance +
                                        purchasePrice
                                    ).toFixed(2)
                                );

                            refundUser.totalSpent =
                                Number(
                                    Math.max(
                                        0,
                                        Number(
                                            refundUser.totalSpent ||
                                            0
                                        ) -
                                            purchasePrice
                                    ).toFixed(2)
                                );

                            return refundUser;
                        }
                    );

                } catch (refundError) {
                    console.error(
                        "SOCIAL ACCOUNT REFUND ERROR:",
                        refundError
                    );
                }
            }

            /* ---------------------------------------------
               RETURN ACCOUNT TO AVAILABLE
            --------------------------------------------- */

            if (
                accountClaimed &&
                accountId
            ) {
                try {
                    const accountRef =
                        db.ref(
                            `accounts/${accountId}`
                        );

                    await accountRef.transaction(
                        currentAccount => {
                            if (
                                !currentAccount
                            ) {
                                return null;
                            }

                            if (
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
                                delete restored.soldAt;

                                return {
                                    ...restored,
                                    status:
                                        "available"
                                };
                            }

                            return currentAccount;
                        }
                    );

                } catch (rollbackError) {
                    console.error(
                        "ACCOUNT ROLLBACK ERROR:",
                        rollbackError
                    );
                }
            }

            if (
                orderId
            ) {
                try {
                    await db
                        .ref(
                            `orders/${orderId}`
                        )
                        .remove();
                } catch {}
            }

            if (
                error.message ===
                "UNAUTHENTICATED"
            ) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Please log in again."
                });
            }

            if (
                error.message ===
                "USER_NOT_FOUND"
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "User account was not found."
                });
            }

            if (
                error.message ===
                "INSUFFICIENT_BALANCE"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Insufficient wallet balance."
                });
            }

            if (
                error.message ===
                "INVALID_WALLET"
            ) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Your wallet balance is invalid."
                });
            }

            if (
                error.message ===
                "TRANSACTION_FAILED"
            ) {
                return res.status(500).json({
                    success: false,
                    message:
                        "The purchase could not be completed. Your wallet was refunded."
                });
            }

            return res.status(500).json({
                success: false,
                message:
                    "Unable to complete the purchase. Please try again."
            });
        }
    }
);

/* =========================================================
   6. GET MY SOCIAL ACCOUNT ORDERS
   ONLY RETURNS THE LOGGED-IN USER'S PURCHASES
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
                    .once("value");

            const data =
                snapshot.val() || {};

            const orders =
                Object.entries(data)
                    .map(
                        ([firebaseKey, order]) => ({
                            firebaseKey,
                            ...order
                        })
                    )
                    .filter(
                        order =>
                            String(
                                order.uid || ""
                            ) ===
                                String(uid) &&
                            String(
                                order.catalogue ||
                                ""
                            )
                                .trim()
                                .toLowerCase() ===
                                "social accounts"
                    )
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
                "UNAUTHENTICATED"
            ) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Please log in again."
                });
            }

            return res.status(500).json({
                success: false,
                message:
                    "Unable to load purchase history."
            });
        }
    }
);

export default app;
