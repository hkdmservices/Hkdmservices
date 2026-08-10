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
    update,
    push,
    set
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";



/* =========================================================
   ELEMENTS
========================================================= */

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

const redeemVoucherForm =
    document.getElementById("redeemVoucherForm");

const redeemCodeInput =
    document.getElementById("redeemCodeInput");

const redeemMsg =
    document.getElementById("redeemMsg");



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


    return new Date(timestamp).toLocaleString(
        "en-NG",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}



/* =========================================================
   STATUS BADGE
========================================================= */

function statusBadge(status) {

    const safeStatus =
        String(
            status || "pending"
        ).toLowerCase()
         .trim();

    let badgeClass = "bg-warning text-dark";
    let displayText = "Refunded";

    if (safeStatus === "refund" || safeStatus === "refunded") {
        badgeClass = "bg-warning text-dark";
        displayText = "Refunded";
    } else if (safeStatus === "pending") {
        badgeClass = "bg-warning text-dark";
        displayText = "Pending";
    } else if (safeStatus === "processing") {
        badgeClass = "bg-info text-dark";
        displayText = "Processing";
    } else if (safeStatus === "completed") {
        badgeClass = "bg-success";
        displayText = "Completed";
    } else if (safeStatus === "cancelled" || safeStatus === "failed") {
        badgeClass = "bg-danger";
        displayText = safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
    } else {
        badgeClass = "bg-warning text-dark";
        displayText = safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
    }

    return `
        <span class="badge ${badgeClass}">
            ${displayText}
        </span>
    `;

}



/* =========================================================
   LOAD USER INFORMATION
========================================================= */

async function loadUserInformation(user) {

    try {

        const userRef =
            ref(
                database,
                "users/" + user.uid
            );


        const snapshot =
            await get(userRef);


        if (!snapshot.exists()) {

            console.warn(
                "USER DATA NOT FOUND"
            );


            if (userName) {

                userName.textContent =
                    user.displayName ||
                    "User";

            }


            return;

        }


        const data =
            snapshot.val();


        if (userName) {

            userName.textContent =
                data.fullName ||
                user.displayName ||
                "User";

        }


        /*
            UPDATE WALLET ONLY WHEN
            REAL USER DATA EXISTS
        */

        if (walletBalance) {

            walletBalance.textContent =
                formatNaira(
                    data.wallet
                );

        }


    } catch (error) {

        console.error(
            "USER DATA ERROR:",
            error
        );


        /*
            DO NOT RESET WALLET
        */

        if (userName) {

            userName.textContent =
                user.displayName ||
                "User";

        }

    }

}



/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadRecentOrders(uid) {

    try {

        /*
            GET ORDERS
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


        /*
            ==============================================
            NO ORDERS IN DATABASE
            ==============================================
        */

        if (!snapshot.exists()) {

            /*
                IMPORTANT:
                Update dashboard count even if
                Recent Orders element doesn't exist.
            */

            if (ordersCount) {

                ordersCount.textContent =
                    "0";

            }


            /*
                Only update Recent Orders
                if that element exists.
            */

            if (recentOrders) {

                recentOrders.innerHTML = `

                    <div
                        class="text-center
                        text-muted
                        py-4"
                    >

                        <i
                            class="bi bi-cart-x fs-2"
                        ></i>

                        <p class="mt-2 mb-0">

                            You have not placed
                            any orders yet.

                        </p>

                    </div>

                `;

            }


            return;

        }



        /*
            ==============================================
            GET ALL ORDERS
            ==============================================
        */

        const orders =
            snapshot.val();



        /*
            ==============================================
            FILTER CURRENT USER'S ORDERS
            ==============================================
        */

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



        /*
            ==============================================
            UPDATE TOTAL ORDERS
            ==============================================
        */

        if (ordersCount) {

            ordersCount.textContent =
                String(
                    userOrders.length
                );

        }



        /*
            ==============================================
            NO ORDERS FOR THIS USER
            ==============================================
        */

        if (
            userOrders.length === 0
        ) {

            /*
                Dashboard count is already
                set to 0 above.
            */


            if (recentOrders) {

                recentOrders.innerHTML = `

                    <div
                        class="text-center
                        text-muted
                        py-4"
                    >

                        <i
                            class="bi bi-cart-x fs-2"
                        ></i>

                        <p class="mt-2 mb-0">

                            You have not placed
                            any orders yet.

                        </p>

                    </div>

                `;

            }


            return;

        }



        /*
            =================================================
            IF RECENT ORDERS ELEMENT DOES NOT EXIST,
            STOP HERE.
            
            This is exactly what happens on the
            main dashboard.
            
            The order count has already been updated.
            =================================================
        */

        if (!recentOrders) {

            return;

        }



        /*
            ==============================================
            SHOW FIVE NEWEST ORDERS
            ==============================================
        */

        const latestOrders =
            userOrders.slice(
                0,
                5
            );



        /*
            ==============================================
            DESKTOP TABLE
            ==============================================
        */

        let desktopHtml = `

            <div class="d-none d-md-block">

                <div class="table-responsive">

                    <table
                        class="table table-hover
                        align-middle mb-0"
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
            ==============================================
            MOBILE CARDS
            ==============================================
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
                        class="card border
                        shadow-sm mb-3"
                    >

                        <div
                            class="card-body"
                        >


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
                                    class="fw-bold
                                    text-success"
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
            ==============================================
            DISPLAY RECENT ORDERS
            ==============================================
        */

        recentOrders.innerHTML =
            desktopHtml +
            mobileHtml;

    }


    catch (error) {

        console.error(
            "ORDERS ERROR:",
            error
        );


        /*
            IMPORTANT:
            DO NOT CHANGE ordersCount TO 0
            IF FIREBASE TEMPORARILY FAILS.
        */


        if (recentOrders) {

            recentOrders.innerHTML = `

                <div
                    class="alert
                    alert-warning
                    mb-0"
                >

                    <i
                        class="bi bi-wifi-off"
                    ></i>

                    Recent orders could not
                    be loaded right now.

                    Please refresh the page.

                </div>

            `;

        }

    }

}



/* =========================================================
   REDEEM VOUCHER FUNCTIONALITY
========================================================= */

async function redeemVoucherCode(userUid, code) {
    const cleanCode = code.trim().toUpperCase();
    const voucherRef = ref(database, "vouchers/" + cleanCode);
    const userRef = ref(database, "users/" + userUid);

    // 1. Fetch voucher
    const voucherSnap = await get(voucherRef);
    if (!voucherSnap.exists()) {
        throw new Error("Invalid voucher code.");
    }

    const voucherData = voucherSnap.val();
    if (voucherData.isUsed) {
        throw new Error("This voucher has already been used.");
    }

    // 2. Fetch user current wallet
    const userSnap = await get(userRef);
    if (!userSnap.exists()) {
        throw new Error("User data not found.");
    }

    const userData = userSnap.val();
    const currentWallet = Number(userData.wallet || 0);
    const voucherAmount = Number(voucherData.amount || 0);

    // 3. Perform atomic updates (Mark voucher used, update wallet, log transaction)
    const timestamp = Date.now();
    const updates = {};
    updates[`vouchers/${cleanCode}/isUsed`] = true;
    updates[`vouchers/${cleanCode}/usedBy`] = userUid;
    updates[`vouchers/${cleanCode}/usedAt`] = timestamp;
    updates[`users/${userUid}/wallet`] = currentWallet + voucherAmount;
    
    updates[`transactions/${timestamp}`] = {
        transactionId: "VCR-" + Math.floor(100000 + Math.random() * 900000),
        uid: userUid,
        email: userData.email || auth.currentUser.email || "—",
        type: "Voucher Redeem",
        description: `Redeemed voucher code: ${cleanCode}`,
        amount: voucherAmount,
        status: "completed",
        createdAt: timestamp
    };

    await update(ref(database), updates);
    return voucherAmount;
}

if (redeemVoucherForm) {
    redeemVoucherForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!redeemCodeInput) return;
        
        const code = redeemCodeInput.value;
        if (redeemMsg) {
            redeemMsg.innerHTML = `<div class="alert alert-info mb-0">Processing voucher...</div>`;
        }

        try {
            if (!auth.currentUser) {
                throw new Error("You must be logged in to redeem a voucher.");
            }

            const amountRedeemed = await redeemVoucherCode(auth.currentUser.uid, code);
            
            if (redeemMsg) {
                redeemMsg.innerHTML = `<div class="alert alert-success mb-0">Successfully redeemed ₦${amountRedeemed.toLocaleString("en-NG")} to your wallet!</div>`;
            }
            redeemVoucherForm.reset();
            
            // Refresh user information/wallet balance display
            await loadUserInformation(auth.currentUser);
        } catch (error) {
            console.error("REDEEM VOUCHER ERROR:", error);
            if (redeemMsg) {
                redeemMsg.innerHTML = `<div class="alert alert-danger mb-0">${error.message}</div>`;
            }
        }
    });
}



/* =========================================================
   AUTHENTICATION
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        /*
            ==============================================
            USER NOT LOGGED IN
            ==============================================
        */

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }



        /*
            ==============================================
            LOAD USER + ORDERS INDEPENDENTLY
            ==============================================
        */

        await Promise.allSettled([

            loadUserInformation(
                user
            ),

            loadRecentOrders(
                user.uid
            )

        ]);

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
