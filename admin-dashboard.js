import {
    auth
} from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


/* =========================================================
   ELEMENTS
========================================================= */

const adminLoading =
    document.getElementById("adminLoading");

const accessDenied =
    document.getElementById("accessDenied");

const adminContent =
    document.getElementById("adminContent");

const loadingMessage =
    document.getElementById("loadingMessage");

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

function showLoading(message) {

    if (adminLoading) {

        adminLoading.style.display =
            "block";

    }

    if (accessDenied) {

        accessDenied.style.display =
            "none";

    }

    if (adminContent) {

        adminContent.style.display =
            "none";

    }

    if (loadingMessage) {

        loadingMessage.textContent =
            message;

    }

}


function showDenied() {

    if (adminLoading) {

        adminLoading.style.display =
            "none";

    }

    if (adminContent) {

        adminContent.style.display =
            "none";

    }

    if (accessDenied) {

        accessDenied.style.display =
            "block";

    }

}


function showAdminDashboard() {

    if (adminLoading) {

        adminLoading.style.display =
            "none";

    }

    if (accessDenied) {

        accessDenied.style.display =
            "none";

    }

    if (adminContent) {

        adminContent.style.display =
            "block";

    }

}


/* =========================================================
   ADMIN CHECK
========================================================= */

async function checkAdmin(user) {

    try {

        /*
         * Force-refresh the ID token so the
         * newly-created admin claim is available.
         */

        const tokenResult =
            await user.getIdTokenResult(
                true
            );


        const isAdmin =
            tokenResult.claims &&
            tokenResult.claims.admin === true;


        console.log(
            "ADMIN CLAIM:",
            tokenResult.claims
        );


        if (!isAdmin) {

            console.warn(
                "ADMIN ACCESS DENIED:",
                user.uid
            );

            showDenied();

            return false;

        }


        /*
         * Admin verified.
         */

        if (adminEmail) {

            adminEmail.textContent =
                user.email ||
                "Administrator";

        }


        showAdminDashboard();

        return true;


    } catch (error) {

        console.error(
            "ADMIN CHECK ERROR:",
            error
        );

        showDenied();

        return false;

    }

}


/* =========================================================
   LOAD ADMIN STATISTICS
========================================================= */

async function loadAdminStatistics(user) {

    /*
     * We will load the statistics through the
     * protected admin API endpoint.
     *
     * This avoids giving the browser unrestricted
     * access to the users/orders database nodes.
     */

    try {

        if (loadingMessage) {

            loadingMessage.textContent =
                "Loading administrator data...";

        }


        const idToken =
            await user.getIdToken(
                true
            );


        const response =
            await fetch(
                "/api/admin-stats",
                {

                    method: "GET",

                    headers: {

                        "Authorization":
                            "Bearer " +
                            idToken

                    }

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to load administrator statistics."
            );

        }


        /*
         * TOTAL USERS
         */

        if (totalUsers) {

            totalUsers.textContent =
                Number(
                    result.totalUsers || 0
                ).toLocaleString(
                    "en-NG"
                );

        }


        /*
         * TOTAL ORDERS
         */

        if (totalOrders) {

            totalOrders.textContent =
                Number(
                    result.totalOrders || 0
                ).toLocaleString(
                    "en-NG"
                );

        }


        /*
         * PENDING ORDERS
         */

        if (pendingOrders) {

            pendingOrders.textContent =
                Number(
                    result.pendingOrders || 0
                ).toLocaleString(
                    "en-NG"
                );

        }


        /*
         * COMPLETED ORDERS
         */

        if (completedOrders) {

            completedOrders.textContent =
                Number(
                    result.completedOrders || 0
                ).toLocaleString(
                    "en-NG"
                );

        }


    } catch (error) {

        console.error(
            "ADMIN STATISTICS ERROR:",
            error
        );


        /*
         * Don't destroy the dashboard.
         * Show a clear message in the statistics.
         */

        if (totalUsers) {

            totalUsers.textContent =
                "—";

        }

        if (totalOrders) {

            totalOrders.textContent =
                "—";

        }

        if (pendingOrders) {

            pendingOrders.textContent =
                "—";

        }

        if (completedOrders) {

            completedOrders.textContent =
                "—";

        }


        console.error(
            "Statistics could not be loaded:",
            error.message
        );

    }

}


/* =========================================================
   AUTHENTICATION
========================================================= */

showLoading(
    "Checking your Firebase account..."
);


onAuthStateChanged(
    auth,
    async (user) => {

        /*
         * NOT LOGGED IN
         */

        if (!user) {

            showDenied();

            window.location.href =
                "login.html";

            return;

        }


        /*
         * CHECK ADMIN CLAIM
         */

        const isAdmin =
            await checkAdmin(
                user
            );


        if (!isAdmin) {

            return;

        }


        /*
         * ADMIN VERIFIED
         */

        await loadAdminStatistics(
            user
        );

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

                logoutBtn.disabled =
                    true;

                logoutBtn.innerHTML =
                    '<span class="spinner-border spinner-border-sm me-1"></span> Logging out...';


                await signOut(
                    auth
                );


                window.location.href =
                    "login.html";


            } catch (error) {

                console.error(
                    "ADMIN LOGOUT ERROR:",
                    error
                );


                logoutBtn.disabled =
                    false;

                logoutBtn.innerHTML =
                    '<i class="bi bi-box-arrow-right"></i> Logout';

            }

        }
    );

}
