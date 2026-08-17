import {
    auth,
    database
} from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    ref,
    get,
    push,
    set
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

/* =========================================================
   ELEMENTS
========================================================= */

const userName = document.getElementById("userName");
const walletBalance = document.getElementById("walletBalance");
const ordersCount = document.getElementById("ordersCount");
const recentOrders = document.getElementById("recentOrders");
const logoutBtn = document.getElementById("logout");
const redeemVoucherForm = document.getElementById("redeemVoucherForm");
const redeemCodeInput = document.getElementById("redeemCodeInput");
const redeemMsg = document.getElementById("redeemMsg");
const referralLinkInput = document.getElementById("referralLinkInput");
const copyRefBtn = document.getElementById("copyRefBtn");
const totalReferralsEl = document.getElementById("totalReferrals");
const totalEarningsEl = document.getElementById("totalEarnings");

/* =========================================================
   FORMAT NAIRA
========================================================= */
function formatNaira(amount) {
    return "₦" + Number(amount || 0).toLocaleString(
        "en-NG",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}

/* =========================================================
   FORMAT DATE
========================================================= */
function formatDate(timestamp) {
    if (!timestamp) {
        return "—";
    }
    return new Date(timestamp).toLocaleString(
        "en-NG",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}

/* =========================================================
   STATUS BADGE
========================================================= */
function statusBadge(status) {
    const safeStatus = String(status || "pending").toLowerCase().trim();
    let badgeClass = "bg-warning text-dark";
    let displayText = "Pending";

    if (safeStatus === "refund" || safeStatus === "refunded") {
        badgeClass = "bg-warning text-dark";
        displayText = "Refunded";
    } else if (safeStatus === "pending") {
        badgeClass = "bg-warning text-dark";
        displayText = "Pending";
    } else if (safeStatus === "processing") {
        badgeClass = "bg-info text-dark";
        displayText = "Processing";
    } else if (safeStatus === "completed") {
        badgeClass = "bg-success";
        displayText = "Completed";
    } else if (safeStatus === "cancelled" || safeStatus === "failed") {
        badgeClass = "bg-danger";
        displayText = safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
    } else {
        badgeClass = "bg-warning text-dark";
        displayText = safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
    }

    return `
        <span class="badge ${badgeClass}">
            ${displayText}
        </span>
    `;
}

/* =========================================================
   LOAD USER INFORMATION
========================================================= */
async function loadUserInformation(user) {
    try {
        const userRef = ref(database, "users/" + user.uid);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            console.warn("USER DATA NOT FOUND");
            if (userName) {
                userName.textContent = user.displayName || "User";
            }
            return;
        }

        const data = snapshot.val();

        if (userName) {
            userName.textContent = data.fullName || user.displayName || "User";
        }

        if (walletBalance) {
            walletBalance.textContent = formatNaira(data.wallet || 0);
        }

    } catch (error) {
        console.error("USER DATA ERROR:", error);
        if (userName) {
            userName.textContent = user.displayName || "User";
        }
    }
}

/* =========================================================
   LOAD REFERRAL INFORMATION
========================================================= */
async function loadReferralInformation(uid) {
    try {
        const userRef = ref(database, "users/" + uid);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            const refCode = data.referralCode || uid;

            if (referralLinkInput) {
                referralLinkInput.value = `https://hkdmservices.xyz/register.html?ref=${refCode}`;
            }

            if (totalReferralsEl) {
                totalReferralsEl.textContent = data.totalReferrals || 0;
            }

            if (totalEarningsEl) {
                totalEarningsEl.textContent = formatNaira(data.totalReferralEarnings || 0);
            }
        }
    } catch (error) {
        console.error("REFERRAL DATA ERROR:", error);
    }
}

/* =========================================================
   COPY REFERRAL LINK
========================================================= */
if (copyRefBtn && referralLinkInput) {
    copyRefBtn.addEventListener("click", () => {
        if (!referralLinkInput.value || referralLinkInput.value.includes("Generating")) return;

        navigator.clipboard.writeText(referralLinkInput.value).then(() => {
            copyRefBtn.textContent = "Copied!";
            copyRefBtn.classList.remove("btn-success");
            copyRefBtn.classList.add("btn-dark");

            setTimeout(() => {
                copyRefBtn.textContent = "Copy Link";
                copyRefBtn.classList.remove("btn-dark");
                copyRefBtn.classList.add("btn-success");
            }, 2000);
        });
    });
}

/* =========================================================
   LOAD ORDERS
========================================================= */
async function loadRecentOrders(uid) {
    try {
        const ordersRef = ref(database, "orders");
        const snapshot = await get(ordersRef);

        if (!snapshot.exists()) {
            if (ordersCount) {
                ordersCount.textContent = "0";
            }
            if (recentOrders) {
                recentOrders.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="bi bi-cart-x fs-2"></i>
                        <p class="mt-2 mb-0">You have not placed any orders yet.</p>
                    </div>
                `;
            }
            return;
        }

        const orders = snapshot.val();
        const userOrders = Object.values(orders)
            .filter(order => order && String(order.uid) === String(uid))
            .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

        if (ordersCount) {
            ordersCount.textContent = String(userOrders.length);
        }

        if (userOrders.length === 0) {
            if (recentOrders) {
                recentOrders.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="bi bi-cart-x fs-2"></i>
                        <p class="mt-2 mb-0">You have not placed any orders yet.</p>
                    </div>
                `;
            }
            return;
        }

        if (!recentOrders) {
            return;
        }

        const latestOrders = userOrders.slice(0, 5);

        let desktopHtml = `
            <div class="d-none d-md-block">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Service</th>
                                <th>Quantity</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        latestOrders.forEach(order => {
            const shortOrderId = String(order.orderId || "").slice(0, 10);
            desktopHtml += `
                <tr>
                    <td><code>${shortOrderId}</code></td>
                    <td>
                        <strong>${order.platform || "—"}</strong><br>
                        <small class="text-muted">${order.service || "—"}</small>
                    </td>
                    <td>${Number(order.quantity || 0).toLocaleString("en-NG")}</td>
                    <td><strong>${formatNaira(order.amount)}</strong></td>
                    <td>${statusBadge(order.status)}</td>
                    <td><small>${formatDate(order.createdAt)}</small></td>
                </tr>
            `;
        });

        desktopHtml += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        let mobileHtml = `<div class="d-md-none">`;

        latestOrders.forEach(order => {
            const shortOrderId = String(order.orderId || "").slice(0, 12);
            mobileHtml += `
                <div class="card border shadow-sm mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <small class="text-muted">Order ID</small>
                                <div><code>${shortOrderId}</code></div>
                            </div>
                            <div>${statusBadge(order.status)}</div>
                        </div>
                        <div class="mb-3">
                            <small class="text-muted">Service</small>
                            <div class="fw-bold">${order.platform || "—"}</div>
                            <div class="text-muted">${order.service || "—"}</div>
                        </div>
                        <div class="mb-3">
                            <small class="text-muted">Quantity</small>
                            <div class="fw-bold">${Number(order.quantity || 0).toLocaleString("en-NG")}</div>
                        </div>
                        <div class="mb-3">
                            <small class="text-muted">Amount</small>
                            <div class="fw-bold text-success">${formatNaira(order.amount)}</div>
                        </div>
                        <div>
                            <small class="text-muted">Date</small>
                            <div>${formatDate(order.createdAt)}</div>
                        </div>
                    </div>
                </div>
            `;
        });

        mobileHtml += `</div>`;

        recentOrders.innerHTML = desktopHtml + mobileHtml;

    } catch (error) {
        console.error("ORDERS ERROR:", error);
        if (recentOrders) {
            recentOrders.innerHTML = `
                <div class="alert alert-warning mb-0">
                    <i class="bi bi-wifi-off"></i> Recent orders could not be loaded right now. Please refresh the page.
                </div>
            `;
        }
    }
}

/* =========================================================
   REDEEM VOUCHER FUNCTIONALITY
========================================================= */
if (redeemVoucherForm) {
    redeemVoucherForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!redeemCodeInput) return;
        
        const voucherCode = redeemCodeInput.value.trim();
        if (!voucherCode) return;

        if (redeemMsg) {
            redeemMsg.innerHTML = `<div class="alert alert-info mb-0">Processing voucher...</div>`;
        }

        try {
            if (!auth.currentUser) {
                throw new Error("You must be logged in to redeem a voucher.");
            }

            const idToken = await auth.currentUser.getIdToken(true);
            const response = await fetch('/api/redeem-voucher', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ voucherCode })
            });

            const textResponse = await response.text();
            let result;
            try {
                result = JSON.parse(textResponse);
            } catch (e) {
                throw new Error("Server returned an invalid response format.");
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Failed to redeem voucher.");
            }

            if (redeemMsg) {
                redeemMsg.innerHTML = `<div class="alert alert-success mb-0">${result.message}</div>`;
            }
            redeemVoucherForm.reset();
            
            await loadUserInformation(auth.currentUser);
        } catch (error) {
            console.error("REDEEM VOUCHER ERROR:", error);
            if (redeemMsg) {
                redeemMsg.innerHTML = `<div class="alert alert-danger mb-0">${error.message}</div>`;
            }
        }
    });
}

/* =========================================================
   WHATSAPP SUPPORT FORM FUNCTIONALITY
========================================================= */
const whatsappSupportForm = document.getElementById("whatsappSupportForm");
if (whatsappSupportForm) {
    whatsappSupportForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const subjectInput = document.getElementById("waSubject");
        const messageInput = document.getElementById("waMessage");

        if (!subjectInput || !messageInput) return;

        const subject = subjectInput.value.trim();
        const message = messageInput.value.trim();

        if (!subject || !message) return;

        const currentUser = auth.currentUser;
        const userEmail = currentUser ? currentUser.email : "Guest User";
        const phoneNumber = "18253635037";

        const text = `*New Support Message*%0A` +
                     `*From:* ${userEmail}%0A` +
                     `*Subject:* ${subject}%0A` +
                     `*Message:* ${message}`;

        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${text}`;
        window.open(whatsappUrl, '_blank');

        whatsappSupportForm.reset();
    });
}

/* =========================================================
   USER TIERS & UPGRADE SYSTEM
========================================================= */
async function evaluateAndRenderUserTier(userId) {
    try {
        const userRef = ref(database, `users/${userId}`);
        const userSnap = await get(userRef);
        const userData = userSnap.val() || {};
        const currentTier = (userData.tier || 'regular').toLowerCase();
        const totalSpent = Number(userData.totalSpent || 0);

        const badgeEl = document.getElementById('user-current-tier-badge');
        const resellerPromoSection = document.getElementById('resellerPromoSection');

        if (badgeEl) {
            badgeEl.innerText = currentTier.toUpperCase();
            badgeEl.className = "badge ";
            if (currentTier === 'reseller') {
                badgeEl.classList.add('bg-danger');
            } else if (currentTier === 'vip') {
                badgeEl.classList.add('bg-success');
            } else {
                badgeEl.classList.add('bg-secondary');
            }
        }

        if (currentTier === 'reseller') {
            if (resellerPromoSection) {
                resellerPromoSection.innerHTML = `
                    <div class="col-12">
                        <div class="card p-3 shadow border-danger bg-light text-center">
                            <h5 class="text-danger mb-0"><i class="bi bi-patch-check-fill"></i> You are an Official Reseller! Enjoy your exclusive rates.</h5>
                        </div>
                    </div>
                `;
            }
        }

        const actionContainer = document.getElementById('tier-action-container');
        if (!actionContainer) return;

        if (currentTier === 'reseller') {
            actionContainer.innerHTML = `<span style="font-size: 0.8rem; color: #dc3545; display:block;"><i class="bi bi-patch-check-fill"></i> Reseller Status Active</span>`;
            return;
        }

        const reqRef = ref(database, 'tierRequests');
        const reqSnap = await get(reqRef);
        let hasPending = false;
        
        if (reqSnap.exists()) {
            const requests = reqSnap.val();
            Object.values(requests).forEach(req => {
                if (req && req.userId === userId && req.status === 'pending' && req.requestedTier === 'vip') {
                    hasPending = true;
                }
            });
        }

        if (hasPending) {
            actionContainer.innerHTML = `<span style="font-size: 0.8rem; color: #ffc107; display:block;"><i class="bi bi-clock-history"></i> VIP Upgrade Request Pending</span>`;
            return;
        }

        let html = '';
        if (currentTier === 'regular') {
            if (totalSpent >= 60000) {
                html += `<button class="btn btn-success btn-sm w-100 mt-2" onclick="requestTierUpgrade('${userId}', 'vip', 'Total spend of ₦60k+ met')">Request VIP Tier</button>`;
            } else {
                html = `<p class="text-muted small mb-0 mt-2">Spend ₦60,000 total across orders to unlock VIP tier automatically.</p>`;
            }
        } else if (currentTier === 'vip') {
            html = `<p class="text-muted small mb-0 mt-2">You are currently on VIP. Use the Reseller box above to unlock Reseller status anytime.</p>`;
        }

        actionContainer.innerHTML = html;

    } catch (err) {
        console.error("Error evaluating user tier:", err);
    }
}

async function requestTierUpgrade(userId, requestedTier, details) {
    if (!confirm(`Are you sure you want to submit a request for ${requestedTier.toUpperCase()} status?`)) return;

    try {
        const userAuth = auth.currentUser;
        const requestsRef = ref(database, 'tierRequests');
        const newReqRef = push(requestsRef);
        
        await set(newReqRef, {
            userId: userId,
            userEmail: userAuth ? userAuth.email : 'Unknown',
            currentTier: document.getElementById('user-current-tier-badge')?.innerText.toLowerCase() || 'regular',
            requestedTier: requestedTier,
            details: details,
            status: 'pending',
            timestamp: Date.now()
        });

        alert("Tier upgrade request submitted successfully!");
        location.reload();
    } catch (err) {
        console.error("Error submitting upgrade request:", err);
        alert("Failed to submit request.");
    }
}

window.requestTierUpgrade = requestTierUpgrade;

/* =========================================================
   RESELLER MODAL & PAYMENT HANDLERS
========================================================= */
const openResellerModalBtn = document.getElementById("openResellerModalBtn");
const confirmResellerPaymentBtn = document.getElementById("confirmResellerPaymentBtn");
const modalWalletBalance = document.getElementById("modalWalletBalance");
const resellerModalMsg = document.getElementById("resellerModalMsg");

if (openResellerModalBtn) {
    openResellerModalBtn.addEventListener("click", async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const userRef = ref(database, `users/${user.uid}`);
            const snap = await get(userRef);
            const data = snap.val() || {};
            const currentWallet = Number(data.wallet || 0);

            if (modalWalletBalance) {
                modalWalletBalance.textContent = formatNaira(currentWallet);
            }

            if (resellerModalMsg) {
                resellerModalMsg.innerHTML = "";
            }

            const myModal = new bootstrap.Modal(document.getElementById('resellerModal'));
            myModal.show();
        } catch (err) {
            console.error("Error opening reseller modal:", err);
        }
    });
}

if (confirmResellerPaymentBtn) {
    confirmResellerPaymentBtn.addEventListener("click", async () => {
        const user = auth.currentUser;
        if (!user) return;

        confirmResellerPaymentBtn.disabled = true;
        const originalBtnText = confirmResellerPaymentBtn.innerHTML;
        confirmResellerPaymentBtn.innerHTML = "Processing...";

        if (resellerModalMsg) {
            resellerModalMsg.innerHTML = `<div class="alert alert-info mb-0">Processing payment...</div>`;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const idToken = await user.getIdToken(true);
            const response = await fetch('/api/unlock-reseller', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount: 100000 }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const textResponse = await response.text();
            let result;
            try {
                result = JSON.parse(textResponse);
            } catch (e) {
                throw new Error("Server returned an invalid response format.");
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Failed to process reseller upgrade.");
            }

            if (resellerModalMsg) {
                resellerModalMsg.innerHTML = `<div class="alert alert-success mb-0">${result.message}</div>`;
            }

            setTimeout(() => {
                location.reload();
            }, 2000);

        } catch (error) {
            console.error("RESELLER UPGRADE ERROR:", error);
            if (resellerModalMsg) {
                const errorMessage = error.name === 'AbortError' 
                    ? "Request timed out. Please check your connection." 
                    : (error.message || "Load failed. Please try again.");
                resellerModalMsg.innerHTML = `<div class="alert alert-danger mb-0">${errorMessage}</div>`;
            }
            confirmResellerPaymentBtn.disabled = false;
            confirmResellerPaymentBtn.innerHTML = originalBtnText;
        }
    });
}

/* =========================================================
   AUTHENTICATION & INITIALIZATION
========================================================= */
onAuthStateChanged(
    auth,
    async (user) => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        await Promise.allSettled([
            loadUserInformation(user),
            loadRecentOrders(user.uid),
            loadReferralInformation(user.uid),
            evaluateAndRenderUserTier(user.uid)
        ]);
    }
);

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
