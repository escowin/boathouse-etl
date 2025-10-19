import { Attendance, PracticeSession } from '../models';
import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';

export interface AttendanceSubmissionData {
  session_id: number;
  athlete_id: string;
  status: 'Yes' | 'No' | 'Maybe' | 'Late' | 'Excused';
  notes?: string;
  team_id: number;
  client_id?: string; // Optional client-generated UUID for offline sync
  timestamp?: number; // Client timestamp for conflict resolution
}

export interface AttendanceConflictResolution {
  strategy: 'client_wins' | 'server_wins' | 'latest_wins' | 'merge_notes';
  clientData: AttendanceSubmissionData;
  serverData: Attendance;
}

export class AttendanceService {
  /**
   * Create or update attendance with enhanced conflict resolution
   * This method handles concurrent submissions and offline sync scenarios
   */
  async upsertAttendance(
    data: AttendanceSubmissionData,
    conflictResolution: AttendanceConflictResolution['strategy'] = 'latest_wins'
  ): Promise<{ success: boolean; data?: Attendance; conflict?: AttendanceConflictResolution; error?: string }> {
    const transaction = await sequelize.transaction();
    
    try {
      // First, check if attendance record already exists
      const existingRecord = await Attendance.findOne({
        where: {
          session_id: data.session_id,
          athlete_id: data.athlete_id
        },
        transaction
      });

      let attendanceRecord: Attendance;

      if (existingRecord) {
        // Handle conflict resolution
        const conflict = await this.resolveConflict(
          data,
          existingRecord,
          conflictResolution,
          transaction
        );

        if (conflict) {
          await transaction.rollback();
          return {
            success: false,
            conflict,
            error: 'Conflict detected - manual resolution required'
          };
        }

        // Update existing record
        attendanceRecord = await existingRecord.update({
          status: data.status,
          notes: data.notes,
          etl_source: 'api',
          etl_last_sync: new Date()
        }, { transaction });

      } else {
        // Create new record with UUID
        attendanceRecord = await Attendance.create({
          attendance_id: data.client_id, // Use client ID if provided (for offline sync), otherwise Sequelize will generate one
          session_id: data.session_id,
          athlete_id: data.athlete_id,
          status: data.status,
          notes: data.notes,
          team_id: data.team_id,
          etl_source: 'api',
          etl_last_sync: new Date()
        }, { transaction });
      }

      await transaction.commit();
      return {
        success: true,
        data: attendanceRecord
      };

    } catch (error: any) {
      await transaction.rollback();
      console.error('Error in upsertAttendance:', error);
      
      // Handle specific database errors
      if (error.name === 'SequelizeUniqueConstraintError') {
        return {
          success: false,
          error: 'Duplicate attendance record detected'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to save attendance'
      };
    }
  }

  /**
   * Resolve conflicts between client and server data
   */
  private async resolveConflict(
    clientData: AttendanceSubmissionData,
    serverData: Attendance,
    strategy: AttendanceConflictResolution['strategy'],
    transaction: Transaction
  ): Promise<AttendanceConflictResolution | null> {
    // Check if there's actually a conflict
    const hasConflict = (
      clientData.status !== serverData.status ||
      clientData.notes !== serverData.notes
    );

    if (!hasConflict) {
      return null; // No conflict, proceed with update
    }

    // Create conflict object
    const conflict: AttendanceConflictResolution = {
      strategy,
      clientData,
      serverData
    };

    // Apply conflict resolution strategy
    switch (strategy) {
      case 'client_wins':
        // Client data takes precedence - no conflict to resolve
        return null;

      case 'server_wins':
        // Server data takes precedence - no update needed
        return null;

      case 'latest_wins':
        // Compare timestamps if available
        if (clientData.timestamp && serverData.updated_at) {
          const clientTime = new Date(clientData.timestamp);
          const serverTime = new Date(serverData.updated_at);
          
          if (clientTime > serverTime) {
            // Client is newer, proceed with update
            return null;
          } else {
            // Server is newer, no update needed
            return null;
          }
        }
        // If no timestamps, treat as conflict
        return conflict;

      case 'merge_notes':
        // Merge notes from both client and server
        const mergedNotes = this.mergeNotes(clientData.notes, serverData.notes);
        clientData.notes = mergedNotes;
        // Proceed with client status but merged notes
        return null;

      default:
        return conflict;
    }
  }

  /**
   * Merge notes from client and server
   */
  private mergeNotes(clientNotes?: string, serverNotes?: string): string {
    if (!clientNotes && !serverNotes) return '';
    if (!clientNotes) return serverNotes || '';
    if (!serverNotes) return clientNotes;
    
    // Combine notes, avoiding duplicates
    const clientLines = clientNotes.split('\n').filter(line => line.trim());
    const serverLines = serverNotes.split('\n').filter(line => line.trim());
    
    const allLines = [...new Set([...clientLines, ...serverLines])];
    return allLines.join('\n');
  }

  /**
   * Batch upsert multiple attendance records
   * Useful for offline sync scenarios
   */
  async batchUpsertAttendance(
    records: AttendanceSubmissionData[],
    conflictResolution: AttendanceConflictResolution['strategy'] = 'latest_wins'
  ): Promise<{ success: boolean; data?: Attendance[]; conflicts?: AttendanceConflictResolution[]; error?: string }> {
    const transaction = await sequelize.transaction();
    const results: Attendance[] = [];
    const conflicts: AttendanceConflictResolution[] = [];

    try {
      for (const record of records) {
        const result = await this.upsertAttendance(record, conflictResolution);
        
        if (result.success && result.data) {
          results.push(result.data);
        } else if (result.conflict) {
          conflicts.push(result.conflict);
        }
      }

      if (conflicts.length > 0) {
        await transaction.rollback();
        return {
          success: false,
          conflicts,
          error: `${conflicts.length} conflicts detected`
        };
      }

      await transaction.commit();
      return {
        success: true,
        data: results
      };

    } catch (error: any) {
      await transaction.rollback();
      console.error('Error in batchUpsertAttendance:', error);
      return {
        success: false,
        error: error.message || 'Failed to batch upsert attendance'
      };
    }
  }

  /**
   * Get attendance with conflict detection
   * Useful for checking if local changes conflict with server state
   */
  async getAttendanceWithConflictDetection(
    sessionId: number,
    athleteId: string,
    clientData?: AttendanceSubmissionData
  ): Promise<{ data?: Attendance; hasConflict?: boolean; conflict?: AttendanceConflictResolution }> {
    try {
      const serverData = await Attendance.findOne({
        where: {
          session_id: sessionId,
          athlete_id: athleteId
        }
      });

      if (!serverData) {
        return { data: undefined };
      }

      if (clientData) {
        const hasConflict = (
          clientData.status !== serverData.status ||
          clientData.notes !== serverData.notes
        );

        if (hasConflict) {
          const conflict: AttendanceConflictResolution = {
            strategy: 'latest_wins',
            clientData,
            serverData
          };
          return { data: serverData, hasConflict: true, conflict };
        }
      }

      return { data: serverData };

    } catch (error: any) {
      console.error('Error in getAttendanceWithConflictDetection:', error);
      return { data: undefined };
    }
  }

  /**
   * Validate attendance data before submission
   */
  validateAttendanceData(data: AttendanceSubmissionData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.session_id || data.session_id <= 0) {
      errors.push('Invalid session_id');
    }

    if (!data.athlete_id || typeof data.athlete_id !== 'string') {
      errors.push('Invalid athlete_id');
    }

    if (!data.team_id || data.team_id <= 0) {
      errors.push('Invalid team_id');
    }

    const validStatuses = ['Yes', 'No', 'Maybe', 'Late', 'Excused'];
    if (!validStatuses.includes(data.status)) {
      errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const attendanceService = new AttendanceService();
