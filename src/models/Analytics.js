const mongoose = require('mongoose');

// Top Item Sub-schema
const topItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
  },
  name: String,
  orders: Number,
  revenue: Number,
});

// Category Performance Sub-schema
const categoryPerformanceSchema = new mongoose.Schema({
  category: String,
  orders: Number,
  revenue: Number,
});

// Analytics Schema
const analyticsSchema = new mongoose.Schema(
  {
    period: {
      type: String,
      required: true,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    // Revenue metrics
    revenue: {
      total: {
        type: Number,
        default: 0,
      },
      online: {
        type: Number,
        default: 0,
      },
      cod: {
        type: Number,
        default: 0,
      },
      discounts: {
        type: Number,
        default: 0,
      },
      taxes: {
        type: Number,
        default: 0,
      },
      netRevenue: {
        type: Number,
        default: 0,
      },
    },

    // Order metrics
    orders: {
      total: {
        type: Number,
        default: 0,
      },
      completed: {
        type: Number,
        default: 0,
      },
      cancelled: {
        type: Number,
        default: 0,
      },
      averageValue: {
        type: Number,
        default: 0,
      },
      peakHour: String,
    },

    // Customer metrics
    customers: {
      new: {
        type: Number,
        default: 0,
      },
      returning: {
        type: Number,
        default: 0,
      },
      churned: {
        type: Number,
        default: 0,
      },
      totalActive: {
        type: Number,
        default: 0,
      },
    },

    // Popular items (top 10)
    topItems: [topItemSchema],

    // Category performance
    categoryPerformance: [categoryPerformanceSchema],

    // Delivery performance
    delivery: {
      averageTime: {
        type: Number,
        default: 0,
      },
      onTimePercentage: {
        type: Number,
        default: 0,
      },
      activePartners: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
analyticsSchema.index({ period: 1, date: -1 });
analyticsSchema.index({ date: -1 });

// Static method to get analytics for date range
analyticsSchema.statics.getForDateRange = function (period, startDate, endDate) {
  return this.find({
    period,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: 1 });
};

// Static method to get latest analytics
analyticsSchema.statics.getLatest = function (period = 'daily') {
  return this.findOne({ period }).sort({ date: -1 });
};

module.exports = mongoose.model('Analytics', analyticsSchema);
