/**
 * Athletes ETL Process
 */

import { BaseETLProcess } from './base-etl';
import { GoogleSheetsService } from './google-sheets-service';
import { Athlete, UsraCategory } from '../models';
import { Op } from 'sequelize';
import { 
  ETLProcessConfig, 
  DataTransformationResult, 
  ETLValidationResult
} from './types';

export class AthletesETL extends BaseETLProcess {
  private sheetsService: GoogleSheetsService;

  constructor(config?: Partial<ETLProcessConfig>) {
    const defaultConfig: ETLProcessConfig = {
      sheetName: 'Rowers',
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
  protected async extract(): Promise<any[]> {
    console.log(`📊 Extracting athletes data from sheet: ${this.config.sheetName}`);
    
    const data = await this.retry(async () => {
      // Use raw data approach like Rowcalibur - get raw rows without object conversion
      const response = await this.sheetsService.getRawSheetData(this.config.sheetName, 'A1:Z');
      return response.data.values || [];
    });

    console.log(`✅ Extracted ${data.length} athlete records`);
    return data;
  }


  /**
   * Transform athletes data using dynamic column detection (like Rowcalibur)
   */
  protected async transform(data: any[]): Promise<DataTransformationResult<any>> {
    console.log(`🔄 Transforming ${data.length} athlete records`);
    
    const transformedData: any[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    if (data.length < 2) {
      errors.push('Insufficient data - need at least header row and one data row');
      return { data: transformedData, errors, warnings };
    }

    const headerRow = data[0];
    if (!headerRow) {
      errors.push('No header row found');
      return { data: transformedData, errors, warnings };
    }
    
    // Use header row directly as array (like Rowcalibur)
    const headerArray = headerRow;
    
    // Find column indices using dynamic detection (like Rowcalibur)
    const nameCol = 0; // Column A is always name
    const typeCol = this.findColumnIndex(headerArray, ['Type', 'Cox/Athlete', 'Role', 'Cox?']);
    const genderCol = this.findColumnIndex(headerArray, ['Gender', 'Sex']);
    const sweepScullCol = this.findColumnIndex(headerArray, ['Sweep/Scull', 'SweepScull', 'Style', 'Sweep & Scull']);
    const portStarboardCol = this.findColumnIndex(headerArray, ['Port/Starboard', 'PortStarboard', 'Side', 'Port or Starboard?']);
    const weightCol = this.findColumnIndex(headerArray, ['Weight', 'Wt', 'Approx Weight']);
    const emailCol = this.findColumnIndex(headerArray, ['Email', 'E-mail']);
    const phoneCol = this.findColumnIndex(headerArray, ['Phone', 'Tel', 'Phone number']);
    const experienceCol = this.findColumnIndex(headerArray, ['Experience', 'Level', 'Total years rowing?']);
    const birthYearCol = this.findColumnIndex(headerArray, ['Birth Year']);
    const usRowingNumberCol = this.findColumnIndex(headerArray, ['US Rowing #', 'USRowing #']);
    const emergencyContactCol = this.findColumnIndex(headerArray, ['Emergency Contact', 'Emergency Contacy']);
    const emergencyContactPhoneCol = this.findColumnIndex(headerArray, ['Emergency Contact #', 'Emergency Contact Phone']);
    const coxCol = this.findColumnIndex(headerArray, ['Cox?']);
    const bowInDarkCol = this.findColumnIndex(headerArray, ['Bow in Dark?']);

    // Debug: Log what columns were found
    console.log(`🔍 Column detection results:`);
    console.log(`  Header array:`, headerArray);
    console.log(`  nameCol: ${nameCol}, typeCol: ${typeCol}, genderCol: ${genderCol}`);
    console.log(`  weightCol: ${weightCol}, emailCol: ${emailCol}, phoneCol: ${phoneCol}`);
    console.log(`  experienceCol: ${experienceCol}, birthYearCol: ${birthYearCol}`);
    console.log(`  coxCol: ${coxCol}, bowInDarkCol: ${bowInDarkCol}`);

    // Process each row starting from row 2 (index 1)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      try {
        // Use row directly as array (like Rowcalibur)
        const rowArray = row;
        const athlete = await this.transformAthleteRow(rowArray, {
          nameCol, typeCol, genderCol, sweepScullCol, portStarboardCol, weightCol,
          emailCol, phoneCol, experienceCol, birthYearCol, usRowingNumberCol,
          emergencyContactCol, emergencyContactPhoneCol, coxCol, bowInDarkCol
        });
        
        if (athlete) {
          transformedData.push(athlete);
        }
      } catch (error) {
        const errorMsg = `Failed to transform athlete row ${i + 1}: ${error instanceof Error ? error.message : String(error)}`;
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
   * Transform a single athlete row using column indices
   */
  private async transformAthleteRow(row: any[], columnIndices: any): Promise<any | null> {
    const name = row[columnIndices.nameCol];
    
    // Skip empty rows, header rows, and rows without a valid name
    if (!name || name === 'Name' || name.trim() === '') {
      return null;
    }

    const athlete: any = {
      name: name.trim(),
      type: this.parseType(row[columnIndices.typeCol]),
    };

    // Optional fields with transformation
    if (columnIndices.emailCol !== -1 && row[columnIndices.emailCol]) {
      athlete.email = String(row[columnIndices.emailCol]).trim().toLowerCase();
    }
    if (columnIndices.phoneCol !== -1 && row[columnIndices.phoneCol]) {
      athlete.phone = String(row[columnIndices.phoneCol]).trim();
    }
    if (columnIndices.genderCol !== -1 && row[columnIndices.genderCol]) {
      athlete.gender = this.normalizeGender(String(row[columnIndices.genderCol]).trim());
    }
    if (columnIndices.birthYearCol !== -1 && row[columnIndices.birthYearCol]) {
      athlete.birth_year = this.parseInteger(row[columnIndices.birthYearCol]);
    }
    if (columnIndices.sweepScullCol !== -1 && row[columnIndices.sweepScullCol]) {
      athlete.sweep_scull = this.normalizeSweepScull(String(row[columnIndices.sweepScullCol]).trim());
    }
    if (columnIndices.portStarboardCol !== -1 && row[columnIndices.portStarboardCol]) {
      athlete.port_starboard = this.normalizePortStarboard(String(row[columnIndices.portStarboardCol]).trim());
    }
    if (columnIndices.coxCol !== -1 && row[columnIndices.coxCol]) {
      athlete.cox_capability = this.normalizeCoxCapability(String(row[columnIndices.coxCol]).trim());
    }
    if (columnIndices.bowInDarkCol !== -1 && row[columnIndices.bowInDarkCol]) {
      athlete.bow_in_dark = this.normalizeBowInDark(String(row[columnIndices.bowInDarkCol]).trim());
    }
    if (columnIndices.weightCol !== -1 && row[columnIndices.weightCol]) {
      // Convert weight from pounds to kilograms (1 lb = 0.453592 kg)
      const weightLbs = this.parseDecimal(row[columnIndices.weightCol]);
      if (weightLbs) {
        athlete.weight_kg = Math.round(weightLbs * 0.453592 * 100) / 100; // Round to 2 decimal places
      }
    }
    // Note: height_cm is not in Google Sheets, so we skip it (will remain null)
    if (columnIndices.experienceCol !== -1 && row[columnIndices.experienceCol]) {
      athlete.experience_years = this.parseInteger(row[columnIndices.experienceCol]);
    }
    if (columnIndices.usRowingNumberCol !== -1 && row[columnIndices.usRowingNumberCol]) {
      athlete.us_rowing_number = String(row[columnIndices.usRowingNumberCol]).trim();
    }
    if (columnIndices.emergencyContactCol !== -1 && row[columnIndices.emergencyContactCol]) {
      athlete.emergency_contact = String(row[columnIndices.emergencyContactCol]).trim();
    }
    if (columnIndices.emergencyContactPhoneCol !== -1 && row[columnIndices.emergencyContactPhoneCol]) {
      athlete.emergency_contact_phone = String(row[columnIndices.emergencyContactPhoneCol]).trim();
    }

    // Calculate age and assign USRA category
    if (athlete.birth_year) {
      const currentAge = 2025 - athlete.birth_year;
      athlete.usra_age_category_id = await this.findUsraCategoryForAge(currentAge);
    }

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
  private findColumnIndex(headerRow: any[], possibleNames: string[]): number {
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

  private parseType(value: any): 'Cox' | 'Rower' | 'Rower & Coxswain' {
    if (!value) return 'Rower'; // Default to Rower if no type specified
    
    const stringValue = String(value).toLowerCase().trim();
    
    // Handle Cox? column mapping
    if (stringValue === 'no') return 'Rower';
    if (stringValue === 'only') return 'Cox';
    if (stringValue === 'sometimes') return 'Rower & Coxswain';
    
    // Handle direct type values
    if (stringValue === 'cox') return 'Cox';
    if (stringValue === 'rower') return 'Rower';
    if (stringValue.includes('rower') && stringValue.includes('cox')) return 'Rower & Coxswain';
    
    return 'Rower'; // Default fallback
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

  /**
   * Find USRA category for a given age
   */
  private async findUsraCategoryForAge(age: number): Promise<number | null> {
    try {
      const category = await UsraCategory.findOne({
        where: {
          start_age: {
            [Op.lte]: age
          },
          end_age: {
            [Op.gte]: age
          }
        }
      });

      return category ? category.usra_category_id : null;
    } catch (error) {
      console.warn(`⚠️  Failed to find USRA category for age ${age}:`, error);
      return null;
    }
  }
}
