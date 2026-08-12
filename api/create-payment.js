import axios from "axios";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });
    }

    try {

        const {
            amount,
            uid,
            name,
            email
        } = req.body;

        const numericAmount = Number(amount);

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount < 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Minimum funding amount is ₦100."
            });
        }

        if (!uid || !email) {
            return res.status(400).json({
                success: false,
                message: "Missing customer information."
            });
        }

        const reference =
            "HKDM-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 8);

        const response = await axios.post(
            "https://api.korapay.com/merchant/api/v1/charges/initialize",
            {
                amount: numericAmount,
                currency: "NGN",
                reference: reference,

                redirect_url:
                    "https://hkdmservices.vercel.app/dashboard.html",

                notification_url:
                    "https://hkdmservices.vercel.app/api/korapay-webhook",

                // Enabled multiple payment channels here:
                channels: ["card", "bank_transfer", "ussd"],

                customer: {
                    name: name || "HKDM Customer",
                    email: email
                },

                metadata: {
                    uid: uid
                },

                narration:
                    "Wallet funding for HKDMservices"
            },
            {
                headers: {
                    Authorization:
                        `Bearer ${process.env.KORAPAY_SECRET_KEY}`,

                    "Content-Type":
                        "application/json"
                }
            }
        );

        const checkoutUrl =
            response.data?.data?.checkout_url;

        if (!checkoutUrl) {

            console.error(
                "KORAPAY INITIALIZATION RESPONSE:",
                response.data
            );

            return res.status(400).json({
                success: false,
                message:
                    response.data?.message ||
                    "Korapay could not initialize the payment."
            });
        }

        return res.status(200).json({

            success: true,

            reference: reference,

            checkout_url: checkoutUrl

        });

    } catch (error) {

        console.error(
            "CREATE PAYMENT ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        return res.status(
            error.response?.status || 500
        ).json({

            success: false,

            message:
                error.response?.data?.message ||
                "Unable to initialize payment."

        });

    }
}
