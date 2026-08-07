import createKindeClient from "https://cdn.jsdelivr.net/npm/@kinde/js-sdk/+esm";

alert("Script loaded");

async function test() {

    try {

        alert("Creating Kinde client...");

        const kinde = await createKindeClient({

            client_id: "7c2b45233e3d45dbbb2342714b993c50",

            domain: "https://hkdmservices.kinde.com",

            redirect_uri: window.location.origin

        });

        alert("Kinde initialized successfully");

    } catch (error) {

        alert("ERROR: " + error.message);

        console.error(error);

    }

}

test();
