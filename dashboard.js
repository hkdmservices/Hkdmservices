import { auth } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const userName = document.getElementById("userName");
const logoutBtn = document.getElementById("logout");

onAuthStateChanged(auth, (user) => {

    if (user) {

        if (userName) {
            userName.textContent =
                user.displayName || user.email;
        }

    } else {

        window.location.href = "login.html";

    }

});

logoutBtn.addEventListener("click", async () => {

    await signOut(auth);

    window.location.href = "index.html";

});
