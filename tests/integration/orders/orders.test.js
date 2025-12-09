const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../src/app');
const Order = require('../../../src/models/Order');
const MenuItem = require('../../../src/models/MenuItem');
const User = require('../../../src/models/User');

describe('Order Integration Tests', () => {
  let customerToken;
  let adminToken;
  let deliveryToken;
  let customerId;
  let deliveryPartnerId;
  let menuItemId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Create customer user
    const customer = await User.create({
      name: 'Customer User',
      email: 'customer@test.com',
      password: 'Customer123!',
      phoneNumber: '+919876543210',
      role: 'customer',
    });
    customerId = customer._id;

    const customerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'customer@test.com',
        password: 'Customer123!',
      });
    customerToken = customerLogin.body.token;

    // Create admin user
    await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'Admin123!',
      phoneNumber: '+919876543211',
      role: 'admin',
    });

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Admin123!',
      });
    adminToken = adminLogin.body.token;

    // Create delivery partner
    const deliveryPartner = await User.create({
      name: 'Delivery Partner',
      email: 'delivery@test.com',
      password: 'Delivery123!',
      phoneNumber: '+919876543212',
      role: 'delivery',
      deliveryPartnerData: {
        vehicleType: 'bike',
        vehicleNumber: 'KA01AB1234',
        isAvailable: true,
      },
    });
    deliveryPartnerId = deliveryPartner._id;

    const deliveryLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'delivery@test.com',
        password: 'Delivery123!',
      });
    deliveryToken = deliveryLogin.body.token;

    // Create menu item
    const menuItem = await MenuItem.create({
      name: 'Test Pizza',
      description: 'Test description',
      price: 299,
      category: {
        main: 'Pizza',
        sub: 'Vegetarian',
        tags: ['vegetarian'],
      },
      isAvailable: true,
    });
    menuItemId = menuItem._id;
  });

  afterAll(async () => {
    await Order.deleteMany({});
    await MenuItem.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Order.deleteMany({});
  });

  describe('POST /api/v1/orders', () => {
    test('should create a new order', async () => {
      const orderData = {
        items: [
          {
            menuItem: menuItemId.toString(),
            quantity: 2,
            customizations: [],
          },
        ],
        deliveryAddress: {
          street: '123 Test Street',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560001',
          landmark: 'Near Test Mall',
        },
        paymentMethod: 'COD',
      };

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.order).toHaveProperty('orderNumber');
      expect(response.body.data.order.status).toBe('pending');
      expect(response.body.data.order.items).toHaveLength(1);
    });

    test('should fail without authentication', async () => {
      const orderData = {
        items: [
          {
            menuItem: menuItemId.toString(),
            quantity: 1,
          },
        ],
        deliveryAddress: {
          street: '123 Test Street',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560001',
        },
        paymentMethod: 'COD',
      };

      await request(app)
        .post('/api/v1/orders')
        .send(orderData)
        .expect(401);
    });

    test('should fail with invalid menu item', async () => {
      const orderData = {
        items: [
          {
            menuItem: new mongoose.Types.ObjectId().toString(),
            quantity: 1,
          },
        ],
        deliveryAddress: {
          street: '123 Test Street',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560001',
        },
        paymentMethod: 'COD',
      };

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData)
        .expect(404);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('GET /api/v1/orders/my-orders', () => {
    beforeEach(async () => {
      // Create test orders
      await Order.create({
        orderNumber: 'ORD-TEST-001',
        customer: customerId,
        items: [
          {
            menuItemId: menuItemId,
            name: 'Test Pizza',
            quantity: 2,
            price: 299,
            subtotal: 598,
          },
        ],
        pricing: {
          itemsTotal: 598,
          deliveryFee: 40,
          tax: 31.9,
          total: 669.9,
        },
        deliveryAddress: {
          street: '123 Test Street',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560001',
        },
        paymentMethod: 'COD',
        status: 'pending',
      });
    });

    test('should get customer\'s orders', async () => {
      const response = await request(app)
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.results).toBeGreaterThan(0);
      expect(response.body.data.orders[0].customer.toString()).toBe(customerId.toString());
    });

    test('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/orders/my-orders?status=pending')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.orders.every(order => order.status === 'pending')).toBe(true);
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    let orderId;

    beforeEach(async () => {
      const order = await Order.create({
        orderNumber: 'ORD-TEST-002',
        customer: customerId,
        items: [
          {
            menuItemId: menuItemId,
            name: 'Test Pizza',
            quantity: 1,
            price: 299,
            subtotal: 299,
          },
        ],
        pricing: {
          itemsTotal: 299,
          deliveryFee: 40,
          tax: 16.95,
          total: 355.95,
        },
        deliveryAddress: {
          street: '123 Test Street',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560001',
        },
        paymentMethod: 'COD',
        status: 'pending',
      });
      orderId = order._id;
    });

    test('should get order by ID as customer', async () => {
      const response = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.order._id).toBe(orderId.toString());
    });

    test('should get order by ID as admin', async () => {
      const response = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.order._id).toBe(orderId.toString());
    });
  });

  describe('PATCH /api/v1/orders/:id/status', () => {
    let orderId;

    beforeEach(async () => {
      const order = await Order.create({
        orderNumber: 'ORD-TEST-003',
        customer: customerId,
        items: [
          {
            menuItemId: menuItemId,
            name: 'Test Pizza',
            quantity: 1,
            price: 299,
            subtotal: 299,
          },
        ],
        pricing: {
          itemsTotal: 299,
          deliveryFee: 40,
          tax: 16.95,
          total: 355.95,
        },
        deliveryAddress: {
          street: '123 Test Street',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560001',
        },
        paymentMethod: 'COD',
        status: 'pending',
      });
      orderId = order._id;
    });

    test('should update order status as admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'confirmed' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.order.status).toBe('confirmed');
    });

    test('should fail to update status as customer', async () => {
      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'confirmed' })
        .expect(403);
    });

    test('should fail with invalid status', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid-status' })
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('PATCH /api/v1/orders/:id/cancel', () => {
    let orderId;

    beforeEach(async () => {
      const order = await Order.create({
        orderNumber: 'ORD-TEST-004',
        customer: customerId,
        items: [
          {
            menuItemId: menuItemId,
            name: 'Test Pizza',
            quantity: 1,
            price: 299,
            subtotal: 299,
          },
        ],
        pricing: {
          itemsTotal: 299,
          deliveryFee: 40,
          tax: 16.95,
          total: 355.95,
        },
        deliveryAddress: {
          street: '123 Test Street',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560001',
        },
        paymentMethod: 'COD',
        status: 'pending',
      });
      orderId = order._id;
    });

    test('should cancel order as customer', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.order.status).toBe('cancelled');
    });

    test('should fail to cancel delivered order', async () => {
      // Update order to delivered
      await Order.findByIdAndUpdate(orderId, { status: 'delivered' });

      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('PATCH /api/v1/orders/:id/assign', () => {
    let orderId;

    beforeEach(async () => {
      const order = await Order.create({
        orderNumber: 'ORD-TEST-005',
        customer: customerId,
        items: [
          {
            menuItemId: menuItemId,
            name: 'Test Pizza',
            quantity: 1,
            price: 299,
            subtotal: 299,
          },
        ],
        pricing: {
          itemsTotal: 299,
          deliveryFee: 40,
          tax: 16.95,
          total: 355.95,
        },
        deliveryAddress: {
          street: '123 Test Street',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560001',
        },
        paymentMethod: 'COD',
        status: 'confirmed',
      });
      orderId = order._id;
    });

    test('should assign delivery partner as admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ deliveryPartnerId: deliveryPartnerId.toString() })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.order.deliveryPartner.toString()).toBe(deliveryPartnerId.toString());
      expect(response.body.data.order.status).toBe('out_for_delivery');
    });

    test('should fail to assign as customer', async () => {
      await request(app)
        .patch(`/api/v1/orders/${orderId}/assign`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ deliveryPartnerId: deliveryPartnerId.toString() })
        .expect(403);
    });
  });
});
