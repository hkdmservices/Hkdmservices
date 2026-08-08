import { db } from "../firebase-admin.js";

const catalogue = [

    {
        id: "ig_followers",
        platform: "Instagram",
        service: "Followers",
        ratePer1000: 6000
    },

    {
        id: "ig_likes",
        platform: "Instagram",
        service: "Likes",
        ratePer1000: 3000
    },

    {
        id: "ig_views",
        platform: "Instagram",
        service: "Views",
        ratePer1000: 1500
    },

    {
        id: "ig_comments",
        platform: "Instagram",
        service: "Comments",
        ratePer1000: 15000
    },

    {
        id: "tt_followers",
        platform: "TikTok",
        service: "Followers",
        ratePer1000: 6500
    },

    {
        id: "tt_likes",
        platform: "TikTok",
        service: "Likes",
        ratePer1000: 3000
    },

    {
        id: "tt_views",
        platform: "TikTok",
        service: "Views",
        ratePer1000: 1500
    },

    {
        id: "tt_shares",
        platform: "TikTok",
        service: "Shares",
        ratePer1000: 2000
    },

    {
        id: "tt_live_viewers",
        platform: "TikTok",
        service: "Livestream Engagement - Viewers",
        ratePer1000: 100000
    },

    {
        id: "tt_live_likes",
        platform: "TikTok",
        service: "Livestream Engagement - Likes",
        ratePer1000: 2000
    },

    {
        id: "tt_live_comments",
        platform: "TikTok",
        service: "Livestream Engagement - Comments",
        ratePer1000: 5000
    },

    {
        id: "tt_live_shares",
        platform: "TikTok",
        service: "Livestream Engagement - Shares",
        ratePer1000: 3000
    },

    {
        id: "yt_subscribers",
        platform: "YouTube",
        service: "Subscribers",
        ratePer1000: 30000
    },

    {
        id: "yt_likes",
        platform: "YouTube",
        service: "Likes",
        ratePer1000: 3000
    },

    {
        id: "yt_views",
        platform: "YouTube",
        service: "Views",
        ratePer1000: 2500
    },

    {
        id: "yt_watch_time",
        platform: "YouTube",
        service: "Watch Time (4000hr Package)",
        ratePer1000: null,
        fixedPrice: 100000
    },

    {
        id: "yt_comments",
        platform: "YouTube",
        service: "Comments",
        ratePer1000: 15000
    },

    {
        id: "fb_followers",
        platform: "Facebook",
        service: "Followers",
        ratePer1000: 6050
    },

    {
        id: "fb_post_likes",
        platform: "Facebook",
        service: "Post Likes",
        ratePer1000: 3000
    },

    {
        id: "fb_video_views",
        platform: "Facebook",
        service: "Video Views",
        ratePer1000: 1500
    },

    {
        id: "tw_followers",
        platform: "X (Twitter)",
        service: "Followers",
        ratePer1000: 15000
    },

    {
        id: "tw_likes",
        platform: "X (Twitter)",
        service: "Likes",
        ratePer1000: 3000
    },

    {
        id: "tw_retweets",
        platform: "X (Twitter)",
        service: "Retweets",
        ratePer1000: 2500
    },

    {
        id: "tw_views",
        platform: "X (Twitter)",
        service: "Views",
        ratePer1000: 1500
    },

    {
        id: "tw_poll_votes",
        platform: "X (Twitter)",
        service: "Poll Votes",
        ratePer1000: 3050
    },

    {
        id: "tw_live_listeners",
        platform: "X (Twitter)",
        service: "Live Listeners",
        ratePer1000: null,
        fixedPrice: 50000
    },

    {
        id: "tg_members",
        platform: "Telegram",
        service: "Channel / Group Members",
        ratePer1000: 5000
    },

    {
        id: "tg_views",
        platform: "Telegram",
        service: "Post Views",
        ratePer1000: 1500
    },

    {
        id: "tg_reactions",
        platform: "Telegram",
        service: "Reactions",
        ratePer1000: 3500
    },

    {
        id: "sp_followers",
        platform: "Spotify",
        service: "Followers",
        ratePer1000: 10000
    },

    {
        id: "sp_monthly_listeners",
        platform: "Spotify",
        service: "Monthly Listeners",
        ratePer1000: 10000
    },

    {
        id: "sp_plays",
        platform: "Spotify",
        service: "Plays",
        ratePer1000: 8000
    },

    {
        id: "wa_channel_followers",
        platform: "WhatsApp",
        service: "Channel Followers",
        ratePer1000: 15000
    },

    {
        id: "wa_post_reactions",
        platform: "WhatsApp",
        service: "Channel Post Reactions",
        ratePer1000: 3500
    },

    {
        id: "am_followers",
        platform: "Apple Music",
        service: "Followers",
        ratePer1000: 10000
    },

    {
        id: "am_plays",
        platform: "Apple Music",
        service: "Plays",
        ratePer1000: 9000
    }

];


export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });

    }


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

        const updates = {};


        catalogue.forEach(service => {

            updates[service.id] = service;

        });


        await db
            .ref("serviceCatalog")
            .set(updates);


        return res.status(200).json({

            success: true,

            message:
                "HKDMservices catalogue created successfully.",

            count:
                catalogue.length

        });


    } catch (error) {

        console.error(
            "CATALOGUE SETUP ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to create service catalogue."

        });

    }

}
