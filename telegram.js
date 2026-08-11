// telegram.js
const BOT_TOKEN = "8935142560:AAGy1G0A9p-kXduZE_RhL_3F1wGFmNGyC7g";
const CHAT_ID = "6902633564";

async function sendTelegramNotification(orderData) {
    const message = `
🚨 *New Order Received!* 🚨
- *Order ID:* \`${orderData.orderId || 'N/A'}\`
- *User:* ${orderData.email || orderData.userEmail || 'N/A'}
- *Platform:* ${orderData.platform || 'N/A'}
- *Service:* ${orderData.service || orderData.serviceName || 'N/A'}
- *Quantity:* ${Number(orderData.quantity || 0).toLocaleString()}
- *Amount:* ₦${Number(orderData.amount || 0).toLocaleString()}
- *Link:* ${orderData.link || 'N/A'}
    `.trim();

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    try {
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: "Markdown"
            })
        });
    } catch (error) {
        console.error("Telegram notification error:", error);
    }
}

module.exports = { sendTelegramNotification };
