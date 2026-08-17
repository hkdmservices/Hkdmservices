// ============================================================
// HKDMservices ORDER SYSTEM
// Supports:
// 1. General / Official Catalogue
// 2. Nigeria Catalogue
// 3. Regular / Reseller / VIP pricing
// 4. Comments services
// 5. Fixed-price packages
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

import {
    hkdmservicesOfficialServicePriceCatalogue
} from "./services.js";

import {
    hkdmservicesNigeriaServicePriceCatalogue
} from "./nigeria-services-catalogue.js";


// ============================================================
// ELEMENTS
// ============================================================

const serviceSelect =
    document.getElementById("service");

const platformTitle =
    document.getElementById("platformTitle");

const rateDisplay =
    document.getElementById("rate");

const totalDisplay =
    document.getElementById("totalPrice");

const quantityInput =
    document.getElementById("quantity");

const quantityContainer =
    document.getElementById("quantityContainer");

const quantityHelp =
    document.getElementById("quantityHelp");

const fixedPackageInfo =
    document.getElementById("fixedPackageInfo");

const commentsContainer =
    document.getElementById("commentsContainer");

const commentsInput =
    document.getElementById("comments");

const commentCounter =
    document.getElementById("commentCounter");

const commentStatus =
    document.getElementById("commentStatus");

const placeOrderButton =
    document.getElementById("placeOrder");

const message =
    document.getElementById("message");


// ============================================================
// CURRENT USER
// ============================================================

let currentUser = null;

let currentTier = "regular";


// ============================================================
// URL PARAMETERS
// ============================================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const platform =
    urlParams.get("platform");

const catalogue =
    (
        urlParams.get("catalogue") ||
        "general"
    ).toLowerCase();


// ============================================================
// SELECT CATALOGUE
// ============================================================

const currentServices =
    catalogue === "nigeria"
        ? hkdmservicesNigeriaServicePriceCatalogue
        : hkdmservicesOfficialServicePriceCatalogue;


// ============================================================
// FORMAT NAIRA
// ============================================================

function formatNaira(amount) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(
        Number(amount || 0)
    );

}


// ============================================================
// LOAD USER TIER
// ============================================================

async function loadUserTier(user) {

    try {

        const userRef =
            ref(
                database,
                `users/${user.uid}`
            );

        const snapshot =
            await get(userRef);

        if (snapshot.exists()) {

            const userData =
                snapshot.val();

            currentTier =
                String(
                    userData.tier ||
                    "regular"
                ).toLowerCase();

        }

    } catch (error) {

        console.error(
            "Unable to load user tier:",
            error
        );

        currentTier = "regular";

    }

}


// ============================================================
// GET PRICE FOR CURRENT TIER
// ============================================================

function getServiceRate(service) {

    if (!service) {
        return 0;
    }

    if (
        currentTier === "reseller" &&
        service.resellerRatePer1000 !== undefined &&
        service.resellerRatePer1000 !== null
    ) {

        return Number(
            service.resellerRatePer1000
        );

    }

    if (
        currentTier === "vip" &&
        service.vipRatePer1000 !== undefined &&
        service.vipRatePer1000 !== null
    ) {

        return Number(
            service.vipRatePer1000
        );

    }

    return Number(
        service.ratePer1000 || 0
    );

}


// ============================================================
// GET SELECTED SERVICE
// ============================================================

function getSelectedService() {

    return currentServices.find(
        service =>
            String(service.id) ===
            String(serviceSelect.value)
    );

}


// ============================================================
// COMMENT SERVICE
// ============================================================

function isCommentService(service) {

    if (!service) {
        return false;
    }

    return String(
        service.service || ""
    )
        .toLowerCase()
        .includes("comment");

}


// ============================================================
// MINIMUM QUANTITY
// ============================================================

function getMinimumQuantity(service) {

    if (!service) {
        return 100;
    }

    if (
        service.minimumQuantity !== undefined &&
        service.minimumQuantity !== null
    ) {

        return Number(
            service.minimumQuantity
        );

    }

    return 100;

}


// ============================================================
// GET COMMENTS
// ============================================================

function getComments() {

    if (!commentsInput) {
        return [];
    }

    return commentsInput.value
        .split(/\r?\n/)
        .map(
            comment =>
                comment.trim()
        )
        .filter(
            comment =>
                comment.length > 0
        );

}


// ============================================================
// UPDATE COMMENT COUNTER
// ============================================================

function updateCommentCounter() {

    if (
        !commentCounter ||
        !commentStatus
    ) {
        return 0;
    }

    const count =
        getComments().length;

    const minimum = 100;

    commentCounter.textContent =
        `Comments: ${count} / ${minimum}`;

    if (count >= minimum) {

        commentCounter.classList.remove(
            "invalid"
        );

        commentCounter.classList.add(
            "valid"
        );

        commentStatus.textContent =
            "Minimum reached";

        commentStatus.className =
            "text-success";

    } else {

        commentCounter.classList.remove(
            "valid"
        );

        commentCounter.classList.add(
            "invalid"
        );

        const remaining =
            minimum - count;

        commentStatus.textContent =
            `Need ${remaining} more comment${
                remaining === 1
                    ? ""
                    : "s"
            }`;

        commentStatus.className =
            "text-danger";

    }

    return count;

}


// ============================================================
// UPDATE SERVICE FIELDS
// ============================================================

function updateServiceFields() {

    const service =
        getSelectedService();

    if (!service) {

        quantityContainer.style.display =
            "block";

        fixedPackageInfo.classList.add(
            "d-none"
        );

        commentsContainer.classList.add(
            "d-none"
        );

        quantityInput.min =
            "100";

        quantityInput.value =
            "100";

        quantityHelp.textContent =
            "Minimum quantity: 100";

        return;

    }


    // ========================================================
    // COMMENTS
    // ========================================================

    if (
        isCommentService(service)
    ) {

        quantityContainer.style.display =
            "none";

        fixedPackageInfo.classList.add(
            "d-none"
        );

        commentsContainer.classList.remove(
            "d-none"
        );

        updateCommentCounter();

        return;

    }


    // ========================================================
    // FIXED PACKAGE
    // ========================================================

    if (
        service.ratePer1000 === null
    ) {

        quantityContainer.style.display =
            "block";

        commentsContainer.classList.add(
            "d-none"
        );

        fixedPackageInfo.classList.remove(
            "d-none"
        );

        const minimum =
            getMinimumQuantity(service);

        quantityInput.min =
            String(minimum);

        quantityInput.step =
            "1";

        quantityInput.value =
            String(
                Math.max(
                    minimum,
                    1
                )
            );

        quantityHelp.textContent =
            `Minimum package quantity: ${minimum}`;

        return;

    }


    // ========================================================
    // NORMAL SERVICE
    // ========================================================

    quantityContainer.style.display =
        "block";

    fixedPackageInfo.classList.add(
        "d-none"
    );

    commentsContainer.classList.add(
        "d-none"
    );

    const minimum =
        getMinimumQuantity(service);

    quantityInput.min =
        String(minimum);

    quantityInput.step =
        "1";

    if (
        Number(quantityInput.value) <
        minimum
    ) {

        quantityInput.value =
            String(minimum);

    }

    quantityHelp.textContent =
        `Minimum quantity: ${minimum}`;

}


// ============================================================
// CALCULATE TOTAL
// ============================================================

function calculateTotal() {

    const service =
        getSelectedService();

    if (!service) {

        rateDisplay.textContent =
            formatNaira(0);

        totalDisplay.textContent =
            formatNaira(0);

        return 0;

    }

    const rate =
        getServiceRate(service);


    // ========================================================
    // COMMENTS
    // ========================================================

    if (
        isCommentService(service)
    ) {

        const count =
            getComments().length;

        const total =
            (
                count /
                1000
            ) * rate;

        rateDisplay.textContent =
            formatNaira(rate);

        totalDisplay.textContent =
            formatNaira(total);

        return total;

    }


    // ========================================================
    // FIXED PACKAGE
    // ========================================================

    if (
        service.ratePer1000 === null
    ) {

        const quantity =
            Number(
                quantityInput.value
            ) || 0;

        const packagePrice =
            Number(
                service.fixedPrice || 0
            );

        const total =
            quantity *
            packagePrice;

        rateDisplay.textContent =
            formatNaira(packagePrice);

        totalDisplay.textContent =
            formatNaira(total);

        return total;

    }


    // ========================================================
    // NORMAL SERVICE
    // ========================================================

    const quantity =
        Number(
            quantityInput.value
        ) || 0;

    const total =
        (
            quantity /
            1000
        ) * rate;

    rateDisplay.textContent =
        formatNaira(rate);

    totalDisplay.textContent =
        formatNaira(total);

    return total;

}


// ============================================================
// SHOW MESSAGE
// ============================================================

function showMessage(
    text,
    type = "danger"
) {

    message.textContent =
        text;

    message.className =
        `alert alert-${type} mt-4`;

}


// ============================================================
// LOAD SERVICES INTO SELECT
// ============================================================

function loadServices() {

    if (!platform) {

        platformTitle.textContent =
            "No platform selected.";

        serviceSelect.innerHTML = `
            <option value="">
                No platform selected
            </option>
        `;

        placeOrderButton.disabled =
            true;

        return;

    }


    const catalogueName =
        catalogue === "nigeria"
            ? "🇳🇬 Nigeria"
            : "General";


    platformTitle.textContent =
        `${platform} Services — ${catalogueName}`;


    const platformServices =
        currentServices.filter(
            service =>
                String(
                    service.platform || ""
                ).toLowerCase() ===
                String(platform).toLowerCase()
        );


    if (
        platformServices.length === 0
    ) {

        serviceSelect.innerHTML = `
            <option value="">
                No services available
            </option>
        `;

        placeOrderButton.disabled =
            true;

        return;

    }


    serviceSelect.innerHTML = `
        <option value="">
            Select a service
        </option>
    `;


    platformServices.forEach(
        service => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                service.id;

            option.textContent =
                service.service;

            serviceSelect.appendChild(
                option
            );

        }
    );


    placeOrderButton.disabled =
        false;

}


// ============================================================
// SERVICE CHANGE
// ============================================================

serviceSelect.addEventListener(
    "change",
    () => {

        updateServiceFields();

        calculateTotal();

    }
);


// ============================================================
// QUANTITY CHANGE
// ============================================================

quantityInput.addEventListener(
    "input",
    calculateTotal
);


// ============================================================
// COMMENTS CHANGE
// ============================================================

if (commentsInput) {

    commentsInput.addEventListener(
        "input",
        () => {

            updateCommentCounter();

            calculateTotal();

        }
    );

}


// ============================================================
// PLACE ORDER
// ============================================================

placeOrderButton.addEventListener(
    "click",
    async () => {

        try {

            // ==================================================
            // AUTH
            // ==================================================

            if (!currentUser) {

                showMessage(
                    "Please log in before placing an order."
                );

                return;

            }


            // ==================================================
            // SERVICE
            // ==================================================

            const service =
                getSelectedService();

            if (!service) {

                showMessage(
                    "Please select a service."
                );

                return;

            }


            // ==================================================
            // LINK
            // ==================================================

            const linkInput =
                document.getElementById(
                    "link"
                );

            const link =
                linkInput.value.trim();

            if (!link) {

                showMessage(
                    "Please enter your target link."
                );

                return;

            }


            // ==================================================
            // QUANTITY / COMMENTS
            // ==================================================

            let comments = [];

            let quantity;


            if (
                isCommentService(service)
            ) {

                comments =
                    getComments();

                quantity =
                    comments.length;

                if (
                    quantity < 100
                ) {

                    showMessage(
                        `You must provide at least 100 comments. You currently have ${quantity}.`,
                        "warning"
                    );

                    return;

                }

            } else {

                quantity =
                    Number(
                        quantityInput.value
                    );

                const minimum =
                    getMinimumQuantity(
                        service
                    );

                if (
                    !Number.isFinite(quantity) ||
                    quantity < minimum
                ) {

                    showMessage(
                        `Minimum quantity is ${minimum}.`
                    );

                    return;

                }

            }


            // ==================================================
            // BUTTON
            // ==================================================

            placeOrderButton.disabled =
                true;

            placeOrderButton.innerHTML =
                `
                <span
                    class="spinner-border spinner-border-sm me-2"
                ></span>
                Processing Order...
                `;


            // ==================================================
            // FIREBASE TOKEN
            // ==================================================

            const idToken =
                await currentUser.getIdToken(
                    true
                );


            // ==================================================
            // SEND TO SERVER
            // ==================================================

            const response =
                await fetch(
                    "/api/create-order",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${idToken}`

                        },

                        body:
                            JSON.stringify({

                                serviceId:
                                    service.id,

                                link:
                                    link,

                                quantity:
                                    quantity,

                                comments:
                                    comments,

                                catalogue:
                                    catalogue

                            })

                    }
                );


            // ==================================================
            // RESPONSE
            // ==================================================

            const result =
                await response.json();


            if (!response.ok) {

                showMessage(
                    result.message ||
                    "Unable to place order."
                );

                return;

            }


            // ==================================================
            // SUCCESS
            // ==================================================

            if (
                result.success
            ) {

                showMessage(
                    `Order placed successfully! Order ID: ${result.orderId}`,
                    "success"
                );


                linkInput.value =
                    "";


                if (commentsInput) {

                    commentsInput.value =
                        "";

                }


                quantityInput.value =
                    "100";


                updateServiceFields();

                calculateTotal();

            } else {

                showMessage(
                    result.message ||
                    "Unable to place order."
                );

            }


        } catch (error) {

            console.error(
                "ORDER ERROR:",
                error
            );

            showMessage(
                "Unable to connect to the order system. Please try again."
            );

        } finally {

            placeOrderButton.disabled =
                false;

            placeOrderButton.innerHTML =
                `
                <i class="bi bi-cart-check"></i>
                Place Order
                `;

        }

    }
);


// ============================================================
// AUTHENTICATION
// ============================================================

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }

        currentUser =
            user;

        await loadUserTier(
            user
        );

        loadServices();

        updateServiceFields();

        calculateTotal();

    }
);
