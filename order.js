import {
    auth,
    database
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


const ordersContainer =
    document.getElementById("ordersContainer");


/* =========================================================
   FORMAT NAIRA
========================================================= */

function formatNaira(amount) {

    const value = Number(amount);

    return "₦" +
        (Number.isFinite(value) ? value : 0)
            .toLocaleString(
                "en-NG",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(timestamp) {

    if (!timestamp) {
        return "—";
    }

    const date =
        new Date(Number(timestamp));

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString(
        "en-NG",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   STATUS BADGE
========================================================= */

function statusBadge(status) {

    const safeStatus =
        String(
            status || "pending"
        )
            .toLowerCase()
            .trim();


    let badgeClass =
        "bg-secondary";


    switch (safeStatus) {

        case "pending":

            badgeClass =
                "bg-warning text-dark";

            break;


        case "processing":

            badgeClass =
                "bg-info text-dark";

            break;


        case "completed":

            badgeClass =
                "bg-success";

            break;


        case "cancelled":

        case "failed":

            badgeClass =
                "bg-danger";

            break;


        case "refunded":

            badgeClass =
                "bg-dark";

            break;


        default:

            badgeClass =
                "bg-secondary";

    }


    return `
        <span class="badge ${badgeClass}">
            ${escapeHtml(safeStatus)}
        </span>
    `;
}


/* =========================================================
   SHOW EMPTY ORDERS
========================================================= */

function showNoOrders() {

    if (!ordersContainer) {
        return;
    }


    ordersContainer.innerHTML = `

        <div class="text-center text-muted py-5">

            <i class="bi bi-cart-x fs-1"></i>

            <p class="mt-3 mb-0">

                You have not placed any orders yet.

            </p>

        </div>

    `;
}


/* =========================================================
   SHOW ERROR
========================================================= */

function showOrdersError() {

    if (!ordersContainer) {
        return;
    }


    ordersContainer.innerHTML = `

        <div class="alert alert-danger">

            Unable to load your orders.
            Please try again.

        </div>

    `;
}


/* =========================================================
   LOAD USER ORDERS
========================================================= */

async function loadOrders(uid) {

    if (!ordersContainer) {
        return;
    }


    if (!uid) {

        showNoOrders();

        return;

    }


    try {

        /*
         * Read the orders collection.
         *
         * We filter by UID in JavaScript so this
         * does not depend on Firebase indexing.
         */

        const ordersRef =
            ref(
                database,
                "orders"
            );


        const snapshot =
            await get(
                ordersRef
            );


        /* =================================================
           NO ORDERS COLLECTION
        ================================================= */

        if (!snapshot.exists()) {

            showNoOrders();

            return;

        }


        const ordersData =
            snapshot.val();


        if (
            !ordersData ||
            typeof ordersData !== "object"
        ) {

            showNoOrders();

            return;

        }


        /* =================================================
           FILTER CURRENT USER
        ================================================= */

        const userOrders =
            Object.entries(
                ordersData
            )

            .map(
                ([key, order]) => ({

                    ...order,

                    /*
                     * Keep the Firebase key as a
                     * fallback order ID.
                     */

                    firebaseKey:
                        key

                })
            )

            .filter(
                order =>
                    order &&
                    String(order.uid) ===
                    String(uid)
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


        /* =================================================
           NO USER ORDERS
        ================================================= */

        if (
            userOrders.length === 0
        ) {

            showNoOrders();

            return;

        }


        /* =================================================
           BUILD TABLE
        ================================================= */

        let html = `

            <div class="table-responsive">

                <table class="table table-hover align-middle">

                    <thead>

                        <tr>

                            <th>Order ID</th>

                            <th>Service</th>

                            <th>Link</th>

                            <th>Quantity</th>

                            <th>Amount</th>

                            <th>Status</th>

                            <th>Date</th>

                        </tr>

                    </thead>


                    <tbody>

        `;


        userOrders.forEach(
            order => {

                const orderId =
                    order.orderId ||
                    order.firebaseKey ||
                    "—";


                const platform =
                    order.platform ||
                    "—";


                const service =
                    order.service ||
                    order.serviceName ||
                    "—";


                const link =
                    order.link ||
                    "";


                const quantity =
                    Number(
                        order.quantity || 0
                    );


                const amount =
                    order.amount ||
                    order.total ||
                    order.totalPrice ||
                    0;


                html += `

                    <tr>

                        <td>

                            <code
                                title="${escapeHtml(orderId)}"
                            >

                                ${escapeHtml(
                                    String(orderId)
                                        .slice(0, 12)
                                )}

                            </code>

                        </td>


                        <td>

                            <strong>

                                ${escapeHtml(
                                    platform
                                )}

                            </strong>

                            <br>

                            <small class="text-muted">

                                ${escapeHtml(
                                    service
                                )}

                            </small>

                        </td>


                        <td>

                            ${
                                link

                                ?

                                `

                                <a
                                    href="${escapeHtml(link)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="text-decoration-underline text-truncate d-inline-block"
                                    style="max-width: 160px;"
                                    title="${escapeHtml(link)}"
                                >

                                    ${escapeHtml(link)}

                                </a>

                                `

                                :

                                "—"
                            }

                        </td>


                        <td>

                            ${
                                Number.isFinite(
                                    quantity
                                )

                                ?

                                quantity.toLocaleString(
                                    "en-NG"
                                )

                                :

                                "0"
                            }

                        </td>


                        <td>

                            ${formatNaira(
                                amount
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

            </div>

        `;


        ordersContainer.innerHTML =
            html;


    } catch (error) {

        console.error(
            "RECENT ORDERS ERROR:",
            error
        );


        showOrdersError();

    }

}


/* =========================================================
   AUTHENTICATION
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        await loadOrders(
            user.uid
        );

    }
);
