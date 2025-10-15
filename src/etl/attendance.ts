/**
 * Attendance ETL Process
 * Extracts attendance data from the Attendance sheet (rows 6-142)
 * Maps attendance statuses and tracks athlete activity
 */

import { BaseETLProcess } from './base-etl';
import { GoogleSheetsService } from './google-sheets-service';
import { ETLProcessConfig, DataTransformationResult, ETLValidationResult } from './types';
import { Attendance, Athlete, PracticeSession } from '../models';

export class AttendanceETL extends BaseETLProcess {
  private sheetsService: GoogleSheetsService;

  constructor(config: Partial<ETLProcessConfig> = {}) {
    const defaultConfig: ETLProcessConfig = {
      sheetName: 'Attendance',
      batchSize: 50,
      retryAttempts: 3,
      retryDelayMs: 1000,
      dryRun: false,
      primaryKey: 'attendance_id'
    };

    super({ ...defaultConfig, ...config });
    this.sheetsService = new GoogleSheetsService();
  }

  protected getJobType(): 'full_etl' | 'incremental_etl' | 'athletes_sync' | 'boats_sync' | 'attendance_sync' {
    return 'attendance_sync';
  }

  /**
   * Extract Attendance data from Google Sheets
   * Sheet structure: Rows = Athletes, Columns = Practice Sessions
   * A6:A14 = Coxswains, A16:A141 = Rowers
   * E2:GI4 = Practice session headers (dates/times)
   */
  protected async extract(): Promise<any[]> {
    console.log(`📊 Extracting attendance data from sheet: ${this.config.sheetName}`);
    
    const data = await this.retry(async () => {
      // Get the full attendance data range (athletes + their attendance across all practice sessions)
      const [coxswainsResponse, rowersResponse, sessionResponse] = await Promise.all([
        this.sheetsService.getRawSheetData(this.config.sheetName, 'A6:GI14'), // Coxswains with attendance
        this.sheetsService.getRawSheetData(this.config.sheetName, 'A16:GI141'), // Rowers with attendance  
        this.sheetsService.getRawSheetData(this.config.sheetName, 'E2:GI4') // Practice session headers
      ]);

      const coxswainsData = coxswainsResponse.data.values || [];
      const rowersData = rowersResponse.data.values || [];
      const sessionHeaders = sessionResponse.data.values || [];

      console.log(`✅ Retrieved ${coxswainsData.length} coxswain rows, ${rowersData.length} rower rows, and ${sessionHeaders.length} session header rows`);
      
      return {
        coxswainsData,
        rowersData,
        sessionHeaders
      };
    });

    console.log(`✅ Extracted attendance data`);
    return [data];
  }

  /**
   * Transform Attendance data
   * Maps attendance statuses according to business rules:
   * - no = No
   * - maybe = Maybe  
   * - yes = Yes
   * - boat statuses ([8] Knifton, Singles, etc) = Yes
   * - null/empty = No (but track for athlete status changes)
   */
  protected async transform(data: any[]): Promise<DataTransformationResult<any>> {
    console.log(`🔄 Transforming attendance data`);
    
    const transformedData: any[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    if (data.length === 0 || !data[0].coxswainsData || !data[0].rowersData || !data[0].sessionHeaders) {
      errors.push('No attendance data found');
      return { data: transformedData, errors, warnings };
    }

    const { coxswainsData, rowersData, sessionHeaders } = data[0];

    if (sessionHeaders.length < 3) {
      errors.push('Insufficient session header data');
      return { data: transformedData, errors, warnings };
    }

    // Extract practice sessions from session headers (same logic as PracticeSessionsETL)
    const practiceSessions = await this.extractPracticeSessions(sessionHeaders);
    
    // Get all athletes from database
    const athletes = await Athlete.findAll({
      where: { active: true }
    });
    
    // Create athlete map using name field
    const athleteMap = new Map<string, any>();
    athletes.forEach(athlete => {
      const name = athlete.getDataValue('name');
      if (name) {
        athleteMap.set(name.toLowerCase(), athlete);
      }
    });
    
    console.log(`📊 Athlete map size: ${athleteMap.size}`);
    console.log(`📊 First few athlete map keys:`, Array.from(athleteMap.keys()).slice(0, 5));

    console.log(`📊 Found ${athletes.length} athletes in database`);
    console.log(`📊 Athlete names in database:`, athletes.slice(0, 5).map(a => a.getDataValue('name')));
    console.log(`📊 First athlete object:`, JSON.stringify(athletes[0], null, 2));

    // Process coxswains (rows 6-14)
    this.processAthleteRows(coxswainsData, practiceSessions, athleteMap, transformedData, errors, warnings, 6);
    
    // Process rowers (rows 16-141)
    this.processAthleteRows(rowersData, practiceSessions, athleteMap, transformedData, errors, warnings, 16);

    console.log(`✅ Transformed ${transformedData.length} attendance records`);
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
   * Process athlete rows (either coxswains or rowers)
   * Each row represents one athlete, columns represent practice sessions
   */
  private processAthleteRows(
    athleteRows: any[][],
    practiceSessions: any[],
    athleteMap: Map<string, any>,
    transformedData: any[],
    errors: string[],
    warnings: string[],
    startRowNumber: number
  ): void {
    for (let rowIndex = 0; rowIndex < athleteRows.length; rowIndex++) {
      const athleteRow = athleteRows[rowIndex];
      const actualRowNumber = startRowNumber + rowIndex;
      
      if (!athleteRow || athleteRow.length === 0) {
        continue; // Skip empty rows
      }

      // First column (A) contains athlete name
      const athleteName = athleteRow[0];
      if (!athleteName || typeof athleteName !== 'string') {
        warnings.push(`Row ${actualRowNumber}: No athlete name found`);
        continue;
      }

      // Debug logging for first few rows
      if (rowIndex < 3) {
        console.log(`📊 Sheet athlete name: "${athleteName}" (row ${actualRowNumber})`);
      }

      const athlete = athleteMap.get(athleteName.toLowerCase());
      if (!athlete) {
        warnings.push(`Row ${actualRowNumber}: Athlete not found in database: ${athleteName}`);
        if (rowIndex < 3) {
          console.log(`❌ No match found for "${athleteName}"`);
        }
        continue;
      }

      if (rowIndex < 3) {
        console.log(`✅ Matched "${athleteName}" to athlete ${athlete.getDataValue('athlete_id')}`);
      }

      // Process attendance for each practice session
      // Attendance data starts at column E (index 4), same as practice sessions
      for (let colIndex = 0; colIndex < practiceSessions.length; colIndex++) {
        const session = practiceSessions[colIndex];
        const attendanceCell = athleteRow[colIndex + 4]; // Offset by 4 for columns A-D

        try {
          const attendanceRecord = this.transformAttendanceRecord(
            athlete,
            session,
            attendanceCell
          );

          if (attendanceRecord) {
            transformedData.push(attendanceRecord);
          }
        } catch (error) {
          const errorMsg = `Failed to transform attendance for ${athleteName} at session ${session.date}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.warn(`⚠️  ${errorMsg}`);
        }
      }
    }
  }

  /**
   * Extract practice sessions from session header rows
   * Reuses logic from PracticeSessionsETL
   */
  private async extractPracticeSessions(sessionRows: any[]): Promise<any[]> {
    const sessions: any[] = [];
    
    const dateRow = sessionRows[0];    // E2:GI2 (dates like "January 1")
    const timeRow = sessionRows[1];    // E3:GI3 (times like "6:15 AM") 
    const datetimeRow = sessionRows[2]; // E4:GI4 (datetime like "1/1/2025 6:15:00")

    const maxLength = Math.max(
      dateRow ? dateRow.length : 0,
      datetimeRow ? datetimeRow.length : 0
    );
    
    for (let colIndex = 0; colIndex < maxLength; colIndex++) {
      const sessionData = this.transformSessionRow(dateRow, timeRow, datetimeRow, colIndex);
      if (sessionData) {
        // Find the actual practice session in the database
        const practiceSession = await PracticeSession.findOne({
          where: {
            date: sessionData.date,
            start_time: sessionData.start_time
          }
        });
        
        if (practiceSession) {
          sessions.push({
            session_id: practiceSession.getDataValue('session_id'),
            date: sessionData.date,
            start_time: sessionData.start_time,
            end_time: sessionData.end_time
          });
        } else {
          console.warn(`⚠️  Practice session not found in database: ${sessionData.date} ${sessionData.start_time}`);
        }
      }
    }

    return sessions;
  }

  /**
   * Transform a single practice session column (reused from PracticeSessionsETL)
   */
  private transformSessionRow(dateRow: any, timeRow: any, datetimeRow: any, colIndex: number): any | null {
    const dateCell = dateRow?.[colIndex];
    const timeCell = timeRow?.[colIndex];
    const datetimeCell = datetimeRow?.[colIndex];

    if (!dateCell && !datetimeCell) {
      return null;
    }

    let sessionDate: Date;
    let sessionTime: string;

    if (datetimeCell) {
      try {
        const parsedDate = new Date(datetimeCell);
        if (!isNaN(parsedDate.getTime())) {
          sessionDate = parsedDate;
          sessionTime = parsedDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
        } else {
          throw new Error('Invalid datetime format');
        }
      } catch (error) {
        const parsed = this.parseDateAndTime(dateCell, timeCell);
        if (!parsed) return null;
        sessionDate = parsed.date;
        sessionTime = parsed.time;
      }
    } else {
      const parsed = this.parseDateAndTime(dateCell, timeCell);
      if (!parsed) return null;
      sessionDate = parsed.date;
      sessionTime = parsed.time;
    }

    // Handle missing or invalid time values (HOC, empty, etc.)
    if (!sessionTime || sessionTime.trim() === '' || sessionTime === 'HOC') {
      sessionTime = '6:15 AM'; // Default time for missing values or HOC
    }

    return {
      date: sessionDate.toISOString().split('T')[0],
      start_time: sessionTime
    };
  }

  /**
   * Parse date and time from separate cells (reused from PracticeSessionsETL)
   */
  private parseDateAndTime(dateCell: any, timeCell: any): { date: Date; time: string } | null {
    if (!dateCell || !timeCell) {
      return null;
    }

    const dateMatch = String(dateCell || '').match(/(\w+)\s+(\d+)/);
    if (!dateMatch) {
      return null;
    }

    const month = dateMatch[1] || '';
    const day = parseInt(dateMatch[2] || '0');
    const year = new Date().getFullYear();

    const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December']
                       .indexOf(month);
    
    if (monthIndex === -1) {
      return null;
    }
    
    const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const sessionDate = new Date(date);
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
   * Transform a single attendance record
   * Maps attendance status according to business rules
   */
  private transformAttendanceRecord(
    athlete: any,
    session: any,
    attendanceCell: any
  ): any | null {
    // Map attendance status according to business rules
    const status = this.mapAttendanceStatus(attendanceCell);
    
    // Skip if no valid status could be determined
    if (!status) {
      return null;
    }

    return {
      athlete_id: athlete.getDataValue('athlete_id'), // This is the UUID from our database
      session_date: session.date,
      session_start_time: session.start_time,
      status: status.status, // Can be null for no-response tracking
      notes: status.notes || undefined,
      team_id: 1, // Mens Masters team
      etl_source: 'google_sheets',
      etl_last_sync: new Date()
    };
  }

  /**
   * Map attendance cell value to attendance status
   * Business rules:
   * - no = No (explicitly marked as no)
   * - maybe = Maybe  
   * - yes = Yes
   * - boat statuses ([8] Knifton, Singles, etc) = Yes
   * - null/empty = null (preserved for activity tracking)
   */
  private mapAttendanceStatus(attendanceCell: any): { status: string | null; notes?: string } | null {
    // Handle null/empty values - preserve as null for activity tracking
    if (!attendanceCell || attendanceCell === '' || attendanceCell === null || attendanceCell === undefined) {
      return { 
        status: null,
        notes: 'No response (null/empty) - used for activity tracking'
      };
    }

    const cellValue = String(attendanceCell).trim().toLowerCase();

    // Direct status mappings
    if (cellValue === 'no') {
      return { status: 'No' };
    }
    
    if (cellValue === 'maybe') {
      return { status: 'Maybe' };
    }
    
    if (cellValue === 'yes') {
      return { status: 'Yes' };
    }

    // Boat status patterns (convert to Yes)
    // Patterns like: [8] Knifton, Singles, Doubles, Quads, Eights, etc.
    if (this.isBoatStatus(cellValue)) {
      return { 
        status: 'Yes',
        notes: `Boat assignment: ${String(attendanceCell).trim()}`
      };
    }

    // If we can't determine the status, default to No
    console.warn(`⚠️  Unknown attendance status: "${attendanceCell}", defaulting to No`);
    return { status: 'No' };
  }

  /**
   * Check if a cell value represents a boat status/assignment
   */
  private isBoatStatus(value: string): boolean {
    // Common boat status patterns
    const boatPatterns = [
      /^\[?\d+\]?\s*/, // [8] or 8
      /singles?/i,
      /doubles?/i,
      /quads?/i,
      /eights?/i,
      /pairs?/i,
      /fours?/i,
      /cox/i,
      /scull/i,
      /sweep/i
    ];

    return boatPatterns.some(pattern => pattern.test(value));
  }

  /**
   * Validate Attendance data
   */
  protected async validate(data: any[]): Promise<ETLValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const attendance = data[i];

      // Validate required fields
      if (!attendance.athlete_id || typeof attendance.athlete_id !== 'string') {
        errors.push(`Attendance ${i + 1}: Invalid athlete_id`);
      }

      if (!attendance.session_date || typeof attendance.session_date !== 'string') {
        errors.push(`Attendance ${i + 1}: Invalid session_date`);
      }

      if (!attendance.session_start_time || typeof attendance.session_start_time !== 'string') {
        errors.push(`Attendance ${i + 1}: Invalid session_start_time`);
      }

      if (attendance.status !== null && !['Yes', 'No', 'Maybe', 'Late', 'Excused'].includes(attendance.status)) {
        errors.push(`Attendance ${i + 1}: Invalid status: ${attendance.status}`);
      }

      // Validate date format
      if (attendance.session_date && !/^\d{4}-\d{2}-\d{2}$/.test(attendance.session_date)) {
        errors.push(`Attendance ${i + 1}: Invalid date format (expected YYYY-MM-DD)`);
      }

      // Check for duplicate attendance records
      const duplicateRecords = data.filter(a => 
        a.athlete_id === attendance.athlete_id && 
        a.session_date === attendance.session_date &&
        a.session_start_time === attendance.session_start_time
      );
      if (duplicateRecords.length > 1) {
        warnings.push(`Attendance ${i + 1}: Duplicate attendance record found`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Load Attendance data to database
   */
  protected async load(data: any[]): Promise<{ recordsCreated: number; recordsUpdated: number; recordsFailed: number }> {
    if (this.config.dryRun) {
      console.log('🔍 DRY RUN: Would load attendance data');
      return { recordsCreated: data.length, recordsUpdated: 0, recordsFailed: 0 };
    }

    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;

    await this.processBatch(data, this.config.batchSize, async (batch: any[]) => {
      for (const attendanceData of batch) {
        try {
          // Find the practice session by date and start_time
          const session = await PracticeSession.findOne({
            where: {
              date: attendanceData.session_date,
              start_time: attendanceData.session_start_time
            }
          });

          if (!session) {
            console.warn(`⚠️  Practice session not found for ${attendanceData.session_date} ${attendanceData.session_start_time}`);
            recordsFailed++;
            continue;
          }

          // Check if attendance record already exists
          const [attendance, created] = await Attendance.findOrCreate({
            where: { 
              session_id: session.session_id,
              athlete_id: attendanceData.athlete_id
            },
            defaults: {
              session_id: session.session_id,
              athlete_id: attendanceData.athlete_id,
              status: attendanceData.status,
              notes: attendanceData.notes,
              team_id: attendanceData.team_id,
              etl_source: attendanceData.etl_source,
              etl_last_sync: attendanceData.etl_last_sync
            } as any
          });

          if (!created) {
            // Update existing attendance record if needed
            const needsUpdate = 
              attendance.status !== attendanceData.status ||
              attendance.notes !== attendanceData.notes;

            if (needsUpdate) {
              await attendance.update({
                status: attendanceData.status,
                notes: attendanceData.notes,
                etl_last_sync: new Date()
              });
              recordsUpdated++;
            }
          } else {
            recordsCreated++;
          }
        } catch (error) {
          recordsFailed++;
          console.error(`❌ Failed to load attendance record:`, error);
        }
      }
    });

    return { recordsCreated, recordsUpdated, recordsFailed };
  }
}
