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

async function loadRecentOrders(
    uid
) {

    try {

        const ordersSnapshot =
            await get(
                ref(
                    database,
                    "orders"
                )
            );


        if (
            !ordersSnapshot.exists()
        ) {

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


        const orders =
            ordersSnapshot.val();


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


        ordersCount.textContent =
            userOrders.length;


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
            Show the five newest orders.
        */

        const latestOrders =
            userOrders.slice(
                0,
                5
            );


        let html = `

            <table class="table table-hover align-middle mb-0">

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


                html += `

                    <tr>

                        <td>

                            <code>
                                ${shortOrderId}
                            </code>

                        </td>


                        <td>

                            ${order.platform || "—"}

                            <br>

                            <small
                                class="text-muted">

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

                            ${formatNaira(
                                order.amount
                            )}

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


        html += `

                </tbody>

            </table>

        `;


        recentOrders.innerHTML =
            html;


    } catch (error) {

        console.error(
            "RECENT ORDERS ERROR:",
            error
        );


        recentOrders.innerHTML = `

            <div class="alert alert-danger mb-0">

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
                        "users/" + user.uid
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
