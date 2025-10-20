import { Router, Request, Response } from 'express';
import { LadderPosition, Ladder, Athlete } from '../models';
import { authMiddleware } from '../auth/middleware';

const router = Router();

/**
 * POST /api/ladder-positions
 * Create a new ladder position
 */
router.post('/', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const {
      ladder_id,
      athlete_id,
      position,
      previous_position,
      wins = 0,
      losses = 0,
      draws = 0,
      win_rate = 0,
      total_matches = 0,
      points = 0,
      streak_type = 'none',
      streak_count = 0,
      last_match_date,
      joined_date
    } = req.body;

    // Validate required fields
    if (!ladder_id || !athlete_id || position === undefined) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Missing required fields: ladder_id, athlete_id, position',
        error: 'VALIDATION_ERROR'
      });
    }

    // Check if ladder exists
    const ladder = await Ladder.findByPk(ladder_id);
    if (!ladder) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Ladder not found',
        error: 'NOT_FOUND'
      });
    }

    // Check if athlete exists
    const athlete = await Athlete.findByPk(athlete_id);
    if (!athlete) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Athlete not found',
        error: 'NOT_FOUND'
      });
    }

    // Validate position
    if (position < 1) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Position must be at least 1',
        error: 'VALIDATION_ERROR'
      });
    }

    // Validate streak type
    const validStreakTypes = ['win', 'loss', 'draw', 'none'];
    if (!validStreakTypes.includes(streak_type)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Invalid streak_type. Must be one of: ${validStreakTypes.join(', ')}`,
        error: 'VALIDATION_ERROR'
      });
    }

    // Check if athlete already has a position in this ladder
    const existingPosition = await LadderPosition.findOne({
      where: {
        ladder_id,
        athlete_id
      }
    });

    if (existingPosition) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Athlete already has a position in this ladder',
        error: 'DUPLICATE_ERROR'
      });
    }

    // Create ladder position
    const ladderPosition = await LadderPosition.create({
      ladder_id,
      athlete_id,
      position,
      previous_position,
      wins,
      losses,
      draws,
      win_rate,
      total_matches,
      points,
      streak_type,
      streak_count,
      last_match_date,
      joined_date: joined_date || new Date().toISOString().split('T')[0]
    });

    // Fetch the created position with associations
    const createdPosition = await LadderPosition.findByPk(ladderPosition.position_id, {
      include: [
        {
          model: Athlete,
          as: 'athlete',
          attributes: ['athlete_id', 'name', 'email']
        },
        {
          model: Ladder,
          as: 'ladder'
        }
      ]
    });

    return res.status(201).json({
      success: true,
      data: createdPosition,
      message: 'Ladder position created successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error creating ladder position:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to create ladder position',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * PUT /api/ladder-positions/:id
 * Update a ladder position
 */
router.put('/:id', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const position = await LadderPosition.findByPk(id);
    if (!position) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Ladder position not found',
        error: 'NOT_FOUND'
      });
    }

    // Validate position if provided
    if (updates.position !== undefined && updates.position < 1) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Position must be at least 1',
        error: 'VALIDATION_ERROR'
      });
    }

    // Validate streak type if provided
    if (updates.streak_type) {
      const validStreakTypes = ['win', 'loss', 'draw', 'none'];
      if (!validStreakTypes.includes(updates.streak_type)) {
        return res.status(400).json({
          success: false,
          data: null,
          message: `Invalid streak_type. Must be one of: ${validStreakTypes.join(', ')}`,
          error: 'VALIDATION_ERROR'
        });
      }
    }

    await position.update(updates);

    // Fetch updated position with associations
    const updatedPosition = await LadderPosition.findByPk(id, {
      include: [
        {
          model: Athlete,
          as: 'athlete',
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
      data: updatedPosition,
      message: 'Ladder position updated successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error updating ladder position:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update ladder position',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

export { router as ladderPositionRouter };
