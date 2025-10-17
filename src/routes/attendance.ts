import { Router, Request, Response } from 'express';
import { Attendance, PracticeSession } from '../models';
import { authMiddleware } from '../auth/middleware';
import { Op } from 'sequelize';

const router = Router();

/**
 * GET /api/attendance/athlete/:athleteId
 * Get attendance records for a specific athlete
 */
router.get('/athlete/:athleteId', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { athleteId } = req.params;
    const { 
      startDate, 
      endDate, 
      status,
      includeSessions = 'true'
    } = req.query;

    const whereClause: any = {
      athlete_id: athleteId
    };

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      whereClause['$session.date$'] = {};
      if (startDate) whereClause['$session.date$'][Op.gte] = startDate;
      if (endDate) whereClause['$session.date$'][Op.lte] = endDate;
    }

    const includeOptions = includeSessions === 'true' ? [{
      model: PracticeSession,
      as: 'session',
      attributes: [
        'session_id',
        'team_id',
        'date',
        'start_time',
        'end_time',
        'session_type',
        'location',
        'notes'
      ]
    }] : [];

    const attendanceRecords = await Attendance.findAll({
      where: whereClause,
      include: includeOptions,
      order: [['created_at', 'DESC']],
      attributes: [
        'attendance_id',
        'session_id',
        'athlete_id',
        'status',
        'notes',
        'team_id',
        'created_at',
        'updated_at'
      ]
    });

    return res.json({
      success: true,
      data: attendanceRecords,
      message: `Found ${attendanceRecords.length} attendance records`,
      error: null
    });

  } catch (error: any) {
    console.error('Error fetching athlete attendance:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch attendance records',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/attendance/session/:sessionId
 * Get attendance records for a specific practice session
 */
router.get('/session/:sessionId', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.query;

    const whereClause: any = {
      session_id: sessionId
    };

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    const attendanceRecords = await Attendance.findAll({
      where: whereClause,
      order: [['created_at', 'ASC']],
      attributes: [
        'attendance_id',
        'session_id',
        'athlete_id',
        'status',
        'notes',
        'team_id',
        'created_at',
        'updated_at'
      ]
    });

    return res.json({
      success: true,
      data: attendanceRecords,
      message: `Found ${attendanceRecords.length} attendance records for session`,
      error: null
    });

  } catch (error: any) {
    console.error('Error fetching session attendance:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch session attendance',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/attendance
 * Mark attendance for an athlete at a practice session
 */
router.post('/', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const {
      session_id,
      athlete_id,
      status,
      notes,
      team_id
    } = req.body;

    // Validate required fields
    if (!session_id || !athlete_id || !status || !team_id) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Missing required fields: session_id, athlete_id, status, team_id',
        error: 'VALIDATION_ERROR'
      });
    }

    // Validate status
    const validStatuses = ['Yes', 'No', 'Maybe', 'Late', 'Excused'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        error: 'VALIDATION_ERROR'
      });
    }

    // Check if attendance record already exists
    const existingRecord = await Attendance.findOne({
      where: {
        session_id,
        athlete_id
      }
    });

    let attendanceRecord;

    if (existingRecord) {
      // Update existing record
      await existingRecord.update({
        status,
        notes,
        etl_source: 'api',
        etl_last_sync: new Date()
      });
      attendanceRecord = existingRecord;
    } else {
      // Create new record
      attendanceRecord = await Attendance.create({
        session_id,
        athlete_id,
        status,
        notes,
        team_id,
        etl_source: 'api',
        etl_last_sync: new Date()
      });
    }

    return res.status(201).json({
      success: true,
      data: attendanceRecord,
      message: 'Attendance marked successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error marking attendance:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to mark attendance',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * PUT /api/attendance/:id
 * Update an existing attendance record
 */
router.put('/:id', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate status if provided
    if (status) {
      const validStatuses = ['Yes', 'No', 'Maybe', 'Late', 'Excused'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          data: null,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          error: 'VALIDATION_ERROR'
        });
      }
    }

    const attendanceRecord = await Attendance.findByPk(id);
    if (!attendanceRecord) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Attendance record not found',
        error: 'NOT_FOUND'
      });
    }

    const updateData: any = {
      etl_source: 'api',
      etl_last_sync: new Date()
    };

    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    await attendanceRecord.update(updateData);

    return res.json({
      success: true,
      data: attendanceRecord,
      message: 'Attendance record updated successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error updating attendance:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update attendance record',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * DELETE /api/attendance/:id
 * Delete an attendance record
 */
router.delete('/:id', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const attendanceRecord = await Attendance.findByPk(id);
    if (!attendanceRecord) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Attendance record not found',
        error: 'NOT_FOUND'
      });
    }

    await attendanceRecord.destroy();

    return res.json({
      success: true,
      data: null,
      message: 'Attendance record deleted successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error deleting attendance:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to delete attendance record',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/attendance/stats/athlete/:athleteId
 * Get attendance statistics for an athlete
 */
router.get('/stats/athlete/:athleteId', authMiddleware.verifyToken, async (req: Request, res: Response) => {
  try {
    const { athleteId } = req.params;
    const { startDate, endDate } = req.query;

    const whereClause: any = {
      athlete_id: athleteId
    };

    // Filter by date range
    if (startDate || endDate) {
      whereClause['$session.date$'] = {};
      if (startDate) whereClause['$session.date$'][Op.gte] = startDate;
      if (endDate) whereClause['$session.date$'][Op.lte] = endDate;
    }

    const attendanceRecords = await Attendance.findAll({
      where: whereClause,
      include: [{
        model: PracticeSession,
        as: 'session',
        attributes: ['date']
      }],
      attributes: ['status']
    });

    // Calculate statistics
    const totalSessions = attendanceRecords.length;
    const statusCounts = attendanceRecords.reduce((acc, record) => {
      const status = record.status || 'Not Marked';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const attendanceRate = totalSessions > 0 
      ? ((statusCounts['Yes'] || 0) / totalSessions * 100).toFixed(1)
      : '0.0';

    return res.json({
      success: true,
      data: {
        totalSessions,
        statusCounts,
        attendanceRate: parseFloat(attendanceRate),
        records: attendanceRecords
      },
      message: 'Attendance statistics retrieved successfully',
      error: null
    });

  } catch (error: any) {
    console.error('Error fetching attendance statistics:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch attendance statistics',
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

export { router as attendanceRouter };
