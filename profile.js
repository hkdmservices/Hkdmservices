import {
    auth,
    database
} from "./firebase.js";

import {
    onAuthStateChanged,
    signOut,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    ref,
    query,
    orderByChild,
    equalTo,
    get
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


/* =========================================================
   ELEMENTS
========================================================= */

const profileName =
    document.getElementById("profileName");

const profileEmail =
    document.getElementById("profileEmail");

const emailVerification =
    document.getElementById("emailVerification");

const verifyEmailBtn =
    document.getElementById("verifyEmailBtn");

const profileWallet =
    document.getElementById("profileWallet");

const profileOrders =
    document.getElementById("profileOrders");

const accountStatus =
    document.getElementById("accountStatus");

const profileUid =
    document.getElementById("profileUid");

const logoutBtn =
    document.getElementById("logout");


/* =========================================================
   FORMAT NAIRA
========================================================= */

function formatNaira(amount) {

    return "₦" +
        Number(amount || 0).toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


/* =========================================================
   LOAD BASIC PROFILE INFORMATION
========================================================= */

async function loadUserData(user) {

    /*
        Basic Firebase Authentication information
    */

    if (profileName) {

        profileName.textContent =
            user.displayName ||
            "User";

    }


    if (profileEmail) {

        profileEmail.textContent =
            user.email ||
            "Not available";

    }


    if (profileUid) {

        profileUid.textContent =
            user.uid ||
            "Not available";

    }


    /*
        EMAIL VERIFICATION & BUTTON CONTROLS
    */

    if (emailVerification) {

        if (user.emailVerified) {

            emailVerification.innerHTML = `

                <span class="badge bg-success">

                    <i class="bi bi-check-circle"></i>

                    Verified

                </span>

            `;

            if (verifyEmailBtn) {
                verifyEmailBtn.classList.add("d-none");
            }

        } else {

            emailVerification.innerHTML = `

                <span class="badge bg-warning text-dark">

                    <i class="bi bi-exclamation-circle"></i>

                    Not Verified

                </span>

            `;

            if (verifyEmailBtn) {
                verifyEmailBtn.classList.remove("d-none");
            }

        }

    }


    /*
        ACCOUNT STATUS
    */

    if (accountStatus) {

        accountStatus.innerHTML = `

            <span class="badge bg-success">

                <i class="bi bi-check-circle"></i>

                Active

            </span>

        `;

    }


    /*
        LOAD USER DATABASE RECORD
    */

    try {

        const userRef =
            ref(
                database,
                "users/" + user.uid
            );


        const userSnapshot =
            await get(userRef);


        if (!userSnapshot.exists()) {

            console.warn(
                "USER DATA NOT FOUND"
            );

            if (profileWallet) {

                profileWallet.textContent =
                    "₦0.00";

            }

            return;

        }


        const userData =
            userSnapshot.val();


        /*
            FULL NAME
        */

        if (profileName) {

            profileName.textContent =
                userData.fullName ||
                user.displayName ||
                "User";

        }


        /*
            WALLET BALANCE
        */

        if (profileWallet) {

            profileWallet.textContent =
                formatNaira(
                    userData.wallet
                );

        }


    } catch (error) {

        console.error(
            "PROFILE USER DATA ERROR:",
            error
        );


        /*
            Only wallet is affected
            if user data fails.
        */

        if (profileWallet) {

            profileWallet.textContent =
                "Unable to load";

        }

    }

}


/* =========================================================
   LOAD USER ORDERS
========================================================= */

async function loadUserOrders(user) {

    try {

        /*
            IMPORTANT:

            Only query orders belonging
            to the authenticated user.

            This matches our Firebase
            security rules.
        */

        const ordersQuery =
            query(
                ref(
                    database,
                    "orders"
                ),
                orderByChild("uid"),
                equalTo(user.uid)
            );


        const ordersSnapshot =
            await get(
                ordersQuery
            );


        /*
            NO ORDERS
        */

        if (
            !ordersSnapshot.exists()
        ) {

            if (profileOrders) {

                profileOrders.textContent =
                    "0";

            }

            return;

        }


        const orders =
            ordersSnapshot.val();


        /*
            Count returned user orders.
        */

        const userOrders =
            Object.values(
                orders
            ).filter(
                order =>
                    order &&
                    String(order.uid) ===
                    String(user.uid)
            );


        if (profileOrders) {

            profileOrders.textContent =
                String(
                    userOrders.length
                );

        }


    } catch (error) {

        console.error(
            "PROFILE ORDERS ERROR:",
            error
        );


        /*
            Only order count is affected
            if the order request fails.
        */

        if (profileOrders) {

            profileOrders.textContent =
                "Unable to load";

        }

    }

}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile(user) {

    /*
        Run profile data and orders
        independently.

        This prevents an order-loading
        error from replacing the wallet
        information with "Unable to load".
    */

    await Promise.allSettled([

        loadUserData(
            user
        ),

        loadUserOrders(
            user
        )

    ]);

}


/* =========================================================
   AUTHENTICATION
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        /*
            USER NOT LOGGED IN
        */

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        /*
            USER IS AUTHENTICATED

            Only now do we load
            Firebase user data.
        */

        await loadProfile(
            user
        );

    }
);


/* =========================================================
   SEND EMAIL VERIFICATION LINK HANDLER
========================================================= */

if (verifyEmailBtn) {

    verifyEmailBtn.addEventListener(
        "click",
        async () => {

            const user = auth.currentUser;

            if (!user) return;

            try {

                verifyEmailBtn.disabled = true;
                verifyEmailBtn.textContent = "Sending...";

                await sendEmailVerification(user);

                alert("Verification link sent successfully! Please check your inbox and spam folders.");

            } catch (error) {

                console.error("VERIFICATION EMAIL ERROR:", error);
                alert("Failed to send verification email: " + error.message);

            } finally {

                verifyEmailBtn.disabled = false;
                verifyEmailBtn.innerHTML = '<i class="bi bi-envelope-check"></i> Send Verification Link';

            }

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(
                    auth
                );


                window.location.href =
                    "login.html";


            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );

            }

        }
    );

}
