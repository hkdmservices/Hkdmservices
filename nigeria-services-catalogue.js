// ============================================================
// HKDMservices — Nigeria Services Catalogue
// ============================================================

export const hkdmservicesNigeriaServicePriceCatalogue = [

    // ==========================================================
    // INSTAGRAM
    // ==========================================================

    {
        id: "NG-IG-FOLLOWERS",
        platform: "Instagram",
        service: "Instagram Followers",
        ratePer1000: 5000,
        resellerRatePer1000: 4500,
        vipRatePer1000: 4000
    },

    {
        id: "NG-IG-LIKES",
        platform: "Instagram",
        service: "Instagram Likes",
        ratePer1000: 2000,
        resellerRatePer1000: 1800,
        vipRatePer1000: 1600
    },

    {
        id: "NG-IG-VIEWS",
        platform: "Instagram",
        service: "Instagram Views",
        ratePer1000: 2000,
        resellerRatePer1000: 1800,
        vipRatePer1000: 1600
    },

    {
        id: "NG-IG-COMMENTS",
        platform: "Instagram",
        service: "Instagram Comments",
        ratePer1000: 10000,
        resellerRatePer1000: 9000,
        vipRatePer1000: 8000
    },


    // ==========================================================
    // YOUTUBE
    // ==========================================================

    {
        id: "NG-YT-SUBSCRIBERS",
        platform: "YouTube",
        service: "YouTube Subscribers",
        ratePer1000: 25000,
        resellerRatePer1000: 22500,
        vipRatePer1000: 20000
    },

    {
        id: "NG-YT-VIEWS",
        platform: "YouTube",
        service: "YouTube Views",
        ratePer1000: 2000,
        resellerRatePer1000: 1800,
        vipRatePer1000: 1600
    },

    {
        id: "NG-YT-LIKES",
        platform: "YouTube",
        service: "YouTube Likes",
        ratePer1000: 2000,
        resellerRatePer1000: 1800,
        vipRatePer1000: 1600
    },


    // ==========================================================
    // TIKTOK
    // ==========================================================

    {
        id: "NG-TT-FOLLOWERS",
        platform: "TikTok",
        service: "TikTok Followers",
        ratePer1000: 6000,
        resellerRatePer1000: 5400,
        vipRatePer1000: 4800
    },

    {
        id: "NG-TT-LIKES",
        platform: "TikTok",
        service: "TikTok Likes",
        ratePer1000: 2500,
        resellerRatePer1000: 2250,
        vipRatePer1000: 2000
    },

    {
        id: "NG-TT-VIEWS",
        platform: "TikTok",
        service: "TikTok Views",
        ratePer1000: 2000,
        resellerRatePer1000: 1800,
        vipRatePer1000: 1600
    },

    {
        id: "NG-TT-SHARES",
        platform: "TikTok",
        service: "TikTok Shares",
        ratePer1000: 2000,
        resellerRatePer1000: 1800,
        vipRatePer1000: 1600
    },

    {
        id: "NG-TT-SAVES",
        platform: "TikTok",
        service: "TikTok Saves",
        ratePer1000: 1500,
        resellerRatePer1000: 1350,
        vipRatePer1000: 1200
    },

    {
        id: "NG-TT-COMMENTS",
        platform: "TikTok",
        service: "TikTok Comments",
        ratePer1000: 10000,
        resellerRatePer1000: 9000,
        vipRatePer1000: 8000
    },


    // ==========================================================
    // FACEBOOK
    // ==========================================================

    {
        id: "NG-FB-FOLLOWERS",
        platform: "Facebook",
        service: "Facebook Followers",
        ratePer1000: 5000,
        resellerRatePer1000: 4500,
        vipRatePer1000: 4000
    },

    {
        id: "NG-FB-LIKES",
        platform: "Facebook",
        service: "Facebook Likes",
        ratePer1000: 2500,
        resellerRatePer1000: 2250,
        vipRatePer1000: 2000
    }

];


// ============================================================
// HELPER — FIND SERVICE BY ID
// ============================================================

export function getNigeriaServiceById(serviceId) {

    return hkdmservicesNigeriaServicePriceCatalogue.find(
        service => service.id === serviceId
    );

}


// ============================================================
// HELPER — GET SERVICES BY PLATFORM
// ============================================================

export function getNigeriaServicesByPlatform(platform) {

    if (!platform || platform === "all") {

        return hkdmservicesNigeriaServicePriceCatalogue;

    }

    return hkdmservicesNigeriaServicePriceCatalogue.filter(
        service => service.platform === platform
    );

}


// ============================================================
// HELPER — GET ALL PLATFORMS
// ============================================================

export function getNigeriaPlatforms() {

    return [
        ...new Set(
            hkdmservicesNigeriaServicePriceCatalogue.map(
                service => service.platform
            )
        )
    ];

}


// ============================================================
// HELPER — FORMAT NAIRA
// ============================================================

export function formatNigeriaNaira(amount) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2
        }
    ).format(Number(amount) || 0);

}
