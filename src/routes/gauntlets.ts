import { Router, Request, Response } from 'express';
import { 
  Gauntlet, 
  GauntletMatch, 
  GauntletLineup, 
  GauntletSeatAssignment,
  Ladder,
  LadderPosition,
  LadderProgression,
  Athlete,
  Boat
} from '../models';
import { authMiddleware } from '../auth/middleware';
import { Op } from 'sequelize';

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
          as: 'Creator',
          attributes: ['athlete_id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: gauntlets,
      message: `Found ${gauntlets.length} gauntlets`,
      error: null
    });

  } catch (error: any) {
    console.error('Error fetching gauntlets:', error);
    res.status(500).json({
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
          as: 'Creator',
          attributes: ['athlete_id', 'name', 'email']
        },
        {
          model: Ladder,
          as: 'Ladder',
          include: [
            {
              model: LadderPosition,
              as: 'Positions',
              include: [
                {
                  model: Athlete,
                  as: 'Athlete',
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

    res.json({
      success: true,
      data: gauntlet,
      message: 'Gauntlet retrieved successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error fetching gauntlet:', error);
    res.status(500).json({
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
      created_by,
      status = 'setup'
    } = req.body;

    // Validate required fields
    if (!name || !boat_type || !created_by) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Missing required fields: name, boat_type, created_by',
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

    // Create associated ladder
    const ladder = await Ladder.create({
      gauntlet_id: gauntlet.gauntlet_id
    });

    // Fetch the created gauntlet with associations
    const createdGauntlet = await Gauntlet.findByPk(gauntlet.gauntlet_id, {
      include: [
        {
          model: Athlete,
          as: 'Creator',
          attributes: ['athlete_id', 'name', 'email']
        },
        {
          model: Ladder,
          as: 'Ladder'
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdGauntlet,
      message: 'Gauntlet created successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error creating gauntlet:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to create gauntlet',
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
          as: 'Creator',
          attributes: ['athlete_id', 'name', 'email']
        },
        {
          model: Ladder,
          as: 'Ladder'
        }
      ]
    });

    res.json({
      success: true,
      data: updatedGauntlet,
      message: 'Gauntlet updated successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error updating gauntlet:', error);
    res.status(500).json({
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
        include: [{ model: GauntletLineup, as: 'GauntletLineup', where: { gauntlet_id: id } }]
      }),
      LadderPosition.count({ 
        include: [{ model: Ladder, as: 'Ladder', where: { gauntlet_id: id } }]
      }),
      LadderProgression.count({ 
        include: [{ model: Ladder, as: 'Ladder', where: { gauntlet_id: id } }]
      })
    ]);

    // Delete the gauntlet (cascade delete will handle related records)
    await gauntlet.destroy();

    res.json({
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
    res.status(500).json({
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

    res.json({
      success: true,
      data: matches,
      message: `Found ${matches.length} matches for gauntlet`,
      error: null
    });

  } catch (error: any) {
    console.error('Error fetching gauntlet matches:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch gauntlet matches',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

export { router as gauntletRouter };
