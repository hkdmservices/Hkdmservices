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
            reference
        } = req.body;


        if (!reference) {

            return res.status(400).json({
                success: false,
                message: "Missing payment reference"
            });

        }


        /*
            Verify the payment directly with Korapay.
            This endpoint DOES NOT credit the wallet.
        */

        const response = await axios.get(

            `https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(reference)}`,

            {
                headers: {
                    Authorization:
                        `Bearer ${process.env.KORAPAY_SECRET_KEY}`
                }
            }

        );


        const payment =
            response.data?.data;


        if (!payment) {

            return res.status(400).json({
                success: false,
                message: "Payment could not be found."
            });

        }


        /*
            Payment status must be successful.
        */

        if (
            payment.status !== "success"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Payment is not successful yet.",

                status:
                    payment.status || "unknown"

            });

        }


        /*
            Return verification result.
            Wallet crediting is handled ONLY
            by the webhook.
        */

        return res.status(200).json({

            success: true,

            message:
                "Payment verified successfully.",

            reference:
                payment.reference ||
                reference,

            amount:
                Number(
                    payment.amount_paid ??
                    payment.amount ??
                    0
                ),

            currency:
                payment.currency ||
                "NGN",

            status:
                payment.status

        });


    } catch (error) {

        console.error(
            "KORAPAY VERIFICATION ERROR:",
            error.response?.data ||
            error.message ||
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to verify payment."

        });

    }

}
