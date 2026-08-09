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

function showAccessDenied(text) {

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
            text;
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

try {
    /*
     * USERS
     */
    if (totalUsers) {
        totalUsers.textContent =
            "Loading...";
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
    /*
     * ORDERS
     */
    if (totalOrders) {
        totalOrders.textContent =
            "Loading...";
    }
    if (pendingOrders) {
        pendingOrders.textContent =
            "Loading...";
    }
    if (completedOrders) {
        completedOrders.textContent =
            "Loading...";
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
            String(pending);
    }
    if (completedOrders) {
        completedOrders.textContent =
            String(completed);
    }
} catch (error) {
    console.error(
        "ADMIN DATABASE ERROR:",
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
AUTHENTICATION
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
                "Checking administrator privileges...";
        }
        /*
         * Make sure Firebase has a fresh token.
         */
        await user.getIdToken(true);
        /*
         * Get the token result.
         */
        const tokenResult =
            await user.getIdTokenResult();
        console.log(
            "ADMIN USER:",
            user.email
        );
        console.log(
            "ADMIN UID:",
            user.uid
        );
        console.log(
            "ADMIN CLAIMS:",
            tokenResult.claims
        );
        /*
         * CHECK ADMIN CLAIM
         */
        if (
            tokenResult.claims.admin !== true
        ) {
            showAccessDenied(
                "Your account is logged in, but Firebase does not see the admin claim."
            );
            return;
        }
        /*
         * ADMIN VERIFIED
         */
        if (adminEmail) {
            adminEmail.textContent =
                user.email ||
                "Administrator";
        }
        showAdminContent();
        /*
         * Load statistics.
         */
        await loadAdminStatistics();
    } catch (error) {
        console.error(
            "ADMIN VERIFICATION ERROR:",
            error
        );
        showAccessDenied(
            "Admin verification failed: " +
            (
                error.message ||
                "Unknown error"
            )
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
