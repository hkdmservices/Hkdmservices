import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


const form =
    document.getElementById("loginForm");

const message =
    document.getElementById("message");

const submitButton =
    form.querySelector(
        'button[type="submit"]'
    );


/*
    ==========================================
    SHOW MESSAGE
    ==========================================
*/

function showMessage(
    text,
    type = "danger"
) {

    message.textContent =
        text;

    message.className =
        `alert alert-${type} mt-3`;

}


/*
    ==========================================
    GET USER-FRIENDLY FIREBASE ERROR
    ==========================================
*/

function getErrorMessage(error) {

    switch (error.code) {

        case "auth/invalid-credential":

            return (
                "Incorrect email or password."
            );


        case "auth/user-not-found":

            return (
                "Account not found."
            );


        case "auth/wrong-password":

            return (
                "Incorrect email or password."
            );


        case "auth/invalid-email":

            return (
                "Please enter a valid email address."
            );


        case "auth/user-disabled":

            return (
                "This account has been disabled. Please contact support."
            );


        case "auth/too-many-requests":

            return (
                "Too many login attempts. Please wait a few minutes and try again."
            );


        case "auth/network-request-failed":

            return (
                "We're having trouble connecting to the login service. Please check your internet connection and try again."
            );


        case "auth/operation-not-allowed":

            return (
                "Email and password login is currently unavailable. Please contact support."
            );


        case "auth/unauthorized-domain":

            return (
                "This website is not authorized for Firebase login. Please contact support."
            );


        default:

            return (
                "Unable to log in right now. Please try again."
            );

    }

}


/*
    ==========================================
    SIGN IN WITH RETRY
    ==========================================
*/

async function loginWithRetry(
    email,
    password
) {

    const maximumAttempts = 3;

    let lastError = null;


    for (
        let attempt = 1;
        attempt <= maximumAttempts;
        attempt++
    ) {

        try {

            return await
                signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

        } catch (error) {

            lastError = error;


            /*
                Only retry genuine network
                failures.

                Do NOT retry incorrect
                passwords, disabled accounts,
                invalid emails, etc.
            */

            if (
                error.code !==
                "auth/network-request-failed"
            ) {

                throw error;

            }


            /*
                If this was the final attempt,
                stop retrying.
            */

            if (
                attempt ===
                maximumAttempts
            ) {

                throw error;

            }


            /*
                Small delay before retrying.

                Attempt 1:
                wait 1 second

                Attempt 2:
                wait 2 seconds
            */

            const delay =
                attempt * 1000;


            showMessage(
                `Connection interrupted. Retrying... (${attempt + 1}/${maximumAttempts})`,
                "warning"
            );


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        delay
                    )
            );

        }

    }


    throw lastError;

}


/*
    ==========================================
    LOGIN FORM
    ==========================================
*/

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        /*
            Prevent multiple submissions.
        */

        if (
            submitButton.disabled
        ) {

            return;

        }


        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const password =
            document
                .getElementById("password")
                .value;


        /*
            Basic validation.
        */

        if (!email) {

            showMessage(
                "Please enter your email address."
            );

            return;

        }


        if (!password) {

            showMessage(
                "Please enter your password."
            );

            return;

        }


        /*
            Disable button while logging in.
        */

        submitButton.disabled =
            true;


        submitButton.innerHTML =
            `
            <span
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true">
            </span>
            Signing in...
            `;


        message.classList.add(
            "d-none"
        );


        try {

            /*
                Firebase login with
                network retry protection.
            */

            await loginWithRetry(
                email,
                password
            );


            /*
                Successful login.
            */

            showMessage(
                "Login successful. Redirecting...",
                "success"
            );


            /*
                Give Firebase a moment to
                finish updating auth state.
            */

            setTimeout(
                () => {

                    window.location.href =
                        "dashboard.html";

                },
                300
            );


        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );


            showMessage(
                getErrorMessage(error),
                "danger"
            );


            /*
                Allow another attempt.
            */

            submitButton.disabled =
                false;


            submitButton.innerHTML =
                "Login";

        }

    }
);
