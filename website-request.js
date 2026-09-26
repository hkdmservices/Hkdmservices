// ============================================================
// Build Your Website — Request Form
// Categories render FIRST, then Firebase loads after
// ============================================================

// ──────────────────────────────────────────────────────────
// STEP 1 — Categories (do NOT need Firebase)
// ──────────────────────────────────────────────────────────

var CATEGORIES = [
    { id: 'landing',    name: 'Landing Page',      price: 50000,    icon: 'bi-file-earmark-richtext', desc: '1-page site for ads and campaigns' },
    { id: 'business',   name: 'Business Website',  price: 300000,   icon: 'bi-briefcase',             desc: '5-8 pages, SEO, contact form' },
    { id: 'ecommerce',  name: 'E-commerce Store',  price: 600000,   icon: 'bi-cart3',                 desc: 'Products, cart, payment integration' },
    { id: 'custom',     name: 'Custom Web App',    price: 1500000,  icon: 'bi-code-slash',            desc: 'Dashboards, logins, unique features' },
    { id: 'security-audit', name: 'Security Audit',price: 40000,    icon: 'bi-shield-check',          desc: 'Find vulnerabilities in your site' },
    { id: 'security-fix',   name: 'Security Fix',  price: 80000,    icon: 'bi-shield-lock',           desc: 'Fix issues found in a security audit' }
];

function formatNaira(amount) {
    return '₦' + Number(amount || 0).toLocaleString('en-NG');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function renderCategories() {
    var grid = document.getElementById('categoriesGrid');
    if (!grid) return;

    grid.innerHTML = CATEGORIES.map(function(cat) {
        return '<div class="col-12 col-md-6 col-lg-4">' +
            '<div class="card category-card border-secondary" data-cat-id="' + cat.id + '">' +
                '<div class="card-body text-center">' +
                    '<div class="category-icon mb-2"><i class="bi ' + cat.icon + '"></i></div>' +
                    '<h5 class="fw-bold mb-1">' + cat.name + '</h5>' +
                    '<p class="text-muted small mb-2">' + cat.desc + '</p>' +
                    '<div class="price">From ' + formatNaira(cat.price) + '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');

    document.querySelectorAll('.category-card').forEach(function(card) {
        card.addEventListener('click', function() {
            selectCategory(card.dataset.catId);
        });
    });
}

function selectCategory(catId) {
    var cat = CATEGORIES.find(function(c) { return c.id === catId; });
    if (!cat) return;

    document.querySelectorAll('.category-card').forEach(function(c) { c.classList.remove('selected'); });
    var card = document.querySelector('.category-card[data-cat-id="' + catId + '"]');
    if (card) card.classList.add('selected');

    document.getElementById('selectedCategory').value = cat.id;
    document.getElementById('selectedPrice').value = cat.price;

    var formSection = document.getElementById('formSection');
    formSection.style.display = 'block';
    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Render immediately
renderCategories();

// ──────────────────────────────────────────────────────────
// STEP 2 — Firebase (after categories render)
// ──────────────────────────────────────────────────────────

var currentUser = null;

if (typeof firebase !== 'undefined') {

    var firebaseConfig = {
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

    var auth = firebase.auth();
    var database = firebase.database();

    auth.onAuthStateChanged(function(user) {
        if (!user) {
            // Don't redirect if they're just browsing
            return;
        }
        currentUser = user;

        var emailInput = document.getElementById('reqEmail');
        if (emailInput) emailInput.value = user.email || '';

        database.ref('users/' + user.uid).once('value').then(function(snap) {
            var data = snap.val() || {};
            var nameInput = document.getElementById('reqName');
            if (nameInput && data.fullName) nameInput.value = data.fullName;
        }).catch(function(err) {
            console.warn('Prefill failed:', err);
        });
    });

    // ── Form submission ──
    var form = document.getElementById('websiteRequestForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            var formMsg = document.getElementById('formMsg');
            var selectedCatEl = document.getElementById('selectedCategory');

            if (!currentUser) {
                formMsg.innerHTML = '<div class="alert alert-danger">Please log in first.</div>';
                return;
            }

            var cat = CATEGORIES.find(function(c) { return c.id === selectedCatEl.value; });
            if (!cat) {
                formMsg.innerHTML = '<div class="alert alert-danger">Please select a category above.</div>';
                return;
            }

            var payload = {
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
                formMsg.innerHTML = '<div class="alert alert-danger">Please fill in all required fields.</div>';
                return;
            }

            var submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Submitting...';

            try {
                var idToken = await currentUser.getIdToken(true);

                var response = await fetch('/api-php/send-website-request.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + idToken
                    },
                    body: JSON.stringify(payload)
                });

                var result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.message || 'Failed to submit request.');
                }

                formMsg.innerHTML =
                    '<div class="alert alert-success">' +
                        '<h5><i class="bi bi-check-circle-fill"></i> Request Submitted!</h5>' +
                        '<p class="mb-1">Reference: <strong>' + escapeHtml(result.requestId) + '</strong></p>' +
                        '<p class="mb-0">Our tech boss will contact you on WhatsApp within 24 hours.</p>' +
                        '<a href="my-website-requests.html" class="btn btn-success btn-sm mt-3">' +
                            '<i class="bi bi-list-check"></i> View My Requests' +
                        '</a>' +
                    '</div>';

                form.reset();
                selectedCatEl.value = '';
                document.getElementById('selectedPrice').value = '';
                document.querySelectorAll('.category-card').forEach(function(c) { c.classList.remove('selected'); });

            } catch (err) {
                console.error(err);
                formMsg.innerHTML = '<div class="alert alert-danger">' + escapeHtml(err.message) + '</div>';
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-send"></i> Submit Request';
            }
        });
    }
}
