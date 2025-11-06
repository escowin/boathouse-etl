/**
 * Practice Sessions ETL Process
 * Extracts practice session data from the Attendance sheet
 */

import { BaseETLProcess } from './base-etl';
import { GoogleSheetsService } from './google-sheets-service';
import { ETLProcessConfig, DataTransformationResult, ETLValidationResult } from './types';
import { getModels } from '../shared';
const { PracticeSession } = getModels();

export class PracticeSessionsETL extends BaseETLProcess {
  private sheetsService: GoogleSheetsService;

  constructor(config: Partial<ETLProcessConfig> = {}) {
    const defaultConfig: ETLProcessConfig = {
      sheetName: 'Attendance',
      batchSize: 50,
      retryAttempts: 3,
      retryDelayMs: 1000,
      dryRun: false,
      primaryKey: 'session_id'
    };

    super({ ...defaultConfig, ...config });
    this.sheetsService = new GoogleSheetsService();
  }

  protected getJobType(): 'full_etl' | 'incremental_etl' | 'athletes_sync' | 'boats_sync' | 'attendance_sync' {
    return 'attendance_sync';
  }

  /**
   * Extract Practice Sessions data from Google Sheets
   * Uses E2:HY4 (datetime) as primary source with fallback to E2:HY2 + E3:HY3
   */
  protected async extract(): Promise<any[]> {
    console.log(`📊 Extracting practice sessions data from sheet: ${this.config.sheetName}`);
    
    const data = await this.retry(async () => {
      // Get raw data without header processing for practice sessions
      const response = await this.sheetsService.getRawSheetData(this.config.sheetName, 'E2:HY4');

      const rows = response.data.values || [];
      console.log(`✅ Retrieved ${rows.length} raw rows from ${this.config.sheetName}`);
      return rows;
    });

    console.log(`✅ Extracted ${data.length} practice session header rows`);
    return data;
  }

  /**
   * Transform Practice Sessions data
   * Follows Rowcalibur's approach: use datetime row (index 2) as primary, fallback to date+time parsing
   */
  protected async transform(data: any[]): Promise<DataTransformationResult<any>> {
    console.log(`🔄 Transforming practice sessions data`);
    
    const transformedData: any[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    if (data.length < 3) {
      errors.push('Insufficient data: need at least 3 rows (dates, times, datetime)');
      return { data: transformedData, errors, warnings };
    }

    // Row indices in the extracted data (E2:GI4)
    const dateRow = data[0];    // E2:GI2 (dates like "January 1")
    const timeRow = data[1];    // E3:GI3 (times like "6:15 AM") 
    const datetimeRow = data[2]; // E4:GI4 (datetime like "1/1/2025 6:15:00")

    // Process each column (each column represents a practice session)
    const maxLength = Math.max(
      dateRow ? dateRow.length : 0,
      datetimeRow ? datetimeRow.length : 0
    );
    
    for (let colIndex = 0; colIndex < maxLength; colIndex++) {
      try {
        const session = this.transformSessionRow(dateRow, timeRow, datetimeRow, colIndex);
        if (session) {
          transformedData.push(session);
        }
      } catch (error) {
        const errorMsg = `Failed to transform session at column ${colIndex}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.warn(`⚠️  ${errorMsg}`);
      }
    }

    console.log(`✅ Transformed ${transformedData.length} practice sessions`);
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
   * Transform a single practice session column
   * Follows Rowcalibur's logic: prefer datetime, fallback to date+time parsing
   */
  private transformSessionRow(dateRow: any, timeRow: any, datetimeRow: any, colIndex: number): any | null {
    const dateCell = dateRow?.[colIndex];
    const timeCell = timeRow?.[colIndex];
    const datetimeCell = datetimeRow?.[colIndex];

    // Skip if no date information available
    if (!dateCell && !datetimeCell) {
      return null;
    }

    let sessionDate: Date;
    let sessionTime: string;

    // Skip cells with #VALUE! errors - these are broken formulas that can be safely ignored
    if (datetimeCell === '#VALUE!') {
      console.log(`⏭️  Skipping column ${colIndex} due to #VALUE! error in datetime cell`);
      return null;
    }

    // Primary approach: Use datetime cell if available and valid
    if (datetimeCell && datetimeCell !== 'HOC') {
      try {
        const parsedDate = new Date(datetimeCell);
        if (!isNaN(parsedDate.getTime())) {
          sessionDate = parsedDate;
          // Extract time from datetime
          sessionTime = parsedDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
        } else {
          throw new Error('Invalid datetime format');
        }
      } catch (error) {
        // Fallback to date + time parsing
        console.warn(`⚠️  Invalid datetime at column ${colIndex}, falling back to date+time parsing`);
        const parsed = this.parseDateAndTime(dateCell, timeCell);
        if (!parsed) return null;
        sessionDate = parsed.date;
        sessionTime = parsed.time;
      }
    } else {
      // Fallback approach: Parse date and time separately
      // This handles cases where datetimeCell is 'HOC' or missing
      const parsed = this.parseDateAndTime(dateCell, timeCell);
      if (!parsed) return null;
      sessionDate = parsed.date;
      sessionTime = parsed.time;
    }

    // Handle missing or invalid time values
    if (!sessionTime || sessionTime.trim() === '' || sessionTime === 'HOC') {
      sessionTime = '6:15 AM'; // Default time for missing values or HOC
    }

    // Note: We could determine if this is an upcoming session here
    // but the PracticeSession model doesn't have an is_upcoming field

    // Determine end time based on practice time
    const endTime = this.calculateEndTime(sessionTime);

    // Determine team_id based on start time
    // If start time is 6:30 PM, use team_id = 3, otherwise use team_id = 1
    // Normalize time format for comparison (handle variations like "6:30 PM", "6:30PM", "6:30 pm")
    const normalizedTime = sessionTime.trim().replace(/\s+/g, ' ').toUpperCase();
    const teamId = normalizedTime === '6:30 PM' ? 3 : 1;

    return {
      date: sessionDate.toISOString().split('T')[0], // YYYY-MM-DD format
      start_time: sessionTime,
      end_time: endTime,
      session_type: 'Practice' as const,
      location: 'Ladybird Lake',
      team_id: teamId
    };
  }

  /**
   * Calculate end time based on start time
   * Morning practices end at 8:00 AM, evening practices end at 8:00 PM
   */
  private calculateEndTime(startTime: string): string {
    // Parse the start time to determine if it's morning or evening
    const timeMatch = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) {
      return '8:00 PM'; // Default to evening if we can't parse
    }

    const period = timeMatch[3]?.toUpperCase();

    // If it's AM (morning practice), end at 8:00 AM
    if (period === 'AM') {
      return '8:00 AM';
    }
    
    // If it's PM (evening practice), end at 8:00 PM
    return '8:00 PM';
  }

  /**
   * Parse date and time from separate cells (fallback method)
   * Follows Rowcalibur's date parsing logic
   */
  private parseDateAndTime(dateCell: any, timeCell: any): { date: Date; time: string } | null {
    if (!dateCell || !timeCell) {
      return null;
    }

    // Parse the date from the date cell (e.g., "January 1")
    const dateMatch = String(dateCell || '').match(/(\w+)\s+(\d+)/);
    if (!dateMatch) {
      return null;
    }

    const month = dateMatch[1] || '';
    const day = parseInt(dateMatch[2] || '0');

    // Get current year (like Rowcalibur does)
    const year = new Date().getFullYear();

    // Create a date string
    const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December']
                       .indexOf(month);

    if (monthIndex === -1) {
      return null;
    }

    const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const sessionDate = new Date(date);

    // Use the time from the time cell (e.g., "6:15 AM")
    let time = String(timeCell || '').trim();
    
    // Handle missing or invalid time values (HOC, empty, etc.)
    if (!time || time === 'HOC') {
      time = '6:15 AM'; // Default time for missing values or HOC
    }

    return {
      date: sessionDate,
      time: time
    };
  }

  /**
   * Validate Practice Sessions data
   */
  protected async validate(data: any[]): Promise<ETLValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const session = data[i];

      // Validate required fields
      if (!session.date || typeof session.date !== 'string') {
        errors.push(`Session ${i + 1}: Invalid date`);
      }

      if (!session.start_time || typeof session.start_time !== 'string') {
        errors.push(`Session ${i + 1}: Invalid start_time`);
      }

      if (!session.end_time || typeof session.end_time !== 'string') {
        errors.push(`Session ${i + 1}: Invalid end_time`);
      }

      // Validate date format
      if (session.date && !/^\d{4}-\d{2}-\d{2}$/.test(session.date)) {
        errors.push(`Session ${i + 1}: Invalid date format (expected YYYY-MM-DD)`);
      }

      // Validate time format (basic check)
      if (session.start_time && !/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(session.start_time)) {
        warnings.push(`Session ${i + 1}: Unusual start_time format: ${session.start_time}`);
      }

      if (session.end_time && !/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(session.end_time)) {
        warnings.push(`Session ${i + 1}: Unusual end_time format: ${session.end_time}`);
      }

      // Check for duplicate sessions
      const duplicateSessions = data.filter(s => 
        s.date === session.date && s.start_time === session.start_time
      );
      if (duplicateSessions.length > 1) {
        warnings.push(`Session ${i + 1}: Duplicate session found (${session.date} ${session.start_time})`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Load Practice Sessions data to database
   */
  protected async load(data: any[]): Promise<{ recordsCreated: number; recordsUpdated: number; recordsFailed: number }> {
    if (this.config.dryRun) {
      console.log('🔍 DRY RUN: Would load practice sessions data');
      return { recordsCreated: data.length, recordsUpdated: 0, recordsFailed: 0 };
    }

    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;

    await this.processBatch(data, this.config.batchSize, async (batch: any[]) => {
      for (const sessionData of batch) {
        try {
          // Check if session already exists (by date and start_time)
          const [session, created] = await PracticeSession.findOrCreate({
            where: { 
              date: sessionData.date,
              start_time: sessionData.start_time
            },
            defaults: sessionData
          });

          if (!created) {
            // Update existing session if needed
            const needsUpdate = 
              session.start_time !== sessionData.start_time ||
              session.end_time !== sessionData.end_time ||
              session.session_type !== sessionData.session_type;

            if (needsUpdate) {
              await session.update({
                start_time: sessionData.start_time,
                end_time: sessionData.end_time,
                session_type: sessionData.session_type
              });
              recordsUpdated++;
            }
          } else {
            recordsCreated++;
          }
        } catch (error) {
          recordsFailed++;
          console.error(`❌ Failed to load practice session ${sessionData.date} ${sessionData.start_time}:`, error);
        }
      }
    });

    return { recordsCreated, recordsUpdated, recordsFailed };
  }
}
