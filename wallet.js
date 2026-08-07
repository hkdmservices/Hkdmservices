import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

let currentUser = null;

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    currentUser = user;

});

const payButton = document.getElementById("payButton");
const amountInput = document.getElementById("amount");
const message = document.getElementById("message");

payButton.addEventListener("click", () => {

    const amount = Number(amountInput.value);

    if (!amount || amount < 100) {

        message.textContent = "Minimum funding amount is ₦100.";
        return;

    }

    message.textContent = "";

    const reference = "HKDM-" + Date.now();

    window.Korapay.initialize({

        key: "pk_live_RJ4Um9P1C5aaMrQ5nXki39mRS95mV8E6wJc8dkW8",

        reference: reference,

        amount: amount,

        currency: "NGN",

        customer: {

            name: currentUser.displayName,

            email: currentUser.email

        },

        notification_url: "",

        onClose() {

            alert("Payment cancelled.");

        },

        onSuccess(response) {

            verifyPayment(response.reference);

        }

    });

});

async function verifyPayment(reference) {

    try {

        const response = await fetch("/api/verify-payment", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                reference: reference,

                uid: currentUser.uid

            })

        });

        const result = await response.json();

        if (result.success) {

            alert("Wallet funded successfully!");

            window.location.href = "dashboard.html";

        } else {

            alert(result.message);

        }

    } catch (error) {

        console.error(error);

        alert("Unable to verify payment.");

    }

}
