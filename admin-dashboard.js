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
   SHOW ACCESS DENIED
========================================================= */

function showAccessDenied(message) {

    if (adminLoading) {
        adminLoading.style.display = "none";
    }

    if (adminContent) {
        adminContent.style.display = "none";
    }

    if (accessDenied) {

        accessDenied.style.display =
            "block";

        const paragraph =
            accessDenied.querySelector("p");

        if (paragraph) {

            paragraph.textContent =
                message;

        }

    }

}


/* =========================================================
   SHOW ADMIN DASHBOARD
========================================================= */

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
            "USERS LOAD ERROR:",
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
                            typeof order ===
                            "object"
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
                String(
                    pending
                );

        }


        if (completedOrders) {

            completedOrders.textContent =
                String(
                    completed
                );

        }


    } catch (error) {

        console.error(
            "ORDERS LOAD ERROR:",
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

}


/* =========================================================
   AUTHENTICATION + ADMIN CLAIM
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            showAccessDenied(
                "You must be logged in to access the admin dashboard."
            );

            return;

        }


        try {

            if (loadingMessage) {

                loadingMessage.textContent =
                    "Refreshing administrator credentials...";

            }


            /*
             * FORCE REFRESH OF FIREBASE ID TOKEN
             */

            const tokenResult =
                await user.getIdTokenResult(
                    true
                );


            /*
             * SHOW DEBUG INFORMATION
             */

            console.log(
                "ADMIN UID:",
                user.uid
            );


            console.log(
                "ADMIN EMAIL:",
                user.email
            );


            console.log(
                "ADMIN CLAIMS:",
                tokenResult.claims
            );


            console.log(
                "ADMIN CLAIM:",
                tokenResult.claims.admin
            );


            /*
             * CHECK ADMIN CLAIM
             */

            if (
                tokenResult.claims.admin !== true
            ) {

                showAccessDenied(
                    "Your Firebase admin claim is not active. Please open activate-admin.html and activate admin again."
                );

                return;

            }


            /*
             * ADMIN CLAIM VERIFIED
             */

            console.log(
                "ADMIN AUTHENTICATION VERIFIED"
            );


            if (adminEmail) {

                adminEmail.textContent =
                    user.email ||
                    "Administrator";

            }


            /*
             * SHOW DASHBOARD FIRST
             */

            showAdminContent();


            /*
             * THEN LOAD ADMIN DATA
             */

            await loadAdminStatistics();


        } catch (error) {

            console.error(
                "ADMIN AUTHENTICATION ERROR:",
                error
            );


            showAccessDenied(
                "Admin authentication could not be verified. Check the browser console for the exact error."
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
