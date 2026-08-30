import { auth, database } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
    ref,
    get,
    set
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


const form =
    document.getElementById("loginForm");

const message =
    document.getElementById("message");

const submitButton =
    form.querySelector(
        'button[type="submit"]'
    );

const googleLoginBtn =
    document.getElementById("googleLoginBtn");


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
                "Login is currently unavailable. Please contact support."
            );


        case "auth/unauthorized-domain":

            return (
                "This website is not authorized for Firebase login. Please contact support."
            );


        default:

            return (
                error.message || "Unable to log in right now. Please try again."
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

            if (
                error.code !==
                "auth/network-request-failed"
            ) {

                throw error;

            }

            if (
                attempt ===
                maximumAttempts
            ) {

                throw error;

            }

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

            await loginWithRetry(
                email,
                password
            );

            showMessage(
                "Login successful. Redirecting...",
                "success"
            );

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

            submitButton.disabled =
                false;

            submitButton.innerHTML =
                "Login";

        }

    }
);


/*
    ==========================================
    GOOGLE SIGN IN HANDLER
    ==========================================
*/

if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", async () => {
        message.classList.add("d-none");
        googleLoginBtn.disabled = true;

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user profile already exists in Realtime Database
            const userRef = ref(database, "users/" + user.uid);
            const snapshot = await get(userRef);

            if (!snapshot.exists()) {
                // First time logging in with Google -> Create database record
                const urlParams = new URLSearchParams(window.location.search);
                const referredBy = urlParams.get("ref") || null;

                await set(userRef, {
                    fullName: user.displayName || "Google User",
                    email: user.email,
                    wallet: 0,
                    role: "customer",
                    status: "active",
                    referredBy: referredBy,
                    createdAt: Date.now()
                });
            }

            showMessage("Google login successful! Redirecting...", "success");

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 300);

        } catch (error) {
            console.error("GOOGLE LOGIN ERROR:", error);
            showMessage(getErrorMessage(error), "danger");
            googleLoginBtn.disabled = false;
        }
    });
}
