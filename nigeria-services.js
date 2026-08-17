// ============================================================
// HKDMservices Nigeria Services
// ============================================================

import {
    auth,
    database
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


// ============================================================
// ELEMENTS
// ============================================================

const servicesContainer =
    document.getElementById("nigeriaServicesContainer");

const userName =
    document.getElementById("userName");

const searchInput =
    document.getElementById("serviceSearch");

const platformFilter =
    document.getElementById("platformFilter");


// ============================================================
// LOAD NIGERIA CATALOGUE
// ============================================================

import {
    hkdmservicesNigeriaServicePriceCatalogue
} from "./nigeria-services-catalogue.js";


// ============================================================
// CURRENT USER
// ============================================================

let currentUser = null;


// ============================================================
// USER AUTHENTICATION
// ============================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;
    }

    currentUser = user;

    if (userName) {

        userName.textContent =
            user.displayName ||
            user.email ||
            "User";

    }

    populatePlatformFilter();

    renderNigeriaServices();

});


// ============================================================
// POPULATE PLATFORM FILTER
// ============================================================

function populatePlatformFilter() {

    if (!platformFilter) {
        return;
    }

    const platforms = [
        ...new Set(
            hkdmservicesNigeriaServicePriceCatalogue
                .map(service => service.platform)
                .filter(Boolean)
        )
    ];

    platformFilter.innerHTML =
        `<option value="all">All Platforms</option>`;

    platforms.forEach(platform => {

        const option =
            document.createElement("option");

        option.value = platform;

        option.textContent = platform;

        platformFilter.appendChild(option);

    });

}


// ============================================================
// RENDER SERVICES
// ============================================================

function renderNigeriaServices() {

    if (!servicesContainer) {
        return;
    }

    const searchTerm =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

    const selectedPlatform =
        platformFilter
            ? platformFilter.value
            : "all";


    const filteredServices =
        hkdmservicesNigeriaServicePriceCatalogue.filter(service => {

            const matchesSearch =
                !searchTerm ||

                service.platform
                    ?.toLowerCase()
                    .includes(searchTerm) ||

                service.service
                    ?.toLowerCase()
                    .includes(searchTerm) ||

                service.id
                    ?.toLowerCase()
                    .includes(searchTerm);


            const matchesPlatform =
                selectedPlatform === "all" ||

                service.platform === selectedPlatform;


            return (
                matchesSearch &&
                matchesPlatform
            );

        });


    servicesContainer.innerHTML = "";


    // ========================================================
    // NO SERVICES
    // ========================================================

    if (filteredServices.length === 0) {

        servicesContainer.innerHTML = `

            <div class="col-12">

                <div class="alert alert-warning text-center">

                    <i class="bi bi-search"></i>

                    No Nigerian services found.

                </div>

            </div>

        `;

        return;
    }


    // ========================================================
    // SERVICE CARDS
    // ========================================================

    filteredServices.forEach(service => {

        const regularRate =
            Number(service.ratePer1000 || 0);

        const resellerRate =
            Number(
                service.resellerRatePer1000 ||
                regularRate
            );

        const vipRate =
            Number(
                service.vipRatePer1000 ||
                regularRate
            );


        const card =
            document.createElement("div");

        card.className =
            "col-12 col-md-6 col-lg-4";


        card.innerHTML = `

            <div class="card h-100 shadow-sm border-success">

                <div class="card-body">

                    <div class="d-flex justify-content-between align-items-start mb-3">

                        <div>

                            <span class="badge bg-success">

                                ${escapeHtml(service.platform)}

                            </span>

                        </div>

                        <small class="text-muted">

                            ${escapeHtml(service.id || "")}

                        </small>

                    </div>


                    <h5 class="card-title fw-bold">

                        ${escapeHtml(service.service)}

                    </h5>


                    <div class="mt-3">

                        <div class="mb-2">

                            <small class="text-muted d-block">

                                Regular Rate

                            </small>

                            <strong class="fs-5 text-success">

                                ${formatNaira(regularRate)}

                            </strong>

                            <small class="text-muted">

                                / 1,000

                            </small>

                        </div>


                        <div class="mb-2">

                            <small class="text-muted d-block">

                                Reseller Rate

                            </small>

                            <strong>

                                ${formatNaira(resellerRate)}

                            </strong>

                            <small class="text-muted">

                                / 1,000

                            </small>

                        </div>


                        <div>

                            <small class="text-muted d-block">

                                VIP Rate

                            </small>

                            <strong>

                                ${formatNaira(vipRate)}

                            </strong>

                            <small class="text-muted">

                                / 1,000

                            </small>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="btn btn-success w-100 mt-4 order-service-btn"
                        data-service-id="${escapeHtml(service.id || "")}"
                    >

                        <i class="bi bi-cart-plus"></i>

                        Order Service

                    </button>

                </div>

            </div>

        `;


        servicesContainer.appendChild(card);

    });


    // ========================================================
    // ORDER BUTTONS
    // ========================================================

    document
        .querySelectorAll(".order-service-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const serviceId =
                        button.dataset.serviceId;

                    window.location.href =
                        `create-order.html?service=${encodeURIComponent(serviceId)}`;

                }
            );

        });

}


// ============================================================
// SEARCH
// ============================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderNigeriaServices
    );

}


// ============================================================
// PLATFORM FILTER
// ============================================================

if (platformFilter) {

    platformFilter.addEventListener(
        "change",
        renderNigeriaServices
    );

}


// ============================================================
// FORMAT NAIRA
// ============================================================

function formatNaira(amount) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2
        }
    ).format(amount);

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
