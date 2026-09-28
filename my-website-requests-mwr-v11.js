// My Website Requests v11
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getDatabase, ref, get, onValue } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

console.log('MY REQUESTS JS LOADED v11');

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

const BANK_DETAILS = {
    name: 'Sadiq Abdulrauf',
    account: '8135349371',
    bank: 'Opay'
};

const PAYMENT_WHATSAPP = '18253635037';
const PAY_DEPOSIT_ENDPOINT = '/api-php/pay-website-deposit.php';
const PAY_BALANCE_ENDPOINT = '/api-php/pay-website-balance.php';

const container = document.getElementById('requestsContainer');

let currentUser = null;
let walletBalance = 0;

const MILESTONES = [
    { key: 'quote-accepted',  label: 'Quote accepted' },
    { key: 'deposit-paid',    label: 'Deposit paid' },
    { key: 'design-ready',    label: 'Design mockup ready' },
    { key: 'development',     label: 'Development' },
    { key: 'revisions',       label: 'Revisions' },
    { key: 'delivered',       label: 'Final delivery' }
];

function formatNaira(amount) {
    return '\u20A6' + Number(amount || 0).toLocaleString('en-NG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function formatDate(ts) {
    if (!ts) return 'N/A';
    return new Date(Number(ts)).toLocaleString('en-NG', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

function formatDateShort(ts) {
    if (!ts) return '';
    return new Date(Number(ts)).toLocaleDateString('en-NG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function statusBadge(status) {
    const map = {
        'pending':       { cls: 'bg-warning text-dark', label: 'Pending' },
        'contacted':     { cls: 'bg-info text-dark',    label: 'Contacted' },
        'quoted':        { cls: 'bg-primary',           label: 'Quoted' },
        'deposit-paid':  { cls: 'bg-success',           label: 'In Progress' },
        'delivered':     { cls: 'bg-info',              label: 'Awaiting Balance' },
        'fully-paid':    { cls: 'bg-success',           label: 'Fully Paid' },
        'cancelled':     { cls: 'bg-danger',            label: 'Cancelled' }
    };
    const s = String(status || 'pending').toLowerCase();
    const info = map[s] || { cls: 'bg-secondary', label: status };
    return '<span class="badge ' + info.cls + '">' + escapeHtml(info.label) + '</span>';
}

function buildTimeline(request) {
    const milestones = request.milestones || {};
    const progress = Number(request.progress || 0);
    const expectedDelivery = request.expectedDelivery;
    const latestNote = request.latestNote;

    let activeKey = null;
    for (let i = 0; i < MILESTONES.length; i++) {
        const m = MILESTONES[i];
        const data = milestones[m.key];
        if (data && data.done) continue;
        if (data && data.startedAt) { activeKey = m.key; }
        break;
    }

    let stepsHtml = '';
    for (let i = 0; i < MILESTONES.length; i++) {
        const m = MILESTONES[i];
        const data = milestones[m.key] || {};
        const isDone = !!data.done;
        const isActive = m.key === activeKey;
        const at = data.at || data.startedAt;

        let iconColor = '#adb5bd';
        let iconClass = 'bi-circle';
        let labelColor = '#adb5bd';

        if (isDone) {
            iconColor = '#198754';
            iconClass = 'bi-check-circle-fill';
            labelColor = '#198754';
        } else if (isActive) {
            iconColor = '#0d6efd';
            iconClass = 'bi-arrow-repeat';
            labelColor = '#0d6efd';
        }

        stepsHtml += '<div style="display:flex; align-items:flex-start; gap:12px; padding:8px 0;">';
        stepsHtml += '<div style="color:' + iconColor + '; font-size:1.2rem; line-height:1; margin-top:2px;">';
        stepsHtml += '<i class="bi ' + iconClass + '"></i>';
        stepsHtml += '</div>';
        stepsHtml += '<div style="flex:1;">';
        stepsHtml += '<div style="font-weight:600; color:' + labelColor + '; font-size:0.9rem;">';
        stepsHtml += escapeHtml(m.label);
        stepsHtml += '</div>';
        if (at) {
            stepsHtml += '<div style="font-size:0.75rem; color:#6c757d;">' + formatDateShort(at) + '</div>';
        }
        stepsHtml += '</div>';
        stepsHtml += '</div>';
    }

    let progressBar = '';
    if (progress > 0) {
        const pct = Math.min(100, Math.max(0, progress));
        progressBar += '<div style="margin:12px 0 4px;">';
        progressBar += '<div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#6c757d; margin-bottom:4px;">';
        progressBar += '<span>Progress</span>';
        progressBar += '<span><strong>' + pct + '%</strong></span>';
        progressBar += '</div>';
        progressBar += '<div style="height:8px; background:#e9ecef; border-radius:4px; overflow:hidden;">';
        progressBar += '<div style="height:100%; width:' + pct + '%; background:linear-gradient(90deg,#198754,#20c997);"></div>';
        progressBar += '</div>';
        progressBar += '</div>';
    }

    let deliveryDate = '';
    if (expectedDelivery) {
        deliveryDate += '<div style="font-size:0.85rem; color:#6c757d; margin-top:12px;">';
        deliveryDate += '<i class="bi bi-calendar-event"></i> <strong>Expected delivery:</strong> ';
        deliveryDate += formatDateShort(expectedDelivery);
        deliveryDate += '</div>';
    }

    let noteBlock = '';
    if (latestNote) {
        noteBlock += '<div style="margin-top:12px; padding:12px; background:#fff8e1; border-left:3px solid #ffc107; border-radius:6px; font-size:0.85rem;">';
        noteBlock += '<div style="font-weight:600; color:#856404; margin-bottom:4px;">';
        noteBlock += '<i class="bi bi-chat-left-quote"></i> Latest update from our team';
        noteBlock += '</div>';
        noteBlock += '<div style="color:#664d03;">' + escapeHtml(latestNote) + '</div>';
        noteBlock += '</div>';
    }

    let html = '';
    html += '<div style="margin-top:16px; padding:16px; background:#f8f9fa; border-radius:8px; border:1px solid #e9ecef;">';
    html += '<div style="font-weight:700; font-size:0.9rem; margin-bottom:8px; color:#495057;">';
    html += '<i class="bi bi-list-task"></i> Project Progress';
    html += '</div>';
    html += progressBar;
    html += stepsHtml;
    html += deliveryDate;
    html += noteBlock;
    html += '</div>';
    return html;
}

function buildPaymentBlock(request, type) {
    const reqId = request.requestId || request.id;
    const quotedPrice = Number(request.quotedPrice || 0);
    const depositPercent = Number(request.depositPercent || 50);
    const depositAmount = Number(request.quotedDeposit || Math.round(quotedPrice * (depositPercent / 100)));
    const balanceAmount = quotedPrice - depositAmount;

    const amount = type === 'balance' ? balanceAmount : depositAmount;
    const title = type === 'balance' ? 'Balance Payment Required' : 'Payment Required';
    const label = type === 'balance' ? 'Remaining Balance' : 'Deposit Required (' + depositPercent + '%)';
    const canPayFromWallet = walletBalance >= amount;
    const walletBtnClass = canPayFromWallet ? 'btn-success' : 'btn-outline-secondary';
    const walletEndpoint = type === 'balance' ? PAY_BALANCE_ENDPOINT : PAY_DEPOSIT_ENDPOINT;
    const walletLabel = canPayFromWallet
        ? 'Pay ' + formatNaira(amount) + ' from Wallet'
        : 'Insufficient wallet balance (' + formatNaira(walletBalance) + ')';

    const waText =
        'Hi, I have made the ' + (type === 'balance' ? 'balance' : 'deposit') + ' payment for my website request.\n\n' +
        'Reference: ' + reqId + '\n' +
        'Service: ' + (request.categoryName || '') + '\n' +
        'Quoted Price: N' + quotedPrice.toLocaleString('en-NG') + '\n' +
        (type === 'balance' ? 'Balance Paid: N' : 'Deposit Paid: N') + amount.toLocaleString('en-NG') + '\n' +
        'Name: ' + (request.name || 'Customer') + '\n\n' +
        'Please find my payment proof attached.';

    const waLink = 'https://wa.me/' + PAYMENT_WHATSAPP + '?text=' + encodeURIComponent(waText);

    let html = '';
    html += '<div class="payment-block" data-block-type="' + type + '" style="display:none; margin-top:16px; padding:16px; background:rgba(13,110,253,0.06); border-left:4px solid #0d6efd; border-radius:8px;">';
    html += '<div style="font-weight:700; color:#0d6efd; margin-bottom:8px;">';
    html += '<i class="bi bi-credit-card-fill"></i> ' + title;
    html += '</div>';
    html += '<div style="font-size:0.9rem; margin-bottom:4px;">';
    html += '<strong>Quoted Price:</strong> ' + formatNaira(quotedPrice);
    html += '</div>';
    html += '<div style="font-size:0.9rem; margin-bottom:12px;">';
    html += '<strong>' + label + ':</strong> ';
    html += '<span style="color:#198754; font-weight:700;">' + formatNaira(amount) + '</span>';
    html += '</div>';

    html += '<button type="button" class="btn ' + walletBtnClass + ' w-100 mb-3 wallet-pay-btn" ';
    html += 'data-req-id="' + escapeHtml(reqId) + '" ';
    html += 'data-amount="' + amount + '" ';
    html += 'data-type="' + type + '" ';
    html += 'data-endpoint="' + walletEndpoint + '" ';
    if (!canPayFromWallet) html += 'disabled ';
    html += '>';
    html += '<i class="bi bi-wallet2"></i> ' + walletLabel;
    html += '</button>';

    html += '<div style="text-align:center; font-size:0.8rem; color:#6c757d; margin:8px 0;">';
    html += 'OR pay via bank transfer';
    html += '</div>';

    html += '<div style="background:#ffffff; border:1px solid #dee2e6; border-radius:8px; padding:12px; margin-bottom:12px;">';
    html += '<div style="font-size:0.75rem; text-transform:uppercase; color:#6c757d; margin-bottom:6px;">Bank Transfer Details</div>';
    html += '<div style="font-size:0.9rem; line-height:1.6;">';
    html += '<div><strong>Bank:</strong> ' + escapeHtml(BANK_DETAILS.bank) + '</div>';
    html += '<div><strong>Account Number:</strong> ' + escapeHtml(BANK_DETAILS.account) + '</div>';
    html += '<div><strong>Account Name:</strong> ' + escapeHtml(BANK_DETAILS.name) + '</div>';
    html += '<div style="margin-top:6px;"><strong>Amount:</strong> ' + formatNaira(amount) + '</div>';
    html += '<div><strong>Reference:</strong> <code>' + escapeHtml(reqId) + '</code></div>';
    html += '</div>';
    html += '</div>';

    html += '<a href="' + waLink + '" target="_blank" class="btn btn-success w-100">';
    html += '<i class="bi bi-whatsapp"></i> Send Payment Proof on WhatsApp';
    html += '</a>';
    html += '</div>';
    return html;
}

function renderCard(r) {
    const reqId = r.requestId || r.id;
    const status = r.status || 'pending';

    const hasQuote = !!r.quotedPrice && Number(r.quotedPrice) > 0;
    const isQuoted = hasQuote && (status === 'quoted' || status === 'pending' || status === 'contacted');
    const isDepositPaid = status === 'deposit-paid' || status === 'delivered' || status === 'fully-paid';
    const isDelivered = status === 'delivered';
    const isFullyPaid = status === 'fully-paid';

    const showTimeline = isDepositPaid;
    const timeline = showTimeline ? buildTimeline(r) : '';

    const depositBlock = isQuoted ? buildPaymentBlock(r, 'deposit') : '';
    const balanceBlock = isDelivered ? buildPaymentBlock(r, 'balance') : '';

    const depositBtn = isQuoted
        ? '<button type="button" class="btn btn-primary w-100 mt-3 quote-toggle-btn" data-target="deposit">' +
              '<i class="bi bi-credit-card"></i> Review and Pay Deposit' +
          '</button>'
        : '';

    const balanceBtn = isDelivered
        ? '<button type="button" class="btn btn-warning w-100 mt-3 quote-toggle-btn" data-target="balance">' +
              '<i class="bi bi-cash-stack"></i> Pay Remaining Balance' +
          '</button>'
        : '';

    const secondColumn = r.quotedPrice
        ? '<strong>Your Price:</strong> <span style="color:#198754;font-weight:700;">' + formatNaira(r.quotedPrice) + '</span>'
        : '<strong>Budget:</strong> ' + escapeHtml(r.budget || 'N/A');

    const adminNote = r.adminNote
        ? '<div class="alert alert-warning mt-3 mb-0" style="font-size:0.85rem;">' +
              '<strong><i class="bi bi-chat-left-quote"></i> Note from our team:</strong>' +
              '<div style="margin-top:4px;">' + escapeHtml(r.adminNote) + '</div>' +
          '</div>'
        : '';

    const completedBanner = isFullyPaid
        ? '<div class="alert alert-success mt-3 mb-0" style="font-size:0.9rem;">' +
              '<strong><i class="bi bi-check-circle-fill"></i> Project Complete!</strong>' +
              '<div style="margin-top:4px;">Final files will be delivered to your email shortly.</div>' +
          '</div>'
        : '';

    let html = '';
    html += '<div class="card border-secondary mb-3">';
    html += '<div class="card-body">';
    html += '<div class="d-flex justify-content-between align-items-start flex-wrap mb-2">';
    html += '<div>';
    html += '<h5 class="fw-bold mb-1">' + escapeHtml(r.categoryName || 'Website') + '</h5>';
    html += '<small class="text-muted">Reference: <code>' + escapeHtml(reqId) + '</code></small>';
    html += '</div>';
    html += '<div>' + statusBadge(status) + '</div>';
    html += '</div>';
    html += '<p class="mb-2">';
    html += '<strong>Description:</strong> ' + escapeHtml((r.description || '').slice(0, 180));
    if ((r.description || '').length > 180) html += '...';
    html += '</p>';
    html += '<div class="row g-2 small text-muted">';
    html += '<div class="col-6 col-md-3"><strong>Category Price:</strong> ' + formatNaira(r.basePrice) + '</div>';
    html += '<div class="col-6 col-md-3">' + secondColumn + '</div>';
    html += '<div class="col-6 col-md-3"><strong>Timeline:</strong> ' + escapeHtml(r.timeline || 'N/A') + '</div>';
    html += '<div class="col-6 col-md-3"><strong>Submitted:</strong> ' + formatDate(r.createdAt) + '</div>';
    html += '</div>';
    html += adminNote;
    html += completedBanner;
    html += depositBtn;
    html += balanceBtn;
    html += depositBlock;
    html += balanceBlock;
    html += timeline;
    html += '</div>';
    html += '</div>';
    return html;
}

function attachHandlers() {
    container.querySelectorAll('.quote-toggle-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const card = btn.closest('.card');
            if (!card) return;
            const target = btn.dataset.target;

            // Find the payment block with the matching data-block-type
            const block = card.querySelector('.payment-block[data-block-type="' + target + '"]');

            if (!block) {
                console.warn('No payment block found for target:', target);
                return;
            }

            const isOpen = block.style.display === 'block';
            if (isOpen) {
                block.style.display = 'none';
                btn.innerHTML = target === 'balance'
                    ? '<i class="bi bi-cash-stack"></i> Pay Remaining Balance'
                    : '<i class="bi bi-credit-card"></i> Review and Pay Deposit';
            } else {
                block.style.display = 'block';
                btn.innerHTML = '<i class="bi bi-x-circle"></i> Hide Payment Details';
                block.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });

    container.querySelectorAll('.wallet-pay-btn').forEach(function(btn) {
        btn.addEventListener('click', async function() {
            if (btn.disabled) return;
            if (!currentUser) return;

            const reqId = btn.dataset.reqId;
            const amount = Number(btn.dataset.amount);
            const type = btn.dataset.type;
            const endpoint = btn.dataset.endpoint;

            const confirmed = confirm('Pay ' + formatNaira(amount) + ' from your wallet?\n\nRequest: ' + reqId);
            if (!confirmed) return;

            const originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

            try {
                const idToken = await currentUser.getIdToken(true);

                const resp = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + idToken
                    },
                    body: JSON.stringify({ requestId: reqId, amount: amount })
                });

                const result = await resp.json();

                if (!resp.ok || !result.success) {
                    throw new Error(result.message || 'Payment failed');
                }

                alert('Payment successful!\n\nNew wallet balance: ' + formatNaira(result.newBalance));
                window.location.reload();

            } catch (err) {
                console.error('WALLET PAY ERROR:', err);
                alert('Failed: ' + err.message);
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        });
    });
}

onAuthStateChanged(auth, function(user) {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;

    onValue(ref(database, 'users/' + user.uid + '/wallet'), function(snap) {
        walletBalance = Number(snap.val() || 0);
        console.log('Wallet balance:', walletBalance);
    });

    get(ref(database, 'website_requests')).then(function(snap) {
        const data = snap.val() || {};

        const myRequests = Object.entries(data)
            .map(function(entry) { return Object.assign({ id: entry[0] }, entry[1]); })
            .filter(function(r) { return r.uid === user.uid; })
            .sort(function(a, b) { return Number(b.createdAt || 0) - Number(a.createdAt || 0); });

        console.log('My requests loaded:', myRequests.length);

        if (myRequests.length === 0) {
            container.innerHTML =
                '<div class="text-center py-5">' +
                    '<i class="bi bi-code-square" style="font-size:4rem;color:#ccc;"></i>' +
                    '<h4 class="mt-3">No Requests Yet</h4>' +
                    '<p class="text-muted">Submit a request to build your dream website.</p>' +
                    '<a href="build-website.html" class="btn btn-success">' +
                        '<i class="bi bi-plus-circle"></i> Build Your Website' +
                    '</a>' +
                '</div>';
            return;
        }

        let cardsHtml = '';
        for (let i = 0; i < myRequests.length; i++) {
            cardsHtml += renderCard(myRequests[i]);
        }

        container.innerHTML = cardsHtml;
        attachHandlers();

    }).catch(function(error) {
        console.error('MY REQUESTS ERROR:', error);
        container.innerHTML =
            '<div class="alert alert-danger">Failed to load your requests: ' +
            escapeHtml(error.message || 'Unknown error') +
            '</div>';
    });
});
