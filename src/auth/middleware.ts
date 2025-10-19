import { Request, Response, NextFunction } from 'express';
import { AuthService } from './authService';
import { JwtPayload } from './types';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Middleware to verify JWT token
   */
  public verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        res.status(401).json({
          success: false,
          message: 'Authorization header is required',
          error: 'MISSING_AUTH_HEADER'
        });
        return;
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Token is required',
          error: 'MISSING_TOKEN'
        });
        return;
      }

      // Verify token
      const result = await this.authService.verifyToken(token);
      
      if (!result.success) {
        res.status(401).json({
          success: false,
          message: result.message || 'Invalid or expired token',
          error: result.error || 'INVALID_TOKEN'
        });
        return;
      }

      // Verify athlete still exists and is active
      const athlete = await this.authService.getAthleteById(result.data!.athlete_id);
      
      console.log('🔍 Auth Middleware - Athlete lookup result:', {
        found: !!athlete,
        athlete_id: result.data!.athlete_id,
        active: athlete?.active,
        competitive_status: athlete?.competitive_status
      });
      
      if (!athlete) {
        res.status(401).json({
          success: false,
          message: 'Athlete not found',
          error: 'ATHLETE_NOT_FOUND'
        });
        return;
      }
      
      if (!athlete.active) {
        res.status(401).json({
          success: false,
          message: 'Athlete account is inactive',
          error: 'INACTIVE_ACCOUNT'
        });
        return;
      }
      
      if (athlete.competitive_status !== 'active') {
        res.status(401).json({
          success: false,
          message: `Athlete competitive status is ${athlete.competitive_status}, not active`,
          error: 'INACTIVE_COMPETITIVE_STATUS'
        });
        return;
      }

      // Add user info to request
      req.user = result.data!;
      next();

    } catch (error) {
      console.error('Token verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Middleware to verify token but allow optional authentication
   */
  public optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        // No auth header, continue without user
        next();
        return;
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      if (!token) {
        // No token, continue without user
        next();
        return;
      }

      // Try to verify token
      const result = await this.authService.verifyToken(token);
      
      if (result.success) {
        // Verify athlete still exists and is active
        const athlete = await this.authService.getAthleteById(result.data!.athlete_id);
        
        if (athlete && athlete.active && athlete.competitive_status === 'active') {
          req.user = result.data!;
        }
      }

      // Continue regardless of auth status
      next();

    } catch (error) {
      console.error('Optional auth error:', error);
      // Continue without user on error
      next();
    }
  };

  /**
   * Middleware to check if user needs to reset PIN
   */
  public checkPinReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      const athlete = await this.authService.getAthleteById(req.user.athlete_id);
      
      if (!athlete) {
        res.status(404).json({
          success: false,
          message: 'Athlete not found',
          error: 'ATHLETE_NOT_FOUND'
        });
        return;
      }

      if (athlete.pin_reset_required) {
        res.status(403).json({
          success: false,
          message: 'PIN reset required',
          error: 'PIN_RESET_REQUIRED',
          data: {
            pin_reset_required: true,
            athlete_id: athlete.athlete_id
          }
        });
        return;
      }

      next();

    } catch (error) {
      console.error('PIN reset check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Middleware to validate athlete ID parameter
   */
  public validateAthleteId = (req: Request, res: Response, next: NextFunction): void => {
    const { athleteId } = req.params;
    
    if (!athleteId) {
      res.status(400).json({
        success: false,
        message: 'Athlete ID is required',
        error: 'MISSING_ATHLETE_ID'
      });
      return;
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(athleteId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid athlete ID format',
        error: 'INVALID_ATHLETE_ID'
      });
      return;
    }

    next();
  };

  /**
   * Middleware to ensure user can only access their own data
   */
  public ensureOwnership = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const { athleteId } = req.params;
    
    if (req.user.athlete_id !== athleteId) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own data.',
        error: 'ACCESS_DENIED'
      });
      return;
    }

    next();
  };
}

// Export middleware instance
export const authMiddleware = new AuthMiddleware();
