/**
 * Athletes ETL Process
 */

import { BaseETLProcess } from './base-etl';
import { GoogleSheetsService } from './google-sheets-service';
import { Athlete } from '../models';
import { 
  ETLProcessConfig, 
  DataTransformationResult, 
  ETLValidationResult,
  GoogleSheetsRow 
} from './types';

export class AthletesETL extends BaseETLProcess {
  private sheetsService: GoogleSheetsService;

  constructor(config?: Partial<ETLProcessConfig>) {
    const defaultConfig: ETLProcessConfig = {
      sheetName: 'Athletes',
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
   * Extract athletes data from Google Sheets
   */
  protected async extract(): Promise<GoogleSheetsRow[]> {
    console.log(`📊 Extracting athletes data from sheet: ${this.config.sheetName}`);
    
    const data = await this.retry(async () => {
      // Use explicit range like Rowcalibur: 'Rowers!A1:Z'
      return await this.sheetsService.getSheetData(this.config.sheetName, 'A1:Z');
    });

    console.log(`✅ Extracted ${data.length} athlete records`);
    return data;
  }

  /**
   * Transform athletes data
   */
  protected async transform(data: GoogleSheetsRow[]): Promise<DataTransformationResult<any>> {
    console.log(`🔄 Transforming ${data.length} athlete records`);
    
    const transformedData: any[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const row of data) {
      try {
        const athlete = this.transformAthleteRow(row);
        if (athlete) {
          transformedData.push(athlete);
        }
      } catch (error) {
        const errorMsg = `Failed to transform athlete row: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.warn(`⚠️  ${errorMsg}`);
      }
    }

    console.log(`✅ Transformed ${transformedData.length} athlete records`);
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
   * Transform a single athlete row
   */
  private transformAthleteRow(row: GoogleSheetsRow): any | null {
    // Required fields validation
    if (!row['name'] || !row['type']) {
      throw new Error(`Missing required fields: name=${row['name']}, type=${row['type']}`);
    }

    const athlete: any = {
      name: String(row['name']).trim(),
      type: this.normalizeType(String(row['type']).trim()),
    };

    // Optional fields with transformation
    if (row['first_name']) athlete.first_name = String(row['first_name']).trim();
    if (row['last_name']) athlete.last_name = String(row['last_name']).trim();
    if (row['email']) athlete.email = String(row['email']).trim().toLowerCase();
    if (row['phone']) athlete.phone = String(row['phone']).trim();
    if (row['gender']) athlete.gender = this.normalizeGender(String(row['gender']).trim());
    if (row['birth_year']) athlete.birth_year = this.parseInteger(row['birth_year']);
    if (row['age']) athlete.age = this.parseInteger(row['age']);
    if (row['sweep_scull']) athlete.sweep_scull = this.normalizeSweepScull(String(row['sweep_scull']).trim());
    if (row['port_starboard']) athlete.port_starboard = this.normalizePortStarboard(String(row['port_starboard']).trim());
    if (row['cox_capability']) athlete.cox_capability = this.normalizeCoxCapability(String(row['cox_capability']).trim());
    if (row['bow_in_dark']) athlete.bow_in_dark = this.normalizeBowInDark(String(row['bow_in_dark']).trim());
    if (row['weight_kg']) athlete.weight_kg = this.parseDecimal(row['weight_kg']);
    if (row['height_cm']) athlete.height_cm = this.parseDecimal(row['height_cm']);
    if (row['experience_years']) athlete.experience_years = this.parseInteger(row['experience_years']);
    if (row['usra_age_category_2025']) athlete.usra_age_category_2025 = String(row['usra_age_category_2025']).trim();
    if (row['us_rowing_number']) athlete.us_rowing_number = String(row['us_rowing_number']).trim();
    if (row['emergency_contact']) athlete.emergency_contact = String(row['emergency_contact']).trim();
    if (row['emergency_contact_phone']) athlete.emergency_contact_phone = String(row['emergency_contact_phone']).trim();

    // ETL metadata
    athlete.etl_source = 'google_sheets';
    athlete.etl_last_sync = new Date();

    return athlete;
  }

  /**
   * Validate transformed data
   */
  protected async validate(data: any[]): Promise<ETLValidationResult> {
    console.log(`🔍 Validating ${data.length} athlete records`);
    
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const athlete = data[i];
      
      // Required field validation
      if (!athlete.name) {
        errors.push(`Row ${i + 1}: Missing required field 'name'`);
      }
      if (!athlete.type) {
        errors.push(`Row ${i + 1}: Missing required field 'type'`);
      }

      // Type validation
      if (athlete.type && !['Cox', 'Rower', 'Rower & Coxswain'].includes(athlete.type)) {
        errors.push(`Row ${i + 1}: Invalid type '${athlete.type}'`);
      }

      // Email validation
      if (athlete.email && !this.isValidEmail(athlete.email)) {
        warnings.push(`Row ${i + 1}: Invalid email format '${athlete.email}'`);
      }

      // Weight validation
      if (athlete.weight_kg && (athlete.weight_kg < 0 || athlete.weight_kg > 1000)) {
        warnings.push(`Row ${i + 1}: Unusual weight value '${athlete.weight_kg}'`);
      }

      // Age validation
      if (athlete.age && (athlete.age < 0 || athlete.age > 150)) {
        warnings.push(`Row ${i + 1}: Unusual age value '${athlete.age}'`);
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
   * Load athletes data to database
   */
  protected async load(data: any[]): Promise<{ recordsCreated: number; recordsUpdated: number; recordsFailed: number }> {
    console.log(`💾 Loading ${data.length} athlete records to database`);
    
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;

    await this.processBatch(data, this.config.batchSize, async (batch) => {
      for (const athleteData of batch) {
        try {
          // Check if athlete already exists
          const existingAthlete = await Athlete.findOne({
            where: { name: athleteData.name }
          });

          if (existingAthlete) {
            // Update existing athlete
            await existingAthlete.update({
              ...athleteData,
              updated_at: new Date()
            });
            recordsUpdated++;
          } else {
            // Create new athlete
            await Athlete.create(athleteData);
            recordsCreated++;
          }
        } catch (error) {
          console.error(`❌ Failed to load athlete '${athleteData.name}':`, error);
          recordsFailed++;
          this.metrics.errors.push(`Failed to load athlete '${athleteData.name}': ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    });

    console.log(`✅ Load completed: ${recordsCreated} created, ${recordsUpdated} updated, ${recordsFailed} failed`);
    
    return { recordsCreated, recordsUpdated, recordsFailed };
  }

  /**
   * Get job type
   */
  protected getJobType(): 'athletes_sync' {
    return 'athletes_sync';
  }

  // Helper methods for data normalization
  private normalizeType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'cox': 'Cox',
      'rower': 'Rower',
      'rower & coxswain': 'Rower & Coxswain',
      'rower and coxswain': 'Rower & Coxswain'
    };
    return typeMap[type.toLowerCase()] || type;
  }

  private normalizeGender(gender: string): string {
    const genderMap: { [key: string]: string } = {
      'male': 'M',
      'female': 'F',
      'm': 'M',
      'f': 'F'
    };
    return genderMap[gender.toLowerCase()] || gender;
  }

  private normalizeSweepScull(sweepScull: string): string {
    const sweepScullMap: { [key: string]: string } = {
      'sweep': 'Sweep',
      'scull': 'Scull',
      'sweep & scull': 'Sweep & Scull',
      'sweep and scull': 'Sweep & Scull'
    };
    return sweepScullMap[sweepScull.toLowerCase()] || sweepScull;
  }

  private normalizePortStarboard(portStarboard: string): string {
    const portStarboardMap: { [key: string]: string } = {
      'starboard': 'Starboard',
      'port': 'Port',
      'prefer starboard': 'Prefer Starboard',
      'prefer port': 'Prefer Port',
      'either': 'Either'
    };
    return portStarboardMap[portStarboard.toLowerCase()] || portStarboard;
  }

  private normalizeCoxCapability(coxCapability: string): string {
    const coxCapabilityMap: { [key: string]: string } = {
      'no': 'No',
      'sometimes': 'Sometimes',
      'only': 'Only'
    };
    return coxCapabilityMap[coxCapability.toLowerCase()] || coxCapability;
  }

  private normalizeBowInDark(bowInDark: string): string {
    const bowInDarkMap: { [key: string]: string } = {
      'yes': 'Yes',
      'no': 'No',
      'if i have to': 'If I have to',
      'if i have too': 'If I have to'
    };
    return bowInDarkMap[bowInDark.toLowerCase()] || bowInDark;
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

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
