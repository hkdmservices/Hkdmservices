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

console.log("🔥 register.js loaded");
alert("✅ Script loaded! (from register.js)");

// Wait for DOM to be fully ready
document.addEventListener("DOMContentLoaded", function() {
  alert("✅ DOMContentLoaded fired!");

  const form = document.getElementById("registerForm");
  const message = document.getElementById("message");
  const googleRegisterBtn = document.getElementById("googleRegisterBtn");

  alert("✅ Form element: " + (form ? "FOUND" : "NOT FOUND"));

  if (!form) {
    alert("❌ registerForm not found! Check the form ID.");
    return;
  }

  alert("✅ registerForm found, attaching listener...");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alert("✅ Form submitted! (from register.js listener)");

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    message.classList.add("d-none");

    if (password !== confirmPassword) {
      message.textContent = "Passwords do not match.";
      message.classList.remove("d-none");
      alert("Passwords do not match!");
      return;
    }

    if (!fullName || !email || !password) {
      message.textContent = "Please fill out all fields.";
      message.classList.remove("d-none");
      alert("Please fill out all fields!");
      return;
    }

    try {
      alert("Creating user...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      alert("User created successfully!");

      await sendEmailVerification(userCredential.user);
      await updateProfile(userCredential.user, { displayName: fullName });

      const urlParams = new URLSearchParams(window.location.search);
      const referredBy = urlParams.get("ref") || null;

      await set(ref(database, "users/" + userCredential.user.uid), {
        fullName: fullName,
        email: email,
        wallet: 0,
        role: "customer",
        status: "active",
        referredBy: referredBy,
        createdAt: Date.now()
      });

      alert("Account created successfully! Redirecting...");
      window.location.href = "dashboard.html";

    } catch (error) {
      alert("❌ Error: " + error.code + " - " + error.message);
      message.textContent = error.message;
      message.classList.remove("d-none");
    }
  });

  // Google Sign-Up Handler
  if (googleRegisterBtn) {
    googleRegisterBtn.addEventListener("click", async () => {
      alert("Google Sign Up clicked!");
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
        }

        alert("Google registration successful! Redirecting...");
        window.location.href = "dashboard.html";

      } catch (error) {
        alert("❌ Google Error: " + error.message);
        message.textContent = error.message;
        message.classList.remove("d-none");
      }
    });
  }
});
