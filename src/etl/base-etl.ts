/**
 * Base ETL Process Class
 */

import { ETLJob, sequelize } from '../models';
import { 
  ETLResult, 
  ETLMetrics, 
  ETLProcessConfig,
  DataTransformationResult,
  ETLValidationResult
} from './types';
import { QueryTypes } from 'sequelize';

export abstract class BaseETLProcess {
  protected config: ETLProcessConfig;
  protected metrics: ETLMetrics;
  protected jobId?: number;

  constructor(config: ETLProcessConfig) {
    this.config = config;
    this.metrics = {
      startTime: new Date(),
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: [],
      warnings: []
    };
  }

  /**
   * Main ETL execution method
   */
  async execute(): Promise<ETLResult> {
    try {
      console.log(`🔄 Starting ETL process: ${this.config.sheetName}`);
      
      // Create ETL job record
      this.jobId = await this.createETLJob();
      
      // Extract data from source
      const rawData = await this.extract();
      console.log(`📊 Extracted ${rawData.length} records from ${this.config.sheetName}`);
      
      // Transform data
      const transformationResult = await this.transform(rawData);
      console.log(`🔄 Transformed ${transformationResult.data.length} records`);
      
      if (transformationResult.errors.length > 0) {
        console.warn(`⚠️  Transformation warnings: ${transformationResult.errors.length}`);
        this.metrics.warnings.push(...transformationResult.errors);
      }
      
      // Validate data
      const validationResult = await this.validate(transformationResult.data);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }
      
      // Load data to database
      const loadResult = await this.load(transformationResult.data);
      
      // Update metrics
      this.metrics.endTime = new Date();
      this.metrics.duration = this.metrics.endTime.getTime() - this.metrics.startTime.getTime();
      this.metrics.recordsProcessed = rawData.length;
      this.metrics.recordsCreated = loadResult.recordsCreated;
      this.metrics.recordsUpdated = loadResult.recordsUpdated;
      this.metrics.recordsFailed = loadResult.recordsFailed;
      
      // Update ETL job record
      await this.updateETLJob('completed');
      
      console.log(`✅ ETL process completed successfully`);
      console.log(`   - Records processed: ${this.metrics.recordsProcessed}`);
      console.log(`   - Records created: ${this.metrics.recordsCreated}`);
      console.log(`   - Records updated: ${this.metrics.recordsUpdated}`);
      console.log(`   - Records failed: ${this.metrics.recordsFailed}`);
      console.log(`   - Duration: ${this.metrics.duration}ms`);
      
      return {
        success: true,
        recordsProcessed: this.metrics.recordsProcessed,
        recordsCreated: this.metrics.recordsCreated,
        recordsUpdated: this.metrics.recordsUpdated,
        recordsFailed: this.metrics.recordsFailed,
        errors: this.metrics.errors,
        duration: this.metrics.duration,
        jobId: this.jobId
      };
      
    } catch (error) {
      console.error(`❌ ETL process failed:`, error);
      
      this.metrics.endTime = new Date();
      this.metrics.duration = this.metrics.endTime.getTime() - this.metrics.startTime.getTime();
      this.metrics.errors.push(error instanceof Error ? error.message : String(error));
      
      // Update ETL job record with error
      await this.updateETLJob('failed', error);
      
      return {
        success: false,
        recordsProcessed: this.metrics.recordsProcessed,
        recordsCreated: this.metrics.recordsCreated,
        recordsUpdated: this.metrics.recordsUpdated,
        recordsFailed: this.metrics.recordsFailed,
        errors: this.metrics.errors,
        duration: this.metrics.duration,
        jobId: this.jobId || undefined
      };
    }
  }

  /**
   * Extract data from source (to be implemented by subclasses)
   */
  protected abstract extract(): Promise<any[]>;

  /**
   * Transform data (to be implemented by subclasses)
   */
  protected abstract transform(data: any[]): Promise<DataTransformationResult<any>>;

  /**
   * Validate data (to be implemented by subclasses)
   */
  protected abstract validate(data: any[]): Promise<ETLValidationResult>;

  /**
   * Load data to database (to be implemented by subclasses)
   */
  protected abstract load(data: any[]): Promise<{ recordsCreated: number; recordsUpdated: number; recordsFailed: number }>;

  /**
   * Create ETL job record
   */
  private async createETLJob(): Promise<number> {
    const job = await ETLJob.create({
      job_type: this.getJobType(),
      status: 'running',
      started_at: this.metrics.startTime,
      records_processed: 0,
      records_failed: 0,
      records_created: 0,
      records_updated: 0
    } as any);
    
    return job.job_id;
  }

  /**
   * Update ETL job record
   */
  private async updateETLJob(status: 'completed' | 'failed', error?: any): Promise<void> {
    if (!this.jobId) return;
    
    const updateData: any = {
      status,
      completed_at: this.metrics.endTime,
      duration_seconds: this.metrics.duration ? Math.round(this.metrics.duration / 1000) : undefined,
      records_processed: this.metrics.recordsProcessed,
      records_failed: this.metrics.recordsFailed,
      records_created: this.metrics.recordsCreated,
      records_updated: this.metrics.recordsUpdated
    };
    
    if (status === 'failed' && error) {
      updateData.error_message = error instanceof Error ? error.message : String(error);
      updateData.error_details = error;
    }
    
    await ETLJob.update(updateData, {
      where: { job_id: this.jobId }
    });
  }

  /**
   * Get job type for ETL job record
   */
  protected abstract getJobType(): 'full_etl' | 'incremental_etl' | 'athletes_sync' | 'boats_sync' | 'attendance_sync';

  /**
   * Retry mechanism for failed operations
   */
  protected async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = this.config.retryAttempts,
    delayMs: number = this.config.retryDelayMs
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        console.warn(`⚠️  Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await this.sleep(delayMs);
        delayMs *= 2; // Exponential backoff
      }
    }
    
    throw lastError!;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Batch processing utility
   */
  protected async processBatch<T>(
    items: T[],
    batchSize: number = this.config.batchSize,
    processor: (batch: T[]) => Promise<void>
  ): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await processor(batch);
    }
  }

  /**
   * Get ETL job statistics
   */
  static async getETLStats(): Promise<any> {
    const stats = await sequelize.query(`
      SELECT 
        job_type,
        status,
        COUNT(*) as count,
        AVG(duration_seconds) as avg_duration,
        SUM(records_processed) as total_processed,
        SUM(records_created) as total_created,
        SUM(records_updated) as total_updated,
        SUM(records_failed) as total_failed
      FROM etl_jobs
      WHERE started_at >= NOW() - INTERVAL '7 days'
      GROUP BY job_type, status
      ORDER BY job_type, status
    `, { type: QueryTypes.SELECT });
    
    return stats;
  }
}
