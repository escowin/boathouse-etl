import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthService } from './authService';
import { RATE_LIMIT_CONFIG } from './config';
import { 
  LoginRequest, 
  ChangePinRequest, 
  VerifyTokenRequest 
} from './types';

const router = Router();
const authService = new AuthService();

// Rate limiting middleware
const loginLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.login.windowMs,
  max: RATE_LIMIT_CONFIG.login.max,
  message: RATE_LIMIT_CONFIG.login.message,
  standardHeaders: true,
  legacyHeaders: false,
});

const changePinLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.changePin.windowMs,
  max: RATE_LIMIT_CONFIG.changePin.max,
  message: RATE_LIMIT_CONFIG.changePin.message,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /auth/login
 * Authenticate user with PIN
 */
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { athleteId, pin }: LoginRequest = req.body;

    // Validate required fields
    if (!athleteId || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: athleteId, pin',
        error: 'VALIDATION_ERROR'
      });
    }

    const result = await authService.login({ athleteId, pin });
    
    if (result.success) {
      return res.json(result);
    } else {
      const statusCode = result.error === 'ATHLETE_NOT_FOUND' ? 404 : 401;
      return res.status(statusCode).json(result);
    }

  } catch (error) {
    console.error('Login route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /auth/change-pin
 * Change user PIN
 */
router.post('/change-pin', changePinLimiter, async (req: Request, res: Response) => {
  try {
    const { athleteId, currentPin, newPin }: ChangePinRequest = req.body;

    // Validate required fields
    if (!athleteId || !currentPin || !newPin) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: athleteId, currentPin, newPin',
        error: 'VALIDATION_ERROR'
      });
    }

    const result = await authService.changePin({ athleteId, currentPin, newPin });
    
    if (result.success) {
      return res.json(result);
    } else {
      const statusCode = result.error === 'ATHLETE_NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json(result);
    }

  } catch (error) {
    console.error('Change PIN route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /auth/verify
 * Verify JWT token
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { token }: VerifyTokenRequest = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required',
        error: 'VALIDATION_ERROR'
      });
    }

    const payload = authService.verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'INVALID_TOKEN'
      });
    }

    // Get fresh athlete data
    const athlete = await authService.getAthleteById(payload.athlete_id);
    
    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found',
        error: 'ATHLETE_NOT_FOUND'
      });
    }

    return res.json({
      success: true,
      data: {
        valid: true,
        athlete: {
          athlete_id: athlete.athlete_id,
          name: athlete.name,
          email: athlete.email
        }
      },
      message: 'Token is valid'
    });

  } catch (error) {
    console.error('Verify token route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /auth/athletes
 * Get list of active athletes for login dropdown
 */
router.get('/athletes', async (_req: Request, res: Response) => {
  try {
    const athletes = await authService.getActiveAthletes();
    
    return res.json({
      success: true,
      data: athletes,
      message: 'Active athletes retrieved successfully'
    });

  } catch (error) {
    console.error('Get athletes route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /auth/set-default-pin
 * Set default PIN for athlete (admin function)
 */
router.post('/set-default-pin', async (req: Request, res: Response) => {
  try {
    const { athleteId } = req.body;

    if (!athleteId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: athleteId',
        error: 'VALIDATION_ERROR'
      });
    }

    const result = await authService.setDefaultPin(athleteId);
    
    if (result.success) {
      return res.json(result);
    } else {
      const statusCode = result.error === 'ATHLETE_NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json(result);
    }

  } catch (error) {
    console.error('Set default PIN route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /auth/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'authentication'
    },
    message: 'Authentication service is healthy'
  });
});

export default router;
