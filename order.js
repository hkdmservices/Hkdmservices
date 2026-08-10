import { auth, database } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { hkdmservicesOfficialServicePriceCatalogue } from "./services.js";

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

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    currentUser = user;
});

const urlParams = new URLSearchParams(window.location.search);
const platform = urlParams.get("platform");

function formatNaira(amount) {
    return "₦" + Number(amount || 0).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

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

            if (result.newBalance !== undefined) {
                console.log("New wallet balance:", result.newBalance);
            }

            document.getElementById("link").value = "";
            commentsInput.value = "";
            quantityInput.value = "100";

            updateServiceFields();
            calculateTotal();
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
