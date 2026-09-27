// ============================================================
// Build Your Website — Request Form
// Categories are already in HTML. This just handles clicks + form.
// ============================================================

// ──────────────────────────────────────────────────────────
// CATEGORY CLICK HANDLER (no rendering — cards are in HTML)
// ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {

    var cards = document.querySelectorAll('.category-card');

    cards.forEach(function (card) {
        card.addEventListener('click', function () {

            // Highlight selected card
            cards.forEach(function (c) { c.classList.remove('selected'); });
            card.classList.add('selected');

            // Store selection in hidden inputs
            document.getElementById('selectedCategory').value     = card.dataset.catId;
            document.getElementById('selectedCategoryName').value = card.dataset.catName;
            document.getElementById('selectedPrice').value        = card.dataset.catPrice;

            // Show form
            var formSection = document.getElementById('formSection');
            formSection.style.display = 'block';
            formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
});

// ──────────────────────────────────────────────────────────
// FIREBASE — load after DOM is ready
// ──────────────────────────────────────────────────────────

var currentUser = null;

window.addEventListener('load', function () {

    if (typeof firebase === 'undefined') {
        console.warn('Firebase not loaded — form submission will be disabled.');
        return;
    }

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

    auth.onAuthStateChanged(function (user) {
        if (!user) return;

        currentUser = user;

        var emailInput = document.getElementById('reqEmail');
        if (emailInput) emailInput.value = user.email || '';

        database.ref('users/' + user.uid).once('value').then(function (snap) {
            var data = snap.val() || {};
            var nameInput = document.getElementById('reqName');
            if (nameInput && data.fullName) nameInput.value = data.fullName;
        }).catch(function (err) {
            console.warn('Prefill failed:', err);
        });
    });

    // ── Form submit ──
    var form = document.getElementById('websiteRequestForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var formMsg = document.getElementById('formMsg');

        if (!currentUser) {
            formMsg.innerHTML = '<div class="alert alert-danger">Please log in first.</div>';
            return;
        }

        var catId    = document.getElementById('selectedCategory').value;
        var catName  = document.getElementById('selectedCategoryName').value;
        var catPrice = document.getElementById('selectedPrice').value;

        if (!catId) {
            formMsg.innerHTML = '<div class="alert alert-danger">Please select a category above.</div>';
            return;
        }

        var payload = {
            category:     catId,
            categoryName: catName,
            basePrice:    Number(catPrice),
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
                    '<p class="mb-1">Reference: <strong>' + result.requestId + '</strong></p>' +
                    '<p class="mb-0">Our tech boss will contact you on WhatsApp within 24 hours.</p>' +
                    '<a href="my-website-requests.html" class="btn btn-success btn-sm mt-3">' +
                        '<i class="bi bi-list-check"></i> View My Requests' +
                    '</a>' +
                '</div>';

            form.reset();
            document.querySelectorAll('.category-card').forEach(function (c) { c.classList.remove('selected'); });

        } catch (err) {
            console.error(err);
            formMsg.innerHTML = '<div class="alert alert-danger">' + err.message + '</div>';
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-send"></i> Submit Request';
        }
    });
});
