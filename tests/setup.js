// Jest setup file for tests
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/tiptop_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRE = '1d';

// Increase timeout for async operations
jest.setTimeout(10000);
