import {
    auth,
    authPersistence
} from "./firebase.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.classList.add("d-none");

    try {

    await authPersistence;

    await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

        window.location.href = "dashboard.html";

    } catch (error) {

        let errorMessage = "Login failed.";

        switch (error.code) {

            case "auth/invalid-credential":
                errorMessage = "Incorrect email or password.";
                break;

            case "auth/user-not-found":
                errorMessage = "Account not found.";
                break;

            case "auth/wrong-password":
                errorMessage = "Incorrect password.";
                break;

            case "auth/invalid-email":
                errorMessage = "Invalid email address.";
                break;

            default:
                errorMessage = error.message;
        }

        message.textContent = errorMessage;
        message.classList.remove("d-none");

    }

});
