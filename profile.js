import {
    auth,
    database
} from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    ref,
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
   LOAD PROFILE
========================================================= */

async function loadProfile(user) {

    try {

        /*
            BASIC FIREBASE AUTH INFORMATION
        */

        profileName.textContent =
            user.displayName ||
            "User";

        profileEmail.textContent =
            user.email ||
            "Not available";

        profileUid.textContent =
            user.uid ||
            "Not available";


        /*
            EMAIL VERIFICATION
        */

        if (user.emailVerified) {

            emailVerification.innerHTML = `

                <span class="badge bg-success">

                    <i class="bi bi-check-circle"></i>

                    Verified

                </span>

            `;

        } else {

            emailVerification.innerHTML = `

                <span class="badge bg-warning text-dark">

                    <i class="bi bi-exclamation-circle"></i>

                    Not Verified

                </span>

            `;

        }


        /*
            ACCOUNT STATUS
        */

        accountStatus.innerHTML = `

            <span class="badge bg-success">

                <i class="bi bi-check-circle"></i>

                Active

            </span>

        `;


        /*
            LOAD USER DATA FROM REALTIME DATABASE
        */

        const userRef =
            ref(
                database,
                "users/" + user.uid
            );


        const userSnapshot =
            await get(userRef);


        if (userSnapshot.exists()) {

            const userData =
                userSnapshot.val();


            /*
                FULL NAME

                Your database uses fullName,
                so use it when available.
            */

            profileName.textContent =
                userData.fullName ||
                user.displayName ||
                "User";


            /*
                WALLET BALANCE
            */

            profileWallet.textContent =
                formatNaira(
                    userData.wallet
                );

        } else {

            /*
                USER DATABASE RECORD
                DOES NOT EXIST
            */

            profileWallet.textContent =
                "₦0.00";

        }


        /*
            LOAD USER ORDERS
        */

        const ordersRef =
            ref(
                database,
                "orders"
            );


        const ordersSnapshot =
            await get(ordersRef);


        if (
            !ordersSnapshot.exists()
        ) {

            profileOrders.textContent =
                "0";

            return;

        }


        const orders =
            ordersSnapshot.val();


        /*
            COUNT ONLY ORDERS
            BELONGING TO THIS USER
        */

        const userOrders =
            Object.values(orders)
                .filter(
                    order =>
                        order &&
                        order.uid === user.uid
                );


        profileOrders.textContent =
            String(
                userOrders.length
            );


    } catch (error) {

        console.error(
            "PROFILE ERROR:",
            error
        );


        /*
            Do not crash the page.
        */

        if (profileWallet) {

            profileWallet.textContent =
                "Unable to load";

        }


        if (profileOrders) {

            profileOrders.textContent =
                "Unable to load";

        }

    }

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
            USER IS LOGGED IN
        */

        await loadProfile(user);

    }
);


/* =========================================================
   LOGOUT
========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);


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
