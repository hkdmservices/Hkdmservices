import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

console.log("🔥 login.js loaded");

const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("Form submitted");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    console.log("Email:", email);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Login successful!", userCredential.user.email);
        alert("Login successful! Redirecting...");
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("Login error:", error.code, error.message);
        alert("❌ Error: " + error.code + " - " + error.message);
        message.textContent = "❌ " + error.message;
        message.classList.remove("d-none");
    }
});
