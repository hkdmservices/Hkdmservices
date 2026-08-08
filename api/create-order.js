import { admin, db } from "../firebase-admin.js";

export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });

    }


    try {

        /*
            Get Firebase ID token
            from Authorization header.
        */

        const authorization =
            req.headers.authorization || "";


        if (!authorization.startsWith("Bearer ")) {

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });

        }


        const idToken =
            authorization.split("Bearer ")[1];


        /*
            Verify the Firebase user.
        */

        const decodedToken =
            await admin.auth().verifyIdToken(
                idToken
            );


        const uid =
            decodedToken.uid;


        /*
            Get order information.
        */

        const {
            serviceId,
            platform,
            service,
            link,
            quantity,
            total
        } = req.body;


        /*
            Basic validation.
        */

        if (
            !serviceId ||
            !platform ||
            !service ||
            !link ||
            !quantity ||
            total === undefined
        ) {

            return res.status(400).json({
                success: false,
                message: "Missing order information"
            });

        }


        const numericQuantity =
            Number(quantity);


        const requestedTotal =
            Number(total);


        if (
            !Number.isFinite(numericQuantity) ||
            numericQuantity < 100
        ) {

            return res.status(400).json({
                success: false,
                message: "Minimum quantity is 100."
            });

        }


        if (
            !Number.isFinite(requestedTotal) ||
            requestedTotal <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid order amount."
            });

        }


        /*
            IMPORTANT:
            Do not trust the price sent by
            the browser.

            The server will read the current
            service catalogue here.
        */

        const catalogueRef =
            db.ref("serviceCatalog");


        const catalogueSnapshot =
            await catalogueRef.get();


        /*
            If the catalogue has not yet been
            stored in Firebase, stop safely.
        */

        if (!catalogueSnapshot.exists()) {

            return res.status(500).json({
                success: false,
                message:
                    "Service catalogue is not configured on the server yet."
            });

        }


        const catalogue =
            catalogueSnapshot.val();


        const selectedService =
            Object.values(catalogue).find(
                item =>
                    item.id === serviceId
            );


        if (!selectedService) {

            return res.status(400).json({
                success: false,
                message: "Service not found."
            });

        }


        /*
            Make sure the platform and service
            match the server catalogue.
        */

        if (
            selectedService.platform !== platform ||
            selectedService.service !== service
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid service information."
            });

        }


        /*
            Calculate the real price.
        */

        let finalTotal;


        if (
            selectedService.ratePer1000 === null
        ) {

            finalTotal =
                Number(
                    selectedService.fixedPrice
                );

        } else {

            finalTotal =
                (
                    numericQuantity / 1000
                ) *
                Number(
                    selectedService.ratePer1000
                );

        }


        finalTotal =
            Number(
                finalTotal.toFixed(2)
            );


        /*
            Make sure browser did not
            manipulate the price.
        */

        if (
            Math.abs(
                finalTotal - requestedTotal
            ) > 0.01
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Order price verification failed."
            });

        }


        /*
            Wallet reference.
        */

        const walletRef =
            db.ref(
                `users/${uid}/wallet`
            );


        /*
            Transactionally deduct the wallet.
            This protects against concurrent
            balance changes.
        */

        const walletResult =
            await walletRef.transaction(
                currentBalance => {

                    const balance =
                        Number(
                            currentBalance || 0
                        );


                    if (
                        balance < finalTotal
                    ) {

                        return;

                    }


                    return Number(
                        (
                            balance -
                            finalTotal
                        ).toFixed(2)
                    );

                }
            );


        /*
            Transaction was cancelled because
            there wasn't enough money.
        */

        if (
            !walletResult.committed
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Insufficient wallet balance."
            });

        }


        /*
            Create unique order reference.
        */

        const orderRef =
            db.ref("orders").push();


        const orderId =
            orderRef.key;


        const orderData = {

            orderId,

            uid,

            platform,

            serviceId,

            service,

            link,

            quantity:
                numericQuantity,

            amount:
                finalTotal,

            status: "pending",

            paymentStatus:
                "wallet",

            createdAt:
                Date.now()

        };


        /*
            Save the order.
        */

        await orderRef.set(
            orderData
        );


        /*
            Record the wallet transaction.
        */

        const transactionRef =
            db.ref("transactions").push();


        await transactionRef.set({

            uid,

            orderId,

            type: "order",

            amount:
                finalTotal,

            status: "success",

            description:
                `Order for ${service}`,

            createdAt:
                Date.now()

        });


        /*
            Return success.
        */

        return res.status(200).json({

            success: true,

            message:
                "Order placed successfully.",

            orderId,

            amount:
                finalTotal

        });


    } catch (error) {

        console.error(
            "CREATE ORDER ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to create order."

        });

    }

}
