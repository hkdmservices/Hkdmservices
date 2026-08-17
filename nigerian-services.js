// nigerian-services.js
import { hkdmservicesOfficialServicePriceCatalogue } from "./services.js";

/**
 * Automatically maps over the official global catalogue and multiplies all pricing by 3x
 * specifically for the Nigerian Localized Services tab and catalog.
 */
export const nigerianServicesCatalogue = hkdmservicesOfficialServicePriceCatalogue.map(item => {
    // Clone the item object to avoid mutating the original global catalogue
    const nigerianItem = { ...item };

    // Multiply standard price fields by 3 if they exist
    if (typeof nigerianItem.price === 'number') {
        nigerianItem.price *= 3;
    }
    if (typeof nigerianItem.rate === 'number') {
        nigerianItem.rate *= 3;
    }
    if (typeof nigerianItem.pricePer1000 === 'number') {
        nigerianItem.pricePer1000 *= 3;
    }

    // Append a distinct tag to clearly differentiate Nigerian services in the catalog
    const serviceTitle = nigerianItem.name || nigerianItem.serviceName || 'Service';
    nigerianItem.name = `[NG] ${serviceTitle}`;
    if (nigerianItem.serviceName) {
        nigerianItem.serviceName = `[NG] ${serviceTitle}`;
    }
    
    nigerianItem.isNigerianService = true;

    return nigerianItem;
});
