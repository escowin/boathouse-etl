import { Router, Request, Response } from 'express';
import { authMiddleware } from '../auth/middleware';
import { lineupService } from '../services/lineupService';

const router = Router();

/**
 * GET /api/lineups/practice-session/:sessionId
 * Get all lineups for a specific practice session
 */
router.get('/practice-session/:sessionId', authMiddleware.verifyToken, async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const { teamId } = req.query;
        const athleteId = req.user?.athlete_id;

        if (!athleteId) {
            return res.status(401).json({ error: 'Athlete ID required' });
        }

        const lineups = await lineupService.getLineupsForSession(
            parseInt(sessionId!),
            teamId ? parseInt(teamId as string) : undefined
        );

        return res.json({
            success: true,
            data: lineups,
            message: `Found ${lineups.length} lineups for session ${sessionId}`
        });
    } catch (error) {
        console.error('Error fetching lineups for session:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch lineups'
        });
    }
});

/**
 * GET /api/lineups/athlete/:athlete_id
 * Get all lineups created by a specific athlete
 */
router.get('/athlete/:athlete_id', authMiddleware.verifyToken, async (req: Request, res: Response) => {
    try {
        const { athleteId } = req.params;
        const { teamId } = req.query;
        const requestingAthleteId = req.user?.athlete_id;

        if (!requestingAthleteId) {
            return res.status(401).json({ error: 'Athlete ID required' });
        }

        // Athletes can only view their own lineups
        if (athleteId !== requestingAthleteId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const lineups = await lineupService.getLineupsByAthlete(
            athleteId,
            teamId ? parseInt(teamId as string) : undefined
        );

        return res.json({
            success: true,
            data: lineups,
            message: `Found ${lineups.length} lineups for athlete ${athleteId}`
        });
    } catch (error) {
        console.error('Error fetching lineups by athlete:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch lineups'
        });
    }
});

/**
 * GET /api/lineups/:lineupId
 * Get a specific lineup by ID
 */
router.get('/:lineupId', authMiddleware.verifyToken, async (req: Request, res: Response) => {
    try {
        const { lineupId } = req.params;
        const athleteId = req.user?.athlete_id;

        if (!athleteId) {
            return res.status(401).json({ error: 'Athlete ID required' });
        }

        const lineup = await lineupService.getLineupById(lineupId!);

        if (!lineup) {
            return res.status(404).json({
                success: false,
                error: 'Lineup not found'
            });
        }

        return res.json({
            success: true,
            data: lineup,
            message: 'Lineup retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching lineup:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch lineup'
        });
    }
});

/**
 * POST /api/lineups
 * Create a new lineup
 */
router.post('/', authMiddleware.verifyToken, async (req: Request, res: Response) => {
    try {
        const athleteId = req.user?.athlete_id;

        if (!athleteId) {
            return res.status(401).json({ error: 'Athlete ID required' });
        }

        const lineupData = req.body;
        
        // Validate required fields
        if (!lineupData.session_id || !lineupData.boat_id || !lineupData.team_id) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: session_id, boat_id, team_id'
            });
        }

        if (!lineupData.seat_assignments || !Array.isArray(lineupData.seat_assignments)) {
            return res.status(400).json({
                success: false,
                error: 'seat_assignments array is required'
            });
        }

        const lineup = await lineupService.createLineup(lineupData);

        return res.status(201).json({
            success: true,
            data: lineup,
            message: 'Lineup created successfully'
        });
    } catch (error) {
        console.error('Error creating lineup:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create lineup'
        });
    }
});

/**
 * PUT /api/lineups/:lineupId
 * Update an existing lineup
 */
router.put('/:lineupId', authMiddleware.verifyToken, async (req: Request, res: Response) => {
    try {
        const { lineupId } = req.params;
        const athleteId = req.user?.athlete_id;

        if (!athleteId) {
            return res.status(401).json({ error: 'Athlete ID required' });
        }

        const updateData = req.body;

        const lineup = await lineupService.updateLineup(lineupId!, updateData);

        return res.json({
            success: true,
            data: lineup,
            message: 'Lineup updated successfully'
        });
    } catch (error) {
        console.error('Error updating lineup:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update lineup'
        });
    }
});

/**
 * DELETE /api/lineups/:lineupId
 * Delete a lineup
 */
router.delete('/:lineupId', authMiddleware.verifyToken, async (req: Request, res: Response) => {
    try {
        const { lineupId } = req.params;
        const athleteId = req.user?.athlete_id;

        if (!athleteId) {
            return res.status(401).json({ error: 'Athlete ID required' });
        }

        await lineupService.deleteLineup(lineupId!);

        return res.json({
            success: true,
            message: 'Lineup deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting lineup:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete lineup'
        });
    }
});

/**
 * GET /api/lineups/available-athletes/:sessionId
 * Get available athletes for a practice session
 */
router.get('/available-athletes/:sessionId', authMiddleware.verifyToken, async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const { teamId } = req.query;
        const athleteId = req.user?.athlete_id;

        if (!athleteId) {
            return res.status(401).json({ error: 'Athlete ID required' });
        }

        if (!teamId) {
            return res.status(400).json({ error: 'teamId is required' });
        }

        const athletes = await lineupService.getAvailableAthletesForSession(
            parseInt(sessionId!),
            parseInt(teamId as string)
        );

        return res.json({
            success: true,
            data: athletes,
            message: `Found ${athletes.length} available athletes for session ${sessionId}`
        });
    } catch (error) {
        console.error('Error fetching available athletes:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch available athletes'
        });
    }
});

/**
 * GET /api/lineups/available-boats/:sessionId
 * Get available boats for a practice session
 */
router.get('/available-boats/:sessionId', authMiddleware.verifyToken, async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const { teamId } = req.query;
        const athleteId = req.user?.athlete_id;

        if (!athleteId) {
            return res.status(401).json({ error: 'Athlete ID required' });
        }

        if (!teamId) {
            return res.status(400).json({ error: 'teamId is required' });
        }

        const boats = await lineupService.getAvailableBoatsForSession(
            parseInt(sessionId!),
            parseInt(teamId as string)
        );

        return res.json({
            success: true,
            data: boats,
            message: `Found ${boats.length} available boats for session ${sessionId}`
        });
    } catch (error) {
        console.error('Error fetching available boats:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch available boats'
        });
    }
});

export default router;