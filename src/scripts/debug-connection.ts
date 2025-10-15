#!/usr/bin/env ts-node

/**
 * Debug script to troubleshoot database connection issues
 * Usage: npm run debug:connection
 */

import { env } from '../config/env';

function debugConnection() {
  console.log('🔍 Debugging database connection...\n');
  
  // Check environment variables
  console.log('📊 Environment Variables:');
  console.log(`  DB_HOST: "${env.DB_HOST}" (type: ${typeof env.DB_HOST})`);
  console.log(`  DB_PORT: "${env.DB_PORT}" (type: ${typeof env.DB_PORT})`);
  console.log(`  DB_NAME: "${env.DB_NAME}" (type: ${typeof env.DB_NAME})`);
  console.log(`  DB_USER: "${env.DB_USER}" (type: ${typeof env.DB_USER})`);
  console.log(`  DB_PASSWORD: "${env.DB_PASSWORD}" (type: ${typeof env.DB_PASSWORD})`);
  console.log(`  DB_SSL: "${env.DB_SSL}" (type: ${typeof env.DB_SSL})`);
  console.log(`  NODE_ENV: "${env.NODE_ENV}" (type: ${typeof env.NODE_ENV})\n`);
  
  // Check for common issues
  console.log('🔍 Common Issues Check:');
  
  // Password issues
  if (!env.DB_PASSWORD) {
    console.log('❌ DB_PASSWORD is empty or undefined');
  } else if (typeof env.DB_PASSWORD !== 'string') {
    console.log('❌ DB_PASSWORD is not a string');
  } else {
    console.log('✅ DB_PASSWORD is a valid string');
  }
  
  // Port issues
  if (isNaN(env.DB_PORT)) {
    console.log('❌ DB_PORT is not a valid number');
  } else {
    console.log('✅ DB_PORT is a valid number');
  }
  
  // Check for whitespace or special characters
  if (env.DB_PASSWORD && env.DB_PASSWORD.trim() !== env.DB_PASSWORD) {
    console.log('⚠️  DB_PASSWORD has leading/trailing whitespace');
  }
  
  if (env.DB_PASSWORD && env.DB_PASSWORD.includes('\n')) {
    console.log('⚠️  DB_PASSWORD contains newline characters');
  }
  
  if (env.DB_PASSWORD && env.DB_PASSWORD.includes('\r')) {
    console.log('⚠️  DB_PASSWORD contains carriage return characters');
  }
  
  console.log('\n🔍 Raw Environment Variables (from process.env):');
  console.log(`  process.env.DB_HOST: "${process.env['DB_HOST']}"`);
  console.log(`  process.env.DB_PORT: "${process.env['DB_PORT']}"`);
  console.log(`  process.env.DB_NAME: "${process.env['DB_NAME']}"`);
  console.log(`  process.env.DB_USER: "${process.env['DB_USER']}"`);
  console.log(`  process.env.DB_PASSWORD: "${process.env['DB_PASSWORD']}"`);
  console.log(`  process.env.DB_SSL: "${process.env['DB_SSL']}"`);
  console.log(`  process.env.NODE_ENV: "${process.env['NODE_ENV']}"`);
  
  // Test connection string
  console.log('\n🔗 Connection String:');
  const connectionString = `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
  console.log(`  ${connectionString.replace(env.DB_PASSWORD, '***')}`);
  
  // Check if .env file exists
  console.log('\n📁 File System Check:');
  const fs = require('fs');
  const path = require('path');
  
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasPassword = envContent.includes('DB_PASSWORD=');
    console.log(`  Contains DB_PASSWORD: ${hasPassword ? '✅' : '❌'}`);
  } else {
    console.log('❌ .env file does not exist');
  }
  
  console.log('\n💡 Troubleshooting Tips:');
  console.log('1. Make sure .env file is in the project root');
  console.log('2. Check for any invisible characters in password');
  console.log('3. Try connecting with psql to verify credentials');
  console.log('4. Check if PostgreSQL is running on the correct port');
  console.log('5. Verify the database name exists');
}

// Run the debug
if (require.main === module) {
  debugConnection();
}

export default debugConnection;
