const logger = require('../utils/logger');
const brevo = require('@getbrevo/brevo');

class EmailService {
  constructor() {
    this.brevoClient = null;
    this.enabled = false;
    this.initialize();
  }

  initialize() {
    if (!process.env.BREVO_API_KEY) {
      logger.error('❌ BREVO_API_KEY not configured in environment variables');
      return;
    }

    try {
      const apiInstance = new brevo.TransactionalEmailsApi();
      apiInstance.setApiKey(
        brevo.TransactionalEmailsApiApiKeys.apiKey,
        process.env.BREVO_API_KEY
      );
      this.brevoClient = apiInstance;
      this.enabled = true;
      logger.info('✅ Email service initialized with Brevo');
    } catch (error) {
      logger.error('❌ Failed to initialize Brevo email service:', error.message);
    }
  }

  async sendOTPEmail(to, otp, username = 'User') {
    if (!this.enabled) {
      logger.error('❌ Email service not enabled. Cannot send OTP email.');
      return false;
    }

    try {
      logger.info(`📧 Sending OTP email to ${to}`);

      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.subject = 'Verify Your TipTop Account';
      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">ThéTipTop</h1>
                      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Verify Your Account</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hello ${username}!</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Thank you for registering with ThéTipTop. To complete your registration, please use the following One-Time Password (OTP):
                      </p>
                      
                      <!-- OTP Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <div style="background-color: #f8f9fa; border: 2px dashed #FF6B6B; border-radius: 8px; padding: 20px; display: inline-block;">
                              <p style="margin: 0; color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
                              <h1 style="margin: 10px 0 0 0; color: #FF6B6B; font-size: 36px; letter-spacing: 8px; font-weight: bold;">${otp}</h1>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                        <strong>Important:</strong> This OTP will expire in <strong>10 minutes</strong>. Please do not share this code with anyone.
                      </p>
                      
                      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                        If you didn't request this verification, please ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                      <p style="color: #999999; font-size: 12px; margin: 0; line-height: 1.6;">
                        © 2025 ThéTipTop. All rights reserved.<br>
                        This is an automated email. Please do not reply.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
      sendSmtpEmail.sender = {
        name: process.env.EMAIL_FROM_NAME || 'ThéTipTop',
        email: process.env.BREVO_FROM_EMAIL || 'noreply@yourdomain.com'
      };

      const result = await this.brevoClient.sendTransacEmail(sendSmtpEmail);
      logger.info(`✅ OTP email sent successfully to ${to}. Message ID: ${result.messageId}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to send OTP email to ${to}:`, {
        error: error.message,
        response: error.response?.body || error.response?.text
      });
      return false;
    }
  }

  async sendOrderConfirmation(to, orderDetails) {
    if (!this.enabled) {
      logger.error('❌ Email service not enabled. Cannot send order confirmation.');
      return false;
    }

    try {
      logger.info(`📧 Sending order confirmation email to ${to}`);

      const items = orderDetails.items.map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">
            <strong>${item.name}</strong>
            ${item.portion ? `<br><span style="color: #888; font-size: 12px;">${item.portion}</span>` : ''}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">×${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">₹${item.price}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;"><strong>₹${item.subtotal}</strong></td>
        </tr>
      `).join('');

      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.subject = `Order Confirmation - ${orderDetails.orderNumber}`;
      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">ThéTipTop</h1>
                      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Order Confirmation</p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #333333; margin: 0 0 10px 0; font-size: 24px;">Thank you for your order!</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Your order has been confirmed and will be prepared shortly.
                      </p>
                      
                      <div style="background-color: #f8f9fa; border-left: 4px solid #FF6B6B; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #666666; font-size: 14px;"><strong>Order Number:</strong> ${orderDetails.orderNumber}</p>
                        ${orderDetails.customer?.name ? `<p style="margin: 5px 0 0 0; color: #666666; font-size: 14px;"><strong>Customer:</strong> ${orderDetails.customer.name}</p>` : ''}
                        ${orderDetails.customer?.phone ? `<p style="margin: 5px 0 0 0; color: #666666; font-size: 14px;"><strong>Phone:</strong> ${orderDetails.customer.phone}</p>` : ''}
                      </div>

                      <h3 style="color: #333333; margin: 30px 0 15px 0; font-size: 18px;">Order Details</h3>
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                        <thead>
                          <tr style="background-color: #f8f9fa;">
                            <th style="padding: 12px 10px; text-align: left; color: #666; font-size: 12px; text-transform: uppercase;">Item</th>
                            <th style="padding: 12px 10px; text-align: center; color: #666; font-size: 12px; text-transform: uppercase;">Qty</th>
                            <th style="padding: 12px 10px; text-align: right; color: #666; font-size: 12px; text-transform: uppercase;">Price</th>
                            <th style="padding: 12px 10px; text-align: right; color: #666; font-size: 12px; text-transform: uppercase;">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${items}
                        </tbody>
                      </table>

                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                        <tr>
                          <td style="padding: 8px 10px; text-align: right; color: #666;">Items Total:</td>
                          <td style="padding: 8px 10px; text-align: right; width: 100px;"><strong>₹${orderDetails.pricing.itemsTotal}</strong></td>
                        </tr>
                        ${orderDetails.pricing.deliveryFee > 0 ? `
                        <tr>
                          <td style="padding: 8px 10px; text-align: right; color: #666;">Delivery Fee:</td>
                          <td style="padding: 8px 10px; text-align: right;"><strong>₹${orderDetails.pricing.deliveryFee}</strong></td>
                        </tr>` : ''}
                        ${orderDetails.pricing.gst > 0 ? `
                        <tr>
                          <td style="padding: 8px 10px; text-align: right; color: #666;">GST:</td>
                          <td style="padding: 8px 10px; text-align: right;"><strong>₹${orderDetails.pricing.gst}</strong></td>
                        </tr>` : ''}
                        ${orderDetails.pricing.discount > 0 ? `
                        <tr>
                          <td style="padding: 8px 10px; text-align: right; color: #666;">Discount:</td>
                          <td style="padding: 8px 10px; text-align: right; color: #4CAF50;"><strong>-₹${orderDetails.pricing.discount}</strong></td>
                        </tr>` : ''}
                        <tr style="border-top: 2px solid #FF6B6B;">
                          <td style="padding: 15px 10px; text-align: right; font-size: 18px; color: #333;"><strong>Total Amount:</strong></td>
                          <td style="padding: 15px 10px; text-align: right; font-size: 20px; color: #FF6B6B;"><strong>₹${orderDetails.pricing.finalAmount}</strong></td>
                        </tr>
                      </table>

                      ${orderDetails.deliveryAddress ? `
                      <h3 style="color: #333333; margin: 30px 0 15px 0; font-size: 18px;">Delivery Address</h3>
                      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                          ${orderDetails.deliveryAddress.street}<br>
                          ${orderDetails.deliveryAddress.city}, ${orderDetails.deliveryAddress.state}<br>
                          ${orderDetails.deliveryAddress.zipCode}
                        </p>
                      </div>` : ''}

                      ${orderDetails.estimatedDeliveryTime ? `
                      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #856404; font-size: 14px;">
                          <strong>⏱️ Estimated Delivery:</strong> ${new Date(orderDetails.estimatedDeliveryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>` : ''}
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                      <p style="color: #999999; font-size: 12px; margin: 0; line-height: 1.6;">
                        © 2025 ThéTipTop. All rights reserved.<br>
                        Questions? Contact us at support@thetiptop.com
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
      sendSmtpEmail.sender = {
        name: process.env.EMAIL_FROM_NAME || 'ThéTipTop',
        email: process.env.BREVO_FROM_EMAIL || 'noreply@yourdomain.com'
      };

      const result = await this.brevoClient.sendTransacEmail(sendSmtpEmail);
      logger.info(`✅ Order confirmation email sent to ${to}. Message ID: ${result.messageId}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to send order confirmation email to ${to}:`, {
        error: error.message,
        response: error.response?.body || error.response?.text
      });
      return false;
    }
  }

  async sendEmail(to, subject, htmlContent, textContent = '') {
    if (!this.enabled) {
      logger.error('❌ Email service not enabled. Cannot send email.');
      return false;
    }

    try {
      logger.info(`📧 Sending email to ${to}: "${subject}"`);

      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.htmlContent = htmlContent;
      if (textContent) {
        sendSmtpEmail.textContent = textContent;
      }
      sendSmtpEmail.sender = {
        name: process.env.EMAIL_FROM_NAME || 'ThéTipTop',
        email: process.env.BREVO_FROM_EMAIL || 'noreply@yourdomain.com'
      };

      const result = await this.brevoClient.sendTransacEmail(sendSmtpEmail);
      logger.info(`✅ Email sent successfully to ${to}. Message ID: ${result.messageId}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to send email to ${to}:`, {
        error: error.message,
        response: error.response?.body || error.response?.text
      });
      return false;
    }
  }
}

module.exports = new EmailService();
