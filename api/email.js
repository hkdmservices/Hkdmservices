// api/email.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email using Resend
 */
export async function sendEmail(to, subject, html) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'HKDMservices <support@hkdmservices.xyz>',
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Resend API error:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(to, orderDetails) {
  const subject = `Order Confirmation - HKDMservices`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { background: #1a1a2e; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .footer { text-align: center; font-size: 12px; color: #888; margin-top: 20px; }
        .order-details { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .amount { font-size: 24px; color: #1a1a2e; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>HKDMservices</h2>
          <p>Order Confirmation</p>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Thank you for your order! We're processing it right away.</p>
          <div class="order-details">
            <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
            <p><strong>Service:</strong> ${orderDetails.service || 'N/A'}</p>
            <p><strong>Platform:</strong> ${orderDetails.platform || 'N/A'}</p>
            <p><strong>Quantity:</strong> ${orderDetails.quantity || 1}</p>
            <p class="amount"><strong>Amount:</strong> ₦${orderDetails.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p><strong>Status:</strong> ${orderDetails.status || 'Pending'}</p>
          </div>
          <p>You can track your order in your dashboard.</p>
          <p>Thank you for choosing HKDMservices! 🚀</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HKDMservices. All rights reserved.</p>
          <p>support@hkdmservices.xyz</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail(to, subject, html);
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceipt(to, paymentDetails) {
  const subject = `Payment Receipt - HKDMservices`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { background: #1a1a2e; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .footer { text-align: center; font-size: 12px; color: #888; margin-top: 20px; }
        .receipt-details { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .amount { font-size: 24px; color: #27ae60; font-weight: bold; }
        .status-success { color: #27ae60; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>HKDMservices</h2>
          <p>Payment Receipt</p>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We have received your payment successfully! 🎉</p>
          <div class="receipt-details">
            <p><strong>Reference:</strong> ${paymentDetails.reference}</p>
            <p><strong>Amount:</strong> <span class="amount">₦${paymentDetails.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
            <p><strong>Status:</strong> <span class="status-success">${paymentDetails.status || 'Success'}</span></p>
            <p><strong>Payment Method:</strong> ${paymentDetails.paymentMethod || 'Korapay'}</p>
          </div>
          <p>Your wallet has been credited. You can now place orders.</p>
          <p>Thank you for choosing HKDMservices! 🚀</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HKDMservices. All rights reserved.</p>
          <p>support@hkdmservices.xyz</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail(to, subject, html);
}
