import {
    auth,
    database
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    ref,
    get,
    query,
    orderByChild,
    equalTo
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


const transactionsBody =
    document.getElementById(
        "transactionsBody"
    );

const message =
    document.getElementById(
        "message"
    );



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


    return new Date(
        timestamp
    ).toLocaleString(
        "en-NG",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

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


    message.textContent =
        text;

    message.className =
        "alert alert-" +
        type +
        " mt-4";

}



/* =========================================================
   LOAD USER TRANSACTIONS
========================================================= */

async function loadTransactions(uid) {

    try {

        /*
            IMPORTANT:

            Only request transactions belonging
            to the currently logged-in user.

            Firebase rules will require this
            exact query.
        */

        const transactionsQuery =
            query(
                ref(
                    database,
                    "transactions"
                ),

                orderByChild(
                    "uid"
                ),

                equalTo(
                    uid
                )
            );


        const snapshot =
            await get(
                transactionsQuery
            );



        /* =================================================
           NO TRANSACTIONS
        ================================================= */

        if (
            !snapshot.exists()
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



        /* =================================================
           CONVERT DATA TO ARRAY
        ================================================= */

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
                            b.createdAt || 0
                        ) -
                        Number(
                            a.createdAt || 0
                        )
                );



        /* =================================================
           SAFETY CHECK
        ================================================= */

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



        /* =================================================
           DISPLAY TRANSACTIONS
        ================================================= */

        transactionsBody.innerHTML =
            "";



        userTransactions.forEach(
            transaction => {

                const row =
                    document.createElement(
                        "tr"
                    );


                const type =
                    transaction.type ||
                    "transaction";


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


                let statusClass =
                    "bg-warning text-dark";


                if (
                    status === "success"
                ) {

                    statusClass =
                        "bg-success";

                }


                if (
                    status === "failed"
                ) {

                    statusClass =
                        "bg-danger";

                }



                row.innerHTML = `

                    <td>

                        ${formatDate(
                            transaction.createdAt
                        )}

                    </td>


                    <td>

                        <span
                            class="badge bg-secondary"
                        >

                            ${type}

                        </span>

                    </td>


                    <td>

                        ${transaction.description ||
                        "—"}

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

                            ${status}

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

                    Please try again.

                </td>

            </tr>

        `;


        showMessage(
            "Unable to load your transactions. Please try again."
        );

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


        await loadTransactions(
            user.uid
        );

    }
);
