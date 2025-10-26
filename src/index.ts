import dotenv from 'dotenv';
import { ETLOrchestrator } from './etl/orchestrator';

// Load environment variables
dotenv.config();

/**
 * Boathouse ETL - Data Processing Service
 * 
 * This service handles the extraction, transformation, and loading of data
 * from Google Sheets into the PostgreSQL database. It runs as a scheduled
 * job or can be executed manually for data synchronization.
 */

// Main ETL execution function
const runETL = async (): Promise<void> => {
  try {
    console.log(`
 ______               __   __                                   _______ _______ _____   
|   __ \.-----.---.-.|  |_|  |--.-----.--.--.-----.-----.______|    ___|_     _|     |_ 
|   __ <|  _  |  _  ||   _|     |  _  |  |  |__ --|  -__|______|    ___| |   | |       |
|______/|_____|___._||____|__|__|_____|_____|_____|_____|      |_______| |___| |_______|
by Edwin Escobar (https://github.com/escowin/boathouse-etl)`);

    console.log('🏭 Boathouse ETL Service Starting...');
    console.log(`⚙️  Environment: ${process.env['NODE_ENV'] || 'development'}`);
    console.log(`📊 Database: ${process.env['DB_NAME'] || 'boathouse_trc'}`);
    console.log(`🔄 ETL Batch Size: ${process.env['ETL_BATCH_SIZE'] || '100'}`);
    console.log(`🔁 Retry Attempts: ${process.env['ETL_RETRY_ATTEMPTS'] || '3'}`);
    console.log('');

    // Initialize ETL orchestrator
    const orchestrator = new ETLOrchestrator();
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const etlType = args[0] || 'full';

    console.log(`🚀 Starting ETL process: ${etlType}`);
    console.log('');

    // Run ETL process based on type
    switch (etlType) {
      case 'full':
        await orchestrator.runFullETL();
        break;
      case 'test':
        await orchestrator.testETL();
        break;
      case 'validate':
        const isValid = await orchestrator.validateConfiguration();
        if (!isValid) {
          console.error('❌ Configuration validation failed');
          process.exit(1);
        }
        console.log('✅ Configuration is valid');
        return;
      case 'status':
        const status = await orchestrator.getETLStatus();
        console.log('📊 ETL Status:', status);
        return;
      default:
        await orchestrator.runProcess(etlType);
        break;
    }

    console.log('');
    console.log('✅ ETL process completed successfully');
    console.log('🏁 Boathouse ETL Service finished');

  } catch (error) {
    console.error('❌ ETL process failed:', error);
    console.error('🏁 Boathouse ETL Service terminated with errors');
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  console.log('🏁 Boathouse ETL Service shutting down');
  process.exit(0);
};

// Handle different termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.error('🏁 Boathouse ETL Service terminated due to uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('🏁 Boathouse ETL Service terminated due to unhandled rejection');
  process.exit(1);
});

// Start ETL process
if (require.main === module) {
  runETL().catch((err) => {
    console.error('❌ ETL startup failed:', err);
    process.exit(1);
  });
}

export default runETL;
