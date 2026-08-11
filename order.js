import { auth, database } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    ref,
    get,
    query,
    orderByChild,
    equalTo
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

import {
    hkdmservicesOfficialServicePriceCatalogue
} from "./services.js";



/* =========================================================
   ELEMENTS
========================================================= */

const serviceSelect = document.getElementById("service");
const platformTitle = document.getElementById("platformTitle");
const rateDisplay = document.getElementById("rate");
const totalDisplay = document.getElementById("totalPrice");
const quantityInput = document.getElementById("quantity");
const quantityContainer = document.getElementById("quantityContainer");
const quantityHelp = document.getElementById("quantityHelp");
const fixedPackageInfo = document.getElementById("fixedPackageInfo");
const commentsContainer = document.getElementById("commentsContainer");
const commentsInput = document.getElementById("comments");
const commentCounter = document.getElementById("commentCounter");
const commentStatus = document.getElementById("commentStatus");
const placeOrderButton = document.getElementById("placeOrder");
const message = document.getElementById("message");
const ordersContainer = document.getElementById("ordersContainer");

let currentUser = null;



/* =========================================================
   FORMAT NAIRA
========================================================= */

function formatNaira(amount) {
    return "₦" + Number(amount || 0).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}



/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(timestamp) {
    if (!timestamp) {
        return "—";
    }

    return new Date(timestamp).toLocaleString(
        "en-NG",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}



/* =========================================================
   STATUS BADGE
========================================================= */

function statusBadge(status) {
    const safeStatus = String(status || "pending").toLowerCase();
    let badgeClass = "bg-secondary";

    if (safeStatus === "pending") {
        badgeClass = "bg-warning text-dark";
    }

    if (safeStatus === "processing") {
        badgeClass = "bg-info text-dark";
    }

    if (safeStatus === "completed") {
        badgeClass = "bg-success";
    }

    if (safeStatus === "cancelled" || safeStatus === "failed") {
        badgeClass = "bg-danger";
    }

    return `
        <span class="badge ${badgeClass}">
            ${safeStatus}
        </span>
    `;
}



/* =========================================================
   LOAD USER ORDERS
========================================================= */

async function loadOrders(uid) {
    if (!ordersContainer) {
        return;
    }

    try {
        const ordersQuery = query(
            ref(database, "orders"),
            orderByChild("uid"),
            equalTo(uid)
        );

        const snapshot = await get(ordersQuery);

        if (!snapshot.exists()) {
            ordersContainer.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-cart-x fs-1"></i>
                    <p class="mt-3">
                        You have not placed any orders yet.
                    </p>
                </div>
            `;
            return;
        }

        const orders = snapshot.val();
        const userOrders = Object.values(orders)
            .filter(order => order && order.uid === uid)
            .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

        if (userOrders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-cart-x fs-1"></i>
                    <p class="mt-3">
                        You have not placed any orders yet.
                    </p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Service</th>
                            <th>Link</th>
                            <th>Quantity</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        userOrders.forEach(order => {
            const orderId = order.orderId || "—";
            const targetLink = order.link || order.targetLink || order.url || "";

            html += `
                <tr>
                    <td>
                        <code>${String(orderId).slice(0, 12)}</code>
                    </td>
                    <td>
                        <strong>${order.platform || "—"}</strong>
                        <br>
                        <small class="text-muted">${order.service || "—"}</small>
                    </td>
                    <td>
                        ${
                            targetLink
                                ? `<a href="${targetLink}" target="_blank" class="text-decoration-underline text-truncate d-inline-block" style="max-width: 150px;" title="${targetLink}">${targetLink}</a>`
                                : "—"
                        }
                    </td>
                    <td>${Number(order.quantity || 0).toLocaleString("en-NG")}</td>
                    <td>${formatNaira(order.amount)}</td>
                    <td>${statusBadge(order.status)}</td>
                    <td>
                        <small>${formatDate(order.createdAt)}</small>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        ordersContainer.innerHTML = html;

    } catch (error) {
        console.error("RECENT ORDERS ERROR:", error);
        ordersContainer.innerHTML = `
            <div class="alert alert-danger">
                Unable to load your orders. Please try again.
            </div>
        `;
    }
}



/* =========================================================
   PLATFORM & SERVICE LOGIC
========================================================= */

const urlParams = new URLSearchParams(window.location.search);
const platform = urlParams.get("platform");

function getSelectedService() {
    return hkdmservicesOfficialServicePriceCatalogue.find(
        item => item.id === serviceSelect.value
    );
}

function isCommentService(service) {
    if (!service) return false;
    return String(service.service || "").toLowerCase().includes("comment");
}

function getMinimumQuantity(service) {
    if (!service) return 100;
    if (service.minimumQuantity !== undefined) {
        return Number(service.minimumQuantity);
    }
    return 100;
}

function getComments() {
    return commentsInput.value
        .split(/\r?\n/)
        .map(comment => comment.trim())
        .filter(comment => comment.length > 0);
}

function updateCommentCounter() {
    const comments = getComments();
    const count = comments.length;
    const minimum = 100;

    commentCounter.textContent = `Comments: ${count} / ${minimum}`;

    if (count >= minimum) {
        commentCounter.classList.remove("invalid");
        commentCounter.classList.add("valid");
        commentStatus.textContent = "Minimum reached";
        commentStatus.className = "text-success";
    } else {
        commentCounter.classList.remove("valid");
        commentCounter.classList.add("invalid");
        commentStatus.textContent = `Need ${minimum - count} more comment${minimum - count === 1 ? "" : "s"}`;
        commentStatus.className = "text-danger";
    }

    return count;
}

function updateServiceFields() {
    const selectedService = getSelectedService();

    if (!selectedService) {
        quantityContainer.style.display = "block";
        fixedPackageInfo.classList.add("d-none");
        commentsContainer.classList.add("d-none");
        quantityInput.min = "100";
        quantityInput.value = "100";
        quantityHelp.textContent = "Minimum quantity: 100";
        return;
    }

    if (isCommentService(selectedService)) {
        quantityContainer.style.display = "none";
        fixedPackageInfo.classList.add("d-none");
        commentsContainer.classList.remove("d-none");
        updateCommentCounter();
        return;
    }

    if (selectedService.ratePer1000 === null) {
        quantityContainer.style.display = "block";
        commentsContainer.classList.add("d-none");
        fixedPackageInfo.classList.remove("d-none");
        const minimum = getMinimumQuantity(selectedService);
        quantityInput.min = String(minimum);
        quantityInput.step = "1";
        quantityInput.value = String(Math.max(minimum, 1));
        quantityHelp.textContent = `Minimum package quantity: ${minimum}`;
        return;
    }

    quantityContainer.style.display = "block";
    fixedPackageInfo.classList.add("d-none");
    commentsContainer.classList.add("d-none");
    const minimum = getMinimumQuantity(selectedService);
    quantityInput.min = String(minimum);
    quantityInput.step = "1";

    if (Number(quantityInput.value) < minimum) {
        quantityInput.value = String(minimum);
    }
    quantityHelp.textContent = `Minimum quantity: ${minimum}`;
}

function showMessage(text, type = "danger") {
    message.textContent = text;
    message.className = "alert alert-" + type + " mt-4";
}

function calculateTotal() {
    const selectedService = getSelectedService();

    if (!selectedService) {
        rateDisplay.textContent = "₦0.00";
        totalDisplay.textContent = "₦0.00";
        return;
    }

    if (isCommentService(selectedService)) {
        const commentCount = getComments().length;
        const rate = Number(selectedService.ratePer1000);
        const total = (commentCount / 1000) * rate;

        rateDisplay.textContent = formatNaira(rate);
        totalDisplay.textContent = formatNaira(total);
        return;
    }

    if (selectedService.ratePer1000 === null) {
        const packageQuantity = Number(quantityInput.value) || 0;
        const packagePrice = Number(selectedService.fixedPrice);
        const total = packageQuantity * packagePrice;

        rateDisplay.textContent = formatNaira(packagePrice);
        totalDisplay.textContent = formatNaira(total);
        return;
    }

    const quantity = Number(quantityInput.value) || 0;
    const rate = Number(selectedService.ratePer1000);
    const total = (quantity / 1000) * rate;

    rateDisplay.textContent = formatNaira(rate);
    totalDisplay.textContent = formatNaira(total);
}

serviceSelect.addEventListener("change", () => {
    updateServiceFields();
    calculateTotal();
});

quantityInput.addEventListener("input", () => {
    calculateTotal();
});

commentsInput.addEventListener("input", () => {
    updateCommentCounter();
    calculateTotal();
});



/* =========================================================
   PLACE ORDER SUBMISSION
========================================================= */

placeOrderButton.addEventListener("click", async () => {
    try {
        if (!currentUser) {
            showMessage("Please log in before placing an order.");
            return;
        }

        const selectedService = getSelectedService();
        if (!selectedService) {
            showMessage("Please select a service.");
            return;
        }

        const link = document.getElementById("link").value.trim();
        if (!link) {
            showMessage("Please enter your target link.");
            return;
        }

        let comments = [];
        let quantity;

        if (isCommentService(selectedService)) {
            comments = getComments();
            quantity = comments.length;
            if (quantity < 100) {
                showMessage(`You must provide at least 100 comments. You currently have ${quantity}.`, "warning");
                return;
            }
        } else if (selectedService.ratePer1000 === null) {
            quantity = Number(quantityInput.value);
            const minimum = getMinimumQuantity(selectedService);
            if (!Number.isFinite(quantity) || quantity < minimum) {
                showMessage(`Minimum package quantity is ${minimum}.`);
                return;
            }
        } else {
            quantity = Number(quantityInput.value);
            const minimum = getMinimumQuantity(selectedService);
            if (!Number.isFinite(quantity) || quantity < minimum) {
                showMessage(`Minimum quantity is ${minimum}.`);
                return;
            }
        }

        placeOrderButton.disabled = true;
        placeOrderButton.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Processing Order...`;

        const idToken = await currentUser.getIdToken(true);

        const response = await fetch("/api/create-order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + idToken
            },
            body: JSON.stringify({
                serviceId: selectedService.id,
                link: link,
                quantity: quantity,
                comments: comments
            })
        });

        const result = await response.json();

        if (!response.ok) {
            showMessage(result.message || "Unable to place order.");
            return;
        }

        if (result.success) {
            showMessage("Order placed successfully! Order ID: " + result.orderId, "success");

            document.getElementById("link").value = "";
            commentsInput.value = "";
            quantityInput.value = "100";

            updateServiceFields();
            calculateTotal();

            await loadOrders(currentUser.uid);

        } else {
            showMessage(result.message || "Unable to place order.");
        }

    } catch (error) {
        console.error("ORDER ERROR:", error);
        showMessage("Unable to connect to the order system. Please try again.");
    } finally {
        placeOrderButton.disabled = false;
        placeOrderButton.innerHTML = `<i class="bi bi-cart-check"></i> Place Order`;
    }
});



/* =========================================================
   AUTHENTICATION INITIALIZATION
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        currentUser = user;
        await loadOrders(user.uid);
    }
);



/* =========================================================
   INITIALIZE PLATFORM & SERVICES DROPDOWN
========================================================= */

if (!platform) {
    platformTitle.textContent = "No platform selected.";
    serviceSelect.innerHTML = `<option value="">No platform selected</option>`;
    placeOrderButton.disabled = true;
} else {
    platformTitle.textContent = platform + " Services";
    const platformServices = hkdmservicesOfficialServicePriceCatalogue.filter(
        item => item.platform === platform
    );

    if (platformServices.length === 0) {
        serviceSelect.innerHTML = `<option value="">No services available</option>`;
        placeOrderButton.disabled = true;
    } else {
        serviceSelect.innerHTML = `<option value="">Select a service</option>`;
        platformServices.forEach(service => {
            const option = document.createElement("option");
            option.value = service.id;
            option.textContent = service.service;
            serviceSelect.appendChild(option);
        });
    }
}

updateServiceFields();
calculateTotal();
