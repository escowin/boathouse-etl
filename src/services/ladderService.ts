import { GauntletMatch, LadderPosition, LadderProgression, Ladder } from '../models';
import { randomUUID } from 'crypto';
import sequelize from '../config/database';

export class LadderService {
  /**
   * Process a match result and update ladder positions/progressions atomically
   * This is the core atomic operation that ensures data consistency
   */
  static async processMatchResult(matchData: {
    match_id: string;
    gauntlet_id: string;
    user_wins: number;
    user_losses: number;
    sets: number;
    match_date: Date;
    athlete_id: string;
  }): Promise<{
    match: GauntletMatch;
    ladderUpdate: {
      updatedPosition: LadderPosition;
      progression?: LadderProgression;
    };
  }> {
    const transaction = await sequelize.transaction();
    
    try {
      // 1. Get the ladder for this gauntlet
      const ladder = await Ladder.findOne({
        where: { gauntlet_id: matchData.gauntlet_id },
        transaction
      });
      
      if (!ladder) {
        throw new Error('No ladder found for this gauntlet');
      }

      // 2. Get current ladder position for the athlete
      const currentPosition = await LadderPosition.findOne({
        where: {
          ladder_id: ladder.ladder_id,
          athlete_id: matchData.athlete_id
        },
        transaction
      });

      if (!currentPosition) {
        throw new Error('Athlete not found in ladder');
      }

      // 3. Calculate match result and new statistics
      const matchResult = this.determineMatchResult(
        matchData.user_wins, 
        matchData.user_losses, 
        matchData.sets
      );

      // 4. Update ladder position atomically
      const updatedPosition = await this.updateLadderPosition(
        currentPosition,
        matchResult,
        matchData,
        transaction
      );

      // 5. Create ladder progression record if position changed
      let progression: LadderProgression | undefined;
      if (updatedPosition.position !== currentPosition.position) {
        progression = await this.createLadderProgression(
          ladder.ladder_id,
          matchData.athlete_id,
          currentPosition.position,
          updatedPosition.position,
          matchResult,
          matchData.match_id,
          transaction
        );
      }

      // 6. Commit all changes atomically
      await transaction.commit();
      
      const match = await GauntletMatch.findByPk(matchData.match_id);
      if (!match) {
        throw new Error('Match not found after creation');
      }

      const ladderUpdate: {
        updatedPosition: LadderPosition;
        progression?: LadderProgression;
      } = {
        updatedPosition
      };

      if (progression) {
        ladderUpdate.progression = progression;
      }

      return {
        match,
        ladderUpdate
      };

    } catch (error) {
      // Rollback all changes if any step fails
      await transaction.rollback();
      throw error;
    }
  }

  private static determineMatchResult(
    wins: number, 
    losses: number, 
    _sets: number
  ): 'match_win' | 'match_loss' | 'match_draw' {
    if (wins > losses) return 'match_win';
    if (losses > wins) return 'match_loss';
    return 'match_draw';
  }

  private static async updateLadderPosition(
    currentPosition: LadderPosition,
    matchResult: 'match_win' | 'match_loss' | 'match_draw',
    matchData: any,
    transaction: any
  ): Promise<LadderPosition> {
    // Calculate new statistics
    const draws = matchData.sets - matchData.user_wins - matchData.user_losses;
    const newWins = currentPosition.wins + matchData.user_wins;
    const newLosses = currentPosition.losses + matchData.user_losses;
    const newDraws = currentPosition.draws + draws;
    const newTotalMatches = newWins + newLosses + newDraws;
    const newWinRate = newTotalMatches > 0 ? (newWins / newTotalMatches) * 100 : 0;

    // Update streak information
    const { streakType, streakCount } = this.calculateStreak(
      currentPosition.streak_type,
      currentPosition.streak_count,
      matchResult
    );

    // Calculate new position based on ladder rules
    const newPosition = await this.calculateNewPosition(
      currentPosition,
      matchResult,
      currentPosition.ladder_id,
      transaction
    );

    // Update the position record
    await currentPosition.update({
      previous_position: currentPosition.position,
      position: newPosition,
      wins: newWins,
      losses: newLosses,
      draws: newDraws,
      total_matches: newTotalMatches,
      win_rate: newWinRate,
      streak_type: streakType as 'win' | 'loss' | 'draw' | 'none',
      streak_count: streakCount,
      last_match_date: matchData.match_date,
      last_updated: new Date()
    }, { transaction });

    return currentPosition;
  }

  private static calculateStreak(
    currentStreakType: string,
    currentStreakCount: number,
    matchResult: 'match_win' | 'match_loss' | 'match_draw'
  ): { streakType: string; streakCount: number } {
    if (currentStreakType === matchResult) {
      return {
        streakType: matchResult,
        streakCount: currentStreakCount + 1
      };
    } else {
      return {
        streakType: matchResult,
        streakCount: 1
      };
    }
  }

  private static async calculateNewPosition(
    currentPosition: LadderPosition,
    matchResult: 'match_win' | 'match_loss' | 'match_draw',
    ladderId: string,
    transaction: any
  ): Promise<number> {
    // Get total number of positions in ladder
    const totalPositions = await LadderPosition.count({
      where: { ladder_id: ladderId },
      transaction
    });

    // Simple ladder logic (can be enhanced with more complex rules)
    if (matchResult === 'match_win' && (currentPosition.position) > 1) {
      // Move up one position
      return (currentPosition.position) - 1;
    } else if (matchResult === 'match_loss' && (currentPosition.position) < totalPositions) {
      // Move down one position
      return (currentPosition.position) + 1;
    }
    
    // No change for draws or if already at top/bottom
    return currentPosition.position;
  }

  private static async createLadderProgression(
    ladderId: string,
    athleteId: string,
    fromPosition: number,
    toPosition: number,
    reason: 'match_win' | 'match_loss' | 'match_draw',
    matchId: string,
    transaction: any
  ): Promise<LadderProgression> {
    return await LadderProgression.create({
      progression_id: randomUUID(),
      ladder_id: ladderId,
      athlete_id: athleteId,
      from_position: fromPosition,
      to_position: toPosition,
      change: toPosition - fromPosition,
      reason,
      match_id: matchId,
      date: new Date()
    }, { transaction });
  }
}
