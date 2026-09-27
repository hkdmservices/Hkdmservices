// ============================================================
// My Website Requests — with manual deposit payment flow
// ============================================================

import {
    auth,
    database
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


// ============================================================
// YOUR BANK DETAILS — CHANGE THESE IF NEEDED
// ============================================================
const BANK_DETAILS = {
    name: 'Sadiq Abdulrauf',
    account: '8135349371',
    bank: 'Opay'
};

// ============================================================
// YOUR WHATSAPP NUMBER (payment proofs come here)
// ============================================================
const PAYMENT_WHATSAPP = '18253635037';


const container = document.getElementById('requestsContainer');


/* =========================================================
   FORMAT NAIRA
========================================================= */
function formatNaira(amount) {
    return '₦' + Number(amount || 0).toLocaleString('en-NG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}


/* =========================================================
   FORMAT DATE
========================================================= */
function formatDate(ts) {
    if (!ts) return '—';
    return new Date(Number(ts)).toLocaleString('en-NG', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}


/* =========================================================
   ESCAPE HTML
========================================================= */
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


/* =========================================================
   STATUS BADGE
========================================================= */
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


/* =========================================================
   BUILD PAYMENT BLOCK (shown when status = "quoted")
========================================================= */
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

    return `
        <div class="payment-block" style="margin-top: 16px; padding: 16px; background: rgba(13,110,253,0.06); border-left: 4px solid #0d6efd; border-radius: 8px;">
            <div style="font-weight: 700; color: #0d6efd; margin-bottom: 8px;">
                <i class="bi bi-credit-card-fill"></i> Payment Required
            </div>

            <div style="font-size: 0.9rem; margin-bottom: 4px;">
                <strong>Quoted Price:</strong> ${formatNaira(quotedPrice)}
            </div>
            <div style="font-size: 0.9rem; margin-bottom: 12px;">
                <strong>Deposit Required (${depositPercent}%):</strong>
                <span style="color: #198754; font-weight: 700;">${formatNaira(depositAmount)}</span>
            </div>

            <div style="background: #ffffff; border: 1px solid #dee2e6; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                <div style="font-size: 0.75rem; text-transform: uppercase; color: #6c757d; margin-bottom: 6px;">
                    Bank Transfer Details
                </div>
                <div style="font-size: 0.9rem; line-height: 1.6;">
                    <div><strong>Bank:</strong> ${escapeHtml(BANK_DETAILS.bank)}</div>
                    <div><strong>Account Number:</strong> ${escapeHtml(BANK_DETAILS.account)}</div>
                    <div><strong>Account Name:</strong> ${escapeHtml(BANK_DETAILS.name)}</div>
                    <div style="margin-top: 6px;"><strong>Amount:</strong> ${formatNaira(depositAmount)}</div>
                    <div><strong>Reference:</strong> <code>${escapeHtml(reqId)}</code></div>
                </div>
            </div>

            <button type="button" class="btn btn-primary proceed-payment-btn w-100" data-req-key="${escapeHtml(request.id || reqId)}">
                <i class="bi bi-check-circle"></i> Proceed with Payment
            </button>

            <div class="proof-block mt-3" style="display: none;">
                <div class="alert alert-success mb-2">
                    <strong>💡 Next step:</strong> After making the transfer, tap the button below to send your payment proof to us on WhatsApp.
                </div>
                <a href="${waLink}" target="_blank" class="btn btn-success w-100">
                    <i class="bi bi-whatsapp"></i> Send Payment Proof on WhatsApp
                </a>
            </div>
        </div>
    `;
}


/* =========================================================
   LOAD USER TRANSACTIONS — MAIN
========================================================= */
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    try {

        /* Only fetch requests that belong to this user */
        const snap = await get(ref(database, 'website_requests'));
        const data = snap.val() || {};

        const myRequests = Object.entries(data)

            .map(([id, r]) => Object.assign({ id }, r))

            .filter(r => r.uid === user.uid)

            .sort((a, b) =>
                Number(b.createdAt || 0) - Number(a.createdAt || 0)
            );


        /* ---------- EMPTY STATE ---------- */
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


        /* ---------- RENDER EACH REQUEST ---------- */
        container.innerHTML = myRequests.map(r => {

            const reqId = r.requestId || r.id;
            const status = r.status || 'pending';
            const statusLabel = status.replace('-', ' ').toUpperCase();

            const paymentBlock =
                status === 'quoted' ? buildPaymentBlock(r) : '';


            return `
                <div class="card border-secondary mb-3">
                    <div class="card-body">

                        <div class="d-flex justify-content-between align-items-start flex-wrap mb-2">
                            <div>
                                <h5 class="fw-bold mb-1">${escapeHtml(r.categoryName || 'Website')}</h5>
                                <small class="text-muted">
                                    Reference: <code>${escapeHtml(reqId)}</code>
                                </small>
                            </div>
                            <div>${statusBadge(status)}</div>
                        </div>

                        <p class="mb-2">
                            <strong>Description:</strong>
                            ${escapeHtml((r.description || '').slice(0, 180))}
                            ${(r.description || '').length > 180 ? '…' : ''}
                        </p>

                        <div class="row g-2 small text-muted">
                            <!-- ✅ CHANGED: show Quoted Price if available, otherwise Starting price -->
                            <div class="col-6 col-md-3">
                                ${r.quotedPrice
                                    ? `<strong>Quoted Price:</strong> ${formatNaira(r.quotedPrice)}`
                                    : `<strong>Starting:</strong> ${formatNaira(r.basePrice)}`}
                            </div>
                            <!-- ✅ CHANGED END -->

                            <div class="col-6 col-md-3">
                                <strong>Timeline:</strong> ${escapeHtml(r.timeline || '—')}
                            </div>
                            <div class="col-6 col-md-3">
                                <strong>Submitted:</strong> ${formatDate(r.createdAt)}
                            </div>
                            <div class="col-6 col-md-3">
                                <strong>Status:</strong> ${escapeHtml(statusLabel)}
                            </div>
                        </div>

                        <!-- ✅ CHANGED: removed duplicate blue "Quoted Price" alert box -->

                        ${r.adminNote ? `
                            <div class="alert alert-warning mt-2 mb-0" style="font-size:0.85rem;">
                                <strong><i class="bi bi-chat-left-quote"></i> Note from our team:</strong>
                                <div style="margin-top:4px;">${escapeHtml(r.adminNote)}</div>
                            </div>
                        ` : ''}

                        ${paymentBlock}

                    </div>
                </div>
            `;
        }).join('');


        /* ---------- ATTACH PROCEED-BUTTON LISTENERS ---------- */
        container.querySelectorAll('.proceed-payment-btn').forEach(btn => {

            btn.addEventListener('click', function () {

                const block = btn.closest('.payment-block');
                if (!block) return;

                const proofBlock = block.querySelector('.proof-block');
                if (proofBlock) {
                    proofBlock.style.display = 'block';
                }

                /* Hide the proceed button */
                btn.style.display = 'none';

                /* Scroll to proof block for visibility */
                if (proofBlock) {
                    proofBlock.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            });
        });


    } catch (error) {

        console.error('MY REQUESTS ERROR:', error);

        container.innerHTML = `
            <div class="alert alert-danger">
                Failed to load your requests. Please refresh the page.
            </div>
        `;
    }
});
