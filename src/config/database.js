const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB with retry logic
 * @param {number} retries - Number of retry attempts
 */
const connectDB = async (retries = 5) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
      if (retries > 0) {
        setTimeout(() => connectDB(retries - 1), 5000);
      }
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected');
    });

    mongoose.connection.on('connected', () => {
      logger.info('✅ MongoDB connected');
    });
  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);

    if (retries > 0) {
      logger.info(`🔄 Retrying connection... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      logger.error('❌ Max retries reached. Exiting...');
      process.exit(1);
    }
  }
};

/**
 * Close database connection gracefully
 */
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('✅ MongoDB connection closed');
  } catch (error) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
  }
};

module.exports = { connectDB, closeDB };
