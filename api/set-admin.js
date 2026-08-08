import { admin } from "../firebase-admin.js";

export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });

    }

    try {

        /*
         * The UID must come from the
         * authenticated Firebase ID token.
         */

        const authorization =
            req.headers.authorization || "";

        if (!authorization.startsWith("Bearer ")) {

            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });

        }

        const idToken =
            authorization.substring(7);

        /*
         * Verify the Firebase ID token.
         */

        const decodedToken =
            await admin
                .auth()
                .verifyIdToken(idToken);

        const uid =
            decodedToken.uid;


        /*
         * IMPORTANT:
         *
         * Only YOUR specific Firebase UID
         * should be allowed to use this
         * endpoint.
         */

        const allowedAdminUid =
            "cxtj0tJ5MHb0YQcWh9XomNdorzw1";


        if (uid !== allowedAdminUid) {

            return res.status(403).json({
                success: false,
                message: "You are not authorized to become an admin."
            });

        }


        /*
         * Set Firebase custom admin claim.
         */

        await admin
            .auth()
            .setCustomUserClaims(
                uid,
                {
                    admin: true
                }
            );


        /*
         * Keep the existing database role
         * synchronized as well.
         */

        await admin
            .database()
            .ref(`users/${uid}/role`)
            .set("admin");


        return res.status(200).json({

            success: true,

            message:
                "Admin privileges granted successfully.",

            uid

        });


    } catch (error) {

        console.error(
            "SET ADMIN ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to grant admin privileges."

        });

    }

}
