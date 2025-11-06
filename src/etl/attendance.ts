/**
 * Attendance ETL Process
 * Extracts attendance data from the Attendance sheet (rows 6-142)
 * Maps attendance statuses and tracks athlete activity
 */

import { randomUUID } from 'crypto';
import { BaseETLProcess } from './base-etl';
import { GoogleSheetsService } from './google-sheets-service';
import { ETLProcessConfig, DataTransformationResult, ETLValidationResult } from './types';
import { getModels } from '../shared';
const { Attendance, Athlete, PracticeSession } = getModels();

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
   * E2:HY4 = Practice session headers (dates/times)
   */
  protected async extract(): Promise<any[]> {
    console.log(`📊 Extracting attendance data from sheet: ${this.config.sheetName}`);
    
    const data = await this.retry(async () => {
      // Get the full attendance data range (athletes + their attendance across all practice sessions)
      const [coxswainsResponse, rowersResponse, sessionResponse] = await Promise.all([
        this.sheetsService.getRawSheetData(this.config.sheetName, 'A6:HY14'), // Coxswains with attendance
        this.sheetsService.getRawSheetData(this.config.sheetName, 'A16:HY141'), // Rowers with attendance  
        this.sheetsService.getRawSheetData(this.config.sheetName, 'E2:HY4') // Practice session headers
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
    
    // Look up actual session_id values from database for each practice session
    const practiceSessionMap = await this.buildPracticeSessionMap(practiceSessions);
    
    // Get all athletes from database
    const athletes = await Athlete.findAll({
      where: { active: true }
    });
    
    // Create athlete map using name field
    const athleteMap = new Map<string, any>();
    athletes.forEach((athlete: any) => {
      const name = athlete.getDataValue('name');
      if (name) {
        athleteMap.set(name.toLowerCase(), athlete);
      }
    });
    
    console.log(`📊 Athlete map size: ${athleteMap.size}`);
    console.log(`📊 First few athlete map keys:`, Array.from(athleteMap.keys()).slice(0, 5));

    console.log(`📊 Found ${athletes.length} athletes in database`);
    console.log(`📊 Athlete names in database:`, athletes.slice(0, 5).map((a: any) => a.getDataValue('name')));
    console.log(`📊 First athlete object:`, JSON.stringify(athletes[0], null, 2));

    // Process coxswains (rows 6-14)
    await this.processAthleteRows(coxswainsData, practiceSessions, practiceSessionMap, athleteMap, transformedData, errors, warnings, 6);
    
    // Process rowers (rows 16-141)
    await this.processAthleteRows(rowersData, practiceSessions, practiceSessionMap, athleteMap, transformedData, errors, warnings, 16);

    console.log(`✅ Transformed ${transformedData.length} attendance records`);
    if (errors.length > 0) {
      console.warn(`⚠️  ${errors.length} transformation errors`);
      console.log(`\n📋 TRANSFORMATION ERRORS:`);
      console.log('=' .repeat(60));
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (warnings.length > 0) {
      console.warn(`⚠️  ${warnings.length} transformation warnings`);
      console.log(`\n📋 TRANSFORMATION WARNINGS:`);
      console.log('=' .repeat(60));
      warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }

    return {
      data: transformedData,
      errors,
      warnings
    };
  }

  /**
   * Build a map from (date, start_time) to actual session_id from database
   */
  private async buildPracticeSessionMap(practiceSessions: any[]): Promise<Map<string, number>> {
    const sessionMap = new Map<string, number>();
    
    // Get all practice sessions from database
    const dbSessions = await PracticeSession.findAll({
      attributes: ['session_id', 'date', 'start_time']
    });
    
    // Create map: key = "date|start_time", value = session_id
    dbSessions.forEach((session: any) => {
      const date = session.getDataValue('date');
      const startTime = session.getDataValue('start_time');
      if (date && startTime) {
        // Normalize time format for matching
        const normalizedTime = this.normalizeTime(startTime);
        const key = `${date}|${normalizedTime}`;
        sessionMap.set(key, session.getDataValue('session_id'));
      }
    });
    
    // Also try to match practice sessions from Google Sheets
    for (const session of practiceSessions) {
      const key = `${session.date}|${this.normalizeTime(session.start_time)}`;
      if (!sessionMap.has(key)) {
        // Try to find by date only (fallback)
        for (const dbSession of dbSessions) {
          const dbDate = dbSession.getDataValue('date');
          if (dbDate === session.date) {
            const dbStartTime = dbSession.getDataValue('start_time');
            const normalizedDbTime = this.normalizeTime(dbStartTime);
            const normalizedSheetTime = this.normalizeTime(session.start_time);
            if (normalizedDbTime === normalizedSheetTime) {
              sessionMap.set(key, dbSession.getDataValue('session_id'));
              break;
            }
          }
        }
      }
    }
    
    console.log(`📊 Built practice session map with ${sessionMap.size} entries`);
    return sessionMap;
  }

  /**
   * Normalize time format for matching (e.g., "6:15 AM" -> "06:15:00")
   */
  private normalizeTime(timeStr: string): string {
    if (!timeStr) return '';
    
    // If already in HH:MM:SS format, return as is
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }
    
    // Parse time formats like "6:15 AM", "6:15PM", etc.
    const match = String(timeStr).trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match && match[1] && match[2] && match[3]) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const ampm = match[3].toUpperCase();
      
      if (ampm === 'PM' && hours !== 12) {
        hours += 12;
      } else if (ampm === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return `${String(hours).padStart(2, '0')}:${minutes}:00`;
    }
    
    return timeStr;
  }

  /**
   * Process athlete rows (either coxswains or rowers)
   * Each row represents one athlete, columns represent practice sessions
   * Filters out athletes with no responses to prevent table bloat
   * Deactivates athletes with no attendance records
   */
  private async processAthleteRows(
    athleteRows: any[][],
    practiceSessions: any[],
    practiceSessionMap: Map<string, number>,
    athleteMap: Map<string, any>,
    transformedData: any[],
    errors: string[],
    warnings: string[],
    startRowNumber: number
  ): Promise<void> {
    const skippedAthletes: Array<{ name: string; row: number; reason: string; details?: any }> = [];
    const processedAthletes: Array<{ name: string; row: number; records: number }> = [];
    for (let rowIndex = 0; rowIndex < athleteRows.length; rowIndex++) {
      const athleteRow = athleteRows[rowIndex];
      const actualRowNumber = startRowNumber + rowIndex;
      
      if (!athleteRow || athleteRow.length === 0) {
        skippedAthletes.push({
          name: `Row ${actualRowNumber}`,
          row: actualRowNumber,
          reason: 'Empty row'
        });
        continue; // Skip empty rows
      }

      // First column (A) contains athlete name
      const athleteName = athleteRow[0];
      if (!athleteName || typeof athleteName !== 'string') {
        skippedAthletes.push({
          name: `Row ${actualRowNumber}`,
          row: actualRowNumber,
          reason: 'No athlete name found',
          details: { cellValue: athleteRow[0] }
        });
        warnings.push(`Row ${actualRowNumber}: No athlete name found`);
        continue;
      }

      // Trim whitespace from athlete name to fix matching issues
      const trimmedAthleteName = athleteName.trim();

      // Debug logging for first few rows
      if (rowIndex < 3) {
        console.log(`📊 Sheet athlete name: "${trimmedAthleteName}" (row ${actualRowNumber})`);
      }

      const athlete = athleteMap.get(trimmedAthleteName.toLowerCase());
      if (!athlete) {
        skippedAthletes.push({
          name: trimmedAthleteName,
          row: actualRowNumber,
          reason: 'Athlete not found in database',
          details: { 
            searchedName: trimmedAthleteName.toLowerCase(),
            availableNames: Array.from(athleteMap.keys()).slice(0, 10)
          }
        });
        warnings.push(`Row ${actualRowNumber}: Athlete not found in database: ${trimmedAthleteName}`);
        if (rowIndex < 3) {
          console.log(`❌ No match found for "${trimmedAthleteName}"`);
        }
        continue;
      }

      if (rowIndex < 3) {
        console.log(`✅ Matched "${trimmedAthleteName}" to athlete ${athlete.getDataValue('athlete_id')}`);
      }

      // Check if athlete has any non-null responses to avoid table bloat
      const hasAnyResponse = await this.athleteHasAnyResponse(athleteRow, practiceSessions.length, athlete);
      if (!hasAnyResponse) {
        skippedAthletes.push({
          name: trimmedAthleteName,
          row: actualRowNumber,
          reason: 'No attendance responses (all null/empty)',
          details: { 
            athleteId: athlete.getDataValue('athlete_id'),
            deactivated: true
          }
        });
        console.log(`⏭️  Skipping ${trimmedAthleteName} - no responses (all null/empty), athlete deactivated`);
        continue;
      }

      // Process attendance for each practice session
      // Attendance data starts at column E (index 4), same as practice sessions
      let recordsCreated = 0;
      for (let colIndex = 0; colIndex < practiceSessions.length; colIndex++) {
        const session = practiceSessions[colIndex];
        const attendanceCell = athleteRow[colIndex + 4]; // Offset by 4 for columns A-D

        try {
          // Look up actual session_id from database
          const sessionKey = `${session.date}|${this.normalizeTime(session.start_time)}`;
          const actualSessionId = practiceSessionMap.get(sessionKey);
          
          if (!actualSessionId) {
            warnings.push(`Session ${session.date} ${session.start_time} not found in database - skipping attendance record`);
            continue;
          }

          const attendanceRecord = this.transformAttendanceRecord(
            athlete,
            { ...session, session_id: actualSessionId },
            attendanceCell
          );

          if (attendanceRecord) {
            transformedData.push(attendanceRecord);
            recordsCreated++;
          }
        } catch (error) {
          const errorMsg = `Failed to transform attendance for ${trimmedAthleteName} at session ${session.date}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.warn(`⚠️  ${errorMsg}`);
        }
      }

      // Track processed athletes
      processedAthletes.push({
        name: trimmedAthleteName,
        row: actualRowNumber,
        records: recordsCreated
      });
    }

    // Report skipped athletes
    if (skippedAthletes.length > 0) {
      console.log(`\n📋 SKIPPED ATHLETES SUMMARY (${skippedAthletes.length} total):`);
      console.log('=' .repeat(80));
      
      skippedAthletes.forEach((skipped, index) => {
        console.log(`\n${index + 1}. SKIPPED: ${skipped.name} (Row ${skipped.row})`);
        console.log(`   Reason: ${skipped.reason}`);
        if (skipped.details) {
          if (skipped.details.athleteId) {
            console.log(`   Athlete ID: ${skipped.details.athleteId}`);
          }
          if (skipped.details.deactivated) {
            console.log(`   Status: Athlete deactivated`);
          }
          if (skipped.details.searchedName) {
            console.log(`   Searched Name: "${skipped.details.searchedName}"`);
          }
          if (skipped.details.availableNames) {
            console.log(`   Available Names (first 10): ${skipped.details.availableNames.join(', ')}`);
          }
          if (skipped.details.cellValue !== undefined) {
            console.log(`   Cell Value: "${skipped.details.cellValue}"`);
          }
        }
        console.log('-'.repeat(60));
      });
      
      console.log(`\n🔍 SKIPPED ATHLETES ANALYSIS:`);
      const skipReasons = new Map<string, number>();
      skippedAthletes.forEach(skipped => {
        skipReasons.set(skipped.reason, (skipReasons.get(skipped.reason) || 0) + 1);
      });
      
      skipReasons.forEach((count, reason) => {
        console.log(`   ${reason}: ${count} athletes`);
      });
    }

    // Report processed athletes summary
    console.log(`\n✅ PROCESSED ATHLETES SUMMARY (${processedAthletes.length} total):`);
    console.log('=' .repeat(60));
    processedAthletes.forEach((processed, index) => {
      console.log(`${index + 1}. ${processed.name} (Row ${processed.row}): ${processed.records} attendance records`);
    });
  }

  /**
   * Extract practice sessions from session header rows
   * Uses sequential mapping: each column corresponds to session_id (1, 2, 3, etc.)
   * Skips columns with #VALUE! errors (same as Practice Sessions ETL)
   */
  private async extractPracticeSessions(sessionRows: any[]): Promise<any[]> {
    const sessions: any[] = [];
    
    const dateRow = sessionRows[0];    // E2:HY2 (dates like "January 1")
    const timeRow = sessionRows[1];    // E3:HY3 (times like "6:15 AM") 
    const datetimeRow = sessionRows[2]; // E4:HY4 (datetime like "1/1/2025 6:15:00")

    const maxLength = Math.max(
      dateRow ? dateRow.length : 0,
      datetimeRow ? datetimeRow.length : 0
    );
    
    let sessionIdCounter = 1; // Start from 1 (matches auto-incrementing session_id)
    
    for (let colIndex = 0; colIndex < maxLength; colIndex++) {
      // Skip columns with #VALUE! errors (same logic as Practice Sessions ETL)
      if (datetimeRow && datetimeRow[colIndex] === '#VALUE!') {
        console.log(`⏭️  Skipping column ${colIndex} due to #VALUE! error in datetime cell`);
        continue;
      }
      
      const sessionData = this.transformSessionRow(dateRow, timeRow, datetimeRow, colIndex);
      if (sessionData) {
        // Use sequential mapping: each column corresponds to the next session_id
        sessions.push({
          session_id: sessionIdCounter,
          date: sessionData.date,
          start_time: sessionData.start_time,
          end_time: sessionData.end_time
        });
        sessionIdCounter++;
      }
    }

    console.log(`📊 Mapped ${sessions.length} practice sessions using sequential session_id mapping`);
    return sessions;
  }

  /**
   * Transform a single practice session column (reused from PracticeSessionsETL)
   * Includes same #VALUE! and HOC handling logic
   */
  private transformSessionRow(dateRow: any, timeRow: any, datetimeRow: any, colIndex: number): any | null {
    const dateCell = dateRow?.[colIndex];
    const timeCell = timeRow?.[colIndex];
    const datetimeCell = datetimeRow?.[colIndex];

    // Skip cells with #VALUE! errors - these are broken formulas that can be safely ignored
    if (datetimeCell === '#VALUE!') {
      console.log(`⏭️  Skipping column ${colIndex} due to #VALUE! error in datetime cell`);
      return null;
    }

    if (!dateCell && !datetimeCell) {
      return null;
    }

    let sessionDate: Date;
    let sessionTime: string;

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

    return {
      date: sessionDate.toISOString().split('T')[0],
      start_time: sessionTime
    };
  }

  /**
   * Parse date and time from separate cells (reused from PracticeSessionsETL)
   * Includes same HOC handling logic
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
   * Transform a single attendance record
   * Maps attendance status according to business rules
   * Only processes non-null values - skips null/empty entirely
   */
  private transformAttendanceRecord(
    athlete: any,
    session: any,
    attendanceCell: any
  ): any | null {
    // Skip null/empty values entirely - don't create records for them
    if (!attendanceCell || attendanceCell === '' || attendanceCell === null || attendanceCell === undefined) {
      return null;
    }

    // Map attendance status according to business rules
    const status = this.mapAttendanceStatus(attendanceCell);
    
    // Skip if no valid status could be determined
    if (!status) {
      return null;
    }

    return {
      athlete_id: athlete.getDataValue('athlete_id'), // This is the UUID from our database
      session_id: session.session_id, // Sequential mapping from column position
      session_date: session.date,
      session_start_time: session.start_time,
      status: status.status, // Only non-null statuses
      notes: status.notes || undefined,
      team_id: 1, // Mens Masters team
      etl_source: 'google_sheets',
      etl_last_sync: new Date()
    };
  }

  /**
   * Check if an athlete has any non-null responses across all practice sessions
   * Used to filter out athletes with no responses to prevent table bloat
   * Also deactivates athletes with no attendance records
   */
  private async athleteHasAnyResponse(athleteRow: any[], practiceSessionsLength: number, athlete: any): Promise<boolean> {
    // Check attendance data starting at column E (index 4)
    for (let colIndex = 0; colIndex < practiceSessionsLength; colIndex++) {
      const attendanceCell = athleteRow[colIndex + 4]; // Offset by 4 for columns A-D
      
      // If any cell has a non-null, non-empty value, athlete has responses
      if (attendanceCell && attendanceCell !== '' && attendanceCell !== null && attendanceCell !== undefined) {
        return true;
      }
    }
    
    // No responses found - deactivate this athlete
    console.log(`🚫 Deactivating athlete ${athlete.getDataValue('name')} - no attendance records`);
    await athlete.update({ active: false });
    
    return false; // No responses found
  }

  /**
   * Map attendance cell value to attendance status
   * Business rules:
   * - no = No (explicitly marked as no)
   * - maybe = Maybe  
   * - yes = Yes
   * - boat statuses ([8] Knifton, Singles, etc) = Yes
   * Note: null/empty values are handled at the transformAttendanceRecord level
   */
  private mapAttendanceStatus(attendanceCell: any): { status: string; notes?: string } | null {
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
   * Uses sequential session_id mapping (no database lookups needed)
   */
  protected async load(data: any[]): Promise<{ recordsCreated: number; recordsUpdated: number; recordsFailed: number }> {
    if (this.config.dryRun) {
      console.log('🔍 DRY RUN: Would load attendance data');
      return { recordsCreated: data.length, recordsUpdated: 0, recordsFailed: 0 };
    }

    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;
    const failedRecords: Array<{ data: any; error: string }> = [];

    await this.processBatch(data, this.config.batchSize, async (batch: any[]) => {
      for (const attendanceData of batch) {
        try {
          // Use the session_id directly from the transformed data (sequential mapping)
          // No need to lookup practice sessions in database
          
          // Check if attendance record already exists
          const [attendance, created] = await Attendance.findOrCreate({
            where: { 
              session_id: attendanceData.session_id,
              athlete_id: attendanceData.athlete_id
            },
            defaults: {
              attendance_id: randomUUID(),
              session_id: attendanceData.session_id,
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
          const errorMessage = error instanceof Error ? error.message : String(error);
          failedRecords.push({
            data: attendanceData,
            error: errorMessage
          });
          console.error(`❌ Failed to load attendance record:`, error);
        }
      }
    });

    // Report failed records summary
    if (failedRecords.length > 0) {
      console.log(`\n❌ FAILED RECORDS SUMMARY (${failedRecords.length} total):`);
      console.log('=' .repeat(60));
      
      // Group by error type for cleaner reporting
      const errorTypes = new Map<string, number>();
      failedRecords.forEach(failed => {
        const errorType = failed.error.split(':')[0] || 'Unknown Error';
        errorTypes.set(errorType, (errorTypes.get(errorType) || 0) + 1);
      });
      
      errorTypes.forEach((count, errorType) => {
        console.log(`   ${errorType}: ${count} records`);
      });
      
      // Show first few failed records for debugging
      if (failedRecords.length <= 5) {
        console.log(`\n📋 Failed Records Details:`);
        failedRecords.forEach((failed, index) => {
          console.log(`   ${index + 1}. Session ${failed.data.session_id} - ${failed.error}`);
        });
      } else {
        console.log(`\n📋 First 3 Failed Records:`);
        failedRecords.slice(0, 3).forEach((failed, index) => {
          console.log(`   ${index + 1}. Session ${failed.data.session_id} - ${failed.error}`);
        });
        console.log(`   ... and ${failedRecords.length - 3} more`);
      }
    }

    return { recordsCreated, recordsUpdated, recordsFailed };
  }
}
