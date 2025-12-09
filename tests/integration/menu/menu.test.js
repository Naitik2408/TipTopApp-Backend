const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../src/app');
const MenuItem = require('../../../src/models/MenuItem');
const User = require('../../../src/models/User');

describe('Menu Integration Tests', () => {
  let adminToken;
  let customerToken;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@tiptop.com',
      password: 'Admin123!',
      phoneNumber: '+919876543210',
      role: 'admin',
    });

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@tiptop.com',
        password: 'Admin123!',
      });
    adminToken = adminLogin.body.token;

    // Create customer user
    await User.create({
      name: 'Customer User',
      email: 'customer@example.com',
      password: 'Customer123!',
      phoneNumber: '+919876543211',
      role: 'customer',
    });

    const customerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'customer@example.com',
        password: 'Customer123!',
      });
    customerToken = customerLogin.body.token;
  });

  afterAll(async () => {
    await MenuItem.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await MenuItem.deleteMany({});
  });

  describe('GET /api/v1/menu', () => {
    beforeEach(async () => {
      // Create sample menu items
      await MenuItem.create([
        {
          name: 'Margherita Pizza',
          description: 'Classic pizza with tomato and cheese',
          price: 299,
          category: {
            main: 'Pizza',
            sub: 'Vegetarian',
            tags: ['vegetarian', 'popular'],
          },
          isAvailable: true,
        },
        {
          name: 'Chicken Burger',
          description: 'Juicy chicken burger',
          price: 199,
          category: {
            main: 'Burgers',
            sub: 'Non-Vegetarian',
            tags: ['non-vegetarian'],
          },
          isAvailable: true,
        },
        {
          name: 'Vegan Salad',
          description: 'Fresh garden salad',
          price: 149,
          category: {
            main: 'Salads',
            sub: 'Healthy',
            tags: ['vegan', 'gluten-free'],
          },
          isAvailable: false,
        },
      ]);
    });

    test('should get all menu items', async () => {
      const response = await request(app)
        .get('/api/v1/menu')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.results).toBe(3);
      expect(response.body.data.menuItems).toHaveLength(3);
    });

    test('should filter by availability', async () => {
      const response = await request(app)
        .get('/api/v1/menu?isAvailable=true')
        .expect(200);

      expect(response.body.results).toBe(2);
      expect(response.body.data.menuItems.every(item => item.isAvailable)).toBe(true);
    });

    test('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/v1/menu?price[gte]=150&price[lte]=250')
        .expect(200);

      expect(response.body.results).toBeGreaterThan(0);
      expect(response.body.data.menuItems.every(item => 
        item.price >= 150 && item.price <= 250
      )).toBe(true);
    });

    test('should sort by price ascending', async () => {
      const response = await request(app)
        .get('/api/v1/menu?sort=price')
        .expect(200);

      const prices = response.body.data.menuItems.map(item => item.price);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    test('should sort by price descending', async () => {
      const response = await request(app)
        .get('/api/v1/menu?sort=-price')
        .expect(200);

      const prices = response.body.data.menuItems.map(item => item.price);
      expect(prices).toEqual([...prices].sort((a, b) => b - a));
    });

    test('should limit fields', async () => {
      const response = await request(app)
        .get('/api/v1/menu?fields=name,price')
        .expect(200);

      const firstItem = response.body.data.menuItems[0];
      expect(firstItem).toHaveProperty('name');
      expect(firstItem).toHaveProperty('price');
      expect(firstItem).not.toHaveProperty('description');
    });

    test('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/menu?page=1&limit=2')
        .expect(200);

      expect(response.body.results).toBe(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        totalResults: 3,
        totalPages: 2,
      });
    });
  });

  describe('GET /api/v1/menu/category/:category', () => {
    beforeEach(async () => {
      await MenuItem.create([
        {
          name: 'Margherita Pizza',
          price: 299,
          category: { main: 'Pizza', sub: 'Vegetarian', tags: [] },
          isAvailable: true,
        },
        {
          name: 'Pepperoni Pizza',
          price: 349,
          category: { main: 'Pizza', sub: 'Non-Vegetarian', tags: [] },
          isAvailable: true,
        },
        {
          name: 'Chicken Burger',
          price: 199,
          category: { main: 'Burgers', sub: 'Non-Vegetarian', tags: [] },
          isAvailable: true,
        },
      ]);
    });

    test('should get menu items by category', async () => {
      const response = await request(app)
        .get('/api/v1/menu/category/Pizza')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.results).toBe(2);
      expect(response.body.data.menuItems.every(item => 
        item.category.main === 'Pizza'
      )).toBe(true);
    });

    test('should return empty array for non-existent category', async () => {
      const response = await request(app)
        .get('/api/v1/menu/category/Desserts')
        .expect(200);

      expect(response.body.results).toBe(0);
      expect(response.body.data.menuItems).toEqual([]);
    });
  });

  describe('POST /api/v1/menu', () => {
    test('should create menu item as admin', async () => {
      const menuItemData = {
        name: 'Test Pizza',
        description: 'Test description',
        price: 299,
        category: {
          main: 'Pizza',
          sub: 'Vegetarian',
          tags: ['vegetarian'],
        },
        isAvailable: true,
      };

      const response = await request(app)
        .post('/api/v1/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(menuItemData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.menuItem).toMatchObject({
        name: menuItemData.name,
        price: menuItemData.price,
      });
    });

    test('should fail to create menu item as customer', async () => {
      const menuItemData = {
        name: 'Test Pizza',
        price: 299,
        category: { main: 'Pizza', sub: 'Vegetarian', tags: [] },
      };

      const response = await request(app)
        .post('/api/v1/menu')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(menuItemData)
        .expect(403);

      expect(response.body.status).toBe('fail');
    });

    test('should fail without authentication', async () => {
      const menuItemData = {
        name: 'Test Pizza',
        price: 299,
        category: { main: 'Pizza', sub: 'Vegetarian', tags: [] },
      };

      await request(app)
        .post('/api/v1/menu')
        .send(menuItemData)
        .expect(401);
    });

    test('should fail with invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'A', // Too short
          price: -10, // Negative price
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('PATCH /api/v1/menu/:id', () => {
    let menuItemId;

    beforeEach(async () => {
      const menuItem = await MenuItem.create({
        name: 'Original Pizza',
        price: 299,
        category: { main: 'Pizza', sub: 'Vegetarian', tags: [] },
        isAvailable: true,
      });
      menuItemId = menuItem._id;
    });

    test('should update menu item as admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/menu/${menuItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Pizza',
          price: 349,
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.menuItem.name).toBe('Updated Pizza');
      expect(response.body.data.menuItem.price).toBe(349);
    });

    test('should fail to update as customer', async () => {
      await request(app)
        .patch(`/api/v1/menu/${menuItemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Updated Pizza' })
        .expect(403);
    });

    test('should fail with invalid ID', async () => {
      await request(app)
        .patch('/api/v1/menu/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Pizza' })
        .expect(400);
    });
  });

  describe('DELETE /api/v1/menu/:id', () => {
    let menuItemId;

    beforeEach(async () => {
      const menuItem = await MenuItem.create({
        name: 'Pizza to Delete',
        price: 299,
        category: { main: 'Pizza', sub: 'Vegetarian', tags: [] },
        isAvailable: true,
      });
      menuItemId = menuItem._id;
    });

    test('should soft delete menu item as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/menu/${menuItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');

      // Verify soft delete
      const menuItem = await MenuItem.findById(menuItemId);
      expect(menuItem.isDeleted).toBe(true);
    });

    test('should fail to delete as customer', async () => {
      await request(app)
        .delete(`/api/v1/menu/${menuItemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });
});
