import { Router, Request, Response } from 'express';
import { Ladder, LadderPosition, Athlete, Gauntlet } from '../models';
import { authMiddleware } from '../auth/middleware';

const router = Router();

/**
 * GET /api/ladders
 * Get all ladders
 */
router.get('/', authMiddleware.verifyToken, async (_req: Request, res: Response) => {
  try {
    const ladders = await Ladder.findAll({
      include: [
        {
          model: Gauntlet,
          as: 'gauntlet',
          attributes: ['gauntlet_id', 'name', 'boat_type', 'status']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      data: ladders,
      message: `Found ${ladders.length} ladders`,
      error: null
    });

  } catch (error: any) {
    console.error('Error fetching ladders:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch ladders',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/ladders/:id/positions
 * Get all positions for a specific ladder
 */
router.get('/:id/positions', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if ladder exists
    const ladder = await Ladder.findByPk(id);
    if (!ladder) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Ladder not found',
        error: 'NOT_FOUND'
      });
    }

    const positions = await LadderPosition.findAll({
      where: { ladder_id: id },
      include: [
        {
          model: Athlete,
          as: 'athlete',
          attributes: ['athlete_id', 'name', 'email']
        }
      ],
      order: [['position', 'ASC']]
    });

    return res.json({
      success: true,
      data: positions,
      message: `Found ${positions.length} ladder positions`,
      error: null
    });

  } catch (error: any) {
    console.error('Error fetching ladder positions:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch ladder positions',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/ladders
 * Create a new ladder
 */
router.post('/', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const athleteId = req.user?.athlete_id;

    if (!athleteId) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Athlete ID required',
        error: 'UNAUTHORIZED'
      });
    }

    const { gauntlet_id } = req.body;

    // Validate required fields
    if (!gauntlet_id) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Missing required field: gauntlet_id',
        error: 'VALIDATION_ERROR'
      });
    }

    // Verify gauntlet exists and user has access
    const gauntlet = await Gauntlet.findByPk(gauntlet_id);
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

    const ladder = await Ladder.create({
      gauntlet_id
    });

    return res.status(201).json({
      success: true,
      data: ladder,
      message: 'Ladder created successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error creating ladder:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to create ladder',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * PUT /api/ladders/:ladderId
 * Update a ladder
 */
router.put('/:ladderId', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { ladderId } = req.params;
    const athleteId = req.user?.athlete_id;

    if (!athleteId) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Athlete ID required',
        error: 'UNAUTHORIZED'
      });
    }

    // Find the ladder with its associated gauntlet
    const ladder = await Ladder.findByPk(ladderId, {
      include: [{
        model: Gauntlet,
        as: 'gauntlet'
      }]
    });

    if (!ladder) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Ladder not found',
        error: 'NOT_FOUND'
      });
    }

    // Check if user has access to the associated gauntlet
    if ((ladder as any).gauntlet.created_by !== athleteId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Access denied',
        error: 'FORBIDDEN'
      });
    }

    const { gauntlet_id } = req.body;

    // Update the ladder
    await ladder.update({
      gauntlet_id: gauntlet_id || ladder.gauntlet_id
    });

    return res.json({
      success: true,
      data: ladder,
      message: 'Ladder updated successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error updating ladder:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update ladder',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * DELETE /api/ladders/:ladderId
 * Delete a ladder
 */
router.delete('/:ladderId', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { ladderId } = req.params;
    const athleteId = req.user?.athlete_id;

    if (!athleteId) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Athlete ID required',
        error: 'UNAUTHORIZED'
      });
    }

    // Find the ladder with its associated gauntlet
    const ladder = await Ladder.findByPk(ladderId, {
      include: [{
        model: Gauntlet,
        as: 'gauntlet'
      }]
    });

    if (!ladder) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Ladder not found',
        error: 'NOT_FOUND'
      });
    }

    // Check if user has access to the associated gauntlet
    if ((ladder as any).gauntlet.created_by !== athleteId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Access denied',
        error: 'FORBIDDEN'
      });
    }

    // Delete the ladder (cascade will handle ladder positions and progressions)
    await ladder.destroy();

    return res.json({
      success: true,
      data: null,
      message: 'Ladder deleted successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error deleting ladder:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to delete ladder',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

export { router as ladderRouter };
