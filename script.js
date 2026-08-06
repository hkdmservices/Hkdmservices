/*
=================================
HKDMServices v1.1
Kinde Authentication Setup
=================================
*/

import createKindeClient from "https://cdn.jsdelivr.net/npm/@kinde/js-sdk/+esm";


let kinde;


async function initializeKinde() {

    kinde = await createKindeClient({

        client_id: "7c2b45233e3d45dbbb2342714b993c50",

        domain: "https://hkdmservices.kinde.com",

        redirect_uri: window.location.origin

    });


    setupAuthButtons();

}



function setupAuthButtons(){


    const loginButtons = document.querySelectorAll(".login-btn");

    const registerButtons = document.querySelectorAll(".register-btn");



    loginButtons.forEach(button => {

        button.addEventListener("click", async (event)=>{

            event.preventDefault();

            await kinde.login();

        });

    });



    registerButtons.forEach(button => {

        button.addEventListener("click", async (event)=>{

            event.preventDefault();

            await kinde.register();

        });

    });


}



document.addEventListener(
"DOMContentLoaded",
initializeKinde
);
