#!/usr/bin/env ts-node

/**
 * Main ETL Entry Point
 * Usage: npm run etl [process] [options]
 */

import { ETLOrchestrator } from './orchestrator';
import { ETLJobConfig } from './types';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'full';
  const options = parseOptions(args.slice(1));

  console.log('🚀 Boathouse ETL System');
  console.log(`📋 Command: ${command}`);
  console.log(`⚙️  Options: ${JSON.stringify(options, null, 2)}`);

  const config: Partial<ETLJobConfig> = {
    jobType: command === 'full' ? 'full_etl' : 'incremental_etl',
    batchSize: options.batchSize || 50,
    retryAttempts: options.retryAttempts || 3,
    retryDelayMs: options.retryDelayMs || 1000,
    dryRun: options.dryRun || false
  };

  const orchestrator = new ETLOrchestrator(config);

  try {
    switch (command) {
      case 'full':
        console.log('🔄 Running Full ETL Process');
        await orchestrator.runFullETL();
        break;

      case 'incremental':
        console.log('🔄 Running Incremental ETL Process');
        await orchestrator.runIncrementalETL();
        break;

      case 'athletes':
        console.log('🔄 Running Athletes ETL Process');
        await orchestrator.runProcess('athletes');
        break;

      case 'boats':
        console.log('🔄 Running Boats ETL Process');
        await orchestrator.runProcess('boats');
        break;

      case 'usra-categories':
        console.log('🔄 Running USRA Categories ETL Process');
        await orchestrator.runProcess('usra-categories');
        break;

      case 'practice-sessions':
        console.log('🔄 Running Practice Sessions ETL Process');
        await orchestrator.runProcess('practice-sessions');
        break;

      case 'teams':
        console.log('🔄 Running Teams ETL Process');
        await orchestrator.runProcess('teams');
        break;

      case 'attendance':
        console.log('🔄 Running Attendance ETL Process');
        await orchestrator.runProcess('attendance');
        break;

      case 'test':
        console.log('🧪 Running ETL Test (Dry Run)');
        await orchestrator.testETL();
        break;

      case 'validate':
        console.log('🔍 Validating ETL Configuration');
        const isValid = await orchestrator.validateConfiguration();
        if (isValid) {
          console.log('✅ ETL configuration validation passed');
        } else {
          console.log('❌ ETL configuration validation failed');
        }
        process.exit(isValid ? 0 : 1);

      case 'status':
        console.log('📊 Getting ETL Status');
        const status = await orchestrator.getETLStatus();
        console.log('ETL Status:', JSON.stringify(status, null, 2));
        console.log('✅ ETL status retrieved successfully');
        return;

      case 'help':
        printHelp();
        return;

      default:
        console.error(`❌ Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }

    console.log('✅ ETL process completed successfully');

  } catch (error) {
    console.error('❌ ETL process failed:', error);
    process.exit(1);
  }
}

/**
 * Parse command line options
 */
function parseOptions(args: string[]): any {
  const options: any = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--batch-size':
        const batchSizeArg = args[++i];
        if (batchSizeArg) options.batchSize = parseInt(batchSizeArg, 10);
        break;
      case '--retry-attempts':
        const retryAttemptsArg = args[++i];
        if (retryAttemptsArg) options.retryAttempts = parseInt(retryAttemptsArg, 10);
        break;
      case '--retry-delay':
        const retryDelayArg = args[++i];
        if (retryDelayArg) options.retryDelayMs = parseInt(retryDelayArg, 10);
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

/**
 * Print help information
 */
function printHelp(): void {
  console.log(`
🚀 Boathouse ETL System

Usage: npm run etl [command] [options]

Commands:
  full          Run full ETL process (default)
  incremental   Run incremental ETL process
  athletes      Run athletes ETL process only
  boats         Run boats ETL process only
  usra-categories Run USRA Categories ETL process only
  practice-sessions Run Practice Sessions ETL process only
  teams         Run Teams ETL process only
  attendance    Run Attendance ETL process only
  test          Run ETL test (dry run)
  validate      Validate ETL configuration
  status        Get ETL status and statistics
  help          Show this help message

Options:
  --batch-size <number>     Batch size for processing (default: 50)
  --retry-attempts <number> Number of retry attempts (default: 3)
  --retry-delay <number>    Retry delay in milliseconds (default: 1000)
  --dry-run                 Run in dry-run mode (no database changes)
  --help                    Show this help message

Examples:
  npm run etl                    # Run full ETL process
  npm run etl athletes           # Run athletes ETL only
  npm run etl boats --dry-run    # Test boats ETL without changes
  npm run etl test               # Run ETL test
  npm run etl validate           # Validate configuration
  npm run etl status             # Get ETL status

Environment Variables:
  DB_HOST                      Database host
  DB_PORT                      Database port
  DB_NAME                      Database name
  DB_USER                      Database user
  DB_PASSWORD                  Database password
  GOOGLE_SHEETS_SPREADSHEET_ID Google Sheets spreadsheet ID
  GOOGLE_SHEETS_CREDENTIALS_PATH Path to Google service account credentials
  `);
}

// Run main function if this file is executed directly
if (require.main === module) {
  main();
}

export { ETLOrchestrator } from './orchestrator';
export { AthletesETL } from './athletes';
export { BoatsETL } from './boats';
export { GoogleSheetsService } from './google-sheets-service';
export * from './types';
