# The-Tip-Top Backend API

A robust, scalable REST API for The-Tip-Top restaurant management system built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm >= 9.0.0

### Installation

1. Clone the repository
```bash
cd Backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB (if running locally)
```bash
mongod
```

5. Run the server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000`

## 📁 Project Structure

```
Backend/
├── src/
│   ├── config/          # Configuration files
│   │   └── database.js  # Database connection
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Custom middleware
│   │   └── errorHandler.js
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   │   ├── logger.js
│   │   ├── catchAsync.js
│   │   └── AppError.js
│   ├── validators/      # Input validation
│   └── app.js           # Express app setup
├── tests/               # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── logs/                # Log files
├── scripts/             # Utility scripts
├── docs/                # Documentation
├── server.js            # Entry point
├── package.json
└── .env.example
```

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm test` | Run all tests with coverage |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run seed` | Seed database with sample data |

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tiptop_dev
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5173
```

See `.env.example` for all available options.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test suite
npm run test:unit
npm run test:integration
```

## 📊 API Endpoints

### Health Check
- `GET /health` - Server health status

### Test Endpoint
- `GET /api/v1/test` - API test endpoint

### Coming Soon
- Authentication endpoints
- User management
- Menu management
- Order management
- And more...

## 🔐 Security Features

- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Data sanitization (NoSQL injection)
- ✅ XSS protection
- ✅ Request validation
- ✅ JWT authentication (coming in Phase 3)

## 📝 Logging

Logs are stored in the `logs/` directory:
- `error.log` - Error logs only
- `combined.log` - All logs
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled rejections

## 🐳 Docker Support

Coming soon in Phase 11!

## 📚 Documentation

- [Architecture Strategy](./ARCHITECTURE_STRATEGY.md)
- [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- API Documentation - Coming soon with Swagger

## 🤝 Contributing

1. Follow the code style (ESLint + Prettier)
2. Write tests for new features
3. Update documentation
4. Follow commit message conventions

## 📄 License

MIT

## 👥 Team

The-Tip-Top Development Team

---

**Phase 1 Complete! ✅**

Next: Phase 2 - Database Schema & Models
