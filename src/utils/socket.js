const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('./logger');

let io;

/**
 * Initialize Socket.IO
 * @param {http.Server} server - HTTP server instance
 */
const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL?.split(',') || ['http://localhost:5173'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (user.isBlocked) {
        return next(new Error('Authentication error: User is blocked'));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.user.name})`);

    // Join user-specific room
    socket.join(`user:${socket.user._id}`);

    // Join role-specific room
    socket.join(`role:${socket.user.role}`);

    // Handle customer events
    if (socket.user.role === 'customer') {
      handleCustomerEvents(socket);
    }

    // Handle delivery partner events
    if (socket.user.role === 'delivery') {
      handleDeliveryPartnerEvents(socket);
    }

    // Handle admin events
    if (socket.user.role === 'admin') {
      handleAdminEvents(socket);
    }

    // Common events
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id} (User: ${socket.user.name})`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('Socket.IO initialized');
  return io;
};

/**
 * Handle customer-specific socket events
 */
const handleCustomerEvents = (socket) => {
  // Join order-specific room when tracking an order
  socket.on('track:order', (orderId) => {
    socket.join(`order:${orderId}`);
    logger.info(`Customer ${socket.user._id} tracking order ${orderId}`);
  });

  // Stop tracking order
  socket.on('untrack:order', (orderId) => {
    socket.leave(`order:${orderId}`);
    logger.info(`Customer ${socket.user._id} stopped tracking order ${orderId}`);
  });
};

/**
 * Handle delivery partner-specific socket events
 */
const handleDeliveryPartnerEvents = (socket) => {
  // Update delivery partner location
  socket.on('delivery:location', async (data) => {
    const { latitude, longitude, orderId } = data;

    try {
      // Update user location in database
      await User.findByIdAndUpdate(socket.user._id, {
        'deliveryPartnerData.currentLocation': {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      });

      // Emit location update to order room
      if (orderId) {
        io.to(`order:${orderId}`).emit('order:location-update', {
          orderId,
          location: { latitude, longitude },
          deliveryPartner: {
            id: socket.user._id,
            name: socket.user.name,
          },
          timestamp: new Date(),
        });
      }

      logger.debug(`Delivery partner ${socket.user._id} location updated`);
    } catch (error) {
      logger.error('Error updating delivery location:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  });

  // Join order room when accepting delivery
  socket.on('delivery:accept', (orderId) => {
    socket.join(`order:${orderId}`);
    logger.info(`Delivery partner ${socket.user._id} accepted order ${orderId}`);
  });

  // Update delivery status
  socket.on('delivery:status', (data) => {
    const { orderId, status, message } = data;
    
    io.to(`order:${orderId}`).emit('order:delivery-status', {
      orderId,
      status,
      message,
      timestamp: new Date(),
    });
  });
};

/**
 * Handle admin-specific socket events
 */
const handleAdminEvents = (socket) => {
  // Join admin dashboard room
  socket.join('admin:dashboard');

  // Request real-time statistics
  socket.on('admin:request-stats', () => {
    // Stats will be sent via emitAdminStats function
    logger.info(`Admin ${socket.user._id} requested stats`);
  });
};

/**
 * Emit order status update
 * @param {string} orderId - Order ID
 * @param {Object} data - Order update data
 */
const emitOrderUpdate = (orderId, data) => {
  if (!io) return;
  
  io.to(`order:${orderId}`).emit('order:status-update', {
    orderId,
    ...data,
    timestamp: new Date(),
  });

  // Also notify admins
  io.to('role:admin').emit('order:update', {
    orderId,
    ...data,
    timestamp: new Date(),
  });

  logger.info(`Order update emitted for order ${orderId}:`, data.status);
};

/**
 * Emit notification to specific user
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 */
const emitUserNotification = (userId, notification) => {
  if (!io) return;
  
  io.to(`user:${userId}`).emit('notification', {
    ...notification,
    timestamp: new Date(),
  });

  logger.info(`Notification sent to user ${userId}`);
};

/**
 * Emit notification to all users with specific role
 * @param {string} role - User role (customer, delivery, admin)
 * @param {Object} notification - Notification data
 */
const emitRoleNotification = (role, notification) => {
  if (!io) return;
  
  io.to(`role:${role}`).emit('notification', {
    ...notification,
    timestamp: new Date(),
  });

  logger.info(`Notification sent to role ${role}`);
};

/**
 * Emit real-time statistics to admin dashboard
 * @param {Object} stats - Statistics data
 */
const emitAdminStats = (stats) => {
  if (!io) return;
  
  io.to('admin:dashboard').emit('admin:stats', {
    ...stats,
    timestamp: new Date(),
  });
};

/**
 * Emit new order notification to admins
 */
const emitNewOrder = (order) => {
  if (!io) return;
  
  // Notify all admins about new order
  io.to('role:admin').emit('order:new', {
    _id: order._id,
    orderNumber: order.orderNumber,
    customer: order.customer,
    items: order.items,
    pricing: order.pricing,
    deliveryAddress: order.deliveryAddress,
    status: order.status,
    createdAt: order.createdAt,
    timestamp: new Date(),
  });

  logger.info(`New order notification emitted for order ${order.orderNumber}`);
};

/**
 * Get Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  emitOrderUpdate,
  emitNewOrder,
  emitUserNotification,
  emitRoleNotification,
  emitAdminStats,
  getIO,
};
