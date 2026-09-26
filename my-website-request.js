import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyADhpdfM0GaMJIkeQw7Q6eBK3u9CaWUC9k",
    authDomain: "hkdmservices-7d59f.firebaseapp.com",
    databaseURL: "https://hkdmservices-7d59f-default-rtdb.firebaseio.com",
    projectId: "hkdmservices-7d59f",
    storageBucket: "hkdmservices-7d59f.firebasestorage.app",
    messagingSenderId: "839538334772",
    appId: "1:839538334772:web:7d8785f87363b6e5d8fe61"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const container = document.getElementById('requestsContainer');

function formatNaira(amount) {
    return '₦' + Number(amount || 0).toLocaleString('en-NG');
}

function formatDate(ts) {
    if (!ts) return '—';
    return new Date(Number(ts)).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function statusBadge(status) {
    const map = {
        'pending':    { cls: 'bg-warning text-dark',  label: 'Pending' },
        'contacted':  { cls: 'bg-info text-dark',     label: 'Contacted' },
        'quoted':     { cls: 'bg-primary',            label: 'Quoted' },
        'deposit-paid': { cls: 'bg-success',          label: 'In Progress' },
        'delivered':  { cls: 'bg-success',            label: 'Delivered' },
        'cancelled':  { cls: 'bg-danger',             label: 'Cancelled' }
    };
    const s = String(status || 'pending').toLowerCase();
    const info = map[s] || { cls: 'bg-secondary', label: status };
    return `<span class="badge ${info.cls}">${escapeHtml(info.label)}</span>`;
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const snap = await get(ref(database, 'website_requests'));
        const data = snap.val() || {};

        const myRequests = Object.entries(data)
            .map(([id, r]) => ({ id, ...r }))
            .filter(r => r.uid === user.uid)
            .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

        if (myRequests.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-code-square" style="font-size:4rem;color:#ccc;"></i>
                    <h4 class="mt-3">No Requests Yet</h4>
                    <p class="text-muted">Submit a request to build your dream website.</p>
                    <a href="build-website.html" class="btn btn-success">
                        <i class="bi bi-plus-circle"></i> Build Your Website
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = myRequests.map(r => `
            <div class="card border-secondary mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start flex-wrap mb-2">
                        <div>
                            <h5 class="fw-bold mb-1">${escapeHtml(r.categoryName || 'Website')}</h5>
                            <small class="text-muted">Reference: <code>${escapeHtml(r.requestId || r.id)}</code></small>
                        </div>
                        <div>${statusBadge(r.status)}</div>
                    </div>

                    <p class="mb-2"><strong>Description:</strong> ${escapeHtml((r.description || '').slice(0, 150))}${(r.description || '').length > 150 ? '…' : ''}</p>

                    <div class="row g-2 small text-muted">
                        <div class="col-6 col-md-3"><strong>Budget:</strong> ${escapeHtml(r.budget || '—')}</div>
                        <div class="col-6 col-md-3"><strong>Timeline:</strong> ${escapeHtml(r.timeline || '—')}</div>
                        <div class="col-6 col-md-3"><strong>Starting:</strong> ${formatNaira(r.basePrice)}</div>
                        <div class="col-6 col-md-3"><strong>Submitted:</strong> ${formatDate(r.createdAt)}</div>
                    </div>

                    ${r.quotedPrice ? `
                        <div class="alert alert-info mt-3 mb-0">
                            <strong>Quoted Price:</strong> ${formatNaira(r.quotedPrice)}
                            ${r.status === 'quoted' ? `
                                <button class="btn btn-success btn-sm ms-3 pay-deposit-btn"
                                        data-request-id="${escapeHtml(r.requestId || r.id)}"
                                        data-amount="${r.quotedDeposit || Math.round(r.quotedPrice * 0.5)}">
                                    <i class="bi bi-wallet2"></i> Pay Deposit from Wallet
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Attach pay-deposit handlers
        document.querySelectorAll('.pay-deposit-btn').forEach(btn => {
            btn.addEventListener('click', () => payDeposit(btn));
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="alert alert-danger">Failed to load requests. Please refresh.</div>`;
    }
});

async function payDeposit(btn) {
    const requestId = btn.dataset.requestId;
    const amount = Number(btn.dataset.amount);

    if (!confirm(`Pay ${formatNaira(amount)} deposit from your wallet?`)) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';

    try {
        const idToken = await auth.currentUser.getIdToken(true);

        const response = await fetch('/api-php/pay-website-deposit.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ requestId, amount })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Payment failed');
        }

        alert(`✅ Deposit paid! New wallet balance: ${formatNaira(result.newBalance)}`);
        location.reload();

    } catch (err) {
        console.error(err);
        alert('❌ ' + err.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-wallet2"></i> Pay Deposit from Wallet';
    }
}
