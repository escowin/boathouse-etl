#!/usr/bin/env ts-node

/**
 * Test script to verify database connection and configuration
 * Usage: npm run test:db-connection
 */

import { DatabaseUtils } from '../utils/database';
import sequelize from '../config/database';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Initialize database connection
    const isInitialized = await DatabaseUtils.initialize();
    
    if (!isInitialized) {
      console.error('❌ Database initialization failed');
      process.exit(1);
    }
    
    // Test basic query
    console.log('🔍 Testing basic query...');
    const [results] = await sequelize.query('SELECT NOW() as current_time');
    console.log('✅ Basic query successful:', results);
    
    // Get database stats
    console.log('🔍 Getting database statistics...');
    const stats = await DatabaseUtils.getDatabaseStats();
    console.log('✅ Database stats:', stats);
    
    // Test transaction
    console.log('🔍 Testing transaction...');
    await DatabaseUtils.executeTransaction(async (transaction) => {
      const [result] = await sequelize.query('SELECT 1 as test', { transaction });
      console.log('✅ Transaction test successful:', result);
    });
    
    console.log('🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await DatabaseUtils.cleanup();
  }
}

// Run the test
if (require.main === module) {
  testDatabaseConnection();
}

export default testDatabaseConnection;
