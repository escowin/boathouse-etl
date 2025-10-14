/**
 * Environment configuration with proper typing
 */

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

interface EnvironmentConfig {
  // Database
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_SSL: boolean;
  
  // Application
  NODE_ENV: string;
  
  // Google Sheets
  GOOGLE_SHEETS_CREDENTIALS_PATH: string;
  GOOGLE_SHEETS_SPREADSHEET_ID: string;
  GOOGLE_SHEETS_ATHLETES_SHEET_NAME: string;
  GOOGLE_SHEETS_BOATS_SHEET_NAME: string;
  GOOGLE_SHEETS_PRACTICE_SESSIONS_SHEET_NAME: string;
  
  // ETL
  ETL_BATCH_SIZE: number;
  ETL_RETRY_ATTEMPTS: number;
  ETL_RETRY_DELAY_MS: number;
  ETL_LOG_LEVEL: string;
}

function getEnvVar(key: keyof EnvironmentConfig, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getEnvNumber(key: keyof EnvironmentConfig, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

function getEnvBoolean(key: keyof EnvironmentConfig, defaultValue: boolean): boolean {
  const value = process.env[key];
  return value ? value.toLowerCase() === 'true' : defaultValue;
}

export const env: EnvironmentConfig = {
  // Database
  DB_HOST: getEnvVar('DB_HOST', 'localhost'),
  DB_PORT: getEnvNumber('DB_PORT', 5432),
  DB_NAME: getEnvVar('DB_NAME', 'boathouse_trc'),
  DB_USER: getEnvVar('DB_USER', 'postgres'),
  DB_PASSWORD: getEnvVar('DB_PASSWORD', ''),
  DB_SSL: getEnvBoolean('DB_SSL', false),
  
  // Application
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  
      // Google Sheets
      GOOGLE_SHEETS_CREDENTIALS_PATH: getEnvVar('GOOGLE_SHEETS_CREDENTIALS_PATH', './credentials/google-service-account.json'),
      GOOGLE_SHEETS_SPREADSHEET_ID: getEnvVar('GOOGLE_SHEETS_SPREADSHEET_ID', ''),
      GOOGLE_SHEETS_ATHLETES_SHEET_NAME: getEnvVar('GOOGLE_SHEETS_ATHLETES_SHEET_NAME', 'Rowers'),
      GOOGLE_SHEETS_BOATS_SHEET_NAME: getEnvVar('GOOGLE_SHEETS_BOATS_SHEET_NAME', 'Boats'),
      GOOGLE_SHEETS_PRACTICE_SESSIONS_SHEET_NAME: getEnvVar('GOOGLE_SHEETS_PRACTICE_SESSIONS_SHEET_NAME', 'Attendance'),
  
  // ETL
  ETL_BATCH_SIZE: getEnvNumber('ETL_BATCH_SIZE', 100),
  ETL_RETRY_ATTEMPTS: getEnvNumber('ETL_RETRY_ATTEMPTS', 3),
  ETL_RETRY_DELAY_MS: getEnvNumber('ETL_RETRY_DELAY_MS', 5000),
  ETL_LOG_LEVEL: getEnvVar('ETL_LOG_LEVEL', 'info')
};

export default env;
