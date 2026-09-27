// ============================================================
// My Website Requests — v9 (has project tracking timeline)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

console.log('MY REQUESTS JS LOADED — v9');

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
const container = document.getElementById('requestsContainer');

const MILESTONES = [
    { key: 'quote-accepted',  label: 'Quote accepted' },
    { key: 'deposit-paid',    label: 'Deposit paid' },
    { key: 'design-ready',    label: 'Design mockup ready' },
    { key: 'development',     label: 'Development' },
    { key: 'revisions',       label: 'Revisions' },
    { key: 'delivered',       label: 'Final delivery' }
];

function formatNaira(amount) {
    return '₦' + Number(amount || 0).toLocaleString('en-NG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function formatDate(ts) {
    if (!ts) return '—';
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
        'delivered':     { cls: 'bg-success',           label: 'Delivered' },
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

function buildPaymentBlock(request) {
    const reqId = request.requestId || request.id;
    const quotedPrice = Number(request.quotedPrice || 0);
    const depositPercent = Number(request.depositPercent || 50);
    const depositAmount = Number(request.quotedDeposit || Math.round(quotedPrice * (depositPercent / 100)));
    const customerName = request.name || 'Customer';

    const waText =
        'Hi, I\'ve made the deposit payment for my website request.\n\n' +
        'Reference: ' + reqId + '\n' +
        'Service: ' + (request.categoryName || '') + '\n' +
        'Quoted Price: ₦' + quotedPrice.toLocaleString('en-NG') + '\n' +
        'Deposit Paid: ₦' + depositAmount.toLocaleString('en-NG') + '\n' +
        'Name: ' + customerName + '\n\n' +
        'Please find my payment proof attached.';

    const waLink = 'https://wa.me/' + PAYMENT_WHATSAPP + '?text=' + encodeURIComponent(waText);

    let html = '';
    html += '<div class="payment-block" style="display:none; margin-top:16px; padding:16px; background:rgba(13,110,253,0.06); border-left:4px solid #0d6efd; border-radius:8px;">';
    html += '<div style="font-weight:700; color:#0d6efd; margin-bottom:8px;">';
    html += '<i class="bi bi-credit-card-fill"></i> Payment Required';
    html += '</div>';
    html += '<div style="font-size:0.9rem; margin-bottom:4px;">';
    html += '<strong>Quoted Price:</strong> ' + formatNaira(quotedPrice);
    html += '</div>';
    html += '<div style="font-size:0.9rem; margin-bottom:12px;">';
    html += '<strong>Deposit Required (' + depositPercent + '%):</strong> ';
    html += '<span style="color:#198754; font-weight:700;">' + formatNaira(depositAmount) + '</span>';
    html += '</div>';
    html += '<div style="background:#ffffff; border:1px solid #dee2e6; border-radius:8px; padding:12px; margin-bottom:12px;">';
    html += '<div style="font-size:0.75rem; text-transform:uppercase; color:#6c757d; margin-bottom:6px;">Bank Transfer Details</div>';
    html += '<div style="font-size:0.9rem; line-height:1.6;">';
    html += '<div><strong>Bank:</strong> ' + escapeHtml(BANK_DETAILS.bank) + '</div>';
    html += '<div><strong>Account Number:</strong> ' + escapeHtml(BANK_DETAILS.account) + '</div>';
    html += '<div><strong>Account Name:</strong> ' + escapeHtml(BANK_DETAILS.name) + '</div>';
    html += '<div style="margin-top:6px;"><strong>Amount:</strong> ' + formatNaira(depositAmount) + '</div>';
    html += '<div><strong>Reference:</strong> <code>' + escapeHtml(reqId) + '</code></div>';
    html += '</div>';
    html += '</div>';
    html += '<a href="' + waLink + '" target="_blank" class="btn btn-success w-100">';
    html += '<i class="bi bi-whatsapp"></i> Send Payment Proof on WhatsApp';
    html += '</a>';
    html += '</div>';
    return html;
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
            .map(([id, r]) => Object.assign({ id: id }, r))
            .filter(r => r.uid === user.uid)
            .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

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
            const r = myRequests[i];
            const reqId = r.requestId || r.id;
            const status = r.status || 'pending';

            const hasQuote = !!r.quotedPrice && Number(r.quotedPrice) > 0;
            const isQuoted = hasQuote && (status === 'quoted' || status === 'pending' || status === 'contacted');
            const showTimeline = status === 'deposit-paid' || status === 'delivered';

            const timeline = showTimeline ? buildTimeline(r) : '';
            const paymentBlock = isQuoted ? buildPaymentBlock(r) : '';

            const quoteButton = isQuoted
                ? '<button type="button" class="btn btn-primary w-100 mt-3 quote-toggle-btn">' +
                      '<i class="bi bi-credit-card"></i> Review &amp; Pay Deposit' +
                  '</button>'
                : '';

            const secondColumn = r.quotedPrice
                ? '<strong>Your Price:</strong> <span style="color:#198754;font-weight:700;">' + formatNaira(r.quotedPrice) + '</span>'
                : '<strong>Budget:</strong> ' + escapeHtml(r.budget || '—');

            const adminNote = r.adminNote
                ? '<div class="alert alert-warning mt-3 mb-0" style="font-size:0.85rem;">' +
                      '<strong><i class="bi bi-chat-left-quote"></i> Note from our team:</strong>' +
                      '<div style="margin-top:4px;">' + escapeHtml(r.adminNote) + '</div>' +
                  '</div>'
                : '';

            cardsHtml += '<div class="card border-secondary mb-3">';
            cardsHtml += '<div class="card-body">';
            cardsHtml += '<div class="d-flex justify-content-between align-items-start flex-wrap mb-2">';
            cardsHtml += '<div>';
            cardsHtml += '<h5 class="fw-bold mb-1">' + escapeHtml(r.categoryName || 'Website') + '</h5>';
            cardsHtml += '<small class="text-muted">Reference: <code>' + escapeHtml(reqId) + '</code></small>';
            cardsHtml += '</div>';
            cardsHtml += '<div>' + statusBadge(status) + '</div>';
            cardsHtml += '</div>';
            cardsHtml += '<p class="mb-2">';
            cardsHtml += '<strong>Description:</strong> ' + escapeHtml((r.description || '').slice(0, 180));
            if ((r.description || '').length > 180) cardsHtml += '…';
            cardsHtml += '</p>';
            cardsHtml += '<div class="row g-2 small text-muted">';
            cardsHtml += '<div class="col-6 col-md-3"><strong>Category Price:</strong> ' + formatNaira(r.basePrice) + '</div>';
            cardsHtml += '<div class="col-6 col-md-3">' + secondColumn + '</div>';
            cardsHtml += '<div class="col-6 col-md-3"><strong>Timeline:</strong> ' + escapeHtml(r.timeline || '—') + '</div>';
            cardsHtml += '<div class="col-6 col-md-3"><strong>Submitted:</strong> ' + formatDate(r.createdAt) + '</div>';
            cardsHtml += '</div>';
            cardsHtml += adminNote;
            cardsHtml += quoteButton;
            cardsHtml += paymentBlock;
            cardsHtml += timeline;
            cardsHtml += '</div>';
            cardsHtml += '</div>';
        }

        container.innerHTML = cardsHtml;

        container.querySelectorAll('.quote-toggle-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const card = btn.closest('.card');
                if (!card) return;
                const block = card.querySelector('.payment-block');
                if (!block) return;

                const isOpen = block.style.display === 'block';
                if (isOpen) {
                    block.style.display = 'none';
                    btn.innerHTML = '<i class="bi bi-credit-card"></i> Review &amp; Pay Deposit';
                } else {
                    block.style.display = 'block';
                    btn.innerHTML = '<i class="bi bi-x-circle"></i> Hide Payment Details';
                    block.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });

    } catch (error) {
        console.error('MY REQUESTS ERROR:', error);
        container.innerHTML =
            '<div class="alert alert-danger">Failed to load your requests: ' +
            escapeHtml(error.message || 'Unknown error') +
            '</div>';
    }
});
