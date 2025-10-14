/**
 * ETL Orchestrator - Coordinates all ETL processes
 */

import { BaseETLProcess } from './base-etl';
import { AthletesETL } from './athletes';
import { BoatsETL } from './boats';
import { DatabaseUtils } from '../utils/database';
import { ETLJobConfig, ETLResult } from './types';

export class ETLOrchestrator {
  private config: ETLJobConfig;
  private processes: Map<string, BaseETLProcess>;

  constructor(config?: Partial<ETLJobConfig>) {
    this.config = {
      jobType: 'full_etl',
      batchSize: 50,
      retryAttempts: 3,
      retryDelayMs: 1000,
      dryRun: false,
      ...config
    };

    this.processes = new Map();
    this.initializeProcesses();
  }

  /**
   * Initialize all ETL processes
   */
  private initializeProcesses(): void {
    // Initialize individual ETL processes
    this.processes.set('athletes', new AthletesETL({
      batchSize: this.config.batchSize || 50,
      retryAttempts: this.config.retryAttempts || 3,
      retryDelayMs: this.config.retryDelayMs || 1000,
      dryRun: this.config.dryRun || false
    }));

    this.processes.set('boats', new BoatsETL({
      batchSize: this.config.batchSize || 50,
      retryAttempts: this.config.retryAttempts || 3,
      retryDelayMs: this.config.retryDelayMs || 1000,
      dryRun: this.config.dryRun || false
    }));

    // Add more processes as they are created
    // this.processes.set('teams', new TeamsETL({ ... }));
    // this.processes.set('practice_sessions', new PracticeSessionsETL({ ... }));
  }

  /**
   * Run full ETL process
   */
  async runFullETL(): Promise<ETLResult> {
    console.log('🚀 Starting Full ETL Process');
    console.log(`📋 Configuration: ${JSON.stringify(this.config, null, 2)}`);
    
    const startTime = new Date();
    const results: { [key: string]: ETLResult } = {};
    let totalRecordsProcessed = 0;
    let totalRecordsCreated = 0;
    let totalRecordsUpdated = 0;
    let totalRecordsFailed = 0;
    const allErrors: string[] = [];

    try {
      // Initialize database connection
      const isInitialized = await DatabaseUtils.initialize();
      if (!isInitialized) {
        throw new Error('Failed to initialize database connection');
      }

      // Run ETL processes in sequence
      const processOrder = ['athletes', 'boats']; // Define execution order
      
      for (const processName of processOrder) {
        const process = this.processes.get(processName);
        if (!process) {
          console.warn(`⚠️  Process '${processName}' not found, skipping...`);
          continue;
        }

        console.log(`\n🔄 Running ${processName} ETL process...`);
        
        try {
          const result = await process.execute();
          results[processName] = result;
          
          totalRecordsProcessed += result.recordsProcessed;
          totalRecordsCreated += result.recordsCreated;
          totalRecordsUpdated += result.recordsUpdated;
          totalRecordsFailed += result.recordsFailed;
          allErrors.push(...result.errors);

          if (result.success) {
            console.log(`✅ ${processName} ETL completed successfully`);
          } else {
            console.error(`❌ ${processName} ETL failed`);
          }
        } catch (error) {
          console.error(`❌ ${processName} ETL process failed:`, error);
          allErrors.push(`${processName}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const overallSuccess = Object.values(results).every(result => result.success);

      console.log('\n🎉 Full ETL Process Completed');
      console.log(`⏱️  Total Duration: ${duration}ms`);
      console.log(`📊 Total Records Processed: ${totalRecordsProcessed}`);
      console.log(`✅ Total Records Created: ${totalRecordsCreated}`);
      console.log(`🔄 Total Records Updated: ${totalRecordsUpdated}`);
      console.log(`❌ Total Records Failed: ${totalRecordsFailed}`);
      console.log(`⚠️  Total Errors: ${allErrors.length}`);

      if (allErrors.length > 0) {
        console.log('\n📋 Errors Summary:');
        allErrors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }

      return {
        success: overallSuccess,
        recordsProcessed: totalRecordsProcessed,
        recordsCreated: totalRecordsCreated,
        recordsUpdated: totalRecordsUpdated,
        recordsFailed: totalRecordsFailed,
        errors: allErrors,
        duration
      };

    } catch (error) {
      console.error('❌ Full ETL process failed:', error);
      return {
        success: false,
        recordsProcessed: totalRecordsProcessed,
        recordsCreated: totalRecordsCreated,
        recordsUpdated: totalRecordsUpdated,
        recordsFailed: totalRecordsFailed,
        errors: [error instanceof Error ? error.message : String(error)],
        duration: new Date().getTime() - startTime.getTime()
      };
    } finally {
      // Cleanup database connection
      await DatabaseUtils.cleanup();
    }
  }

  /**
   * Run specific ETL process
   */
  async runProcess(processName: string): Promise<ETLResult> {
    console.log(`🔄 Running ${processName} ETL process`);
    
    const process = this.processes.get(processName);
    if (!process) {
      throw new Error(`ETL process '${processName}' not found`);
    }

    try {
      // Initialize database connection
      const isInitialized = await DatabaseUtils.initialize();
      if (!isInitialized) {
        throw new Error('Failed to initialize database connection');
      }

      const result = await process.execute();
      
      if (result.success) {
        console.log(`✅ ${processName} ETL completed successfully`);
      } else {
        console.error(`❌ ${processName} ETL failed`);
      }

      return result;

    } catch (error) {
      console.error(`❌ ${processName} ETL process failed:`, error);
      return {
        success: false,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        duration: 0
      };
    } finally {
      // Cleanup database connection
      await DatabaseUtils.cleanup();
    }
  }

  /**
   * Run incremental ETL (only changed data)
   */
  async runIncrementalETL(): Promise<ETLResult> {
    console.log('🔄 Starting Incremental ETL Process');
    
    // For now, run full ETL
    // TODO: Implement incremental logic based on last sync timestamps
    return this.runFullETL();
  }

  /**
   * Get available ETL processes
   */
  getAvailableProcesses(): string[] {
    return Array.from(this.processes.keys());
  }

  /**
   * Get ETL process status
   */
  async getETLStatus(): Promise<any> {
    try {
      const isInitialized = await DatabaseUtils.initialize();
      if (!isInitialized) {
        throw new Error('Failed to initialize database connection');
      }

      const stats = await BaseETLProcess.getETLStats();
      return stats;
    } catch (error) {
      console.error('❌ Failed to get ETL status:', error);
      throw error;
    } finally {
      await DatabaseUtils.cleanup();
    }
  }

  /**
   * Test ETL processes (dry run)
   */
  async testETL(): Promise<ETLResult> {
    console.log('🧪 Running ETL Test (Dry Run)');
    
    const testConfig = { ...this.config, dryRun: true };
    const testOrchestrator = new ETLOrchestrator(testConfig);
    
    return testOrchestrator.runFullETL();
  }

  /**
   * Validate ETL configuration
   */
  async validateConfiguration(): Promise<boolean> {
    console.log('🔍 Validating ETL Configuration');
    
    try {
      // Test database connection
      const isInitialized = await DatabaseUtils.initialize();
      if (!isInitialized) {
        console.error('❌ Database connection failed');
        return false;
      }

      // Test Google Sheets connection
      const { GoogleSheetsService } = await import('./google-sheets-service');
      const sheetsService = new GoogleSheetsService();
      const sheetsConnected = await sheetsService.testConnection();
      
      if (!sheetsConnected) {
        console.error('❌ Google Sheets connection failed');
        return false;
      }

      console.log('✅ ETL configuration validation passed');
      return true;

    } catch (error) {
      console.error('❌ ETL configuration validation failed:', error);
      return false;
    } finally {
      await DatabaseUtils.cleanup();
    }
  }
}
