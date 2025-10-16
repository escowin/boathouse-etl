export interface LoginRequest {
  athleteId: string;
  pin: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    refreshToken: string;
    athlete: {
      athlete_id: string;
      name: string;
      email?: string;
      pin_reset_required: boolean;
    };
  };
  message: string;
  error?: string;
}

export interface ChangePinRequest {
  athleteId: string;
  currentPin: string;
  newPin: string;
}

export interface ChangePinResponse {
  success: boolean;
  data?: {
    message: string;
  };
  message: string;
  error?: string;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface VerifyTokenResponse {
  success: boolean;
  data?: {
    valid: boolean;
    athlete?: {
      athlete_id: string;
      name: string;
      email?: string;
    };
  };
  message: string;
  error?: string;
}

export interface JwtPayload {
  athlete_id: string;
  name: string;
  email?: string | undefined;
  iat: number;
  exp: number;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  maxLoginAttempts: number;
  lockoutDuration: number;
  rateLimitWindow: number;
  rateLimitMax: number;
  defaultPin: string;
}
