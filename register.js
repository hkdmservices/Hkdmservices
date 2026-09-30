// ============================================================
// HKDMservices — Register
// ============================================================

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

console.log("register.js loaded");

document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("registerForm");
    const message = document.getElementById("message");
    const googleRegisterBtn = document.getElementById("googleRegisterBtn");

    if (!form) { console.error("registerForm not found"); return; }

    // ------------------------------------------------------------
    // Create initial wallet_history entry — DEBUG VERSION
    // ------------------------------------------------------------
    async function createInitialWalletHistory() {
        try {
            console.log("createInitialWalletHistory called");

            if (!auth.currentUser) {
                alert("DEBUG: No auth.currentUser");
                return;
            }
            console.log("auth uid:", auth.currentUser.uid);

            const idToken = await auth.currentUser.getIdToken(true);
            if (!idToken) {
                alert("DEBUG: No ID token");
                return;
            }
            console.log("Token obtained, length:", idToken.length);

            const resp = await fetch("/api-php/create-initial-history.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + idToken
                },
                body: JSON.stringify({ action: "init" })
            });

            console.log("Response status:", resp.status);
            const result = await resp.json();
            console.log("Response body:", result);
            alert("PHP says: " + JSON.stringify(result));

        } catch (err) {
            console.error("createInitialWalletHistory error:", err);
            alert("DEBUG Error: " + err.message);
        }
    }

    // ------------------------------------------------------------
    // Email / Password Signup
    // ------------------------------------------------------------
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

        if (!fullName || !email || !password) {
            message.textContent = "Please fill out all fields.";
            message.classList.remove("d-none");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            await sendEmailVerification(userCredential.user);
            await updateProfile(userCredential.user, { displayName: fullName });

            const urlParams = new URLSearchParams(window.location.search);
            const referredBy = urlParams.get("ref") || null;

            await set(ref(database, "users/" + uid), {
                fullName: fullName,
                email: email,
                wallet: 0,
                role: "customer",
                status: "active",
                referredBy: referredBy,
                createdAt: Date.now()
            });

            alert("DEBUG: About to call createInitialWalletHistory");
            await createInitialWalletHistory();
            alert("DEBUG: After createInitialWalletHistory");

            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Registration error:", error);
            let msg = error.message;
            if (error.code === "auth/email-already-in-use") msg = "This email is already registered.";
            else if (error.code === "auth/invalid-email") msg = "Please enter a valid email address.";
            else if (error.code === "auth/weak-password") msg = "Password must be at least 6 characters.";
            message.textContent = msg;
            message.classList.remove("d-none");
        }
    });

    // ------------------------------------------------------------
    // Google Signup
    // ------------------------------------------------------------
    if (googleRegisterBtn) {
        googleRegisterBtn.addEventListener("click", async () => {
            message.classList.add("d-none");

            try {
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                const user = result.user;

                const userRef = ref(database, "users/" + is user.uid);
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

                    await createInitialWalletHistory();
                }

                window.location.href = "dashboard.html";

            } catch (error) {
                console.error("Google signup error:", error);
                message.textContent = error.message;
                message.classList.remove("d-none");
            }
        });
    }
});
