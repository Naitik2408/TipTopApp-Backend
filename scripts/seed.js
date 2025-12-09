require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, closeDB } = require('../src/config/database');
const logger = require('../src/utils/logger');

// Import models
const User = require('../src/models/User');
const MenuItem = require('../src/models/MenuItem');
const Order = require('../src/models/Order');
const PromoCode = require('../src/models/PromoCode');

// Sample data
const seedData = async () => {
  try {
    logger.info('🌱 Starting database seeding...');

    // Connect to database
    await connectDB();

    // Clear existing data
    logger.info('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
    await PromoCode.deleteMany({});

    // Create admin user
    logger.info('👤 Creating admin user...');
    const admin = await User.create({
      email: {
        address: 'admin@tiptop.com',
        isVerified: true,
      },
      phone: {
        number: '+911234567890',
        isVerified: true,
      },
      password: 'Admin@123',
      role: 'admin',
      name: {
        first: 'Admin',
        last: 'User',
      },
    });
    logger.info(`✅ Admin created: ${admin.email.address}`);

    // Create sample customers
    logger.info('👥 Creating sample customers...');
    const customers = await User.create([
      {
        email: {
          address: 'rahul@example.com',
          isVerified: true,
        },
        phone: {
          number: '+919876543210',
          isVerified: true,
        },
        password: 'Customer@123',
        role: 'customer',
        name: {
          first: 'Rahul',
          last: 'Kumar',
        },
        addresses: [
          {
            type: 'home',
            street: '123 MG Road',
            city: 'Mumbai',
            state: 'Maharashtra',
            zipCode: '400001',
            isDefault: true,
          },
        ],
      },
      {
        email: {
          address: 'priya@example.com',
          isVerified: true,
        },
        phone: {
          number: '+919876543211',
          isVerified: true,
        },
        password: 'Customer@123',
        role: 'customer',
        name: {
          first: 'Priya',
          last: 'Sharma',
        },
        addresses: [
          {
            type: 'home',
            street: '456 Park Street',
            city: 'Delhi',
            state: 'Delhi',
            zipCode: '110001',
            isDefault: true,
          },
        ],
      },
    ]);
    logger.info(`✅ Created ${customers.length} customers`);

    // Create delivery partners
    logger.info('🚚 Creating delivery partners...');
    const deliveryPartners = await User.create([
      {
        email: {
          address: 'delivery1@tiptop.com',
          isVerified: true,
        },
        phone: {
          number: '+919876543212',
          isVerified: true,
        },
        password: 'Delivery@123',
        role: 'delivery',
        name: {
          first: 'Vikram',
          last: 'Singh',
        },
        deliveryData: {
          vehicleInfo: {
            type: 'bike',
            number: 'MH01AB1234',
            model: 'Honda Activa',
          },
          availability: true,
          rating: 4.5,
        },
      },
    ]);
    logger.info(`✅ Created ${deliveryPartners.length} delivery partners`);

    // Create menu items
    logger.info('🍽️  Creating menu items...');
    const menuItems = await MenuItem.create([
      {
        name: 'Palak Chaap',
        description: 'Soy chaap cooked in creamy spinach gravy with aromatic spices',
        price: 160,
        image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400',
        category: {
          main: 'Chaap Gravy',
          sub: ['Vegetarian'],
          tags: ['popular', 'healthy'],
        },
        plateQuantity: 'Half',
        isVegetarian: true,
        isAvailable: true,
        prepTime: 20,
        rating: 4.3,
        reviewCount: 45,
        stats: {
          totalOrders: 120,
          totalRevenue: 19200,
          popularityScore: 85,
        },
      },
      {
        name: 'Tandoori Chaap',
        description: 'Marinated soy chaap grilled to perfection in tandoor',
        price: 180,
        originalPrice: 200,
        image: 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=400',
        category: {
          main: 'Tandoori Snacks',
          sub: ['Vegetarian'],
          tags: ['bestseller', 'spicy'],
        },
        plateQuantity: 'Half',
        isVegetarian: true,
        isAvailable: true,
        spiceLevel: 3,
        prepTime: 25,
        rating: 4.6,
        reviewCount: 87,
        stats: {
          totalOrders: 200,
          totalRevenue: 36000,
          popularityScore: 95,
        },
        isFeatured: true,
      },
      {
        name: 'Butter Paneer',
        description: 'Cottage cheese in rich tomato and butter gravy',
        price: 220,
        image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400',
        category: {
          main: 'North Indian',
          sub: ['Vegetarian', 'Gravy'],
          tags: ['classic', 'popular'],
        },
        plateQuantity: 'Full',
        isVegetarian: true,
        isAvailable: true,
        prepTime: 15,
        rating: 4.5,
        reviewCount: 156,
        stats: {
          totalOrders: 250,
          totalRevenue: 55000,
          popularityScore: 92,
        },
      },
      {
        name: 'Garlic Naan',
        description: 'Fresh naan bread topped with butter and garlic',
        price: 40,
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
        category: {
          main: 'Breads',
          sub: ['Vegetarian'],
          tags: ['side-dish'],
        },
        isVegetarian: true,
        isAvailable: true,
        prepTime: 10,
        rating: 4.4,
        reviewCount: 98,
        stats: {
          totalOrders: 300,
          totalRevenue: 12000,
          popularityScore: 80,
        },
      },
      {
        name: 'Biryani Rice',
        description: 'Fragrant basmati rice with aromatic spices',
        price: 150,
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
        category: {
          main: 'Rice',
          sub: ['Vegetarian'],
          tags: ['popular'],
        },
        plateQuantity: 'Full',
        isVegetarian: true,
        isVegan: true,
        isAvailable: true,
        prepTime: 12,
        rating: 4.2,
        reviewCount: 67,
        stats: {
          totalOrders: 180,
          totalRevenue: 27000,
          popularityScore: 75,
        },
      },
      {
        name: 'Masala Chai',
        description: 'Traditional Indian spiced tea with milk',
        price: 30,
        image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400',
        category: {
          main: 'Beverages',
          sub: ['Hot Drinks'],
          tags: ['quick'],
        },
        isVegetarian: true,
        isAvailable: true,
        prepTime: 5,
        rating: 4.7,
        reviewCount: 234,
        stats: {
          totalOrders: 450,
          totalRevenue: 13500,
          popularityScore: 88,
        },
      },
    ]);
    logger.info(`✅ Created ${menuItems.length} menu items`);

    // Create promo codes
    logger.info('🎟️  Creating promo codes...');
    const promoCodes = await PromoCode.create([
      {
        code: 'WELCOME50',
        discountType: 'percentage',
        discountValue: 50,
        maxDiscount: 100,
        minOrderValue: 200,
        applicableTo: 'first-order',
        usageLimit: 1000,
        perUserLimit: 1,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
        campaignName: 'Welcome Offer',
        description: '50% off on first order',
        termsAndConditions: 'Valid only on first order. Maximum discount ₹100.',
      },
      {
        code: 'SAVE100',
        discountType: 'fixed',
        discountValue: 100,
        minOrderValue: 500,
        applicableTo: 'all',
        usageLimit: 500,
        perUserLimit: 3,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
        isActive: true,
        campaignName: 'Save ₹100',
        description: 'Flat ₹100 off on orders above ₹500',
      },
      {
        code: 'FREEDEL',
        discountType: 'free-delivery',
        discountValue: 0,
        minOrderValue: 300,
        applicableTo: 'all',
        validFrom: new Date(),
        validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        isActive: true,
        campaignName: 'Free Delivery',
        description: 'Free delivery on orders above ₹300',
      },
    ]);
    logger.info(`✅ Created ${promoCodes.length} promo codes`);

    logger.info('✅ Database seeding completed successfully!');
    logger.info('\n📊 Summary:');
    logger.info(`   - Admin users: 1`);
    logger.info(`   - Customers: ${customers.length}`);
    logger.info(`   - Delivery partners: ${deliveryPartners.length}`);
    logger.info(`   - Menu items: ${menuItems.length}`);
    logger.info(`   - Promo codes: ${promoCodes.length}`);
    logger.info('\n🔐 Login credentials:');
    logger.info('   Admin: admin@tiptop.com / Admin@123');
    logger.info('   Customer: rahul@example.com / Customer@123');
    logger.info('   Delivery: delivery1@tiptop.com / Delivery@123');

    await closeDB();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    await closeDB();
    process.exit(1);
  }
};

// Run seeding
seedData();
