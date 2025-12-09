const mongoose = require('mongoose');

// Delivery Status Sub-schema
const deliveryStatusSchema = new mongoose.Schema({
  push: String,
  sms: String,
  email: String,
});

// Action Sub-schema
const actionSchema = new mongoose.Schema({
  type: String,
  url: String,
  label: String,
});

// Notification Schema
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
      role: String,
    },

    type: {
      type: String,
      required: true,
      enum: [
        'order_update',
        'promotion',
        'delivery_assigned',
        'payment_received',
        'order_cancelled',
        'order_delivered',
        'rating_request',
        'loyalty_earned',
        'new_order',
      ],
    },

    category: {
      type: String,
      enum: ['transactional', 'promotional', 'informational'],
      default: 'transactional',
    },

    // Content
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: mongoose.Schema.Types.Mixed,

    // Delivery Channels
    channels: {
      push: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      email: {
        type: Boolean,
        default: false,
      },
      inApp: {
        type: Boolean,
        default: true,
      },
    },

    // Delivery Status
    deliveryStatus: {
      push: {
        status: String,
        sentAt: Date,
        error: String,
      },
      sms: {
        status: String,
        sentAt: Date,
        error: String,
      },
      email: {
        status: String,
        sentAt: Date,
        error: String,
      },
    },

    // Priority
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },

    // Read Status
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,

    // Related Entities
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    relatedMenuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
    },

    // Action button
    action: actionSchema,

    // Expiry
    expiresAt: Date,

    // Scheduled for future
    scheduledFor: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ 'recipient.id': 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ scheduledFor: 1, 'deliveryStatus.push.status': 1 });

// Static method to find unread for user
notificationSchema.statics.findUnreadForUser = function (userId, limit = 20) {
  return this.find({
    'recipient.id': userId,
    isRead: false,
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to count unread for user
notificationSchema.statics.countUnreadForUser = function (userId) {
  return this.countDocuments({
    'recipient.id': userId,
    isRead: false,
  });
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
};

// Instance method to update delivery status
notificationSchema.methods.updateDeliveryStatus = async function (channel, status, error = null) {
  if (this.deliveryStatus[channel]) {
    this.deliveryStatus[channel].status = status;
    this.deliveryStatus[channel].sentAt = new Date();
    if (error) {
      this.deliveryStatus[channel].error = error;
    }
    await this.save();
  }
};

module.exports = mongoose.model('Notification', notificationSchema);
