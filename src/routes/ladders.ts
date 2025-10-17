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
          as: 'Gauntlet',
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
          as: 'Athlete',
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

export { router as ladderRouter };
