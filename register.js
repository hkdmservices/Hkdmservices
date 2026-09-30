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
    // Create initial wallet_history entry (via PHP)
    // Robust: waits for auth, retries token, verifies write
    // ------------------------------------------------------------
    async function createInitialWalletHistory(uid) {
        try {
            // Wait for auth.currentUser
            let attempts = 0;
            while (!auth.currentUser && attempts < 10) {
                await new Promise(r => setTimeout(r, 200));
                attempts++;
            }
            if (!auth.currentUser) {
                console.warn("No auth.currentUser after 2s");
                return false;
            }

            // Get ID token with retries
            let idToken = null;
            for (let i = 0; i < 5; i++) {
                try {
                    idToken = await auth.currentUser.getIdToken(true);
                    if (idToken) break;
                } catch (e) {
                    console.warn("Token attempt " + (i + 1) + " failed:", e.message);
                }
                await new Promise(r => setTimeout(r, 300));
            }
            if (!idToken) {
                console.warn("Could not get ID token");
                return false;
            }

            // Call PHP
            const resp = await fetch("/api-php/create-initial-history.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + idToken
                },
                body: JSON.stringify({ action: "init" })
            });
            const result = await resp.json();
            console.log("createInitialWalletHistory result:", result);

            // Verify the entry exists in Firebase
            if (uid) {
                await new Promise(r => setTimeout(r, 500));
                const verifySnap = await get(ref(database, "wallet_history/" + uid + "/initial"));
                if (!verifySnap.exists()) {
                    console.warn("⚠️ Initial history NOT confirmed in Firebase");
                    return false;
                }
                console.log("✅ Initial wallet_history confirmed");
            }

            return result.success === true;
        } catch (err) {
            console.error("Initial history error:", err);
            return false;
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

            // Create initial wallet_history, retry once if needed
            let ok = await createInitialWalletHistory(uid);
            if (!ok) {
                console.warn("Retrying initial wallet_history...");
                await new Promise(r => setTimeout(r, 800));
                ok = await createInitialWalletHistory(uid);
            }

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

                    let ok = await createInitialWalletHistory(user.uid);
                    if (!ok) {
                        await new Promise(r => setTimeout(r, 800));
                        await createInitialWalletHistory(user.uid);
                    }
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
