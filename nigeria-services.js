// ============================================================
// HKDMservices Nigeria Services
// ============================================================

import {
    auth
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    hkdmservicesNigeriaServicePriceCatalogue
} from "./nigeria-services-catalogue.js";


// ============================================================
// ELEMENTS
// ============================================================

const servicesContainer =
    document.getElementById("servicesContainer");

const searchInput =
    document.getElementById("serviceSearch");

const tierInfo =
    document.getElementById("tierInfo");

const serviceCount =
    document.getElementById("serviceCount");

const noServices =
    document.getElementById("noServices");

const platformFilters =
    document.querySelectorAll(".platform-filter");


// ============================================================
// STATE
// ============================================================

let currentTier = "regular";

let currentPlatform = "all";

let currentSearch = "";


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
// GET PRICE FOR USER TIER
// ============================================================

function getServicePrice(service) {

    const regularRate =
        Number(
            service.ratePer1000 || 0
        );

    const resellerRate =
        Number(
            service.resellerRatePer1000 ??
            regularRate
        );

    const vipRate =
        Number(
            service.vipRatePer1000 ??
            regularRate
        );


    if (currentTier === "reseller") {

        return resellerRate;

    }


    if (currentTier === "vip") {

        return vipRate;

    }


    return regularRate;

}


// ============================================================
// UPDATE TIER DISPLAY
// ============================================================

function updateTierDisplay() {

    if (!tierInfo) {
        return;
    }


    const tier =
        currentTier.toUpperCase();


    let badgeClass =
        "bg-secondary";


    if (currentTier === "vip") {

        badgeClass =
            "bg-warning text-dark";

    }


    if (currentTier === "reseller") {

        badgeClass =
            "bg-danger";

    }


    tierInfo.innerHTML = `

        <i class="bi bi-shield-check"></i>

        <strong class="badge ${badgeClass}">
            ${escapeHtml(tier)}
        </strong>

        pricing is currently displayed.

    `;

}


// ============================================================
// LOAD USER TIER
// ============================================================

async function loadUserTier(user) {

    try {

        const {
            database
        } = await import("./firebase.js");


        const {
            ref,
            get
        } = await import(
            "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js"
        );


        const userRef =
            ref(
                database,
                `users/${user.uid}`
            );


        const snapshot =
            await get(userRef);


        if (snapshot.exists()) {

            const userData =
                snapshot.val() || {};


            const tier =
                String(
                    userData.tier || "regular"
                )
                .toLowerCase()
                .trim();


            if (
                tier === "reseller" ||
                tier === "vip" ||
                tier === "regular"
            ) {

                currentTier =
                    tier;

            } else {

                currentTier =
                    "regular";

            }

        } else {

            currentTier =
                "regular";

        }

    } catch (error) {

        console.error(
            "NIGERIA USER TIER ERROR:",
            error
        );


        currentTier =
            "regular";

    }


    updateTierDisplay();

}


// ============================================================
// FILTER SERVICES
// ============================================================

function getFilteredServices() {

    return hkdmservicesNigeriaServicePriceCatalogue
        .filter(
            service => {

                const platform =
                    String(
                        service.platform || ""
                    );


                const serviceName =
                    String(
                        service.service || ""
                    );


                const serviceId =
                    String(
                        service.id || ""
                    );


                const normalizedPlatform =
                    platform.toLowerCase();


                const normalizedSearch =
                    currentSearch.toLowerCase();


                const platformMatch =
                    currentPlatform === "all" ||
                    normalizedPlatform ===
                    currentPlatform.toLowerCase();


                const searchMatch =
                    !normalizedSearch ||
                    normalizedPlatform.includes(
                        normalizedSearch
                    ) ||
                    serviceName.toLowerCase().includes(
                        normalizedSearch
                    ) ||
                    serviceId.toLowerCase().includes(
                        normalizedSearch
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

function renderNigeriaServices() {

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
                Number(
                    service.resellerRatePer1000 ??
                    regularRate
                );


            const vipRate =
                Number(
                    service.vipRatePer1000 ??
                    regularRate
                );


            const currentPrice =
                getServicePrice(
                    service
                );


            const platform =
                escapeHtml(
                    service.platform ||
                    "Social Media"
                );


            const serviceName =
                escapeHtml(
                    service.service ||
                    "Service"
                );


            const serviceId =
                String(
                    service.id || ""
                );


            const description =
                escapeHtml(
                    service.description ||
                    `${service.service || "Service"} service for ${service.platform || "social media"}.`
                );


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "col-12 col-md-6 col-lg-4";


            card.innerHTML = `

                <div
                    class="card h-100 shadow-sm border-success"
                >

                    <div class="card-body">


                        <div
                            class="d-flex
                            justify-content-between
                            align-items-start
                            mb-3"
                        >

                            <span class="badge bg-success">

                                ${platform}

                            </span>


                            <span
                                class="badge bg-light text-dark"
                            >

                                #${escapeHtml(serviceId)}

                            </span>

                        </div>


                        <h5 class="card-title fw-bold">

                            ${serviceName}

                        </h5>


                        <p class="card-text text-muted small">

                            ${description}

                        </p>


                        <hr>


                        <div class="mb-3">

                            <small
                                class="text-muted d-block"
                            >

                                Your Price per 1,000

                            </small>


                            <h4
                                class="text-success
                                fw-bold mb-0"
                            >

                                ${formatNaira(currentPrice)}

                            </h4>

                        </div>


                        <div class="small">

                            ${
                                currentTier !== "regular"
                                ? `
                                    <div class="text-muted mb-1">

                                        Regular:
                                        ${formatNaira(regularRate)}

                                    </div>
                                `
                                : ""
                            }


                            ${
                                currentTier === "regular"
                                ? `
                                    <div class="text-muted">

                                        Reseller:
                                        ${formatNaira(resellerRate)}

                                    </div>

                                    <div class="text-muted">

                                        VIP:
                                        ${formatNaira(vipRate)}

                                    </div>
                                `
                                : ""
                            }

                        </div>


                        <button
                            type="button"
                            class="btn btn-success
                            w-100 mt-4
                            order-service-btn"
                            data-service-id="${escapeHtml(serviceId)}"
                        >

                            <i class="bi bi-cart-plus"></i>

                            Order Service

                        </button>

                    </div>

                </div>

            `;


            servicesContainer.appendChild(
                card
            );

        }
    );


    attachOrderButtons();

}


// ============================================================
// ORDER BUTTONS
// ============================================================

function attachOrderButtons() {

    const buttons =
        document.querySelectorAll(
            ".order-service-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const serviceId =
                        button.dataset.serviceId;


                    if (!serviceId) {

                        console.error(
                            "Missing Nigeria service ID."
                        );

                        return;

                    }


                    window.location.href =
                        `order.html?service=${encodeURIComponent(serviceId)}&catalogue=nigeria`;

                }
            );

        }
    );

}


// ============================================================
// SEARCH
// ============================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        event => {

            currentSearch =
                event.target.value.trim();

            renderNigeriaServices();

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


                renderNigeriaServices();

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


        await loadUserTier(
            user
        );


        renderNigeriaServices();

    }
);
