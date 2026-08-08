import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


let currentUser = null;


onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }

        currentUser = user;

    }
);


const payButton =
    document.getElementById(
        "payButton"
    );

const amountInput =
    document.getElementById(
        "amount"
    );

const message =
    document.getElementById(
        "message"
    );


function showMessage(
    text,
    type = "danger"
) {

    message.textContent =
        text;

    message.className =
        "alert alert-" +
        type;

}


payButton.addEventListener(
    "click",
    async () => {

        if (!currentUser) {

            showMessage(
                "Please wait for your account to load."
            );

            return;

        }


        const amount =
            Number(
                amountInput.value
            );


        if (
            !Number.isFinite(amount) ||
            amount < 100
        ) {

            showMessage(
                "Minimum funding amount is ₦100."
            );

            return;

        }


        payButton.disabled =
            true;

        payButton.textContent =
            "Connecting to Korapay...";


        showMessage(
            "Initializing secure payment...",
            "info"
        );


        try {

            const response =
                await fetch(
                    "/api/create-payment",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                amount,

                                uid:
                                    currentUser.uid,

                                name:
                                    currentUser.displayName ||
                                    "HKDM Customer",

                                email:
                                    currentUser.email

                            })

                    }
                );


            const result =
                await response.json();


            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Unable to initialize payment."
                );

            }


            if (
                !result.checkout_url
            ) {

                throw new Error(
                    "Korapay checkout URL was not returned."
                );

            }


            /*
                Send customer to the
                official Korapay checkout.
            */

            window.location.href =
                result.checkout_url;


        } catch (error) {

            console.error(
                "PAYMENT ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Unable to connect to the payment system."
            );


            payButton.disabled =
                false;

            payButton.innerHTML =
                '<i class="bi bi-credit-card"></i> Fund Wallet';

        }

    }
);
