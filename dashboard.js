const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.database();

function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
    
    container.appendChild(notif);
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

function switchTab(tabName) {
    document.querySelectorAll('.dashboard-section').forEach(el => el.classList.remove('active-section'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    const target = document.getElementById(`section-${tabName}`);
    if (target) target.classList.add('active-section');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('onclick')?.includes(`'${tabName}'`)) {
            btn.classList.add('active');
        }
    });
}

// Authentication & Core Data Sync Loader
auth.onAuthStateChanged(user => {
    if (user) {
        loadUserData(user.uid);
        loadUserOrders(user.uid);
    } else {
        window.location.href = "login.html";
    }
});

async function loadUserData(userId) {
    try {
        const userSnap = await db.ref(`users/${userId}`).once('value');
        const data = userSnap.val() || {};

        const wallet = Number(data.wallet || 0);
        const spent = Number(data.totalSpent || 0);
        const funded = Number(data.totalFunded || 0);

        document.getElementById('metric-wallet').innerText = `₦${wallet.toLocaleString()}`;
        document.getElementById('metric-spent').innerText = `₦${spent.toLocaleString()}`;
        document.getElementById('metric-funded').innerText = `₦${funded.toLocaleString()}`;

        // Set referral link
        const refInput = document.getElementById('referral-link-input');
        if (refInput) refInput.value = `https://hkdmservices.xyz/register?ref=${userId}`;

        // Check and render User Tiers & Upgrade buttons
        checkUserTierAndStatus(userId, spent, funded);

    } catch (err) {
        console.error("Error loading user profile data:", err);
    }
}

// Check and Render Tier Status & Dynamic Upgrade Buttons
async function checkUserTierAndStatus(userId, userTotalSpent, userTotalFunded) {
    try {
        const userSnap = await db.ref(`users/${userId}`).once('value');
        const userData = userSnap.val() || {};
        const currentTier = userData.tier || 'regular';

        const badgeEl = document.getElementById('user-current-tier-badge');
        if (badgeEl) {
            badgeEl.className = `badge badge-${currentTier}`;
            badgeEl.innerText = currentTier.toUpperCase();
        }

        const actionContainer = document.getElementById('tier-action-container');
        if (!actionContainer) return;

        if (currentTier === 'reseller') {
            actionContainer.innerHTML = `<p style="font-size: 0.75rem; color: #818cf8; margin-top: 5px;"><i class="fas fa-crown"></i> Max Tier Unlocked</p>`;
            return;
        }

        // Check if there is already a pending request
        const reqSnap = await db.ref('tierRequests').orderByChild('userId').equalTo(userId).once('value');
        let hasPending = false;
        if (reqSnap.exists()) {
            reqSnap.forEach(child => {
                if (child.val().status === 'pending') hasPending = true;
            });
        }

        if (hasPending) {
            actionContainer.innerHTML = `<span style="font-size: 0.75rem; color: var(--warning); display:block; margin-top:5px;"><i class="fas fa-clock"></i> Upgrade Pending Review</span>`;
            return;
        }

        let html = '';
        if (currentTier === 'regular') {
            if (userTotalFunded >= 100000) {
                html += `<button class="btn btn-primary btn-sm" style="margin-top:6px;" onclick="requestTierUpgrade('${userId}', 'reseller', 'Single funding of ₦100k+ met')">Request Reseller</button>`;
            }
            if (userTotalSpent >= 60000) {
                html += `<button class="btn btn-primary btn-sm" style="margin-top:6px;" onclick="requestTierUpgrade('${userId}', 'vip', 'Total spend of ₦60k+ met')">Request VIP Tier</button>`;
            }
            if (html === '') {
                html = `<p style="font-size: 0.7rem; color: var(--text-muted); margin-top:5px;">Spend ₦60k (VIP) or fund ₦100k (Reseller) to unlock.</p>`;
            }
        } else if (currentTier === 'vip') {
            if (userTotalFunded >= 100000) {
                html += `<button class="btn btn-primary btn-sm" style="margin-top:6px;" onclick="requestTierUpgrade('${userId}', 'reseller', 'Single funding of ₦100k+ met')">Upgrade to Reseller</button>`;
            } else {
                html = `<p style="font-size: 0.7rem; color: var(--text-muted); margin-top:5px;">Fund ₦100k+ for Reseller status.</p>`;
            }
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
        const newReqRef = db.ref('tierRequests').push();
        
        await newReqRef.set({
            userId: userId,
            userEmail: userAuth ? userAuth.email : 'Unknown',
            currentTier: document.getElementById('user-current-tier-badge')?.innerText.toLowerCase() || 'regular',
            requestedTier: requestedTier,
            details: details,
            status: 'pending',
            timestamp: Date.now()
        });

        showNotification("Tier upgrade request submitted successfully!", "success");
        setTimeout(() => location.reload(), 1500);
    } catch (err) {
        console.error("Error submitting upgrade request:", err);
        showNotification("Failed to submit request.", "error");
    }
}

async function loadUserOrders(userId) {
    const tbody = document.getElementById('user-orders-table-body');
    if (!tbody) return;

    try {
        const snapshot = await db.ref('orders').orderByChild('userId').equalTo(userId).once('value');
        const orders = snapshot.val();
        tbody.innerHTML = '';

        if (!orders) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center">No orders found.</td></tr>`;
            return;
        }

        Object.keys(orders).forEach(orderId => {
            const order = orders[orderId];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${orderId.substring(0, 8)}...</td>
                <td>${order.serviceName || 'Custom Service'}</td>
                <td>${order.quantity || 1}</td>
                <td>₦${Number(order.charge || 0).toLocaleString()}</td>
                <td><span class="badge badge-${order.status === 'completed' ? 'success' : 'regular'}">${order.status || 'pending'}</span></td>
                <td>${new Date(order.date || Date.now()).toLocaleDateString()}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Error loading orders:", err);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load orders.</td></tr>`;
    }
}

function updateServicesDropdown() {
    const category = document.getElementById('order-category').value;
    const serviceSelect = document.getElementById('order-service');
    serviceSelect.innerHTML = '<option value="">Loading services...</option>';

    db.ref('services').orderByChild('platform').equalTo(category).once('value').then(snapshot => {
        const services = snapshot.val();
        serviceSelect.innerHTML = '';

        if (!services) {
            serviceSelect.innerHTML = '<option value="">No services available for this category</option>';
            return;
        }

        Object.keys(services).forEach(sId => {
            const s = services[sId];
            const opt = document.createElement('option');
            opt.value = sId;
            opt.innerText = `${s.name} — ₦${Number(s.rate || 0).toLocaleString()} per 1k`;
            serviceSelect.appendChild(opt);
        });
    }).catch(err => {
        console.error("Error fetching services:", err);
        serviceSelect.innerHTML = '<option value="">Error loading services</option>';
    });
}

async function submitOrder(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const serviceId = document.getElementById('order-service').value;
    const link = document.getElementById('order-link').value;
    const quantity = parseInt(document.getElementById('order-quantity').value);

    if (!serviceId || !link || isNaN(quantity)) {
        showNotification("Please fill in all order fields correctly.", "error");
        return;
    }

    try {
        const serviceSnap = await db.ref(`services/${serviceId}`).once('value');
        const service = serviceSnap.val();
        if (!service) {
            showNotification("Selected service not found.", "error");
            return;
        }

        const totalCharge = (service.rate / 1000) * quantity;
        const userRef = db.ref(`users/${user.uid}`);
        const userSnap = await userRef.once('value');
        const userData = userSnap.val() || {};
        const currentWallet = Number(userData.wallet || 0);

        if (currentWallet < totalCharge) {
            showNotification("Insufficient wallet balance. Please fund your account.", "error");
            return;
        }

        const updates = {};
        updates[`users/${user.uid}/wallet`] = currentWallet - totalCharge;
        updates[`users/${user.uid}/totalSpent`] = Number(userData.totalSpent || 0) + totalCharge;

        const newOrderRef = db.ref('orders').push();
        updates[`orders/${newOrderRef.key}`] = {
            userId: user.uid,
            userEmail: user.email,
            serviceName: service.name,
            link: link,
            quantity: quantity,
            charge: totalCharge,
            status: 'pending',
            date: Date.now()
        };

        await db.ref().update(updates);
        showNotification("Order placed successfully!", "success");
        document.getElementById('order-form').reset();
        loadUserData(user.uid);
        loadUserOrders(user.uid);
    } catch (err) {
        console.error("Order submission error:", err);
        showNotification("Failed to place order.", "error");
    }
}

async function redeemVoucher(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const code = document.getElementById('voucher-code-input').value.trim();
    if (!code) return;

    try {
        const vRef = db.ref(`vouchers/${code}`);
        const snap = await vRef.once('value');
        const voucher = snap.val();

        if (!voucher || voucher.status === 'used') {
            showNotification("Invalid or already used voucher code.", "error");
            return;
        }

        const amount = Number(voucher.amount || 0);
        const userRef = db.ref(`users/${user.uid}`);
        const userSnap = await userRef.once('value');
        const userData = userSnap.val() || {};

        const updates = {};
        updates[`vouchers/${code}/status`] = 'used';
        updates[`users/${user.uid}/wallet`] = Number(userData.wallet || 0) + amount;
        updates[`users/${user.uid}/totalFunded`] = Number(userData.totalFunded || 0) + amount;

        const txRef = db.ref('transactions').push();
        updates[`transactions/${txRef.key}`] = {
            userId: user.uid,
            amount: amount,
            type: 'voucher_redemption',
            date: Date.now()
        };

        await db.ref().update(updates);
        showNotification(`Voucher redeemed successfully! ₦${amount.toLocaleString()} added.`, "success");
        document.getElementById('voucher-code-input').value = '';
        loadUserData(user.uid);
    } catch (err) {
        console.error("Voucher redemption error:", err);
        showNotification("Failed to redeem voucher.", "error");
    }
}

function copyReferralLink() {
    const input = document.getElementById('referral-link-input');
    input.select();
    navigator.clipboard.writeText(input.value);
    showNotification("Referral link copied to clipboard!", "success");
}
