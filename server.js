require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { connectDB, closeDB } = require('./src/config/database');
const { initializeSocket } = require('./src/utils/socket');
const { createIndexes } = require('./src/utils/indexManager');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Track if shutdown is in progress
let isShuttingDown = false;

// Connect to database
connectDB().then(() => {
  createIndexes().catch((err) => {
    logger.warn('Failed to create indexes:', err.message);
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`📍 Health check available at http://localhost:${PORT}/health`);
  logger.info(`🔗 API endpoint: http://localhost:${PORT}/api/v1`);
  logger.info(`⚡ WebSocket server initialized`);
});

/**
 * Graceful shutdown function
 */
const gracefulShutdown = (signal) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  logger.info(`\n${signal} signal received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('✅ HTTP server closed');

    // Close database connection
    closeDB().then(() => {
      logger.info('👋 Graceful shutdown completed');
      process.exit(0);
    });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  // Don't shutdown for Redis errors
  if (err.message && (err.message.includes('Redis') || err.message.includes('ECONNREFUSED') || err.code === 'ECONNREFUSED')) {
    logger.warn('⚠️  Redis exception (non-fatal) - continuing without cache');
    return;
  }
  
  logger.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(`Error: ${err.name} - ${err.message}`);
  logger.error(err.stack);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  // Don't shutdown for Redis connection errors
  if (err.message && (err.message.includes('Redis') || err.message.includes('ECONNREFUSED'))) {
    logger.warn('⚠️  Redis connection error (non-fatal) - continuing without cache');
    return;
  }
  
  logger.error('💥 UNHANDLED REJECTION! Shutting down...');
  logger.error(`Error: ${err.name} - ${err.message}`);
  if (err.stack) {
    logger.error(err.stack);
  }
  gracefulShutdown('unhandledRejection');
});

module.exports = server;
