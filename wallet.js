import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


let currentUser = null;


/* ================================
   AUTH CHECK
================================ */

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



/* ================================
   ELEMENTS
================================ */

const payButton =
    document.getElementById("payButton");


const amountInput =
    document.getElementById("amount");


const message =
    document.getElementById("message");



const redeemButton =
    document.getElementById("redeemVoucherBtn");


const voucherInput =
    document.getElementById("voucherCodeInput");



/* ================================
   MESSAGE DISPLAY
================================ */

function showMessage(
    text,
    type = "danger"
) {

    if (!message) return;


    message.textContent =
        text;


    message.className =
        "alert alert-" + type;

}



/* ================================
   KORAPAY WALLET FUNDING
================================ */

if (payButton) {


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



        payButton.disabled = true;


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

                        method:"POST",

                        headers:{
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



            if(
                !response.ok ||
                !result.success
            ){

                throw new Error(
                    result.message ||
                    "Unable to initialize payment."
                );

            }



            if(!result.checkout_url){

                throw new Error(
                    "Korapay checkout URL missing."
                );

            }



            window.location.href =
                result.checkout_url;



        }

        catch(error){


            console.error(
                "PAYMENT ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Payment failed."
            );


            payButton.disabled =
                false;


            payButton.textContent =
                "Fund Wallet";


        }


    }
);


}




/* ================================
   VOUCHER REDEMPTION
================================ */


if(redeemButton){


redeemButton.addEventListener(
    "click",
    async()=>{


        if(!currentUser){

            showMessage(
                "Please wait for your account to load."
            );

            return;

        }



        const voucherCode =
            voucherInput.value
            .trim();



        if(!voucherCode){


            showMessage(
                "Please enter voucher code."
            );

            return;

        }



        redeemButton.disabled =
            true;



        redeemButton.textContent =
            "Redeeming...";



        try{


            const idToken =
                await currentUser.getIdToken();



            const response =
                await fetch(
                    "/api/redeem-voucher",
                    {

                        method:"POST",


                        headers:{

                            "Authorization":
                            `Bearer ${idToken}`,


                            "Content-Type":
                            "application/json"

                        },


                        body:
                        JSON.stringify({

                            voucherCode

                        })

                    }
                );



            const result =
                await response.json();



            if(
                !response.ok ||
                !result.success
            ){

                throw new Error(
                    result.message ||
                    "Voucher redemption failed."
                );

            }



            showMessage(
                result.message,
                "success"
            );



            voucherInput.value = "";



            setTimeout(
                ()=>{

                    window.location.reload();

                },
                1500
            );



        }


        catch(error){


            console.error(
                "VOUCHER ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Unable to redeem voucher."
            );


        }



        finally{


            redeemButton.disabled =
                false;



            redeemButton.textContent =
                "Redeem Voucher";


        }


    }
);


}
