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


/* =========================================
   VOUCHER REDEMPTION INTEGRATION
   ========================================= */

const redeemButton = document.getElementById("redeemVoucherBtn");
const voucherInput = document.getElementById("voucherCodeInput");

if (redeemButton) {
    redeemButton.addEventListener("click", async () => {
        if (!currentUser) {
            showMessage("Please wait for your account to load.");
            return;
        }

        const voucherCode = voucherInput ? voucherInput.value.trim() : "";
        
        if (!voucherCode) {
            showMessage("Please enter a valid voucher code.", "danger");
            return;
        }

        redeemButton.disabled = true;
        redeemButton.textContent = "Redeeming...";

        try {
            const idToken = await currentUser.getIdToken(true);

            const response = await fetch('/api/redeem-voucher', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ voucherCode })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Failed to redeem voucher.");
            }

            showMessage(result.message, "success");
            
            if (voucherInput) voucherInput.value = ""; // Clear input on success
            
            // Optional: Reload page after a brief moment to show updated wallet balance
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error("VOUCHER ERROR:", error);
            showMessage(error.message || "Unable to redeem voucher.", "danger");
        } finally {
            redeemButton.disabled = false;
            redeemButton.innerHTML = '<i class="bi bi-ticket-perforated"></i> Redeem Voucher';
        }
    });
}
