const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');
const AppError = require('./utils/AppError');
const errorHandler = require('./middlewares/errorHandler');
const cache = require('./utils/cache');

const app = express();

// Initialize Redis cache (don't wait for connection)
cache.connect().catch((err) => {
  logger.warn('Redis connection failed, continuing without cache:', err.message);
});

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const whitelist = process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',')
      : ['http://localhost:5173'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new AppError('Not allowed by CORS', 403));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Compression
app.use(compression());

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
const authRoutes = require('./routes/auth.routes');
const menuRoutes = require('./routes/menu.routes');
const categoryRoutes = require('./routes/category.routes');
const orderRoutes = require('./routes/order.routes');
const userRoutes = require('./routes/user.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const settingsRoutes = require('./routes/settings.routes');
const addressRoutes = require('./routes/address.routes');

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/delivery', deliveryRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/addresses', addressRoutes);

// Test route
app.get('/api/v1/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'The-Tip-Top API is running!',
    version: process.env.API_VERSION || 'v1',
  });
});

// Handle 404 - Route not found
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global error handling middleware
app.use(errorHandler);

module.exports = app;
