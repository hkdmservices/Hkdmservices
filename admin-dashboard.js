import {
auth,
database
} from “./firebase.js”;

import {
onAuthStateChanged,
signOut
} from “https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js”;

import {
ref,
get
} from “https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js”;

/* =========================================================
ELEMENTS
========================================================= */

const adminLoading =
document.getElementById(“adminLoading”);

const loadingMessage =
document.getElementById(“loadingMessage”);

const accessDenied =
document.getElementById(“accessDenied”);

const adminContent =
document.getElementById(“adminContent”);

const adminEmail =
document.getElementById(“adminEmail”);

const logoutBtn =
document.getElementById(“logout”);

const totalUsers =
document.getElementById(“totalUsers”);

const totalOrders =
document.getElementById(“totalOrders”);

const pendingOrders =
document.getElementById(“pendingOrders”);

const completedOrders =
document.getElementById(“completedOrders”);

/* =========================================================
ACCESS DENIED
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
SHOW ADMIN CONTENT
========================================================= */

function showAdminContent() {

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
LOAD ADMIN STATISTICS
========================================================= */

async function loadAdminStatistics() {

/*
 * Reset the statistics first.
 */
if (totalUsers) {
    totalUsers.textContent = "Loading...";
}
if (totalOrders) {
    totalOrders.textContent = "Loading...";
}
if (pendingOrders) {
    pendingOrders.textContent = "Loading...";
}
if (completedOrders) {
    completedOrders.textContent = "Loading...";
}
try {
    /*
     =====================================================
     USERS
     =====================================================
    */
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
            Object.keys(
                users
            ).length;
    }
    if (totalUsers) {
        totalUsers.textContent =
            String(
                usersCount
            );
    }
    /*
     =====================================================
     ORDERS
     =====================================================
    */
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
            Object.values(
                orders
            ).filter(
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
        "ADMIN DATA ERROR:",
        error
    );
    if (totalUsers) {
        totalUsers.textContent =
            "Unable to load";
    }
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
AUTHENTICATION + ADMIN VERIFICATION
========================================================= */

onAuthStateChanged(
auth,
async (user) => {

    /*
     * NOT LOGGED IN
     */
    if (!user) {
        showAccessDenied(
            "You must be logged in to access the admin dashboard."
        );
        return;
    }
    try {
        if (loadingMessage) {
            loadingMessage.textContent =
                "Checking administrator privileges...";
        }
        /*
         * Force Firebase to issue a fresh
         * ID token so the latest custom
         * claims are available.
         */
        await user.getIdToken(
            true
        );
        /*
         * Read the refreshed token.
         */
        const tokenResult =
            await user.getIdTokenResult(
                true
            );
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
        /*
         * ADMIN CLAIM CHECK
         */
        const isAdmin =
            tokenResult.claims.admin === true;
        if (!isAdmin) {
            console.error(
                "ADMIN ACCESS DENIED",
                tokenResult.claims
            );
            showAccessDenied(
                "Firebase does not currently recognize this account as an administrator."
            );
            return;
        }
        /*
         * ADMIN VERIFIED
         */
        console.log(
            "ADMIN ACCESS GRANTED"
        );
        if (adminEmail) {
            adminEmail.textContent =
                user.email ||
                "Administrator";
        }
        /*
         * Show dashboard.
         */
        showAdminContent();
        /*
         * Load admin statistics.
         */
        await loadAdminStatistics();
    } catch (error) {
        console.error(
            "ADMIN DASHBOARD ERROR:",
            error
        );
        showAccessDenied(
            "Unable to verify administrator access."
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
