import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Athlete from '../models/Athlete';
import { authConfig, PIN_VALIDATION } from './config';
import { 
  LoginRequest, 
  LoginResponse, 
  ChangePinRequest, 
  ChangePinResponse,
  JwtPayload 
} from './types';

export class AuthService {
  /**
   * Validate PIN format and strength
   */
  private validatePin(pin: string): { valid: boolean; error?: string } {
    if (!pin || typeof pin !== 'string') {
      return { valid: false, error: 'PIN is required' };
    }

    if (pin.length !== PIN_VALIDATION.length) {
      return { valid: false, error: `PIN must be exactly ${PIN_VALIDATION.length} digits` };
    }

    if (!/^\d+$/.test(pin)) {
      return { valid: false, error: 'PIN must contain only numbers' };
    }

    if (PIN_VALIDATION.weakPatterns.includes(pin)) {
      return { valid: false, error: 'PIN is too weak. Please choose a different PIN.' };
    }

    return { valid: true };
  }

  /**
   * Hash a PIN with bcrypt
   */
  private async hashPin(pin: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(pin, saltRounds);
  }

  /**
   * Compare a PIN with its hash
   */
  private async comparePin(pin: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(pin, hash);
  }

  /**
   * Generate JWT token
   */
  private generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, authConfig.jwtSecret, {
      expiresIn: authConfig.jwtExpiresIn
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, authConfig.jwtSecret, {
      expiresIn: authConfig.refreshTokenExpiresIn
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  public verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, authConfig.jwtSecret) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if account is locked
   */
  private isAccountLocked(athlete: Athlete): boolean {
    if (!athlete.locked_until) {
      return false;
    }
    return new Date() < new Date(athlete.locked_until);
  }

  /**
   * Lock account for specified duration
   */
  private async lockAccount(athlete: Athlete, duration: number): Promise<void> {
    const lockUntil = new Date(Date.now() + duration);
    await athlete.update({
      locked_until: lockUntil,
      failed_login_attempts: athlete.failed_login_attempts + 1
    });
  }

  /**
   * Unlock account and reset failed attempts
   */
  private async unlockAccount(athlete: Athlete): Promise<void> {
    await athlete.update({
      locked_until: null as any,
      failed_login_attempts: 0,
      last_login: new Date()
    });
  }

  /**
   * Authenticate user with PIN
   */
  public async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      const { athleteId, pin } = request;

      // Validate PIN format
      const pinValidation = this.validatePin(pin);
      if (!pinValidation.valid) {
        return {
          success: false,
          message: pinValidation.error || 'Invalid PIN format',
          error: 'INVALID_PIN_FORMAT'
        };
      }

      // Find athlete
      const athlete = await Athlete.findByPk(athleteId);
      if (!athlete) {
        return {
          success: false,
          message: 'Athlete not found',
          error: 'ATHLETE_NOT_FOUND'
        };
      }

      // Check if account is locked
      if (this.isAccountLocked(athlete)) {
        const lockTime = new Date(athlete.locked_until!).toLocaleString();
        return {
          success: false,
          message: `Account is locked until ${lockTime}`,
          error: 'ACCOUNT_LOCKED'
        };
      }

      // Check if PIN is set
      if (!athlete.pin_hash) {
        return {
          success: false,
          message: 'PIN not set. Please contact administrator.',
          error: 'PIN_NOT_SET'
        };
      }

      // Verify PIN
      const pinValid = await this.comparePin(pin, athlete.pin_hash);
      if (!pinValid) {
        // Increment failed attempts
        const newAttempts = athlete.failed_login_attempts + 1;
        
        if (newAttempts >= authConfig.maxLoginAttempts) {
          // Lock account
          await this.lockAccount(athlete, authConfig.lockoutDuration);
          return {
            success: false,
            message: `Account locked due to ${authConfig.maxLoginAttempts} failed attempts`,
            error: 'ACCOUNT_LOCKED'
          };
        } else {
          // Update failed attempts
          await athlete.update({ failed_login_attempts: newAttempts });
          return {
            success: false,
            message: `Invalid PIN. ${authConfig.maxLoginAttempts - newAttempts} attempts remaining.`,
            error: 'INVALID_PIN'
          };
        }
      }

      // Successful login - unlock account and generate tokens
      await this.unlockAccount(athlete);

      const tokenPayload = {
        athlete_id: athlete.athlete_id,
        name: athlete.name,
        ...(athlete.email && { email: athlete.email })
      };

      const token = this.generateToken(tokenPayload);
      const refreshToken = this.generateRefreshToken(tokenPayload);

      return {
        success: true,
        data: {
          token,
          refreshToken,
          athlete: {
            athlete_id: athlete.athlete_id,
            name: athlete.name,
            ...(athlete.email && { email: athlete.email }),
            pin_reset_required: athlete.pin_reset_required
          }
        },
        message: 'Login successful'
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Change user PIN
   */
  public async changePin(request: ChangePinRequest): Promise<ChangePinResponse> {
    try {
      const { athleteId, currentPin, newPin } = request;

      // Validate new PIN
      const pinValidation = this.validatePin(newPin);
      if (!pinValidation.valid) {
        return {
          success: false,
          message: pinValidation.error || 'Invalid PIN format',
          error: 'INVALID_PIN_FORMAT'
        };
      }

      // Find athlete
      const athlete = await Athlete.findByPk(athleteId);
      if (!athlete) {
        return {
          success: false,
          message: 'Athlete not found',
          error: 'ATHLETE_NOT_FOUND'
        };
      }

      // Check if account is locked
      if (this.isAccountLocked(athlete)) {
        return {
          success: false,
          message: 'Account is locked',
          error: 'ACCOUNT_LOCKED'
        };
      }

      // Verify current PIN
      if (athlete.pin_hash) {
        const currentPinValid = await this.comparePin(currentPin, athlete.pin_hash);
        if (!currentPinValid) {
          return {
            success: false,
            message: 'Current PIN is incorrect',
            error: 'INVALID_CURRENT_PIN'
          };
        }
      }

      // Hash new PIN
      const newPinHash = await this.hashPin(newPin);

      // Update athlete
      await athlete.update({
        pin_hash: newPinHash,
        pin_created_at: new Date(),
        pin_reset_required: false,
        failed_login_attempts: 0,
        locked_until: null as any
      });

      return {
        success: true,
        data: {
          message: 'PIN changed successfully'
        },
        message: 'PIN changed successfully'
      };

    } catch (error) {
      console.error('Change PIN error:', error);
      return {
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Set default PIN for new athlete
   */
  public async setDefaultPin(athleteId: string): Promise<ChangePinResponse> {
    try {
      const athlete = await Athlete.findByPk(athleteId);
      if (!athlete) {
        return {
          success: false,
          message: 'Athlete not found',
          error: 'ATHLETE_NOT_FOUND'
        };
      }

      const defaultPinHash = await this.hashPin(authConfig.defaultPin);

      await athlete.update({
        pin_hash: defaultPinHash,
        pin_created_at: new Date(),
        pin_reset_required: true,
        failed_login_attempts: 0,
        locked_until: null as any
      });

      return {
        success: true,
        data: {
          message: 'Default PIN set successfully'
        },
        message: 'Default PIN set successfully'
      };

    } catch (error) {
      console.error('Set default PIN error:', error);
      return {
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get athlete by ID (for token verification)
   */
  public async getAthleteById(athleteId: string): Promise<Athlete | null> {
    try {
      return await Athlete.findByPk(athleteId);
    } catch (error) {
      console.error('Get athlete error:', error);
      return null;
    }
  }

  /**
   * Get list of active athletes for login dropdown
   */
  public async getActiveAthletes(): Promise<Array<{athlete_id: string; name: string}>> {
    try {
      console.log('🔍 AuthService: Fetching active athletes...');
      
      const athletes = await Athlete.findAll({
        where: {
          active: true,
          competitive_status: 'active'
        },
        attributes: ['athlete_id', 'name'],
        order: [['name', 'ASC']],
        raw: true // Use raw query to avoid Sequelize model issues
      });

      console.log('🔍 AuthService: Found', athletes.length, 'athletes from database');
      console.log('🔍 AuthService: First athlete sample:', athletes[0] || 'No athletes found');

      return athletes;
    } catch (error) {
      console.error('❌ Get active athletes error:', error);
      return [];
    }
  }
}
