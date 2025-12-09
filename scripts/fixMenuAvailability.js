/**
 * Script to fix menu items availability
 * Sets all menu items to isAvailable: true and isActive: true
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const MenuItem = require('../src/models/MenuItem');

async function fixMenuAvailability() {
  try {
    console.log('\n🔍 Checking menu items...\n');

    // Get all menu items
    const allItems = await MenuItem.find({});
    console.log(`📊 Total menu items: ${allItems.length}`);

    // Check current status
    const unavailableItems = allItems.filter(item => !item.isAvailable);
    const inactiveItems = allItems.filter(item => !item.isActive);

    console.log(`❌ Unavailable items: ${unavailableItems.length}`);
    console.log(`❌ Inactive items: ${inactiveItems.length}`);

    if (unavailableItems.length > 0) {
      console.log('\nUnavailable items:');
      unavailableItems.forEach(item => {
        console.log(`  - ${item.name} (${item._id})`);
      });
    }

    if (inactiveItems.length > 0) {
      console.log('\nInactive items:');
      inactiveItems.forEach(item => {
        console.log(`  - ${item.name} (${item._id})`);
      });
    }

    // Fix all items
    console.log('\n🔧 Setting all items to available and active...');
    
    const result = await MenuItem.updateMany(
      {},
      {
        $set: {
          isAvailable: true,
          isActive: true,
        },
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} menu items`);

    // Verify
    const availableCount = await MenuItem.countDocuments({ 
      isAvailable: true,
      isActive: true 
    });
    
    console.log(`\n✅ All done! ${availableCount} items are now available and active`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
fixMenuAvailability();
