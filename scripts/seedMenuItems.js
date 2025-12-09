const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MenuItem = require('../src/models/MenuItem');

// Read data.json
const dataPath = path.join(__dirname, '../../The-Tip-Top/src/data.json');
const menuData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected to:', process.env.MONGODB_URI);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Transform data from data.json into grouped menu items
const transformMenuItems = () => {
  console.log('📦 Transforming menu data...\n');
  
  // Group dishes by name (case-insensitive)
  const itemsMap = new Map();
  
  menuData.dishes.forEach((dish) => {
    const itemName = dish.name.trim();
    const itemKey = itemName.toUpperCase();
    
    if (!itemsMap.has(itemKey)) {
      // Generate slug from name
      const slug = itemName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Create new item entry
      itemsMap.set(itemKey, {
        name: itemName,
        slug: slug,
        description: dish.description || `Delicious ${itemName}`,
        image: dish.image,
        priceVariants: [],
        categories: dish.categories || ['All'],
        rating: dish.rating || 4.0,
        reviews: dish.reviews || 0,
        isAvailable: true,
        isActive: true,
      });
    }
    
    // Add price variant for this quantity
    const item = itemsMap.get(itemKey);
    const quantity = dish.plateQuantity || 'Full';
    
    // Check if this variant already exists
    const existingVariant = item.priceVariants.find(v => v.quantity === quantity);
    if (!existingVariant) {
      item.priceVariants.push({
        quantity: quantity,
        price: dish.price,
      });
    }
  });
  
  const items = Array.from(itemsMap.values());
  console.log(`✅ Transformed ${items.length} unique menu items`);
  console.log(`   - Total variants across all items: ${items.reduce((sum, i) => sum + i.priceVariants.length, 0)}\n`);
  
  return items;
};

// Seed function
const seedMenuItems = async () => {
  try {
    console.log('🌱 Starting menu seeding process...\n');

    // Connect to database
    await connectDB();

    // Get current count
    const existingCount = await MenuItem.countDocuments();
    console.log(`📊 Current menu items in database: ${existingCount}\n`);

    // Clear database
    console.log('🗑️  Clearing existing menu items...');
    const deleteResult = await MenuItem.deleteMany({});
    console.log(`✅ Cleared ${deleteResult.deletedCount} items\n`);

    // Transform data
    const menuItems = transformMenuItems();

    // Show sample
    if (menuItems.length > 0) {
      const sample = menuItems.find(i => i.priceVariants.length > 1) || menuItems[0];
      console.log('🔍 Sample item:');
      console.log(`   Name: ${sample.name}`);
      console.log(`   Price Variants: ${sample.priceVariants.map(v => `${v.quantity}: ₹${v.price}`).join(', ')}`);
      console.log(`   Categories: ${sample.categories.join(', ')}`);
      console.log('');
    }

    // Insert menu items
    console.log('📝 Inserting menu items...\n');
    
    const result = await MenuItem.insertMany(menuItems, { ordered: false });
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEEDING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully added: ${result.length} items`);
    console.log(`📊 Total menu items in database: ${await MenuItem.countDocuments()}`);
    console.log('='.repeat(60));

    // Show some examples
    console.log('\n📋 Sample items from database:\n');
    const samples = await MenuItem.find().limit(3).select('name priceVariants');
    samples.forEach((item, i) => {
      console.log(`${i+1}. ${item.name}`);
      console.log(`   Variants: ${item.priceVariants.map(v => `${v.quantity}: ₹${v.price}`).join(', ')}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding
seedMenuItems();
