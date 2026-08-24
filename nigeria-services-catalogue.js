// ============================================================
// HKDMservices — Nigeria SMM Services Catalogue
// ============================================================
//
// Nigeria-specific services
//
// Pricing:
// Regular  = supplied Nigeria price
// Reseller = Regular × 75%
// VIP      = Regular × 90%
//
// All normal services are priced per 1,000 units.
// ============================================================


// ============================================================
// NIGERIA PRICING CONSTANTS
// ============================================================

const NIGERIA_RESELLER_MULTIPLIER = 0.75;
const NIGERIA_VIP_MULTIPLIER = 0.90;


// ============================================================
// PRICE HELPERS
// ============================================================

function nigeriaResellerPrice(price) {

    if (price === null || price === undefined) {
        return null;
    }

    return Number(
        (Number(price) * NIGERIA_RESELLER_MULTIPLIER).toFixed(4)
    );

}


function nigeriaVipPrice(price) {

    if (price === null || price === undefined) {
        return null;
    }

    return Number(
        (Number(price) * NIGERIA_VIP_MULTIPLIER).toFixed(4)
    );

}


// ============================================================
// HKDMservices NIGERIA SERVICE PRICE CATALOGUE
// ============================================================

const hkdmservicesNigeriaServicePriceCatalogue = [

    // ========================================================
    // X / TWITTER
    // ========================================================

    {
        id: "NG-x_followers",
        platform: "X (Twitter)",
        service: "Nigeria Followers",
        ratePer1000: 70210.1005,
        resellerRatePer1000: nigeriaResellerPrice(70210.1005),
        vipRatePer1000: nigeriaVipPrice(70210.1005),
        minimumQuantity: 100,
        maximumQuantity: 5000
    },

    {
        id: "NG-x_likes",
        platform: "X (Twitter)",
        service: "Nigeria Likes",
        ratePer1000: 46431.887,
        resellerRatePer1000: nigeriaResellerPrice(46431.887),
        vipRatePer1000: nigeriaVipPrice(46431.887),
        minimumQuantity: 100,
        maximumQuantity: 5000
    },

    {
        id: "NG-x_retweets",
        platform: "X (Twitter)",
        service: "Nigeria Retweets",
        ratePer1000: 60333.50,
        resellerRatePer1000: nigeriaResellerPrice(60333.50),
        vipRatePer1000: nigeriaVipPrice(60333.50),
        minimumQuantity: 100,
        maximumQuantity: 5000
    },

    {
        id: "NG-x_bookmarks",
        platform: "X (Twitter)",
        service: "Nigeria Bookmarks",
        ratePer1000: 68400.20,
        resellerRatePer1000: nigeriaResellerPrice(68400.20),
        vipRatePer1000: nigeriaVipPrice(68400.20),
        minimumQuantity: 100,
        maximumQuantity: 5000
    },


    // ========================================================
    // SPOTIFY
    // ========================================================

    {
        id: "NG-spotify_followers",
        platform: "Spotify",
        service: "Nigeria Followers",
        ratePer1000: 26800.89,
        resellerRatePer1000: nigeriaResellerPrice(26800.89),
        vipRatePer1000: nigeriaVipPrice(26800.89),
        minimumQuantity: 100,
        maximumQuantity: 1000000
    },


    // ========================================================
    // TIKTOK
    // ========================================================

    {
        id: "NG-tiktok_video_views",
        platform: "TikTok",
        service: "Nigeria Video Views",
        ratePer1000: 8033.35,
        resellerRatePer1000: nigeriaResellerPrice(8033.35),
        vipRatePer1000: nigeriaVipPrice(8033.35),
        minimumQuantity: 100,
        maximumQuantity: 100000
    },

    {
        id: "NG-tiktok_comments",
        platform: "TikTok",
        service: "Nigeria Comments",
        ratePer1000: 60333.50,
        resellerRatePer1000: nigeriaResellerPrice(60333.50),
        vipRatePer1000: nigeriaVipPrice(60333.50),
        minimumQuantity: 100,
        maximumQuantity: 5000
    },

    {
        id: "NG-tiktok_followers",
        platform: "TikTok",
        service: "Nigeria Followers",
        ratePer1000: 49739.234,
        resellerRatePer1000: nigeriaResellerPrice(49739.234),
        vipRatePer1000: nigeriaVipPrice(49739.234),
        minimumQuantity: 100,
        maximumQuantity: 5000
    },

    {
        id: "NG-tiktok_likes",
        platform: "TikTok",
        service: "Nigeria Likes",
        ratePer1000: 44778.2135,
        resellerRatePer1000: nigeriaResellerPrice(44778.2135),
        vipRatePer1000: nigeriaVipPrice(44778.2135),
        minimumQuantity: 100,
        maximumQuantity: 5000
    },


    // ========================================================
    // FACEBOOK
    // ========================================================

    {
        id: "NG-facebook_video_views",
        platform: "Facebook",
        service: "Nigeria Video Views",
        ratePer1000: 10453.36,
        resellerRatePer1000: nigeriaResellerPrice(10453.36),
        vipRatePer1000: nigeriaVipPrice(10453.36),
        minimumQuantity: 100,
        maximumQuantity: 100000
    },

    {
        id: "NG-facebook_story_views",
        platform: "Facebook",
        service: "Nigeria Story Views",
        ratePer1000: 34200.10,
        resellerRatePer1000: nigeriaResellerPrice(34200.10),
        vipRatePer1000: nigeriaVipPrice(34200.10),
        minimumQuantity: 100,
        maximumQuantity: 5000
    },

    {
        id: "NG-facebook_comments",
        platform: "Facebook",
        service: "Nigeria Comments",
        ratePer1000: 52266.80,
        resellerRatePer1000: nigeriaResellerPrice(52266.80),
        vipRatePer1000: nigeriaVipPrice(52266.80),
        minimumQuantity: 100,
        maximumQuantity: 5000
    },

    {
        id: "NG-facebook_shares",
        platform: "Facebook",
        service: "Nigeria Shares",
        ratePer1000: 76466.90,
        resellerRatePer1000: nigeriaResellerPrice(76466.90),
        vipRatePer1000: nigeriaVipPrice(76466.90),
        minimumQuantity: 100,
        maximumQuantity: 5000
    },


    // ========================================================
    // YOUTUBE
    // ========================================================

    {
        id: "NG-youtube_video_views",
        platform: "YouTube",
        service: "Nigeria Video Views",
        ratePer1000: 10453.36,
        resellerRatePer1000: nigeriaResellerPrice(10453.36),
        vipRatePer1000: nigeriaVipPrice(10453.36),
        minimumQuantity: 100,
        maximumQuantity: 500000
    },

    {
        id: "NG-youtube_comments",
        platform: "YouTube",
        service: "Nigeria Comments",
        ratePer1000: 52266.80,
        resellerRatePer1000: nigeriaResellerPrice(52266.80),
        vipRatePer1000: nigeriaVipPrice(52266.80),
        minimumQuantity: 100,
        maximumQuantity: 5000
    },

    {
        id: "NG-youtube_shorts_comments",
        platform: "YouTube",
        service: "Nigeria Shorts Comments",
        ratePer1000: 52266.80,
        resellerRatePer1000: nigeriaResellerPrice(52266.80),
        vipRatePer1000: nigeriaVipPrice(52266.80),
        minimumQuantity: 100,
        maximumQuantity: 5000
    },

    {
        id: "NG-youtube_subscribers",
        platform: "YouTube",
        service: "Nigeria Subscribers",
        ratePer1000: 84533.60,
        resellerRatePer1000: nigeriaResellerPrice(84533.60),
        vipRatePer1000: nigeriaVipPrice(84533.60),
        minimumQuantity: 100,
        maximumQuantity: 5000
    },


    // ========================================================
    // INSTAGRAM
    // ========================================================

    {
        id: "NG-instagram_views",
        platform: "Instagram",
        service: "Nigeria Views",
        ratePer1000: 5226.68,
        resellerRatePer1000: nigeriaResellerPrice(5226.68),
        vipRatePer1000: nigeriaVipPrice(5226.68),
        minimumQuantity: 100,
        maximumQuantity: 1000000
    },

    {
        id: "NG-instagram_story_views",
        platform: "Instagram",
        service: "Nigeria Story Views",
        ratePer1000: 34200.10,
        resellerRatePer1000: nigeriaResellerPrice(34200.10),
        vipRatePer1000: nigeriaVipPrice(34200.10),
        minimumQuantity: 100,
        maximumQuantity: 2000
    },

    {
        id: "NG-instagram_likes",
        platform: "Instagram",
        service: "Nigeria Likes",
        ratePer1000: 39778.2135,
        resellerRatePer1000: nigeriaResellerPrice(39778.2135),
        vipRatePer1000: nigeriaVipPrice(39778.2135),
        minimumQuantity: 100,
        maximumQuantity: 5000
    },

    {
        id: "NG-instagram_channel_members",
        platform: "Instagram",
        service: "Nigeria Channel Members",
        ratePer1000: 5075.56,
        resellerRatePer1000: nigeriaResellerPrice(5075.56),
        vipRatePer1000: nigeriaVipPrice(5075.56),
        minimumQuantity: 100,
        maximumQuantity: 1000000
    },

    {
        id: "NG-instagram_followers",
        platform: "Instagram",
        service: "Nigeria Followers",
        ratePer1000: 39830.637,
        resellerRatePer1000: nigeriaResellerPrice(39830.637),
        vipRatePer1000: nigeriaVipPrice(39830.637),
        minimumQuantity: 100,
        maximumQuantity: 5000
    },

    {
        id: "NG-instagram_comments",
        platform: "Instagram",
        service: "Custom Comments | Nigeria",
        ratePer1000: 87719.9465,
        resellerRatePer1000: nigeriaResellerPrice(87719.9465),
        vipRatePer1000: nigeriaVipPrice(87719.9465),
        minimumQuantity: 100,
        maximumQuantity: 5000
    },

    {
        id: "NG-instagram_repost",
        platform: "Instagram",
        service: "Nigeria Repost",
        ratePer1000: 40431.887,
        resellerRatePer1000: nigeriaResellerPrice(40431.887),
        vipRatePer1000: nigeriaVipPrice(40431.887),
        minimumQuantity: 100,
        maximumQuantity: 5000
    }

];


// ============================================================
// FIND SERVICE BY ID
// ============================================================

export function getNigeriaServiceById(serviceId) {

    return hkdmservicesNigeriaServicePriceCatalogue.find(
        service => String(service.id) === String(serviceId)
    );

}


// ============================================================
// GET SERVICES BY PLATFORM
// ============================================================

export function getNigeriaServicesByPlatform(platform) {

    if (
        !platform ||
        String(platform).toLowerCase() === "all"
    ) {

        return hkdmservicesNigeriaServicePriceCatalogue;

    }

    return hkdmservicesNigeriaServicePriceCatalogue.filter(
        service =>
            String(service.platform).toLowerCase() ===
            String(platform).toLowerCase()
    );

}


// ============================================================
// GET ALL PLATFORMS
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
// GET SERVICE PRICE BY TIER
// ============================================================

export function getNigeriaServicePrice(
    service,
    tier = "regular"
) {

    if (!service) {
        return 0;
    }

    const normalizedTier =
        String(tier).toLowerCase();

    if (normalizedTier === "reseller") {

        return Number(
            service.resellerRatePer1000 || 0
        );

    }

    if (normalizedTier === "vip") {

        return Number(
            service.vipRatePer1000 || 0
        );

    }

    return Number(
        service.ratePer1000 || 0
    );

}


// ============================================================
// CALCULATE ORDER PRICE
// ============================================================

export function calculateNigeriaOrderPrice(
    service,
    quantity,
    tier = "regular"
) {

    if (!service) {
        return 0;
    }

    const numericQuantity =
        Number(quantity);

    if (
        !Number.isFinite(numericQuantity) ||
        numericQuantity <= 0
    ) {

        return 0;

    }

    if (
        numericQuantity <
        Number(service.minimumQuantity || 0)
    ) {

        return 0;

    }

    if (
        service.maximumQuantity !== undefined &&
        numericQuantity >
        Number(service.maximumQuantity)
    ) {

        return 0;

    }

    const price =
        getNigeriaServicePrice(
            service,
            tier
        );

    return Number(
        (
            numericQuantity / 1000
        ) * Number(price)
    );

}


// ============================================================
// CHECK QUANTITY
// ============================================================

export function isNigeriaQuantityValid(
    service,
    quantity
) {

    if (!service) {
        return false;
    }

    const numericQuantity =
        Number(quantity);

    if (
        !Number.isFinite(numericQuantity)
    ) {

        return false;

    }

    const minimum =
        Number(
            service.minimumQuantity || 0
        );

    const maximum =
        service.maximumQuantity !== undefined
            ? Number(service.maximumQuantity)
            : Infinity;

    return (
        numericQuantity >= minimum &&
        numericQuantity <= maximum
    );

}


// ============================================================
// FORMAT NAIRA
// ============================================================

export function formatNigeriaNaira(amount) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(
        Number(amount) || 0
    );

}


// ============================================================
// EXPORT
// ============================================================

export {
    hkdmservicesNigeriaServicePriceCatalogue,

    NIGERIA_RESELLER_MULTIPLIER,

    NIGERIA_VIP_MULTIPLIER
};
