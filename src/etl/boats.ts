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
    console.log(`📊 Extracting boats data from sheet: ${this.config.sheetName} (range A2:E71)`);
    
    const data = await this.retry(async () => {
      // Use A2:E71 range: headers on row 2, boats data from rows 6-71
      // This includes headers and all boat data in one call
      return await this.sheetsService.getSheetData(this.config.sheetName, 'A2:E71');
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

    // Skip the first 4 rows (A2-A5) which contain headers and empty rows
    // Start from row 5 (index 4) which corresponds to A6 in the spreadsheet
    const relevantData = data.slice(4);

    // List of ignorable statuses to skip (like Rowcalibur)
    const ignorableStatuses = ['Nationals', 'HOCR', 'Coach', 'Fast-A-Sleep', 'Strength'];

    for (const row of relevantData) {
      try {
        const boat = this.transformBoatRow(row, ignorableStatuses);
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
   * Transform a single boat row (following Rowcalibur's approach)
   */
  private transformBoatRow(row: GoogleSheetsRow, ignorableStatuses: string[]): any | null {
    // Get the row data - we need to access by column index since we're using A2:E71 range
    const rowArray = this.convertRowToArray(row);
    
    if (rowArray.length < 2) {
      return null;
    }

    const name = String(rowArray[0] || '').trim();
    const detailedType = String(rowArray[1] || '').trim();
    const boatType = rowArray[2] ? String(rowArray[2]).trim() : ''; // Column C - Type (optional)
    
    // Skip empty rows
    if (name === '' || detailedType === '') {
      return null;
    }
    
    // Skip ignorable statuses (like Rowcalibur)
    if (ignorableStatuses.some(ignorable => detailedType.includes(ignorable))) {
      return null;
    }
    
    // Check if this is a pseudo-header row (e.g., "Eights", "Fours", "Quads", "Pairs", "Singles")
    if (name === detailedType && ['Eights', 'Fours', 'Quads', 'Pairs', 'Singles'].includes(name)) {
      // This is a pseudo-header row, determine the boat type
      const typeMapping: { [key: string]: string } = {
        'Eights': 'Eight',
        'Fours': 'Four', 
        'Quads': 'Quad',
        'Pairs': 'Pair',
        'Singles': 'Single'
      };
      
      const actualType = typeMapping[name];
      
      return {
        name: name,
        // Skip status field - will use default 'Available' from database
        type: actualType,
        min_weight_kg: null,
        max_weight_kg: null,
        etl_source: 'google_sheets',
        etl_last_sync: new Date()
      };
    }
    
    // Parse weight information from columns D (minWeight) and E (maxWeight)
    let minWeight: number | null = null;
    let maxWeight: number | null = null;
    
    // Column D (index 3) - minWeight
    if (rowArray[3] && rowArray[3] !== '') {
      const minWeightValue = parseFloat(String(rowArray[3]).trim());
      if (!isNaN(minWeightValue)) {
        minWeight = minWeightValue;
      }
    }
    
    // Column E (index 4) - maxWeight
    if (rowArray[4] && rowArray[4] !== '') {
      const maxWeightValue = parseFloat(String(rowArray[4]).trim());
      if (!isNaN(maxWeightValue)) {
        maxWeight = maxWeightValue;
      }
    }
    
    // Determine the actual boat type based on the Type column (Column C) first, then fall back to name/status analysis
    let actualBoatType = '';
    
    // First, check the explicit Type column (Column C)
    if (boatType === 'Double') {
      actualBoatType = 'Double';
    }
    else if (boatType === 'Quad') {
      actualBoatType = 'Quad';
    }
    else if (boatType === 'Pair') {
      actualBoatType = 'Pair';
    }
    else if (boatType === 'Four') {
      actualBoatType = 'Four';
    }
    else if (boatType === 'Eight') {
      actualBoatType = 'Eight';
    }
    else if (boatType === 'Single') {
      actualBoatType = 'Single';
    }
    // Fallback to name/status analysis if Type column doesn't match (like Rowcalibur)
    else {
      // Check if this is a double scull (2x) boat
      if ((name || '').toLowerCase().includes('double') || 
          (name || '').toLowerCase().includes('2x') || 
          (detailedType || '').toLowerCase().includes('2x') ||
          (detailedType || '').toLowerCase().includes('[2]') ||
          name === 'Doubles') {
        actualBoatType = 'Double';
      }
      // Check if this is a quad scull (4x) boat
      else if ((name || '').toLowerCase().includes('quad') || 
               (name || '').toLowerCase().includes('4x') || 
               (detailedType || '').toLowerCase().includes('4x') ||
               (detailedType || '').toLowerCase().includes('[q]') ||
               name === 'Quads') {
        actualBoatType = 'Quad';
      }
      // Check if this is a pair (2-) boat
      else if ((name || '').toLowerCase().includes('pair') || 
               (name || '').toLowerCase().includes('2-') || 
               (detailedType || '').toLowerCase().includes('2-') ||
               (detailedType || '').toLowerCase().includes('[p]') ||
               name === 'Pairs') {
        actualBoatType = 'Pair';
      }
      // Check if this is a four (4+) boat
      else if ((name || '').toLowerCase().includes('four') || 
               (name || '').toLowerCase().includes('4+') || 
               (detailedType || '').toLowerCase().includes('4+') ||
               (detailedType || '').toLowerCase().includes('[4]') ||
               name === 'Fours') {
        actualBoatType = 'Four';
      }
      // Check if this is an eight (8+) boat
      else if ((name || '').toLowerCase().includes('eight') || 
               (name || '').toLowerCase().includes('8+') || 
               (detailedType || '').toLowerCase().includes('8+') ||
               (detailedType || '').toLowerCase().includes('[8]') ||
               name === 'Eights') {
        actualBoatType = 'Eight';
      }
      // Check if this is a single (1x) boat
      else if ((name || '').toLowerCase().includes('single') || 
               (name || '').toLowerCase().includes('1x') || 
               (detailedType || '').toLowerCase().includes('1x') ||
               (detailedType || '').toLowerCase().includes('[1]') ||
               name === 'Singles') {
        actualBoatType = 'Single';
      }
    }
    
    // Skip if we couldn't determine the boat type
    if (!actualBoatType) {
      return null;
    }
    
    return {
      name: name || '',
      // Skip status field - will use default 'Available' from database
      type: actualBoatType,
      min_weight_kg: minWeight,
      max_weight_kg: maxWeight,
      etl_source: 'google_sheets',
      etl_last_sync: new Date()
    };
  }

  /**
   * Convert GoogleSheetsRow to array format for processing
   */
  private convertRowToArray(row: GoogleSheetsRow): any[] {
    // Convert the row object to an array format
    // For boats data, we need to map the actual column headers
    const array: any[] = [];
    
    // Map the row properties to array indices based on the actual headers
    // Headers: "", "Status", "Type", "Min Weight", "Max Weight"
    if (row[''] !== undefined) array[0] = row['']; // Column A (boat name - empty header)
    if (row['Status'] !== undefined) array[1] = row['Status']; // Column B (status)
    if (row['Type'] !== undefined) array[2] = row['Type']; // Column C (type)
    if (row['Min Weight'] !== undefined) array[3] = row['Min Weight']; // Column D (min weight)
    if (row['Max Weight'] !== undefined) array[4] = row['Max Weight']; // Column E (max weight)
    
    return array;
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

      // Status validation - be more flexible since status contains boat names/descriptions
      if (boat.status && typeof boat.status !== 'string') {
        errors.push(`Row ${i + 1}: Status must be a string`);
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

}
