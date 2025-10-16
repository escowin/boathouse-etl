import { Router, Request, Response } from 'express';
import { GauntletMatch, Gauntlet } from '../models';
import { authMiddleware } from '../auth/middleware';

const router = Router();

/**
 * POST /api/gauntlet-matches
 * Create a new gauntlet match
 */
router.post('/', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const {
      gauntlet_id,
      workout,
      sets,
      user_wins = 0,
      user_losses = 0,
      match_date,
      notes
    } = req.body;

    // Validate required fields
    if (!gauntlet_id || !workout || !sets || !match_date) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Missing required fields: gauntlet_id, workout, sets, match_date',
        error: 'VALIDATION_ERROR'
      });
    }

    // Check if gauntlet exists
    const gauntlet = await Gauntlet.findByPk(gauntlet_id);
    if (!gauntlet) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet not found',
        error: 'NOT_FOUND'
      });
    }

    // Validate sets
    if (sets < 1) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Sets must be at least 1',
        error: 'VALIDATION_ERROR'
      });
    }

    // Validate wins/losses
    if (user_wins < 0 || user_losses < 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Wins and losses must be non-negative',
        error: 'VALIDATION_ERROR'
      });
    }

    if (user_wins + user_losses > sets) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Total wins and losses cannot exceed total sets',
        error: 'VALIDATION_ERROR'
      });
    }

    // Create match
    const match = await GauntletMatch.create({
      gauntlet_id,
      workout,
      sets,
      user_wins,
      user_losses,
      match_date,
      notes
    });

    res.status(201).json({
      success: true,
      data: match,
      message: 'Gauntlet match created successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error creating gauntlet match:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to create gauntlet match',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * PUT /api/gauntlet-matches/:id
 * Update a gauntlet match
 */
router.put('/:id', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const match = await GauntletMatch.findByPk(id);
    if (!match) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet match not found',
        error: 'NOT_FOUND'
      });
    }

    // Validate sets if provided
    if (updates.sets !== undefined && updates.sets < 1) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Sets must be at least 1',
        error: 'VALIDATION_ERROR'
      });
    }

    // Validate wins/losses if provided
    const wins = updates.user_wins !== undefined ? updates.user_wins : match.user_wins;
    const losses = updates.user_losses !== undefined ? updates.user_losses : match.user_losses;
    const totalSets = updates.sets !== undefined ? updates.sets : match.sets;

    if (wins < 0 || losses < 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Wins and losses must be non-negative',
        error: 'VALIDATION_ERROR'
      });
    }

    if (wins + losses > totalSets) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Total wins and losses cannot exceed total sets',
        error: 'VALIDATION_ERROR'
      });
    }

    await match.update(updates);

    res.json({
      success: true,
      data: match,
      message: 'Gauntlet match updated successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error updating gauntlet match:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update gauntlet match',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * DELETE /api/gauntlet-matches/:id
 * Delete a gauntlet match
 */
router.delete('/:id', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const match = await GauntletMatch.findByPk(id);
    if (!match) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Gauntlet match not found',
        error: 'NOT_FOUND'
      });
    }

    await match.destroy();

    res.json({
      success: true,
      data: { success: true },
      message: 'Gauntlet match deleted successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error deleting gauntlet match:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to delete gauntlet match',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

export { router as gauntletMatchRouter };
