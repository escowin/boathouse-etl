/**
 * USRA Categories ETL Process
 */

import { BaseETLProcess } from './base-etl';
import { GoogleSheetsService } from './google-sheets-service';
import { GoogleSheetsRow, DataTransformationResult, ETLValidationResult, ETLProcessConfig } from './types';
import { UsraCategory } from '../models';

export class UsraCategoriesETL extends BaseETLProcess {
  private sheetsService: GoogleSheetsService;

  constructor(config: Partial<ETLProcessConfig> = {}) {
    const defaultConfig: ETLProcessConfig = {
      sheetName: 'Boats',
      batchSize: 50,
      retryAttempts: 3,
      retryDelayMs: 1000,
      dryRun: false
    };

    super({ ...defaultConfig, ...config });
    this.sheetsService = new GoogleSheetsService();
  }

  /**
   * Extract USRA Categories data from Google Sheets (H:J range)
   */
  protected async extract(): Promise<GoogleSheetsRow[]> {
    console.log(`📊 Extracting USRA Categories data from sheet: ${this.config.sheetName}`);
    
    const data = await this.retry(async () => {
      // Use H:J range for USRA Categories data (like Rowcalibur uses H3:J18)
      return await this.sheetsService.getSheetData(this.config.sheetName, 'H:J');
    });

    console.log(`✅ Extracted ${data.length} USRA Categories records`);
    return data;
  }

  /**
   * Transform USRA Categories data
   */
  protected async transform(data: GoogleSheetsRow[]): Promise<DataTransformationResult<any>> {
    console.log(`🔄 Transforming ${data.length} USRA Categories records`);
    
    const transformedData: any[] = [];
    const errors: string[] = [];

    for (const row of data) {
      try {
        const category = this.transformUsraCategoryRow(row);
        if (category) {
          transformedData.push(category);
        }
      } catch (error) {
        const errorMsg = `Failed to transform USRA Category row: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.warn(`⚠️  ${errorMsg}`);
      }
    }

    console.log(`✅ Transformed ${transformedData.length} USRA Categories records`);
    return {
      data: transformedData,
      errors
    };
  }

  /**
   * Transform a single USRA Category row
   */
  private transformUsraCategoryRow(row: GoogleSheetsRow): any | null {
    // Convert row to array format for processing
    const rowArray = this.convertRowToArray(row);
    
    // Each row should have: [startAge, endAge, category]
    if (rowArray.length >= 3 && !isNaN(Number(rowArray[0])) && !isNaN(Number(rowArray[1]))) {
      const startAge = Number(rowArray[0]);
      const endAge = Number(rowArray[1]);
      const category = String(rowArray[2]).trim();

      if (startAge >= 0 && endAge >= startAge && category) {
        return {
          start_age: startAge,
          end_age: endAge,
          category: category
        };
      }
    }

    return null;
  }

  /**
   * Convert GoogleSheetsRow to array format for processing
   */
  private convertRowToArray(row: GoogleSheetsRow): any[] {
    // Convert the row object to an array format
    // For USRA Categories, we need to map the H, I, J columns
    const array: any[] = [];
    
    // Map the row properties to array indices
    // This is a simplified mapping - we'll need to adjust based on actual data structure
    if (row['Start Age'] !== undefined) array[0] = row['Start Age'];
    if (row['End Age'] !== undefined) array[1] = row['End Age'];
    if (row['Category'] !== undefined) array[2] = row['Category'];
    
    return array;
  }

  /**
   * Validate USRA Categories data
   */
  protected async validate(data: any[]): Promise<ETLValidationResult> {
    const errors: string[] = [];

    if (data.length === 0) {
      errors.push('No USRA Categories data found');
    }

    // Validate each category
    for (const category of data) {
      if (!category.start_age || category.start_age < 0) {
        errors.push(`Invalid start_age: ${category.start_age}`);
      }
      if (!category.end_age || category.end_age < category.start_age) {
        errors.push(`Invalid end_age: ${category.end_age} for start_age: ${category.start_age}`);
      }
      if (!category.category || category.category.trim() === '') {
        errors.push(`Invalid category: ${category.category}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Load USRA Categories data to database
   */
  protected async load(data: any[]): Promise<{ recordsCreated: number; recordsUpdated: number; recordsFailed: number }> {
    console.log(`📥 Loading ${data.length} USRA Categories records to database`);
    
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;

    if (this.config.dryRun) {
      console.log('🔍 DRY RUN: Would load USRA Categories data');
      return { recordsCreated: data.length, recordsUpdated: 0, recordsFailed: 0 };
    }

    await this.processBatch(data, async (batch) => {
      for (const categoryData of batch) {
        try {
          // Check if category already exists
          const existingCategory = await UsraCategory.findOne({
            where: {
              start_age: categoryData.start_age,
              end_age: categoryData.end_age,
              category: categoryData.category
            }
          });

          if (existingCategory) {
            // Update existing category
            await existingCategory.update(categoryData);
            recordsUpdated++;
          } else {
            // Create new category
            await UsraCategory.create(categoryData);
            recordsCreated++;
          }
        } catch (error) {
          console.error(`❌ Failed to load USRA Category:`, error);
          recordsFailed++;
        }
      }
    });

    console.log(`✅ Loaded USRA Categories: ${recordsCreated} created, ${recordsUpdated} updated, ${recordsFailed} failed`);
    return { recordsCreated, recordsUpdated, recordsFailed };
  }

  /**
   * Get job type for ETL job record
   */
  protected getJobType(): 'full_etl' | 'incremental_etl' | 'athletes_sync' | 'boats_sync' | 'attendance_sync' {
    return 'athletes_sync'; // USRA Categories are part of athlete data
  }
}
