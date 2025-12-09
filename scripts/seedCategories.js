require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../src/models/category.model');
const fs = require('fs');
const path = require('path');

// Read the menu data from frontend
const menuDataPath = path.join(__dirname, '../../The-Tip-Top/src/data.json');
const menuData = JSON.parse(fs.readFileSync(menuDataPath, 'utf8'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Extract unique categories
const extractCategories = () => {
  const categorySet = new Set();
  
  menuData.dishes.forEach(dish => {
    if (dish.categories && Array.isArray(dish.categories)) {
      dish.categories.forEach(category => {
        // Skip "All" category as it's a filter, not a real category
        if (category && category !== 'All') {
          categorySet.add(category);
        }
      });
    }
  });
  
  return Array.from(categorySet).sort();
};

// Assign colors to categories
const colors = ['green', 'red', 'blue', 'purple', 'orange', 'pink', 'yellow'];
const getColor = (index) => colors[index % colors.length];

// Seed categories
const seedCategories = async () => {
  try {
    console.log('\n🌱 Starting category seeding...\n');
    
    // Extract unique categories
    const uniqueCategories = extractCategories();
    console.log(`📊 Found ${uniqueCategories.length} unique categories:`);
    console.log(uniqueCategories.join(', '));
    console.log();
    
    // Check existing categories
    const existingCategories = await Category.find({});
    console.log(`📦 Existing categories in database: ${existingCategories.length}`);
    
    let inserted = 0;
    let skipped = 0;
    
    // Insert categories
    for (let i = 0; i < uniqueCategories.length; i++) {
      const categoryName = uniqueCategories[i];
      
      // Check if category already exists
      const exists = await Category.findOne({ 
        name: { $regex: new RegExp(`^${categoryName}$`, 'i') } 
      });
      
      if (exists) {
        console.log(`⏭️  Skipped: "${categoryName}" (already exists)`);
        skipped++;
      } else {
        await Category.create({
          name: categoryName,
          description: `${categoryName} dishes and items`,
          isActive: true,
          color: getColor(i),
          itemCount: 0
        });
        console.log(`✅ Added: "${categoryName}" (${getColor(i)})`);
        inserted++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Inserted: ${inserted} categories`);
    console.log(`   ⏭️  Skipped: ${skipped} categories`);
    console.log(`   📦 Total: ${inserted + skipped} categories\n`);
    
    // Display all categories
    const allCategories = await Category.find({}).sort({ name: 1 });
    console.log('📋 All categories in database:');
    allCategories.forEach((cat, idx) => {
      console.log(`   ${idx + 1}. ${cat.name} (${cat.color}) - ${cat.isActive ? '✓' : '✗'} Active`);
    });
    
    console.log('\n✨ Category seeding completed!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error seeding categories:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run the seeder
seedCategories();
