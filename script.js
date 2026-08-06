console.log("HKDM script started");

import createKindeClient from "https://cdn.jsdelivr.net/npm/@kinde/js-sdk/+esm";


let kinde;


async function initializeKinde(){

    console.log("Initializing Kinde...");

    kinde = await createKindeClient({

        client_id: "7c2b45233e3d45dbbb2342714b993c50",

        domain: "https://hkdmservices.kinde.com",

        redirect_uri: window.location.origin

    });


    console.log("Kinde initialized successfully");


    document.querySelectorAll(".login-btn").forEach(btn=>{

        btn.onclick = (e)=>{

            e.preventDefault();

            kinde.login();

        };

    });



    document.querySelectorAll(".register-btn").forEach(btn=>{

        btn.onclick = (e)=>{

            e.preventDefault();

            kinde.register();

        };

    });


}


initializeKinde();
