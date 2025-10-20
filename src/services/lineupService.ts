import { Lineup, SeatAssignment, PracticeSession, Athlete, Boat } from '../models';
import { Op } from 'sequelize';

export interface LineupData {
  lineup_id: string;
  session_id: number;
  boat_id: string;
  team_id: number;
  lineup_name?: string;
  lineup_type: 'Practice' | 'Race' | 'Test';
  total_weight_kg?: number;
  average_weight_kg?: number;
  average_age?: number;
  notes?: string;
  seat_assignments: SeatAssignmentData[];
  created_at: Date;
  updated_at: Date;
}

export interface SeatAssignmentData {
  seat_assignment_id: string;
  lineup_id: string;
  athlete_id: string;
  seat_number: number;
  side?: 'Port' | 'Starboard';
  athlete_name?: string;
  athlete_weight?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateLineupRequest {
  session_id: number;
  boat_id: string;
  team_id: number;
  lineup_name?: string;
  lineup_type: 'Practice' | 'Race' | 'Test';
  notes?: string;
  seat_assignments: {
    athlete_id: string;
    seat_number: number;
    side?: 'Port' | 'Starboard';
  }[];
}

export interface UpdateLineupRequest {
  lineup_name?: string;
  notes?: string;
  seat_assignments?: {
    athlete_id: string;
    seat_number: number;
    side?: 'Port' | 'Starboard';
  }[];
}

export class LineupService {
  /**
   * Get all lineups for a specific practice session
   */
  async getLineupsForSession(sessionId: number, teamId?: number): Promise<LineupData[]> {
    try {
      const whereClause: any = { session_id: sessionId };
      if (teamId) {
        whereClause.team_id = teamId;
      }

      const lineups = await Lineup.findAll({
        where: whereClause,
        include: [
          {
            model: SeatAssignment,
            as: 'seatAssignments',
            include: [
              {
                model: Athlete,
                as: 'athlete',
                attributes: ['athlete_id', 'first_name', 'last_name', 'weight_kg']
              }
            ]
          },
          {
            model: Boat,
            as: 'boat',
            attributes: ['boat_id', 'boat_name', 'boat_type', 'seats']
          }
        ],
        order: [['created_at', 'ASC']]
      });

      return lineups.map(lineup => this.formatLineupData(lineup));
    } catch (error) {
      console.error('Error fetching lineups for session:', error);
      throw new Error('Failed to fetch lineups for session');
    }
  }

  /**
   * Get lineups created by a specific athlete for sessions they're attending
   */
  async getLineupsByAthlete(athleteId: string, teamId?: number): Promise<LineupData[]> {
    try {
      const whereClause: any = {};
      if (teamId) {
        whereClause.team_id = teamId;
      }

      // Find lineups where the athlete has a seat assignment
      const lineups = await Lineup.findAll({
        where: whereClause,
        include: [
          {
            model: SeatAssignment,
            as: 'seatAssignments',
            where: { athlete_id: athleteId },
            include: [
              {
                model: Athlete,
                as: 'athlete',
                attributes: ['athlete_id', 'first_name', 'last_name', 'weight_kg']
              }
            ]
          },
          {
            model: Boat,
            as: 'boat',
            attributes: ['boat_id', 'boat_name', 'boat_type', 'seats']
          },
          {
            model: PracticeSession,
            as: 'practiceSession',
            attributes: ['session_id', 'date', 'start_time', 'session_type', 'location']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return lineups.map(lineup => this.formatLineupData(lineup));
    } catch (error) {
      console.error('Error fetching lineups by athlete:', error);
      throw new Error('Failed to fetch lineups by athlete');
    }
  }

  /**
   * Get a specific lineup by ID
   */
  async getLineupById(lineupId: string): Promise<LineupData | null> {
    try {
      const lineup = await Lineup.findByPk(lineupId, {
        include: [
          {
            model: SeatAssignment,
            as: 'seatAssignments',
            include: [
              {
                model: Athlete,
                as: 'athlete',
                attributes: ['athlete_id', 'first_name', 'last_name', 'weight_kg']
              }
            ]
          },
          {
            model: Boat,
            as: 'boat',
            attributes: ['boat_id', 'boat_name', 'boat_type', 'seats']
          }
        ]
      });

      return lineup ? this.formatLineupData(lineup) : null;
    } catch (error) {
      console.error('Error fetching lineup by ID:', error);
      throw new Error('Failed to fetch lineup');
    }
  }

  /**
   * Create a new lineup
   */
  async createLineup(lineupData: CreateLineupRequest): Promise<LineupData> {
    try {
      // Validate that the practice session exists and is for the correct team
      const session = await PracticeSession.findOne({
        where: {
          session_id: lineupData.session_id,
          team_id: lineupData.team_id
        }
      });

      if (!session) {
        throw new Error('Practice session not found or access denied');
      }

      // Validate boat exists and has correct number of seats
      const boat = await Boat.findByPk(lineupData.boat_id);
      if (!boat) {
        throw new Error('Boat not found');
      }

      // Get seat count from boat type
      const getSeatCount = (boatType: string): number => {
        switch (boatType) {
          case '1x': return 1;
          case '2x': case '2-': return 2;
          case '4x': case '4+': return 4;
          case '8+': return 8;
          default: return 0;
        }
      };

      const seatCount = getSeatCount(boat.type);
      if (lineupData.seat_assignments.length > seatCount) {
        throw new Error(`Boat only has ${seatCount} seats, but ${lineupData.seat_assignments.length} athletes assigned`);
      }

      // Validate all athletes exist
      const athleteIds = lineupData.seat_assignments.map(sa => sa.athlete_id);
      const athletes = await Athlete.findAll({
        where: { athlete_id: { [Op.in]: athleteIds } }
      });

      if (athletes.length !== athleteIds.length) {
        throw new Error('One or more athletes not found');
      }

      // Create the lineup
      const lineupDataToCreate: any = {
        session_id: lineupData.session_id,
        boat_id: lineupData.boat_id,
        team_id: lineupData.team_id,
        lineup_type: lineupData.lineup_type
      };

      if (lineupData.lineup_name) {
        lineupDataToCreate.lineup_name = lineupData.lineup_name;
      }
      if (lineupData.notes) {
        lineupDataToCreate.notes = lineupData.notes;
      }

      const lineup = await Lineup.create(lineupDataToCreate);

      // Create seat assignments
      await Promise.all(
        lineupData.seat_assignments.map(assignment => {
          const seatData: any = {
            lineup_id: lineup.lineup_id,
            athlete_id: assignment.athlete_id,
            seat_number: assignment.seat_number
          };
          if (assignment.side) {
            seatData.side = assignment.side;
          }
          return SeatAssignment.create(seatData);
        })
      );

      // Calculate total weight and average age
      const totalWeight = athletes.reduce((sum, athlete) => sum + (athlete.weight_kg || 0), 0);
      const averageAge = athletes.reduce((sum, athlete) => {
        if (athlete.birth_year) {
          const age = new Date().getFullYear() - athlete.birth_year;
          return sum + age;
        }
        return sum;
      }, 0) / athletes.length;

      // Update lineup with calculated values
      const updateData: any = {
        total_weight_kg: totalWeight,
        average_weight_kg: totalWeight / athletes.length
      };
      if (!isNaN(averageAge)) {
        updateData.average_age = averageAge;
      }
      await lineup.update(updateData);

      // Return the complete lineup data
      return await this.getLineupById(lineup.lineup_id) as LineupData;
    } catch (error) {
      console.error('Error creating lineup:', error);
      throw error;
    }
  }

  /**
   * Update an existing lineup
   */
  async updateLineup(lineupId: string, updateData: UpdateLineupRequest): Promise<LineupData> {
    try {
      const lineup = await Lineup.findByPk(lineupId);
      if (!lineup) {
        throw new Error('Lineup not found');
      }

      // Update basic lineup information
      if (updateData.lineup_name !== undefined || updateData.notes !== undefined) {
        const basicUpdate: any = {};
        if (updateData.lineup_name !== undefined) {
          basicUpdate.lineup_name = updateData.lineup_name;
        }
        if (updateData.notes !== undefined) {
          basicUpdate.notes = updateData.notes;
        }
        await lineup.update(basicUpdate);
      }

      // Update seat assignments if provided
      if (updateData.seat_assignments) {
        // Remove existing seat assignments
        await SeatAssignment.destroy({
          where: { lineup_id: lineupId }
        });

        // Create new seat assignments
        await Promise.all(
          updateData.seat_assignments.map(assignment => {
            const seatData: any = {
              lineup_id: lineupId,
              athlete_id: assignment.athlete_id,
              seat_number: assignment.seat_number
            };
            if (assignment.side) {
              seatData.side = assignment.side;
            }
            return SeatAssignment.create(seatData);
          })
        );

        // Recalculate weight and age statistics
        const athletes = await Athlete.findAll({
          where: { athlete_id: { [Op.in]: updateData.seat_assignments.map(sa => sa.athlete_id) } }
        });

        const totalWeight = athletes.reduce((sum, athlete) => sum + (athlete.weight_kg || 0), 0);
        const averageAge = athletes.reduce((sum, athlete) => {
          if (athlete.birth_year) {
            const age = new Date().getFullYear() - athlete.birth_year;
            return sum + age;
          }
          return sum;
        }, 0) / athletes.length;

        const weightUpdate: any = {
          total_weight_kg: totalWeight,
          average_weight_kg: totalWeight / athletes.length
        };
        if (!isNaN(averageAge)) {
          weightUpdate.average_age = averageAge;
        }
        await lineup.update(weightUpdate);
      }

      return await this.getLineupById(lineupId) as LineupData;
    } catch (error) {
      console.error('Error updating lineup:', error);
      throw error;
    }
  }

  /**
   * Delete a lineup
   */
  async deleteLineup(lineupId: string): Promise<boolean> {
    try {
      const lineup = await Lineup.findByPk(lineupId);
      if (!lineup) {
        throw new Error('Lineup not found');
      }

      // Delete seat assignments first (cascade should handle this, but being explicit)
      await SeatAssignment.destroy({
        where: { lineup_id: lineupId }
      });

      // Delete the lineup
      await lineup.destroy();

      return true;
    } catch (error) {
      console.error('Error deleting lineup:', error);
      throw error;
    }
  }

  /**
   * Get available athletes for a practice session (those with attendance status "Yes")
   */
  async getAvailableAthletesForSession(_sessionId: number, _teamId: number): Promise<Athlete[]> {
    try {
      // This would need to join with attendance records
      // For now, return all active athletes in the team
      const athletes = await Athlete.findAll({
        where: {
          active: true
        },
        attributes: ['athlete_id', 'name', 'weight_kg', 'birth_year', 'gender', 'sweep_scull', 'port_starboard'],
        order: [['name', 'ASC']]
      });

      return athletes;
    } catch (error) {
      console.error('Error fetching available athletes:', error);
      throw new Error('Failed to fetch available athletes');
    }
  }

  /**
   * Get available boats for a practice session
   */
  async getAvailableBoatsForSession(_sessionId: number, _teamId: number): Promise<Boat[]> {
    try {
      const boats = await Boat.findAll({
        where: {
          status: 'Available'
        },
        attributes: ['boat_id', 'name', 'type', 'status'],
        order: [['type', 'ASC'], ['name', 'ASC']]
      });

      return boats;
    } catch (error) {
      console.error('Error fetching available boats:', error);
      throw new Error('Failed to fetch available boats');
    }
  }

  /**
   * Format lineup data for API response
   */
  private formatLineupData(lineup: any): LineupData {
    return {
      lineup_id: lineup.lineup_id,
      session_id: lineup.session_id,
      boat_id: lineup.boat_id,
      team_id: lineup.team_id,
      lineup_name: lineup.lineup_name,
      lineup_type: lineup.lineup_type,
      total_weight_kg: lineup.total_weight_kg,
      average_weight_kg: lineup.average_weight_kg,
      average_age: lineup.average_age,
      notes: lineup.notes,
      seat_assignments: lineup.seatAssignments?.map((sa: any) => ({
        seat_assignment_id: sa.seat_assignment_id,
        lineup_id: sa.lineup_id,
        athlete_id: sa.athlete_id,
        seat_number: sa.seat_number,
        side: sa.side,
        athlete_name: sa.athlete ? sa.athlete.name : undefined,
        athlete_weight: sa.athlete?.weight_kg,
        created_at: sa.created_at,
        updated_at: sa.updated_at
      })) || [],
      created_at: lineup.created_at,
      updated_at: lineup.updated_at
    };
  }
}

export const lineupService = new LineupService();
