#!/usr/bin/env ts-node

/**
 * Debug Google Sheets Raw Data
 * Usage: npm run debug:sheets [sheetName]
 */

import { google } from 'googleapis';
import { env } from '../config/env';
import { DatabaseUtils } from '../utils/database';

async function debugGoogleSheets() {
  const sheetName = process.argv[2] || 'Rowers';
  
  console.log('🔍 Debugging Google Sheets Raw Data');
  console.log(`📊 Sheet: ${sheetName}`);
  console.log('=' .repeat(50));

  try {
    // Initialize database connection (needed for environment loading)
    const isInitialized = await DatabaseUtils.initialize();
    if (!isInitialized) {
      throw new Error('Failed to initialize database connection');
    }

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      keyFile: env.GOOGLE_SHEETS_CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    console.log('✅ Google Sheets API initialized');

    // Get raw data from Google Sheets
    console.log(`📊 Fetching raw data from sheet: ${sheetName}`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: sheetName,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING'
    });

    const rows = response.data.values || [];
    console.log(`✅ Retrieved ${rows.length} raw rows`);
    
    // Debug: Show the full response structure
    console.log(`🔍 Response range: ${response.data.range}`);
    console.log(`🔍 Response majorDimension: ${response.data.majorDimension}`);
    console.log(`🔍 First row length: ${rows[0]?.length || 0}`);
    console.log(`🔍 First row:`, JSON.stringify(rows[0], null, 2));
    console.log('');

    if (rows.length === 0) {
      console.log('⚠️  No data found in sheet');
      return;
    }

    // Show raw data structure
    console.log('🔍 Raw Data Structure:');
    console.log('=' .repeat(50));
    console.log('First 5 rows (raw):');
    rows.slice(0, 5).forEach((row, index) => {
      console.log(`Row ${index + 1}:`, JSON.stringify(row));
    });
    console.log('');

    // Show headers
    const headers = rows[0] || [];
    console.log('📋 Headers (Row 1):');
    console.log('=' .repeat(50));
    headers.forEach((header, index) => {
      console.log(`Column ${index + 1}: "${header}"`);
    });
    console.log('');

    // Show data rows
    const dataRows = rows.slice(1);
    console.log('📊 Data Rows (First 3):');
    console.log('=' .repeat(50));
    dataRows.slice(0, 3).forEach((row, index) => {
      console.log(`\nData Row ${index + 1}:`);
      row.forEach((cell, cellIndex) => {
        const header = headers[cellIndex] || `Column_${cellIndex + 1}`;
        console.log(`  ${header}: "${cell}"`);
      });
    });

    // Show column analysis
    console.log('\n🔍 Column Analysis:');
    console.log('=' .repeat(50));
    headers.forEach((header, index) => {
      const columnData = dataRows.map(row => row[index]).filter(cell => cell !== undefined && cell !== '');
      console.log(`Column ${index + 1} ("${header}"): ${columnData.length} non-empty values`);
      if (columnData.length > 0) {
        console.log(`  Sample values: ${columnData.slice(0, 3).join(', ')}`);
      }
    });

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
  debugGoogleSheets();
}

export default debugGoogleSheets;
