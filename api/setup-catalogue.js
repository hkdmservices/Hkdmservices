import { db } from "../firebase-admin.js";
import { hkdmservicesNigeriaServicePriceCatalogue } from "../nigeria-services-catalogue.js";

export default async function handler(req, res) {
    const setupKey = req.headers["x-setup-key"] || req.query.key;
    
    if (!setupKey || setupKey !== process.env.CATALOGUE_SETUP_KEY) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const updates = {};

        hkdmservicesNigeriaServicePriceCatalogue.forEach(service => {
            if (service && service.id) {
                updates[service.id] = service;
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: "No services found." });
        }

        // Push directly to the main serviceCatalog node your site reads from
        await db.ref("serviceCatalog").set(updates);

        return res.status(200).json({
            success: true,
            message: "Nigeria catalogue updated successfully!",
            count: Object.keys(updates).length
        });

    } catch (error) {
        console.error("SETUP ERROR:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}
