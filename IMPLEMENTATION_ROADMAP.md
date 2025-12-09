# 🚀 The-Tip-Top Backend Implementation Roadmap

## Overview
A comprehensive phased approach to build a robust, scalable, and production-ready backend system for The-Tip-Top restaurant application.

---

## 📋 Development Phases

### **PHASE 1: Foundation & Project Setup** ⏱️ 2-3 days

#### Goals
- Set up project structure
- Configure development environment
- Establish coding standards
- Initialize version control workflow

#### Tasks

##### 1.1 Project Initialization
```bash
✓ Initialize Node.js project
✓ Set up directory structure
✓ Configure package.json with proper scripts
✓ Set up Git hooks (pre-commit, pre-push)
```

**Directory Structure:**
```
Backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Mongoose models
│   ├── controllers/     # Business logic
│   ├── routes/          # API routes
│   ├── middlewares/     # Custom middlewares
│   ├── services/        # Business services
│   ├── utils/           # Helper functions
│   ├── validators/      # Request validation
│   └── app.js           # Express app
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/             # Utility scripts
├── docs/                # API documentation
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── jest.config.js
└── server.js            # Entry point
```

##### 1.2 Dependencies Installation
```json
{
  "core": [
    "express",
    "mongoose",
    "dotenv"
  ],
  "security": [
    "helmet",
    "cors",
    "express-rate-limit",
    "express-mongo-sanitize",
    "xss-clean"
  ],
  "authentication": [
    "jsonwebtoken",
    "bcryptjs",
    "passport",
    "passport-jwt"
  ],
  "validation": [
    "joi",
    "express-validator"
  ],
  "utilities": [
    "morgan",
    "winston",
    "compression",
    "cookie-parser"
  ],
  "dev": [
    "nodemon",
    "eslint",
    "prettier",
    "jest",
    "supertest"
  ]
}
```

##### 1.3 Environment Configuration
```env
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/tiptop_dev
MONGODB_URI_TEST=mongodb://localhost:27017/tiptop_test

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRE=30d

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Email (placeholder)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# SMS (placeholder)
SMS_API_KEY=
SMS_API_SECRET=

# Payment Gateway (placeholder)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# AWS S3 (placeholder)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# Redis (placeholder)
REDIS_HOST=localhost
REDIS_PORT=6379
```

##### 1.4 Basic Server Setup
**File: `src/app.js`**
```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const morgan = require('morgan');

const app = express();

// Security middlewares
app.use(helmet());
app.use(cors());
app.use(mongoSanitize());
app.use(xss());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
```

**File: `server.js`**
```javascript
require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});
```

#### Deliverables
- ✅ Working server with health check endpoint
- ✅ Environment configuration
- ✅ Logging setup
- ✅ Git repository initialized
- ✅ Documentation started

---

### **PHASE 2: Database Schema & Models** ⏱️ 3-4 days

#### Goals
- Implement MongoDB schemas
- Add validation and business logic
- Create indexes for performance
- Set up data seeding

#### Tasks

##### 2.1 Database Connection
**File: `src/config/database.js`**
```javascript
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

  } catch (error) {
    logger.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

##### 2.2 Create Mongoose Models
Priority order:
1. **User Model** (Foundation)
2. **MenuItem Model** (Core business)
3. **Order Model** (Core business)
4. **DeliverySession Model** (Operations)
5. **Review Model** (Customer feedback)
6. **Notification Model** (Communication)
7. **PromoCode Model** (Marketing)
8. **Analytics Model** (Reporting)

**Example: User Model Structure**
```javascript
// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const addressSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  label: String,
  street: { type: String, required: true },
  apartment: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  landmark: String,
  coordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['customer', 'delivery', 'admin'],
    default: 'customer'
  },
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    avatar: String,
    dateOfBirth: Date
  },
  addresses: [addressSchema],
  // ... other fields per schema
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1, isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

module.exports = mongoose.model('User', userSchema);
```

##### 2.3 Model Features Implementation
For each model:
- ✅ Schema definition with validation
- ✅ Virtual properties
- ✅ Indexes for performance
- ✅ Pre/post hooks
- ✅ Instance methods
- ✅ Static methods
- ✅ Query helpers

##### 2.4 Data Seeding
**File: `scripts/seed.js`**
```javascript
// Seed database with initial data
// - Admin user
// - Sample menu items
// - Categories
// - Demo customers
```

#### Deliverables
- ✅ All 8+ models implemented
- ✅ Proper validation and constraints
- ✅ Indexes created
- ✅ Seed script working
- ✅ Model documentation

---

### **PHASE 3: Authentication & Authorization** ⏱️ 2-3 days

#### Goals
- Implement JWT-based authentication
- Role-based access control (RBAC)
- Secure password handling
- Session management

#### Tasks

##### 3.1 Authentication Middleware
**File: `src/middlewares/auth.js`**
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('User account is deactivated', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new AppError('Invalid token', 401));
  }
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};
```

##### 3.2 Auth Controller
**File: `src/controllers/authController.js`**
```javascript
// Implement:
// - register
// - login
// - logout
// - refreshToken
// - forgotPassword
// - resetPassword
// - verifyEmail
// - verifyPhone
```

##### 3.3 Auth Routes
**File: `src/routes/authRoutes.js`**
```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

module.exports = router;
```

#### Deliverables
- ✅ JWT authentication working
- ✅ Role-based access control
- ✅ Password reset flow
- ✅ Token refresh mechanism
- ✅ Auth endpoints tested

---

### **PHASE 4: Core API Development** ⏱️ 5-7 days

#### Goals
- Build RESTful APIs for all entities
- Implement CRUD operations
- Add filtering, sorting, pagination
- Request validation

#### Tasks

##### 4.1 API Structure
Follow RESTful conventions:
```
GET    /api/v1/menu-items           # List all (with filters)
GET    /api/v1/menu-items/:id       # Get single
POST   /api/v1/menu-items           # Create (admin)
PATCH  /api/v1/menu-items/:id       # Update (admin)
DELETE /api/v1/menu-items/:id       # Delete (admin)
```

##### 4.2 Controllers (Priority Order)

**1. Menu Controller** (`src/controllers/menuController.js`)
```javascript
exports.getAllMenuItems = catchAsync(async (req, res, next) => {
  // Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

  let query = MenuItem.find(JSON.parse(queryStr));

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  const menuItems = await query;
  const total = await MenuItem.countDocuments(JSON.parse(queryStr));

  res.status(200).json({
    success: true,
    results: menuItems.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: menuItems
  });
});
```

**2. Order Controller** (`src/controllers/orderController.js`)
- Create order
- Get orders (with filters)
- Update order status
- Cancel order
- Rate order
- Get order statistics

**3. User Controller** (`src/controllers/userController.js`)
- Get profile
- Update profile
- Manage addresses
- Get order history
- Update preferences

**4. Delivery Controller** (`src/controllers/deliveryController.js`)
- Get assigned deliveries
- Update delivery status
- Start/end session
- Cash collection tracking

**5. Admin Controller** (`src/controllers/adminController.js`)
- Dashboard statistics
- Manage users
- Manage menu
- View all orders
- Settlement management

##### 4.3 Request Validation
**File: `src/validators/orderValidator.js`**
```javascript
const Joi = require('joi');

exports.createOrderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      menuItemId: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
      customizations: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          options: Joi.array().items(Joi.string()),
          additionalPrice: Joi.number().min(0)
        })
      )
    })
  ).min(1).required(),
  deliveryAddressId: Joi.string().required(),
  paymentMethod: Joi.string().valid('ONLINE', 'COD').required(),
  specialInstructions: Joi.string().max(500),
  promoCode: Joi.string()
});

exports.validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({ success: false, errors });
    }
    next();
  };
};
```

##### 4.4 Service Layer (Business Logic)
**File: `src/services/orderService.js`**
```javascript
class OrderService {
  async createOrder(orderData, userId) {
    // 1. Validate menu items availability
    // 2. Calculate pricing
    // 3. Apply promo code if provided
    // 4. Create order
    // 5. Update inventory
    // 6. Send notifications
    // 7. Return order
  }

  async calculatePricing(items, promoCode = null) {
    // Calculate itemsTotal, fees, discounts, final amount
  }

  async assignDeliveryPartner(orderId) {
    // Find available delivery partner
    // Assign order
    // Send notification
  }
}

module.exports = new OrderService();
```

##### 4.5 Routes Setup
**File: `src/routes/index.js`**
```javascript
const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/menu-items', require('./menuRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/delivery', require('./deliveryRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/reviews', require('./reviewRoutes'));
router.use('/promo-codes', require('./promoCodeRoutes'));

module.exports = router;
```

**Update `src/app.js`:**
```javascript
// Mount routes
app.use('/api/v1', require('./routes'));

// 404 handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});
```

#### Deliverables
- ✅ All controllers implemented
- ✅ All routes configured
- ✅ Request validation working
- ✅ Service layer for business logic
- ✅ Proper error responses

---

### **PHASE 5: Error Handling & Validation** ⏱️ 2 days

#### Goals
- Centralized error handling
- Consistent error responses
- Request validation
- Input sanitization

#### Tasks

##### 5.1 Custom Error Class
**File: `src/utils/AppError.js`**
```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

##### 5.2 Global Error Handler
**File: `src/middlewares/errorHandler.js`**
```javascript
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const field = Object.keys(err.keyValue)[0];
  const message = `${field} already exists. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => 
  new AppError('Invalid token. Please log in again', 401);

const handleJWTExpiredError = () => 
  new AppError('Your token has expired. Please log in again', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message
    });
  } else {
    // Programming or unknown error: don't leak details
    logger.error('ERROR 💥', err);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
```

##### 5.3 Async Error Wrapper
**File: `src/utils/catchAsync.js`**
```javascript
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
```

##### 5.4 Logger Setup
**File: `src/utils/logger.js`**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
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

module.exports = logger;
```

#### Deliverables
- ✅ Centralized error handling
- ✅ Proper error logging
- ✅ Consistent error responses
- ✅ Input validation middleware

---

### **PHASE 6: Testing** ⏱️ 3-4 days

#### Goals
- Unit tests for critical functions
- Integration tests for APIs
- Test coverage > 70%
- Automated testing setup

#### Tasks

##### 6.1 Test Setup
**File: `jest.config.js`**
```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!server.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

##### 6.2 Test Categories

**Unit Tests** (`tests/unit/`)
- Model methods
- Utility functions
- Service layer logic
- Validation schemas

**Integration Tests** (`tests/integration/`)
- API endpoints
- Database operations
- Authentication flow
- Order creation flow

**Example: Menu API Tests**
```javascript
// tests/integration/menu.test.js
const request = require('supertest');
const app = require('../../src/app');
const MenuItem = require('../../src/models/MenuItem');
const { connectDB, closeDB, clearDB } = require('../helpers/db');

describe('Menu API', () => {
  beforeAll(async () => await connectDB());
  afterAll(async () => await closeDB());
  afterEach(async () => await clearDB());

  describe('GET /api/v1/menu-items', () => {
    it('should return all menu items', async () => {
      // Create test data
      await MenuItem.create([
        { name: 'Item 1', price: 100, category: { main: 'Test' } },
        { name: 'Item 2', price: 200, category: { main: 'Test' } }
      ]);

      const res = await request(app).get('/api/v1/menu-items');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    it('should filter by category', async () => {
      // Test filtering logic
    });

    it('should paginate results', async () => {
      // Test pagination
    });
  });
});
```

##### 6.3 Testing Scripts
```json
{
  "scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration"
  }
}
```

#### Deliverables
- ✅ Test suite implemented
- ✅ Coverage > 70%
- ✅ CI/CD integration ready
- ✅ Test documentation

---

### **PHASE 7: Performance & Optimization** ⏱️ 2-3 days

#### Goals
- Implement caching with Redis
- Database query optimization
- Response compression
- Rate limiting

#### Tasks

##### 7.1 Redis Caching
**File: `src/config/redis.js`**
```javascript
const redis = require('redis');
const logger = require('../utils/logger');

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

client.on('connect', () => {
  logger.info('Redis connected');
});

client.on('error', (err) => {
  logger.error('Redis error:', err);
});

module.exports = client;
```

**File: `src/middlewares/cache.js`**
```javascript
const redis = require('../config/redis');

exports.cacheResponse = (duration) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = `cache:${req.originalUrl}`;

    try {
      const cachedResponse = await redis.get(key);
      
      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      }

      // Store original send function
      const originalSend = res.json;

      res.json = function(data) {
        // Cache the response
        redis.setex(key, duration, JSON.stringify(data));
        // Send original response
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      next();
    }
  };
};

exports.clearCache = (pattern) => {
  return async (req, res, next) => {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      next();
    } catch (error) {
      next();
    }
  };
};
```

##### 7.2 Rate Limiting
**File: `src/middlewares/rateLimiter.js`**
```javascript
const rateLimit = require('express-rate-limit');

exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later'
});

exports.orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: 'Too many orders, please wait a moment'
});
```

##### 7.3 Database Optimization

**Aggregation Pipeline Example:**
```javascript
// Optimize complex queries with aggregation
exports.getOrderStatistics = async (req, res) => {
  const stats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(req.query.startDate) }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.finalAmount' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  res.status(200).json({ success: true, data: stats });
};
```

**Index Monitoring:**
```javascript
// Check slow queries
db.system.profile.find({ millis: { $gt: 100 } }).sort({ ts: -1 });

// Explain query performance
Model.find().explain('executionStats');
```

##### 7.4 Response Optimization
- Implement pagination everywhere
- Use `lean()` for read-only queries
- Select only needed fields
- Populate selectively

#### Deliverables
- ✅ Redis caching implemented
- ✅ Rate limiting configured
- ✅ Database queries optimized
- ✅ Performance benchmarks documented

---

### **PHASE 8: Real-time Features (Socket.io)** ⏱️ 2-3 days

#### Goals
- Real-time order tracking
- Live notifications
- Admin dashboard updates
- Delivery partner location tracking

#### Tasks

##### 8.1 Socket.io Setup
**File: `src/socket/index.js`**
```javascript
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io;

exports.initSocket = (server) => {
  io = socketio(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.userId}`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Join role-specific room
    if (socket.userRole === 'admin') {
      socket.join('admins');
    } else if (socket.userRole === 'delivery') {
      socket.join('delivery-partners');
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

exports.getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

exports.emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId}`).emit(event, data);
};

exports.emitToAdmins = (event, data) => {
  if (io) io.to('admins').emit(event, data);
};

exports.emitToDeliveryPartners = (event, data) => {
  if (io) io.to('delivery-partners').emit(event, data);
};
```

##### 8.2 Real-time Events
```javascript
// Order status updates
socket.emitToUser(customerId, 'orderStatusUpdate', {
  orderId,
  status,
  message,
  timestamp
});

// New order notification to admin
socket.emitToAdmins('newOrder', orderData);

// Delivery assignment
socket.emitToUser(deliveryPartnerId, 'newDeliveryAssigned', orderData);

// Location updates
socket.on('updateLocation', async (data) => {
  await updateDeliveryPartnerLocation(socket.userId, data);
  socket.broadcast.to(`order:${data.orderId}`).emit('deliveryLocationUpdate', data);
});
```

##### 8.3 Update Server.js
```javascript
const { initSocket } = require('./src/socket');

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Initialize Socket.io
initSocket(server);
```

#### Deliverables
- ✅ Socket.io configured
- ✅ Real-time order updates
- ✅ Live notifications
- ✅ Location tracking

---

### **PHASE 9: Reliability & Never-Crash Backend** ⏱️ 3-4 days

#### Goals
- Implement robust error recovery
- Process management with PM2
- Health checks and monitoring
- Graceful shutdown
- Database connection resilience

#### Tasks

##### 9.1 PM2 Configuration
**File: `ecosystem.config.js`**
```javascript
module.exports = {
  apps: [{
    name: 'tiptop-backend',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    kill_timeout: 5000
  }]
};
```

##### 9.2 Database Resilience
**File: `src/config/database.js` (Enhanced)**
```javascript
const connectDB = async (retries = 5) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
      setTimeout(() => connectDB(retries - 1), 5000);
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    
    if (retries > 0) {
      logger.info(`Retrying connection... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      logger.error('Max retries reached. Exiting...');
      process.exit(1);
    }
  }
};
```

##### 9.3 Circuit Breaker Pattern
**File: `src/utils/circuitBreaker.js`**
```javascript
class CircuitBreaker {
  constructor(fn, options = {}) {
    this.fn = fn;
    this.failureCount = 0;
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 10000;
    this.resetTimeout = options.resetTimeout || 60000;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(...args) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.openedAt > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await Promise.race([
        this.fn(...args),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), this.timeout)
        )
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.openedAt = Date.now();
      logger.warn('Circuit breaker opened');
    }
  }
}

module.exports = CircuitBreaker;
```

##### 9.4 Health Check Endpoints
**File: `src/routes/healthRoutes.js`**
```javascript
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const redis = require('../config/redis');

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

router.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: 'unknown'
    },
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };

  // Check MongoDB
  try {
    if (mongoose.connection.readyState === 1) {
      health.services.database = 'ok';
    } else {
      health.services.database = 'down';
      health.status = 'degraded';
    }
  } catch (error) {
    health.services.database = 'error';
    health.status = 'degraded';
  }

  // Check Redis
  try {
    await redis.ping();
    health.services.redis = 'ok';
  } catch (error) {
    health.services.redis = 'down';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get('/health/liveness', (req, res) => {
  res.status(200).send('OK');
});

router.get('/health/readiness', async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.status(200).send('OK');
  } else {
    res.status(503).send('Not Ready');
  }
});

module.exports = router;
```

##### 9.5 Graceful Shutdown
**File: `server.js` (Enhanced)**
```javascript
let isShuttingDown = false;

// Graceful shutdown function
const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');

    // Close database connections
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');

      // Close Redis connection
      redis.quit(() => {
        logger.info('Redis connection closed');
        process.exit(0);
      });
    });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});
```

##### 9.6 Monitoring & Alerts
**File: `src/utils/monitoring.js`**
```javascript
const os = require('os');
const logger = require('./logger');

class Monitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: []
    };
    this.startMonitoring();
  }

  trackRequest() {
    this.metrics.requests++;
  }

  trackError() {
    this.metrics.errors++;
  }

  trackResponseTime(time) {
    this.metrics.responseTime.push(time);
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime.shift();
    }
  }

  getAverageResponseTime() {
    if (this.metrics.responseTime.length === 0) return 0;
    const sum = this.metrics.responseTime.reduce((a, b) => a + b, 0);
    return sum / this.metrics.responseTime.length;
  }

  startMonitoring() {
    // Log metrics every 5 minutes
    setInterval(() => {
      const metrics = {
        requests: this.metrics.requests,
        errors: this.metrics.errors,
        errorRate: (this.metrics.errors / this.metrics.requests * 100).toFixed(2),
        avgResponseTime: this.getAverageResponseTime().toFixed(2),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
        system: {
          platform: os.platform(),
          totalMemory: os.totalmem(),
          freeMemory: os.freemem(),
          loadAverage: os.loadavg()
        }
      };

      logger.info('System Metrics:', metrics);

      // Alert if error rate is high
      if (metrics.errorRate > 5) {
        logger.error(`High error rate detected: ${metrics.errorRate}%`);
      }

      // Alert if memory usage is high
      const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      if (memoryUsage > 400) {
        logger.warn(`High memory usage: ${memoryUsage} MB`);
      }
    }, 5 * 60 * 1000);
  }
}

module.exports = new Monitor();
```

##### 9.7 Request Tracking Middleware
```javascript
const monitor = require('../utils/monitoring');

exports.trackRequest = (req, res, next) => {
  const start = Date.now();
  
  monitor.trackRequest();

  res.on('finish', () => {
    const duration = Date.now() - start;
    monitor.trackResponseTime(duration);

    if (res.statusCode >= 400) {
      monitor.trackError();
    }
  });

  next();
};
```

#### Deliverables
- ✅ PM2 configuration
- ✅ Auto-restart on failure
- ✅ Database connection resilience
- ✅ Health check endpoints
- ✅ Graceful shutdown
- ✅ Monitoring & alerts
- ✅ Circuit breaker for external services

---

### **PHASE 10: Security Hardening** ⏱️ 2-3 days

#### Goals
- Implement security best practices
- Protect against common vulnerabilities
- Data encryption
- Security auditing

#### Tasks

##### 10.1 Security Middleware Stack
```javascript
// src/app.js (Enhanced)
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

// Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  optionsSuccessStatus: 200
}));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['price', 'rating', 'category']
}));
```

##### 10.2 Input Validation & Sanitization
```javascript
// Strong validation for all inputs
const Joi = require('joi');

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character'
    })
});
```

##### 10.3 API Key Management
```javascript
// For external API integrations
const crypto = require('crypto');

exports.generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

exports.hashApiKey = (apiKey) => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};
```

##### 10.4 Audit Logging
```javascript
// Log sensitive operations
const auditLog = (action, userId, details) => {
  logger.info({
    type: 'AUDIT',
    action,
    userId,
    details,
    timestamp: new Date(),
    ip: req.ip
  });
};
```

##### 10.5 Security Checklist
- ✅ HTTPS enforced in production
- ✅ JWT secrets rotated regularly
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ SQL/NoSQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Input validation
- ✅ Secure headers (Helmet)
- ✅ Dependencies audit (`npm audit`)
- ✅ Environment variables secured
- ✅ Error messages don't leak info
- ✅ File upload restrictions
- ✅ API versioning

#### Deliverables
- ✅ Security middleware configured
- ✅ Input validation everywhere
- ✅ Audit logging implemented
- ✅ Security documentation
- ✅ Penetration testing checklist

---

### **PHASE 11: Documentation & DevOps** ⏱️ 2-3 days

#### Goals
- API documentation
- Developer onboarding guide
- Deployment procedures
- CI/CD pipeline

#### Tasks

##### 11.1 API Documentation (Swagger)
**File: `src/config/swagger.js`**
```javascript
const swaggerJsDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'The-Tip-Top API',
      version: '1.0.0',
      description: 'Restaurant management system API',
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/models/*.js'],
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;
```

##### 11.2 Docker Configuration
**File: `Dockerfile`**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 5000

USER node

CMD ["npm", "start"]
```

**File: `docker-compose.yml`**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/tiptop
      - REDIS_HOST=redis
    depends_on:
      - mongo
      - redis
    restart: unless-stopped

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  mongo-data:
```

##### 11.3 CI/CD Pipeline (GitHub Actions)
**File: `.github/workflows/ci.yml`**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test
        env:
          NODE_ENV: test
          MONGODB_URI: mongodb://localhost:27017/tiptop_test
          JWT_SECRET: test-secret
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          # Add deployment commands here
          echo "Deploying to production..."
```

##### 11.4 README Documentation
**File: `README.md`**
```markdown
# The-Tip-Top Backend API

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Run development server: `npm run dev`

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## API Documentation

Visit `/api-docs` for Swagger documentation.

## Architecture

[Link to ARCHITECTURE_STRATEGY.md]

## Contributing

[Link to CONTRIBUTING.md]
```

#### Deliverables
- ✅ Swagger API documentation
- ✅ Docker setup
- ✅ CI/CD pipeline
- ✅ README and guides
- ✅ Deployment documentation

---

### **PHASE 12: Production Deployment** ⏱️ 1-2 days

#### Goals
- Deploy to production
- Configure production environment
- Set up monitoring
- Load testing

#### Tasks

##### 12.1 Production Checklist
- ✅ Environment variables secured
- ✅ Database backups configured
- ✅ SSL certificates installed
- ✅ Domain configured
- ✅ CDN configured for static assets
- ✅ Monitoring tools (PM2, New Relic, etc.)
- ✅ Log aggregation (ELK, CloudWatch)
- ✅ Error tracking (Sentry)
- ✅ Load balancer configured
- ✅ Auto-scaling configured

##### 12.2 Deployment Platforms
Choose one:
- **AWS (EC2 + MongoDB Atlas)**
- **DigitalOcean**
- **Heroku** (quick start)
- **Google Cloud Platform**
- **Railway**

##### 12.3 Post-Deployment
- Load testing with Artillery/k6
- Performance monitoring
- User acceptance testing
- Rollback plan prepared

#### Deliverables
- ✅ Production deployment live
- ✅ Monitoring dashboards
- ✅ Backup strategy
- ✅ Incident response plan

---

## 📊 Timeline Summary

| Phase | Duration | Focus |
|-------|----------|-------|
| 1. Foundation | 2-3 days | Project setup |
| 2. Database | 3-4 days | Models & schemas |
| 3. Auth | 2-3 days | Authentication |
| 4. Core API | 5-7 days | Controllers & routes |
| 5. Error Handling | 2 days | Error management |
| 6. Testing | 3-4 days | Test coverage |
| 7. Performance | 2-3 days | Optimization |
| 8. Real-time | 2-3 days | Socket.io |
| 9. Reliability | 3-4 days | Never-crash features |
| 10. Security | 2-3 days | Hardening |
| 11. Documentation | 2-3 days | Docs & DevOps |
| 12. Deployment | 1-2 days | Go live |

**Total Estimated Time: 6-8 weeks**

---

## 🎯 Success Metrics

- ✅ **Uptime**: 99.9%
- ✅ **Response Time**: < 200ms (p95)
- ✅ **Test Coverage**: > 70%
- ✅ **Zero Security Vulnerabilities**
- ✅ **API Documentation**: 100% coverage
- ✅ **Error Rate**: < 0.1%
- ✅ **Database Queries**: < 100ms average

---

## 🚀 Next Steps After Phase 12

### Future Enhancements (Post-MVP)
1. **ML Recommendations** (2-3 weeks)
   - User behavior tracking
   - Recommendation engine
   - A/B testing framework

2. **Advanced Analytics** (1-2 weeks)
   - Custom dashboards
   - Revenue forecasting
   - Inventory predictions

3. **Mobile Push Notifications** (1 week)
   - Firebase integration
   - Push notification service

4. **Multi-language Support** (1 week)
   - i18n implementation
   - Content translation

5. **Loyalty Program** (2 weeks)
   - Points system
   - Rewards management
   - Gamification

---

## 📝 Notes

- Each phase includes buffer time for bug fixes
- Phases can overlap for faster delivery
- Testing is continuous, not just Phase 6
- Documentation updates throughout
- Code reviews before each merge
- Daily standups to track progress

---

**This roadmap ensures a production-ready, scalable, and maintainable backend that never crashes! 🎉**
