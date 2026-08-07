import { auth, database } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const userName = document.getElementById("userName");
const walletBalance = document.getElementById("walletBalance");
const logoutBtn = document.getElementById("logout");

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    const snapshot = await get(
        ref(database, "users/" + user.uid)
    );

    if (snapshot.exists()) {

        const data = snapshot.val();

        userName.textContent = data.fullName;
        walletBalance.textContent =
            "₦" + Number(data.wallet).toLocaleString();

    }

});

logoutBtn.addEventListener("click", async () => {

    await signOut(auth);

    window.location.href = "login.html";

});
