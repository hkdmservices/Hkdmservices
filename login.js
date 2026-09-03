import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

console.log("🔥 login.js loaded");
alert("Script loaded!"); // ← Alert to confirm script runs

const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    alert("Form submitted!"); // ← Alert to confirm button works

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    alert("Email: " + email); // ← Alert to show email

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        alert("Login successful! User: " + userCredential.user.email);
        window.location.href = "dashboard.html";
    } catch (error) {
        alert("❌ Error: " + error.code + " - " + error.message);
        console.error("Login error:", error);
    }
});
