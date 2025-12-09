const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Create database indexes for optimal query performance
 * Run this after connecting to MongoDB
 */
const createIndexes = async () => {
  try {
    logger.info('Creating database indexes...');

    // Get models
    const User = mongoose.model('User');
    const MenuItem = mongoose.model('MenuItem');
    const Order = mongoose.model('Order');

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ phoneNumber: 1 }, { unique: true, sparse: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ 'deliveryPartnerData.isAvailable': 1 });
    await User.collection.createIndex({ 'deliveryPartnerData.currentLocation': '2dsphere' });
    await User.collection.createIndex({ isBlocked: 1, isActive: 1 });
    
    // MenuItem indexes
    await MenuItem.collection.createIndex({ name: 1 });
    await MenuItem.collection.createIndex({ slug: 1 }, { unique: true });
    await MenuItem.collection.createIndex({ 'category.main': 1 });
    await MenuItem.collection.createIndex({ 'category.sub': 1 });
    await MenuItem.collection.createIndex({ 'category.tags': 1 });
    await MenuItem.collection.createIndex({ price: 1 });
    await MenuItem.collection.createIndex({ isAvailable: 1 });
    await MenuItem.collection.createIndex({ 'stats.averageRating': -1 });
    await MenuItem.collection.createIndex({ 'stats.orderCount': -1 });
    await MenuItem.collection.createIndex({ name: 'text', description: 'text' });
    
    // Compound indexes for common queries
    await MenuItem.collection.createIndex({ 
      'category.main': 1, 
      isAvailable: 1, 
      'stats.averageRating': -1 
    });
    await MenuItem.collection.createIndex({ 
      isAvailable: 1, 
      'stats.orderCount': -1 
    });

    // Order indexes
    await Order.collection.createIndex({ orderNumber: 1 }, { unique: true });
    await Order.collection.createIndex({ customer: 1, createdAt: -1 });
    await Order.collection.createIndex({ deliveryPartner: 1, status: 1 });
    await Order.collection.createIndex({ status: 1 });
    await Order.collection.createIndex({ paymentMethod: 1 });
    await Order.collection.createIndex({ createdAt: -1 });
    
    // Compound indexes for common order queries
    await Order.collection.createIndex({ 
      customer: 1, 
      status: 1, 
      createdAt: -1 
    });
    await Order.collection.createIndex({ 
      deliveryPartner: 1, 
      status: 1, 
      createdAt: -1 
    });
    await Order.collection.createIndex({ 
      status: 1, 
      createdAt: -1 
    });

    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
    throw error;
  }
};

/**
 * Analyze and log index usage statistics
 */
const analyzeIndexes = async () => {
  try {
    const collections = ['users', 'menuitems', 'orders'];
    
    for (const collectionName of collections) {
      const collection = mongoose.connection.collection(collectionName);
      const indexes = await collection.indexes();
      
      logger.info(`Indexes for ${collectionName}:`, {
        count: indexes.length,
        indexes: indexes.map(idx => ({
          name: idx.name,
          keys: Object.keys(idx.key),
        })),
      });
    }
  } catch (error) {
    logger.error('Error analyzing indexes:', error);
  }
};

module.exports = {
  createIndexes,
  analyzeIndexes,
};
