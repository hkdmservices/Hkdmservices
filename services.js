// ============================================================
// HKDMservices Nigeria Service & Price Catalogue
// ============================================================
//
// Nigeria services use the SAME services as the General
// Catalogue, but all prices are multiplied by 3.
//
// Regular      = General Price × 3
// Reseller     = General Reseller Price × 3
// VIP          = General VIP Price × 3
// Fixed Price  = General Fixed Price × 3
//
// ============================================================

import {
    hkdmservicesOfficialServicePriceCatalogue
} from "./services.js";


// ============================================================
// PRICE MULTIPLIER
// ============================================================

const NIGERIA_PRICE_MULTIPLIER = 3;


// ============================================================
// CREATE NIGERIA CATALOGUE
// ============================================================

const hkdmservicesNigeriaServicePriceCatalogue =
    hkdmservicesOfficialServicePriceCatalogue.map(service => {

        const nigeriaService = {
            ...service
        };


        // ----------------------------------------------------
        // PER-1000 PRICES
        // ----------------------------------------------------

        if (typeof service.ratePer1000 === "number") {
            nigeriaService.ratePer1000 =
                service.ratePer1000 * NIGERIA_PRICE_MULTIPLIER;
        }


        if (typeof service.resellerRatePer1000 === "number") {
            nigeriaService.resellerRatePer1000 =
                service.resellerRatePer1000 * NIGERIA_PRICE_MULTIPLIER;
        }


        if (typeof service.vipRatePer1000 === "number") {
            nigeriaService.vipRatePer1000 =
                service.vipRatePer1000 * NIGERIA_PRICE_MULTIPLIER;
        }


        // ----------------------------------------------------
        // FIXED PRICES
        // ----------------------------------------------------

        if (typeof service.fixedPrice === "number") {
            nigeriaService.fixedPrice =
                service.fixedPrice * NIGERIA_PRICE_MULTIPLIER;
        }


        if (typeof service.resellerFixedPrice === "number") {
            nigeriaService.resellerFixedPrice =
                service.resellerFixedPrice * NIGERIA_PRICE_MULTIPLIER;
        }


        if (typeof service.vipFixedPrice === "number") {
            nigeriaService.vipFixedPrice =
                service.vipFixedPrice * NIGERIA_PRICE_MULTIPLIER;
        }


        // ----------------------------------------------------
        // GIVE NIGERIA SERVICES UNIQUE IDs
        // ----------------------------------------------------

        nigeriaService.id = `ng_${service.id}`;


        // ----------------------------------------------------
        // MARK AS NIGERIA SERVICE
        // ----------------------------------------------------

        nigeriaService.region = "Nigeria";


        return nigeriaService;
    });


// ============================================================
// EXPORT
// ============================================================

export {
    hkdmservicesNigeriaServicePriceCatalogue,
    NIGERIA_PRICE_MULTIPLIER
};
