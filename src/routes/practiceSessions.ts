import { Router, Request, Response } from 'express';
import { PracticeSession } from '../models';
import { authMiddleware } from '../auth/middleware';
import { Op } from 'sequelize';

const router = Router();

/**
 * GET /api/practice-sessions
 * Get practice sessions with optional filtering
 */
router.get('/', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { 
      viewType = 'upcoming', 
      teamId, 
      startDate, 
      endDate,
      sessionType 
    } = req.query;

    const whereClause: any = {};

    // Filter by team if specified
    if (teamId) {
      whereClause.team_id = teamId;
    }

    // Filter by date range
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date[Op.gte] = startDate;
      if (endDate) whereClause.date[Op.lte] = endDate;
    }

    // Filter by session type
    if (sessionType) {
      whereClause.session_type = sessionType;
    }

    // Filter by upcoming vs previous
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (viewType === 'upcoming') {
      whereClause.date = { ...whereClause.date, [Op.gte]: today };
    } else if (viewType === 'previous') {
      whereClause.date = { ...whereClause.date, [Op.lt]: today };
    }

    const sessions = await PracticeSession.findAll({
      where: whereClause,
      order: [['date', 'ASC'], ['start_time', 'ASC']],
      attributes: [
        'session_id',
        'team_id',
        'date',
        'start_time',
        'end_time',
        'session_type',
        'location',
        'notes',
        'created_at',
        'updated_at'
      ]
    });

    res.json({
      success: true,
      data: sessions,
      message: `Found ${sessions.length} practice sessions`,
      error: null
    });

  } catch (error: any) {
    console.error('Error fetching practice sessions:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch practice sessions',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/practice-sessions/:id
 * Get a specific practice session
 */
router.get('/:id', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const session = await PracticeSession.findByPk(id, {
      attributes: [
        'session_id',
        'team_id',
        'date',
        'start_time',
        'end_time',
        'session_type',
        'location',
        'notes',
        'created_at',
        'updated_at'
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Practice session not found',
        error: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: session,
      message: 'Practice session retrieved successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error fetching practice session:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch practice session',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/practice-sessions
 * Create a new practice session (admin only)
 */
router.post('/', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const {
      team_id,
      date,
      start_time,
      end_time,
      session_type = 'Practice',
      location,
      notes
    } = req.body;

    // Validate required fields
    if (!team_id || !date || !start_time) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Missing required fields: team_id, date, start_time',
        error: 'VALIDATION_ERROR'
      });
    }

    const session = await PracticeSession.create({
      team_id,
      date,
      start_time,
      end_time,
      session_type,
      location,
      notes
    });

    res.status(201).json({
      success: true,
      data: session,
      message: 'Practice session created successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error creating practice session:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to create practice session',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * PUT /api/practice-sessions/:id
 * Update a practice session (admin only)
 */
router.put('/:id', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const session = await PracticeSession.findByPk(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Practice session not found',
        error: 'NOT_FOUND'
      });
    }

    await session.update(updateData);

    res.json({
      success: true,
      data: session,
      message: 'Practice session updated successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error updating practice session:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update practice session',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * DELETE /api/practice-sessions/:id
 * Delete a practice session (admin only)
 */
router.delete('/:id', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const session = await PracticeSession.findByPk(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Practice session not found',
        error: 'NOT_FOUND'
      });
    }

    await session.destroy();

    res.json({
      success: true,
      data: null,
      message: 'Practice session deleted successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error deleting practice session:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to delete practice session',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

export { router as practiceSessionsRouter };
