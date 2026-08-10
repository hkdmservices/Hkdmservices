import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


const emailElement =
    document.getElementById("email");

const activateButton =
    document.getElementById("activateAdmin");

const messageElement =
    document.getElementById("message");


function showMessage(message, type = "") {

    if (!messageElement) {
        return;
    }

    messageElement.textContent =
        message;

    messageElement.className =
        type;

}


onAuthStateChanged(
    auth,
    (user) => {

        console.log(
            "SET ADMIN AUTH USER:",
            user
        );


        if (!user) {

            if (emailElement) {
                emailElement.textContent =
                    "No account is signed in.";
            }

            if (activateButton) {
                activateButton.disabled =
                    true;
            }

            showMessage(
                "Please log in first.",
                "error"
            );

            return;
        }


        if (emailElement) {

            emailElement.textContent =
                user.email ||
                "Administrator account";

        }


        console.log(
            "SIGNED-IN UID:",
            user.uid
        );


        /*
         * Your authorized administrator account.
         */

        const allowedAdminUid =
            "cxtj0tJ5MHb0YQcWh9XomNdorzw1";


        if (
            user.uid !==
            allowedAdminUid
        ) {

            if (activateButton) {
                activateButton.disabled =
                    true;
            }

            showMessage(
                "This account is not authorized to activate administrator privileges.",
                "error"
            );

            return;
        }


        if (activateButton) {

            activateButton.disabled =
                false;

        }


        showMessage(
            "Administrator account detected.",
            "info"
        );

    },

    (error) => {

        console.error(
            "AUTH STATE ERROR:",
            error
        );

        showMessage(
            "Unable to check your account. Please refresh the page.",
            "error"
        );

    }
);


if (activateButton) {

    activateButton.addEventListener(
        "click",
        async () => {

            const user =
                auth.currentUser;


            if (!user) {

                showMessage(
                    "You are not logged in.",
                    "error"
                );

                return;

            }


            if (
                user.uid !==
                "cxtj0tJ5MHb0YQcWh9XomNdorzw1"
            ) {

                showMessage(
                    "This account is not authorized.",
                    "error"
                );

                return;

            }


            try {

                activateButton.disabled =
                    true;

                activateButton.textContent =
                    "Activating...";


                showMessage(
                    "Verifying administrator account...",
                    "info"
                );


                /*
                 * Get Firebase ID token.
                 */

                const idToken =
                    await user.getIdToken(
                        true
                    );


                /*
                 * Call your EXISTING API:
                 *
                 * api/set-admin.js
                 */

                const response =
                    await fetch(
                        "/api/set-admin",
                        {
                            method: "POST",

                            headers: {
                                "Authorization":
                                    `Bearer ${idToken}`,

                                "Content-Type":
                                    "application/json"
                            }
                        }
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Unable to activate administrator privileges."
                    );

                }


                /*
                 * Force Firebase to obtain
                 * the new admin claim.
                 */

                await user.getIdToken(
                    true
                );


                showMessage(
                    "Admin privileges activated successfully.",
                    "success"
                );


                activateButton.textContent =
                    "Admin Activated";


            }

            catch (error) {

                console.error(
                    "ACTIVATE ADMIN ERROR:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to activate administrator privileges.",
                    "error"
                );


                activateButton.disabled =
                    false;


                activateButton.textContent =
                    "Activate Admin";

            }

        }
    );

}
