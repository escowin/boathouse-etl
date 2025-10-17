import { Router, Request, Response } from 'express';
import { Boat } from '../models';
import { authMiddleware } from '../auth/middleware';

const router = Router();

/**
 * GET /api/data/boats
 * Get all boats data
 */
router.get('/data/boats', authMiddleware.verifyToken, async (_req: Request, res: Response) => {
  try {
    const boats = await Boat.findAll({
      where: {
        status: ['Available', 'Reserved', 'In Use']
      },
      attributes: [
        'boat_id',
        'name',
        'type',
        'status',
        'min_weight_kg',
        'max_weight_kg',
        'created_at',
        'updated_at'
      ],
      order: [
        ['type', 'ASC'],
        ['name', 'ASC']
      ]
    });

    // Group boats by type for frontend consumption
    const boatsByType: { [key: string]: any[] } = {};
    
    console.log('Backend: Processing', boats.length, 'boats');
    boats.forEach((boat, index) => {
      console.log(`Backend: Boat ${index} raw:`, boat);
      console.log(`Backend: Boat ${index} fields:`, {
        boat_id: boat.boat_id,
        name: boat.name,
        type: boat.type,
        status: boat.status,
        min_weight_kg: boat.min_weight_kg,
        max_weight_kg: boat.max_weight_kg
      });
      
      const boatData = {
        id: boat.boat_id,
        name: boat.name,
        type: boat.type,
        status: boat.status,
        minWeight: boat.min_weight_kg,
        maxWeight: boat.max_weight_kg
      };
      
      console.log(`Backend: Boat ${index} processed:`, boatData);

      const typeKey = boat.type || 'unknown';
      if (!boatsByType[typeKey]) {
        boatsByType[typeKey] = [];
      }
      boatsByType[typeKey]!.push(boatData);
    });
    
    console.log('Backend: Final boatsByType keys:', Object.keys(boatsByType));

    return res.json({
      success: true,
      data: boatsByType,
      message: `Found ${boats.length} boats`,
      error: null
    });

  } catch (error: any) {
    console.error('Error fetching boats:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch boats data',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/boats
 * Get all boats (alternative endpoint)
 */
router.get('/', authMiddleware.verifyToken, async (_req: Request, res: Response) => {
  try {
    const boats = await Boat.findAll({
      where: {
        status: ['Available', 'Reserved', 'In Use']
      },
      attributes: [
        'boat_id',
        'name',
        'type',
        'status',
        'min_weight_kg',
        'max_weight_kg',
        'created_at',
        'updated_at'
      ],
      order: [
        ['type', 'ASC'],
        ['name', 'ASC']
      ]
    });

    return res.json({
      success: true,
      data: boats,
      message: `Found ${boats.length} boats`,
      error: null
    });

  } catch (error: any) {
    console.error('Error fetching boats:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch boats data',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/boats/:id
 * Get a specific boat by ID
 */
router.get('/:id', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const boat = await Boat.findByPk(id, {
      attributes: [
        'boat_id',
        'name',
        'type',
        'status',
        'min_weight_kg',
        'max_weight_kg',
        'created_at',
        'updated_at'
      ]
    });

    if (!boat) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Boat not found',
        error: 'NOT_FOUND'
      });
    }

    return res.json({
      success: true,
      data: boat,
      message: 'Boat retrieved successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error fetching boat:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch boat data',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

export { router as boatsRouter };
