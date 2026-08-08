import { auth, database } from "./firebase.js";

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

const logoutBtn =
    document.getElementById("logout");



onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "login.html";

        return;

    }


    try {

        /*
            ==================================
            LOAD USER INFORMATION
            ==================================
        */

        const userSnapshot =
            await get(
                ref(
                    database,
                    "users/" + user.uid
                )
            );


        if (userSnapshot.exists()) {

            const data =
                userSnapshot.val();


            userName.textContent =
                data.fullName ||
                user.displayName ||
                "User";


            walletBalance.textContent =
                "₦" +
                Number(
                    data.wallet || 0
                ).toLocaleString(
                    "en-NG",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );

        }



        /*
            ==================================
            LOAD USER ORDERS
            ==================================
        */

        const ordersSnapshot =
            await get(
                ref(
                    database,
                    "orders"
                )
            );


        let totalOrders = 0;


        if (ordersSnapshot.exists()) {

            const orders =
                ordersSnapshot.val();


            Object.values(orders).forEach(
                order => {

                    if (
                        order &&
                        order.uid === user.uid
                    ) {

                        totalOrders++;

                    }

                }
            );

        }


        ordersCount.textContent =
            totalOrders;



    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );

        ordersCount.textContent =
            "0";

    }

});



/*
    ==================================
    LOGOUT
    ==================================
*/

logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

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
