import {
    auth,
    database
} from "./firebase.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


import {
    ref,
    query,
    orderByChild,
    equalTo,
    get
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


const ordersContainer =
    document.getElementById(
        "ordersContainer"
    );


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
    LOAD ORDERS
    ==================================
*/

async function loadOrders(uid) {

    try {

        /*
            SECURITY:
            Only request orders belonging
            to the logged-in user.
        */

        const ordersQuery =
            query(
                ref(
                    database,
                    "orders"
                ),
                orderByChild("uid"),
                equalTo(uid)
            );


        const snapshot =
            await get(
                ordersQuery
            );


        if (!snapshot.exists()) {

            ordersContainer.innerHTML = `

                <div
                    class="text-center text-muted py-5"
                >

                    <i class="bi bi-cart-x fs-1"></i>

                    <p class="mt-3">

                        You have not placed any orders yet.

                    </p>

                    <a
                        href="order.html"
                        class="btn btn-success"
                    >

                        <i class="bi bi-cart-plus"></i>

                        Place Your First Order

                    </a>

                </div>

            `;

            return;

        }


        const orders =
            snapshot.val();


        const userOrders =
            Object.values(
                orders
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


        if (
            userOrders.length === 0
        ) {

            ordersContainer.innerHTML = `

                <div
                    class="text-center text-muted py-5"
                >

                    <i class="bi bi-cart-x fs-1"></i>

                    <p class="mt-3">

                        You have not placed any orders yet.

                    </p>

                    <a
                        href="order.html"
                        class="btn btn-success"
                    >

                        <i class="bi bi-cart-plus"></i>

                        Place Order

                    </a>

                </div>

            `;

            return;

        }


        let html = `

            <table
                class="table table-hover align-middle"
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


        userOrders.forEach(
            order => {

                const orderId =
                    order.orderId ||
                    "—";


                html += `

                    <tr>

                        <td>

                            <code>
                                ${String(
                                    orderId
                                ).slice(0, 12)}
                            </code>

                        </td>


                        <td>

                            <strong>
                                ${order.platform || "—"}
                            </strong>

                            <br>

                            <small
                                class="text-muted"
                            >

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


        ordersContainer.innerHTML =
            html;


    } catch (error) {

        console.error(
            "RECENT ORDERS ERROR:",
            error
        );


        ordersContainer.innerHTML = `

            <div class="alert alert-danger">

                Unable to load your orders.

                Please try again.

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


        await loadOrders(
            user.uid
        );

    }
);
