import { auth } from "./firebase.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const form = document.getElementById("resetForm");
const message = document.getElementById("message");
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("resetEmail").value.trim();
    if (!email) {
        message.className = "alert alert-danger mt-3";
        message.textContent = "Please enter your email address.";
        message.classList.remove("d-none");
        return;
    }

    submitButton.disabled = true;
    submitButton.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
        Sending...
    `;
    message.classList.add("d-none");

    try {
        await sendPasswordResetEmail(auth, email);
        
        message.className = "alert alert-success mt-3";
        message.textContent = "Password reset email sent! Check your inbox for further instructions.";
        message.classList.remove("d-none");
        
        submitButton.innerHTML = "Email Sent";
    } catch (error) {
        console.error("RESET ERROR:", error);
        
        let errorText = "Failed to send reset email. Please try again.";
        if (error.code === "auth/user-not-found") {
            errorText = "No account found with this email address.";
        } else if (error.code === "auth/invalid-email") {
            errorText = "Please enter a valid email address.";
        }

        message.className = "alert alert-danger mt-3";
        message.textContent = errorText;
        message.classList.remove("d-none");
        
        submitButton.disabled = false;
        submitButton.innerHTML = "Send Reset Link";
    }
});
