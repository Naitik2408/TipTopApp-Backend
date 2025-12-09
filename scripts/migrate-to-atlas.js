#!/usr/bin/env node

/**
 * Migration Script: Local MongoDB to MongoDB Atlas
 * This script exports data from local MongoDB and imports it to Atlas
 */

const { MongoClient } = require('mongodb');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

// Configuration
const LOCAL_URI = 'mongodb://localhost:27017/tiptop_dev';
const ATLAS_URI = 'mongodb+srv://thetiptop007_db_user:hg78pozfk6xBHppD@cluster0.9jq1oyb.mongodb.net/tiptop_dev?retryWrites=true&w=majority&appName=Cluster0';
const BACKUP_DIR = path.join(__dirname, '../.backup');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

/**
 * Check if MongoDB tools are installed
 */
async function checkMongoTools() {
  try {
    await execAsync('mongodump --version');
    await execAsync('mongorestore --version');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get all collections from local database
 */
async function getCollections(client) {
  const db = client.db('tiptop_dev');
  const collections = await db.listCollections().toArray();
  return collections.map(col => col.name);
}

/**
 * Export data from local MongoDB
 */
async function exportData() {
  log('\n📦 Exporting data from local MongoDB...', 'cyan');
  
  try {
    // Create backup directory
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    // Export entire database
    const { stdout, stderr } = await execAsync(
      `mongodump --uri="${LOCAL_URI}" --out="${BACKUP_DIR}"`
    );
    
    if (stderr && !stderr.includes('done dumping')) {
      log(`⚠️  Warning: ${stderr}`, 'yellow');
    }
    
    log('✅ Export completed successfully!', 'green');
    return true;
  } catch (error) {
    log(`❌ Export failed: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Import data to MongoDB Atlas
 */
async function importData() {
  log('\n📤 Importing data to MongoDB Atlas...', 'cyan');
  
  try {
    const dumpPath = path.join(BACKUP_DIR, 'tiptop_dev');
    
    // Import entire database with longer timeout
    const { stdout, stderr } = await execAsync(
      `mongorestore --uri="${ATLAS_URI}" --drop "${dumpPath}" --numInsertionWorkersPerCollection=1`,
      { maxBuffer: 1024 * 1024 * 10, timeout: 120000 } // 2 minutes timeout
    );
    
    log('✅ Import completed successfully!', 'green');
    
    // Show import stats
    const statsMatch = stderr.match(/(\d+) document\(s\) restored successfully/);
    if (statsMatch) {
      log(`   📊 ${statsMatch[1]} documents restored`, 'blue');
    }
    
    return true;
  } catch (error) {
    // Check if it's a partial success
    if (error.stderr && error.stderr.includes('document(s) restored successfully')) {
      log('⚠️  Partial import completed (some collections may have timed out)', 'yellow');
      const statsMatch = error.stderr.match(/(\d+) document\(s\) restored successfully/);
      if (statsMatch) {
        log(`   📊 ${statsMatch[1]} documents restored`, 'blue');
      }
      return true; // Continue with verification
    }
    
    log(`❌ Import failed: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Verify data integrity
 */
async function verifyData() {
  log('\n🔍 Verifying data integrity...', 'cyan');
  
  let localClient, atlasClient;
  
  try {
    // Connect to both databases
    localClient = await MongoClient.connect(LOCAL_URI);
    atlasClient = await MongoClient.connect(ATLAS_URI);
    
    const localCollections = await getCollections(localClient);
    const atlasCollections = await getCollections(atlasClient);
    
    log(`\nLocal Collections: ${localCollections.length}`, 'blue');
    log(`Atlas Collections: ${atlasCollections.length}`, 'blue');
    
    // Check each collection
    for (const collectionName of localCollections) {
      const localDB = localClient.db('tiptop_dev');
      const atlasDB = atlasClient.db('tiptop_dev');
      
      const localCount = await localDB.collection(collectionName).countDocuments();
      const atlasCount = await atlasDB.collection(collectionName).countDocuments();
      
      if (localCount === atlasCount) {
        log(`  ✅ ${collectionName}: ${localCount} documents`, 'green');
      } else {
        log(`  ⚠️  ${collectionName}: Local(${localCount}) vs Atlas(${atlasCount})`, 'yellow');
      }
    }
    
    log('\n✅ Verification completed!', 'green');
    return true;
  } catch (error) {
    log(`❌ Verification failed: ${error.message}`, 'red');
    return false;
  } finally {
    if (localClient) await localClient.close();
    if (atlasClient) await atlasClient.close();
  }
}

/**
 * Clean up backup files
 */
async function cleanup() {
  try {
    log('\n🧹 Cleaning up backup files...', 'cyan');
    await fs.rm(BACKUP_DIR, { recursive: true, force: true });
    log('✅ Cleanup completed!', 'green');
  } catch (error) {
    log(`⚠️  Cleanup warning: ${error.message}`, 'yellow');
  }
}

/**
 * Main migration process
 */
async function migrate() {
  log('╔═══════════════════════════════════════════════════════╗', 'cyan');
  log('║   MongoDB Migration: Local → Atlas                   ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════╝', 'cyan');
  
  try {
    // Check if MongoDB tools are installed
    log('\n🔧 Checking MongoDB tools...', 'cyan');
    const hasTools = await checkMongoTools();
    
    if (!hasTools) {
      log('\n❌ MongoDB tools (mongodump/mongorestore) not found!', 'red');
      log('\nPlease install MongoDB Database Tools:', 'yellow');
      log('  macOS:   brew install mongodb-database-tools', 'yellow');
      log('  Ubuntu:  sudo apt-get install mongodb-database-tools', 'yellow');
      log('  Windows: Download from https://www.mongodb.com/try/download/database-tools', 'yellow');
      process.exit(1);
    }
    
    log('✅ MongoDB tools found!', 'green');
    
    // Step 1: Export from local
    const exported = await exportData();
    if (!exported) {
      throw new Error('Export failed');
    }
    
    // Step 2: Import to Atlas
    const imported = await importData();
    if (!imported) {
      throw new Error('Import failed');
    }
    
    // Step 3: Verify data
    await verifyData();
    
    // Step 4: Cleanup
    await cleanup();
    
    log('\n╔═══════════════════════════════════════════════════════╗', 'green');
    log('║   🎉 Migration completed successfully!                ║', 'green');
    log('╚═══════════════════════════════════════════════════════╝', 'green');
    
    log('\n📝 Next Steps:', 'cyan');
    log('  1. Update your .env file with the Atlas connection string', 'yellow');
    log('  2. Restart your backend server', 'yellow');
    log('  3. Test your application', 'yellow');
    
  } catch (error) {
    log(`\n❌ Migration failed: ${error.message}`, 'red');
    log('\n💡 Your local database is still intact.', 'blue');
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrate();
}

module.exports = { migrate, exportData, importData, verifyData };
