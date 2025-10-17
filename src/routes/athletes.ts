import { Router, Request, Response } from 'express';
import { authMiddleware } from '../auth/middleware';
import Athlete from '../models/Athlete';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

/**
 * GET /api/athletes
 * Get detailed athlete data (protected endpoint)
 * Returns full athlete profiles with all fields
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    // console.log('🔍 Athletes API: Fetching detailed athlete data...');
    
    const athletes = await Athlete.findAll({
      where: {
        active: true,
        competitive_status: 'active'
      },
      order: [['name', 'ASC']],
      raw: true
    });

    // console.log('🔍 Athletes API: Found', athletes.length, 'athletes from database');
    // console.log('🔍 Athletes API: First athlete sample:', athletes[0] ? {
    //   athlete_id: athletes[0].athlete_id,
    //   name: athletes[0].name,
    //   type: athletes[0].type,
    //   gender: athletes[0].gender
    // } : 'No athletes found');

    return res.json({
      success: true,
      data: athletes,
      message: 'Detailed athlete data retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Athletes API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/athletes/:id
 * Get detailed data for a specific athlete (protected endpoint)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // console.log('🔍 Athletes API: Fetching athlete profile for ID:', id);
    
    const athlete = await Athlete.findOne({
      where: {
        athlete_id: id,
        active: true
      },
      raw: true
    });

    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found',
        error: 'ATHLETE_NOT_FOUND'
      });
    }

    // console.log('🔍 Athletes API: Found athlete:', athlete.name);

    return res.json({
      success: true,
      data: athlete,
      message: 'Athlete profile retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Athletes API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

export default router;
