// ============================================================
// Build Your Website — Request Form
// Uses Firebase Compat SDK (works on all browsers)
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

const CATEGORIES = [
    { id: 'landing',    name: 'Landing Page',      price: 50000,    icon: 'bi-file-earmark-richtext', desc: '1-page site for ads and campaigns' },
    { id: 'business',   name: 'Business Website',  price: 300000,   icon: 'bi-briefcase',             desc: '5-8 pages, SEO, contact form' },
    { id: 'ecommerce',  name: 'E-commerce Store',  price: 600000,   icon: 'bi-cart3',                 desc: 'Products, cart, payment integration' },
    { id: 'custom',     name: 'Custom Web App',    price: 1500000,  icon: 'bi-code-slash',            desc: 'Dashboards, logins, unique features' },
    { id: 'security-audit', name: 'Security Audit',price: 40000,    icon: 'bi-shield-check',          desc: 'Find vulnerabilities in your site' },
    { id: 'security-fix',   name: 'Security Fix',  price: 80000,    icon: 'bi-shield-lock',           desc: 'Fix issues found in a security audit' }
];

const categoriesGrid = document.getElementById('categoriesGrid');
const formSection    = document.getElementById('formSection');
const formMsg        = document.getElementById('formMsg');
const form           = document.getElementById('websiteRequestForm');
const selectedCatEl  = document.getElementById('selectedCategory');
const selectedPriceEl= document.getElementById('selectedPrice');

let currentUser = null;

function formatNaira(amount) {
    return '₦' + Number(amount || 0).toLocaleString('en-NG');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function renderCategories() {
    if (!categoriesGrid) {
        console.error('categoriesGrid element not found');
        return;
    }

    categoriesGrid.innerHTML = CATEGORIES.map(cat => `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="card category-card border-secondary" data-cat-id="${cat.id}">
                <div class="card-body text-center">
                    <div class="category-icon mb-2"><i class="bi ${cat.icon}"></i></div>
                    <h5 class="fw-bold mb-1">${cat.name}</h5>
                    <p class="text-muted small mb-2">${cat.desc}</p>
                    <div class="price">From ${formatNaira(cat.price)}</div>
                </div>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => selectCategory(card.dataset.catId));
    });
}

function selectCategory(catId) {
    const cat = CATEGORIES.find(c => c.id === catId);
    if (!cat) return;

    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`.category-card[data-cat-id="${catId}"]`).classList.add('selected');

    selectedCatEl.value = cat.id;
    selectedPriceEl.value = cat.price;

    formSection.style.display = 'block';
    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (currentUser) {
        document.getElementById('reqEmail').value = currentUser.email || '';
    }
}

// Render categories immediately (don't wait for auth)
renderCategories();

// Auth state
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;

    document.getElementById('reqEmail').value = user.email || '';

    try {
        const snapshot = await database.ref('users/' + user.uid).once('value');
        const data = snapshot.val() || {};
        if (data.fullName) {
            document.getElementById('reqName').value = data.fullName;
        }
    } catch (err) {
        console.warn('Prefill failed:', err);
    }
});

// Form submit
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUser) return;

        const cat = CATEGORIES.find(c => c.id === selectedCatEl.value);
        if (!cat) {
            formMsg.innerHTML = `<div class="alert alert-danger">Please select a category above.</div>`;
            return;
        }

        const payload = {
            category:     cat.id,
            categoryName: cat.name,
            basePrice:    cat.price,
            name:         document.getElementById('reqName').value.trim(),
            email:        document.getElementById('reqEmail').value.trim(),
            whatsapp:     document.getElementById('reqWhatsapp').value.trim(),
            business:     document.getElementById('reqBusiness').value.trim(),
            description:  document.getElementById('reqDescription').value.trim(),
            budget:       document.getElementById('reqBudget').value,
            timeline:     document.getElementById('reqTimeline').value
        };

        if (!payload.name || !payload.email || !payload.whatsapp || !payload.description) {
            formMsg.innerHTML = `<div class="alert alert-danger">Please fill in all required fields.</div>`;
            return;
        }

        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Submitting...';

        try {
            const idToken = await currentUser.getIdToken(true);

            const response = await fetch('/api-php/send-website-request.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to submit request.');
            }

            formMsg.innerHTML = `
                <div class="alert alert-success">
                    <h5><i class="bi bi-check-circle-fill"></i> Request Submitted!</h5>
                    <p class="mb-1">Reference: <strong>${escapeHtml(result.requestId)}</strong></p>
                    <p class="mb-0">Our tech boss will contact you on WhatsApp within 24 hours.</p>
                    <a href="my-website-requests.html" class="btn btn-success btn-sm mt-3">
                        <i class="bi bi-list-check"></i> View My Requests
                    </a>
                </div>
            `;

            form.reset();
            selectedCatEl.value = '';
            selectedPriceEl.value = '';
            document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));

        } catch (err) {
            console.error(err);
            formMsg.innerHTML = `<div class="alert alert-danger">${escapeHtml(err.message)}</div>`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-send"></i> Submit Request';
        }
    });
}
