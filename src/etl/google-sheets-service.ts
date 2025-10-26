/**
 * Google Sheets Service for ETL Data Extraction
 */

import { google } from 'googleapis';
import { getConfig } from '../shared';
const config = getConfig();
const { env } = config;
import { GoogleSheetsRow } from './types';

export class GoogleSheetsService {
  private sheets: any;
  private spreadsheetId: string;

  constructor() {
    this.spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;
    // Initialize sheets asynchronously
    this.initializeSheets().catch(error => {
      console.error('❌ Failed to initialize Google Sheets in constructor:', error);
    });
  }

  /**
   * Initialize Google Sheets API
   */
  private async initializeSheets(): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: env.GOOGLE_SHEETS_CREDENTIALS_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });

      const authClient = await auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient as any });
      
      console.log('✅ Google Sheets API initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets API:', error);
      throw error;
    }
  }

  /**
   * Ensure Google Sheets API is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.sheets) {
      await this.initializeSheets();
    }
  }

  /**
   * Get data from a specific sheet
   */
  async getSheetData(sheetName: string, range?: string): Promise<GoogleSheetsRow[]> {
    try {
      await this.ensureInitialized();
      // Use explicit range format like Rowcalibur: 'SheetName!A1:Z'
      const fullRange = range ? `${sheetName}!${range}` : `${sheetName}!A1:Z`;
      
      console.log(`📊 Fetching data from sheet: ${fullRange}`);
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: fullRange,
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING'
      });

      const rows = response.data.values || [];
      
      if (rows.length === 0) {
        console.warn(`⚠️  No data found in sheet: ${sheetName}`);
        return [];
      }

      // Convert rows to objects using first row as headers
      const headers = rows[0];
      const dataRows = rows.slice(1);
      
      const result: GoogleSheetsRow[] = dataRows.map((row: any[]) => {
        const rowObj: GoogleSheetsRow = {};
        headers.forEach((header: string, index: number) => {
          const value = row[index];
          rowObj[header] = this.cleanValue(value);
        });
        return rowObj;
      });

      console.log(`✅ Retrieved ${result.length} rows from ${sheetName}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to get data from sheet ${sheetName}:`, error);
      throw error;
    }
  }

  /**
   * Get raw sheet data without header processing
   */
  async getRawSheetData(sheetName: string, range?: string): Promise<any> {
    try {
      await this.ensureInitialized();
      const fullRange = range ? `${sheetName}!${range}` : `${sheetName}!A1:Z`;
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: fullRange,
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING'
      });

      return response;
      
    } catch (error) {
      console.error(`❌ Failed to get raw data from sheet ${sheetName}:`, error);
      throw error;
    }
  }

  /**
   * Get sheet metadata
   */
  async getSheetMetadata(): Promise<any> {
    try {
      await this.ensureInitialized();
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      return {
        title: response.data.properties?.title,
        sheets: response.data.sheets?.map((sheet: any) => ({
          title: sheet.properties?.title,
          sheetId: sheet.properties?.sheetId,
          rowCount: sheet.properties?.gridProperties?.rowCount,
          columnCount: sheet.properties?.gridProperties?.columnCount
        }))
      };
    } catch (error) {
      console.error('❌ Failed to get sheet metadata:', error);
      throw error;
    }
  }

  /**
   * Get specific columns from a sheet
   */
  async getSheetColumns(sheetName: string, columns: string[]): Promise<GoogleSheetsRow[]> {
    try {
      const allData = await this.getSheetData(sheetName);
      
      // Filter to only include specified columns
      return allData.map(row => {
        const filteredRow: GoogleSheetsRow = {};
        columns.forEach(column => {
          if (column in row) {
            filteredRow[column] = row[column];
          }
        });
        return filteredRow;
      });
    } catch (error) {
      console.error(`❌ Failed to get columns from sheet ${sheetName}:`, error);
      throw error;
    }
  }

  /**
   * Get data with specific filters
   */
  async getFilteredData(
    sheetName: string, 
    filters: { [key: string]: any }
  ): Promise<GoogleSheetsRow[]> {
    try {
      const allData = await this.getSheetData(sheetName);
      
      return allData.filter(row => {
        return Object.entries(filters).every(([key, value]) => {
          return row[key] === value;
        });
      });
    } catch (error) {
      console.error(`❌ Failed to get filtered data from sheet ${sheetName}:`, error);
      throw error;
    }
  }

  /**
   * Clean and normalize cell values
   */
  private cleanValue(value: any): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Handle numbers
    if (typeof value === 'number') {
      return value;
    }

    // Handle strings
    if (typeof value === 'string') {
      const trimmed = value.trim();
      
      // Try to parse as number
      if (trimmed && !isNaN(Number(trimmed)) && !isNaN(parseFloat(trimmed))) {
        return parseFloat(trimmed);
      }
      
      // Handle boolean-like strings
      if (trimmed.toLowerCase() === 'true') return true;
      if (trimmed.toLowerCase() === 'false') return false;
      
      // Handle date strings
      if (this.isDateString(trimmed)) {
        return new Date(trimmed);
      }
      
      return trimmed;
    }

    // Handle dates
    if (value instanceof Date) {
      return value;
    }

    return value;
  }

  /**
   * Check if string is a date
   */
  private isDateString(str: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$|^\d{2}-\d{2}-\d{4}$/;
    return dateRegex.test(str) && !isNaN(Date.parse(str));
  }

  /**
   * Validate sheet exists
   */
  async validateSheet(sheetName: string): Promise<boolean> {
    try {
      const metadata = await this.getSheetMetadata();
      return metadata.sheets.some((sheet: any) => sheet.title === sheetName);
    } catch (error) {
      console.error(`❌ Failed to validate sheet ${sheetName}:`, error);
      return false;
    }
  }

  /**
   * Get sheet headers
   */
  async getSheetHeaders(sheetName: string): Promise<string[]> {
    try {
      await this.ensureInitialized();
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!1:1`
      });

      const headers = response.data.values?.[0] || [];
      return headers.map((header: string) => header.trim());
    } catch (error) {
      console.error(`❌ Failed to get headers from sheet ${sheetName}:`, error);
      throw error;
    }
  }

  /**
   * Test connection to Google Sheets
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getSheetMetadata();
      console.log('✅ Google Sheets connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Google Sheets connection test failed:', error);
      return false;
    }
  }

  /**
   * Find column index by searching for possible header names (like Rowcalibur)
   */
  findColumnIndex(headerRow: any[], possibleNames: string[]): number {
    for (let i = 0; i < headerRow.length; i++) {
      const header = String(headerRow[i] || '').toLowerCase();
      for (const name of possibleNames) {
        if (header.includes(name.toLowerCase())) {
          return i;
        }
      }
    }
    return -1;
  }
}
