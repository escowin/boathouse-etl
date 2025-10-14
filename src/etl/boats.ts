/**
 * Boats ETL Process
 */

import { BaseETLProcess } from './base-etl';
import { GoogleSheetsService } from './google-sheets-service';
import { Boat } from '../models';
import { 
  ETLProcessConfig, 
  DataTransformationResult, 
  ETLValidationResult,
  GoogleSheetsRow 
} from './types';

export class BoatsETL extends BaseETLProcess {
  private sheetsService: GoogleSheetsService;

  constructor(config?: Partial<ETLProcessConfig>) {
    const defaultConfig: ETLProcessConfig = {
      sheetName: 'Boats',
      primaryKey: 'name',
      batchSize: 50,
      retryAttempts: 3,
      retryDelayMs: 1000,
      dryRun: false
    };

    super({ ...defaultConfig, ...config });
    this.sheetsService = new GoogleSheetsService();
  }

  /**
   * Extract boats data from Google Sheets
   */
  protected async extract(): Promise<GoogleSheetsRow[]> {
    console.log(`📊 Extracting boats data from sheet: ${this.config.sheetName}`);
    
    const data = await this.retry(async () => {
      // Use explicit range like Rowcalibur: 'Boats!A1:Z'
      return await this.sheetsService.getSheetData(this.config.sheetName, 'A1:Z');
    });

    console.log(`✅ Extracted ${data.length} boat records`);
    return data;
  }

  /**
   * Transform boats data
   */
  protected async transform(data: GoogleSheetsRow[]): Promise<DataTransformationResult<any>> {
    console.log(`🔄 Transforming ${data.length} boat records`);
    
    const transformedData: any[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const row of data) {
      try {
        const boat = this.transformBoatRow(row);
        if (boat) {
          transformedData.push(boat);
        }
      } catch (error) {
        const errorMsg = `Failed to transform boat row: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.warn(`⚠️  ${errorMsg}`);
      }
    }

    console.log(`✅ Transformed ${transformedData.length} boat records`);
    if (errors.length > 0) {
      console.warn(`⚠️  ${errors.length} transformation errors`);
    }

    return {
      data: transformedData,
      errors,
      warnings
    };
  }

  /**
   * Transform a single boat row
   */
  private transformBoatRow(row: GoogleSheetsRow): any | null {
    // Required fields validation
    if (!row['name'] || !row['type']) {
      throw new Error(`Missing required fields: name=${row['name']}, type=${row['type']}`);
    }

    const boat: any = {
      name: String(row['name']).trim(),
      type: this.normalizeType(String(row['type']).trim()),
    };

    // Optional fields with transformation
    if (row['status']) boat.status = this.normalizeStatus(String(row['status']).trim());
    if (row['min_weight_kg']) boat.min_weight_kg = this.parseDecimal(row['min_weight_kg']);
    if (row['max_weight_kg']) boat.max_weight_kg = this.parseDecimal(row['max_weight_kg']);
    if (row['manufacturer']) boat.manufacturer = String(row['manufacturer']).trim();
    if (row['year_built']) boat.year_built = this.parseInteger(row['year_built']);
    if (row['rigging_type']) boat.rigging_type = String(row['rigging_type']).trim();
    if (row['notes']) boat.notes = String(row['notes']).trim();

    // ETL metadata
    boat.etl_source = 'google_sheets';
    boat.etl_last_sync = new Date();

    return boat;
  }

  /**
   * Validate transformed data
   */
  protected async validate(data: any[]): Promise<ETLValidationResult> {
    console.log(`🔍 Validating ${data.length} boat records`);
    
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const boat = data[i];
      
      // Required field validation
      if (!boat.name) {
        errors.push(`Row ${i + 1}: Missing required field 'name'`);
      }
      if (!boat.type) {
        errors.push(`Row ${i + 1}: Missing required field 'type'`);
      }

      // Type validation
      if (boat.type && !['Single', 'Double', 'Pair', 'Quad', 'Four', 'Eight'].includes(boat.type)) {
        errors.push(`Row ${i + 1}: Invalid type '${boat.type}'`);
      }

      // Status validation
      if (boat.status && !['Available', 'Reserved', 'In Use', 'Maintenance', 'Retired'].includes(boat.status)) {
        errors.push(`Row ${i + 1}: Invalid status '${boat.status}'`);
      }

      // Weight validation
      if (boat.min_weight_kg && boat.max_weight_kg && boat.min_weight_kg > boat.max_weight_kg) {
        warnings.push(`Row ${i + 1}: min_weight_kg (${boat.min_weight_kg}) is greater than max_weight_kg (${boat.max_weight_kg})`);
      }

      if (boat.min_weight_kg && (boat.min_weight_kg < 0 || boat.min_weight_kg > 1000)) {
        warnings.push(`Row ${i + 1}: Unusual min_weight_kg value '${boat.min_weight_kg}'`);
      }

      if (boat.max_weight_kg && (boat.max_weight_kg < 0 || boat.max_weight_kg > 1000)) {
        warnings.push(`Row ${i + 1}: Unusual max_weight_kg value '${boat.max_weight_kg}'`);
      }

      // Year validation
      if (boat.year_built && (boat.year_built < 1800 || boat.year_built > new Date().getFullYear() + 1)) {
        warnings.push(`Row ${i + 1}: Unusual year_built value '${boat.year_built}'`);
      }
    }

    console.log(`✅ Validation completed: ${errors.length} errors, ${warnings.length} warnings`);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Load boats data to database
   */
  protected async load(data: any[]): Promise<{ recordsCreated: number; recordsUpdated: number; recordsFailed: number }> {
    console.log(`💾 Loading ${data.length} boat records to database`);
    
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;

    await this.processBatch(data, this.config.batchSize, async (batch) => {
      for (const boatData of batch) {
        try {
          // Check if boat already exists
          const existingBoat = await Boat.findOne({
            where: { name: boatData.name }
          });

          if (existingBoat) {
            // Update existing boat
            await existingBoat.update({
              ...boatData,
              updated_at: new Date()
            });
            recordsUpdated++;
          } else {
            // Create new boat
            await Boat.create(boatData);
            recordsCreated++;
          }
        } catch (error) {
          console.error(`❌ Failed to load boat '${boatData.name}':`, error);
          recordsFailed++;
          this.metrics.errors.push(`Failed to load boat '${boatData.name}': ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    });

    console.log(`✅ Load completed: ${recordsCreated} created, ${recordsUpdated} updated, ${recordsFailed} failed`);
    
    return { recordsCreated, recordsUpdated, recordsFailed };
  }

  /**
   * Get job type
   */
  protected getJobType(): 'boats_sync' {
    return 'boats_sync';
  }

  // Helper methods for data normalization
  private normalizeType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'single': 'Single',
      'double': 'Double',
      'pair': 'Pair',
      'quad': 'Quad',
      'four': 'Four',
      'eight': 'Eight',
      '1x': 'Single',
      '2x': 'Double',
      '2-': 'Pair',
      '4x': 'Quad',
      '4+': 'Four',
      '4-': 'Four',
      '8+': 'Eight'
    };
    return typeMap[type.toLowerCase()] || type;
  }

  private normalizeStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'available': 'Available',
      'reserved': 'Reserved',
      'in use': 'In Use',
      'maintenance': 'Maintenance',
      'retired': 'Retired',
      'active': 'Available',
      'inactive': 'Maintenance'
    };
    return statusMap[status.toLowerCase()] || status;
  }

  private parseInteger(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? null : parsed;
  }

  private parseDecimal(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? null : parsed;
  }
}
