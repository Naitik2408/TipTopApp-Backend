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
