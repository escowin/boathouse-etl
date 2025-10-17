import { AuthConfig } from './types';

export const authConfig: AuthConfig = {
  jwtSecret: process.env['JWT_SECRET'] || 'your-jwt-secret-key-here',
  jwtExpiresIn: '24h',
  refreshTokenExpiresIn: '7d',
  maxLoginAttempts: 3,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  rateLimitWindow: 5 * 60 * 1000, // 5 minutes
  rateLimitMax: 10,
  defaultPin: process.env['DEFAULT_PIN'] || '000000'
};

// PIN validation rules
export const PIN_VALIDATION = {
  length: 6
  // Removed weakPatterns - users can choose any PIN they want
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
      success: false,
      message: 'Too many login attempts. Please try again later.',
      error: 'RATE_LIMIT_EXCEEDED'
    }
  },
  changePin: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // 3 attempts per window
    message: {
      success: false,
      message: 'Too many PIN change attempts. Please try again later.',
      error: 'RATE_LIMIT_EXCEEDED'
    }
  }
};
