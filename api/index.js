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
   VERIFY FIREBASE ID TOKEN
========================================================= */

async function verifyAuth(req, res, next) {

  try {

    const authorization =
      req.headers.authorization || "";

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return sendError(
        res,
        401,
        "Authentication required. Please log in again."
      );
    }

    const idToken =
      authorization.substring(7).trim();

    if (!idToken) {
      return sendError(
        res,
        401,
        "Authentication token is missing."
      );
    }

    const decodedToken =
      await admin.auth().verifyIdToken(
        idToken
      );

    req.user = decodedToken;

    next();

  } catch (error) {

    console.error(
      "AUTH TOKEN VERIFICATION ERROR:",
      error
    );

    return sendError(
      res,
      401,
      "Your session has expired or is invalid. Please log in again."
    );

  }

}


/* =========================================================
   1. ADD ACCOUNT
   =========================================================

   This endpoint can be used by your admin-side system.

   Credentials are stored privately in Firebase.
========================================================= */

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
        description,
        status,
        createdAt
      } = req.body;


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
          "A valid account price is required."
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
          "Account credentials are required."
        );

      }


      const newAccountRef =
        db.ref("accounts").push();


      const accountData = {

        id:
          newAccountRef.key,

        platform:
          String(platform),

        title:
          title
            ? String(title)
            : "Social Media Account",

        niche:
          niche
            ? String(niche)
            : "General",

        followers:
          Number(followers) || 0,

        price:
          numericPrice,

        accountAge:
          accountAge
            ? String(accountAge)
            : "N/A",

        description:
          description
            ? String(description)
            : "Verified social media account ready for immediate transfer.",

        credentials:
          String(finalCredentials),

        status:
          status
            ? String(status).toLowerCase()
            : "available",

        createdAt:
          createdAt || Date.now()

      };


      await newAccountRef.set(
        accountData
      );


      return res.status(200).json({

        success: true,

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

      return sendError(
        res,
        500,
        "Unable to add account."
      );

    }

  }
);


/* =========================================================
   2. PUBLIC MARKETPLACE ACCOUNTS
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
                account.price || 0
              );


            if (
              !Number.isFinite(price) ||
              price <= 0
            ) {
              return;
            }


            /*
             * IMPORTANT:
             *
             * credentials are deliberately
             * NOT included here.
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
                0,

              accountAge:
                account.accountAge ||
                account.age ||
                "N/A",

              price,

              description:
                account.description ||
                "Verified social media account ready for immediate transfer."

            };

          }
        );


      return res.status(200).json({

        success: true,

        accounts

      });

    } catch (error) {

      console.error(
        "GET MARKETPLACE ACCOUNTS ERROR:",
        error
      );

      return sendError(
        res,
        500,
        "Unable to load marketplace listings."
      );

    }

  }
);


/* =========================================================
   3. ADMIN - GET ALL ACCOUNTS
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

      return sendError(
        res,
        500,
        "Unable to load account inventory."
      );

    }

  }
);


/* =========================================================
   4. ADMIN - DELETE ACCOUNT
========================================================= */

app.delete(
  "/api/admin/delete-account/:id",
  async (req, res) => {

    try {

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

        success: true,

        message:
          "Account deleted successfully."

      });

    } catch (error) {

      console.error(
        "DELETE ACCOUNT ERROR:",
        error
      );

      return sendError(
        res,
        500,
        "Unable to delete account."
      );

    }

  }
);


/* =========================================================
   5. GET MY SOCIAL ACCOUNT ORDERS
========================================================= */

app.get(
  "/api/my-social-orders",
  verifyAuth,
  async (req, res) => {

    try {

      const uid =
        req.user.uid;


      const snapshot =
        await db
          .ref("orders")
          .orderByChild("uid")
          .equalTo(uid)
          .once("value");


      const data =
        snapshot.val() || {};


      const orders =
        Object.values(data);


      orders.sort(
        (a, b) => {

          const dateA =
            Number(
              a.createdAt ||
              a.timestamp ||
              0
            );

          const dateB =
            Number(
              b.createdAt ||
              b.timestamp ||
              0
            );

          return dateB - dateA;

        }
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

      return sendError(
        res,
        500,
        "Unable to load your purchase history."
      );

    }

  }
);


/* =========================================================
   6. BUY SOCIAL ACCOUNT USING WALLET
========================================================= */

app.post(
  "/api/buy-account-wallet",
  verifyAuth,
  async (req, res) => {

    try {

      const uid =
        req.user.uid;


      const {
        accountId
      } = req.body;


      if (!accountId) {

        return sendError(
          res,
          400,
          "Account ID is required."
        );

      }


      /* ===================================================
         LOAD ACCOUNT
      =================================================== */

      const accountRef =
        db.ref(
          `accounts/${accountId}`
        );


      const accountSnapshot =
        await accountRef.once(
          "value"
        );


      if (!accountSnapshot.exists()) {

        return sendError(
          res,
          404,
          "This account no longer exists."
        );

      }


      const account =
        accountSnapshot.val();


      const accountStatus =
        String(
          account.status ||
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
          400,
          "This account is no longer available."
        );

      }


      const price =
        Number(
          account.price
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


      /* ===================================================
         LOAD USER
      =================================================== */

      const userRef =
        db.ref(
          `users/${uid}`
        );


      const userSnapshot =
        await userRef.once(
          "value"
        );


      if (!userSnapshot.exists()) {

        return sendError(
          res,
          404,
          "Your user profile could not be found."
        );

      }


      const userData =
        userSnapshot.val() || {};


      const currentBalance =
        Number(
          userData.wallet !== undefined
            ? userData.wallet
            : (
                userData.balance ||
                0
              )
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


      /* ===================================================
         CHECK BALANCE
      =================================================== */

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


      /* ===================================================
         CREATE ORDER ID
      =================================================== */

      const orderRef =
        db
          .ref("orders")
          .push();


      const orderId =
        orderRef.key;


      const platform =
        account.platform ||
        "Social";


      const baseTitle =
        account.title ||
        "Social Media Account";


      const displayTitle =
        String(baseTitle)
          .toLowerCase()
          .includes(
            String(platform)
              .toLowerCase()
          )
            ? String(baseTitle)
            : `${platform} - ${baseTitle}`;


      const newBalance =
        Number(
          (
            currentBalance -
            price
          ).toFixed(2)
        );


      const previousTotalSpent =
        Number(
          userData.totalSpent ||
          0
        );


      const newTotalSpent =
        Number(
          (
            previousTotalSpent +
            price
          ).toFixed(2)
        );


      const createdAt =
        Date.now();


      const reference =
        `SOC-${createdAt}-${Math.floor(
          Math.random() * 10000
        )}`;


      /* ===================================================
         ORDER DATA

         Credentials are stored ONLY in the
         authenticated user's order.
      =================================================== */

      const orderData = {

        orderId,

        id:
          orderId,

        uid,

        accountId,

        accountTitle:
          displayTitle,

        title:
          displayTitle,

        platform,

        followers:
          account.followers ||
          account.followerCount ||
          "N/A",

        accountAge:
          account.accountAge ||
          account.age ||
          "N/A",

        accountDescription:
          account.description ||
          "No description provided.",

        description:
          account.description ||
          "No description provided.",

        amount:
          price,

        price,

        status:
          "completed",

        paymentMethod:
          "wallet",

        reference,

        createdAt,

        timestamp:
          createdAt,

        email:
          userData.email ||
          req.user.email ||
          "N/A",

        /*
         * Credentials are copied into the
         * order so the buyer can retrieve
         * them from Purchase History.
         */

        credentials:
          account.credentials ||
          (
            `Username: ${
              account.username ||
              "N/A"
            } | Password: ${
              account.password ||
              "N/A"
            }`
          )

      };


      /* ===================================================
         WRITE PURCHASE

         Multi-location update keeps the wallet,
         account and order synchronized in one
         Firebase update operation.
      =================================================== */

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
        `accounts/${accountId}/status`
      ] =
        "sold";


      updates[
        `accounts/${accountId}/buyerUid`
      ] =
        uid;


      updates[
        `accounts/${accountId}/soldAt`
      ] =
        createdAt;


      updates[
        `accounts/${accountId}/soldTo`
      ] =
        userData.email ||
        req.user.email ||
        "N/A";


      updates[
        `accounts/${accountId}/reference`
      ] =
        reference;


      updates[
        `orders/${orderId}`
      ] =
        orderData;


      await db
        .ref()
        .update(
          updates
        );


      /* ===================================================
         SUCCESS
      =================================================== */

      return res.status(200).json({

        success: true,

        message:
          "Purchase completed successfully.",

        orderId,

        reference,

        platform,

        amount:
          price,

        newWalletBalance:
          newBalance

      });

    } catch (error) {

      console.error(
        "BUY ACCOUNT WALLET ERROR:",
        error
      );

      return sendError(
        res,
        500,
        "Unable to complete your purchase. Your wallet was not intentionally charged by this request."
      );

    }

  }
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/api/health",
  (req, res) => {

    return res.status(200).json({

      success: true,

      message:
        "HKDMservices API is running.",

      timestamp:
        Date.now()

    });

  }
);


/* =========================================================
   EXPORT
========================================================= */

export default app;
