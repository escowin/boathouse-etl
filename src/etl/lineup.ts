import { BaseETLProcess } from './base-etl';
import { Attendance, Athlete, Boat, PracticeSession, Lineup } from '../models';
import { ETLProcessConfig, ETLValidationResult } from './types';

export class LineupETL extends BaseETLProcess {
  constructor(config: Partial<ETLProcessConfig> = {}) {
    const defaultConfig: ETLProcessConfig = {
      sheetName: 'Lineup',
      primaryKey: 'lineup_id',
      batchSize: 50,
      retryAttempts: 3,
      retryDelayMs: 1000,
      dryRun: false,
      ...config
    };
    super(defaultConfig);
  }

  /**
   * Get job type for this ETL process
   */
  getJobType(): "full_etl" | "incremental_etl" | "athletes_sync" | "boats_sync" | "attendance_sync" {
    return 'attendance_sync'; // Lineup ETL is related to attendance data
  }

  /**
   * Extract lineup data from attendance records with boat assignments
   * No Google Sheets API needed - all data is in the database
   */
  protected async extract(): Promise<any[]> {
    console.log('🔍 Extracting lineup data from attendance records...');
    
    // Get all attendance records with boat assignments
    // Only get records with "Boat assignment: [...]" format, skip null values
    const attendanceWithBoats = await Attendance.findAll({
      where: {
        notes: {
          [require('sequelize').Op.like]: 'Boat assignment:%'
        }
      },
      include: [
        {
          model: Athlete,
          as: 'athlete',
          attributes: ['athlete_id', 'name', 'weight_kg', 'birth_year', 'type']
        },
        {
          model: PracticeSession,
          as: 'session',
          attributes: ['session_id', 'date', 'start_time']
        }
      ],
      order: [['session_id', 'ASC']]
    });

    console.log(`📊 Found ${attendanceWithBoats.length} attendance records with boat assignments`);
    
    // Debug: Check first few records to see what we're getting
    if (attendanceWithBoats.length > 0) {
      console.log('🔍 Debug - First 3 attendance records:');
      for (let i = 0; i < Math.min(3, attendanceWithBoats.length); i++) {
        const record = attendanceWithBoats[i];
        if (record) {
          console.log(`  Record ${i + 1}:`);
          console.log(`    attendance_id: ${record.getDataValue('attendance_id')}`);
          console.log(`    session_id: ${record.getDataValue('session_id')}`);
          console.log(`    athlete_id: ${record.getDataValue('athlete_id')}`);
          console.log(`    notes: "${record.getDataValue('notes')}"`);
          console.log(`    notes type: ${typeof record.getDataValue('notes')}`);
          // Access athlete through the included association
          const athleteData = (record as any).dataValues.athlete;
          console.log(`    athlete name: ${athleteData?.name}`);
        }
      }
    }
    
    return attendanceWithBoats;
  }

  /**
   * Transform attendance records into lineup data
   * Groups by session_id and boat assignment, calculates metrics
   */
  protected async transform(data: any[]): Promise<{ data: any[]; errors: string[]; warnings: string[] }> {
    console.log('🔄 Transforming attendance records into lineup data...');
    
    const lineups = new Map<string, any>();
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const attendance of data) {
      try {
        // Parse boat assignment from notes - use getDataValue to access the field
        const notesValue = attendance.getDataValue('notes');
        const boatInfo = this.parseBoatAssignment(notesValue);
        if (!boatInfo) {
          warnings.push(`Could not parse boat assignment: ${notesValue}`);
          continue;
        }

        // Create unique key for session + boat combination
        const sessionId = attendance.getDataValue('session_id');
        const lineupKey = `${sessionId}-${boatInfo.boatName}`;
        
        if (!lineups.has(lineupKey)) {
          // Create new lineup entry
          lineups.set(lineupKey, {
            session_id: sessionId,
            boat_name: boatInfo.boatName,
            rower_count_expected: boatInfo.rowerCount, // Expected rower count from notes
            athletes: [],
            total_weight_kg: 0,
            total_age: 0,
            coxswain_count: 0,
            rower_count: 0
          });
        }

        const lineup = lineups.get(lineupKey);
        
        // Access athlete data through the included association
        const athleteData = (attendance as any).dataValues.athlete;
        
        // Calculate athlete age from birth_year
        const currentYear = new Date().getFullYear();
        const athleteAge = athleteData?.birth_year ? currentYear - athleteData.birth_year : 0;

        // Add athlete to lineup
        lineup.athletes.push({
          athlete_id: attendance.getDataValue('athlete_id'),
          name: athleteData?.name,
          weight_kg: athleteData?.weight_kg || 0,
          age: athleteAge,
          type: athleteData?.type
        });

        // Accumulate weights and ages
        lineup.total_weight_kg += athleteData?.weight_kg || 0;
        
        // Only count age for non-coxswains
        if (athleteData?.type !== 'Cox') {
          lineup.total_age += athleteAge;
          lineup.rower_count++;
        } else {
          lineup.coxswain_count++;
        }

      } catch (error) {
        const errorMsg = `Failed to process attendance record ${attendance.attendance_id}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.warn(`⚠️  ${errorMsg}`);
      }
    }

    // Convert map to array and calculate final metrics
    const transformedLineups: any[] = [];
    
    for (const [lineupKey, lineup] of lineups) {
      try {
        // Find boat_id by name
        let boat = await Boat.findOne({
          where: { name: lineup.boat_name }
        });

        // Handle missing "Eights" boat - seed it into the database
        if (!boat && lineup.boat_name === 'Eights') {
          console.log(`🔧 Seeding missing boat: ${lineup.boat_name}`);
          try {
            boat = await Boat.create({
              name: 'Eights',
              type: '8+',
              status: 'Available',
              description: 'Generic Eights boat for lineup assignments',
              etl_source: 'lineup_etl_seed',
              etl_last_sync: new Date()
            });
            console.log(`✅ Successfully seeded boat: ${boat.name} (ID: ${boat.boat_id})`);
          } catch (error) {
            const errorMsg = `Failed to seed boat ${lineup.boat_name}: ${error instanceof Error ? error.message : String(error)}`;
            errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
            continue;
          }
        }

        if (!boat) {
          warnings.push(`Boat not found in database: ${lineup.boat_name}`);
          continue;
        }

        const boatType = boat.getDataValue('type');
        const boatId = boat.getDataValue('boat_id');

        // Get actual seat count from boat type
        const actualSeatCount = this.getSeatCountFromBoatType(boatType);
        const totalAthletes = lineup.athletes.length;

        // Calculate metrics using actual seat count
        const average_weight_kg = actualSeatCount > 0 ? lineup.total_weight_kg / actualSeatCount : 0;
        const average_age = lineup.rower_count > 0 ? lineup.total_age / lineup.rower_count : 0;

        // Check for over/under assignments
        let assignmentNote = '';
        if (totalAthletes > actualSeatCount) {
          assignmentNote = ` (Over-assigned: ${totalAthletes} athletes for ${actualSeatCount} seats)`;
        } else if (totalAthletes < actualSeatCount) {
          assignmentNote = ` (Under-assigned: ${totalAthletes} athletes for ${actualSeatCount} seats)`;
        }

        const lineupRecord = {
          session_id: lineup.session_id,
          boat_id: boatId,
          team_id: 1, // Mens Masters team
          lineup_name: `${lineup.boat_name} - Session ${lineup.session_id}`,
          lineup_type: 'Practice',
          total_weight_kg: lineup.total_weight_kg,
          average_weight_kg: Math.round(average_weight_kg * 100) / 100, // Round to 2 decimal places
          average_age: Math.round(average_age * 10) / 10, // Round to 1 decimal place
          notes: `Auto-generated from ${totalAthletes} athletes (${lineup.rower_count} rowers, ${lineup.coxswain_count} coxswains) for ${boatType}${assignmentNote}`,
          etl_source: 'google_sheets',
          etl_last_sync: new Date()
        };

        // Debug logging for first few records
        if (transformedLineups.length < 3) {
          console.log(`🔍 Debug Lineup ${transformedLineups.length + 1}:`);
          console.log(`  session_id: ${lineupRecord.session_id} (type: ${typeof lineupRecord.session_id})`);
          console.log(`  boat_id: ${lineupRecord.boat_id} (type: ${typeof lineupRecord.boat_id})`);
          console.log(`  team_id: ${lineupRecord.team_id} (type: ${typeof lineupRecord.team_id})`);
        }

        transformedLineups.push(lineupRecord);

      } catch (error) {
        const errorMsg = `Failed to finalize lineup ${lineupKey}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.warn(`⚠️  ${errorMsg}`);
      }
    }

    // Report transformation results
    if (errors.length > 0) {
      console.log(`\n❌ TRANSFORMATION ERRORS (${errors.length} total):`);
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (warnings.length > 0) {
      console.log(`\n⚠️  TRANSFORMATION WARNINGS (${warnings.length} total):`);
      warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }

    console.log(`✅ Transformed ${data.length} attendance records into ${transformedLineups.length} lineups`);
    return {
      data: transformedLineups,
      errors,
      warnings
    };
  }

  /**
   * Parse boat assignment from attendance notes
   * Handles formats like:
   * - "Boat assignment: [8] Knifton" (seat count in brackets is rower count, not total seats)
   * - "Boat assignment: [2] Empacher" 
   * - "Boat assignment: [4] Carson (P)" (legacy naming convention)
   * - "Boat assignment: Singles"
   * - "Boat assignment: Doubles"
   * - "Boat assignment: Pairs"
   * - "Boat assignment: Quads"
   * - "Boat assignment: Eights"
   */
  private parseBoatAssignment(notes: string): { boatName: string; rowerCount: number } | null {
    // Skip null/undefined notes
    if (!notes) {
      return null;
    }
    
    // Only process records with "Boat assignment:" format
    if (!notes.includes('Boat assignment:')) {
      return null;
    }

    // Handle specific boat names with [number] format: "Boat assignment: [8] Knifton"
    const specificBoatMatch = notes.match(/Boat assignment:\s*\[(\d+)\]\s*(.+)/);
    if (specificBoatMatch && specificBoatMatch[1] && specificBoatMatch[2]) {
      const rowerCount = parseInt(specificBoatMatch[1]);
      let boatName = specificBoatMatch[2].trim();
      
      // Handle corrupt/legacy boat name mappings
      const boatNameMappings: { [key: string]: string } = {
        'Emp': 'Empacher'  // Map corrupt "Emp" to "Empacher"
      };
      
      if (boatNameMappings[boatName]) {
        boatName = boatNameMappings[boatName]!;
      }
      
      return {
        boatName: boatName,
        rowerCount: rowerCount
      };
    }

    // Handle generic boat types: "Boat assignment: Singles", "Boat assignment: Doubles", etc.
    const genericBoatMatch = notes.match(/Boat assignment:\s*(.+)/);
    if (genericBoatMatch && genericBoatMatch[1]) {
      const boatType = genericBoatMatch[1].trim();
      
      // Map generic boat types to expected rower counts
      const genericBoatRowerCounts: { [key: string]: number } = {
        'Singles': 1,
        'Doubles': 2,
        'Pairs': 2,
        'Quads': 4,
        'Fours': 4,
        'Eights': 8
      };

      const rowerCount = genericBoatRowerCounts[boatType];
      if (rowerCount !== undefined) {
        return {
          boatName: boatType,
          rowerCount: rowerCount
        };
      }
    }

    console.log(`🔍 Debug: Could not parse boat assignment format: "${notes}"`);
    return null;
  }

  /**
   * Get seat count from boat type
   * Returns total seats including coxswain if applicable
   */
  private getSeatCountFromBoatType(boatType: string): number {
    const seatCountMap: { [key: string]: number } = {
      // Specific boat types from database
      'Eight': 9,      // 8 rowers + 1 cox
      'Four': 5,       // 4 rowers + 1 cox  
      'Quad': 4,       // 4 rowers, no cox
      'Double': 2,     // 2 rowers, no cox
      'Pair': 2,       // 2 rowers, no cox
      'Single': 1,     // 1 rower, no cox
      
      // Generic boat types from attendance notes
      'Eights': 9,     // 8 rowers + 1 cox
      'Fours': 5,      // 4 rowers + 1 cox
      'Quads': 4,      // 4 rowers, no cox
      'Doubles': 2,    // 2 rowers, no cox
      'Pairs': 2,      // 2 rowers, no cox
      'Singles': 1     // 1 rower, no cox
    };

    return seatCountMap[boatType] || 8; // Default to 8 if unknown type
  }

  /**
   * Validate Lineup data
   */
  protected async validate(data: any[]): Promise<ETLValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const lineup = data[i];

      // Validate required fields
      if (!lineup.session_id || typeof lineup.session_id !== 'number') {
        errors.push(`Lineup ${i + 1}: Invalid session_id`);
      }

      if (!lineup.boat_id || typeof lineup.boat_id !== 'string') {
        errors.push(`Lineup ${i + 1}: Invalid boat_id (value: ${lineup.boat_id}, type: ${typeof lineup.boat_id})`);
      }

      if (!lineup.team_id || typeof lineup.team_id !== 'number') {
        errors.push(`Lineup ${i + 1}: Invalid team_id`);
      }

      if (!lineup.lineup_type || !['Practice', 'Race', 'Test'].includes(lineup.lineup_type)) {
        errors.push(`Lineup ${i + 1}: Invalid lineup_type: ${lineup.lineup_type}`);
      }

      // Validate weight calculations
      if (lineup.total_weight_kg && (lineup.total_weight_kg < 0 || lineup.total_weight_kg > 10000)) {
        warnings.push(`Lineup ${i + 1}: Unusual total weight: ${lineup.total_weight_kg}kg`);
      }

      if (lineup.average_weight_kg && (lineup.average_weight_kg < 0 || lineup.average_weight_kg > 1000)) {
        warnings.push(`Lineup ${i + 1}: Unusual average weight: ${lineup.average_weight_kg}kg`);
      }

      if (lineup.average_age && (lineup.average_age < 0 || lineup.average_age > 150)) {
        warnings.push(`Lineup ${i + 1}: Unusual average age: ${lineup.average_age} years`);
      }

      // Check for duplicate lineups
      const duplicateLineups = data.filter(l => 
        l.session_id === lineup.session_id && 
        l.boat_id === lineup.boat_id
      );
      if (duplicateLineups.length > 1) {
        warnings.push(`Lineup ${i + 1}: Duplicate lineup found for session ${lineup.session_id} and boat ${lineup.boat_id}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Load Lineup data to database
   */
  protected async load(data: any[]): Promise<{ recordsCreated: number; recordsUpdated: number; recordsFailed: number }> {
    if (this.config.dryRun) {
      console.log('🔍 DRY RUN: Would load lineup data');
      return { recordsCreated: data.length, recordsUpdated: 0, recordsFailed: 0 };
    }

    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;
    const failedRecords: Array<{ data: any; error: string }> = [];

    await this.processBatch(data, this.config.batchSize || 50, async (batch: any[]) => {
      for (const lineupData of batch) {
        try {
          // Check if lineup already exists
          const [lineup, created] = await Lineup.findOrCreate({
            where: { 
              session_id: lineupData.session_id,
              boat_id: lineupData.boat_id
            },
            defaults: {
              session_id: lineupData.session_id,
              boat_id: lineupData.boat_id,
              team_id: lineupData.team_id,
              lineup_name: lineupData.lineup_name,
              lineup_type: lineupData.lineup_type,
              total_weight_kg: lineupData.total_weight_kg,
              average_weight_kg: lineupData.average_weight_kg,
              average_age: lineupData.average_age,
              notes: lineupData.notes,
              etl_source: lineupData.etl_source,
              etl_last_sync: lineupData.etl_last_sync
            } as any
          });

          if (!created) {
            // Update existing lineup record if needed
            const needsUpdate = 
              lineup.lineup_name !== lineupData.lineup_name ||
              lineup.lineup_type !== lineupData.lineup_type ||
              lineup.total_weight_kg !== lineupData.total_weight_kg ||
              lineup.average_weight_kg !== lineupData.average_weight_kg ||
              lineup.average_age !== lineupData.average_age ||
              lineup.notes !== lineupData.notes;

            if (needsUpdate) {
              await lineup.update({
                lineup_name: lineupData.lineup_name,
                lineup_type: lineupData.lineup_type,
                total_weight_kg: lineupData.total_weight_kg,
                average_weight_kg: lineupData.average_weight_kg,
                average_age: lineupData.average_age,
                notes: lineupData.notes,
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
            data: lineupData,
            error: errorMessage
          });
          console.error(`❌ Failed to load lineup record:`, error);
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
