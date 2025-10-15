/**
 * ETL Types and Interfaces
 */

export interface ETLJobConfig {
  jobType: 'full_etl' | 'incremental_etl' | 'athletes_sync' | 'boats_sync' | 'attendance_sync';
  batchSize?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
  dryRun?: boolean;
}

export interface ETLResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: string[];
  duration: number;
  jobId?: number | undefined;
}

export interface GoogleSheetsRow {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ETLProcessConfig {
  sheetName: string;
  primaryKey: string;
  batchSize: number;
  retryAttempts: number;
  retryDelayMs: number;
  dryRun: boolean;
}

export interface DataTransformationResult<T> {
  data: T[];
  errors: string[];
  warnings: string[];
}

export interface ETLValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ETLMetrics {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: string[];
  warnings: string[];
}

export type ETLStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ETLJobRecord {
  jobId: string;
  jobType: string;
  status: ETLStatus;
  startedAt: Date;
  completedAt?: Date;
  durationSeconds?: number;
  recordsProcessed: number;
  recordsFailed: number;
  recordsCreated: number;
  recordsUpdated: number;
  errorMessage?: string;
  errorDetails?: any;
  metadata?: any;
}
