import { db } from "../firebase-admin.js";
import { hkdmservicesOfficialServicePriceCatalogue } from "../services.js";
import { hkdmservicesNigeriaServicePriceCatalogue } from "../nigeria-services-catalogue.js";

// ============================================================
// HKDMservices Dual Catalogue Setup (General & Manual Nigeria)
// ============================================================

export default async function handler(req, res) {

    // Allow both GET (with ?key=...) and POST for easy iPhone/browser triggering
    const setupKey = req.headers["x-setup-key"] || req.query.key;
    
    if (
        !setupKey ||
        setupKey !== process.env.CATALOGUE_SETUP_KEY
    ) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized. Provide your setup key via header or ?key= query string."
        });
    }

    try {
        const generalUpdates = {};
        const nigeriaUpdates = {};

        // 1. Process General Services
        hkdmservicesOfficialServicePriceCatalogue.forEach(service => {
            if (service && service.id) {
                generalUpdates[service.id] = service;
            }
        });

        // 2. Process Manual Nigeria Services
        hkdmservicesNigeriaServicePriceCatalogue.forEach(service => {
            if (service && service.id) {
                nigeriaUpdates[service.id] = service;
            }
        });

        const generalCount = Object.keys(generalUpdates).length;
        const nigeriaCount = Object.keys(nigeriaUpdates).length;

        if (generalCount === 0 || nigeriaCount === 0) {
            return res.status(400).json({
                success: false,
                message: "One of the catalogues is empty. Please verify service files."
            });
        }

        // 3. Write both catalogs to separate paths in Firebase
        await db.ref("serviceCatalog").set({
            general: generalUpdates,
            nigeria: nigeriaUpdates
        });

        return res.status(200).json({
            success: true,
            message: "Both General and Nigeria service catalogues updated successfully in separate nodes.",
            counts: {
                generalServices: generalCount,
                nigeriaServices: nigeriaCount
            }
        });

    } catch (error) {
        console.error("CATALOGUE SETUP ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update service catalogues.",
            error: error.message
        });
    }
}
