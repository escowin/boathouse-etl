#!/usr/bin/env ts-node

/**
 * Test Google Sheets Data Extraction
 * Usage: npm run test:sheets-data [sheetName]
 */

import { GoogleSheetsService } from '../etl/google-sheets-service';
import { DatabaseUtils } from '../utils/database';

async function testGoogleSheetsData() {
  const sheetName = process.argv[2] || 'Athletes';
  
  console.log('🧪 Testing Google Sheets Data Extraction');
  console.log(`📊 Sheet: ${sheetName}`);
  console.log('=' .repeat(50));

  try {
    // Initialize database connection (needed for environment loading)
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

    // Get sheet metadata
    console.log('📋 Getting sheet metadata...');
    const metadata = await sheetsService.getSheetMetadata();
    console.log('Sheet Metadata:', JSON.stringify(metadata, null, 2));
    console.log('');

    // Check if sheet exists
    const sheetExists = await sheetsService.validateSheet(sheetName);
    if (!sheetExists) {
      console.error(`❌ Sheet '${sheetName}' not found in spreadsheet`);
      console.log('Available sheets:', metadata.sheets?.map((s: any) => s.title).join(', '));
      return;
    }

    // Get sheet headers
    console.log(`📋 Getting headers for sheet '${sheetName}'...`);
    const headers = await sheetsService.getSheetHeaders(sheetName);
    console.log('Headers:', headers);
    console.log('');

    // Get sheet data
    console.log(`📊 Extracting data from sheet '${sheetName}'...`);
    const data = await sheetsService.getSheetData(sheetName);
    
    console.log(`✅ Retrieved ${data.length} rows from ${sheetName}`);
    console.log('');

    if (data.length === 0) {
      console.log('⚠️  No data found in sheet');
      return;
    }

    // Display first few rows in tabular format
    console.log('📋 Sample Data (First 10 rows):');
    console.log('=' .repeat(80));
    
    if (data.length <= 10) {
      console.table(data);
    } else {
      console.table(data.slice(0, 10));
      console.log(`\n... and ${data.length - 10} more rows`);
    }

    // Show data summary
    console.log('\n📊 Data Summary:');
    console.log('=' .repeat(50));
    console.log(`Total rows: ${data.length}`);
    console.log(`Total columns: ${headers.length}`);
    console.log(`Columns: ${headers.join(', ')}`);

    // Show data types for each column
    console.log('\n🔍 Column Data Types:');
    console.log('=' .repeat(50));
    const columnTypes: { [key: string]: string[] } = {};
    
    headers.forEach(header => {
      columnTypes[header] = [];
    });

    data.slice(0, 5).forEach((row) => {
      headers.forEach(header => {
        const value = row[header];
        const type = value === null ? 'null' : 
                    value === undefined ? 'undefined' : 
                    typeof value;
        if (columnTypes[header] && !columnTypes[header].includes(type)) {
          columnTypes[header].push(type);
        }
      });
    });

    Object.entries(columnTypes).forEach(([column, types]) => {
      console.log(`${column}: ${types.join(' | ')}`);
    });

    // Show sample values for each column
    console.log('\n📝 Sample Values (First 3 rows):');
    console.log('=' .repeat(80));
    data.slice(0, 3).forEach((row, index) => {
      console.log(`\nRow ${index + 1}:`);
      headers.forEach(header => {
        const value = row[header];
        const displayValue = value === null ? 'null' : 
                           value === undefined ? 'undefined' : 
                           String(value);
        console.log(`  ${header}: ${displayValue}`);
      });
    });

    // Check for potential data quality issues
    console.log('\n⚠️  Data Quality Check:');
    console.log('=' .repeat(50));
    
    const issues: string[] = [];
    
    // Check for empty rows
    const emptyRows = data.filter(row => 
      headers.every(header => 
        row[header] === null || 
        row[header] === undefined || 
        String(row[header]).trim() === ''
      )
    );
    
    if (emptyRows.length > 0) {
      issues.push(`${emptyRows.length} completely empty rows found`);
    }

    // Check for rows with missing key fields
    const keyFields = ['name']; // Add more key fields as needed
    const missingKeyFields = data.filter(row => 
      keyFields.some(field => 
        !row[field] || String(row[field] || '').trim() === ''
      )
    );
    
    if (missingKeyFields.length > 0) {
      issues.push(`${missingKeyFields.length} rows missing key fields (${keyFields.join(', ')})`);
    }

    if (issues.length === 0) {
      console.log('✅ No obvious data quality issues found');
    } else {
      issues.forEach(issue => console.log(`⚠️  ${issue}`));
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await DatabaseUtils.cleanup();
  }
}

// Run the test
if (require.main === module) {
  testGoogleSheetsData();
}

export default testGoogleSheetsData;
