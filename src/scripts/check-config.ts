#!/usr/bin/env ts-node

/**
 * Configuration check script
 * Usage: npm run check:config
 */

import { env } from '../config/env';

function checkConfiguration() {
  console.log('🔍 Checking configuration...\n');
  
  // Database configuration
  console.log('📊 Database Configuration:');
  console.log(`  Host: ${env.DB_HOST}`);
  console.log(`  Port: ${env.DB_PORT}`);
  console.log(`  Database: ${env.DB_NAME}`);
  console.log(`  User: ${env.DB_USER}`);
  console.log(`  Password: ${env.DB_PASSWORD ? '***' : 'NOT SET'}`);
  console.log(`  SSL: ${env.DB_SSL}\n`);
  
  // Application configuration
  console.log('⚙️  Application Configuration:');
  console.log(`  Environment: ${env.NODE_ENV}\n`);
  
  // Google Sheets configuration
  console.log('📋 Google Sheets Configuration:');
  console.log(`  Credentials Path: ${env.GOOGLE_SHEETS_CREDENTIALS_PATH}`);
  console.log(`  Spreadsheet ID: ${env.GOOGLE_SHEETS_SPREADSHEET_ID || 'NOT SET'}`);
  console.log(`  Athletes Sheet: ${env.GOOGLE_SHEETS_ATHLETES_SHEET_NAME}`);
  console.log(`  Boats Sheet: ${env.GOOGLE_SHEETS_BOATS_SHEET_NAME}`);
  console.log(`  Practice Sessions Sheet: ${env.GOOGLE_SHEETS_PRACTICE_SESSIONS_SHEET_NAME}\n`);
  
  // ETL configuration
  console.log('🔄 ETL Configuration:');
  console.log(`  Batch Size: ${env.ETL_BATCH_SIZE}`);
  console.log(`  Retry Attempts: ${env.ETL_RETRY_ATTEMPTS}`);
  console.log(`  Retry Delay: ${env.ETL_RETRY_DELAY_MS}ms`);
  console.log(`  Log Level: ${env.ETL_LOG_LEVEL}\n`);
  
  // Check for required values
  const missingConfigs: string[] = [];
  
  if (!env.DB_PASSWORD) {
    missingConfigs.push('DB_PASSWORD');
  }
  
  if (!env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    missingConfigs.push('GOOGLE_SHEETS_SPREADSHEET_ID');
  }
  
  if (missingConfigs.length > 0) {
    console.log('⚠️  Missing Configuration:');
    missingConfigs.forEach(config => {
      console.log(`  - ${config}`);
    });
    console.log('\n💡 Create a .env file with these values or set them as environment variables.\n');
  } else {
    console.log('✅ All required configurations are set!\n');
  }
  
  // Database connection instructions
  console.log('🗄️  Database Setup Instructions:');
  console.log('1. Install PostgreSQL if not already installed');
  console.log('2. Create a database:');
  console.log(`   CREATE DATABASE ${env.DB_NAME};`);
  console.log('3. Create a user (optional):');
  console.log(`   CREATE USER ${env.DB_USER} WITH PASSWORD 'your_password';`);
  console.log(`   GRANT ALL PRIVILEGES ON DATABASE ${env.DB_NAME} TO ${env.DB_USER};`);
  console.log('4. Update .env file with the correct database credentials');
  console.log('5. Run: npm run test:db-connection\n');
  
  console.log('📝 Next Steps:');
  console.log('1. Set up database');
  console.log('2. Create .env file');
  console.log('3. Test the connection: npm run test:db-connection');
  console.log('4. Create first migration: npx sequelize-cli migration:generate --name create-athletes-table');
}

// Run the check
if (require.main === module) {
  checkConfiguration();
}

export default checkConfiguration;
