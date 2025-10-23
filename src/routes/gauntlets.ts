import { Router, Request, Response } from 'express';
import { 
  Gauntlet, 
  GauntletMatch, 
  GauntletLineup, 
  GauntletSeatAssignment,
  Ladder,
  LadderPosition,
  LadderProgression,
  Athlete
} from '../models';
import { authMiddleware } from '../auth/middleware';
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

const router = Router();

/**
 * GET /api/gauntlets
 * Get all gauntlets, optionally filtered by creator
 */
router.get('/', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { created_by, status } = req.query;

    const whereClause: any = {};
    
    if (created_by) {
      whereClause.created_by = created_by;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const gauntlets = await Gauntlet.findAll({
      where: whereClause,
      include: [
        {
          model: Athlete,
          as: 'creator',
          attributes: ['athlete_id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      data: gauntlets,
      message: `Found ${gauntlets.length} gauntlets`,
      error: null
    });

  } catch (error: any) {
    console.error('Error fetching gauntlets:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch gauntlets',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/gauntlets/:id
 * Get a specific gauntlet by ID
 */
router.get('/:id', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const gauntlet = await Gauntlet.findByPk(id, {
      include: [
        {
          model: Athlete,
          as: 'creator',
          attributes: ['athlete_id', 'name', 'email']
        },
        {
          model: Ladder,
          as: 'ladder',
          include: [
            {
              model: LadderPosition,
              as: 'positions',
              include: [
                {
                  model: Athlete,
                  as: 'athlete',
                  attributes: ['athlete_id', 'name']
                }
              ],
              order: [['position', 'ASC']]
            }
          ]
        }
      ]
    });

    if (!gauntlet) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet not found',
        error: 'NOT_FOUND'
      });
    }

    return res.json({
      success: true,
      data: gauntlet,
      message: 'Gauntlet retrieved successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error fetching gauntlet:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch gauntlet',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/gauntlets
 * Create a new gauntlet
 */
router.post('/', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      boat_type,
      status = 'setup'
    } = req.body;

    // Get the authenticated user's ID from the token
    const created_by = req.user?.athlete_id;
    
    if (!created_by) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Athlete ID required',
        error: 'UNAUTHORIZED'
      });
    }

    // Validate required fields
    if (!name || !boat_type) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Missing required fields: name, boat_type',
        error: 'VALIDATION_ERROR'
      });
    }

    // Validate boat type
    const validBoatTypes = ['1x', '2x', '2-', '4x', '4+', '8+'];
    if (!validBoatTypes.includes(boat_type)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Invalid boat_type. Must be one of: ${validBoatTypes.join(', ')}`,
        error: 'VALIDATION_ERROR'
      });
    }

    // Validate status
    const validStatuses = ['setup', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        error: 'VALIDATION_ERROR'
      });
    }

    // Create gauntlet
    const gauntlet = await Gauntlet.create({
      name,
      description,
      boat_type,
      created_by,
      status
    });

    // Fetch the created gauntlet with associations (no ladder auto-creation)
    const createdGauntlet = await Gauntlet.findByPk(gauntlet.getDataValue('gauntlet_id'), {
      include: [
        {
          model: Athlete,
          as: 'creator',
          attributes: ['athlete_id', 'name', 'email']
        }
      ]
    });

    return res.status(201).json({
      success: true,
      data: createdGauntlet,
      message: 'Gauntlet created successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error creating gauntlet:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to create gauntlet',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/gauntlets/comprehensive
 * Create a gauntlet with all associated entities in one atomic operation
 */
router.post('/comprehensive', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  console.log('🚀 COMPREHENSIVE GAUNTLET ENDPOINT HIT!');
  console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
  console.log('🔍 Request headers:', req.headers);
  
  try {
    const {
      name,
      description,
      boat_type,
      status = 'setup',
      userBoat,
      challengers = []
    } = req.body;

    // Get the authenticated user's ID from the token
    const created_by = req.user?.athlete_id;
    
    if (!created_by) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Athlete ID required',
        error: 'UNAUTHORIZED'
      });
    }

    // Validate required fields
    if (!name || !boat_type || !userBoat) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Missing required fields: name, boat_type, userBoat',
        error: 'VALIDATION_ERROR'
      });
    }

    // Validate boat type
    const validBoatTypes = ['1x', '2x', '2-', '4x', '4+', '8+'];
    if (!validBoatTypes.includes(boat_type)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Invalid boat_type. Must be one of: ${validBoatTypes.join(', ')}`,
        error: 'VALIDATION_ERROR'
      });
    }

    // Validate status
    const validStatuses = ['setup', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        error: 'VALIDATION_ERROR'
      });
    }

    // Start a transaction to ensure atomicity
    const transaction = await sequelize.transaction();
    let transactionCommitted = false;

    try {
      console.log('🔍 Starting comprehensive gauntlet creation with data:', {
        name,
        description,
        boat_type,
        created_by,
        status,
        userBoat,
        challengers: challengers.length
      });

      // 1. Create gauntlet
      console.log('🔍 Creating gauntlet...');
      const gauntlet = await Gauntlet.create({
        name,
        description,
        boat_type,
        created_by,
        status
      }, { transaction });

      const gauntletId = gauntlet.getDataValue('gauntlet_id');
      console.log('✅ Gauntlet created with ID:', gauntletId);

      // 2. Create ladder
      console.log('🔍 Creating ladder...');
      const ladder = await Ladder.create({
        gauntlet_id: gauntletId
      }, { transaction });

      const ladderId = ladder.getDataValue('ladder_id');
      console.log('✅ Ladder created with ID:', ladderId);

      // 3. Create initial ladder position for the user (starting at bottom)
      console.log('🔍 Creating ladder position with data:', {
        ladder_id: ladderId,
        athlete_id: created_by,
        position: 1,
        wins: 0,
        losses: 0,
        draws: 0,
        win_rate: 0.00,
        total_matches: 0,
        points: 0,
        streak_type: 'none',
        streak_count: 0,
        joined_date: new Date(),
        last_updated: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });
      
      await LadderPosition.create({
        ladder_id: ladderId,
        athlete_id: created_by,
        position: 1, // Start at bottom position
        wins: 0,
        losses: 0,
        draws: 0,
        win_rate: 0.00,
        total_matches: 0,
        points: 0,
        streak_type: 'none',
        streak_count: 0,
        joined_date: new Date(), // DATEONLY format - Sequelize will handle the conversion
        last_updated: new Date(), // DATE format
        created_at: new Date(), // Add missing created_at field
        updated_at: new Date() // Add missing updated_at field
      }, { transaction });

      // 4. Create initial ladder progression record
      console.log('🔍 Creating ladder progression with data:', {
        ladder_id: ladderId,
        athlete_id: created_by,
        from_position: 0,
        to_position: 1,
        change: 1,
        reason: 'new_athlete',
        notes: 'Initial ladder entry - starting at bottom position',
        date: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });
      
      await LadderProgression.create({
        ladder_id: ladderId,
        athlete_id: created_by,
        from_position: 0, // No previous position (0 indicates starting)
        to_position: 1, // Starting at bottom position
        change: 1, // Positive change (entering the ladder)
        reason: 'new_athlete',
        notes: 'Initial ladder entry - starting at bottom position',
        date: new Date(),
        created_at: new Date(), // Add missing created_at field
        updated_at: new Date() // Add missing updated_at field
      }, { transaction });

      // 5. Create user boat lineup
      if (!userBoat.selectedBoat?.id) {
        throw new Error('User boat must have a selected boat');
      }

      const userLineup = await GauntletLineup.create({
        gauntlet_id: gauntletId,
        boat_id: userBoat.selectedBoat.id
      }, { transaction });

      // 6. Create seat assignments for user boat
      if (userBoat.selectedRowers && userBoat.selectedRowers.length > 0) {
        for (let index = 0; index < userBoat.selectedRowers.length; index++) {
          const rower = userBoat.selectedRowers[index];
          const seatNumber = index + 1;
          const isScullingBoat = ['1x', '2x', '4x'].includes(boat_type);
          const side = isScullingBoat ? 'scull' : (seatNumber % 2 === 1 ? 'port' : 'starboard');
          
          await GauntletSeatAssignment.create({
            gauntlet_lineup_id: userLineup.getDataValue('gauntlet_lineup_id'),
            athlete_id: rower.id,
            seat_number: seatNumber,
            side
          }, { transaction });
        }
      }

      // 7. Create challenger lineups and seat assignments
      for (const challenger of challengers) {
        if (challenger.selectedBoat && challenger.selectedRowers && challenger.selectedRowers.length > 0) {
          const challengerLineup = await GauntletLineup.create({
            gauntlet_id: gauntletId,
            boat_id: challenger.selectedBoat.id
          }, { transaction });

          for (let index = 0; index < challenger.selectedRowers.length; index++) {
            const rower = challenger.selectedRowers[index];
            const seatNumber = index + 1;
            const isScullingBoat = ['1x', '2x', '4x'].includes(boat_type);
            const side = isScullingBoat ? 'scull' : (seatNumber % 2 === 1 ? 'port' : 'starboard');
            
            await GauntletSeatAssignment.create({
              gauntlet_lineup_id: challengerLineup.getDataValue('gauntlet_lineup_id'),
              athlete_id: rower.id,
              seat_number: seatNumber,
              side
            }, { transaction });
          }
        }
      }

      // Commit the transaction
      await transaction.commit();
      transactionCommitted = true;

      // Fetch the complete gauntlet with all associations (outside transaction)
      const completeGauntlet = await Gauntlet.findByPk(gauntletId, {
        include: [
          {
            model: Athlete,
            as: 'creator',
            attributes: ['athlete_id', 'name', 'email']
          },
          {
            model: Ladder,
            as: 'ladder',
            include: [
              {
                model: LadderPosition,
                as: 'positions',
                include: [
                  {
                    model: Athlete,
                    as: 'athlete',
                    attributes: ['athlete_id', 'name', 'email']
                  }
                ],
                order: [['position', 'ASC']]
              },
              {
                model: LadderProgression,
                as: 'progressions',
                include: [
                  {
                    model: Athlete,
                    as: 'athlete',
                    attributes: ['athlete_id', 'name', 'email']
                  }
                ],
                order: [['date', 'DESC']]
              }
            ]
          },
          {
            model: GauntletLineup,
            as: 'gauntlet_lineups',
            include: [
              {
                model: GauntletSeatAssignment,
                as: 'gauntlet_seat_assignments',
                include: [
                  {
                    model: Athlete,
                    as: 'athlete',
                    attributes: ['athlete_id', 'name', 'email']
                  }
                ]
              }
            ]
          }
        ]
      });

      return res.status(201).json({
        success: true,
        data: completeGauntlet,
        message: 'Comprehensive gauntlet created successfully',
        error: null
      });

    } catch (error) {
      // Only rollback if transaction hasn't been committed yet
      if (!transactionCommitted) {
        await transaction.rollback();
      }
      throw error;
    }

  } catch (error: any) {
    console.error('Error creating comprehensive gauntlet:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to create comprehensive gauntlet',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * PUT /api/gauntlets/:id
 * Update a gauntlet
 */
router.put('/:id', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const gauntlet = await Gauntlet.findByPk(id);
    if (!gauntlet) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet not found',
        error: 'NOT_FOUND'
      });
    }

    // Validate boat type if provided
    if (updates.boat_type) {
      const validBoatTypes = ['1x', '2x', '2-', '4x', '4+', '8+'];
      if (!validBoatTypes.includes(updates.boat_type)) {
        return res.status(400).json({
          success: false,
          data: null,
          message: `Invalid boat_type. Must be one of: ${validBoatTypes.join(', ')}`,
          error: 'VALIDATION_ERROR'
        });
      }
    }

    // Validate status if provided
    if (updates.status) {
      const validStatuses = ['setup', 'active', 'completed', 'cancelled'];
      if (!validStatuses.includes(updates.status)) {
        return res.status(400).json({
          success: false,
          data: null,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          error: 'VALIDATION_ERROR'
        });
      }
    }

    await gauntlet.update(updates);

    // Fetch updated gauntlet with associations
    const updatedGauntlet = await Gauntlet.findByPk(id, {
      include: [
        {
          model: Athlete,
          as: 'creator',
          attributes: ['athlete_id', 'name', 'email']
        },
        {
          model: Ladder,
          as: 'ladder'
        }
      ]
    });

    return res.json({
      success: true,
      data: updatedGauntlet,
      message: 'Gauntlet updated successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error updating gauntlet:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update gauntlet',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * DELETE /api/gauntlets/:id
 * Delete a gauntlet with cascade delete
 */
router.delete('/:id', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const gauntlet = await Gauntlet.findByPk(id);
    if (!gauntlet) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet not found',
        error: 'NOT_FOUND'
      });
    }

    // Get counts before deletion for response
    const [matchesCount, lineupsCount, seatAssignmentsCount, ladderPositionsCount, ladderProgressionsCount] = await Promise.all([
      GauntletMatch.count({ where: { gauntlet_id: id } }),
      GauntletLineup.count({ where: { gauntlet_id: id } }),
      GauntletSeatAssignment.count({ 
        include: [{ model: GauntletLineup, as: 'lineup', where: { gauntlet_id: id } }]
      }),
      LadderPosition.count({ 
        include: [{ model: Ladder, as: 'ladder', where: { gauntlet_id: id } }]
      }),
      LadderProgression.count({ 
        include: [{ model: Ladder, as: 'ladder', where: { gauntlet_id: id } }]
      })
    ]);

    // Manual cascade deletion in correct order to avoid foreign key constraints
    // Use raw SQL to find ladder IDs first, then delete related records
    
    // 1. Find all ladder IDs for this gauntlet
    const ladderResults = await sequelize.query(
      'SELECT ladder_id FROM ladders WHERE gauntlet_id = :gauntletId',
      {
        replacements: { gauntletId: id },
        type: QueryTypes.SELECT
      }
    ) as Array<{ ladder_id: string }>;
    
    const ladderIds = ladderResults.map(r => r.ladder_id);
    
    if (ladderIds.length > 0) {
      // 2. Delete ladder progressions
      await sequelize.query(
        `DELETE FROM ladder_progressions WHERE ladder_id IN (${ladderIds.map(() => '?').join(',')})`,
        {
          replacements: ladderIds,
          type: QueryTypes.DELETE
        }
      );

      // 3. Delete ladder positions
      await sequelize.query(
        `DELETE FROM ladder_positions WHERE ladder_id IN (${ladderIds.map(() => '?').join(',')})`,
        {
          replacements: ladderIds,
          type: QueryTypes.DELETE
        }
      );

      // 4. Delete ladders
      await Ladder.destroy({
        where: { gauntlet_id: id }
      });
    }

    // 5. Find all lineup IDs for this gauntlet
    const lineupResults = await sequelize.query(
      'SELECT gauntlet_lineup_id FROM gauntlet_lineups WHERE gauntlet_id = :gauntletId',
      {
        replacements: { gauntletId: id },
        type: QueryTypes.SELECT
      }
    ) as Array<{ gauntlet_lineup_id: string }>;
    
    const lineupIds = lineupResults.map(r => r.gauntlet_lineup_id);
    
    if (lineupIds.length > 0) {
      // 6. Delete gauntlet seat assignments
      await sequelize.query(
        `DELETE FROM gauntlet_seat_assignments WHERE gauntlet_lineup_id IN (${lineupIds.map(() => '?').join(',')})`,
        {
          replacements: lineupIds,
          type: QueryTypes.DELETE
        }
      );
    }

    // 7. Delete gauntlet lineups
    await GauntletLineup.destroy({
      where: { gauntlet_id: id }
    });

    // 8. Delete gauntlet matches
    await GauntletMatch.destroy({
      where: { gauntlet_id: id }
    });

    // 9. Finally delete the gauntlet itself
    await gauntlet.destroy();

    return res.json({
      success: true,
      data: {
        gauntletDeleted: true,
        deletedCounts: {
          matches: matchesCount,
          lineups: lineupsCount,
          seatAssignments: seatAssignmentsCount,
          ladderPositions: ladderPositionsCount,
          ladderProgressions: ladderProgressionsCount
        }
      },
      message: 'Gauntlet deleted successfully with cascade delete',
      error: null
    });

  } catch (error: any) {
    console.error('Error deleting gauntlet:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to delete gauntlet',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/gauntlets/:id/matches
 * Get all matches for a specific gauntlet
 */
router.get('/:id/matches', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if gauntlet exists
    const gauntlet = await Gauntlet.findByPk(id);
    if (!gauntlet) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet not found',
        error: 'NOT_FOUND'
      });
    }

    const matches = await GauntletMatch.findAll({
      where: { gauntlet_id: id },
      order: [['match_date', 'DESC']]
    });

    return res.json({
      success: true,
      data: matches,
      message: `Found ${matches.length} matches for gauntlet`,
      error: null
    });

  } catch (error: any) {
    console.error('Error fetching gauntlet matches:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch gauntlet matches',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/gauntlets/:gauntletId/lineups
 * Create a new gauntlet lineup
 */
router.post('/:gauntletId/lineups', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { gauntletId } = req.params;
    const athleteId = req.user?.athlete_id;

    if (!athleteId) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Athlete ID required',
        error: 'UNAUTHORIZED'
      });
    }

    // Verify gauntlet exists and user has access
    const gauntlet = await Gauntlet.findByPk(gauntletId);
    if (!gauntlet) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet not found',
        error: 'NOT_FOUND'
      });
    }

    console.log('🔍 Lineup creation auth check:', {
      gauntletId,
      gauntlet_created_by: gauntlet.created_by,
      auth_athlete_id: athleteId,
      match: gauntlet.created_by === athleteId
    });

    if (gauntlet.created_by !== athleteId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Access denied',
        error: 'FORBIDDEN'
      });
    }

    const { boat_id, match_id } = req.body;

    // Validate required fields
    if (!boat_id) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Missing required field: boat_id',
        error: 'VALIDATION_ERROR'
      });
    }

    const lineup = await GauntletLineup.create({
      gauntlet_id: gauntletId!,
      boat_id: boat_id as string,
      match_id: match_id || null
    });

    return res.status(201).json({
      success: true,
      data: lineup,
      message: 'Gauntlet lineup created successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error creating gauntlet lineup:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to create gauntlet lineup',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * PUT /api/gauntlets/:gauntletId/lineups/:lineupId
 * Update a gauntlet lineup
 */
router.put('/:gauntletId/lineups/:lineupId', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { gauntletId, lineupId } = req.params;
    const athleteId = req.user?.athlete_id;

    if (!athleteId) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Athlete ID required',
        error: 'UNAUTHORIZED'
      });
    }

    // Verify gauntlet exists and user has access
    const gauntlet = await Gauntlet.findByPk(gauntletId);
    if (!gauntlet) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet not found',
        error: 'NOT_FOUND'
      });
    }

    if (gauntlet.created_by !== athleteId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Access denied',
        error: 'FORBIDDEN'
      });
    }

    // Find the lineup
    const lineup = await GauntletLineup.findOne({
      where: {
        gauntlet_lineup_id: lineupId,
        gauntlet_id: gauntletId
      }
    });

    if (!lineup) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet lineup not found',
        error: 'NOT_FOUND'
      });
    }

    const { boat_id, match_id } = req.body;

    // Update the lineup
    await lineup.update({
      boat_id: boat_id || lineup.boat_id,
      match_id: match_id !== undefined ? match_id : lineup.match_id
    });

    return res.json({
      success: true,
      data: lineup,
      message: 'Gauntlet lineup updated successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error updating gauntlet lineup:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update gauntlet lineup',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * DELETE /api/gauntlets/:gauntletId/lineups/:lineupId
 * Delete a gauntlet lineup
 */
router.delete('/:gauntletId/lineups/:lineupId', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { gauntletId, lineupId } = req.params;
    const athleteId = req.user?.athlete_id;

    if (!athleteId) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Athlete ID required',
        error: 'UNAUTHORIZED'
      });
    }

    // Verify gauntlet exists and user has access
    const gauntlet = await Gauntlet.findByPk(gauntletId);
    if (!gauntlet) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet not found',
        error: 'NOT_FOUND'
      });
    }

    if (gauntlet.created_by !== athleteId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Access denied',
        error: 'FORBIDDEN'
      });
    }

    // Find the lineup
    const lineup = await GauntletLineup.findOne({
      where: {
        gauntlet_lineup_id: lineupId,
        gauntlet_id: gauntletId
      }
    });

    if (!lineup) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet lineup not found',
        error: 'NOT_FOUND'
      });
    }

    // Delete the lineup (cascade will handle seat assignments)
    await lineup.destroy();

    return res.json({
      success: true,
      data: null,
      message: 'Gauntlet lineup deleted successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error deleting gauntlet lineup:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to delete gauntlet lineup',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/gauntlets/:gauntletId/lineups/:lineupId/seat-assignments
 * Create a new gauntlet seat assignment
 */
router.post('/:gauntletId/lineups/:lineupId/seat-assignments', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { gauntletId, lineupId } = req.params;
    const athleteId = req.user?.athlete_id;

    if (!athleteId) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Athlete ID required',
        error: 'UNAUTHORIZED'
      });
    }

    // Verify gauntlet exists and user has access
    const gauntlet = await Gauntlet.findByPk(gauntletId);
    if (!gauntlet) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet not found',
        error: 'NOT_FOUND'
      });
    }

    console.log('🔍 Seat assignment creation auth check:', {
      gauntletId,
      gauntlet_created_by: gauntlet.created_by,
      auth_athlete_id: athleteId,
      match: gauntlet.created_by === athleteId
    });

    if (gauntlet.created_by !== athleteId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Access denied',
        error: 'FORBIDDEN'
      });
    }

    // Verify lineup exists and belongs to this gauntlet
    const lineup = await GauntletLineup.findOne({
      where: {
        gauntlet_lineup_id: lineupId,
        gauntlet_id: gauntletId
      }
    });

    if (!lineup) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet lineup not found',
        error: 'NOT_FOUND'
      });
    }

    const { athlete_id, seat_number, side, notes } = req.body;

    // Validate required fields
    if (!athlete_id || !seat_number || !side) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Missing required fields: athlete_id, seat_number, side',
        error: 'VALIDATION_ERROR'
      });
    }

    // Validate side enum
    if (!['port', 'starboard', 'scull'].includes(side)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid side. Must be one of: port, starboard, scull',
        error: 'VALIDATION_ERROR'
      });
    }

    const seatAssignment = await GauntletSeatAssignment.create({
      gauntlet_lineup_id: lineupId!,
      athlete_id: athlete_id as string,
      seat_number: seat_number as number,
      side: side as 'port' | 'starboard' | 'scull',
      notes: notes || null
    });

    return res.status(201).json({
      success: true,
      data: seatAssignment,
      message: 'Gauntlet seat assignment created successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error creating gauntlet seat assignment:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to create gauntlet seat assignment',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * PUT /api/gauntlets/:gauntletId/lineups/:lineupId/seat-assignments/:assignmentId
 * Update a gauntlet seat assignment
 */
router.put('/:gauntletId/lineups/:lineupId/seat-assignments/:assignmentId', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { gauntletId, lineupId, assignmentId } = req.params;
    const athleteId = req.user?.athlete_id;

    if (!athleteId) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Athlete ID required',
        error: 'UNAUTHORIZED'
      });
    }

    // Verify gauntlet exists and user has access
    const gauntlet = await Gauntlet.findByPk(gauntletId);
    if (!gauntlet) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet not found',
        error: 'NOT_FOUND'
      });
    }

    if (gauntlet.created_by !== athleteId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Access denied',
        error: 'FORBIDDEN'
      });
    }

    // Find the seat assignment
    const seatAssignment = await GauntletSeatAssignment.findOne({
      where: {
        gauntlet_seat_assignment_id: assignmentId,
        gauntlet_lineup_id: lineupId
      },
      include: [{
        model: GauntletLineup,
        as: 'lineup',
        where: { gauntlet_id: gauntletId }
      }]
    });

    if (!seatAssignment) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet seat assignment not found',
        error: 'NOT_FOUND'
      });
    }

    const { athlete_id, seat_number, side, notes } = req.body;

    // Validate side enum if provided
    if (side && !['port', 'starboard', 'scull'].includes(side)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid side. Must be one of: port, starboard, scull',
        error: 'VALIDATION_ERROR'
      });
    }

    // Update the seat assignment
    await seatAssignment.update({
      athlete_id: athlete_id || seatAssignment.athlete_id,
      seat_number: seat_number || seatAssignment.seat_number,
      side: side || seatAssignment.side,
      notes: notes !== undefined ? notes : seatAssignment.notes
    });

    return res.json({
      success: true,
      data: seatAssignment,
      message: 'Gauntlet seat assignment updated successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error updating gauntlet seat assignment:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update gauntlet seat assignment',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * DELETE /api/gauntlets/:gauntletId/lineups/:lineupId/seat-assignments/:assignmentId
 * Delete a gauntlet seat assignment
 */
router.delete('/:gauntletId/lineups/:lineupId/seat-assignments/:assignmentId', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { gauntletId, lineupId, assignmentId } = req.params;
    const athleteId = req.user?.athlete_id;

    if (!athleteId) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Athlete ID required',
        error: 'UNAUTHORIZED'
      });
    }

    // Verify gauntlet exists and user has access
    const gauntlet = await Gauntlet.findByPk(gauntletId);
    if (!gauntlet) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet not found',
        error: 'NOT_FOUND'
      });
    }

    if (gauntlet.created_by !== athleteId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Access denied',
        error: 'FORBIDDEN'
      });
    }

    // Find the seat assignment
    const seatAssignment = await GauntletSeatAssignment.findOne({
      where: {
        gauntlet_seat_assignment_id: assignmentId,
        gauntlet_lineup_id: lineupId
      },
      include: [{
        model: GauntletLineup,
        as: 'lineup',
        where: { gauntlet_id: gauntletId }
      }]
    });

    if (!seatAssignment) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet seat assignment not found',
        error: 'NOT_FOUND'
      });
    }

    // Delete the seat assignment
    await seatAssignment.destroy();

    return res.json({
      success: true,
      data: null,
      message: 'Gauntlet seat assignment deleted successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error deleting gauntlet seat assignment:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to delete gauntlet seat assignment',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

export { router as gauntletRouter };
