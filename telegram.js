const BOT_TOKEN =
    process.env.TELEGRAM_BOT_TOKEN;

const CHAT_ID =
    process.env.TELEGRAM_CHAT_ID;


export async function sendTelegramNotification(orderData) {

    if (!BOT_TOKEN || !CHAT_ID) {

        console.error(
            "Telegram configuration is missing."
        );

        return;

    }


    // ====================================================
    // 1. NORMAL ORDER INFORMATION
    // ====================================================

    const message = `
🚨 New Order Received! 🚨

Order ID: ${orderData.orderId || "N/A"}

User: ${orderData.email || orderData.userEmail || "N/A"}

Platform: ${orderData.platform || "N/A"}

Service: ${orderData.service || orderData.serviceName || "N/A"}

Quantity: ${Number(
        orderData.quantity || 0
    ).toLocaleString()}

Amount: ₦${Number(
        orderData.amount || 0
    ).toLocaleString()}

Link: ${orderData.link || "N/A"}
    `.trim();


    const url =
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;


    // ====================================================
    // 2. SEND NORMAL ORDER NOTIFICATION
    // ====================================================

    try {

        const response =
            await fetch(
                url,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        chat_id: CHAT_ID,
                        text: message
                    })
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            console.error(
                "Telegram order notification failed:",
                result
            );

        }

    }

    catch (error) {

        console.error(
            "Telegram notification error:",
            error
        );

    }



    // ====================================================
    // 3. CHECK FOR CUSTOMER COMMENTS
    // ====================================================

    if (
        !Array.isArray(orderData.comments) ||
        orderData.comments.length === 0
    ) {

        return;

    }



    // ====================================================
    // 4. PREPARE COMMENTS
    // ====================================================

    const comments =
        orderData.comments
            .map(
                (comment, index) =>
                    `${index + 1}. ${String(comment).trim()}`
            )
            .join("\n");


    const commentsHeader =
        `💬 CUSTOMER COMMENTS

Order ID: ${orderData.orderId || "N/A"}

Total Comments: ${orderData.comments.length}

--------------------------------
`;



    // ====================================================
    // 5. TELEGRAM MESSAGE LIMIT
    //
    // Telegram allows approximately 4096 characters
    // per message. We use a safer limit.
    // ====================================================

    const MAX_LENGTH = 3500;


    const chunks = [];

    let currentChunk =
        commentsHeader;


    const commentLines =
        comments.split("\n");


    for (
        const line of commentLines
    ) {

        if (
            (
                currentChunk.length +
                line.length +
                1
            ) > MAX_LENGTH
        ) {

            chunks.push(
                currentChunk.trim()
            );

            currentChunk =
                line + "\n";

        }

        else {

            currentChunk +=
                line + "\n";

        }

    }


    if (
        currentChunk.trim().length > 0
    ) {

        chunks.push(
            currentChunk.trim()
        );

    }



    // ====================================================
    // 6. SEND COMMENT CHUNKS
    // ====================================================

    for (
        let i = 0;
        i < chunks.length;
        i++
    ) {

        const chunk =
            chunks[i];


        const chunkMessage =
            chunks.length > 1
                ? `${chunk}\n\n📄 Part ${i + 1} of ${chunks.length}`
                : chunk;


        try {

            const response =
                await fetch(
                    url,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            chat_id:
                                CHAT_ID,

                            text:
                                chunkMessage

                        })

                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                console.error(
                    "Telegram comments notification failed:",
                    result
                );

            }

        }

        catch (error) {

            console.error(
                "Telegram comments error:",
                error
            );

        }

    }

}
