import { db } from "../firebase-admin.js";

// Import your new manual Nigeria catalogue directly
import {
    hkdmservicesNigeriaServicePriceCatalogue
} from "../nigeria-services-catalogue.js";

// ============================================================
// HKDMservices Nigeria Catalogue Setup (Manual Direct Pricing)
// ============================================================

export default async function handler(req, res) {

    // ========================================================
    // METHOD CHECK
    // ========================================================
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });
    }

    // ========================================================
    // SETUP KEY CHECK
    // ========================================================
    const setupKey = req.headers["x-setup-key"];
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
        // ====================================================
        // CONVERT ARRAY TO FIREBASE OBJECT
        // ====================================================
        const updates = {};

        hkdmservicesNigeriaServicePriceCatalogue.forEach(service => {
            if (service && service.id) {
                updates[service.id] = service;
            }
        });

        // ====================================================
        // MAKE SURE WE HAVE SERVICES
        // ====================================================
        const serviceCount = Object.keys(updates).length;
        if (serviceCount === 0) {
            return res.status(400).json({
                success: false,
                message: "No services were found in the Nigeria catalogue."
            });
        }

        // ====================================================
        // WRITE NIGERIA CATALOGUE TO FIREBASE
        // ====================================================
        await db
            .ref("serviceCatalog")
            .set(updates);

        // ====================================================
        // SUCCESS
        // ====================================================
        return res.status(200).json({
            success: true,
            message: "HKDMservices Nigeria manual price catalogue created successfully.",
            count: serviceCount
        });

    } catch (error) {
        console.error(
            "NIGERIA CATALOGUE SETUP ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to create Nigeria service catalogue.",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined
        });
    }
}
