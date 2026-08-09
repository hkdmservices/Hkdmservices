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


const usersMessage =
    document.getElementById("usersMessage");

const ordersMessage =
    document.getElementById("ordersMessage");

const transactionsMessage =
    document.getElementById("transactionsMessage");

const servicesMessage =
    document.getElementById("servicesMessage");


const refreshUsers =
    document.getElementById("refreshUsers");

const refreshOrders =
    document.getElementById("refreshOrders");

const refreshTransactions =
    document.getElementById("refreshTransactions");

const addServiceBtn =
    document.getElementById("addServiceBtn");


const serviceModalElement =
    document.getElementById("serviceModal");

const serviceModal =
    serviceModalElement
        ? new bootstrap.Modal(serviceModalElement)
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
   GLOBAL DATA
========================================================= */

let currentUser = null;

let usersData = {};

let ordersData = {};

let transactionsData = {};

let servicesData = {};


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
        new Date(
            Number(timestamp)
        );

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
        new Date(
            Number(timestamp)
        );

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
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


/* =========================================================
   STATUS BADGE
========================================================= */

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
            ${escapeHtml(safeStatus)}
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

    const status =
        String(
            currentStatus || "pending"
        ).toLowerCase();


    const options = [
        "pending",
        "processing",
        "completed",
        "cancelled",
        "failed"
    ];


    return `
        <select
            class="form-select form-select-sm order-status-select"
            data-order-id="${escapeHtml(orderId)}"
            style="min-width: 125px;"
        >

            ${
                options.map(
                    option => `
                        <option
                            value="${option}"
                            ${
                                status === option
                                    ? "selected"
                                    : ""
                            }
                        >
                            ${
                                option
                                    .charAt(0)
                                    .toUpperCase() +
                                option.slice(1)
                            }
                        </option>
                    `
                ).join("")
            }

        </select>
    `;

}


/* =========================================================
   SHOW ACCESS DENIED
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
    .querySelectorAll(
        ".admin-nav-btn"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const sectionId =
                        button.dataset.section;


                    document
                        .querySelectorAll(
                            ".management-section"
                        )
                        .forEach(
                            section => {

                                section.classList.remove(
                                    "active"
                                );

                            }
                        );


                    const selectedSection =
                        document.getElementById(
                            sectionId
                        );


                    if (selectedSection) {

                        selectedSection.classList.add(
                            "active"
                        );

                    }


                    document
                        .querySelectorAll(
                            ".admin-nav-btn"
                        )
                        .forEach(
                            navButton => {

                                navButton.classList.remove(
                                    "btn-primary"
                                );

                                navButton.classList.add(
                                    "btn-outline-secondary"
                                );

                            }
                        );


                    button.classList.remove(
                        "btn-outline-secondary"
                    );

                    button.classList.add(
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

                }
            );

        }
    );
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
                    colspan="5"
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
                            colspan="5"
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
                .filter(
                    order =>
                        order &&
                        String(order.uid) ===
                        String(uid)
                )
                .length;


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

                        ${userOrders}

                    </td>


                    <td>

                        <span
                            class="badge bg-success"
                        >
                            Active
                        </span>

                    </td>

                </tr>

            `;

        }


        if (usersTableBody) {

            usersTableBody.innerHTML =
                html;

        }

    }


    catch (error) {

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
                        colspan="5"
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


        let pending =
            0;

        let completed =
            0;


        orders.forEach(
            ([id, order]) => {

                const status =
                    String(
                        order?.status ||
                        "pending"
                    ).toLowerCase();


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
                            colspan="7"
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


        /*
         * Newest orders first
         */

        orders.sort(
            ([, a], [, b]) =>
                Number(
                    b?.createdAt ||
                    b?.timestamp ||
                    0
                ) -
                Number(
                    a?.createdAt ||
                    a?.timestamp ||
                    0
                )
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
                    String(
                        order?.status ||
                        "pending"
                    ).toLowerCase();


                const createdAt =
                    order?.createdAt ||
                    order?.timestamp ||
                    0;


                html += `

                    <tr>

                        <!-- ORDER ID -->

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


                        <!-- USER -->

                        <td>

                            ${escapeHtml(
                                userEmail
                            )}

                        </td>


                        <!-- SERVICE -->

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


                        <!-- QUANTITY -->

                        <td>

                            ${quantity.toLocaleString(
                                "en-NG"
                            )}

                        </td>


                        <!-- AMOUNT -->

                        <td>

                            <strong>
                                ${formatNaira(
                                    amount
                                )}
                            </strong>

                        </td>


                        <!-- STATUS -->

                        <td>

                            ${orderStatusSelect(
                                id,
                                status
                            )}

                        </td>


                        <!-- DATE -->

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

    }


    catch (error) {

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
                        colspan="7"
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
        "cancelled",
        "failed"
    ];


    const status =
        String(
            newStatus || ""
        ).toLowerCase();


    if (
        !allowedStatuses.includes(
            status
        )
    ) {

        alert(
            "Invalid order status."
        );

        return;

    }


    try {

        if (selectElement) {

            selectElement.disabled =
                true;

        }


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


        /*
         * Update local copy immediately.
         */

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


        /*
         * Refresh dashboard
         * statistics.
         */

        await loadOrders();


        if (ordersMessage) {

            ordersMessage.textContent =
                "Order status updated successfully.";

        }

    }


    catch (error) {

        console.error(
            "UPDATE ORDER STATUS ERROR:",
            error
        );


        alert(
            "Unable to update order status. Please check your Firebase rules."
        );


        /*
         * Reload the original
         * value if the update failed.
         */

        await loadOrders();

    }


    finally {

        if (selectElement) {

            selectElement.disabled =
                false;

        }

    }

}


/* =========================================================
   ORDER STATUS DROPDOWN EVENT
========================================================= */

if (ordersTableBody) {

    ordersTableBody.addEventListener(
        "change",
        async (event) => {

            const select =
                event.target.closest(
                    ".order-status-select"
                );


            if (!select) {

                return;

            }


            const orderId =
                select.dataset.orderId;


            const newStatus =
                select.value;


            await updateOrderStatus(
                orderId,
                newStatus,
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


        /*
         * Newest transactions first
         */

        transactions.sort(
            ([, a], [, b]) => {

                const dateA =
                    Number(
                        a?.createdAt ||
                        a?.timestamp ||
                        0
                    );


                const dateB =
                    Number(
                        b?.createdAt ||
                        b?.timestamp ||
                        0
                    );


                return dateB - dateA;

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
                    String(
                        transaction?.status ||
                        "completed"
                    ).toLowerCase();


                const date =
                    transaction?.createdAt ||
                    transaction?.timestamp ||
                    0;


                html += `

                    <tr>

                        <!-- TRANSACTION ID -->

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


                        <!-- USER -->

                        <td>

                            ${escapeHtml(
                                user
                            )}

                        </td>


                        <!-- TYPE -->

                        <td>

                            ${escapeHtml(
                                type
                            )}

                        </td>


                        <!-- DESCRIPTION -->

                        <td>

                            ${escapeHtml(
                                description
                            )}

                        </td>


                        <!-- AMOUNT -->

                        <td>

                            <strong>
                                ${formatNaira(
                                    amount
                                )}
                            </strong>

                        </td>


                        <!-- STATUS -->

                        <td>

                            ${statusBadge(
                                status
                            )}

                        </td>


                        <!-- DATE -->

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

    }


    catch (error) {

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

                        <!-- PLATFORM -->

                        <td>

                            <strong>
                                ${escapeHtml(
                                    platform
                                )}
                            </strong>

                        </td>


                        <!-- SERVICE -->

                        <td>

                            ${escapeHtml(
                                name
                            )}

                        </td>


                        <!-- PRICE -->

                        <td>

                            <strong>
                                ${formatNaira(
                                    price
                                )}
                            </strong>

                        </td>


                        <!-- MINIMUM -->

                        <td>

                            ${min.toLocaleString(
                                "en-NG"
                            )}

                        </td>


                        <!-- MAXIMUM -->

                        <td>

                            ${max.toLocaleString(
                                "en-NG"
                            )}

                        </td>


                        <!-- STATUS -->

                        <td>

                            ${
                                active

                                ?

                                `
                                    <span
                                        class="service-status-active"
                                    >
                                        Active
                                    </span>
                                `

                                :

                                `
                                    <span
                                        class="service-status-inactive"
                                    >
                                        Inactive
                                    </span>
                                `
                            }

                        </td>


                        <!-- ACTIONS -->

                        <td>

                            <div
                                class="d-flex
                                flex-wrap
                                gap-1"
                            >

                                <button
                                    type="button"
                                    class="btn
                                    btn-sm
                                    btn-outline-primary
                                    action-btn"
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
                                    class="btn
                                    btn-sm
                                    btn-outline-danger
                                    action-btn"
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

    }


    catch (error) {

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
   OPEN ADD SERVICE
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
   SERVICE TABLE ACTIONS
========================================================= */

if (servicesTableBody) {

    servicesTableBody.addEventListener(
        "click",
        async (event) => {

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

                openEditService(
                    id
                );

                return;

            }


            if (
                action ===
                "delete-service"
            ) {

                await deleteService(
                    id
                );

            }

        }
    );

}


/* =========================================================
   OPEN EDIT SERVICE
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
        async (event) => {

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

            }


            catch (error) {

                console.error(
                    "SAVE SERVICE ERROR:",
                    error
                );


                alert(
                    "Unable to save service. Check your Firebase rules."
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


    const confirmed =
        confirm(
            `Delete ${serviceNameValue}? This cannot be undone.`
        );


    if (!confirmed) {

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

    }


    catch (error) {

        console.error(
            "DELETE SERVICE ERROR:",
            error
        );


        alert(
            "Unable to delete service. Check your Firebase rules."
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
/* =========================================================
   AUTHENTICATION
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        /*
         * No logged-in user
         */

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


            /*
             * Force Firebase to refresh
             * the ID token so the latest
             * admin custom claim is available.
             */

            await user.getIdToken(
                true
            );


            /*
             * Get the refreshed token
             * and its custom claims.
             */

            const tokenResult =
                await user.getIdTokenResult();


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
             * Check admin claim.
             */

            if (
                tokenResult.claims.admin !== true
            ) {

                showAccessDenied(
                    "Firebase does not currently see your account as an administrator."
                );

                return;

            }


            /*
             * Display administrator email.
             */

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
             * Load dashboard data.
             *
             * Orders are loaded first because
             * the Users section calculates
             * each user's order count from
             * ordersData.
             */

            await loadOrders();


            await loadUsers();


        }


        catch (error) {

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

            }


            catch (error) {

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


/* =========================================================
   HELPER: SHORT DATE
========================================================= */

function formatShortDate(timestamp) {

    if (!timestamp) {

        return "—";

    }


    const date =
        new Date(
            Number(timestamp)
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

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
   HELPER: ORDER STATUS DROPDOWN
========================================================= */

function orderStatusSelect(
    orderId,
    currentStatus
) {

    const safeStatus =
        String(
            currentStatus ||
            "pending"
        ).toLowerCase();


    const statuses = [
        "pending",
        "processing",
        "completed",
        "cancelled",
        "failed"
    ];


    let options = "";


    statuses.forEach(
        status => {

            const selected =
                status ===
                safeStatus
                    ? "selected"
                    : "";


            options += `

                <option
                    value="${status}"
                    ${selected}
                >
                    ${status
                        .charAt(0)
                        .toUpperCase() +
                    status.slice(1)}
                </option>

            `;

        }
    );


    return `

        <select
            class="
                form-select
                form-select-sm
                order-status-select
            "
            data-order-id="${escapeHtml(
                orderId
            )}"
            style="
                min-width: 125px;
                font-weight: 600;
            "
        >

            ${options}

        </select>

    `;

}
