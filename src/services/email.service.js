const logger = require('../utils/logger');

let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  logger.warn('nodemailer not installed. Email functionality will be disabled. Install with: npm install nodemailer');
}

class EmailService {
  constructor() {
    this.transporter = null;
    this.enabled = false;
    if (nodemailer) {
      this.initializeTransporter();
    }
  }

  initializeTransporter() {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        logger.warn('Email credentials not configured. Email notifications disabled.');
        return;
      }

      // Create transporter using environment variables
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        // Add connection timeout settings
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,   // 10 seconds
        socketTimeout: 15000,     // 15 seconds
      });

      this.enabled = true;
      logger.info('Email transporter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  async sendEmail({ to, subject, html, text }) {
    if (!this.enabled || !this.transporter) {
      logger.warn('Email service not available. Skipping email send.');
      return false;
    }

    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'ThéTipTop'}" <${process.env.EMAIL_USER}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}:`, info.messageId);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  async sendVerificationOTP(email, name, otp) {
    if (!this.enabled) {
      logger.warn('Email service disabled. Install nodemailer: npm install nodemailer');
      return false;
    }

    const subject = 'Verify Your TipTop Account';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .otp-box { background: #f9fafb; border: 2px dashed #dc2626; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #dc2626; font-family: 'Courier New', monospace; }
          .info-text { color: #6b7280; font-size: 14px; margin: 20px 0; text-align: center; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Verify Your Account</h1>
          </div>
          
          <div class="content">
            <p>Hi <strong>${name}</strong>,</p>
            <p>Welcome to <strong>TipTop</strong>! To complete your registration, please verify your email address using the code below:</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Your Verification Code</p>
              <p class="otp-code">${otp}</p>
            </div>
            
            <p class="info-text">This code will expire in <strong>10 minutes</strong>.</p>
            
            <div class="warning">
              ⚠️ <strong>Security Note:</strong> Never share this code with anyone. TipTop staff will never ask for your verification code.
            </div>
            
            <p>If you didn't create an account with TipTop, please ignore this email or contact our support team.</p>
          </div>
          
          <div class="footer">
            <p>© 2025 TipTop Restaurant. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi ${name},

Welcome to TipTop! Your verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't create this account, please ignore this email.

Best regards,
The TipTop Team
    `;

    return this.sendEmail({ to: email, subject, html, text });
  }

  async sendNewOrderNotification(orderDetails, notificationEmails) {
    if (!this.enabled) {
      logger.warn('Email service disabled. Install nodemailer: npm install nodemailer');
      return false;
    }

    if (!notificationEmails || notificationEmails.length === 0) {
      logger.info('No notification emails configured');
      return false;
    }

    const subject = `🔔 New Order #${orderDetails.orderNumber} Received!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .order-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .label { font-weight: bold; color: #6b7280; }
          .value { color: #111827; }
          .items-list { margin-top: 15px; }
          .item { background: #f3f4f6; padding: 10px; margin: 5px 0; border-radius: 5px; }
          .footer { background: #374151; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; }
          .total { font-size: 24px; font-weight: bold; color: #ef4444; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🔔 New Order Alert!</h1>
            <p style="margin: 5px 0;">Order #${orderDetails.orderNumber}</p>
          </div>
          
          <div class="content">
            <div class="order-info">
              <div class="info-row">
                <span class="label">Customer:</span>
                <span class="value">${orderDetails.customer?.name || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value">${orderDetails.customer?.phone || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Order Type:</span>
                <span class="value">${orderDetails.orderType || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Payment Method:</span>
                <span class="value">${orderDetails.paymentMethod || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value">${orderDetails.status || 'pending'}</span>
              </div>
            </div>

            <div class="items-list">
              <h3>Order Items:</h3>
              ${orderDetails.items?.map(item => `
                <div class="item">
                  <strong>${item.name}</strong> x ${item.quantity}
                  <br/>
                  <small>Price: ₹${item.price} | Subtotal: ₹${item.subtotal}</small>
                </div>
              `).join('') || '<p>No items</p>'}
            </div>

            <div class="order-info" style="margin-top: 20px;">
              <div class="info-row">
                <span class="label">Subtotal:</span>
                <span class="value">₹${orderDetails.pricing?.subtotal || 0}</span>
              </div>
              <div class="info-row">
                <span class="label">Tax:</span>
                <span class="value">₹${orderDetails.pricing?.tax || 0}</span>
              </div>
              <div class="info-row">
                <span class="label">Delivery Charges:</span>
                <span class="value">₹${orderDetails.pricing?.deliveryCharges || 0}</span>
              </div>
              <div class="info-row" style="border: none; margin-top: 10px;">
                <span class="label">Total Amount:</span>
                <span class="total">₹${orderDetails.pricing?.finalAmount || 0}</span>
              </div>
            </div>

            ${orderDetails.deliveryAddress ? `
              <div class="order-info">
                <h3>Delivery Address:</h3>
                <p>${orderDetails.deliveryAddress.street || ''}<br/>
                ${orderDetails.deliveryAddress.city || ''}, ${orderDetails.deliveryAddress.postalCode || ''}<br/>
                ${orderDetails.deliveryAddress.country || ''}</p>
              </div>
            ` : ''}

            ${orderDetails.notes ? `
              <div class="order-info">
                <h3>Special Instructions:</h3>
                <p>${orderDetails.notes}</p>
              </div>
            ` : ''}
          </div>

          <div class="footer">
            <p style="margin: 5px 0;">ThéTipTop - Order Management System</p>
            <p style="margin: 5px 0; font-size: 12px;">This is an automated notification. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
New Order Alert!

Order Number: #${orderDetails.orderNumber}
Customer: ${orderDetails.customer?.name || 'N/A'}
Phone: ${orderDetails.customer?.phone || 'N/A'}
Order Type: ${orderDetails.orderType || 'N/A'}
Payment Method: ${orderDetails.paymentMethod || 'N/A'}
Total Amount: ₹${orderDetails.pricing?.finalAmount || 0}

Items:
${orderDetails.items?.map(item => `- ${item.name} x ${item.quantity} = ₹${item.subtotal}`).join('\n') || 'No items'}

---
ThéTipTop - Order Management System
    `.trim();

    return await this.sendEmail({
      to: notificationEmails,
      subject,
      html,
      text,
    });
  }

  async sendOrderStatusUpdate(orderDetails, notificationEmail) {
    const subject = `Order #${orderDetails.orderNumber} - Status Updated`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; text-align: center; }
          .status-badge { display: inline-block; padding: 10px 20px; border-radius: 20px; font-weight: bold; font-size: 18px; margin: 20px 0; }
          .footer { background: #374151; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📦 Order Status Update</h1>
          </div>
          
          <div class="content">
            <h2>Order #${orderDetails.orderNumber}</h2>
            <div class="status-badge" style="background: #10b981; color: white;">
              ${orderDetails.status?.toUpperCase() || 'UPDATED'}
            </div>
            <p style="font-size: 16px; color: #6b7280;">
              Your order status has been updated. Thank you for your patience!
            </p>
          </div>

          <div class="footer">
            <p style="margin: 5px 0;">ThéTipTop</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Order #${orderDetails.orderNumber} - Status Updated\n\nYour order status has been updated to: ${orderDetails.status}\n\nThank you!\nThéTipTop`;

    return await this.sendEmail({
      to: notificationEmail,
      subject,
      html,
      text,
    });
  }

  async sendNewOrderNotification(orderDetails, notificationEmails) {
    if (!this.enabled) {
      logger.warn('Email service disabled.');
      return false;
    }

    const subject = `🔔 New Order Received - #${orderDetails.orderNumber}`;
    
    const itemsList = orderDetails.items
      .map(item => `<li>${item.name} x ${item.quantity} - ₹${item.price * item.quantity}</li>`)
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 10px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px 15px; text-align: center; }
          .logo { max-width: 150px; height: auto; margin-bottom: 15px; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 20px 15px; }
          .order-box { background: #f9fafb; border-radius: 10px; padding: 15px; margin: 15px 0; }
          .order-number { font-size: 22px; font-weight: bold; color: #dc2626; text-align: center; margin-bottom: 15px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; flex-wrap: wrap; gap: 5px; }
          .info-label { font-weight: bold; color: #6b7280; font-size: 14px; }
          .info-value { color: #111827; font-size: 14px; text-align: right; }
          .items-list { background: white; border-radius: 8px; padding: 12px; margin: 12px 0; }
          .items-list ul { margin: 0; padding-left: 20px; }
          .items-list li { padding: 5px 0; font-size: 14px; }
          .total { font-size: 18px; font-weight: bold; color: #dc2626; text-align: right; margin-top: 12px; }
          .status-badge { display: inline-block; padding: 6px 14px; background: #fbbf24; color: #78350f; border-radius: 20px; font-weight: bold; font-size: 13px; }
          .footer { background: #f9fafb; padding: 15px; text-align: center; color: #6b7280; font-size: 11px; }
          @media only screen and (max-width: 480px) {
            body { padding: 5px; }
            .content { padding: 15px 10px; }
            .order-box { padding: 12px; margin: 12px 0; }
            .header h1 { font-size: 20px; }
            .order-number { font-size: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://raw.githubusercontent.com/Thetiptop007/The-Tip-Top/main/public/logo-full.png" alt="ThéTipTop Logo" class="logo" />
            <h1>🔔 New Order Received!</h1>
          </div>
          
          <div class="content">
            <div class="order-number">Order #${orderDetails.orderNumber}</div>
            <div class="status-badge">${orderDetails.status}</div>

            <div class="order-box">
              <h3>Customer Information</h3>
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${orderDetails.customer.name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Phone:</span>
                <span class="info-value">${orderDetails.customer.phone}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${orderDetails.customer.email}</span>
              </div>
            </div>

            <div class="order-box">
              <h3>Delivery Address</h3>
              <p style="margin: 0; line-height: 1.8;">
                ${orderDetails.deliveryAddress.apartment ? orderDetails.deliveryAddress.apartment + ', ' : ''}
                ${orderDetails.deliveryAddress.street}<br/>
                ${orderDetails.deliveryAddress.landmark ? orderDetails.deliveryAddress.landmark + '<br/>' : ''}
                ${orderDetails.deliveryAddress.city}, ${orderDetails.deliveryAddress.state} - ${orderDetails.deliveryAddress.zipCode}
              </p>
              ${orderDetails.deliveryAddress.deliveryInstructions ? 
                `<p style="margin-top: 10px; padding: 10px; background: #fef3c7; border-radius: 5px;">
                  <strong>Instructions:</strong> ${orderDetails.deliveryAddress.deliveryInstructions}
                </p>` : ''}
            </div>

            <div class="order-box">
              <h3>Order Items</h3>
              <div class="items-list">
                <ul>${itemsList}</ul>
              </div>
              <div class="info-row">
                <span class="info-label">Subtotal:</span>
                <span class="info-value">₹${orderDetails.pricing.subtotal || orderDetails.pricing.itemsTotal}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Delivery Fee:</span>
                <span class="info-value">₹${orderDetails.pricing.deliveryCharges || orderDetails.pricing.deliveryFee}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Tax:</span>
                <span class="info-value">₹${orderDetails.pricing.taxAmount || orderDetails.pricing.gst}</span>
              </div>
              <div class="total">Total: ₹${orderDetails.pricing.finalAmount}</div>
            </div>

            <div class="order-box">
              <h3>Payment</h3>
              <div class="info-row">
                <span class="info-label">Method:</span>
                <span class="info-value">${orderDetails.paymentMethod}</span>
              </div>
              ${orderDetails.notes ? 
                `<div class="info-row">
                  <span class="info-label">Special Instructions:</span>
                  <span class="info-value">${orderDetails.notes}</span>
                </div>` : ''}
            </div>

            <p style="text-align: center; margin-top: 30px; color: #6b7280;">
              Please log in to the admin panel to manage this order.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 5px 0;">This is an automated notification from ThéTipTop</p>
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} ThéTipTop. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `New Order Received!\n\nOrder #${orderDetails.orderNumber}\nCustomer: ${orderDetails.customer.name}\nPhone: ${orderDetails.customer.phone}\nTotal: ₹${orderDetails.pricing.finalAmount}\n\nPlease log in to the admin panel to manage this order.`;

    return await this.sendEmail({
      to: notificationEmails,
      subject,
      html,
      text,
    });
  }
}

module.exports = new EmailService();
