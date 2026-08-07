/*
=================================
HKDMServices
Kinde Authentication Setup
=================================
*/

import createKindeClient from "https://cdn.jsdelivr.net/npm/@kinde/js-sdk/+esm";


let kinde;


async function initializeKinde(){

    kinde = await createKindeClient({

        client_id: "7c2b45233e3d45dbbb2342714b993c50",

        domain: "https://hkdmservices.kinde.com",

        redirect_uri: window.location.origin

    });


    document.querySelectorAll("#login").forEach(button=>{

        button.addEventListener("click", async (e)=>{

            e.preventDefault();

            await kinde.login();

        });

    });



    document.querySelectorAll("#register").forEach(button=>{

        button.addEventListener("click", async (e)=>{

            e.preventDefault();

            await kinde.register();

        });

    });


}


initializeKinde();
