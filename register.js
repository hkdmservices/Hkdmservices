import { auth, database } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
    ref,
    get,
    set
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const form = document.getElementById("registerForm");
const message = document.getElementById("message");
const googleRegisterBtn = document.getElementById("googleRegisterBtn");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Register form submitted");

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
        const urlParams = new URLSearchParams(window.location.search);
        const referredBy = urlParams.get("ref") || null;

        console.log("Creating user...");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User created:", userCredential.user.uid);

        await sendEmailVerification(userCredential.user);
        await updateProfile(userCredential.user, { displayName: fullName });

        console.log("Saving user to database...");
        await set(ref(database, "users/" + userCredential.user.uid), {
            fullName: fullName,
            email: email,
            wallet: 0,
            role: "customer",
            status: "active",
            referredBy: referredBy,
            createdAt: Date.now()
        });

        console.log("User saved successfully!");
        alert("Account created successfully! Please check your email to verify your account.");
        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Registration error:", error.code, error.message);
        message.textContent = error.message;
        message.classList.remove("d-none");
    }
});

// Google Sign-Up Handler
if (googleRegisterBtn) {
    googleRegisterBtn.addEventListener("click", async () => {
        message.classList.add("d-none");
        googleRegisterBtn.disabled = true;

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userRef = ref(database, "users/" + user.uid);
            const snapshot = await get(userRef);

            if (!snapshot.exists()) {
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

            message.className = "alert alert-success mt-3";
            message.textContent = "Google registration successful! Redirecting...";
            message.classList.remove("d-none");

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 300);

        } catch (error) {
            console.error("GOOGLE REGISTER ERROR:", error);
            message.className = "alert alert-danger mt-3";
            message.textContent = error.message || "Failed to sign up with Google.";
            message.classList.remove("d-none");
            googleRegisterBtn.disabled = false;
        }
    });
}
