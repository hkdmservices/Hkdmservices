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


const transactionsBody =
    document.getElementById("transactionsBody");

const message =
    document.getElementById("message");


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

    const date = new Date(Number(timestamp));

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
   TRANSACTION STATUS
========================================================= */

function getStatusClass(status) {

    const safeStatus =
        String(status || "pending").toLowerCase();

    if (
        safeStatus === "success" ||
        safeStatus === "completed"
    ) {
        return "bg-success";
    }

    if (
        safeStatus === "failed" ||
        safeStatus === "cancelled"
    ) {
        return "bg-danger";
    }

    return "bg-warning text-dark";

}


/* =========================================================
   TRANSACTION TYPE DISPLAY
========================================================= */

function getTransactionType(transaction) {

    const type =
        String(
            transaction?.type ||
            "Transaction"
        );

    return type;

}


/* =========================================================
   TRANSACTION DESCRIPTION
========================================================= */

function getTransactionDescription(transaction) {

    if (transaction?.description) {
        return transaction.description;
    }

    if (
        String(transaction?.type || "").toLowerCase()
        === "reseller upgrade"
    ) {
        return "Official Reseller account upgrade";
    }

    return "—";

}


/* =========================================================
   SHOW MESSAGE
========================================================= */

function showMessage(
    text,
    type = "danger"
) {

    if (!message) {
        return;
    }

    message.textContent = text;

    message.className =
        "alert alert-" +
        type +
        " mt-4";

}


/* =========================================================
   LOAD USER TRANSACTIONS
========================================================= */

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
                Only request transactions
                belonging to the logged-in user.
            */

            const transactionsQuery =
                query(
                    ref(
                        database,
                        "transactions"
                    ),
                    orderByChild("uid"),
                    equalTo(user.uid)
                );


            const snapshot =
                await get(
                    transactionsQuery
                );


            if (!snapshot.exists()) {

                transactionsBody.innerHTML = `

                    <tr>

                        <td
                            colspan="5"
                            class="text-center py-5 text-muted"
                        >

                            No transactions yet.

                        </td>

                    </tr>

                `;

                return;

            }


            const data =
                snapshot.val();


            const userTransactions =
                Object.entries(data)

                    .map(
                        ([id, transaction]) => ({

                            id,

                            ...transaction

                        })
                    )

                    .sort(
                        (a, b) =>
                            Number(
                                b.createdAt ||
                                b.timestamp ||
                                0
                            ) -
                            Number(
                                a.createdAt ||
                                a.timestamp ||
                                0
                            )
                    );


            if (
                userTransactions.length === 0
            ) {

                transactionsBody.innerHTML = `

                    <tr>

                        <td
                            colspan="5"
                            class="text-center py-5 text-muted"
                        >

                            No transactions yet.

                        </td>

                    </tr>

                `;

                return;

            }


            transactionsBody.innerHTML = "";


            userTransactions.forEach(
                transaction => {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    const type =
                        getTransactionType(
                            transaction
                        );


                    const description =
                        getTransactionDescription(
                            transaction
                        );


                    const amount =
                        Number(
                            transaction.amount ||
                            0
                        );


                    const status =
                        String(
                            transaction.status ||
                            "pending"
                        ).toLowerCase();


                    const statusClass =
                        getStatusClass(
                            status
                        );


                    /*
                        Make reseller upgrades
                        visually recognizable.
                    */

                    const isResellerUpgrade =
                        type.toLowerCase()
                            === "reseller upgrade";


                    const typeBadgeClass =
                        isResellerUpgrade
                            ? "bg-primary"
                            : "bg-secondary";


                    row.innerHTML = `

                        <td>

                            ${formatDate(
                                transaction.createdAt ||
                                transaction.timestamp
                            )}

                        </td>


                        <td>

                            <span
                                class="badge ${typeBadgeClass}"
                            >

                                ${escapeHtml(type)}

                            </span>

                        </td>


                        <td>

                            ${escapeHtml(
                                description
                            )}

                        </td>


                        <td
                            class="fw-bold"
                        >

                            ${formatNaira(
                                amount
                            )}

                        </td>


                        <td>

                            <span
                                class="badge ${statusClass}"
                            >

                                ${escapeHtml(
                                    status
                                )}

                            </span>

                        </td>

                    `;


                    transactionsBody.appendChild(
                        row
                    );

                }
            );


        } catch (error) {

            console.error(
                "TRANSACTIONS ERROR:",
                error
            );


            transactionsBody.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        class="text-center py-5 text-danger"
                    >

                        Unable to load transactions.

                    </td>

                </tr>

            `;


            showMessage(
                "Unable to load your transactions. Please refresh the page."
            );

        }

    }
);
