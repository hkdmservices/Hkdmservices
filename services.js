// ============================================================
// HKDMservices Official Service & Price Catalogue
// ============================================================

const hkdmservicesOfficialServicePriceCatalogue = [

    // ========================================================
    // INSTAGRAM
    // ========================================================

    {
        id: "ig_followers",
        platform: "Instagram",
        service: "Followers",
        ratePer1000: 6000,
        minQuantity: 100
    },

    {
        id: "ig_likes",
        platform: "Instagram",
        service: "Likes",
        ratePer1000: 3000,
        minQuantity: 100
    },

    {
        id: "ig_views",
        platform: "Instagram",
        service: "Views",
        ratePer1000: 1500,
        minQuantity: 100
    },

    {
        id: "ig_comments",
        platform: "Instagram",
        service: "Comments",
        ratePer1000: 15000,
        minQuantity: 100,
        requiresComment: true
    },


    // ========================================================
    // TIKTOK
    // ========================================================

    {
        id: "tt_followers",
        platform: "TikTok",
        service: "Followers",
        ratePer1000: 6500,
        minQuantity: 100
    },

    {
        id: "tt_likes",
        platform: "TikTok",
        service: "Likes",
        ratePer1000: 3000,
        minQuantity: 100
    },

    {
        id: "tt_views",
        platform: "TikTok",
        service: "Views",
        ratePer1000: 1500,
        minQuantity: 100
    },

    {
        id: "tt_shares",
        platform: "TikTok",
        service: "Shares",
        ratePer1000: 2000,
        minQuantity: 100
    },

    {
        id: "tt_live_viewers",
        platform: "TikTok",
        service: "Livestream Engagement - Viewers",
        ratePer1000: 100000,
        minQuantity: 100
    },

    {
        id: "tt_live_likes",
        platform: "TikTok",
        service: "Livestream Engagement - Likes",
        ratePer1000: 2000,
        minQuantity: 100
    },

    {
        id: "tt_live_comments",
        platform: "TikTok",
        service: "Livestream Engagement - Comments",
        ratePer1000: 5000,
        minQuantity: 100,
        requiresComment: true
    },

    {
        id: "tt_live_shares",
        platform: "TikTok",
        service: "Livestream Engagement - Shares",
        ratePer1000: 3000,
        minQuantity: 100
    },


    // ========================================================
    // YOUTUBE
    // ========================================================

    {
        id: "yt_subscribers",
        platform: "YouTube",
        service: "Subscribers",
        ratePer1000: 30000,
        minQuantity: 100
    },

    {
        id: "yt_likes",
        platform: "YouTube",
        service: "Likes",
        ratePer1000: 3000,
        minQuantity: 100
    },

    {
        id: "yt_views",
        platform: "YouTube",
        service: "Views",
        ratePer1000: 2500,
        minQuantity: 100
    },

    {
        id: "yt_watch_time",
        platform: "YouTube",
        service: "Watch Time (4000hr Package)",
        ratePer1000: null,
        fixedPrice: 100000,
        minQuantity: 1,
        fixedPackage: true
    },

    {
        id: "yt_comments",
        platform: "YouTube",
        service: "Comments",
        ratePer1000: 15000,
        minQuantity: 100,
        requiresComment: true
    },


    // ========================================================
    // FACEBOOK
    // ========================================================

    {
        id: "fb_followers",
        platform: "Facebook",
        service: "Followers",
        ratePer1000: 6050,
        minQuantity: 100
    },

    {
        id: "fb_post_likes",
        platform: "Facebook",
        service: "Post Likes",
        ratePer1000: 3000,
        minQuantity: 100
    },

    {
        id: "fb_video_views",
        platform: "Facebook",
        service: "Video Views",
        ratePer1000: 1500,
        minQuantity: 100
    },


    // ========================================================
    // X / TWITTER
    // ========================================================

    {
        id: "tw_followers",
        platform: "X (Twitter)",
        service: "Followers",
        ratePer1000: 15000,
        minQuantity: 100
    },

    {
        id: "tw_likes",
        platform: "X (Twitter)",
        service: "Likes",
        ratePer1000: 3000,
        minQuantity: 100
    },

    {
        id: "tw_retweets",
        platform: "X (Twitter)",
        service: "Retweets",
        ratePer1000: 2500,
        minQuantity: 100
    },

    {
        id: "tw_views",
        platform: "X (Twitter)",
        service: "Views",
        ratePer1000: 1500,
        minQuantity: 100
    },

    {
        id: "tw_poll_votes",
        platform: "X (Twitter)",
        service: "Poll Votes",
        ratePer1000: 3050,
        minQuantity: 100
    },

    {
        id: "tw_live_listeners",
        platform: "X (Twitter)",
        service: "Live Listeners",
        ratePer1000: null,
        fixedPrice: 50000,
        minQuantity: 1,
        fixedPackage: true
    },


    // ========================================================
    // TELEGRAM
    // ========================================================

    {
        id: "tg_members",
        platform: "Telegram",
        service: "Channel / Group Members",
        ratePer1000: 5000,
        minQuantity: 100
    },

    {
        id: "tg_views",
        platform: "Telegram",
        service: "Post Views",
        ratePer1000: 1500,
        minQuantity: 100
    },

    {
        id: "tg_reactions",
        platform: "Telegram",
        service: "Reactions",
        ratePer1000: 3500,
        minQuantity: 100
    },


    // ========================================================
    // SPOTIFY
    // ========================================================

    {
        id: "sp_followers",
        platform: "Spotify",
        service: "Followers",
        ratePer1000: 10000,
        minQuantity: 100
    },

    {
        id: "sp_monthly_listeners",
        platform: "Spotify",
        service: "Monthly Listeners",
        ratePer1000: 10000,
        minQuantity: 100
    },

    {
        id: "sp_plays",
        platform: "Spotify",
        service: "Plays",
        ratePer1000: 8000,
        minQuantity: 100
    },


    // ========================================================
    // WHATSAPP
    // ========================================================

    {
        id: "wa_channel_followers",
        platform: "WhatsApp",
        service: "Channel Followers",
        ratePer1000: 15000,
        minQuantity: 100
    },

    {
        id: "wa_post_reactions",
        platform: "WhatsApp",
        service: "Channel Post Reactions",
        ratePer1000: 3500,
        minQuantity: 100
    },


    // ========================================================
    // APPLE MUSIC
    // ========================================================

    {
        id: "am_followers",
        platform: "Apple Music",
        service: "Followers",
        ratePer1000: 10000,
        minQuantity: 100
    },

    {
        id: "am_plays",
        platform: "Apple Music",
        service: "Plays",
        ratePer1000: 9000,
        minQuantity: 100
    }

];


// ============================================================
// EXPORT
// ============================================================

export {
    hkdmservicesOfficialServicePriceCatalogue
};
