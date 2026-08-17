import { db } from "../firebase-admin.js";
import {
    hkdmservicesOfficialServicePriceCatalogue
} from "../services.js";
// ============================================================
// HKDMservices Nigeria Catalogue Setup
//
// Nigeria pricing rule:
// Regular  = Official × 3
// Reseller = Regular × 75%
// VIP      = Regular × 90%
//
// services.js is the MASTER catalogue.
// ============================================================
// ============================================================
// BUILD NIGERIA CATALOGUE
// ============================================================
const nigeriaCatalogue =
    hkdmservicesOfficialServicePriceCatalogue.map(service => {
        const nigeriaService = {
            ...service
        };
        // ----------------------------------------------------
        // Percentage-based services
        // ----------------------------------------------------
        if (
            service.ratePer1000 !== null &&
            service.ratePer1000 !== undefined
        ) {
            const regularRate =
                service.ratePer1000 * 3;
            nigeriaService.ratePer1000 =
                regularRate;
            nigeriaService.resellerRatePer1000 =
                regularRate * 0.75;
            nigeriaService.vipRatePer1000 =
                regularRate * 0.90;
        }
        // ----------------------------------------------------
        // Fixed-price services
        // ----------------------------------------------------
        if (
            service.fixedPrice !== null &&
            service.fixedPrice !== undefined
        ) {
            const regularFixedPrice =
                service.fixedPrice * 3;
            nigeriaService.fixedPrice =
                regularFixedPrice;
            nigeriaService.resellerFixedPrice =
                regularFixedPrice * 0.75;
            nigeriaService.vipFixedPrice =
                regularFixedPrice * 0.90;
        }
        return nigeriaService;
    });
// ============================================================
// API HANDLER
// ============================================================
export default async function handler(req, res) {
    // --------------------------------------------------------
    // METHOD CHECK
    // --------------------------------------------------------
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });
    }
    // --------------------------------------------------------
    // SETUP KEY CHECK
    // --------------------------------------------------------
    const setupKey =
        req.headers["x-setup-key"];
    if (
        !setupKey ||
        setupKey !== process.env.CATALOGUE_SETUP_KEY
    ) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }
    try {
        // ----------------------------------------------------
        // CONVERT ARRAY TO FIREBASE OBJECT
        // ----------------------------------------------------
        const updates = {};
        nigeriaCatalogue.forEach(service => {
            updates[service.id] = service;
        });
        // ----------------------------------------------------
        // WRITE TO FIREBASE
        // ----------------------------------------------------
        await db
            .ref("serviceCatalog")
            .set(updates);
        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------
        return res.status(200).json({
            success: true,
            message:
                "HKDMservices Nigeria catalogue created successfully.",
            count:
                nigeriaCatalogue.length
        });
    } catch (error) {
        console.error(
            "NIGERIA CATALOGUE SETUP ERROR:",
            error
        );
        return res.status(500).json({
            success: false,
            message:
                "Unable to create Nigeria service catalogue."
        });
    }
}
