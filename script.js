/*
=================================
HKDMServices v1.0
Kinde Authentication Setup
=================================
*/


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


    const loginButton = document.getElementById("login");

    const registerButton = document.getElementById("register");



    if(loginButton){

        loginButton.addEventListener("click", async () => {

            await kinde.login();

        });

    }



    if(registerButton){

        registerButton.addEventListener("click", async () => {

            await kinde.register();

        });

    }


}




document.addEventListener(
"DOMContentLoaded",
initializeKinde
);
