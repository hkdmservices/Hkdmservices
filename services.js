// ============================================================
// HKDMservices Official Service & Price Catalogue
// ============================================================


const hkdmservicesOfficialServicePriceCatalogue = [

    // ========================================================
    // 1. INSTAGRAM SERVICES
    // ========================================================

    {
        id: "ig_followers",
        platform: "Instagram",
        service: "Followers",
        ratePer1000: 6000,
        minimumQuantity: 100
    },

    {
        id: "ig_likes",
        platform: "Instagram",
        service: "Likes",
        ratePer1000: 3000,
        minimumQuantity: 100
    },

    {
        id: "ig_views",
        platform: "Instagram",
        service: "Views",
        ratePer1000: 1500,
        minimumQuantity: 100
    },

    {
        id: "ig_comments",
        platform: "Instagram",
        service: "Comments",
        ratePer1000: 15000,
        minimumQuantity: 100
    },

    {
        id: "ig_live_stream",
        platform: "Instagram",
        service: "Live Stream",
        ratePer1000: 100000,
        minimumQuantity: 100
    },


    // ========================================================
    // 2. TIKTOK SERVICES
    // ========================================================

    {
        id: "tt_followers",
        platform: "TikTok",
        service: "Followers",
        ratePer1000: 6500,
        minimumQuantity: 100
    },

    {
        id: "tt_likes",
        platform: "TikTok",
        service: "Likes",
        ratePer1000: 3000,
        minimumQuantity: 100
    },

    {
        id: "tt_views",
        platform: "TikTok",
        service: "Views",
        ratePer1000: 1500,
        minimumQuantity: 100
    },

    {
        id: "tt_shares",
        platform: "TikTok",
        service: "Shares",
        ratePer1000: 2000,
        minimumQuantity: 100
    },

    {
        id: "tt_live_viewers",
        platform: "TikTok",
        service: "Livestream Engagement - Viewers",
        ratePer1000: 100000,
        minimumQuantity: 100
    },

    {
        id: "tt_live_likes",
        platform: "TikTok",
        service: "Livestream Engagement - Likes",
        ratePer1000: 2000,
        minimumQuantity: 100
    },

    {
        id: "tt_live_comments",
        platform: "TikTok",
        service: "Livestream Engagement - Comments",
        ratePer1000: 5000,
        minimumQuantity: 100
    },

    {
        id: "tt_live_shares",
        platform: "TikTok",
        service: "Livestream Engagement - Shares",
        ratePer1000: 3000,
        minimumQuantity: 100
    },


    // ========================================================
    // 3. YOUTUBE SERVICES
    // ========================================================

    {
        id: "yt_subscribers",
        platform: "YouTube",
        service: "Subscribers",
        ratePer1000: 30000,
        minimumQuantity: 100
    },

    {
        id: "yt_likes",
        platform: "YouTube",
        service: "Likes",
        ratePer1000: 3000,
        minimumQuantity: 100
    },

    {
        id: "yt_views",
        platform: "YouTube",
        service: "Views",
        ratePer1000: 2500,
        minimumQuantity: 100
    },

    {
        id: "yt_watch_time",
        platform: "YouTube",
        service: "Watch Time (4000hr Package)",
        ratePer1000: null,
        fixedPrice: 100000,
        minimumQuantity: 1
    },

    {
        id: "yt_comments",
        platform: "YouTube",
        service: "Comments",
        ratePer1000: 15000,
        minimumQuantity: 100
    },


    // ========================================================
    // 4. FACEBOOK SERVICES
    // ========================================================

    {
        id: "fb_followers",
        platform: "Facebook",
        service: "Followers",
        ratePer1000: 6050,
        minimumQuantity: 100
    },

    {
        id: "fb_post_likes",
        platform: "Facebook",
        service: "Post Likes",
        ratePer1000: 3000,
        minimumQuantity: 100
    },

    {
        id: "fb_video_views",
        platform: "Facebook",
        service: "Video Views",
        ratePer1000: 1500,
        minimumQuantity: 100
    },

    {
        id: "fb_comments",
        platform: "Facebook",
        service: "Comments",
        ratePer1000: 10000,
        minimumQuantity: 100
    },


    // ========================================================
    // 5. X (TWITTER) SERVICES
    // ========================================================

    {
        id: "tw_followers",
        platform: "X (Twitter)",
        service: "Followers",
        ratePer1000: 15000,
        minimumQuantity: 100
    },

    {
        id: "tw_likes",
        platform: "X (Twitter)",
        service: "Likes",
        ratePer1000: 3000,
        minimumQuantity: 100
    },

    {
        id: "tw_retweets",
        platform: "X (Twitter)",
        service: "Retweets",
        ratePer1000: 2500,
        minimumQuantity: 100
    },

    {
        id: "tw_views",
        platform: "X (Twitter)",
        service: "Views",
        ratePer1000: 1500,
        minimumQuantity: 100
    },

    {
        id: "tw_poll_votes",
        platform: "X (Twitter)",
        service: "Poll Votes",
        ratePer1000: 3050,
        minimumQuantity: 100
    },

    {
        id: "tw_live_listeners",
        platform: "X (Twitter)",
        service: "Live Listeners",
        ratePer1000: 50000,
        minimumQuantity: 100
    },

    {
        id: "tw_comments",
        platform: "X (Twitter)",
        service: "Comments",
        ratePer1000: 10000,
        minimumQuantity: 100
    },


    // ========================================================
    // 6. TELEGRAM SERVICES
    // ========================================================

    {
        id: "tg_members",
        platform: "Telegram",
        service: "Channel / Group Members",
        ratePer1000: 5000,
        minimumQuantity: 100
    },

    {
        id: "tg_views",
        platform: "Telegram",
        service: "Post Views",
        ratePer1000: 1500,
        minimumQuantity: 100
    },

    {
        id: "tg_reactions",
        platform: "Telegram",
        service: "Reactions",
        ratePer1000: 3500,
        minimumQuantity: 100
    },

    {
        id: "tg_comments",
        platform: "Telegram",
        service: "Comments",
        ratePer1000: 10000,
        minimumQuantity: 100
    },


    // ========================================================
    // 7. SPOTIFY SERVICES
    // ========================================================

    {
        id: "sp_followers",
        platform: "Spotify",
        service: "Followers",
        ratePer1000: 10000,
        minimumQuantity: 100
    },

    {
        id: "sp_monthly_listeners",
        platform: "Spotify",
        service: "Monthly Listeners",
        ratePer1000: 10000,
        minimumQuantity: 100
    },

    {
        id: "sp_plays",
        platform: "Spotify",
        service: "Plays",
        ratePer1000: 8000,
        minimumQuantity: 100
    },


    // ========================================================
    // 8. WHATSAPP SERVICES
    // ========================================================

    {
        id: "wa_channel_followers",
        platform: "WhatsApp",
        service: "Channel Followers",
        ratePer1000: 15000,
        minimumQuantity: 100
    },

    {
        id: "wa_post_reactions",
        platform: "WhatsApp",
        service: "Channel Post Reactions",
        ratePer1000: 3500,
        minimumQuantity: 100
    },


    // ========================================================
    // 9. APPLE MUSIC SERVICES
    // ========================================================

    {
        id: "am_followers",
        platform: "Apple Music",
        service: "Followers",
        ratePer1000: 10000,
        minimumQuantity: 100
    },

    {
        id: "am_plays",
        platform: "Apple Music",
        service: "Plays",
        ratePer1000: 9000,
        minimumQuantity: 100
    }

];



// ============================================================
// EXPORT
// ============================================================

export {

    hkdmservicesOfficialServicePriceCatalogue

};
