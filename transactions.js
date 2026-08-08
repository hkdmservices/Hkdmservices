import { auth, database } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


const transactionsBody =
    document.getElementById(
        "transactionsBody"
    );

const message =
    document.getElementById(
        "message"
    );



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



function showMessage(
    text,
    type = "danger"
) {

    message.textContent =
        text;

    message.className =
        "alert alert-" +
        type +
        " mt-4";

}



onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        try {

            const snapshot =
                await get(
                    ref(
                        database,
                        "transactions"
                    )
                );


            if (!snapshot.exists()) {

                transactionsBody.innerHTML = `

                    <tr>

                        <td
                        colspan="5"
                        class="text-center py-5 text-muted">

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

                .filter(
                    transaction =>
                        transaction.uid ===
                        user.uid
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
                userTransactions.length === 0
            ) {

                transactionsBody.innerHTML = `

                    <tr>

                        <td
                        colspan="5"
                        class="text-center py-5 text-muted">

                            No transactions yet.

                        </td>

                    </tr>

                `;

                return;

            }



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
                        transaction.status ||
                        "pending";


                    const statusClass =
                        status === "success"
                            ? "bg-success"
                            : status === "failed"
                                ? "bg-danger"
                                : "bg-warning text-dark";


                    row.innerHTML = `

                        <td>

                            ${formatDate(
                                transaction.createdAt
                            )}

                        </td>

                        <td>

                            <span
                            class="badge bg-secondary">

                                ${type}

                            </span>

                        </td>

                        <td>

                            ${transaction.description ||
                            "—"}

                        </td>

                        <td
                        class="fw-bold">

                            ${formatNaira(
                                amount
                            )}

                        </td>

                        <td>

                            <span
                            class="badge ${statusClass}">

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
                    class="text-center py-5 text-danger">

                        Unable to load transactions.

                    </td>

                </tr>

            `;

        }

    }
);
