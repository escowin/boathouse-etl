#!/usr/bin/env ts-node

/**
 * Debug USRA Categories Data
 */

import { GoogleSheetsService } from '../etl/google-sheets-service';
import { DatabaseUtils } from '../utils/database';

async function debugUsraCategories() {
  console.log('🔍 Debugging USRA Categories Data');
  console.log('=' .repeat(50));

  try {
    // Initialize database connection
    const isInitialized = await DatabaseUtils.initialize();
    if (!isInitialized) {
      throw new Error('Failed to initialize database connection');
    }

    // Create Google Sheets service
    const sheetsService = new GoogleSheetsService();
    
    // Test connection first
    console.log('🔍 Testing Google Sheets connection...');
    const connectionTest = await sheetsService.testConnection();
    if (!connectionTest) {
      throw new Error('Google Sheets connection failed');
    }
    console.log('✅ Google Sheets connection successful\n');

    // Get USRA Categories data from H:J range
    console.log('📊 Fetching USRA Categories data from Boats!H:J...');
    const data = await sheetsService.getSheetData('Boats', 'H:J');
    
    console.log(`✅ Retrieved ${data.length} rows from Boats!H:J`);
    console.log('');

    if (data.length === 0) {
      console.log('⚠️  No data found in H:J range');
      return;
    }

    // Show all rows in detail
    console.log('📋 All Rows in H:J Range:');
    console.log('=' .repeat(80));
    
    data.forEach((row, index) => {
      console.log(`\nRow ${index + 1}:`);
      console.log(`  Start Age: "${row['Start Age']}" (type: ${typeof row['Start Age']})`);
      console.log(`  Upper Age: "${row['Upper Age']}" (type: ${typeof row['Upper Age']})`);
      console.log(`  USRA Category: "${row['USRA Category']}" (type: ${typeof row['USRA Category']})`);
      
      // Check if this looks like valid data
      const startAge = row['Start Age'];
      const endAge = row['Upper Age'];
      const category = row['USRA Category'];
      
      if (startAge && endAge && category && 
          !isNaN(Number(startAge)) && !isNaN(Number(endAge)) && 
          String(category).trim() !== '') {
        console.log(`  ✅ VALID DATA: ${startAge}-${endAge} years: ${category}`);
      } else {
        console.log(`  ❌ INVALID DATA: Skipped`);
      }
    });

    // Show summary
    console.log('\n📊 Data Summary:');
    console.log('=' .repeat(50));
    console.log(`Total rows: ${data.length}`);
    
    const validRows = data.filter(row => {
      const startAge = row['Start Age'];
      const endAge = row['Upper Age'];
      const category = row['USRA Category'];
      
      return startAge && endAge && category && 
             !isNaN(Number(startAge)) && !isNaN(Number(endAge)) && 
             String(category).trim() !== '';
    });
    
    console.log(`Valid USRA Category rows: ${validRows.length}`);
    
    if (validRows.length > 0) {
      console.log('\n✅ Valid USRA Categories:');
      validRows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row['Start Age']}-${row['Upper Age']} years: ${row['USRA Category']}`);
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await DatabaseUtils.cleanup();
  }
}

// Run the debug
if (require.main === module) {
  debugUsraCategories();
}

export default debugUsraCategories;
