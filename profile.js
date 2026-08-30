import {
    auth,
    database
} from "./firebase.js";

import {
    onAuthStateChanged,
    signOut,
    sendEmailVerification,
    updateProfile,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    ref,
    query,
    orderByChild,
    equalTo,
    get,
    update
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


/* =========================================================
   ELEMENTS
========================================================= */

const profileForm =
    document.getElementById("profileForm");

const profileNameInput =
    document.getElementById("profileNameInput");

const profileEmail =
    document.getElementById("profileEmail");

const emailVerification =
    document.getElementById("emailVerification");

const verifyEmailBtn =
    document.getElementById("verifyEmailBtn");

const profileWallet =
    document.getElementById("profileWallet");

const profileOrders =
    document.getElementById("profileOrders");

const accountStatus =
    document.getElementById("accountStatus");

const profileUid =
    document.getElementById("profileUid");

const saveProfileBtn =
    document.getElementById("saveProfileBtn");

const resetPasswordBtn =
    document.getElementById("resetPasswordBtn");

const profileMessage =
    document.getElementById("profileMessage");

const logoutBtn =
    document.getElementById("logout");


/* =========================================================
   FORMAT NAIRA
========================================================= */

function formatNaira(amount) {

    return "₦" +
        Number(amount || 0).toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


/* =========================================================
   LOAD BASIC PROFILE INFORMATION
========================================================= */

async function loadUserData(user) {

    if (profileEmail) {
        profileEmail.textContent = user.email || "Not available";
    }

    if (profileUid) {
        profileUid.textContent = user.uid || "Not available";
    }

    /*
        EMAIL VERIFICATION & BUTTON CONTROLS
    */

    if (emailVerification) {
        if (user.emailVerified) {
            emailVerification.innerHTML = `
                <span class="badge bg-success">
                    <i class="bi bi-check-circle"></i>
                    Verified
                </span>
            `;
            if (verifyEmailBtn) {
                verifyEmailBtn.classList.add("d-none");
            }
        } else {
            emailVerification.innerHTML = `
                <span class="badge bg-warning text-dark">
                    <i class="bi bi-exclamation-circle"></i>
                    Not Verified
                </span>
            `;
            if (verifyEmailBtn) {
                verifyEmailBtn.classList.remove("d-none");
            }
        }
    }

    /*
        LOAD USER DATABASE RECORD
    */

    try {
        const userRef = ref(database, "users/" + user.uid);
        const userSnapshot = await get(userRef);

        if (!userSnapshot.exists()) {
            console.warn("USER DATA NOT FOUND");
            if (profileNameInput) {
                profileNameInput.value = user.displayName || "";
            }
            if (profileWallet) {
                profileWallet.textContent = "₦0.00";
            }
            return;
        }

        const userData = userSnapshot.val();

        if (profileNameInput) {
            profileNameInput.value = userData.fullName || user.displayName || "";
        }

        if (profileWallet) {
            profileWallet.textContent = formatNaira(userData.wallet);
        }

    } catch (error) {
        console.error("PROFILE USER DATA ERROR:", error);
        if (profileWallet) {
            profileWallet.textContent = "Unable to load";
        }
    }

}


/* =========================================================
   LOAD USER ORDERS
========================================================= */

async function loadUserOrders(user) {

    try {
        const ordersQuery =
            query(
                ref(database, "orders"),
                orderByChild("uid"),
                equalTo(user.uid)
            );

        const ordersSnapshot = await get(ordersQuery);

        if (!ordersSnapshot.exists()) {
            if (profileOrders) {
                profileOrders.textContent = "0";
            }
            return;
        }

        const orders = ordersSnapshot.val();
        const userOrders = Object.values(orders).filter(
            order => order && String(order.uid) === String(user.uid)
        );

        if (profileOrders) {
            profileOrders.textContent = String(userOrders.length);
        }

    } catch (error) {
        console.error("PROFILE ORDERS ERROR:", error);
        if (profileOrders) {
            profileOrders.textContent = "Unable to load";
        }
    }

}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile(user) {
    await Promise.allSettled([
        loadUserData(user),
        loadUserOrders(user)
    ]);
}


/* =========================================================
   AUTHENTICATION STATE LISTENER
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        await loadProfile(user);
    }
);


/* =========================================================
   HANDLE PROFILE FORM SUBMISSION (NAME UPDATE)
========================================================= */

if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        const newName = profileNameInput.value.trim();
        if (!newName) {
            profileMessage.className = "alert alert-danger mt-3";
            profileMessage.textContent = "Full name cannot be empty.";
            profileMessage.classList.remove("d-none");
            return;
        }

        saveProfileBtn.disabled = true;
        saveProfileBtn.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
            Updating...
        `;
        profileMessage.classList.add("d-none");

        try {
            // Update Firebase Auth profile displayName
            await updateProfile(user, {
                displayName: newName
            });

            // Update Firebase Realtime Database record
            const userRef = ref(database, "users/" + user.uid);
            await update(userRef, {
                fullName: newName
            });

            profileMessage.className = "alert alert-success mt-3";
            profileMessage.textContent = "Profile updated successfully!";
            profileMessage.classList.remove("d-none");

        } catch (error) {
            console.error("PROFILE UPDATE ERROR:", error);
            profileMessage.className = "alert alert-danger mt-3";
            profileMessage.textContent = error.message || "Failed to update profile.";
            profileMessage.classList.remove("d-none");
        } finally {
            saveProfileBtn.disabled = false;
            saveProfileBtn.innerHTML = `<i class="bi bi-check-circle"></i> Update Profile`;
        }
    });
}


/* =========================================================
   SEND EMAIL VERIFICATION LINK HANDLER
========================================================= */

if (verifyEmailBtn) {
    verifyEmailBtn.addEventListener(
        "click",
        async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                verifyEmailBtn.disabled = true;
                verifyEmailBtn.textContent = "Sending...";

                await sendEmailVerification(user);
                alert("Verification link sent successfully! Please check your inbox and spam folders.");
            } catch (error) {
                console.error("VERIFICATION EMAIL ERROR:", error);
                alert("Failed to send verification email: " + error.message);
            } finally {
                verifyEmailBtn.disabled = false;
                verifyEmailBtn.innerHTML = '<i class="bi bi-envelope-check"></i> Send Verification Link';
            }
        }
    );
}


/* =========================================================
   SEND PASSWORD RESET EMAIL HANDLER
========================================================= */

if (resetPasswordBtn) {
    resetPasswordBtn.addEventListener("click", async () => {
        const user = auth.currentUser;
        if (!user || !user.email) return;

        try {
            resetPasswordBtn.disabled = true;
            resetPasswordBtn.textContent = "Sending...";

            await sendPasswordResetEmail(auth, user.email);

            profileMessage.className = "alert alert-success mt-3";
            profileMessage.textContent = "Password reset email sent! Check your inbox for further instructions.";
            profileMessage.classList.remove("d-none");
        } catch (error) {
            console.error("PASSWORD RESET ERROR:", error);
            profileMessage.className = "alert alert-danger mt-3";
            profileMessage.textContent = error.message || "Failed to send password reset email.";
            profileMessage.classList.remove("d-none");
        } finally {
            resetPasswordBtn.disabled = false;
            resetPasswordBtn.innerHTML = `<i class="bi bi-key"></i> Send Password Reset Email`;
        }
    });
}


/* =========================================================
   LOGOUT
========================================================= */

if (logoutBtn) {
    logoutBtn.addEventListener(
        "click",
        async () => {
            try {
                await signOut(auth);
                window.location.href = "login.html";
            } catch (error) {
                console.error("LOGOUT ERROR:", error);
            }
        }
    );
}
