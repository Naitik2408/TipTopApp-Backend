# TipTop Backend Architecture & Strategy

## 📋 Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Database Schema Design](#database-schema-design)
3. [API Architecture](#api-architecture)
4. [Caching Strategy](#caching-strategy)
5. [Error Handling](#error-handling)
6. [Performance Optimization](#performance-optimization)
7. [Real-time Communication](#real-time-communication)
8. [Security Strategy](#security-strategy)
9. [Frontend Integration](#frontend-integration)
10. [Deployment Strategy](#deployment-strategy)

---

## 1. System Architecture Overview

### Technology Stack
```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATIONS                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ React Web    │  │ React Native │  │ Admin Panel  │     │
│  │ (Customer)   │  │   (Mobile)   │  │   (Web)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   NGINX/CDN    │
                    │  Load Balancer │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌──────▼──────┐
│   Node.js      │  │   Node.js      │  │  Socket.io  │
│   Server 1     │  │   Server 2     │  │   Server    │
│   (REST API)   │  │   (REST API)   │  │  (Real-time)│
└───────┬────────┘  └───────┬────────┘  └──────┬──────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌──────▼──────┐
│   Redis        │  │   MongoDB      │  │   AWS S3    │
│   Cache        │  │   Primary DB   │  │   Images    │
│   + Sessions   │  │   + Replicas   │  │   Storage   │
└────────────────┘  └────────────────┘  └─────────────┘
```

### Core Technologies
- **Backend Framework**: Express.js (Node.js)
- **Database**: MongoDB (with Mongoose ODM)
- **Caching**: Redis (In-memory cache)
- **Real-time**: Socket.io (WebSocket communication)
- **Authentication**: JWT (JSON Web Tokens)
- **Image Storage**: AWS S3 / Cloudinary
- **Process Manager**: PM2 (Auto-restart, clustering)
- **API Documentation**: Swagger/OpenAPI

---

## 2. Database Schema Design

### 2.1 Core Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  role: String, // 'customer', 'delivery', 'admin'
  email: String, // unique, indexed
  phone: String, // unique, indexed
  password: String, // hashed with bcrypt
  profile: {
    firstName: String,
    lastName: String,
    avatar: String, // S3 URL
    dateOfBirth: Date
  },
  addresses: [{
    type: String, // 'home', 'work', 'other'
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      type: { type: String, default: 'Point' },
      coordinates: [Number] // [longitude, latitude]
    },
    isDefault: Boolean
  }],
  // Customer specific
  loyaltyPoints: Number,
  totalOrders: Number,
  totalSpent: Number,
  
  // Delivery partner specific
  vehicleInfo: {
    type: String,
    number: String,
    document: String
  },
  availability: Boolean,
  currentLocation: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  rating: Number,
  totalDeliveries: Number,
  
  isActive: Boolean,
  isEmailVerified: Boolean,
  isPhoneVerified: Boolean,
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}

// Indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ phone: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ "addresses.coordinates": "2dsphere" })
db.users.createIndex({ "currentLocation.coordinates": "2dsphere" })
```

#### Menu Items Collection
```javascript
{
  _id: ObjectId,
  name: String, // indexed for text search
  slug: String, // unique, indexed
  description: String,
  image: String, // S3 URL
  images: [String], // Multiple images
  price: Number,
  originalPrice: Number, // for discounts
  
  category: {
    main: String, // 'Biryani', 'Tandoori', 'Chinese'
    sub: [String] // ['Vegetarian', 'Non-Vegetarian']
  },
  
  plateQuantity: String, // 'Half', 'Full'
  
  ingredients: [String],
  allergens: [String],
  
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  
  isAvailable: Boolean,
  isVegetarian: Boolean,
  isVegan: Boolean,
  isGlutenFree: Boolean,
  spiceLevel: Number, // 0-5
  
  prepTime: Number, // minutes
  servingSize: String,
  
  rating: Number,
  reviewCount: Number,
  
  // Ordering stats
  totalOrders: Number,
  revenue: Number,
  
  tags: [String], // ['popular', 'new', 'bestseller']
  
  customizations: [{
    name: String, // 'Spice Level', 'Add-ons'
    options: [{
      label: String,
      price: Number
    }],
    required: Boolean
  }],
  
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.menuItems.createIndex({ name: "text", description: "text" })
db.menuItems.createIndex({ slug: 1 }, { unique: true })
db.menuItems.createIndex({ "category.main": 1, isAvailable: 1 })
db.menuItems.createIndex({ isAvailable: 1, rating: -1 })
db.menuItems.createIndex({ totalOrders: -1 }) // Popular items
db.menuItems.createIndex({ createdAt: -1 }) // New items
```

#### Orders Collection
```javascript
{
  _id: ObjectId,
  orderNumber: String, // unique, indexed (ORD_2024_12345)
  
  customer: {
    id: ObjectId, // ref: Users
    name: String,
    phone: String,
    email: String
  },
  
  items: [{
    menuItem: ObjectId, // ref: MenuItems
    name: String, // snapshot at order time
    image: String,
    price: Number,
    quantity: Number,
    customizations: [{
      name: String,
      options: [String],
      additionalPrice: Number
    }],
    subtotal: Number
  }],
  
  pricing: {
    itemsTotal: Number,
    deliveryFee: Number,
    tax: Number,
    discount: Number,
    promoCode: String,
    finalAmount: Number
  },
  
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      type: { type: String, default: 'Point' },
      coordinates: [Number]
    },
    instructions: String
  },
  
  deliveryPartner: {
    id: ObjectId, // ref: Users
    name: String,
    phone: String,
    vehicleNumber: String
  },
  
  status: String, // 'pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'
  statusHistory: [{
    status: String,
    timestamp: Date,
    updatedBy: String,
    notes: String
  }],
  
  paymentMethod: String, // 'COD', 'ONLINE', 'CARD'
  paymentStatus: String, // 'pending', 'paid', 'failed', 'refunded'
  paymentDetails: {
    transactionId: String,
    gateway: String,
    timestamp: Date
  },
  
  // COD specific
  cashCollection: {
    expected: Number,
    collected: Number,
    collectedAt: Date,
    isSettled: Boolean
  },
  
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  
  rating: {
    food: Number,
    delivery: Number,
    overall: Number,
    review: String,
    createdAt: Date
  },
  
  cancellation: {
    reason: String,
    cancelledBy: String, // 'customer', 'admin', 'system'
    refundAmount: Number,
    timestamp: Date
  },
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.orders.createIndex({ orderNumber: 1 }, { unique: true })
db.orders.createIndex({ "customer.id": 1, createdAt: -1 })
db.orders.createIndex({ "deliveryPartner.id": 1, status: 1 })
db.orders.createIndex({ status: 1, createdAt: -1 })
db.orders.createIndex({ paymentMethod: 1, paymentStatus: 1 })
db.orders.createIndex({ createdAt: -1 }) // Recent orders
db.orders.createIndex({ "deliveryAddress.coordinates": "2dsphere" })
```

#### Delivery Sessions Collection
```javascript
{
  _id: ObjectId,
  deliveryPartner: ObjectId, // ref: Users
  date: Date,
  
  startTime: Date,
  endTime: Date,
  
  changeFund: Number,
  
  cashOrders: [{
    orderId: ObjectId,
    orderNumber: String,
    amount: Number,
    collectedAt: Date,
    status: String // 'collected', 'pending'
  }],
  
  totalExpected: Number,
  totalCollected: Number,
  
  settlement: {
    isSettled: Boolean,
    settledAt: Date,
    settledBy: ObjectId, // admin user
    actualAmount: Number,
    discrepancy: Number,
    notes: String
  },
  
  stats: {
    totalDeliveries: Number,
    successfulDeliveries: Number,
    cancelledDeliveries: Number,
    totalDistance: Number, // km
    averageDeliveryTime: Number // minutes
  },
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.deliverySessions.createIndex({ deliveryPartner: 1, date: -1 })
db.deliverySessions.createIndex({ "settlement.isSettled": 1 })
db.deliverySessions.createIndex({ date: -1 })
```

#### Notifications Collection
```javascript
{
  _id: ObjectId,
  recipient: ObjectId, // ref: Users
  type: String, // 'order_update', 'promotion', 'delivery_assigned', 'payment_received'
  
  title: String,
  message: String,
  data: Mixed, // Additional data as JSON
  
  priority: String, // 'low', 'medium', 'high', 'urgent'
  
  channels: {
    push: Boolean,
    sms: Boolean,
    email: Boolean
  },
  
  isRead: Boolean,
  readAt: Date,
  
  deliveryStatus: {
    push: String, // 'sent', 'failed', 'pending'
    sms: String,
    email: String
  },
  
  relatedOrder: ObjectId,
  
  expiresAt: Date,
  createdAt: Date
}

// Indexes
db.notifications.createIndex({ recipient: 1, isRead: 1, createdAt: -1 })
db.notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.notifications.createIndex({ createdAt: -1 })
```

#### Analytics Collection (Time-series data)
```javascript
{
  _id: ObjectId,
  date: Date, // truncated to day/hour
  type: String, // 'daily', 'hourly'
  
  orders: {
    total: Number,
    completed: Number,
    cancelled: Number,
    averageValue: Number
  },
  
  revenue: {
    total: Number,
    online: Number,
    cod: Number,
    discounts: Number
  },
  
  customers: {
    new: Number,
    returning: Number,
    active: Number
  },
  
  topItems: [{
    itemId: ObjectId,
    name: String,
    orders: Number,
    revenue: Number
  }],
  
  delivery: {
    averageTime: Number,
    activePartners: Number,
    totalDeliveries: Number
  },
  
  createdAt: Date
}

// Indexes
db.analytics.createIndex({ date: -1, type: 1 })
db.analytics.createIndex({ type: 1, date: -1 })
```

---

## 3. API Architecture

### 3.1 RESTful API Structure

```
/api/v1
├── /auth
│   ├── POST   /register
│   ├── POST   /login
│   ├── POST   /refresh-token
│   ├── POST   /logout
│   ├── POST   /forgot-password
│   └── POST   /reset-password
│
├── /users
│   ├── GET    /me
│   ├── PUT    /me
│   ├── POST   /me/addresses
│   ├── PUT    /me/addresses/:id
│   └── DELETE /me/addresses/:id
│
├── /menu
│   ├── GET    /items (with pagination, filters, search)
│   ├── GET    /items/:id
│   ├── GET    /categories
│   ├── GET    /popular
│   └── GET    /search
│
├── /orders
│   ├── POST   / (create order)
│   ├── GET    / (list my orders)
│   ├── GET    /:id
│   ├── PUT    /:id/cancel
│   ├── POST   /:id/rating
│   └── GET    /track/:orderNumber
│
├── /delivery
│   ├── GET    /active (active orders for delivery partner)
│   ├── PUT    /orders/:id/accept
│   ├── PUT    /orders/:id/status
│   ├── POST   /location (update location)
│   ├── GET    /sessions/current
│   └── POST   /sessions/settlement
│
├── /admin
│   ├── /orders
│   │   ├── GET    / (all orders with filters)
│   │   ├── PUT    /:id
│   │   ├── PUT    /:id/assign-delivery
│   │   └── GET    /stats
│   │
│   ├── /menu
│   │   ├── POST   /items
│   │   ├── PUT    /items/:id
│   │   ├── DELETE /items/:id
│   │   └── PATCH  /items/:id/availability
│   │
│   ├── /customers
│   │   ├── GET    /
│   │   ├── GET    /:id
│   │   └── GET    /stats
│   │
│   ├── /delivery-partners
│   │   ├── GET    /
│   │   ├── POST   /
│   │   ├── PUT    /:id
│   │   └── GET    /stats
│   │
│   ├── /cash-management
│   │   ├── GET    /sessions
│   │   ├── POST   /sessions/settle
│   │   └── GET    /transactions
│   │
│   └── /analytics
│       ├── GET    /dashboard
│       ├── GET    /revenue
│       ├── GET    /popular-items
│       └── GET    /export
│
└── /notifications
    ├── GET    / (my notifications)
    ├── PUT    /:id/read
    └── DELETE /:id
```

### 3.2 API Response Format

#### Success Response
```javascript
{
  success: true,
  data: {
    // Response data
  },
  meta: {
    pagination: {
      page: 1,
      limit: 20,
      total: 150,
      pages: 8
    },
    cached: false,
    timestamp: "2024-12-05T10:30:00Z"
  }
}
```

#### Error Response
```javascript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input data",
    details: [
      {
        field: "email",
        message: "Invalid email format"
      }
    ],
    timestamp: "2024-12-05T10:30:00Z",
    requestId: "req_123abc"
  }
}
```

---

## 4. Caching Strategy

### 4.1 Redis Cache Layers

```javascript
// Cache Key Patterns
const CACHE_KEYS = {
  // Menu caching (TTL: 1 hour)
  MENU_ALL: 'menu:all',
  MENU_ITEM: (id) => `menu:item:${id}`,
  MENU_CATEGORY: (cat) => `menu:category:${cat}`,
  MENU_POPULAR: 'menu:popular',
  MENU_SEARCH: (query) => `menu:search:${query}`,
  
  // User caching (TTL: 15 minutes)
  USER: (id) => `user:${id}`,
  USER_ADDRESSES: (id) => `user:${id}:addresses`,
  
  // Order caching (TTL: 5 minutes)
  ORDER: (id) => `order:${id}`,
  USER_ORDERS: (userId) => `orders:user:${userId}`,
  ACTIVE_ORDERS: 'orders:active',
  
  // Analytics caching (TTL: 30 minutes)
  ANALYTICS_DASHBOARD: 'analytics:dashboard',
  ANALYTICS_REVENUE: (period) => `analytics:revenue:${period}`,
  
  // Session caching
  SESSION: (token) => `session:${token}`,
  
  // Rate limiting
  RATE_LIMIT: (ip, endpoint) => `rate:${ip}:${endpoint}`
}

// Cache TTL (Time To Live)
const CACHE_TTL = {
  MENU: 3600,        // 1 hour
  USER: 900,         // 15 minutes
  ORDER: 300,        // 5 minutes
  ANALYTICS: 1800,   // 30 minutes
  SESSION: 86400,    // 24 hours
  SEARCH: 600        // 10 minutes
}
```

### 4.2 Cache Implementation Pattern

```javascript
// Generic cache wrapper
async function cacheWrapper(key, ttl, fetchFunction) {
  try {
    // Try to get from cache
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fetch from database
    const data = await fetchFunction();
    
    // Store in cache
    await redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  } catch (error) {
    // If cache fails, still return data from DB
    logger.error('Cache error:', error);
    return await fetchFunction();
  }
}

// Example usage
async function getMenuItem(itemId) {
  return await cacheWrapper(
    CACHE_KEYS.MENU_ITEM(itemId),
    CACHE_TTL.MENU,
    () => MenuItem.findById(itemId)
  );
}
```

### 4.3 Cache Invalidation Strategy

```javascript
// Invalidate cache on updates
const cacheInvalidation = {
  // When menu item is updated
  onMenuUpdate: async (itemId) => {
    await redis.del(
      CACHE_KEYS.MENU_ALL,
      CACHE_KEYS.MENU_ITEM(itemId),
      CACHE_KEYS.MENU_POPULAR
    );
    // Invalidate category cache
    const item = await MenuItem.findById(itemId);
    await redis.del(CACHE_KEYS.MENU_CATEGORY(item.category.main));
  },
  
  // When order status changes
  onOrderUpdate: async (orderId, userId) => {
    await redis.del(
      CACHE_KEYS.ORDER(orderId),
      CACHE_KEYS.USER_ORDERS(userId),
      CACHE_KEYS.ACTIVE_ORDERS
    );
  },
  
  // Batch invalidation
  invalidatePattern: async (pattern) => {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
```

---

## 5. Error Handling

### 5.1 Custom Error Classes

```javascript
// Base error class
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message) {
    super(`${service} service error: ${message}`, 503, 'SERVICE_ERROR');
  }
}
```

### 5.2 Global Error Handler

```javascript
// Error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: `${field} already exists`,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Operational errors (known errors)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Unknown errors (programming errors)
  // Don't leak error details to client
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      requestId: req.id
    }
  });
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

### 5.3 Process-level Error Handling

```javascript
// Uncaught exception handler
process.on('uncaughtException', (err) => {
  logger.fatal('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
  process.exit(1);
});

// Unhandled rejection handler
process.on('unhandledRejection', (err) => {
  logger.fatal('UNHANDLED REJECTION! 💥 Shutting down...', err);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});
```

---

## 6. Performance Optimization

### 6.1 Database Query Optimization

```javascript
// ❌ BAD - N+1 Query Problem
async function getOrdersWithItems() {
  const orders = await Order.find();
  for (let order of orders) {
    order.items = await MenuItem.find({ _id: { $in: order.itemIds } });
  }
  return orders;
}

// ✅ GOOD - Use populate with select
async function getOrdersWithItems() {
  return await Order.find()
    .populate({
      path: 'items.menuItem',
      select: 'name image price'
    })
    .lean() // Return plain JS objects (faster)
    .limit(20);
}

// ✅ BETTER - Use aggregation for complex queries
async function getOrderStats() {
  return await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$pricing.finalAmount" },
        avgOrderValue: { $avg: "$pricing.finalAmount" }
      }
    },
    { $sort: { _id: -1 } }
  ]);
}
```

### 6.2 Pagination Strategy

```javascript
// Cursor-based pagination (better for real-time data)
async function getMenuItemsCursor(cursor, limit = 20) {
  const query = cursor 
    ? { _id: { $lt: cursor } } 
    : {};
  
  const items = await MenuItem
    .find(query)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();
  
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, -1) : items;
  
  return {
    data,
    nextCursor: hasMore ? data[data.length - 1]._id : null,
    hasMore
  };
}

// Offset-based pagination (for admin panels)
async function getMenuItemsPage(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const [items, total] = await Promise.all([
    MenuItem.find().skip(skip).limit(limit).lean(),
    MenuItem.countDocuments()
  ]);
  
  return {
    data: items,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}
```

### 6.3 Data Projection

```javascript
// Only fetch required fields
async function getMenuList() {
  return await MenuItem.find()
    .select('name image price rating isAvailable category.main')
    .lean();
}

// Use projection in aggregation
async function getOrderSummary(orderId) {
  return await Order.findById(orderId)
    .select('orderNumber status pricing.finalAmount estimatedDeliveryTime')
    .populate('customer.id', 'profile.firstName phone')
    .lean();
}
```

---

## 7. Real-time Communication (Socket.io)

### 7.1 Socket Events Structure

```javascript
// Server-side events
const SOCKET_EVENTS = {
  // Connection
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Order updates (to customer)
  ORDER_STATUS_UPDATED: 'order:status:updated',
  ORDER_ASSIGNED: 'order:assigned',
  DELIVERY_LOCATION: 'delivery:location',
  
  // Delivery partner events
  NEW_ORDER_AVAILABLE: 'delivery:new-order',
  ORDER_CANCELLED: 'delivery:order-cancelled',
  
  // Admin events
  NEW_ORDER_CREATED: 'admin:new-order',
  DELIVERY_PARTNER_ONLINE: 'admin:delivery-online',
  DELIVERY_PARTNER_OFFLINE: 'admin:delivery-offline',
  
  // Chat
  MESSAGE_SENT: 'chat:message',
  MESSAGE_RECEIVED: 'chat:received',
  TYPING: 'chat:typing'
};
```

### 7.2 Socket.io Implementation

```javascript
// socket/index.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const redis = require('../config/redis');

function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true
    },
    pingTimeout: 60000
  });
  
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.role = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Join user-specific room
    socket.join(`user:${socket.userId}`);
    
    // Join role-specific room
    if (socket.role === 'admin') {
      socket.join('admin');
    } else if (socket.role === 'delivery') {
      socket.join('delivery');
      // Store delivery partner's socket ID in Redis
      redis.set(`delivery:socket:${socket.userId}`, socket.id, 'EX', 3600);
    }
    
    // Handle location updates (delivery partners)
    socket.on('location:update', async (data) => {
      if (socket.role !== 'delivery') return;
      
      await updateDeliveryLocation(socket.userId, data);
      
      // Broadcast to customers tracking this delivery partner
      const orders = await getActiveOrdersForDelivery(socket.userId);
      orders.forEach(order => {
        io.to(`user:${order.customerId}`).emit('delivery:location', {
          orderId: order._id,
          location: data
        });
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);
      if (socket.role === 'delivery') {
        await redis.del(`delivery:socket:${socket.userId}`);
      }
    });
  });
  
  return io;
}

// Helper function to emit to specific user
async function emitToUser(userId, event, data) {
  const io = global.io;
  io.to(`user:${userId}`).emit(event, data);
}

// Helper function to emit to all delivery partners
async function emitToDeliveryPartners(event, data) {
  const io = global.io;
  io.to('delivery').emit(event, data);
}

// Helper function to emit to all admins
async function emitToAdmins(event, data) {
  const io = global.io;
  io.to('admin').emit(event, data);
}

module.exports = { initializeSocket, emitToUser, emitToDeliveryPartners, emitToAdmins };
```

---

## 8. Security Strategy

### 8.1 Authentication & Authorization

```javascript
// JWT token structure
{
  userId: ObjectId,
  email: String,
  role: String,
  iat: Number,
  exp: Number
}

// Middleware for authentication
const authenticate = asyncHandler(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    throw new AuthenticationError('No authentication token provided');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session is valid in Redis
    const session = await redis.get(`session:${token}`);
    if (!session) {
      throw new AuthenticationError('Session expired');
    }
    
    req.user = await User.findById(decoded.userId).select('-password');
    
    if (!req.user || !req.user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }
    
    next();
  } catch (error) {
    throw new AuthenticationError('Invalid authentication token');
  }
});

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AuthorizationError();
    }
    next();
  };
};
```

### 8.2 Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

// General API rate limiter
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate:api:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: 'Too many requests, please try again later'
});

// Auth endpoint limiter (stricter)
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate:auth:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // Max 5 login attempts
  message: 'Too many login attempts, please try again later'
});

// Apply to routes
app.use('/api/', apiLimiter);
app.use('/api/v1/auth/login', authLimiter);
```

### 8.3 Input Validation & Sanitization

```javascript
const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  next();
};

// Example validators
const orderValidators = {
  create: [
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
    body('items.*.menuItem').isMongoId().withMessage('Invalid menu item'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Invalid quantity'),
    body('deliveryAddress.street').trim().notEmpty().withMessage('Street required'),
    body('paymentMethod').isIn(['COD', 'ONLINE']).withMessage('Invalid payment method'),
    validate
  ]
};
```

---

## 9. Frontend Integration

### 9.1 API Service Layer (React/React Native)

```javascript
// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor (add auth token)
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (handle errors)
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken
        });
        
        await AsyncStorage.setItem('authToken', response.data.data.token);
        
        // Retry original request
        error.config.headers.Authorization = `Bearer ${response.data.data.token}`;
        return apiClient.request(error.config);
      } catch (refreshError) {
        // Refresh failed, logout user
        await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
        // Navigate to login
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

export default apiClient;
```

### 9.2 Data Fetching Patterns

```javascript
// Using React Query for optimal data fetching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './api';

// Menu items with caching
export function useMenuItems(category = 'All') {
  return useQuery({
    queryKey: ['menu', category],
    queryFn: async () => {
      const response = await apiClient.get('/menu/items', {
        params: { category }
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false
  });
}

// Order creation with optimistic updates
export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData) => {
      const response = await apiClient.post('/orders', orderData);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate orders list to refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      // Handle error (show toast, etc.)
      console.error('Order creation failed:', error);
    }
  });
}

// Real-time order tracking
export function useOrderTracking(orderNumber) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!orderNumber) return;
    
    // Connect to socket
    const socket = io(process.env.REACT_APP_SOCKET_URL, {
      auth: { token: AsyncStorage.getItem('authToken') }
    });
    
    // Listen for order updates
    socket.on('order:status:updated', (data) => {
      if (data.orderNumber === orderNumber) {
        // Update cache immediately
        queryClient.setQueryData(['order', orderNumber], (old) => ({
          ...old,
          status: data.status,
          statusHistory: data.statusHistory
        }));
      }
    });
    
    return () => socket.disconnect();
  }, [orderNumber, queryClient]);
  
  return useQuery({
    queryKey: ['order', orderNumber],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/track/${orderNumber}`);
      return response.data;
    },
    refetchInterval: 30000 // Fallback: refetch every 30 seconds
  });
}
```

### 9.3 Optimistic UI Updates

```javascript
// Example: Toggle menu item availability
function useToggleAvailability() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ itemId, isAvailable }) => {
      return await apiClient.patch(`/admin/menu/items/${itemId}/availability`, {
        isAvailable
      });
    },
    onMutate: async ({ itemId, isAvailable }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['menu'] });
      
      // Snapshot previous value
      const previousMenu = queryClient.getQueryData(['menu']);
      
      // Optimistically update UI
      queryClient.setQueryData(['menu'], (old) => ({
        ...old,
        data: old.data.map(item => 
          item._id === itemId 
            ? { ...item, isAvailable }
            : item
        )
      }));
      
      return { previousMenu };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['menu'], context.previousMenu);
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    }
  });
}
```

---

## 10. Deployment Strategy

### 10.1 Environment Configuration

```bash
# .env.production
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tiptop?retryWrites=true&w=majority
MONGODB_REPLICA_SET=true

# Redis
REDIS_URL=redis://redis-cluster:6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=24h
REFRESH_TOKEN_EXPIRE=30d

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=tiptop-images

# Socket.io
SOCKET_PORT=5001

# External Services
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

### 10.2 PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'tiptop-api',
      script: './src/server.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'tiptop-socket',
      script: './src/socket-server.js',
      instances: 1, // Single instance for socket
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      }
    }
  ]
};

// Start: pm2 start ecosystem.config.js --env production
// Monitor: pm2 monit
// Logs: pm2 logs
```

### 10.3 Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Expose ports
EXPOSE 5000 5001

# Start with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
      - "5001:5001"
    environment:
      - NODE_ENV=production
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped
    
  mongodb:
    image: mongo:6
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
```

### 10.4 Monitoring & Logging

```javascript
// Winston logger configuration
const winston = require('winston');
const Sentry = require('@sentry/node');

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'tiptop-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
    memory: process.memoryUsage()
  });
});
```

---

## 📊 Performance Benchmarks (Target Goals)

```
API Response Times:
├── Menu List (cached): < 50ms
├── Menu List (uncached): < 200ms
├── Order Creation: < 300ms
├── Order Status Update: < 100ms
└── Search Query: < 150ms

Database Query Times:
├── Simple Find: < 10ms
├── Complex Aggregation: < 100ms
├── Join Operations: < 50ms
└── Bulk Operations: < 500ms

Real-time Events:
├── Socket Connection: < 100ms
├── Event Emission: < 20ms
└── Location Update: < 50ms

System Resources:
├── CPU Usage: < 70%
├── Memory Usage: < 80%
├── Database Connections: < 100 concurrent
└── Socket Connections: 1000+ concurrent
```

---

## 🚀 Next Steps

1. **Phase 1: Core Setup** (Week 1)
   - Initialize Node.js project with Express
   - Setup MongoDB with Mongoose
   - Configure Redis for caching
   - Implement authentication system

2. **Phase 2: Core APIs** (Week 2-3)
   - Build Menu APIs
   - Build Order APIs
   - Build User APIs
   - Implement error handling

3. **Phase 3: Real-time Features** (Week 4)
   - Setup Socket.io
   - Implement real-time order tracking
   - Add delivery partner location updates

4. **Phase 4: Advanced Features** (Week 5)
   - Cash management system
   - Analytics APIs
   - Notification system
   - Admin dashboard APIs

5. **Phase 5: Optimization** (Week 6)
   - Implement comprehensive caching
   - Database query optimization
   - Load testing
   - Security hardening

6. **Phase 6: Deployment** (Week 7)
   - Docker containerization
   - CI/CD pipeline
   - Production deployment
   - Monitoring setup

---

This strategy ensures a **robust, scalable, and maintainable backend** that will never crash and handle thousands of concurrent users efficiently! 🎯
