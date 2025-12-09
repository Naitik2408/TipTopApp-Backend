#!/usr/bin/env node

/**
 * Verify Atlas Connection and Data
 */

const mongoose = require('mongoose');

const ATLAS_URI = 'mongodb+srv://thetiptop007_db_user:hg78pozfk6xBHppD@cluster0.9jq1oyb.mongodb.net/tiptop_dev?retryWrites=true&w=majority&appName=Cluster0';

async function verifyAtlas() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(ATLAS_URI);
    
    console.log('✅ Connected successfully!\n');
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('📊 Database Statistics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let totalDocs = 0;
    
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      totalDocs += count;
      console.log(`  📁 ${col.name.padEnd(20)} ${count} documents`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  📦 Total: ${totalDocs} documents across ${collections.length} collections\n`);
    
    console.log('✅ MongoDB Atlas is ready to use!\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyAtlas();
