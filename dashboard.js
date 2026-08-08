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


const userName =
    document.getElementById("userName");

const walletBalance =
    document.getElementById("walletBalance");

const ordersCount =
    document.getElementById("ordersCount");

const recentOrders =
    document.getElementById("recentOrders");

const logoutBtn =
    document.getElementById("logout");



/*
    ==================================
    FORMAT NAIRA
    ==================================
*/

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



/*
    ==================================
    FORMAT DATE
    ==================================
*/

function formatDate(timestamp) {

    if (!timestamp) {

        return "—";

    }


    return new Date(timestamp)
        .toLocaleString(
            "en-NG",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

}



/*
    ==================================
    STATUS BADGE
    ==================================
*/

function statusBadge(status) {

    const safeStatus =
        String(
            status || "pending"
        ).toLowerCase();


    let badgeClass =
        "bg-secondary";


    if (
        safeStatus === "pending"
    ) {

        badgeClass =
            "bg-warning text-dark";

    }


    if (
        safeStatus === "processing"
    ) {

        badgeClass =
            "bg-info text-dark";

    }


    if (
        safeStatus === "completed"
    ) {

        badgeClass =
            "bg-success";

    }


    if (
        safeStatus === "cancelled" ||
        safeStatus === "failed"
    ) {

        badgeClass =
            "bg-danger";

    }


    return `
        <span class="badge ${badgeClass}">
            ${safeStatus}
        </span>
    `;

}



/*
    ==================================
    LOAD RECENT ORDERS
    ==================================
*/

async function loadRecentOrders(uid) {

    try {

        const ordersSnapshot =
            await get(
                ref(
                    database,
                    "orders"
                )
            );


        /*
            NO ORDERS
        */

        if (!ordersSnapshot.exists()) {

            ordersCount.textContent =
                "0";


            recentOrders.innerHTML = `

                <div class="text-center text-muted py-4">

                    <i class="bi bi-cart-x fs-2"></i>

                    <p class="mt-2 mb-0">

                        You have not placed any orders yet.

                    </p>

                </div>

            `;

            return;

        }



        /*
            GET ALL ORDERS
        */

        const orders =
            ordersSnapshot.val();


        /*
            ONLY THIS USER'S ORDERS
        */

        const userOrders =
            Object.values(orders)

                .filter(
                    order =>
                        order &&
                        order.uid === uid
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



        /*
            UPDATE ORDER COUNT
        */

        ordersCount.textContent =
            userOrders.length;



        /*
            NO USER ORDERS
        */

        if (
            userOrders.length === 0
        ) {

            recentOrders.innerHTML = `

                <div class="text-center text-muted py-4">

                    <i class="bi bi-cart-x fs-2"></i>

                    <p class="mt-2 mb-0">

                        You have not placed any orders yet.

                    </p>

                </div>

            `;

            return;

        }



        /*
            SHOW FIVE NEWEST ORDERS
        */

        const latestOrders =
            userOrders.slice(
                0,
                5
            );



        /*
            ==================================
            DESKTOP TABLE
            ==================================
        */

        let desktopHtml = `

            <div class="d-none d-md-block">

                <div class="table-responsive">

                    <table
                        class="table table-hover align-middle mb-0"
                    >

                        <thead>

                            <tr>

                                <th>
                                    Order ID
                                </th>

                                <th>
                                    Service
                                </th>

                                <th>
                                    Quantity
                                </th>

                                <th>
                                    Amount
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Date
                                </th>

                            </tr>

                        </thead>

                        <tbody>

        `;



        latestOrders.forEach(
            order => {

                const shortOrderId =
                    String(
                        order.orderId || ""
                    ).slice(
                        0,
                        10
                    );


                desktopHtml += `

                    <tr>

                        <td>

                            <code>
                                ${shortOrderId}
                            </code>

                        </td>


                        <td>

                            <strong>
                                ${order.platform || "—"}
                            </strong>

                            <br>

                            <small class="text-muted">

                                ${order.service || "—"}

                            </small>

                        </td>


                        <td>

                            ${Number(
                                order.quantity || 0
                            ).toLocaleString(
                                "en-NG"
                            )}

                        </td>


                        <td>

                            <strong>

                                ${formatNaira(
                                    order.amount
                                )}

                            </strong>

                        </td>


                        <td>

                            ${statusBadge(
                                order.status
                            )}

                        </td>


                        <td>

                            <small>

                                ${formatDate(
                                    order.createdAt
                                )}

                            </small>

                        </td>

                    </tr>

                `;

            }
        );



        desktopHtml += `

                        </tbody>

                    </table>

                </div>

            </div>

        `;



        /*
            ==================================
            MOBILE ORDER CARDS
            ==================================
        */

        let mobileHtml = `

            <div class="d-md-none">

        `;



        latestOrders.forEach(
            order => {

                const shortOrderId =
                    String(
                        order.orderId || ""
                    ).slice(
                        0,
                        12
                    );


                mobileHtml += `

                    <div
                        class="card border shadow-sm mb-3"
                    >

                        <div class="card-body">


                            <!-- ORDER ID -->

                            <div
                                class="d-flex
                                justify-content-between
                                align-items-start
                                mb-3"
                            >

                                <div>

                                    <small
                                        class="text-muted"
                                    >

                                        Order ID

                                    </small>

                                    <div>

                                        <code>

                                            ${shortOrderId}

                                        </code>

                                    </div>

                                </div>


                                <div>

                                    ${statusBadge(
                                        order.status
                                    )}

                                </div>

                            </div>



                            <!-- SERVICE -->

                            <div class="mb-3">

                                <small
                                    class="text-muted"
                                >

                                    Service

                                </small>

                                <div
                                    class="fw-bold"
                                >

                                    ${order.platform || "—"}

                                </div>

                                <div
                                    class="text-muted"
                                >

                                    ${order.service || "—"}

                                </div>

                            </div>



                            <!-- QUANTITY -->

                            <div class="mb-3">

                                <small
                                    class="text-muted"
                                >

                                    Quantity

                                </small>

                                <div
                                    class="fw-bold"
                                >

                                    ${Number(
                                        order.quantity || 0
                                    ).toLocaleString(
                                        "en-NG"
                                    )}

                                </div>

                            </div>



                            <!-- AMOUNT -->

                            <div class="mb-3">

                                <small
                                    class="text-muted"
                                >

                                    Amount

                                </small>

                                <div
                                    class="fw-bold text-success"
                                >

                                    ${formatNaira(
                                        order.amount
                                    )}

                                </div>

                            </div>



                            <!-- DATE -->

                            <div>

                                <small
                                    class="text-muted"
                                >

                                    Date

                                </small>

                                <div>

                                    ${formatDate(
                                        order.createdAt
                                    )}

                                </div>

                            </div>


                        </div>

                    </div>

                `;

            }
        );



        mobileHtml += `

            </div>

        `;



        /*
            COMBINE DESKTOP + MOBILE
        */

        recentOrders.innerHTML =
            desktopHtml +
            mobileHtml;



    } catch (error) {

        console.error(
            "RECENT ORDERS ERROR:",
            error
        );


        recentOrders.innerHTML = `

            <div
                class="alert alert-danger mb-0"
            >

                Unable to load your recent orders.

            </div>

        `;

    }

}



/*
    ==================================
    AUTHENTICATION
    ==================================
*/

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        try {

            /*
                LOAD USER INFORMATION
            */

            const userSnapshot =
                await get(
                    ref(
                        database,
                        "users/" +
                        user.uid
                    )
                );


            if (
                userSnapshot.exists()
            ) {

                const data =
                    userSnapshot.val();


                userName.textContent =
                    data.fullName ||
                    user.displayName ||
                    "User";


                walletBalance.textContent =
                    formatNaira(
                        data.wallet
                    );

            }



            /*
                LOAD ORDERS
            */

            await loadRecentOrders(
                user.uid
            );


        } catch (error) {

            console.error(
                "DASHBOARD ERROR:",
                error
            );


            walletBalance.textContent =
                "₦0.00";

            ordersCount.textContent =
                "0";

        }

    }
);



/*
    ==================================
    LOGOUT
    ==================================
*/

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

/* =========================================================
   HKDMservices DASHBOARD TOGGLE
========================================================= */

.dashboard-toggle {
    position: fixed !important;
    top: 80px !important;
    left: 15px !important;

    width: 52px !important;
    height: 52px !important;

    display: flex !important;
    align-items: center !important;
    justify-content: center !important;

    background: #198754 !important;
    color: #ffffff !important;

    border: none !important;
    border-radius: 12px !important;

    font-size: 25px !important;

    cursor: pointer !important;

    z-index: 99999 !important;

    pointer-events: auto !important;

    box-shadow: 0 5px 18px rgba(0,0,0,0.25);

    transition: 0.25s ease;
}

.dashboard-toggle:hover {
    background: #157347 !important;
    transform: scale(1.05);
}


/* =========================================================
   SIDE PANEL
========================================================= */

.dashboard-panel {
    position: fixed !important;

    top: 0 !important;
    left: -450px !important;

    width: 430px !important;
    max-width: 92vw !important;

    height: 100vh !important;

    background: #f8f9fa !important;

    z-index: 99998 !important;

    overflow-y: auto !important;

    box-shadow: 8px 0 30px rgba(0,0,0,0.25);

    transition: left 0.3s ease !important;

    visibility: hidden;
}


/* OPEN */

.dashboard-panel.open {
    left: 0 !important;
    visibility: visible !important;
}


/* =========================================================
   PANEL HEADER
========================================================= */

.dashboard-panel-header {
    position: sticky;

    top: 0;

    z-index: 10;

    background: #212529;

    color: white;

    padding: 18px 20px;

    display: flex;

    align-items: center;

    justify-content: space-between;
}


/* =========================================================
   CLOSE BUTTON
========================================================= */

.dashboard-panel-close {
    width: 42px;

    height: 42px;

    border: none;

    border-radius: 10px;

    background: #dc3545;

    color: white;

    font-size: 18px;

    cursor: pointer;

    display: flex;

    align-items: center;

    justify-content: center;
}


/* =========================================================
   PANEL CONTENT
========================================================= */

.dashboard-panel-content {
    padding: 20px;
}


/* =========================================================
   PANEL BUTTONS
========================================================= */

.dashboard-panel-content .btn {
    width: 100%;

    padding: 12px;

    font-size: 16px;
}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 576px) {

    .dashboard-toggle {
        top: 75px !important;
        left: 12px !important;

        width: 48px !important;
        height: 48px !important;
    }

    .dashboard-panel {
        width: 100% !important;
        max-width: 100% !important;
    }

    .dashboard-panel-content {
        padding: 15px;
    }

}
