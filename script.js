/*
=================================
HKDMServices v1.1
Kinde Authentication Setup
=================================
*/

import createKindeClient from "@kinde-oss/kinde-auth-pkce-js";


let kinde;



async function initializeKinde() {


    kinde = await createKindeClient({

        client_id: "7c2b45233e3d45dbbb2342714b993c50",

        domain: "https://hkdmservices.kinde.com",

        redirect_uri: window.location.origin

    });



    setupAuthButtons();

    setupLogout();

    checkUser();


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




async function checkUser(){


    const authenticated = await kinde.isAuthenticated();



    if(authenticated){


        const user = await kinde.getUser();


        console.log("Logged in user:", user);



        // Redirect logged-in users to dashboard

        if(window.location.pathname.includes("index.html") || window.location.pathname === "/"){

            window.location.href = "dashboard.html";

        }


    }


}





function setupLogout(){


    const logoutButton = document.getElementById("logout");



    if(logoutButton){


        logoutButton.addEventListener("click", async ()=>{


            await kinde.logout();


        });


    }


}





document.addEventListener(
"DOMContentLoaded",
initializeKinde
);
