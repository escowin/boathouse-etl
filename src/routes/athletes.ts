import { Router, Request, Response } from 'express';
import { authMiddleware } from '../auth/middleware';
import Athlete from '../models/Athlete';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

/**
 * GET /api/athletes
 * Get athlete data for IndexedDB storage (protected endpoint)
 * Returns limited athlete data for team management
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    
    const athletes = await Athlete.findAll({
      where: {
        active: true,
        competitive_status: 'active'
      },
      attributes: [
        'athlete_id',
        'name',
        'type',
        'gender',
        'birth_year',
        'sweep_scull',
        'port_starboard',
        'weight_kg',
        'height_cm',
        'usra_age_category_id'
      ],
      order: [['name', 'ASC']],
      raw: true
    });

    // Calculate age for each athlete and add to response
    const currentYear = new Date().getFullYear();
    const athletesWithAge = athletes.map(athlete => ({
      ...athlete,
      age: athlete.birth_year ? currentYear - athlete.birth_year : undefined
    }));

    return res.json({
      success: true,
      data: athletesWithAge,
      message: 'Athlete data for IndexedDB retrieved successfully'
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
 * Get complete profile data for logged-in user (protected endpoint)
 * Returns full profile with contact details for local storage
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const athlete = await Athlete.findOne({
      where: {
        athlete_id: id,
        active: true
      },
      attributes: [
        'athlete_id',
        'name',
        'email',
        'phone',
        'type',
        'gender',
        'birth_year',
        'sweep_scull',
        'port_starboard',
        'bow_in_dark',
        'weight_kg',
        'height_cm',
        'experience_years',
        'usra_age_category_id',
        'us_rowing_number',
        'emergency_contact',
        'emergency_contact_phone',
        'active',
        'competitive_status'
      ],
      raw: true
    });

    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found',
        error: 'ATHLETE_NOT_FOUND'
      });
    }

    // Calculate age and add to response
    const currentYear = new Date().getFullYear();
    const athleteWithAge = {
      ...athlete,
      age: athlete.birth_year ? currentYear - athlete.birth_year : undefined
    };

    return res.json({
      success: true,
      data: athleteWithAge,
      message: 'Complete athlete profile retrieved successfully'
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
