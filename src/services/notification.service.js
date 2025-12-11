const admin = require('firebase-admin');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.initialized = false;
    this.initialize();
  }

  initialize() {
    try {
      // Check if Firebase is already initialized
      if (admin.apps.length > 0) {
        this.initialized = true;
        logger.info('✅ Firebase already initialized');
        return;
      }

      // Initialize Firebase Admin SDK
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // For production (Render) - JSON string in environment variable
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        this.initialized = true;
        logger.info('✅ Firebase Cloud Messaging initialized from environment variable');
      } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        // Alternative: individual environment variables
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          })
        });
        this.initialized = true;
        logger.info('✅ Firebase Cloud Messaging initialized from individual env vars');
      } else {
        logger.warn('⚠️  Firebase credentials not configured. Push notifications disabled.');
        logger.warn('   Set FIREBASE_SERVICE_ACCOUNT (JSON string) or individual Firebase env vars');
      }
    } catch (error) {
      logger.error('❌ Failed to initialize Firebase:', error.message);
      this.initialized = false;
    }
  }

  /**
   * Send push notification when a new order is created
   * @param {Object} order - Order object with customer and details
   * @param {string} deviceToken - FCM device token of the recipient
   */
  async sendOrderNotification(order, deviceToken) {
    if (!this.initialized) {
      logger.warn('⚠️  Firebase not initialized. Cannot send order notification.');
      return false;
    }

    if (!deviceToken) {
      logger.warn('⚠️  No device token provided. Cannot send notification.');
      return false;
    }

    try {
      const message = {
        notification: {
          title: '🎉 New Order Received!',
          body: `Order #${order.orderNumber || order._id.toString().slice(-6)} - ${order.items.length} items - $${order.totalAmount.toFixed(2)}`
        },
        data: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber || '',
          type: 'NEW_ORDER',
          totalAmount: order.totalAmount.toString(),
          itemCount: order.items.length.toString(),
          timestamp: new Date().toISOString()
        },
        token: deviceToken,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'orders',
            priority: 'high'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      logger.info(`✅ Order notification sent successfully. FCM Response: ${response}`);
      return true;
    } catch (error) {
      logger.error('❌ Failed to send order notification:', {
        error: error.message,
        code: error.code,
        orderId: order._id
      });
      return false;
    }
  }

  /**
   * Send push notification when order status changes
   * @param {Object} order - Order object
   * @param {string} newStatus - New order status
   * @param {string} deviceToken - FCM device token
   */
  async sendOrderStatusUpdate(order, newStatus, deviceToken) {
    if (!this.initialized || !deviceToken) {
      return false;
    }

    try {
      const statusMessages = {
        confirmed: '✅ Your order has been confirmed!',
        preparing: '👨‍🍳 Your order is being prepared',
        ready: '🎉 Your order is ready for pickup!',
        picked_up: '🚚 Your order is out for delivery',
        delivered: '✅ Your order has been delivered!',
        cancelled: '❌ Your order has been cancelled'
      };

      const message = {
        notification: {
          title: 'Order Status Update',
          body: statusMessages[newStatus] || `Order status: ${newStatus}`
        },
        data: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber || '',
          type: 'ORDER_STATUS_UPDATE',
          status: newStatus,
          timestamp: new Date().toISOString()
        },
        token: deviceToken,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'orders'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default'
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      logger.info(`✅ Order status notification sent. Status: ${newStatus}, FCM Response: ${response}`);
      return true;
    } catch (error) {
      logger.error('❌ Failed to send order status notification:', error.message);
      return false;
    }
  }

  /**
   * Send notification to multiple devices (broadcast)
   * @param {Array<string>} deviceTokens - Array of FCM device tokens
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data payload
   */
  async sendMulticastNotification(deviceTokens, title, body, data = {}) {
    if (!this.initialized || !deviceTokens || deviceTokens.length === 0) {
      return false;
    }

    try {
      const message = {
        notification: { title, body },
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        tokens: deviceTokens
      };

      const response = await admin.messaging().sendMulticast(message);
      logger.info(`✅ Multicast notification sent. Success: ${response.successCount}, Failed: ${response.failureCount}`);
      
      // Log failed tokens for cleanup
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            logger.warn(`Failed token: ${deviceTokens[idx]}, Error: ${resp.error?.message}`);
          }
        });
      }

      return true;
    } catch (error) {
      logger.error('❌ Failed to send multicast notification:', error.message);
      return false;
    }
  }

  /**
   * Send custom notification
   * @param {string} deviceToken - FCM device token
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data payload
   */
  async sendCustomNotification(deviceToken, title, body, data = {}) {
    if (!this.initialized || !deviceToken) {
      return false;
    }

    try {
      const message = {
        notification: { title, body },
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        token: deviceToken
      };

      const response = await admin.messaging().send(message);
      logger.info(`✅ Custom notification sent. FCM Response: ${response}`);
      return true;
    } catch (error) {
      logger.error('❌ Failed to send custom notification:', error.message);
      return false;
    }
  }
}

module.exports = new NotificationService();
