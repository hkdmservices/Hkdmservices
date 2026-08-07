import { auth, database } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
    ref,
    set
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";
const form = document.getElementById("registerForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    message.classList.add("d-none");

    if (password !== confirmPassword) {
        message.textContent = "Passwords do not match.";
        message.classList.remove("d-none");
        return;
    }

    try {

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        await updateProfile(userCredential.user, {
            displayName: fullName
        });

        alert("Account created successfully!");

        window.location.href = "dashboard.html";

    } catch (error) {

        message.textContent = error.message;
        message.classList.remove("d-none");

    }

});
