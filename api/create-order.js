import { admin, db } from "../firebase-admin.js";

import {
    hkdmservicesOfficialServicePriceCatalogue
} from "../services.js";


export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });

    }


    try {

        /*
            ================================
            1. VERIFY FIREBASE USER
            ================================
        */

        const authorization =
            req.headers.authorization || "";


        if (!authorization.startsWith("Bearer ")) {

            return res.status(401).json({
                success: false,
                message: "Please log in again."
            });

        }


        const idToken =
            authorization.substring(7);


        const decodedToken =
            await admin
                .auth()
                .verifyIdToken(idToken);


        const uid =
            decodedToken.uid;



        /*
            ================================
            2. GET ORDER DATA
            ================================
        */

        const {
            serviceId,
            link,
            quantity
        } = req.body;


        if (
            !serviceId ||
            !link ||
            quantity === undefined
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please provide the service, link and quantity."
            });

        }


        const numericQuantity =
            Number(quantity);


        if (
            !Number.isFinite(numericQuantity) ||
            numericQuantity < 100
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Minimum quantity is 100."
            });

        }



        /*
            ================================
            3. FIND SERVICE
            ================================
        */

        const selectedService =
            hkdmservicesOfficialServicePriceCatalogue.find(
                item =>
                    item.id === serviceId
            );


        if (!selectedService) {

            return res.status(400).json({
                success: false,
                message:
                    "Selected service was not found."
            });

        }



        /*
            ================================
            4. CALCULATE PRICE
            ================================
        */

        let total;


        if (
            selectedService.ratePer1000 === null
        ) {

            /*
                Fixed-price package
            */

            total =
                Number(
                    selectedService.fixedPrice
                );

        } else {

            /*
                Per-1,000 service
            */

            total =
                (
                    numericQuantity / 1000
                ) *
                Number(
                    selectedService.ratePer1000
                );

        }


        total =
            Number(
                total.toFixed(2)
            );



        /*
            ================================
            5. WALLET REFERENCE
            ================================
        */

const walletRef =
    db.ref(`users/${uid}/wallet`);


/*
    Read current wallet balance.
*/

const walletSnapshot =
    await walletRef.once("value");

const currentBalance =
    Number(walletSnapshot.val() || 0);


/*
    Check balance.
*/

if (currentBalance < total) {

    return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance."
    });

}


/*
    Deduct wallet.
*/

let transactionResult;

try {

    transactionResult =
        await walletRef.transaction(
            currentValue => {

                const balance =
                    Number(currentValue || 0);

                return Number(
                    (balance - total).toFixed(2)
                );

            }
        );

} catch (transactionError) {

    console.error(
        "WALLET TRANSACTION ERROR:",
        transactionError
    );

    return res.status(500).json({
        success: false,
        message:
            "Unable to update wallet balance."
    });

}


/*
    Confirm transaction.
*/

if (!transactionResult.committed) {

    return res.status(409).json({
        success: false,
        message:
            "Wallet transaction was not committed."
    });

}



        /*
            ================================
            7. CREATE ORDER ID
            ================================
        */

        const orderRef =
            db.ref("orders").push();


        const orderId =
            orderRef.key;


        const orderData = {

            orderId,

            uid,

            platform:
                selectedService.platform,

            serviceId:
                selectedService.id,

            service:
                selectedService.service,

            link,

            quantity:
                numericQuantity,

            amount:
                total,

            status:
                "pending",

            paymentMethod:
                "wallet",

            createdAt:
                Date.now()

        };



        /*
            ================================
            8. SAVE ORDER
            ================================
        */

        await orderRef.set(
            orderData
        );



        /*
            ================================
            9. SAVE TRANSACTION
            ================================
        */

        const transactionRef =
            db
                .ref("transactions")
                .push();


        await transactionRef.set({

            uid,

            orderId,

            type:
                "order",

            amount:
                total,

            status:
                "success",

            description:
                `Order - ${selectedService.platform} ${selectedService.service}`,

            createdAt:
                Date.now()

        });



        /*
            ================================
            10. SUCCESS
            ================================
        */

        return res.status(200).json({

            success: true,

            message:
                "Order placed successfully.",

            orderId,

            amount:
                total,

            newBalance:
                Number(
                    transactionResult.snapshot.val()
                )

        });


    } catch (error) {

        console.error(
            "CREATE ORDER ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to place order."

        });

    }

}
