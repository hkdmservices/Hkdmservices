// ============================================================
// HKDMservices — Nigeria Services
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
    hkdmservicesNigeriaServicePriceCatalogue,
    getNigeriaServicePrice
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
const platformFiltersContainer =
    document.getElementById("platformFilters");
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
// GET SERVICE PRICE
// ============================================================
function getActiveServicePrice(service) {
    return getNigeriaServicePrice(
        service,
        currentTier
    );
}
// ============================================================
// CHECK IF FIXED-PRICE SERVICE
// ============================================================
function isFixedPriceService(service) {
    return (
        service.fixedPrice !== undefined &&
        service.fixedPrice !== null
    );
}
// ============================================================
// GET PLATFORM LIST
// ============================================================
function getPlatforms() {
    return [
        ...new Set(
            hkdmservicesNigeriaServicePriceCatalogue
                .map(
                    service =>
                        service.platform
                )
                .filter(Boolean)
        )
    ];
}
// ============================================================
// BUILD PLATFORM FILTERS
// ============================================================
function buildPlatformFilters() {
    if (!platformFiltersContainer) {
        return;
    }
    platformFiltersContainer.innerHTML = "";
    // --------------------------------------------------------
    // ALL BUTTON
    // --------------------------------------------------------
    const allButton =
        document.createElement("button");
    allButton.type =
        "button";
    allButton.className =
        "btn btn-success platform-filter active";
    allButton.dataset.platform =
        "all";
    allButton.textContent =
        "All";
    platformFiltersContainer.appendChild(
        allButton
    );
    // --------------------------------------------------------
    // PLATFORM BUTTONS
    // --------------------------------------------------------
    getPlatforms().forEach(
        platform => {
            const button =
                document.createElement("button");
            button.type =
                "button";
            button.className =
                "btn btn-outline-success platform-filter";
            button.dataset.platform =
                platform;
            button.textContent =
                platform;
            platformFiltersContainer.appendChild(
                button
            );
        }
    );
    attachPlatformFilterEvents();
}
// ============================================================
// PLATFORM FILTER EVENTS
// ============================================================
function attachPlatformFilterEvents() {
    document
        .querySelectorAll(".platform-filter")
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {
                        document
                            .querySelectorAll(
                                ".platform-filter"
                            )
                            .forEach(
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
        const userRef =
            ref(
                database,
                `users/${user.uid}`
            );
        const snapshot =
            await get(userRef);
        if (
            snapshot.exists()
        ) {
            const userData =
                snapshot.val() || {};
            const tier =
                String(
                    userData.tier ||
                    "regular"
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
    const search =
        currentSearch
            .toLowerCase()
            .trim();
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
                const platformMatch =
                    currentPlatform === "all" ||
                    platform.toLowerCase() ===
                        currentPlatform.toLowerCase();
                const searchMatch =
                    !search ||
                    platform
                        .toLowerCase()
                        .includes(search) ||
                    serviceName
                        .toLowerCase()
                        .includes(search) ||
                    serviceId
                        .toLowerCase()
                        .includes(search);
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
    // --------------------------------------------------------
    // SERVICE COUNT
    // --------------------------------------------------------
    if (serviceCount) {
        serviceCount.textContent =
            `${filteredServices.length} Services`;
    }
    servicesContainer.innerHTML =
        "";
    // --------------------------------------------------------
    // NO SERVICES
    // --------------------------------------------------------
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
    // --------------------------------------------------------
    // SERVICE CARDS
    // --------------------------------------------------------
    filteredServices.forEach(
        service => {
            const currentPrice =
                getActiveServicePrice(
                    service
                );
            const regularPrice =
                getNigeriaServicePrice(
                    service,
                    "regular"
                );
            const resellerPrice =
                getNigeriaServicePrice(
                    service,
                    "reseller"
                );
            const vipPrice =
                getNigeriaServicePrice(
                    service,
                    "vip"
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
            const fixedPrice =
                isFixedPriceService(
                    service
                );
            const priceLabel =
                fixedPrice
                    ? "Package Price"
                    : "Price per 1,000";
            const minimumQuantity =
                Number(
                    service.minimumQuantity || 1
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
                        <!-- SERVICE HEADER -->
                        <div
                            class="d-flex
                            justify-content-between
                            align-items-start
                            mb-3"
                        >
                            <span
                                class="badge bg-success"
                            >
                                ${platform}
                            </span>
                            <span
                                class="badge bg-light text-dark"
                            >
                                #${escapeHtml(
                                    serviceId
                                )}
                            </span>
                        </div>
                        <!-- SERVICE NAME -->
                        <h5
                            class="card-title fw-bold"
                        >
                            ${serviceName}
                        </h5>
                        <!-- DESCRIPTION -->
                        <p
                            class="card-text
                            text-muted
                            small"
                        >
                            ${description}
                        </p>
                        <hr>
                        <!-- PRICE -->
                        <div class="mb-3">
                            <small
                                class="text-muted d-block"
                            >
                                ${priceLabel}
                            </small>
                            <h4
                                class="text-success
                                fw-bold mb-0"
                            >
                                ${formatNaira(
                                    currentPrice
                                )}
                            </h4>
                        </div>
                        <!-- MINIMUM QUANTITY -->
                        <div
                            class="small
                            text-muted
                            mb-2"
                        >
                            ${
                                fixedPrice
                                    ? `
                                        Fixed package
                                      `
                                    : `
                                        Minimum quantity:
                                        ${minimumQuantity}
                                      `
                            }
                        </div>
                        <!-- OTHER PRICES -->
                        ${
                            currentTier === "regular"
                                ? `
                                    <div
                                        class="small
                                        text-muted"
                                    >
                                        Reseller:
                                        ${formatNaira(
                                            resellerPrice
                                        )}
                                    </div>
                                    <div
                                        class="small
                                        text-muted"
                                    >
                                        VIP:
                                        ${formatNaira(
                                            vipPrice
                                        )}
                                    </div>
                                  `
                                : `
                                    <div
                                        class="small
                                        text-muted"
                                    >
                                        Regular:
                                        ${formatNaira(
                                            regularPrice
                                        )}
                                    </div>
                                  `
                        }
                        <!-- ORDER BUTTON -->
                        <button
                            type="button"
                            class="btn btn-success
                            w-100 mt-4
                            order-service-btn"
                            data-service-id="${escapeHtml(
                                serviceId
                            )}"
                            data-platform="${escapeHtml(
                                service.platform || ""
                            )}"
                            data-catalogue="nigeria"
                        >
                            <i
                                class="bi bi-cart-plus"
                            ></i>
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
    document
        .querySelectorAll(
            ".order-service-btn"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {
                        const serviceId =
                            button.dataset.serviceId;
                        const platform =
                            button.dataset.platform;
                        const catalogue =
                            button.dataset.catalogue ||
                            "nigeria";
                        if (!serviceId) {
                            console.error(
                                "Missing Nigeria service ID."
                            );
                            return;
                        }
                        window.location.href =
                            `order.html?service=${encodeURIComponent(
                                serviceId
                            )}&platform=${encodeURIComponent(
                                platform
                            )}&catalogue=${encodeURIComponent(
                                catalogue
                            )}`;
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
        buildPlatformFilters();
        renderNigeriaServices();
    }
);
