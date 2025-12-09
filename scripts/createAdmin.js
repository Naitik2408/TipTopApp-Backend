/**
 * Script to create an admin user for testing
 * Run with: node scripts/createAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const logger = require('../src/utils/logger');

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tiptop', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      'email.address': 'admin@thetiptop.com' 
    });

    if (existingAdmin) {
      logger.info('Admin user already exists');
      logger.info(`Email: admin@thetiptop.com`);
      logger.info(`Role: ${existingAdmin.role}`);
      logger.info(`ID: ${existingAdmin._id}`);
      
      // Make sure they have admin role
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        logger.info('✅ User role updated to admin');
      }
      
      process.exit(0);
    }

    // Generate unique phone number
    const phoneNumber = `+91${Date.now().toString().slice(-10)}`;

    // Create admin user
    const adminUser = await User.create({
      name: {
        first: 'Admin',
        last: 'User',
      },
      email: {
        address: 'admin@thetiptop.com',
        isVerified: true,
      },
      password: 'admin123',
      phone: {
        number: phoneNumber,
        isVerified: true,
      },
      role: 'admin',
      status: 'active',
      addresses: [],
      preferences: {
        notifications: {
          email: true,
          sms: true,
          push: true,
        },
      },
    });

    logger.info('✅ Admin user created successfully!');
    logger.info('Login credentials:');
    logger.info('  Email: admin@thetiptop.com');
    logger.info('  Password: admin123');
    logger.info(`  Role: ${adminUser.role}`);
    logger.info(`  ID: ${adminUser._id}`);

    process.exit(0);
  } catch (error) {
    logger.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
