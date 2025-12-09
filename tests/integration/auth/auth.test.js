const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../src/app');
const User = require('../../../src/models/User');

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        phoneNumber: '+919876543210',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toHaveProperty('email', userData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('token');
    });

    test('should fail with duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        phoneNumber: '+919876543210',
      };

      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // Duplicate registration
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('fail');
    });

    test('should fail with weak password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123',
        passwordConfirm: '123',
        phoneNumber: '+919876543210',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('fail');
    });

    test('should fail with mismatched passwords', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        passwordConfirm: 'Password456!',
        phoneNumber: '+919876543210',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('fail');
    });

    test('should fail with invalid email', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        phoneNumber: '+919876543210',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        phoneNumber: '+919876543210',
      });
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
    });

    test('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.status).toBe('fail');
    });

    test('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body.status).toBe('fail');
    });

    test('should fail without email or password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let token;

    beforeEach(async () => {
      // Create and login user
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        phoneNumber: '+919876543210',
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      token = loginResponse.body.token;
    });

    test('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
    });

    test('should fail without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.status).toBe('fail');
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('PATCH /api/v1/auth/update-password', () => {
    let token;

    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        phoneNumber: '+919876543210',
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      token = loginResponse.body.token;
    });

    test('should update password with valid current password', async () => {
      const response = await request(app)
        .patch('/api/v1/auth/update-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Password123!',
          password: 'NewPassword123!',
          passwordConfirm: 'NewPassword123!',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body).toHaveProperty('token');

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewPassword123!',
        })
        .expect(200);

      expect(loginResponse.body.status).toBe('success');
    });

    test('should fail with incorrect current password', async () => {
      const response = await request(app)
        .patch('/api/v1/auth/update-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword123!',
          password: 'NewPassword123!',
          passwordConfirm: 'NewPassword123!',
        })
        .expect(401);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let token;

    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        phoneNumber: '+919876543210',
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      token = loginResponse.body.token;
    });

    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });
});
