const mongoose = require('mongoose');

// Review Schema
const reviewSchema = new mongoose.Schema(
  {
    order: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true,
      },
      orderNumber: String,
    },

    customer: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
      name: String,
      avatar: String,
    },

    menuItem: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        index: true,
      },
      name: String,
    },

    // Ratings (1-5)
    ratings: {
      food: {
        type: Number,
        min: 1,
        max: 5,
      },
      taste: {
        type: Number,
        min: 1,
        max: 5,
      },
      quantity: {
        type: Number,
        min: 1,
        max: 5,
      },
      packaging: {
        type: Number,
        min: 1,
        max: 5,
      },
      delivery: {
        type: Number,
        min: 1,
        max: 5,
      },
      overall: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
    },

    // Review Content
    title: String,
    review: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    images: [String],

    // Helpful votes
    helpful: {
      type: Number,
      default: 0,
    },
    notHelpful: {
      type: Number,
      default: 0,
    },

    // Admin response
    response: {
      text: String,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      respondedAt: Date,
    },

    // Moderation
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
reviewSchema.index({ 'order.id': 1 });
reviewSchema.index({ 'customer.id': 1, createdAt: -1 });
reviewSchema.index({ 'menuItem.id': 1, 'ratings.overall': -1 });
reviewSchema.index({ isPublic: 1, createdAt: -1 });

// Virtual for helpfulness score
reviewSchema.virtual('helpfulnessScore').get(function () {
  const total = this.helpful + this.notHelpful;
  if (total === 0) return 0;
  return (this.helpful / total) * 100;
});

// Static method to find public reviews for an item
reviewSchema.statics.findByMenuItem = function (menuItemId, limit = 10) {
  return this.find({
    'menuItem.id': menuItemId,
    isPublic: true,
  })
    .sort({ helpful: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to calculate average rating for menu item
reviewSchema.statics.getAverageRating = async function (menuItemId) {
  const result = await this.aggregate([
    {
      $match: {
        'menuItem.id': mongoose.Types.ObjectId(menuItemId),
        isPublic: true,
      },
    },
    {
      $group: {
        _id: null,
        avgOverall: { $avg: '$ratings.overall' },
        avgFood: { $avg: '$ratings.food' },
        avgTaste: { $avg: '$ratings.taste' },
        avgQuantity: { $avg: '$ratings.quantity' },
        avgPackaging: { $avg: '$ratings.packaging' },
        avgDelivery: { $avg: '$ratings.delivery' },
        count: { $sum: 1 },
      },
    },
  ]);

  return result[0] || null;
};

// Instance method to add admin response
reviewSchema.methods.addResponse = async function (responseText, adminId) {
  this.response = {
    text: responseText,
    respondedBy: adminId,
    respondedAt: new Date(),
  };
  await this.save();
};

// Instance method to mark as helpful
reviewSchema.methods.markHelpful = async function () {
  this.helpful += 1;
  await this.save();
};

// Instance method to mark as not helpful
reviewSchema.methods.markNotHelpful = async function () {
  this.notHelpful += 1;
  await this.save();
};

module.exports = mongoose.model('Review', reviewSchema);
