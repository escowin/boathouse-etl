#!/usr/bin/env node

/**
 * Production Deployment Script
 * 
 * This script helps deploy the complete database schema to production.
 * It includes all tables, indexes, and seed data in a single migration.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Boathouse ETL - Production Deployment');
console.log('==========================================');
console.log('');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env file not found!');
  console.error('   Please create a .env file with your production database credentials.');
  console.error('   See .env.example for reference.');
  process.exit(1);
}

// Check if config directory exists
const configPath = path.join(__dirname, '..', 'config');
if (!fs.existsSync(configPath)) {
  console.error('❌ Error: config directory not found!');
  console.error('   Please ensure the config directory exists with config.js');
  process.exit(1);
}

console.log('✅ Environment check passed');
console.log('');

// Confirm production deployment
console.log('⚠️  WARNING: This will create the complete database schema in PRODUCTION!');
console.log('   Make sure you have:');
console.log('   - Backed up your existing database');
console.log('   - Verified your .env file has correct production credentials');
console.log('   - Tested this migration on a staging environment');
console.log('');

// In a real deployment, you might want to add a confirmation prompt
// For now, we'll just show the command to run

console.log('📋 To deploy to production, run:');
console.log('');
console.log('   npm run migrate:up');
console.log('');
console.log('📋 To check migration status:');
console.log('');
console.log('   npm run migrate:status');
console.log('');
console.log('📋 To rollback if needed:');
console.log('');
console.log('   npm run migrate:down');
console.log('');
console.log('🎯 What this migration includes:');
console.log('   ✅ Complete database schema (22 tables)');
console.log('   ✅ Enhanced athlete competitive status system');
console.log('   ✅ Simplified USRA age categories');
console.log('   ✅ All indexes for optimal performance');
console.log('   ✅ Seed data for USRA categories');
console.log('   ✅ Comprehensive CASCADE delete system');
console.log('');
console.log('🔧 Production Environment Requirements:');
console.log('   - PostgreSQL database');
console.log('   - Node.js and npm installed');
console.log('   - Proper .env configuration');
console.log('   - Database user with CREATE privileges');
console.log('');

// Optional: Run the migration automatically
// Uncomment the following lines if you want to run the migration automatically
/*
try {
  console.log('🔄 Running production migration...');
  execSync('npm run migrate:up', { stdio: 'inherit' });
  console.log('✅ Production migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
*/
