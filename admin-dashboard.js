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

const adminLoading =
    document.getElementById("adminLoading");

const loadingMessage =
    document.getElementById("loadingMessage");

const accessDenied =
    document.getElementById("accessDenied");

const adminContent =
    document.getElementById("adminContent");

const adminEmail =
    document.getElementById("adminEmail");

const logoutBtn =
    document.getElementById("logout");

const totalUsers =
    document.getElementById("totalUsers");

const totalOrders =
    document.getElementById("totalOrders");

const pendingOrders =
    document.getElementById("pendingOrders");

const completedOrders =
    document.getElementById("completedOrders");


/* =========================================================
   SHOW / HIDE
========================================================= */

function showAccessDenied(message) {

    if (adminLoading) {
        adminLoading.style.display = "none";
    }

    if (adminContent) {
        adminContent.style.display = "none";
    }

    if (accessDenied) {

        accessDenied.style.display = "block";

        const paragraph =
            accessDenied.querySelector("p");

        if (paragraph) {
            paragraph.textContent = message;
        }
    }

}


function showAdminContent() {

    if (adminLoading) {
        adminLoading.style.display = "none";
    }

    if (accessDenied) {
        accessDenied.style.display = "none";
    }

    if (adminContent) {
        adminContent.style.display = "block";
    }

}


/* =========================================================
   LOAD ADMIN STATISTICS
========================================================= */

async function loadAdminStatistics() {

    /*
     * USERS
     */

    try {

        if (loadingMessage) {

            loadingMessage.textContent =
                "Loading users...";

        }


        const usersSnapshot =
            await get(
                ref(
                    database,
                    "users"
                )
            );


        let usersCount = 0;


        if (usersSnapshot.exists()) {

            const users =
                usersSnapshot.val();

            usersCount =
                Object.keys(users).length;

        }


        if (totalUsers) {

            totalUsers.textContent =
                String(usersCount);

        }

    } catch (error) {

        console.error(
            "ADMIN USERS ERROR:",
            error
        );

        if (totalUsers) {
            totalUsers.textContent =
                "Unable to load";
        }

    }


    /*
     * ORDERS
     */

    try {

        if (loadingMessage) {

            loadingMessage.textContent =
                "Loading orders...";

        }


        const ordersSnapshot =
            await get(
                ref(
                    database,
                    "orders"
                )
            );


        let allOrders = [];

        let pending = 0;

        let completed = 0;


        if (ordersSnapshot.exists()) {

            const orders =
                ordersSnapshot.val();


            allOrders =
                Object.values(orders)
                    .filter(
                        order =>
                            order &&
                            typeof order === "object"
                    );


            allOrders.forEach(
                order => {

                    const status =
                        String(
                            order.status ||
                            "pending"
                        ).toLowerCase();


                    if (
                        status === "pending"
                    ) {

                        pending++;

                    }


                    if (
                        status === "completed"
                    ) {

                        completed++;

                    }

                }
            );

        }


        if (totalOrders) {

            totalOrders.textContent =
                String(
                    allOrders.length
                );

        }


        if (pendingOrders) {

            pendingOrders.textContent =
                String(pending);

        }


        if (completedOrders) {

            completedOrders.textContent =
                String(completed);

        }

    } catch (error) {

        console.error(
            "ADMIN ORDERS ERROR:",
            error
        );


        if (totalOrders) {

            totalOrders.textContent =
                "Unable to load";

        }


        if (pendingOrders) {

            pendingOrders.textContent =
                "Unable to load";

        }


        if (completedOrders) {

            completedOrders.textContent =
                "Unable to load";

        }

    }


    if (loadingMessage) {

        loadingMessage.textContent =
            "Admin dashboard ready.";

    }

}


/* =========================================================
   AUTHENTICATION + ADMIN CHECK
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        console.log(
            "AUTH USER:",
            user
        );


        if (!user) {

            showAccessDenied(
                "You must be logged in to access the admin dashboard."
            );

            return;

        }


        try {

            if (loadingMessage) {

                loadingMessage.textContent =
                    "Checking administrator account...";

            }


            /*
             * Force-refresh the Firebase ID token.
             *
             * Firebase custom claims are carried
             * inside the ID token.
             */

            await user.getIdToken(true);


            /*
             * Read refreshed claims.
             */

            const tokenResult =
                await user.getIdTokenResult(true);


            console.log(
                "ADMIN UID:",
                user.uid
            );


            console.log(
                "ADMIN CLAIMS:",
                tokenResult.claims
            );


            const isAdmin =
                tokenResult.claims.admin === true;


            /*
             * ADMIN CLAIM NOT FOUND
             */

            if (!isAdmin) {

                console.error(
                    "ADMIN CLAIM MISSING:",
                    tokenResult.claims
                );


                showAccessDenied(
                    "Your account is logged in, but Firebase does not see the admin claim yet. Please sign out, sign back in, and try again."
                );

                return;

            }


            /*
             * ADMIN VERIFIED
             */

            console.log(
                "ADMIN VERIFIED"
            );


            if (adminEmail) {

                adminEmail.textContent =
                    user.email ||
                    "Administrator";

            }


            /*
             * SHOW DASHBOARD IMMEDIATELY
             *
             * Do NOT wait for database
             * statistics before showing it.
             */

            showAdminContent();


            /*
             * Load statistics afterward.
             */

            await loadAdminStatistics();


        } catch (error) {

            console.error(
                "ADMIN DASHBOARD ERROR:",
                error
            );


            showAccessDenied(
                "Unable to verify administrator access. Check the browser console for the exact error."
            );

        }

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
