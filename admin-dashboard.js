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

function switchAdminTab(tabName) {
    document.querySelectorAll('.admin-section').forEach(el => el.classList.remove('active-section'));
    document.querySelectorAll('.admin-tab-btn').forEach(el => el.classList.remove('active'));

    const targetSection = document.getElementById(`admin-section-${tabName}`);
    if (targetSection) targetSection.classList.add('active-section');
    
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        if (btn.getAttribute('onclick')?.includes(`'${tabName}'`)) {
            btn.classList.add('active');
        }
    });

    if (tabName === 'users') loadUsers();
    if (tabName === 'orders') loadOrders();
    if (tabName === 'transactions') loadTransactions();
    if (tabName === 'services') loadServices();
    if (tabName === 'vouchers') loadVouchers();
    if (tabName === 'tiers') loadTierRequests();
}

async function loadUsers() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    
    try {
        const snapshot = await db.ref('users').once('value');
        const users = snapshot.val();
        tbody.innerHTML = '';

        if (!users) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center">No users registered yet.</td></tr>`;
            return;
        }

        Object.keys(users).forEach(uid => {
            const user = users[uid];
            const tier = user.tier || 'regular';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.email || uid}</td>
                <td><span class="badge badge-${tier}">${tier.toUpperCase()}</span></td>
                <td>₦${Number(user.wallet || 0).toLocaleString()}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="manageUserWallet('${uid}', '${user.email || uid}')">
                        <i class="fas fa-wallet"></i> Wallet
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Error loading users:", err);
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Failed to fetch users.</td></tr>`;
    }
}

function manageUserWallet(userId, userEmail) {
    const amountStr = prompt(`Enter funding amount (or use negative number to debit) for user: ${userEmail}`);
    if (amountStr === null) return;
    const amount = parseFloat(amountStr);
    
    if (isNaN(amount)) {
        showNotification("Invalid amount entered.", "error");
        return;
    }

    db.ref(`users/${userId}/wallet`).transaction(currentBalance => {
        return (currentBalance || 0) + amount;
    }, (error, committed) => {
        if (error) {
            showNotification("Failed to update wallet.", "error");
        } else if (committed) {
            showNotification(`Wallet successfully updated for ${userEmail}`, "success");
            loadUsers();
        }
    });
}

async function loadOrders() {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;

    try {
        const snapshot = await db.ref('orders').once('value');
        const orders = snapshot.val();
        tbody.innerHTML = '';

        if (!orders) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center">No orders placed yet.</td></tr>`;
            return;
        }

        Object.keys(orders).forEach(orderId => {
            const order = orders[orderId];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${orderId.substring(0, 8)}...</td>
                <td>${order.userEmail || order.userId || 'N/A'}</td>
                <td>${order.serviceName || 'Custom Service'}</td>
                <td>${order.quantity || 1} units</td>
                <td><span class="badge badge-${order.status === 'completed' ? 'success' : 'regular'}">${order.status || 'pending'}</span></td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="updateOrderStatus('${orderId}', 'completed', '${order.userId}', ${order.charge || 0})">
                        <i class="fas fa-check"></i> Complete
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="updateOrderStatus('${orderId}', 'refunded', '${order.userId}', ${order.charge || 0})">
                        <i class="fas fa-undo"></i> Refund
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Error loading orders:", err);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load orders.</td></tr>`;
    }
}

async function updateOrderStatus(orderId, status, userId, chargeAmount) {
    if (!confirm(`Are you sure you want to mark order as ${status.toUpperCase()}?`)) return;

    try {
        const updates = {};
        updates[`orders/${orderId}/status`] = status;

        if (status === 'refunded' && userId && chargeAmount > 0) {
            const userSnap = await db.ref(`users/${userId}/wallet`).once('value');
            const currentWallet = userSnap.val() || 0;
            updates[`users/${userId}/wallet`] = currentWallet + Number(chargeAmount);
            
            const txRef = db.ref('transactions').push();
            updates[`transactions/${txRef.key}`] = {
                userId: userId,
                amount: chargeAmount,
                type: 'refund',
                date: Date.now()
            };
        }

        await db.ref().update(updates);
        showNotification(`Order marked as ${status} successfully!`, 'success');
        loadOrders();
    } catch (err) {
        console.error("Error updating order:", err);
        showNotification("Failed to update order status.", "error");
    }
}

async function loadTransactions() {
    const tbody = document.getElementById('transactions-table-body');
    if (!tbody) return;

    try {
        const snapshot = await db.ref('transactions').once('value');
        const txs = snapshot.val();
        tbody.innerHTML = '';

        if (!txs) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center">No transaction records found.</td></tr>`;
            return;
        }

        Object.keys(txs).forEach(txId => {
            const tx = txs[txId];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${txId.substring(0, 8)}...</td>
                <td>${tx.userId || 'System'}</td>
                <td>₦${Number(tx.amount || 0).toLocaleString()}</td>
                <td><span class="badge badge-regular">${tx.type || 'funding'}</span></td>
                <td>${new Date(tx.date || Date.now()).toLocaleDateString()}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Error loading transactions:", err);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Failed to fetch transactions.</td></tr>`;
    }
}

async function loadServices() {
    const tbody = document.getElementById('services-table-body');
    if (!tbody) return;

    try {
        const snapshot = await db.ref('services').once('value');
        const services = snapshot.val();
        tbody.innerHTML = '';

        if (!services) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center">No services catalogued.</td></tr>`;
            return;
        }

        Object.keys(services).forEach(sId => {
            const s = services[sId];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sId}</td>
                <td>${s.name}</td>
                <td>${s.platform}</td>
                <td>₦${Number(s.rate || 0).toLocaleString()}</td>
                <td><span class="badge badge-success">${s.status || 'active'}</span></td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Error loading services:", err);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Failed to fetch services.</td></tr>`;
    }
}

async function loadVouchers() {
    const tbody = document.getElementById('vouchers-table-body');
    if (!tbody) return;

    try {
        const snapshot = await db.ref('vouchers').once('value');
        const vouchers = snapshot.val();
        tbody.innerHTML = '';

        if (!vouchers) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center">No active vouchers generated.</td></tr>`;
            return;
        }

        Object.keys(vouchers).forEach(vCode => {
            const v = vouchers[vCode];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${vCode}</strong></td>
                <td>₦${Number(v.amount || 0).toLocaleString()}</td>
                <td><span class="badge badge-${v.status === 'used' ? 'regular' : 'success'}">${v.status || 'active'}</span></td>
                <td>-</td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Error loading vouchers:", err);
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Failed to load vouchers.</td></tr>`;
    }
}

async function loadTierRequests() {
    const tableBody = document.getElementById('tier-requests-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Loading tier upgrade requests...</td></tr>`;

    try {
        const snapshot = await db.ref('tierRequests').once('value');
        const requests = snapshot.val();

        tableBody.innerHTML = '';

        if (!requests) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No pending tier requests found.</td></tr>`;
            return;
        }

        let pendingCount = 0;

        Object.keys(requests).forEach(reqId => {
            const req = requests[reqId];
            
            if (!req.status || req.status === 'pending') {
                pendingCount++;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${req.userEmail || req.userId || 'N/A'}</td>
                    <td><span class="badge badge-${req.currentTier || 'regular'}">${(req.currentTier || 'regular').toUpperCase()}</span></td>
                    <td><span class="badge badge-${req.requestedTier}">${(req.requestedTier || 'vip').toUpperCase()}</span></td>
                    <td>${req.details || 'Verification metrics met'}</td>
                    <td>${new Date(req.timestamp || Date.now()).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="approveTier('${reqId}', '${req.userId}', '${req.requestedTier}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="rejectTier('${reqId}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            }
        });

        if (pendingCount === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No pending tier requests found.</td></tr>`;
        }
    } catch (error) {
        console.error("Error loading tier requests:", error);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load tier requests.</td></tr>`;
    }
}

async function approveTier(requestId, userId, requestedTier) {
    if (!confirm(`Are you sure you want to approve this user's upgrade to ${(requestedTier || 'vip').toUpperCase()}?`)) return;

    try {
        const updates = {};
        updates[`users/${userId}/tier`] = requestedTier;
        updates[`tierRequests/${requestId}/status`] = 'approved';

        await db.ref().update(updates);
        showNotification(`User successfully upgraded to ${(requestedTier || 'vip').toUpperCase()}!`, 'success');
        loadTierRequests();
    } catch (error) {
        console.error("Error approving tier:", error);
        showNotification("Failed to approve tier upgrade.", "error");
    }
}

async function rejectTier(requestId) {
    if (!confirm("Are you sure you want to reject this tier request?")) return;

    try {
        await db.ref(`tierRequests/${requestId}`).update({ status: 'rejected' });
        showNotification("Tier request rejected.", "info");
        loadTierRequests();
    } catch (error) {
        console.error("Error rejecting tier:", error);
        showNotification("Failed to reject tier request.", "error");
    }
}

auth.onAuthStateChanged(user => {
    if (user) {
        user.getIdTokenResult(true).then(() => {
            switchAdminTab('users');
        }).catch(err => {
            console.error("Auth claim validation error:", err);
        });
    } else {
        switchAdminTab('users');
    }
});
