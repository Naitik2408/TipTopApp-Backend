const mongoose = require('mongoose');

// Time Slot Sub-schema
const timeSlotSchema = new mongoose.Schema({
  from: String,
  to: String,
});

// Stats Sub-schema
const promoStatsSchema = new mongoose.Schema({
  totalUses: {
    type: Number,
    default: 0,
  },
  totalDiscount: {
    type: Number,
    default: 0,
  },
  totalRevenue: {
    type: Number,
    default: 0,
  },
  conversionRate: {
    type: Number,
    default: 0,
  },
});

// PromoCode Schema
const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    // Discount Details
    discountType: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed', 'free-delivery'],
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },

    // Applicability
    applicableTo: {
      type: String,
      enum: ['all', 'specific-users', 'first-order', 'specific-items'],
      default: 'all',
    },
    applicableItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
      },
    ],
    applicableCategories: [String],

    eligibleUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    eligibleUserSegments: [
      {
        type: String,
        enum: ['new-users', 'high-value', 'regular', 'at-risk'],
      },
    ],

    // Limits
    usageLimit: {
      type: Number,
      min: 1,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
    },

    // Validity
    validFrom: {
      type: Date,
      required: true,
      index: true,
    },
    validTo: {
      type: Date,
      required: true,
      index: true,
    },
    daysOfWeek: [
      {
        type: Number,
        min: 0,
        max: 6,
      },
    ],
    timeSlots: [timeSlotSchema],

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Metadata
    campaignName: String,
    description: String,
    termsAndConditions: String,

    // Analytics
    stats: promoStatsSchema,
  },
  {
    timestamps: true,
  }
);

// Indexes
promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ isActive: 1, validFrom: 1, validTo: 1 });

// Virtual for active status
promoCodeSchema.virtual('isCurrentlyActive').get(function () {
  const now = new Date();
  return this.isActive && this.validFrom <= now && this.validTo >= now;
});

// Virtual for remaining uses
promoCodeSchema.virtual('remainingUses').get(function () {
  if (!this.usageLimit) return Infinity;
  return this.usageLimit - this.usageCount;
});

// Static method to find active promo codes
promoCodeSchema.statics.findActive = function () {
  const now = new Date();
  return this.find({
    isActive: true,
    validFrom: { $lte: now },
    validTo: { $gte: now },
  });
};

// Static method to validate promo code
promoCodeSchema.statics.validateCode = async function (code, userId, orderData) {
  const promo = await this.findOne({ code: code.toUpperCase() });

  if (!promo) {
    return { valid: false, message: 'Invalid promo code' };
  }

  if (!promo.isActive) {
    return { valid: false, message: 'Promo code is inactive' };
  }

  const now = new Date();
  if (promo.validFrom > now || promo.validTo < now) {
    return { valid: false, message: 'Promo code has expired' };
  }

  if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
    return { valid: false, message: 'Promo code usage limit reached' };
  }

  if (orderData.itemsTotal < promo.minOrderValue) {
    return {
      valid: false,
      message: `Minimum order value of ₹${promo.minOrderValue} required`,
    };
  }

  // Check day of week
  if (promo.daysOfWeek && promo.daysOfWeek.length > 0) {
    const currentDay = now.getDay();
    if (!promo.daysOfWeek.includes(currentDay)) {
      return { valid: false, message: 'Promo code not valid on this day' };
    }
  }

  // Check user eligibility
  if (promo.applicableTo === 'specific-users') {
    if (!promo.eligibleUsers.includes(userId)) {
      return { valid: false, message: 'You are not eligible for this promo code' };
    }
  }

  return { valid: true, promo };
};

// Instance method to calculate discount
promoCodeSchema.methods.calculateDiscount = function (orderTotal) {
  let discount = 0;

  if (this.discountType === 'percentage') {
    discount = (orderTotal * this.discountValue) / 100;
    if (this.maxDiscount) {
      discount = Math.min(discount, this.maxDiscount);
    }
  } else if (this.discountType === 'fixed') {
    discount = this.discountValue;
  }

  return Math.min(discount, orderTotal);
};

// Instance method to increment usage
promoCodeSchema.methods.incrementUsage = async function (orderTotal, discountAmount) {
  this.usageCount += 1;
  this.stats.totalUses += 1;
  this.stats.totalDiscount += discountAmount;
  this.stats.totalRevenue += orderTotal;
  await this.save();
};

module.exports = mongoose.model('PromoCode', promoCodeSchema);
