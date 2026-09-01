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
    get,
    set,
    update,
    remove,
    push
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


const usersTableBody =
    document.getElementById("usersTableBody");

const ordersTableBody =
    document.getElementById("ordersTableBody");

const transactionsTableBody =
    document.getElementById("transactionsTableBody");

const servicesTableBody =
    document.getElementById("servicesTableBody");

const vouchersTableBody =
    document.getElementById("vouchersTableBody");


const usersMessage =
    document.getElementById("usersMessage");

const ordersMessage =
    document.getElementById("ordersMessage");

const transactionsMessage =
    document.getElementById("transactionsMessage");

const servicesMessage =
    document.getElementById("servicesMessage");

const vouchersMessage =
    document.getElementById("vouchersMessage");


const refreshUsers =
    document.getElementById("refreshUsers");

const refreshOrders =
    document.getElementById("refreshOrders");

const refreshTransactions =
    document.getElementById("refreshTransactions");

const refreshVouchers =
    document.getElementById("refreshVouchers");

const addServiceBtn =
    document.getElementById("addServiceBtn");

const createVoucherForm =
    document.getElementById("createVoucherForm");

const voucherCodeInput =
    document.getElementById("voucherCodeInput");

const voucherAmountInput =
    document.getElementById("voucherAmountInput");

const createVoucherMsg =
    document.getElementById("createVoucherMsg");


const serviceModalElement =
    document.getElementById("serviceModal");

const serviceModal =
    serviceModalElement &&
    window.bootstrap
        ? new window.bootstrap.Modal(
            serviceModalElement
        )
        : null;


const serviceForm =
    document.getElementById("serviceForm");

const serviceModalTitle =
    document.getElementById("serviceModalTitle");

const serviceId =
    document.getElementById("serviceId");

const servicePlatform =
    document.getElementById("servicePlatform");

const serviceName =
    document.getElementById("serviceName");

const servicePrice =
    document.getElementById("servicePrice");

const serviceMin =
    document.getElementById("serviceMin");

const serviceMax =
    document.getElementById("serviceMax");

const serviceStatus =
    document.getElementById("serviceStatus");

/* =========================================================
   ACCOUNTS MARKETPLACE ELEMENTS
========================================================= */

const adminAddAccountForm =
    document.getElementById("adminAddAccountForm");

const adminPlatform =
    document.getElementById("adminPlatform");

const adminNiche =
    document.getElementById("adminNiche");

const adminFollowers =
    document.getElementById("adminFollowers");

const adminPrice =
    document.getElementById("adminPrice");

const adminCredentials =
    document.getElementById("adminCredentials");

const adminAccountMsg =
    document.getElementById("adminAccountMsg");

const adminAccountsTableBody =
    document.getElementById("adminAccountsTableBody");

const adminAccountsMessage =
    document.getElementById("adminAccountsMessage");

const refreshAccounts =
    document.getElementById("refreshAccounts");


/* =========================================================
   GLOBAL DATA
========================================================= */

let currentUser = null;

let usersData = {};
let ordersData = {};
let transactionsData = {};
let servicesData = {};
let vouchersData = {};
let accountsData = {};


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
   SHORT DATE
========================================================= */

function formatShortDate(timestamp) {

    if (!timestamp) {
        return "—";
    }

    const date =
        new Date(Number(timestamp));

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString(
        "en-NG",
        {
            month: "short",
            day: "numeric"
        }
    );

}


/* =========================================================
   FORMAT ACCOUNT AGE
========================================================= */

function formatAccountAge(timestamp) {

    if (!timestamp) {
        return "—";
    }

    const created =
        new Date(Number(timestamp));

    const now =
        new Date();

    if (Number.isNaN(created.getTime())) {
        return "—";
    }

    const diffTime =
        Math.abs(now - created);

    const diffDays =
        Math.floor(
            diffTime /
            (1000 * 60 * 60 * 24)
        );

    if (diffDays === 0) {
        return "Created today";
    } else if (diffDays === 1) {
        return "1 day old";
    } else if (diffDays < 30) {
        return `${diffDays} days old`;
    } else if (diffDays < 365) {
        const months =
            Math.floor(diffDays / 30);
        return months === 1
            ? "1 month old"
            : `${months} months old`;
    } else {
        const years =
            (diffDays / 365).toFixed(1);
        return `${years} years old`;
    }

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
   NORMALIZE ORDER STATUS
========================================================= */

function normalizeOrderStatus(status) {

    const value =
        String(status || "pending")
            .toLowerCase()
            .trim();


    if (value === "cancelled") {
        return "canceled";
    }


    if (
        value === "refund" ||
        value === "refunded"
    ) {
        return "refunded";
    }


    return value;

}


/* =========================================================
   DISPLAY ORDER STATUS
========================================================= */

function displayOrderStatus(status) {

    const normalized =
        normalizeOrderStatus(status);


    const names = {

        pending:
            "Pending",

        processing:
            "Processing",

        completed:
            "Completed",

        canceled:
            "Canceled",

        failed:
            "Failed",

        refunded:
            "Refunded"

    };


    return (
        names[normalized] ||
        normalized.charAt(0).toUpperCase() +
        normalized.slice(1)
    );

}


/* =========================================================
   ACCOUNT TIER BADGE
========================================================= */

function tierBadge(tier) {

    const safeTier =
        String(tier || "regular")
            .toLowerCase()
            .trim();


    if (safeTier === "reseller") {

        return `
            <span class="badge bg-primary">
                <i class="bi bi-star-fill"></i>
                Reseller
            </span>
        `;

    }


    if (safeTier === "vip") {

        return `
            <span class="badge bg-warning text-dark">
                <i class="bi bi-gem"></i>
                VIP
            </span>
        `;

    }


    return `
        <span class="badge bg-secondary">
            Regular
        </span>
    `;

}


/* =========================================================
   STATUS BADGE
========================================================= */

function statusBadge(status) {

    const safeStatus =
        normalizeOrderStatus(status);


    let badgeClass =
        "bg-secondary";


    if (safeStatus === "pending") {

        badgeClass =
            "bg-warning text-dark";

    }


    else if (
        safeStatus === "processing"
    ) {

        badgeClass =
            "bg-info text-dark";

    }


    else if (
        safeStatus === "completed" ||
        safeStatus === "success" ||
        safeStatus === "available"
    ) {

        badgeClass =
            "bg-success";

    }


    else if (
        safeStatus === "canceled" ||
        safeStatus === "failed"
    ) {

        badgeClass =
            "bg-danger";

    }


    else if (
        safeStatus === "refunded" ||
        safeStatus === "sold"
    ) {

        badgeClass =
            "bg-warning text-dark";

    }


    return `
        <span class="badge ${badgeClass}">
            ${escapeHtml(
                displayOrderStatus(
                    safeStatus
                )
            )}
        </span>
    `;

}


/* =========================================================
   ORDER STATUS OPTIONS
========================================================= */

function orderStatusSelect(
    orderId,
    currentStatus
) {

    const safeStatus =
        normalizeOrderStatus(
            currentStatus
        );


    const statuses = [

        "pending",
        "processing",
        "completed",
        "canceled",
        "failed",
        "refunded"

    ];


    let options = "";


    statuses.forEach(status => {

        const selected =
            status === safeStatus
                ? "selected"
                : "";


        options += `
            <option
                value="${status}"
                ${selected}
            >
                ${escapeHtml(
                    displayOrderStatus(
                        status
                    )
                )}
            </option>
        `;

    });


    return `
        <select
            class="form-select form-select-sm order-status-select"
            data-order-id="${escapeHtml(
                orderId
            )}"
            style="min-width:135px;font-weight:600;"
        >
            ${options}
        </select>
    `;

}


/* =========================================================
   ACCESS CONTROL
========================================================= */

function showAccessDenied(message) {

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
   MANAGEMENT NAVIGATION
========================================================= */

document
    .querySelectorAll(".admin-nav-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const sectionId =
                    button.dataset.section;


                document
                    .querySelectorAll(
                        ".management-section"
                    )
                    .forEach(section => {

                        section.classList
                            .remove("active");

                    });


                const selectedSection =
                    document.getElementById(
                        sectionId
                    );


                if (selectedSection) {

                    selectedSection.classList
                        .add("active");

                }


                document
                    .querySelectorAll(
                        ".admin-nav-btn"
                    )
                    .forEach(navButton => {

                        navButton.classList
                            .remove(
                                "btn-primary",
                                "btn-success"
                            );

                        navButton.classList
                            .add(
                                "btn-outline-secondary"
                            );

                    });


                button.classList
                    .remove(
                        "btn-outline-secondary"
                    );


                button.classList
                    .add(
                        "btn-primary"
                    );


                if (
                    sectionId ===
                    "usersSection"
                ) {

                    loadUsers();

                }


                if (
                    sectionId ===
                    "ordersSection"
                ) {

                    loadOrders();

                }


                if (
                    sectionId ===
                    "transactionsSection"
                ) {

                    loadTransactions();

                }


                if (
                    sectionId ===
                    "servicesSection"
                ) {

                    loadServices();

                }


                if (
                    sectionId ===
                    "vouchersSection"
                ) {

                    loadVouchers();

                }

                if (
                    sectionId ===
                    "accountsSection"
                ) {

                    loadAdminAccounts();

                }

            }
        );

    });


/* =========================================================
   LOAD USERS
========================================================= */

async function loadUsers() {

    if (usersMessage) {

        usersMessage.textContent =
            "Loading users...";

    }


    if (usersTableBody) {

        usersTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="text-center text-muted"
                >
                    Loading...
                </td>
            </tr>
        `;

    }


    try {

        const snapshot =
            await get(
                ref(
                    database,
                    "users"
                )
            );


        usersData =
            snapshot.exists()
                ? snapshot.val()
                : {};


        const users =
            Object.entries(
                usersData
            );


        if (totalUsers) {

            totalUsers.textContent =
                users.length;

        }


        if (users.length === 0) {

            if (usersTableBody) {

                usersTableBody.innerHTML = `
                    <tr>
                        <td
                            colspan="6"
                            class="text-center text-muted"
                        >
                            No users found.
                        </td>
                    </tr>
                `;

            }


            if (usersMessage) {

                usersMessage.textContent =
                    "No users found.";

            }

            return;

        }


        if (usersMessage) {

            usersMessage.textContent =
                `${users.length} user(s) found.`;

        }


        let html = "";


        for (
            const [uid, user]
            of users
        ) {

            const userOrders =
                Object.values(
                    ordersData || {}
                )
                .filter(order => {

                    return (
                        order &&
                        String(
                            order.uid
                        ) === String(uid)
                    );

                })
                .length;


            const userTier =
                String(
                    user?.tier ||
                    "regular"
                )
                .toLowerCase()
                .trim();


            const accountStatus =
                user?.status ||
                "active";


            const isActive =
                String(
                    accountStatus
                ).toLowerCase() !==
                "inactive";


            html += `
                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(
                                user?.fullName ||
                                user?.name ||
                                "User"
                            )}
                        </strong>
                    </td>


                    <td>
                        ${escapeHtml(
                            user?.email ||
                            "—"
                        )}
                    </td>


                    <td>
                        <strong>
                            ${formatNaira(
                                user?.wallet
                            )}
                        </strong>
                    </td>


                    <td>
                        ${tierBadge(
                            userTier
                        )}
                    </td>


                    <td>
                        ${userOrders}
                    </td>


                    <td>

                        ${
                            isActive

                                ? `
                                    <span
                                        class="badge bg-success"
                                    >
                                        Active
                                    </span>
                                `

                                : `
                                    <span
                                        class="badge bg-danger"
                                    >
                                        Inactive
                                    </span>
                                `
                        }

                    </td>

                </tr>
            `;

        }


        if (usersTableBody) {

            usersTableBody.innerHTML =
                html;

        }


    } catch (error) {

        console.error(
            "LOAD USERS ERROR:",
            error
        );


        if (usersMessage) {

            usersMessage.textContent =
                "Unable to load users.";

        }


        if (usersTableBody) {

            usersTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="text-center text-danger"
                    >
                        Unable to load users.
                    </td>
                </tr>
            `;

        }

    }

}


/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders() {

    if (ordersMessage) {

        ordersMessage.textContent =
            "Loading orders...";

    }


    if (ordersTableBody) {

        ordersTableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="text-center text-muted"
                >
                    Loading...
                </td>
            </tr>
        `;

    }


    try {

        const snapshot =
            await get(
                ref(
                    database,
                    "orders"
                )
            );


        ordersData =
            snapshot.exists()
                ? snapshot.val()
                : {};


        const orders =
            Object.entries(
                ordersData
            );


        let pending = 0;

        let completed = 0;


        orders.forEach(
            ([, order]) => {

                const status =
                    normalizeOrderStatus(
                        order?.status
                    );


                if (
                    status ===
                    "pending"
                ) {

                    pending++;

                }


                if (
                    status ===
                    "completed"
                ) {

                    completed++;

                }

            }
        );


        if (totalOrders) {

            totalOrders.textContent =
                orders.length;

        }


        if (pendingOrders) {

            pendingOrders.textContent =
                pending;

        }


        if (completedOrders) {

            completedOrders.textContent =
                completed;

        }


        if (orders.length === 0) {

            if (ordersTableBody) {

                ordersTableBody.innerHTML = `
                    <tr>
                        <td
                            colspan="8"
                            class="text-center text-muted"
                        >
                            No orders found.
                        </td>
                    </tr>
                `;

            }


            if (ordersMessage) {

                ordersMessage.textContent =
                    "No orders found.";

            }

            return;

        }


        if (ordersMessage) {

            ordersMessage.textContent =
                `${orders.length} order(s) found.`;

        }


        orders.sort(
            ([, a], [, b]) => {

                return Number(
                    b?.createdAt ||
                    b?.timestamp ||
                    0
                ) -
                Number(
                    a?.createdAt ||
                    a?.timestamp ||
                    0
                );

            }
        );


        let html = "";


        orders.forEach(
            ([id, order]) => {

                const orderId =
                    order?.orderId ||
                    id;


                const userEmail =
                    order?.email ||
                    order?.userEmail ||
                    "—";


                const platform =
                    order?.platform ||
                    "—";


                const service =
                    order?.service ||
                    order?.serviceName ||
                    order?.name ||
                    "—";


                const link =
                    order?.link ||
                    "";


                const quantity =
                    Number(
                        order?.quantity ||
                        0
                    );


                const amount =
                    Number(
                        order?.amount ||
                        0
                    );


                const status =
                    normalizeOrderStatus(
                        order?.status
                    );


                const createdAt =
                    order?.createdAt ||
                    order?.timestamp ||
                    0;


                html += `
                    <tr>

                        <td>
                            <code>
                                ${escapeHtml(
                                    String(
                                        orderId
                                    ).slice(
                                        0,
                                        14
                                    )
                                )}
                            </code>
                        </td>


                        <td>
                            ${escapeHtml(
                                userEmail
                            )}
                        </td>


                        <td>

                            <strong>
                                ${escapeHtml(
                                    platform
                                )}
                            </strong>

                            <br>

                            <small
                                class="text-muted"
                            >
                                ${escapeHtml(
                                    service
                                )}
                            </small>

                        </td>


                        <td>

                            ${
                                link

                                    ? `
                                        <a
                                            href="${escapeHtml(
                                                link
                                            )}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="text-decoration-underline text-truncate d-inline-block"
                                            style="max-width:140px;"
                                            title="${escapeHtml(
                                                link
                                            )}"
                                        >
                                            ${escapeHtml(
                                                link
                                            )}
                                        </a>
                                    `

                                    : "—"
                            }

                        </td>


                        <td>
                            ${quantity.toLocaleString(
                                "en-NG"
                            )}
                        </td>


                        <td>
                            <strong>
                                ${formatNaira(
                                    amount
                                )}
                            </strong>
                        </td>


                        <td>
                            ${orderStatusSelect(
                                id,
                                status
                            )}
                        </td>


                        <td>
                            <small>
                                ${formatShortDate(
                                    createdAt
                                )}
                            </small>
                        </td>

                    </tr>
                `;

            }
        );


        if (ordersTableBody) {

            ordersTableBody.innerHTML =
                html;

        }


    } catch (error) {

        console.error(
            "LOAD ORDERS ERROR:",
            error
        );


        if (ordersMessage) {

            ordersMessage.textContent =
                "Unable to load orders.";

        }


        if (ordersTableBody) {

            ordersTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="text-center text-danger"
                    >
                        Unable to load orders.
                    </td>
                </tr>
            `;

        }

    }

}


/* =========================================================
   REFUND ORDER
========================================================= */

async function refundOrder(
    orderId,
    order
) {

    if (!order) {

        throw new Error(
            "Order could not be found."
        );

    }


    if (
        order.refundedAt ||
        order.refundTransactionId ||
        normalizeOrderStatus(
            order.status
        ) === "refunded"
    ) {

        throw new Error(
            "This order has already been refunded."
        );

    }


    const uid =
        order.uid;


    const amount =
        Number(
            order.amount || 0
        );


    if (!uid) {

        throw new Error(
            "This order does not have a valid user ID."
        );

    }


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        throw new Error(
            "This order does not have a valid refund amount."
        );

    }


    const userRef =
        ref(
            database,
            "users/" +
            uid
        );


    const userSnapshot =
        await get(
            userRef
        );


    if (!userSnapshot.exists()) {

        throw new Error(
            "Customer account could not be found."
        );

    }


    const userData =
        userSnapshot.val() || {};


    const currentWallet =
        Number(
            userData.wallet || 0
        );


    const newWalletBalance =
        currentWallet +
        amount;


    const refundTransactionRef =
        push(
            ref(
                database,
                "transactions"
            )
        );


    const transactionKey =
        refundTransactionRef.key;


    const transactionId =
        "REF-" +
        Date.now();


    const now =
        Date.now();


    await update(
        userRef,
        {

            wallet:
                newWalletBalance,

            updatedAt:
                now

        }
    );


    await set(
        refundTransactionRef,
        {

            transactionId,

            uid,

            email:
                order?.email ||
                order?.userEmail ||
                userData?.email ||
                "—",

            type:
                "Refund",

            description:
                `Refund for order ${
                    order?.orderId ||
                    orderId
                }`,

            amount,

            status:
                "completed",

            orderId:
                order?.orderId ||
                orderId,

            createdAt:
                now

        }
    );


    await update(
        ref(
            database,
            "orders/" +
            orderId
        ),
        {

            status:
                "refunded",

            refundedAt:
                now,

            refundTransactionId:
                transactionKey,

            updatedAt:
                now

        }
    );


    return {

        newWalletBalance,

        transactionId

    };

}


/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

async function updateOrderStatus(
    orderId,
    newStatus,
    selectElement
) {

    if (!orderId) {
        return;
    }


    const allowedStatuses = [

        "pending",
        "processing",
        "completed",
        "canceled",
        "failed",
        "refunded"

    ];


    const status =
        normalizeOrderStatus(
            newStatus
        );


    if (
        !allowedStatuses.includes(
            status
        )
    ) {

        alert(
            "Invalid order status."
        );

        await loadOrders();

        return;

    }


    try {

        if (selectElement) {

            selectElement.disabled =
                true;

        }


        const order =
            ordersData[orderId] ||
            {};


        const oldStatus =
            normalizeOrderStatus(
                order.status
            );


        if (
            status === "refunded"
        ) {

            if (
                oldStatus ===
                "refunded" ||
                order.refundedAt ||
                order.refundTransactionId
            ) {

                throw new Error(
                    "This order has already been refunded."
                );

            }


            await refundOrder(
                orderId,
                order
            );

        }


        else {

            await update(
                ref(
                    database,
                    "orders/" +
                    orderId
                ),
                {

                    status,

                    updatedAt:
                        Date.now()

                }
            );

        }


        if (
            ordersData &&
            ordersData[orderId]
        ) {

            ordersData[
                orderId
            ].status =
                status;

            ordersData[
                orderId
            ].updatedAt =
                Date.now();

        }


        await loadOrders();


        if (status === "refunded") {

            if (ordersMessage) {

                ordersMessage.textContent =
                    "Order refunded successfully. The customer's wallet has been credited and the refund transaction has been recorded.";

            }

        }


        else {

            if (ordersMessage) {

                ordersMessage.textContent =
                    `Order status changed to ${displayOrderStatus(
                        status
                    )}.`;

            }

        }


    } catch (error) {

        console.error(
            "UPDATE ORDER STATUS ERROR:",
            error
        );


        alert(
            error?.message ||
            "Unable to update order status."
        );


        await loadOrders();


    } finally {

        if (selectElement) {

            selectElement.disabled =
                false;

        }

    }

}


if (ordersTableBody) {

    ordersTableBody.addEventListener(
        "change",
        async event => {

            const select =
                event.target.closest(
                    ".order-status-select"
                );


            if (!select) {
                return;
            }


            await updateOrderStatus(
                select.dataset.orderId,
                select.value,
                select
            );

        }
    );

}


/* =========================================================
   LOAD TRANSACTIONS
========================================================= */

async function loadTransactions() {

    if (transactionsMessage) {

        transactionsMessage.textContent =
            "Loading transactions...";

    }


    if (transactionsTableBody) {

        transactionsTableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="text-center text-muted"
                >
                    Loading...
                </td>
            </tr>
        `;

    }


    try {

        const snapshot =
            await get(
                ref(
                    database,
                    "transactions"
                )
            );


        transactionsData =
            snapshot.exists()
                ? snapshot.val()
                : {};


        const transactions =
            Object.entries(
                transactionsData
            );


        if (
            transactions.length ===
            0
        ) {

            if (transactionsTableBody) {

                transactionsTableBody.innerHTML = `
                    <tr>
                        <td
                            colspan="7"
                            class="text-center text-muted"
                        >
                            No transactions found.
                        </td>
                    </tr>
                `;

            }


            if (transactionsMessage) {

                transactionsMessage.textContent =
                    "No transactions found.";

            }

            return;

        }


        if (transactionsMessage) {

            transactionsMessage.textContent =
                `${transactions.length} transaction(s) found.`;

        }


        transactions.sort(
            ([, a], [, b]) => {

                return Number(
                    b?.createdAt ||
                    b?.timestamp ||
                    0
                ) -
                Number(
                    a?.createdAt ||
                    a?.timestamp ||
                    0
                );

            }
        );


        let html = "";


        transactions.forEach(
            ([id, transaction]) => {

                const transactionId =
                    transaction?.transactionId ||
                    transaction?.reference ||
                    id;


                const user =
                    transaction?.email ||
                    transaction?.userEmail ||
                    transaction?.uid ||
                    "—";


                const type =
                    transaction?.type ||
                    "Deposit";


                const description =
                    transaction?.description ||
                    "—";


                const amount =
                    Number(
                        transaction?.amount ||
                        0
                    );


                const status =
                    transaction?.status ||
                    "completed";


                const date =
                    transaction?.createdAt ||
                    transaction?.timestamp ||
                    0;


                const isResellerUpgrade =
                    String(type)
                        .toLowerCase()
                        .trim() ===
                    "reseller upgrade";


                const isRefund =
                    String(type)
                        .toLowerCase()
                        .trim() ===
                    "refund";


                html += `
                    <tr>

                        <td>
                            <code>
                                ${escapeHtml(
                                    String(
                                        transactionId
                                    ).slice(
                                        0,
                                        16
                                    )
                                )}
                            </code>
                        </td>


                        <td>
                            ${escapeHtml(
                                user
                            )}
                        </td>


                        <td>

                            ${
                                isResellerUpgrade

                                    ? `
                                        <span
                                            class="badge bg-primary"
                                        >
                                            <i
                                                class="bi bi-star-fill"
                                            ></i>
                                            Reseller Upgrade
                                        </span>
                                    `

                                    : isRefund

                                    ? `
                                        <span
                                            class="badge bg-warning text-dark"
                                        >
                                            <i
                                                class="bi bi-arrow-counterclockwise"
                                            ></i>
                                            Refund
                                        </span>
                                    `

                                    : `
                                        <span
                                            class="badge bg-secondary"
                                        >
                                            ${escapeHtml(
                                                type
                                            )}
                                        </span>
                                    `
                            }

                        </td>


                        <td>
                            ${escapeHtml(
                                description
                            )}
                        </td>


                        <td>
                            <strong>
                                ${formatNaira(
                                    amount
                                )}
                            </strong>
                        </td>


                        <td>
                            ${statusBadge(
                                status
                            )}
                        </td>


                        <td>
                            <small>
                                ${formatDate(
                                    date
                                )}
                            </small>
                        </td>

                    </tr>
                `;

            }
        );


        if (transactionsTableBody) {

            transactionsTableBody.innerHTML =
                html;

        }


    } catch (error) {

        console.error(
            "LOAD TRANSACTIONS ERROR:",
            error
        );


        if (transactionsMessage) {

            transactionsMessage.textContent =
                "Unable to load transactions.";

        }


        if (transactionsTableBody) {

            transactionsTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="text-center text-danger"
                    >
                        Unable to load transactions.
                    </td>
                </tr>
            `;

        }

    }

}


/* =========================================================
   LOAD SERVICES
========================================================= */

async function loadServices() {

    if (servicesMessage) {

        servicesMessage.textContent =
            "Loading services...";

    }


    if (servicesTableBody) {

        servicesTableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="text-center text-muted"
                >
                    Loading...
                </td>
            </tr>
        `;

    }


    try {

        const snapshot =
            await get(
                ref(
                    database,
                    "services"
                )
            );


        servicesData =
            snapshot.exists()
                ? snapshot.val()
                : {};


        const services =
            Object.entries(
                servicesData
            );


        if (
            services.length ===
            0
        ) {

            if (servicesMessage) {

                servicesMessage.textContent =
                    "No services have been created yet.";

            }


            if (servicesTableBody) {

                servicesTableBody.innerHTML = `
                    <tr>
                        <td
                            colspan="7"
                            class="text-center text-muted"
                        >
                            No services yet.
                        </td>
                    </tr>
                `;

            }

            return;

        }


        if (servicesMessage) {

            servicesMessage.textContent =
                `${services.length} service(s) found.`;

        }


        let html = "";


        services.forEach(
            ([id, service]) => {

                const platform =
                    service?.platform ||
                    "—";


                const name =
                    service?.name ||
                    service?.service ||
                    "—";


                const price =
                    Number(
                        service?.price ||
                        0
                    );


                const min =
                    Number(
                        service?.min ||
                        0
                    );


                const max =
                    Number(
                        service?.max ||
                        0
                    );


                const status =
                    String(
                        service?.status ||
                        "active"
                    ).toLowerCase();


                const active =
                    status ===
                    "active";


                html += `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    platform
                                )}
                            </strong>
                        </td>


                        <td>
                            ${escapeHtml(
                                name
                            )}
                        </td>


                        <td>
                            <strong>
                                ${formatNaira(
                                    price
                                )}
                            </strong>
                        </td>


                        <td>
                            ${min.toLocaleString(
                                "en-NG"
                            )}
                        </td>


                        <td>
                            ${max.toLocaleString(
                                "en-NG"
                            )}
                        </td>


                        <td>

                            ${
                                active

                                    ? `
                                        <span
                                            class="badge bg-success"
                                        >
                                            Active
                                        </span>
                                    `

                                    : `
                                        <span
                                            class="badge bg-secondary"
                                        >
                                            Inactive
                                        </span>
                                    `
                            }

                        </td>


                        <td>

                            <div
                                class="d-flex flex-wrap gap-1"
                            >

                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-primary action-btn"
                                    data-action="edit-service"
                                    data-id="${escapeHtml(
                                        id
                                    )}"
                                >
                                    <i
                                        class="bi bi-pencil"
                                    ></i>
                                    Edit
                                </button>


                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-danger action-btn"
                                    data-action="delete-service"
                                    data-id="${escapeHtml(
                                        id
                                    )}"
                                >
                                    <i
                                        class="bi bi-trash"
                                    ></i>
                                    Delete
                                </button>

                            </div>

                        </td>

                    </tr>
                `;

            }
        );


        if (servicesTableBody) {

            servicesTableBody.innerHTML =
                html;

        }


    } catch (error) {

        console.error(
            "LOAD SERVICES ERROR:",
            error
        );


        if (servicesMessage) {

            servicesMessage.textContent =
                "Unable to load services.";

        }


        if (servicesTableBody) {

            servicesTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="text-center text-danger"
                    >
                        Unable to load services.
                    </td>
                </tr>
            `;

        }

    }

}


/* =========================================================
   LOAD VOUCHERS
========================================================= */

async function loadVouchers() {

    if (vouchersMessage) {

        vouchersMessage.textContent =
            "Loading vouchers...";

    }


    if (vouchersTableBody) {

        vouchersTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="text-center text-muted"
                >
                    Loading...
                </td>
            </tr>
        `;

    }


    try {

        const snapshot =
            await get(
                ref(
                    database,
                    "vouchers"
                )
            );


        vouchersData =
            snapshot.exists()
                ? snapshot.val()
                : {};


        const vouchers =
            Object.entries(
                vouchersData
            );


        if (
            vouchers.length ===
            0
        ) {

            if (vouchersTableBody) {

                vouchersTableBody.innerHTML = `
                    <tr>
                        <td
                            colspan="6"
                            class="text-center text-muted"
                        >
                            No vouchers created yet.
                        </td>
                    </tr>
                `;

            }


            if (vouchersMessage) {

                vouchersMessage.textContent =
                    "No vouchers found.";

            }

            return;

        }


        if (vouchersMessage) {

            vouchersMessage.textContent =
                `${vouchers.length} voucher(s) found.`;

        }


        let html = "";


        vouchers.sort(
            ([, a], [, b]) => {

                return Number(
                    b?.createdAt ||
                    0
                ) -
                Number(
                    a?.createdAt ||
                    0
                );

            }
        );


        vouchers.forEach(
            ([code, voucher]) => {

                const amount =
                    Number(
                        voucher?.amount ||
                        0
                    );


                const isUsed =
                    Boolean(
                        voucher?.isUsed
                    );


                const createdAt =
                    voucher?.createdAt ||
                    0;


                html += `
                    <tr>

                        <td>
                            <code>
                                ${escapeHtml(
                                    code
                                )}
                            </code>
                        </td>


                        <td>
                            <strong>
                                ${formatNaira(
                                    amount
                                )}
                            </strong>
                        </td>


                        <td>

                            ${
                                isUsed

                                    ? `
                                        <span
                                            class="badge bg-secondary"
                                        >
                                            Used
                                        </span>
                                    `

                                    : `
                                        <span
                                            class="badge bg-success"
                                        >
                                            Available
                                        </span>
                                    `
                            }

                        </td>


                        <td>
                            ${escapeHtml(
                                voucher?.usedBy ||
                                "—"
                            )}
                        </td>


                        <td>
                            <small>
                                ${formatDate(
                                    createdAt
                                )}
                            </small>
                        </td>


                        <td>

                            <button
                                type="button"
                                class="btn btn-sm btn-outline-danger action-btn"
                                data-action="delete-voucher"
                                data-code="${escapeHtml(
                                    code
                                )}"
                            >
                                <i
                                    class="bi bi-trash"
                                ></i>
                                Delete
                            </button>

                        </td>

                    </tr>
                `;

            }
        );


        if (vouchersTableBody) {

            vouchersTableBody.innerHTML =
                html;

        }


    } catch (error) {

        console.error(
            "LOAD VOUCHERS ERROR:",
            error
        );


        if (vouchersMessage) {

            vouchersMessage.textContent =
                "Unable to load vouchers.";

        }


        if (vouchersTableBody) {

            vouchersTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="text-center text-danger"
                    >
                        Unable to load vouchers.
                    </td>
                </tr>
            `;

        }

    }

}


/* =========================================================
   LOAD ADMIN ACCOUNTS MARKETPLACE
========================================================= */

async function loadAdminAccounts() {

    if (adminAccountsMessage) {

        adminAccountsMessage.textContent =
            "Loading accounts inventory...";

    }


    if (adminAccountsTableBody) {

        adminAccountsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">Loading...</td>
            </tr>
        `;

    }


    try {

        const snapshot =
            await get(
                ref(
                    database,
                    "accounts"
                )
            );


        accountsData =
            snapshot.exists()
                ? snapshot.val()
                : {};


        const accounts =
            Object.entries(
                accountsData
            );


        if (accounts.length === 0) {

            if (adminAccountsTableBody) {

                adminAccountsTableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center text-muted">No accounts in inventory.</td>
                    </tr>
                `;

            }


            if (adminAccountsMessage) {

                adminAccountsMessage.textContent =
                    "No accounts found.";

            }

            return;

        }


        if (adminAccountsMessage) {

            adminAccountsMessage.textContent =
                `${accounts.length} account(s) found.`;

        }


        let html = "";


        accounts.sort(
            ([, a], [, b]) => {

                return Number(
                    b?.createdAt ||
                    0
                ) -
                Number(
                    a?.createdAt ||
                    0
                );

            }
        );


        accounts.forEach(
            ([id, account]) => {

                const platform =
                    account?.platform ||
                    "—";


                const niche =
                    account?.niche ||
                    "—";


                const followers =
                    Number(
                        account?.followers ||
                        0
                    );


                const price =
                    Number(
                        account?.price ||
                        0
                    );


                const credentials =
                    account?.credentials ||
                    "—";


                const status =
                    account?.status ||
                    "available";


                const accountAge =
                    account?.createdAt ||
                    account?.timestamp ||
                    0;


                html += `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    platform
                                )}
                            </strong>
                        </td>


                        <td>
                            ${escapeHtml(
                                niche
                            )}
                        </td>


                        <td>
                            ${followers.toLocaleString(
                                "en-NG"
                            )}
                        </td>


                        <td>
                            <strong>
                                ${formatNaira(
                                    price
                                )}
                            </strong>
                        </td>


                        <td>
                            <code>
                                ${escapeHtml(
                                    credentials
                                )}
                            </code>
                        </td>


                        <td>
                            <span class="badge bg-info text-dark">
                                ${escapeHtml(
                                    formatAccountAge(
                                        accountAge
                                    )
                                )}
                            </span>
                        </td>


                        <td>
                            ${statusBadge(
                                status
                            )}
                        </td>


                        <td>
                            <button
                                type="button"
                                class="btn btn-sm btn-outline-danger action-btn"
                                data-action="delete-account"
                                data-id="${escapeHtml(
                                    id
                                )}"
                            >
                                <i class="bi bi-trash"></i>
                                Delete
                            </button>
                        </td>

                    </tr>
                `;

            }
        );


        if (adminAccountsTableBody) {

            adminAccountsTableBody.innerHTML =
                html;

        }


    } catch (error) {

        console.error(
            "LOAD ACCOUNTS ERROR:",
            error
        );


        if (adminAccountsMessage) {

            adminAccountsMessage.textContent =
                "Unable to load accounts inventory.";

        }


        if (adminAccountsTableBody) {

            adminAccountsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-danger">Unable to load accounts.</td>
                </tr>
            `;

        }

    }

}


/* =========================================================
   ADD ACCOUNT FORM HANDLER
========================================================= */

if (adminAddAccountForm) {

    adminAddAccountForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                !adminPlatform ||
                !adminNiche ||
                !adminFollowers ||
                !adminPrice ||
                !adminCredentials
            ) {

                return;

            }


            const platform =
                adminPlatform.value.trim();


            const niche =
                adminNiche.value.trim();


            const followers =
                Number(
                    adminFollowers.value
                );


            const price =
                Number(
                    adminPrice.value
                );


            const credentials =
                adminCredentials.value.trim();


            if (
                !platform ||
                !niche ||
                !credentials
            ) {

                alert(
                    "Please fill out all fields correctly."
                );

                return;

            }


            try {

                if (adminAccountMsg) {

                    adminAccountMsg.innerHTML = `
                        <div class="alert alert-info mb-0">
                            Publishing account...
                        </div>
                    `;

                }


                const newAccountRef =
                    push(
                        ref(
                            database,
                            "accounts"
                        )
                    );


                const accountData = {

                    platform,

                    niche,

                    followers,

                    price,

                    credentials,

                    status:
                        "available",

                    createdAt:
                        Date.now()

                };


                await set(
                    newAccountRef,
                    accountData
                );


                if (adminAccountMsg) {

                    adminAccountMsg.innerHTML = `
                        <div class="alert alert-success mb-0">
                            Account published to marketplace successfully!
                        </div>
                    `;

                }


                adminAddAccountForm.reset();

                await loadAdminAccounts();


            } catch (error) {

                console.error(
                    "ADD ACCOUNT ERROR:",
                    error
                );


                if (adminAccountMsg) {

                    adminAccountMsg.innerHTML = `
                        <div class="alert alert-danger mb-0">
                            ${escapeHtml(
                                error?.message ||
                                "Unable to publish account."
                            )}
                        </div>
                    `;

                }

            }

        }
    );

}


/* =========================================================
   ACCOUNT MARKETPLACE ACTIONS (DELETE)
========================================================= */

if (adminAccountsTableBody) {

    adminAccountsTableBody.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "button[data-action]"
                );


            if (!button) {
                return;
            }


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            if (
                action ===
                    "delete-account" &&
                id
            ) {

                if (
                    !confirm(
                        "Are you sure you want to delete this account from the inventory?"
                    )
                ) {

                    return;

                }


                try {

                    await remove(
                        ref(
                            database,
                            "accounts/" +
                            id
                        )
                    );


                    await loadAdminAccounts();

                } catch (error) {

                    console.error(
                        "DELETE ACCOUNT ERROR:",
                        error
                    );


                    alert(
                        "Unable to delete account."
                    );

                }

            }

        }
    );

}


/* =========================================================
   VOUCHER ACTIONS
========================================================= */

if (vouchersTableBody) {

    vouchersTableBody.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "button[data-action]"
                );


            if (!button) {
                return;
            }


            const action =
                button.dataset.action;


            const code =
                button.dataset.code;


            if (
                action ===
                    "delete-voucher" &&
                code
            ) {

                if (
                    !confirm(
                        `Are you sure you want to delete voucher "${code}"?`
                    )
                ) {

                    return;

                }


                try {

                    await remove(
                        ref(
                            database,
                            "vouchers/" +
                            code
                        )
                    );


                    await loadVouchers();

                } catch (error) {

                    console.error(
                        "DELETE VOUCHER ERROR:",
                        error
                    );


                    alert(
                        "Unable to delete voucher."
                    );

                }

            }

        }
    );

}


/* =========================================================
   CREATE VOUCHER
========================================================= */

if (createVoucherForm) {

    createVoucherForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                !voucherCodeInput ||
                !voucherAmountInput
            ) {

                return;

            }


            const code =
                voucherCodeInput.value
                    .trim()
                    .toUpperCase();


            const amount =
                Number(
                    voucherAmountInput.value
                );


            if (!code) {

                alert(
                    "Please enter a voucher code."
                );

                return;

            }


            if (
                !Number.isFinite(amount) ||
                amount <= 0
            ) {

                alert(
                    "Please enter a valid voucher amount."
                );

                return;

            }


            try {

                if (createVoucherMsg) {

                    createVoucherMsg.innerHTML = `
                        <div
                            class="alert alert-info mb-0"
                        >
                            Creating voucher...
                        </div>
                    `;

                }


                const voucherRef =
                    ref(
                        database,
                        "vouchers/" +
                        code
                    );


                const snapshot =
                    await get(
                        voucherRef
                    );


                if (snapshot.exists()) {

                    throw new Error(
                        "This voucher code already exists!"
                    );

                }


                await set(
                    voucherRef,
                    {

                        code,

                        amount,

                        isUsed:
                            false,

                        createdBy:
                            currentUser
                                ? currentUser.uid
                                : "admin",

                        createdAt:
                            Date.now(),

                        usedBy:
                            null

                    }
                );


                if (createVoucherMsg) {

                    createVoucherMsg.innerHTML = `
                        <div
                            class="alert alert-success mb-0"
                        >
                            Voucher
                            <strong>
                                ${escapeHtml(
                                    code
                                )}
                            </strong>
                            (${formatNaira(
                                amount
                            )})
                            created successfully!
                        </div>
                    `;

                }


                createVoucherForm.reset();

                await loadVouchers();


            } catch (error) {

                console.error(
                    "CREATE VOUCHER ERROR:",
                    error
                );


                if (createVoucherMsg) {

                    createVoucherMsg.innerHTML = `
                        <div
                            class="alert alert-danger mb-0"
                        >
                            ${escapeHtml(
                                error?.message ||
                                "Unable to create voucher."
                            )}
                        </div>
                    `;

                }

            }

        }
    );

}


/* =========================================================
   ADD SERVICE
========================================================= */

if (addServiceBtn) {

    addServiceBtn.addEventListener(
        "click",
        () => {

            if (!serviceForm) {
                return;
            }


            serviceForm.reset();


            if (serviceId) {

                serviceId.value =
                    "";

            }


            if (serviceModalTitle) {

                serviceModalTitle.textContent =
                    "Add Service";

            }


            if (serviceStatus) {

                serviceStatus.value =
                    "active";

            }


            if (serviceModal) {

                serviceModal.show();

            }

        }
    );

}


/* =========================================================
   SERVICE ACTIONS
========================================================= */

if (servicesTableBody) {

    servicesTableBody.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "button[data-action]"
                );


            if (!button) {
                return;
            }


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            if (!id) {
                return;
            }


            if (
                action ===
                "edit-service"
            ) {

                openEditService(id);

            }


            if (
                action ===
                "delete-service"
            ) {

                await deleteService(id);

            }

        }
    );

}


/* =========================================================
   EDIT SERVICE
========================================================= */

function openEditService(id) {

    const service =
        servicesData[id];


    if (!service) {

        alert(
            "Service could not be found."
        );

        return;

    }


    if (serviceId) {

        serviceId.value =
            id;

    }


    if (servicePlatform) {

        servicePlatform.value =
            service.platform ||
            "";

    }


    if (serviceName) {

        serviceName.value =
            service.name ||
            service.service ||
            "";

    }


    if (servicePrice) {

        servicePrice.value =
            Number(
                service.price ||
                0
            );

    }


    if (serviceMin) {

        serviceMin.value =
            Number(
                service.min ||
                1
            );

    }


    if (serviceMax) {

        serviceMax.value =
            Number(
                service.max ||
                1
            );

    }


    if (serviceStatus) {

        serviceStatus.value =
            service.status ||
            "active";

    }


    if (serviceModalTitle) {

        serviceModalTitle.textContent =
            "Edit Service";

    }


    if (serviceModal) {

        serviceModal.show();

    }

}


/* =========================================================
   SAVE SERVICE
========================================================= */

if (serviceForm) {

    serviceForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            try {

                const id =
                    serviceId.value.trim();


                const platform =
                    servicePlatform.value.trim();


                const name =
                    serviceName.value.trim();


                const price =
                    Number(
                        servicePrice.value
                    );


                const min =
                    Number(
                        serviceMin.value
                    );


                const max =
                    Number(
                        serviceMax.value
                    );


                const status =
                    serviceStatus.value;


                if (!platform) {

                    alert(
                        "Please enter a platform."
                    );

                    return;

                }


                if (!name) {

                    alert(
                        "Please enter a service name."
                    );

                    return;

                }


                if (
                    !Number.isFinite(price) ||
                    price < 0
                ) {

                    alert(
                        "Please enter a valid price."
                    );

                    return;

                }


                if (
                    !Number.isFinite(min) ||
                    min < 1
                ) {

                    alert(
                        "Please enter a valid minimum."
                    );

                    return;

                }


                if (
                    !Number.isFinite(max) ||
                    max < min
                ) {

                    alert(
                        "Maximum must be greater than or equal to minimum."
                    );

                    return;

                }


                const serviceData = {

                    platform,

                    name,

                    price,

                    min,

                    max,

                    status,

                    updatedAt:
                        Date.now()

                };


                let targetId =
                    id;


                if (!targetId) {

                    targetId =
                        push(
                            ref(
                                database,
                                "services"
                            )
                        ).key;

                }


                await set(
                    ref(
                        database,
                        "services/" +
                        targetId
                    ),
                    serviceData
                );


                if (serviceModal) {

                    serviceModal.hide();

                }


                await loadServices();


                alert(
                    id
                        ? "Service updated successfully."
                        : "Service added successfully."
                );


            } catch (error) {

                console.error(
                    "SAVE SERVICE ERROR:",
                    error
                );


                alert(
                    "Unable to save service."
                );

            }

        }
    );

}


/* =========================================================
   DELETE SERVICE
========================================================= */

async function deleteService(id) {

    const service =
        servicesData[id];


    if (!service) {
        return;
    }


    const serviceNameValue =
        service.name ||
        service.service ||
        "this service";


    if (
        !confirm(
            `Delete ${serviceNameValue}? This cannot be undone.`
        )
    ) {

        return;

    }


    try {

        await remove(
            ref(
                database,
                "services/" +
                id
            )
        );


        await loadServices();


        alert(
            "Service deleted successfully."
        );


    } catch (error) {

        console.error(
            "DELETE SERVICE ERROR:",
            error
        );


        alert(
            "Unable to delete service."
        );

    }

}


/* =========================================================
   REFRESH BUTTONS
========================================================= */

if (refreshUsers) {

    refreshUsers.addEventListener(
        "click",
        loadUsers
    );

}


if (refreshOrders) {

    refreshOrders.addEventListener(
        "click",
        loadOrders
    );

}


if (refreshTransactions) {

    refreshTransactions.addEventListener(
        "click",
        loadTransactions
    );

}


if (refreshVouchers) {

    refreshVouchers.addEventListener(
        "click",
        loadVouchers
    );

}


if (refreshAccounts) {

    refreshAccounts.addEventListener(
        "click",
        loadAdminAccounts
    );

}


/* =========================================================
   AUTHENTICATION
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            showAccessDenied(
                "You must be logged in to access the admin dashboard."
            );

            return;

        }


        currentUser =
            user;


        try {

            if (loadingMessage) {

                loadingMessage.textContent =
                    "Refreshing administrator credentials...";

            }


            await user.getIdToken(
                true
            );


            const tokenResult =
                await user.getIdTokenResult();


            if (
                tokenResult.claims.admin !==
                true
            ) {

                showAccessDenied(
                    "Firebase does not currently see your account as an administrator."
                );

                return;

            }


            if (adminEmail) {

                adminEmail.textContent =
                    user.email ||
                    "Administrator";

            }


            showAdminContent();


            await loadOrders();

            await loadUsers();

            await loadAdminAccounts();


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

                logoutBtn.disabled =
                    true;


                logoutBtn.textContent =
                    "Logging out...";


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


                logoutBtn.disabled =
                    false;


                logoutBtn.textContent =
                    "Logout";


                alert(
                    "Unable to log out. Please try again."
                );

            }

        }
    );

}


/* =========================================================
   INITIAL UI STATE
========================================================= */

if (adminContent) {

    adminContent.style.display =
        "none";

}


if (accessDenied) {

    accessDenied.style.display =
        "none";

}


if (adminLoading) {

    adminLoading.style.display =
        "block";

}
