// ============================================================
// HKDMservices — Users Activity Panel
// Access: requires users/{uid}/role === "moderator" OR "admin"
// Forgive-once: unblocking stores current flag hash
// Live updates: panel reacts to Firebase changes automatically
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyADhpdfM0GaMJIkeQw7Q6eBK3u9CaWUC9k",
    authDomain: "hkdmservices-7d59f.firebaseapp.com",
    databaseURL: "https://hkdmservices-7d59f-default-rtdb.firebaseio.com",
    projectId: "hkdmservices-7d59f",
    storageBucket: "hkdmservices-7d59f.firebasestorage.app",
    messagingSenderId: "839538334772",
    appId: "1:839538334772:web:7d8785f87363b6e5d8fe61"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();

let currentAdminUser = null;
let allUsers = {};
let allWalletHistory = {};
let currentViewedUid = null;

// ============================================================
// HELPERS
// ============================================================

function formatNaira(amount) {
    return "₦" + Number(amount || 0).toLocaleString("en-NG", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function formatDate(ts) {
    if (!ts) return "—";
    return new Date(Number(ts)).toLocaleString("en-NG", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function showToast(message, type = "info") {
    const colors = {
        success: "#198754",
        error:   "#dc3545",
        info:    "#0d6efd",
        warning: "#fd7e14"
    };
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.style.cssText = `
        background:#161b22; color:#f1f3f5; border-left:4px solid ${colors[type]};
        padding:12px 18px; border-radius:8px; margin-top:10px; min-width:260px;
        box-shadow:0 4px 12px rgba(0,0,0,0.4); font-size:0.9rem;
    `;
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = "opacity 0.4s";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 400);
    }, 3800);
}

function emailBase(email) {
    if (!email) return null;
    const local = String(email).split("@")[0].toLowerCase();
    return local.split("+")[0].split(".")[0];
}

// ============================================================
// HASH FUNCTION — must match computeFlagHash() in flag-monitor.php
// Returns a readable string, not a hex hash
// ============================================================
function computeFlagHash(flags) {
    const parts = flags.map(f => (f.reason || "") + "|" + (f.hash || ""));
    parts.sort();
    return parts.join("::");
}

// ============================================================
// AUTH + ROLE CHECK
// ============================================================

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "admin-login.html";
        return;
    }

    try {
        const snap = await database.ref("users/" + user.uid).once("value");
        const data = snap.val() || {};

        const role = (data.role || "").toLowerCase();
        const isAdmin = data.isAdmin === true;
        const allowed =
            isAdmin ||
            role === "admin" ||
            role === "moderator";

        if (!allowed) {
            await auth.signOut();
            window.location.href = "admin-login.html";
            return;
        }

        currentAdminUser = user;
        document.getElementById("currentUserEmail").textContent = user.email || "Unknown";
        document.getElementById("panelContent").style.display = "block";

        await loadAllData();
    } catch (err) {
        console.error("Auth check error:", err);
        window.location.href = "admin-login.html";
    }
});

// ============================================================
// LOAD USERS + WALLET HISTORY (with live updates)
// ============================================================

async function loadAllData() {
    try {
        // First load — wait for initial data
        const [usersSnap, historySnap] = await Promise.all([
            database.ref("users").once("value"),
            database.ref("wallet_history").once("value")
        ]);

        allUsers = usersSnap.val() || {};
        allWalletHistory = historySnap.val() || {};

        renderStats();
        renderUserTable();

        // ============================================
        // LIVE LISTENERS — update on any Firebase change
        // ============================================
        database.ref("users").on("value", (snap) => {
            allUsers = snap.val() || {};
            renderStats();
            renderUserTable();

            // If a modal is open, refresh its content too
            if (currentViewedUid && document.getElementById("userDetailModal").classList.contains("show")) {
                renderUserDetail(currentViewedUid);
                updateBlockButton(currentViewedUid);
            }
        });

        database.ref("wallet_history").on("value", (snap) => {
            allWalletHistory = snap.val() || {};
            renderStats();
            renderUserTable();
            if (currentViewedUid && document.getElementById("userDetailModal").classList.contains("show")) {
                renderUserDetail(currentViewedUid);
            }
        });

    } catch (err) {
        console.error("Load error:", err);
        showToast("❌ Failed to load data: " + err.message, "error");
    }
}

// ============================================================
// STATS
// ============================================================

function renderStats() {
    const uids = Object.keys(allUsers);
    let flaggedCount = 0;
    let suspendedCount = 0;
    let walletSum = 0;

    uids.forEach(uid => {
        const user = allUsers[uid] || {};
        if ((user.status || "active") === "suspended") suspendedCount++;
        walletSum += Number(user.wallet || 0);

        const flags = detectFlags(uid, user);
        if (flags.length > 0) flaggedCount++;
    });

    document.getElementById("statTotalUsers").textContent = uids.length;
    document.getElementById("statFlaggedUsers").textContent = flaggedCount;
    document.getElementById("statSuspendedUsers").textContent = suspendedCount;
    document.getElementById("statWalletSum").textContent = formatNaira(walletSum);
}

// ============================================================
// FLAG DETECTION — ALL 14 FLAGS
// ============================================================

function detectFlags(uid, user) {
    const flags = [];
    const history = Object.values(allWalletHistory[uid] || {});
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const now = Date.now();

    if (history.length > 0) {
        history.sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));
    }

    // 1. Unexplained wallet change
    if (history.length > 0) {
        const earliestBefore = Number(history[0].before || 0);
        const currentWallet = Number(user.wallet || 0);
        let expectedDelta = 0;
        history.forEach(h => { expectedDelta += Number(h.amount || 0); });
        const expectedWallet = earliestBefore + expectedDelta;
        const diff = currentWallet - expectedWallet;

        if (Math.abs(diff) > 1) {
            flags.push({
                level: "critical",
                reason: "Unexplained wallet change",
                hash: String(Math.round(diff)),
                text: diff > 0
                    ? `+₦${Math.round(diff).toLocaleString()} unexplained wallet increase`
                    : `-₦${Math.abs(Math.round(diff)).toLocaleString()} unexplained wallet decrease`
            });
        }
    }

    // 2. Refund abuse
    const refundCount = history.filter(h => h.type === "refund").length;
    if (refundCount >= 3) {
        flags.push({ level: "high", reason: "Refund abuse", hash: "rc:" + refundCount, text: `${refundCount} refunds` });
    }

    // 3. Rapid funding
    const recentFundings = history.filter(h =>
        h.type === "wallet_funding" && Number(h.timestamp || 0) >= oneDayAgo
    ).length;
    if (recentFundings >= 5) {
        flags.push({ level: "medium", reason: "Rapid funding", hash: "rf:" + recentFundings, text: `${recentFundings} fundings in 24h` });
    }

    // 4. Rapid orders
    const recentOrders = history.filter(h =>
        h.type === "order_payment" && Number(h.timestamp || 0) >= oneDayAgo
    ).length;
    if (recentOrders >= 10) {
        flags.push({ level: "medium", reason: "Rapid orders", hash: "ro:" + recentOrders, text: `${recentOrders} orders in 24h` });
    }

    // 5. Wash trading
    let washCycles = 0;
    for (let i = 1; i < history.length; i++) {
        const prev = history[i - 1];
        const curr = history[i];
        const gap = Number(curr.timestamp || 0) - Number(prev.timestamp || 0);
        if (prev.type === "wallet_funding" && curr.type === "refund" && gap < (10 * 60 * 1000)) {
            washCycles++;
        }
    }
    if (washCycles >= 2) {
        flags.push({ level: "high", reason: "Wash trading", hash: "wt:" + washCycles, text: `${washCycles} wash-trade cycles` });
    }

    // 6. Zero-balance orders
    const orderPayments = history.filter(h => h.type === "order_payment");
    let zeroBalanceOrders = 0;
    orderPayments.forEach(op => {
        const before = Number(op.before || 0);
        const amount = Math.abs(Number(op.amount || 0));
        if (before < amount) zeroBalanceOrders++;
    });
    if (zeroBalanceOrders >= 1) {
        flags.push({
            level: "critical",
            reason: "Zero-balance orders",
            hash: "zc:" + zeroBalanceOrders,
            text: `${zeroBalanceOrders} zero-balance order${zeroBalanceOrders > 1 ? "s" : ""}`
        });
    }

    // 8. Multiple accounts
    const myBase = emailBase(user.email);
    if (myBase) {
        let sameBaseCount = 0;
        Object.values(allUsers).forEach(other => {
            if (emailBase(other.email) === myBase) sameBaseCount++;
        });
        if (sameBaseCount >= 3) {
            flags.push({ level: "high", reason: "Multiple accounts", hash: "ma:" + sameBaseCount, text: `${sameBaseCount} accounts share email base` });
        }
    }

    // 9. Voucher abuse
    const recentVouchers = history.filter(h =>
        h.type === "voucher" && Number(h.timestamp || 0) >= oneDayAgo
    ).length;
    if (recentVouchers >= 5) {
        flags.push({ level: "high", reason: "Voucher abuse", hash: "va:" + recentVouchers, text: `${recentVouchers} vouchers in 24h` });
    }

    // 10. Referral spam
    const totalRefs = Number(user.totalReferrals || 0);
    if (totalRefs >= 5) {
        flags.push({ level: "high", reason: "Referral spam", hash: "rs:" + totalRefs, text: `${totalRefs} total referrals` });
    }

    // 13. Reseller without fee
    if ((user.tier || "").toLowerCase() === "reseller") {
        const invested = Number(user.totalInvested || 0);
        if (invested < 100000) {
            flags.push({
                level: "critical",
                reason: "Reseller without fee",
                hash: "rw:" + Math.round(invested),
                text: `Reseller but paid only ₦${Math.round(invested).toLocaleString()} (needs ₦100,000)`
            });
        }
    }

    // VIP low spend
    if ((user.tier || "").toLowerCase() === "vip") {
        const spent = Number(user.totalSpent || 0);
        if (spent < 60000) {
            flags.push({
                level: "high",
                reason: "VIP low spend",
                hash: "vs:" + Math.round(spent),
                text: `VIP but only ₦${Math.round(spent).toLocaleString()} spent (needs ₦60,000)`
            });
        }
    }

    // 14. Negative wallet
    if (Number(user.wallet || 0) < 0) {
        flags.push({ level: "critical", reason: "Negative wallet", hash: "neg:" + Math.round(Number(user.wallet)), text: `Negative wallet: ${formatNaira(user.wallet)}` });
    }

    // 15. High refund ratio
    const orderCount = history.filter(h => h.type === "order_payment").length;
    if (orderCount >= 2 && refundCount > 0) {
        const ratio = refundCount / orderCount;
        if (ratio > 0.5) {
            flags.push({ level: "critical", reason: "High refund rate", hash: "hr:" + Math.round(ratio * 100), text: `${Math.round(ratio * 100)}% refund rate` });
        }
    }

    // 18. Self-referral
    if (user.referralCode && String(user.referralCode) === String(uid)) {
        flags.push({ level: "critical", reason: "Self-referral", hash: "sr:code", text: `Self-referral (own UID)` });
    }
    if (user.referredBy && String(user.referredBy) === String(uid)) {
        flags.push({ level: "critical", reason: "Self-referral", hash: "sr:by", text: `Referred by self` });
    }

    return flags;
}

// ============================================================
// USER TABLE
// ============================================================

function renderUserTable() {
    const tbody = document.getElementById("usersTable");
    const searchTerm = (document.getElementById("userSearch")?.value || "").toLowerCase();
    const statusFilter = document.getElementById("userStatusFilter")?.value || "all";
    const flagFilter = document.getElementById("flagFilter")?.value || "all";

    let entries = Object.entries(allUsers);

    entries = entries.filter(([uid, user]) => {
        const name = (user.fullName || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        const userUid = uid.toLowerCase();

        const matchesSearch = !searchTerm ||
            name.includes(searchTerm) ||
            email.includes(searchTerm) ||
            userUid.includes(searchTerm);

        const userStatus = user.status || "active";
        const matchesStatus = statusFilter === "all" || userStatus === statusFilter;

        const flags = detectFlags(uid, user);
        const matchesFlag = flagFilter === "all" || (flagFilter === "flagged" && flags.length > 0);

        return matchesSearch && matchesStatus && matchesFlag;
    });

    entries.sort((a, b) => {
        const aFlags = detectFlags(a[0], a[1]).length;
        const bFlags = detectFlags(b[0], b[1]).length;
        if (aFlags !== bFlags) return bFlags - aFlags;
        return (a[1].fullName || "").localeCompare(b[1].fullName || "");
    });

    document.getElementById("userCount").textContent = entries.length + " users";

    if (entries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No users match your filters.</td></tr>`;
        return;
    }

    tbody.innerHTML = entries.map(([uid, user]) => {
        const isSuspended = (user.status || "active") === "suspended";
        const tier = (user.tier || "regular").toUpperCase();
        const tierClass = { "RESELLER": "bg-danger", "VIP": "bg-success", "REGULAR": "bg-secondary" }[tier] || "bg-secondary";
        const flags = detectFlags(uid, user);
        const flagsHtml = flags.length === 0
            ? `<span class="text-muted small">—</span>`
            : flags.map(f => `<span class="flag-badge flag-${f.level}">${escapeHtml(f.text)}</span>`).join("");

        return `
            <tr class="user-row" onclick="openUserDetail('${uid}')">
                <td><code class="uid-code">${escapeHtml(uid)}</code></td>
                <td>${escapeHtml(user.fullName || "—")}</td>
                <td>${escapeHtml(user.email || "—")}</td>
                <td class="fw-bold">${formatNaira(user.wallet)}</td>
                <td><span class="badge ${tierClass}">${tier}</span></td>
                <td><span class="badge ${isSuspended ? 'bg-danger' : 'bg-success'}">${isSuspended ? 'Suspended' : 'Active'}</span></td>
                <td style="max-width:260px;">${flagsHtml}</td>
                <td><i class="bi bi-chevron-right text-muted"></i></td>
            </tr>
        `;
    }).join("");
}

// ============================================================
// OPEN USER DETAIL MODAL
// ============================================================

async function openUserDetail(uid) {
    currentViewedUid = uid;
    const user = allUsers[uid] || {};
    document.getElementById("modalUserName").textContent = user.fullName || user.email || uid;

    const bodyEl = document.getElementById("modalBody");
    bodyEl.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-success"></div></div>`;

    const modal = new bootstrap.Modal(document.getElementById("userDetailModal"));
    modal.show();

    try {
        const ordersSnap = await database.ref("orders").orderByChild("uid").equalTo(uid).once("value");
        user._orders = ordersSnap.val() || {};
        allUsers[uid]._orders = user._orders;
    } catch (err) {
        user._orders = {};
    }

    renderUserDetail(uid);
    updateBlockButton(uid);
}

function renderUserDetail(uid) {
    const user = allUsers[uid] || {};
    const history = Object.values(allWalletHistory[uid] || {});
    history.sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));

    const flags = detectFlags(uid, user);
    const isSuspended = (user.status || "active") === "suspended";
    const tier = (user.tier || "regular").toUpperCase();
    const tierClass = { "RESELLER": "bg-danger", "VIP": "bg-success", "REGULAR": "bg-secondary" }[tier] || "bg-secondary";

    let html = `
        <div class="row g-3 mb-4">
            <div class="col-md-6">
                <div class="section-title">Account Information</div>
                <div class="d-flex justify-content-between py-1"><span class="text-muted small">UID</span><code style="font-size:0.7rem; word-break:break-all;">${escapeHtml(uid)}</code></div>
                <div class="d-flex justify-content-between py-1"><span class="text-muted small">Name</span><span>${escapeHtml(user.fullName || "—")}</span></div>
                <div class="d-flex justify-content-between py-1"><span class="text-muted small">Email</span><span>${escapeHtml(user.email || "—")}</span></div>
                <div class="d-flex justify-content-between py-1"><span class="text-muted small">Tier</span><span class="badge ${tierClass}">${tier}</span></div>
                <div class="d-flex justify-content-between py-1"><span class="text-muted small">Status</span><span class="badge ${isSuspended ? 'bg-danger' : 'bg-success'}">${isSuspended ? 'Suspended' : 'Active'}</span></div>
            </div>
            <div class="col-md-6">
                <div class="section-title">Financials</div>
                <div class="d-flex justify-content-between py-1"><span class="text-muted small">Wallet</span><span class="fw-bold text-success">${formatNaira(user.wallet)}</span></div>
                <div class="d-flex justify-content-between py-1"><span class="text-muted small">Total Spent</span><span>${formatNaira(user.totalSpent)}</span></div>
                <div class="d-flex justify-content-between py-1"><span class="text-muted small">Total Invested</span><span>${formatNaira(user.totalInvested)}</span></div>
                <div class="d-flex justify-content-between py-1"><span class="text-muted small">Referral Code</span><code style="font-size:0.7rem;">${escapeHtml(user.referralCode || uid)}</code></div>
                <div class="d-flex justify-content-between py-1"><span class="text-muted small">Referrals</span><span>${user.totalReferrals || 0}</span></div>
            </div>
        </div>
    `;

    if (flags.length > 0) {
        html += `
            <div class="mb-4 p-3" style="background:rgba(220,53,69,0.1); border-left:4px solid #dc3545; border-radius:6px;">
                <div class="fw-bold text-danger mb-2"><i class="bi bi-flag-fill"></i> Suspicious Activity Detected</div>
                ${flags.map(f => `<span class="flag-badge flag-${f.level}">${escapeHtml(f.text)}</span>`).join("")}
            </div>
        `;
    }

    if (user.unblockClearedHash) {
        html += `
            <div class="mb-4 p-2" style="background:rgba(25,135,84,0.1); border-left:4px solid #198754; border-radius:6px; font-size:0.8rem;">
                <i class="bi bi-shield-check text-success"></i>
                <strong>Forgiven:</strong> previous flags were cleared (hash: <code>${escapeHtml(user.unblockClearedHash)}</code>).
                Will re-block if new flags appear.
            </div>
        `;
    }

    html += `
        <div class="section-title">Wallet Timeline (${history.length} entries)</div>
        <div style="max-height:420px; overflow-y:auto; border:1px solid var(--border-card); border-radius:8px;">
    `;

    if (history.length === 0) {
        html += `<div class="text-center text-muted py-4">No wallet history recorded yet.</div>`;
    } else {
        html += history.map(h => {
            const amount = Number(h.amount || 0);
            const isCredit = amount > 0;
            const cssClass = isCredit ? "credit" : "debit";
            const typeColors = { "wallet_funding": "success", "order_payment": "primary", "voucher": "info", "refund": "warning", "reseller_upgrade": "danger" };
            const typeColor = typeColors[h.type] || "secondary";
            const meta = [];
            if (h.reference) meta.push(`Ref: ${escapeHtml(h.reference)}`);
            if (h.orderId) meta.push(`Order: ${escapeHtml(h.orderId)}`);
            if (h.voucherCode) meta.push(`Voucher: ${escapeHtml(h.voucherCode)}`);
            if (h.service) meta.push(escapeHtml(h.service));
            if (h.method) meta.push(escapeHtml(h.method));
            if (h.fee) meta.push(`Fee: ${formatNaira(h.fee)}`);

            return `
                <div class="timeline-entry ${cssClass}">
                    <div>
                        <div class="timeline-type"><span class="badge bg-${typeColor}" style="font-size:0.7rem;">${escapeHtml(h.type || "—")}</span></div>
                        <div class="timeline-meta">${meta.join(" • ")}</div>
                        <div class="timeline-meta">${formatDate(h.timestamp)}</div>
                    </div>
                    <div class="text-end">
                        <div class="timeline-amount ${isCredit ? 'text-success' : 'text-danger'}">${isCredit ? "+" : ""}${formatNaira(amount)}</div>
                        <div class="timeline-meta">${formatNaira(h.before)} → ${formatNaira(h.after)}</div>
                    </div>
                </div>
            `;
        }).join("");
    }

    html += `</div>`;
    document.getElementById("modalBody").innerHTML = html;
}

// ============================================================
// BLOCK / UNBLOCK
// ============================================================

function updateBlockButton(uid) {
    const user = allUsers[uid] || {};
    const isSuspended = (user.status || "active") === "suspended";
    const btn = document.getElementById("btnBlockUser");

    if (isSuspended) {
        btn.className = "btn btn-success";
        btn.innerHTML = `<i class="bi bi-check-circle"></i> <span id="blockBtnText">Unblock User (Forgive)</span>`;
    } else {
        btn.className = "btn btn-warning";
        btn.innerHTML = `<i class="bi bi-slash-circle"></i> <span id="blockBtnText">Block User</span>`;
    }
}

document.getElementById("btnBlockUser").addEventListener("click", async () => {
    if (!currentViewedUid) return;

    const user = allUsers[currentViewedUid] || {};
    const isSuspended = (user.status || "active") === "suspended";

    if (isSuspended) {
        const flags = detectFlags(currentViewedUid, user);
        const currentHash = computeFlagHash(flags);

        if (!confirm(`Unblock this user and forgive their current flags?\n\nHash: ${currentHash}\n\nThey will be re-blocked automatically if any new or different flags appear.`)) {
            return;
        }

        try {
            const updates = {
                ["users/" + currentViewedUid + "/status"]: "active",
                ["users/" + currentViewedUid + "/unblockedAt"]: Date.now(),
                ["users/" + currentViewedUid + "/unblockedBy"]: currentAdminUser.email || currentAdminUser.uid,
                ["users/" + currentViewedUid + "/unblockClearedHash"]: currentHash,
            };

            await database.ref().update(updates);
            allUsers[currentViewedUid].status = "active";
            allUsers[currentViewedUid].unblockClearedHash = currentHash;

            showToast(`✅ User unblocked. Flags forgiven (hash: ${currentHash}).`, "success");
            updateBlockButton(currentViewedUid);
            renderUserTable();
            renderStats();
        } catch (err) {
            console.error("Unblock error:", err);
            showToast("❌ Failed: " + err.message, "error");
        }
    } else {
        const reason = prompt(`Reason for blocking ${user.fullName || user.email || currentViewedUid}:`);
        if (!reason) return;
        if (!confirm(`Are you sure you want to block this user?`)) return;

        try {
            const updates = {
                ["users/" + currentViewedUid + "/status"]: "suspended",
                ["users/" + currentViewedUid + "/blockedAt"]: Date.now(),
                ["users/" + currentViewedUid + "/blockedBy"]: currentAdminUser.email || currentAdminUser.uid,
                ["users/" + currentViewedUid + "/blockedReason"]: reason,
            };

            await database.ref().update(updates);
            allUsers[currentViewedUid].status = "suspended";

            showToast(`✅ User blocked`, "success");
            updateBlockButton(currentViewedUid);
            renderUserTable();
            renderStats();
        } catch (err) {
            console.error("Block error:", err);
            showToast("❌ Failed: " + err.message, "error");
        }
    }
});

// ============================================================
// FILTER EVENT LISTENERS
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("userSearch")?.addEventListener("input", renderUserTable);
    document.getElementById("userStatusFilter")?.addEventListener("change", renderUserTable);
    document.getElementById("flagFilter")?.addEventListener("change", renderUserTable);
});

window.openUserDetail = openUserDetail;
