// ============================================================
// HKDMservices Nigeria Service & Price Catalogue
// All General Catalogue prices × 3
// Reseller = 75% of Regular
// VIP = 90% of Regular
// ============================================================

const hkdmservicesNigeriaServicePriceCatalogue = [

    // ========================================================
    // 1. INSTAGRAM SERVICES
    // ========================================================

    {
        id: "ig_followers",
        platform: "Instagram",
        service: "Followers",
        ratePer1000: 36000,
        resellerRatePer1000: 27000,
        vipRatePer1000: 32400,
        minimumQuantity: 100
    },

    {
        id: "ig_likes",
        platform: "Instagram",
        service: "Likes",
        ratePer1000: 9000,
        resellerRatePer1000: 6750,
        vipRatePer1000: 8100,
        minimumQuantity: 100
    },

    {
        id: "ig_views",
        platform: "Instagram",
        service: "Views",
        ratePer1000: 4500,
        resellerRatePer1000: 3375,
        vipRatePer1000: 4050,
        minimumQuantity: 100
    },

    {
        id: "ig_comments",
        platform: "Instagram",
        service: "Comments",
        ratePer1000: 45000,
        resellerRatePer1000: 33750,
        vipRatePer1000: 40500,
        minimumQuantity: 100
    },

    {
        id: "ig_live_stream",
        platform: "Instagram",
        service: "Live Stream",
        ratePer1000: 300000,
        resellerRatePer1000: 225000,
        vipRatePer1000: 270000,
        minimumQuantity: 100
    },

    {
        id: "ig_repost",
        platform: "Instagram",
        service: "Repost",
        ratePer1000: 9000,
        resellerRatePer1000: 6750,
        vipRatePer1000: 8100,
        minimumQuantity: 100
    },

    {
        id: "ig_story_views_impressions",
        platform: "Instagram",
        service: "Story Views + Impressions",
        ratePer1000: 7800,
        resellerRatePer1000: 5850,
        vipRatePer1000: 7020,
        minimumQuantity: 100
    },

    {
        id: "ig_channel_members",
        platform: "Instagram",
        service: "Channel Members",
        ratePer1000: 15000,
        resellerRatePer1000: 11250,
        vipRatePer1000: 13500,
        minimumQuantity: 100
    },


    // ========================================================
    // 2. TIKTOK SERVICES
    // ========================================================

    {
        id: "tt_followers",
        platform: "TikTok",
        service: "Followers",
        ratePer1000: 39000,
        resellerRatePer1000: 29250,
        vipRatePer1000: 35100,
        minimumQuantity: 100
    },

    {
        id: "tt_likes",
        platform: "TikTok",
        service: "Likes",
        ratePer1000: 9000,
        resellerRatePer1000: 6750,
        vipRatePer1000: 8100,
        minimumQuantity: 100
    },

    {
        id: "tt_views",
        platform: "TikTok",
        service: "Views",
        ratePer1000: 4500,
        resellerRatePer1000: 3375,
        vipRatePer1000: 4050,
        minimumQuantity: 100
    },

    {
        id: "tt_shares",
        platform: "TikTok",
        service: "Shares",
        ratePer1000: 6000,
        resellerRatePer1000: 4500,
        vipRatePer1000: 5400,
        minimumQuantity: 100
    },

    {
        id: "tt_saves",
        platform: "TikTok",
        service: "Saves",
        ratePer1000: 4500,
        resellerRatePer1000: 3375,
        vipRatePer1000: 4050,
        minimumQuantity: 100
    },

    {
        id: "tt_comments",
        platform: "TikTok",
        service: "Comments",
        ratePer1000: 30000,
        resellerRatePer1000: 22500,
        vipRatePer1000: 27000,
        minimumQuantity: 100
    },

    {
        id: "tt_story_views",
        platform: "TikTok",
        service: "Story Views",
        ratePer1000: 6000,
        resellerRatePer1000: 4500,
        vipRatePer1000: 5400,
        minimumQuantity: 100
    },

    {
        id: "tt_video_downloads",
        platform: "TikTok",
        service: "Video Downloads",
        ratePer1000: 15000,
        resellerRatePer1000: 11250,
        vipRatePer1000: 13500,
        minimumQuantity: 100
    },

    {
        id: "tt_monetization_views",
        platform: "TikTok",
        service: "Monetization Views | 100,000 Views |",
        ratePer1000: null,
        fixedPrice: 150000,
        resellerFixedPrice: 112500,
        vipFixedPrice: 135000,
        minimumQuantity: 1,
        oneTimePayment: true
    },

    {
        id: "tt_live_viewers",
        platform: "TikTok",
        service: "Livestream Engagement - Viewers",
        ratePer1000: 300000,
        resellerRatePer1000: 225000,
        vipRatePer1000: 270000,
        minimumQuantity: 100
    },

    {
        id: "tt_live_likes",
        platform: "TikTok",
        service: "Livestream Engagement - Likes",
        ratePer1000: 6000,
        resellerRatePer1000: 4500,
        vipRatePer1000: 5400,
        minimumQuantity: 100
    },

    {
        id: "tt_live_comments",
        platform: "TikTok",
        service: "Livestream Engagement - Comments",
        ratePer1000: 15000,
        resellerRatePer1000: 11250,
        vipRatePer1000: 13500,
        minimumQuantity: 100
    },

    {
        id: "tt_live_shares",
        platform: "TikTok",
        service: "Livestream Engagement - Shares",
        ratePer1000: 9000,
        resellerRatePer1000: 6750,
        vipRatePer1000: 8100,
        minimumQuantity: 100
    },


    // ========================================================
    // 3. YOUTUBE SERVICES
    // ========================================================

    {
        id: "yt_subscribers",
        platform: "YouTube",
        service: "Subscribers",
        ratePer1000: 90000,
        resellerRatePer1000: 67500,
        vipRatePer1000: 81000,
        minimumQuantity: 100
    },

    {
        id: "yt_likes",
        platform: "YouTube",
        service: "Likes",
        ratePer1000: 9000,
        resellerRatePer1000: 6750,
        vipRatePer1000: 8100,
        minimumQuantity: 100
    },

    {
        id: "yt_views",
        platform: "YouTube",
        service: "Views",
        ratePer1000: 7500,
        resellerRatePer1000: 5625,
        vipRatePer1000: 6750,
        minimumQuantity: 100
    },

    {
        id: "yt_watch_time",
        platform: "YouTube",
        service: "Watch Time (4000hr Package)",
        ratePer1000: null,
        fixedPrice: 300000,
        resellerFixedPrice: 225000,
        vipFixedPrice: 270000,
        minimumQuantity: 1
    },

    {
        id: "yt_comments",
        platform: "YouTube",
        service: "Comments",
        ratePer1000: 45000,
        resellerRatePer1000: 33750,
        vipRatePer1000: 40500,
        minimumQuantity: 100
    },

    {
        id: "yt_livestream_views",
        platform: "YouTube",
        service: "Livestream Views | 24 Hours |",
        ratePer1000: 300000,
        resellerRatePer1000: 225000,
        vipRatePer1000: 270000,
        minimumQuantity: 100
    },

    {
        id: "yt_livestream_chat_comments",
        platform: "YouTube",
        service: "Livestream Chat Comments",
        ratePer1000: 30000,
        resellerRatePer1000: 22500,
        vipRatePer1000: 27000,
        minimumQuantity: 100
    },

    {
        id: "yt_short_views",
        platform: "YouTube",
        service: "Short Views",
        ratePer1000: 9600,
        resellerRatePer1000: 7200,
        vipRatePer1000: 8640,
        minimumQuantity: 100
    },

    {
        id: "yt_comment_likes",
        platform: "YouTube",
        service: "Comment Likes",
        ratePer1000: 15600,
        resellerRatePer1000: 11700,
        vipRatePer1000: 14040,
        minimumQuantity: 100
    },

    {
        id: "yt_social_shares",
        platform: "YouTube",
        service: "Social Shares",
        ratePer1000: 12000,
        resellerRatePer1000: 9000,
        vipRatePer1000: 10800,
        minimumQuantity: 100
    },


    // ========================================================
    // 4. FACEBOOK SERVICES
    // ========================================================

    {
        id: "fb_followers",
        platform: "Facebook",
        service: "Followers",
        ratePer1000: 36000,
        resellerRatePer1000: 27000,
        vipRatePer1000: 32400,
        minimumQuantity: 100
    },

    {
        id: "fb_post_likes",
        platform: "Facebook",
        service: "Post Likes",
        ratePer1000: 9000,
        resellerRatePer1000: 6750,
        vipRatePer1000: 8100,
        minimumQuantity: 100
    },

    {
        id: "fb_video_views",
        platform: "Facebook",
        service: "Video Views",
        ratePer1000: 4500,
        resellerRatePer1000: 3375,
        vipRatePer1000: 4050,
        minimumQuantity: 100
    },

    {
        id: "fb_comments",
        platform: "Facebook",
        service: "Comments",
        ratePer1000: 30000,
        resellerRatePer1000: 22500,
        vipRatePer1000: 27000,
        minimumQuantity: 100
    },

    {
        id: "fb_livestream_views",
        platform: "Facebook",
        service: "Livestream Views | 6 Hours |",
        ratePer1000: 300000,
        resellerRatePer1000: 225000,
        vipRatePer1000: 270000,
        minimumQuantity: 100
    },

    {
        id: "fb_group_members",
        platform: "Facebook",
        service: "Group Members",
        ratePer1000: 15000,
        resellerRatePer1000: 11250,
        vipRatePer1000: 13500,
        minimumQuantity: 100
    },

    {
        id: "fb_post_reactions",
        platform: "Facebook",
        service: "Post Reactions | Random Emojis |",
        ratePer1000: 9000,
        resellerRatePer1000: 6750,
        vipRatePer1000: 8100,
        minimumQuantity: 100
    },

    {
        id: "fb_page_reviews",
        platform: "Facebook",
        service: "Page Reviews | Custom |",
        ratePer1000: 470400,
        resellerRatePer1000: 352800,
        vipRatePer1000: 423360,
        minimumQuantity: 100
    },


    // ========================================================
    // 5. X (TWITTER) SERVICES
    // ========================================================

    {
        id: "tw_followers",
        platform: "X (Twitter)",
        service: "Followers",
        ratePer1000: 45000,
        resellerRatePer1000: 33750,
        vipRatePer1000: 40500,
        minimumQuantity: 100
    },

    {
        id: "tw_likes",
        platform: "X (Twitter)",
        service: "Likes",
        ratePer1000: 9000,
        resellerRatePer1000: 6750,
        vipRatePer1000: 8100,
        minimumQuantity: 100
    },

    {
        id: "tw_retweets",
        platform: "X (Twitter)",
        service: "Retweets",
        ratePer1000: 7500,
        resellerRatePer1000: 5625,
        vipRatePer1000: 6750,
        minimumQuantity: 100
    },

    {
        id: "tw_views",
        platform: "X (Twitter)",
        service: "Views",
        ratePer1000: 4500,
        resellerRatePer1000: 3375,
        vipRatePer1000: 4050,
        minimumQuantity: 100
    },

    {
        id: "tw_poll_votes",
        platform: "X (Twitter)",
        service: "Poll Votes",
        ratePer1000: 9150,
        resellerRatePer1000: 6862.5,
        vipRatePer1000: 8235,
        minimumQuantity: 100
    },

    {
        id: "tw_live_listeners",
        platform: "X (Twitter)",
        service: "Live Listeners",
        ratePer1000: 150000,
        resellerRatePer1000: 112500,
        vipRatePer1000: 135000,
        minimumQuantity: 100
    },

    {
        id: "tw_comments",
        platform: "X (Twitter)",
        service: "Comments",
        ratePer1000: 30000,
        resellerRatePer1000: 22500,
        vipRatePer1000: 27000,
        minimumQuantity: 100
    },


    // ========================================================
    // 6. TELEGRAM SERVICES
    // ========================================================

    {
        id: "tg_members",
        platform: "Telegram",
        service: "Channel / Group Members",
        ratePer1000: 21000,
        resellerRatePer1000: 15750,
        vipRatePer1000: 18900,
        minimumQuantity: 100
    },

    {
        id: "tg_views",
        platform: "Telegram",
        service: "Post Views",
        ratePer1000: 4500,
        resellerRatePer1000: 3375,
        vipRatePer1000: 4050,
        minimumQuantity: 100
    },

    {
        id: "tg_reactions",
        platform: "Telegram",
        service: "Reactions",
        ratePer1000: 10500,
        resellerRatePer1000: 7875,
        vipRatePer1000: 9450,
        minimumQuantity: 100
    },

    {
        id: "tg_comments",
        platform: "Telegram",
        service: "Comments",
        ratePer1000: 30000,
        resellerRatePer1000: 22500,
        vipRatePer1000: 27000,
        minimumQuantity: 100
    },


    // ========================================================
    // 7. SPOTIFY SERVICES
    // ========================================================

    {
        id: "sp_followers",
        platform: "Spotify",
        service: "Followers",
        ratePer1000: 45000,
        resellerRatePer1000: 33750,
        vipRatePer1000: 40500,
        minimumQuantity: 100
    },

    {
        id: "sp_monthly_listeners",
        platform: "Spotify",
        service: "Monthly Listeners",
        ratePer1000: 45000,
        resellerRatePer1000: 33750,
        vipRatePer1000: 40500,
        minimumQuantity: 100
    },

    {
        id: "sp_plays",
        platform: "Spotify",
        service: "Plays",
        ratePer1000: 24000,
        resellerRatePer1000: 18000,
        vipRatePer1000: 21600,
        minimumQuantity: 100
    },

    {
        id: "sp_saves",
        platform: "Spotify",
        service: "Saves",
        ratePer1000: 9000,
        resellerRatePer1000: 6750,
        vipRatePer1000: 8100,
        minimumQuantity: 100
    },


    // ========================================================
    // 8. WHATSAPP SERVICES
    // ========================================================

    {
        id: "wa_channel_followers",
        platform: "WhatsApp",
        service: "Channel Followers",
        ratePer1000: 45000,
        resellerRatePer1000: 33750,
        vipRatePer1000: 40500,
        minimumQuantity: 100
    },

    {
        id: "wa_post_reactions",
        platform: "WhatsApp",
        service: "Channel Post Reactions",
        ratePer1000: 10500,
        resellerRatePer1000: 7875,
        vipRatePer1000: 9450,
        minimumQuantity: 100
    },


    // ========================================================
    // 9. APPLE MUSIC SERVICES
    // ========================================================

    {
        id: "am_followers",
        platform: "Apple Music",
        service: "Followers",
        ratePer1000: 48000,
        resellerRatePer1000: 36000,
        vipRatePer1000: 43200,
        minimumQuantity: 100
    },

    {
        id: "am_plays",
        platform: "Apple Music",
        service: "Plays",
        ratePer1000: 27000,
        resellerRatePer1000: 20250,
        vipRatePer1000: 24300,
        minimumQuantity: 100
    },


    // ========================================================
    // 10. REDDIT SERVICES
    // ========================================================

    {
        id: "reddit_followers",
        platform: "Reddit",
        service: "Followers",
        ratePer1000: 28800,
        resellerRatePer1000: 21600,
        vipRatePer1000: 25920,
        minimumQuantity: 100
    },

    {
        id: "reddit_subscribers",
        platform: "Reddit",
        service: "Channel Subscribers",
        ratePer1000: 28800,
        resellerRatePer1000: 21600,
        vipRatePer1000: 25920,
        minimumQuantity: 100
    },

    {
        id: "reddit_post_upvotes",
        platform: "Reddit",
        service: "Post Upvotes",
        ratePer1000: 228000,
        resellerRatePer1000: 171000,
        vipRatePer1000: 205200,
        minimumQuantity: 100
    },

    {
        id: "reddit_post_downvotes",
        platform: "Reddit",
        service: "Post Downvotes",
        ratePer1000: 360000,
        resellerRatePer1000: 270000,
        vipRatePer1000: 324000,
        minimumQuantity: 100
    },

    {
        id: "reddit_comment_upvotes",
        platform: "Reddit",
        service: "Comments Upvotes",
        ratePer1000: 600000,
        resellerRatePer1000: 450000,
        vipRatePer1000: 540000,
        minimumQuantity: 100
    },

    {
        id: "reddit_views",
        platform: "Reddit",
        service: "Views",
        ratePer1000: 7500,
        resellerRatePer1000: 5625,
        vipRatePer1000: 6750,
        minimumQuantity: 100
    },

    {
        id: "reddit_shares",
        platform: "Reddit",
        service: "Shares",
        ratePer1000: 7500,
        resellerRatePer1000: 5625,
        vipRatePer1000: 6750,
        minimumQuantity: 100
    },

    {
        id: "reddit_comments",
        platform: "Reddit",
        service: "Comments | Custom |",
        ratePer1000: 450000,
        resellerRatePer1000: 337500,
        vipRatePer1000: 405000,
        minimumQuantity: 100
    },

    {
        id: "reddit_community_members",
        platform: "Reddit",
        service: "Community Members",
        ratePer1000: 900000,
        resellerRatePer1000: 675000,
        vipRatePer1000: 810000,
        minimumQuantity: 100
    }

];



// ============================================================
// EXPORT
// ============================================================

export {

    hkdmservicesNigeriaServicePriceCatalogue

};
