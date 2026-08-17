// ============================================================
// HKDMservices Nigeria Services Page
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
    hkdmservicesNigeriaServicePriceCatalogue
} from "./nigeria-services-catalogue.js";


// ============================================================
// ELEMENTS
// ============================================================

const servicesContainer =
    document.getElementById("servicesContainer");

const noServices =
    document.getElementById("noServices");

const serviceSearch =
    document.getElementById("serviceSearch");

const serviceCount =
    document.getElementById("serviceCount");

const tierInfo =
    document.getElementById("tierInfo");

const platformFilters =
    document.querySelectorAll(".platform-filter");


// ============================================================
// STATE
// ============================================================

let nigeriaServices = [];

let currentPlatform = "all";

let currentSearch = "";

let currentTier = "regular";


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
    ).format(Number(amount || 0));

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================================
// GET USER TIER
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
                    userData.tier || "regular"
                ).toLowerCase();

        } else {

            currentTier = "regular";

        }

    } catch (error) {

        console.error(
            "NIGERIA USER TIER ERROR:",
            error
        );

        currentTier = "regular";

    }

    updateTierDisplay();

}


// ============================================================
// UPDATE TIER DISPLAY
// ============================================================

function updateTierDisplay() {

    if (!tierInfo) {
        return;
    }

    const tier =
        currentTier.toLowerCase();

    let badgeClass =
        "bg-secondary";

    if (tier === "vip") {
        badgeClass =
            "bg-warning text-dark";
    }

    if (tier === "reseller") {
        badgeClass =
            "bg-danger";
    }

    tierInfo.innerHTML = `

        <i class="bi bi-shield-check"></i>

        <strong class="badge ${badgeClass}">
            ${escapeHtml(tier.toUpperCase())}
        </strong>

        pricing is currently displayed.

    `;

}


// ============================================================
// GET PRICE FOR USER TIER
// ============================================================

function getServicePrice(service) {

    const regularPrice =
        Number(
            service.ratePer1000 || 0
        );

    if (
        currentTier === "reseller" &&
        service.resellerRatePer1000 !== undefined
    ) {

        return Number(
            service.resellerRatePer1000
        );

    }

    if (
        currentTier === "vip" &&
        service.vipRatePer1000 !== undefined
    ) {

        return Number(
            service.vipRatePer1000
        );

    }

    return regularPrice;

}


// ============================================================
// LOAD NIGERIA CATALOGUE
// ============================================================

async function loadNigeriaServices() {

    /*
     * Primary source:
     *
     * nigeria-services-catalogue.js
     *
     * Firebase is checked first only if the Nigeria
     * catalogue has been intentionally published there.
     */

    try {

        const servicesRef =
            ref(
                database,
                "services/nigeria"
            );

        const snapshot =
            await get(servicesRef);

        if (snapshot.exists()) {

            const data =
                snapshot.val();

            nigeriaServices =
                Object.entries(data)
                    .map(
                        ([key, value]) => ({
                            id: value.id || key,
                            ...value
                        })
                    );

        } else {

            nigeriaServices =
                Array.isArray(
                    hkdmservicesNigeriaServicePriceCatalogue
                )
                    ? hkdmservicesNigeriaServicePriceCatalogue
                    : [];

        }

    } catch (error) {

        console.warn(
            "Firebase Nigeria catalogue unavailable. Using local catalogue.",
            error
        );

        nigeriaServices =
            Array.isArray(
                hkdmservicesNigeriaServicePriceCatalogue
            )
                ? hkdmservicesNigeriaServicePriceCatalogue
                : [];

    }

    renderServices();

}


// ============================================================
// FILTER SERVICES
// ============================================================

function getFilteredServices() {

    const search =
        currentSearch.toLowerCase();

    return nigeriaServices.filter(
        service => {

            const platform =
                String(
                    service.platform || ""
                );

            const serviceName =
                String(
                    service.service || ""
                );

            const id =
                String(
                    service.id || ""
                );

            const platformMatch =
                currentPlatform === "all" ||
                platform.toLowerCase() ===
                currentPlatform.toLowerCase();

            const searchMatch =
                !search ||

                platform.toLowerCase().includes(
                    search
                ) ||

                serviceName.toLowerCase().includes(
                    search
                ) ||

                id.toLowerCase().includes(
                    search
                );

            return (
                platformMatch &&
                searchMatch
            );

        }
    );

}


// ============================================================
// RENDER SERVICES
// ============================================================

function renderServices() {

    if (!servicesContainer) {
        return;
    }

    const filteredServices =
        getFilteredServices();

    if (serviceCount) {

        serviceCount.textContent =
            `${filteredServices.length} Services`;

    }

    servicesContainer.innerHTML = "";

    if (
        filteredServices.length === 0
    ) {

        if (noServices) {

            noServices.classList.remove(
                "d-none"
            );

        }

        return;

    }

    if (noServices) {

        noServices.classList.add(
            "d-none"
        );

    }

    filteredServices.forEach(
        service => {

            const regularRate =
                Number(
                    service.ratePer1000 || 0
                );

            const resellerRate =
                service.resellerRatePer1000 !== undefined
                    ? Number(
                        service.resellerRatePer1000
                    )
                    : null;

            const vipRate =
                service.vipRatePer1000 !== undefined
                    ? Number(
                        service.vipRatePer1000
                    )
                    : null;

            const currentPrice =
                getServicePrice(service);

            const platform =
                service.platform ||
                "Social Media";

            const serviceName =
                service.service ||
                "Service";

            const description =
                service.description ||
                `${serviceName} service for ${platform}.`;

            const serviceId =
                service.id || "";

            const col =
                document.createElement("div");

            col.className =
                "col-12 col-md-6 col-lg-4";

            col.innerHTML = `

                <div class="card h-100 shadow-sm border-success">

                    <div class="card-body d-flex flex-column">

                        <div
                            class="d-flex
                            justify-content-between
                            align-items-start
                            mb-3"
                        >

                            <span class="badge bg-success">

                                ${escapeHtml(platform)}

                            </span>

                            <span
                                class="badge bg-light text-dark"
                            >

                                #${escapeHtml(serviceId)}

                            </span>

                        </div>


                        <h5 class="card-title fw-bold">

                            ${escapeHtml(serviceName)}

                        </h5>


                        <p class="card-text text-muted small">

                            ${escapeHtml(description)}

                        </p>


                        <hr>


                        <div class="mb-3">

                            <small class="text-muted d-block">

                                Your Price per 1,000

                            </small>

                            <h4
                                class="text-success
                                fw-bold mb-0"
                            >

                                ${formatNaira(currentPrice)}

                            </h4>

                        </div>


                        ${
                            currentTier !== "regular"
                            ? `
                                <small class="text-muted">

                                    Regular:
                                    ${formatNaira(regularRate)}

                                </small>
                              `
                            : ""
                        }


                        ${
                            currentTier === "regular"
                            && resellerRate !== null
                            ? `
                                <small class="text-muted d-block mt-2">

                                    Reseller:
                                    ${formatNaira(resellerRate)}

                                </small>
                              `
                            : ""
                        }


                        ${
                            currentTier === "regular"
                            && vipRate !== null
                            ? `
                                <small class="text-muted d-block">

                                    VIP:
                                    ${formatNaira(vipRate)}

                                </small>
                              `
                            : ""
                        }


                        <button
                            type="button"
                            class="btn btn-success w-100 mt-auto pt-2 order-service-btn"
                            data-service-id="${escapeHtml(serviceId)}"
                        >

                            <i class="bi bi-cart-plus"></i>

                            Order Service

                        </button>

                    </div>

                </div>

            `;

            servicesContainer.appendChild(
                col
            );

        }
    );


    attachOrderButtons();

}


// ============================================================
// ORDER BUTTONS
// ============================================================

function attachOrderButtons() {

    document
        .querySelectorAll(".order-service-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const serviceId =
                        button.dataset.serviceId;

                    if (!serviceId) {

                        alert(
                            "Service ID is missing."
                        );

                        return;

                    }

                    window.location.href =
                        `create-order.html?service=${encodeURIComponent(serviceId)}&catalogue=nigeria`;

                }
            );

        });

}


// ============================================================
// SEARCH
// ============================================================

if (serviceSearch) {

    serviceSearch.addEventListener(
        "input",
        event => {

            currentSearch =
                event.target.value.trim();

            renderServices();

        }
    );

}


// ============================================================
// PLATFORM FILTERS
// ============================================================

platformFilters.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                platformFilters.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                        btn.classList.remove(
                            "btn-success"
                        );

                        btn.classList.add(
                            "btn-outline-success"
                        );

                    }
                );

                button.classList.add(
                    "active"
                );

                button.classList.remove(
                    "btn-outline-success"
                );

                button.classList.add(
                    "btn-success"
                );

                currentPlatform =
                    button.dataset.platform ||
                    "all";

                renderServices();

            }
        );

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

        await loadUserTier(user);

        await loadNigeriaServices();

    }
);
