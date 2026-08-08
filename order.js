import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    hkdmservicesOfficialServicePriceCatalogue
} from "./services.js";


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

const commentContainer =
    document.getElementById("commentContainer");

const commentInput =
    document.getElementById("comment");

const placeOrderButton =
    document.getElementById("placeOrder");

const message =
    document.getElementById("message");

const linkInput =
    document.getElementById("link");


// ============================================================
// CURRENT USER
// ============================================================

let currentUser = null;


// ============================================================
// PLATFORM
// ============================================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const platform =
    urlParams.get("platform");


// ============================================================
// FORMAT NAIRA
// ============================================================

function formatNaira(amount) {

    return "₦" +
        Number(amount || 0).toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


// ============================================================
// MESSAGE
// ============================================================

function showMessage(
    text,
    type = "danger"
) {

    message.textContent = text;

    message.className =
        "alert alert-" +
        type +
        " mt-4";

}


// ============================================================
// GET SERVICE
// ============================================================

function getSelectedService() {

    return hkdmservicesOfficialServicePriceCatalogue.find(
        item =>
            item.id === serviceSelect.value
    );

}


// ============================================================
// COMMENT FIELD
// ============================================================

function updateCommentField() {

    const selectedService =
        getSelectedService();


    if (
        selectedService &&
        selectedService.requiresComment
    ) {

        commentContainer.classList.remove(
            "d-none"
        );

        commentInput.required = true;

    } else {

        commentContainer.classList.add(
            "d-none"
        );

        commentInput.required = false;

        commentInput.value = "";

    }

}


// ============================================================
// QUANTITY FIELD
// ============================================================

function updateQuantityField() {

    const selectedService =
        getSelectedService();


    if (!selectedService) {

        quantityContainer.classList.remove(
            "d-none"
        );

        quantityInput.min = 100;
        quantityInput.step = 100;
        quantityInput.value = 100;

        quantityHelp.textContent =
            "Minimum quantity: 100";

        return;

    }


    const minimum =
        Number(
            selectedService.minOrder || 100
        );


    const step =
        Number(
            selectedService.step || minimum
        );


    quantityInput.min =
        minimum;


    quantityInput.step =
        step;


    quantityInput.value =
        minimum;


    quantityContainer.classList.remove(
        "d-none"
    );


    if (
        selectedService.fixedPackage
    ) {

        quantityHelp.textContent =
            "Minimum package quantity: " +
            minimum;

    } else {

        quantityHelp.textContent =
            "Minimum quantity: " +
            minimum;

    }

}


// ============================================================
// CALCULATE TOTAL
// ============================================================

function calculateTotal() {

    const selectedService =
        getSelectedService();


    if (!selectedService) {

        rateDisplay.textContent =
            "₦0.00";

        totalDisplay.textContent =
            "₦0.00";

        return;

    }


    const quantity =
        Number(
            quantityInput.value
        );


    // ========================================================
    // FIXED PRICE PACKAGE
    // ========================================================

    if (
        selectedService.fixedPackage
    ) {

        const packagePrice =
            Number(
                selectedService.fixedPrice || 0
            );


        const total =
            packagePrice * quantity;


        rateDisplay.textContent =
            formatNaira(
                packagePrice
            );


        totalDisplay.textContent =
            formatNaira(
                total
            );


        return;

    }


    // ========================================================
    // NORMAL PER 1,000 SERVICE
    // ========================================================

    const rate =
        Number(
            selectedService.ratePer1000 || 0
        );


    const total =
        (
            quantity / 1000
        ) * rate;


    rateDisplay.textContent =
        formatNaira(rate);


    totalDisplay.textContent =
        formatNaira(total);

}


// ============================================================
// LOAD SERVICES
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

        placeOrderButton.disabled = true;

        return;

    }


    platformTitle.textContent =
        platform + " Services";


    const platformServices =
        hkdmservicesOfficialServicePriceCatalogue.filter(
            item =>
                item.platform === platform
        );


    if (
        platformServices.length === 0
    ) {

        serviceSelect.innerHTML = `
            <option value="">
                No services available
            </option>
        `;

        placeOrderButton.disabled = true;

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

}


// ============================================================
// SERVICE CHANGE
// ============================================================

serviceSelect.addEventListener(
    "change",
    () => {

        updateQuantityField();

        updateCommentField();

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
// AUTHENTICATION
// ============================================================

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        currentUser = user;

    }
);


// ============================================================
// PLACE ORDER
// ============================================================

placeOrderButton.addEventListener(
    "click",
    async () => {

        try {

            // ------------------------------------------------
            // LOGIN CHECK
            // ------------------------------------------------

            if (!currentUser) {

                showMessage(
                    "Please log in before placing an order."
                );

                return;

            }


            // ------------------------------------------------
            // SERVICE
            // ------------------------------------------------

            const selectedService =
                getSelectedService();


            if (!selectedService) {

                showMessage(
                    "Please select a service."
                );

                return;

            }


            // ------------------------------------------------
            // LINK
            // ------------------------------------------------

            const link =
                linkInput.value.trim();


            if (!link) {

                showMessage(
                    "Please enter your target link."
                );

                linkInput.focus();

                return;

            }


            // ------------------------------------------------
            // QUANTITY
            // ------------------------------------------------

            const quantity =
                Number(
                    quantityInput.value
                );


            const minimum =
                Number(
                    selectedService.minOrder || 100
                );


            if (
                !Number.isFinite(quantity) ||
                quantity < minimum
            ) {

                showMessage(
                    "Minimum quantity is " +
                    minimum +
                    "."
                );

                quantityInput.focus();

                return;

            }


            // ------------------------------------------------
            // COMMENT
            // ------------------------------------------------

            let comment = "";


            if (
                selectedService.requiresComment
            ) {

                comment =
                    commentInput.value.trim();


                if (!comment) {

                    showMessage(
                        "Please enter the comment you want delivered."
                    );

                    commentInput.focus();

                    return;

                }

            }


            // ------------------------------------------------
            // DISABLE BUTTON
            // ------------------------------------------------

            placeOrderButton.disabled =
                true;


            placeOrderButton.innerHTML = `
                <span
                    class="spinner-border
                    spinner-border-sm
                    me-2"
                ></span>

                Processing Order...
            `;


            // ------------------------------------------------
            // FIREBASE TOKEN
            // ------------------------------------------------

            const idToken =
                await currentUser.getIdToken(
                    true
                );


            // ------------------------------------------------
            // ORDER DATA
            // ------------------------------------------------

            const orderData = {

                serviceId:
                    selectedService.id,

                link:
                    link,

                quantity:
                    quantity,

                comment:
                    comment

            };


            // ------------------------------------------------
            // SEND TO BACKEND
            // ------------------------------------------------

            const response =
                await fetch(
                    "/api/create-order",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                "Bearer " +
                                idToken

                        },

                        body:
                            JSON.stringify(
                                orderData
                            )

                    }
                );


            // ------------------------------------------------
            // RESPONSE
            // ------------------------------------------------

            let result;


            try {

                result =
                    await response.json();

            } catch {

                result = {};

            }


            if (!response.ok) {

                showMessage(
                    result.message ||
                    "Unable to place order."
                );

                return;

            }


            // ------------------------------------------------
            // SUCCESS
            // ------------------------------------------------

            if (
                result.success
            ) {

                showMessage(

                    "Order placed successfully! " +
                    (
                        result.orderId
                            ? "Order ID: " +
                              result.orderId
                            : ""
                    ),

                    "success"

                );


                linkInput.value = "";


                commentInput.value = "";


                updateQuantityField();


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


            placeOrderButton.innerHTML = `
                <i class="bi bi-cart-check"></i>

                Place Order
            `;

        }

    }
);


// ============================================================
// INITIALIZE
// ============================================================

loadServices();

updateQuantityField();

updateCommentField();

calculateTotal();
