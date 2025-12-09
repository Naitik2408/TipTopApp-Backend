/**
 * Script to update menu item statistics based on order history
 * Run this to populate stats.totalOrders and stats.totalRevenue for existing menu items
 */

require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('../src/models/MenuItem');
const Order = require('../src/models/Order');
const { connectDB } = require('../src/config/database');
const logger = require('../src/utils/logger');

const updateMenuStats = async () => {
  try {
    console.log('🚀 Starting menu statistics update...\n');

    // Connect to database
    await connectDB();

    // Get all menu items
    const menuItems = await MenuItem.find();
    console.log(`📊 Found ${menuItems.length} menu items\n`);

    // Get all completed orders
    const orders = await Order.find({
      status: { $in: ['DELIVERED', 'COMPLETED'] }
    });
    console.log(`📦 Found ${orders.length} completed orders\n`);

    let updatedCount = 0;

    // Calculate stats for each menu item
    for (const menuItem of menuItems) {
      let totalOrders = 0;
      let totalRevenue = 0;

      // Count orders for this menu item
      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            if (item.menuItem && item.menuItem.toString() === menuItem._id.toString()) {
              totalOrders += item.quantity || 1;
              totalRevenue += item.subtotal || (item.price * item.quantity);
            }
          });
        }
      });

      // Calculate popularity score (weighted: 70% orders, 30% rating)
      const popularityScore = Math.round((totalOrders * 0.7) + (menuItem.rating * 20 * 0.3));

      // Update menu item stats
      await MenuItem.findByIdAndUpdate(menuItem._id, {
        'stats.totalOrders': totalOrders,
        'stats.totalRevenue': totalRevenue,
        'stats.popularityScore': popularityScore,
      });

      if (totalOrders > 0) {
        console.log(`✅ ${menuItem.name}: ${totalOrders} orders, ₹${totalRevenue.toFixed(2)} revenue`);
        updatedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 STATISTICS UPDATE COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Updated stats for ${updatedCount} items with orders`);
    console.log(`📊 ${menuItems.length - updatedCount} items have no orders yet`);
    console.log('='.repeat(60));

    // Show top 10 popular items
    console.log('\n🔥 TOP 10 POPULAR ITEMS:\n');
    const popularItems = await MenuItem.find()
      .sort({ 'stats.totalOrders': -1 })
      .limit(10)
      .select('name stats.totalOrders stats.totalRevenue');

    popularItems.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.name}`);
      console.log(`   Orders: ${item.stats.totalOrders}, Revenue: ₹${item.stats.totalRevenue.toFixed(2)}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating menu stats:', error);
    process.exit(1);
  }
};

// Run the script
updateMenuStats();
