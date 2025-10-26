/**
 * USRA Categories ETL Process
 */

import { BaseETLProcess } from './base-etl';
import { GoogleSheetsService } from './google-sheets-service';
import { GoogleSheetsRow, DataTransformationResult, ETLValidationResult, ETLProcessConfig } from './types';
import { getModels } from '../shared';
const { UsraCategory } = getModels();

export class UsraCategoriesETL extends BaseETLProcess {
  private sheetsService: GoogleSheetsService;

  constructor(config: Partial<ETLProcessConfig> = {}) {
    const defaultConfig: ETLProcessConfig = {
      sheetName: 'Boats',
      batchSize: 50,
      retryAttempts: 3,
      retryDelayMs: 1000,
      dryRun: false,
      primaryKey: 'usra_category_id'
    };

    super({ ...defaultConfig, ...config });
    this.sheetsService = new GoogleSheetsService();
  }

  /**
   * Extract USRA Categories data from Google Sheets (H7:J18 range)
   */
  protected async extract(): Promise<GoogleSheetsRow[]> {
    console.log(`📊 Extracting USRA Categories data from sheet: ${this.config.sheetName} (range H2:J18)`);
    
    const data = await this.retry(async () => {
      // Use H2:J18 range to include headers (H2:J2) and data (H7:J18)
      // This ensures the Google Sheets service can properly map the columns
      return await this.sheetsService.getSheetData(this.config.sheetName, 'H2:J18');
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

    // Skip the first 5 rows (H2-H6) which contain headers and empty rows
    // Start from row 6 (index 5) which corresponds to H7 in the spreadsheet
    const relevantData = data.slice(5);

    for (const row of relevantData) {
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

    // Add the missing (AA) 21 to 26 years category
    transformedData.push({
      start_age: 21,
      end_age: 26,
      category: '(AA) 21 to 26 years'
    });

    // Add USRowing Youth Categories
    const youthCategories = [
      { start_age: 0, end_age: 14, category: 'U15 (14 and younger)' },
      { start_age: 15, end_age: 16, category: 'U17 (16 and younger)' },
      { start_age: 17, end_age: 18, category: 'U19 (18 and younger)' },
      { start_age: 19, end_age: 20, category: 'U23 (20 and younger)' }
    ];

    transformedData.push(...youthCategories);

    console.log(`✅ Transformed ${transformedData.length} USRA Categories records (including AA category and youth categories)`);
    return {
      data: transformedData,
      errors,
      warnings: []
    };
  }

  /**
   * Transform a single USRA Category row
   */
  private transformUsraCategoryRow(row: GoogleSheetsRow): any | null {
    // Skip header rows
    if (row['Start Age'] === 'Start Age' || row['Start Age'] === 'USRA Categories') {
      return null;
    }

    // Check if we have valid data
    const startAge = row['Start Age'];
    const endAge = row['Upper Age'];
    const category = row['USRA Category'];

    // Validate that we have numeric values for ages and a category
    if (startAge && endAge && category && 
        !isNaN(Number(startAge)) && !isNaN(Number(endAge)) && 
        String(category).trim() !== '') {
      
      const startAgeNum = Number(startAge);
      const endAgeNum = Number(endAge);
      const categoryStr = String(category).trim();

      if (startAgeNum >= 0 && endAgeNum >= startAgeNum) {
        return {
          start_age: startAgeNum,
          end_age: endAgeNum,
          category: categoryStr
        };
      }
    }

    return null;
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
      if (category.start_age === undefined || category.start_age === null || category.start_age < 0) {
        errors.push(`Invalid start_age: ${category.start_age}`);
      }
      if (category.end_age === undefined || category.end_age === null || category.end_age < category.start_age) {
        errors.push(`Invalid end_age: ${category.end_age} for start_age: ${category.start_age}`);
      }
      if (!category.category || category.category.trim() === '') {
        errors.push(`Invalid category: ${category.category}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
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

    await this.processBatch(data, this.config.batchSize, async (batch: any[]) => {
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
