#!/usr/bin/env ts-node

/**
 * Seed production database from development database
 * 
 * This script can run from either the local (dev) machine or the production machine.
 * It copies data from development to production in the correct dependency order.
 * 
 * Usage:
 *   # From local machine (using default .env for prod connection)
 *   npm run seed:production
 * 
 *   # With custom connection details
 *   npm run seed:production -- --dev-host localhost --dev-db boathouse_trc --prod-host 192.168.1.244
 * 
 *   # Dry run (no actual changes)
 *   npm run seed:production -- --dry-run
 * 
 * Environment Variables:
 *   DEV_DB_HOST, DEV_DB_PORT, DEV_DB_NAME, DEV_DB_USER, DEV_DB_PASSWORD
 *   PROD_DB_HOST, PROD_DB_PORT, PROD_DB_NAME, PROD_DB_USER, PROD_DB_PASSWORD
 *   Or use DB_HOST, DB_PORT, etc. for production (from .env)
 */

import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Parse command line arguments
interface Args {
  devHost?: string;
  devPort?: number;
  devDb?: string;
  devUser?: string;
  devPassword?: string;
  prodHost?: string;
  prodPort?: number;
  prodDb?: string;
  prodUser?: string;
  prodPassword?: string;
  dryRun?: boolean;
  excludeTables?: string[];
  includeTables?: string[];
  help?: boolean;
}

function parseArgs(): Args {
  const args: Args = {};
  const argv = process.argv.slice(2);
  
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    
    if (!arg) continue;
    
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg.startsWith('--')) {
      const key = arg.replace('--', '').replace(/-/g, '');
      const value = argv[++i];
      
      if (!value) continue;
      
      if (key === 'devPort' || key === 'prodPort') {
        (args as any)[key] = parseInt(value, 10);
      } else if (key === 'excludeTables' || key === 'includeTables') {
        (args as any)[key] = value.split(',').map(t => t.trim());
      } else {
        (args as any)[key] = value;
      }
    }
  }
  
  return args;
}

// Get database configuration from environment or args
function getDatabaseConfig(args: Args, type: 'dev' | 'prod') {
  const prefix = type === 'dev' ? 'DEV_' : '';
  const defaultDbName = type === 'dev' ? 'boathouse_trc' : 'boathouse_etl';
  const defaultUser = 'postgres';
  
  return {
    host: (type === 'dev' ? args.devHost : args.prodHost) || 
          process.env[`${prefix}DB_HOST`] || 
          (type === 'dev' ? 'localhost' : process.env['DB_HOST'] || 'localhost'),
    port: (type === 'dev' ? args.devPort : args.prodPort) || 
          parseInt(process.env[`${prefix}DB_PORT`] || 
          (type === 'dev' ? '5432' : process.env['DB_PORT'] || '5432'), 10),
    database: (type === 'dev' ? args.devDb : args.prodDb) || 
              process.env[`${prefix}DB_NAME`] || 
              (type === 'dev' ? defaultDbName : process.env['DB_NAME'] || defaultDbName),
    username: (type === 'dev' ? args.devUser : args.prodUser) || 
              process.env[`${prefix}DB_USER`] || 
              (type === 'dev' ? defaultUser : process.env['DB_USER'] || defaultUser),
    password: (type === 'dev' ? args.devPassword : args.prodPassword) || 
              process.env[`${prefix}DB_PASSWORD`] || 
              (type === 'dev' ? '' : process.env['DB_PASSWORD'] || ''),
  };
}

// Tables in dependency order (must copy in this order)
const TABLE_ORDER = [
  'usra_categories',
  'athletes',
  'teams',
  'boats',
  'team_memberships',
  'practice_sessions',
  'lineups',
  'seat_assignments',
  'attendance',
  'regattas',
  'regatta_registrations',
  'races',
  'erg_tests',
  'mailing_lists',
  'gauntlets',
  'gauntlet_lineups',
  'gauntlet_seat_assignments',
  'gauntlet_matches',
  'gauntlet_positions',
];

// Tables to exclude by default
const DEFAULT_EXCLUDE_TABLES = [
  'SequelizeMeta',
  'etl_jobs',
];

async function connectDatabase(config: ReturnType<typeof getDatabaseConfig>, label: string): Promise<Sequelize> {
  console.log(`\n🔌 Connecting to ${label} database...`);
  console.log(`   Host: ${config.host}:${config.port}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   User: ${config.username}`);
  
  const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
  
  try {
    await sequelize.authenticate();
    console.log(`✅ Connected to ${label} database successfully`);
    return sequelize;
  } catch (error) {
    console.error(`❌ Failed to connect to ${label} database:`, error);
    throw error;
  }
}

async function getTableData(sequelize: Sequelize, tableName: string): Promise<any[]> {
  const queryInterface = sequelize.getQueryInterface();
  const results = await sequelize.query(
    `SELECT * FROM ${queryInterface.quoteIdentifier(tableName)}`,
    { type: QueryTypes.SELECT }
  ) as any[];
  
  return Array.isArray(results) ? results : [];
}

async function clearTable(sequelize: Sequelize, tableName: string, dryRun: boolean): Promise<void> {
  if (dryRun) {
    console.log(`   [DRY RUN] Would truncate table: ${tableName}`);
    return;
  }
  
  // Use TRUNCATE CASCADE to handle foreign keys
  const queryInterface = sequelize.getQueryInterface();
  await sequelize.query(
    `TRUNCATE TABLE ${queryInterface.quoteIdentifier(tableName)} CASCADE`,
    { type: QueryTypes.RAW }
  );
}

async function insertTableData(
  sequelize: Sequelize,
  tableName: string,
  data: any[],
  dryRun: boolean
): Promise<number> {
  if (data.length === 0) {
    return 0;
  }
  
  if (dryRun) {
    console.log(`   [DRY RUN] Would insert ${data.length} rows into ${tableName}`);
    return data.length;
  }
  
  const columns = Object.keys(data[0]);
  const queryInterface = sequelize.getQueryInterface();
  const quotedTable = queryInterface.quoteIdentifier(tableName);
  const quotedColumns = columns.map(col => queryInterface.quoteIdentifier(col));
  
  // Build batch insert queries (PostgreSQL allows up to 65535 parameters, but we'll use 1000 for safety)
  const maxParams = 1000;
  const batchSize = Math.floor(maxParams / columns.length);
  let inserted = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    let paramIndex = 1;
    
    // Build placeholders and values for this batch
    const placeholders: string[] = [];
    const flatValues: any[] = [];
    
    for (const row of batch) {
      const rowPlaceholders: string[] = [];
      for (const col of columns) {
        rowPlaceholders.push(`$${paramIndex++}`);
        flatValues.push(row[col] ?? null);
      }
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    }
    
    const sql = `INSERT INTO ${quotedTable} (${quotedColumns.join(', ')}) VALUES ${placeholders.join(', ')}`;
    
    await sequelize.query(sql, {
      bind: flatValues,
      type: QueryTypes.INSERT,
    });
    
    inserted += batch.length;
  }
  
  return inserted;
}

async function getTableRowCount(sequelize: Sequelize, tableName: string): Promise<number> {
  const queryInterface = sequelize.getQueryInterface();
  const results = await sequelize.query(
    `SELECT COUNT(*) as count FROM ${queryInterface.quoteIdentifier(tableName)}`,
    { type: QueryTypes.SELECT }
  ) as Array<{ count: string | number }>;
  
  if (!Array.isArray(results) || results.length === 0) {
    return 0;
  }
  
  const count = results[0]?.count;
  return typeof count === 'number' ? count : parseInt(String(count || '0'), 10);
}

async function seedProduction(args: Args) {
  console.log('🚀 Starting production database seeding from development...\n');
  
  if (args.dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }
  
  // Get database configurations
  const devConfig = getDatabaseConfig(args, 'dev');
  const prodConfig = getDatabaseConfig(args, 'prod');
  
  // Connect to both databases
  const devDb = await connectDatabase(devConfig, 'Development');
  const prodDb = await connectDatabase(prodConfig, 'Production');
  
  try {
    // Determine which tables to process
    let tablesToProcess = [...TABLE_ORDER];
    
    // Exclude tables
    const excludeTables = [
      ...DEFAULT_EXCLUDE_TABLES,
      ...(args.excludeTables || []),
    ];
    tablesToProcess = tablesToProcess.filter(table => !excludeTables.includes(table));
    
    // Include only specified tables if provided
    if (args.includeTables && args.includeTables.length > 0) {
      tablesToProcess = tablesToProcess.filter(table => args.includeTables!.includes(table));
    }
    
    console.log(`\n📋 Will process ${tablesToProcess.length} tables:`);
    tablesToProcess.forEach(table => console.log(`   - ${table}`));
    
    if (excludeTables.length > 0) {
      console.log(`\n⚠️  Excluding ${excludeTables.length} tables: ${excludeTables.join(', ')}`);
    }
    
    // Confirm before proceeding (unless dry run)
    if (!args.dryRun) {
      console.log('\n⚠️  WARNING: This will overwrite all data in production tables!');
      console.log('   Press Ctrl+C within 5 seconds to cancel...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    const stats = {
      totalTables: tablesToProcess.length,
      copiedTables: 0,
      skippedTables: 0,
      totalRows: 0,
      errors: [] as Array<{ table: string; error: string }>,
    };
    
    // Process each table
    for (const table of tablesToProcess) {
      try {
        console.log(`\n📦 Processing table: ${table}`);
        
        // Get data from dev database
        const devData = await getTableData(devDb, table);
        console.log(`   📊 Found ${devData.length} rows in development database`);
        
        if (devData.length === 0) {
          console.log(`   ⚠️  No data to copy, skipping...`);
          stats.skippedTables++;
          continue;
        }
        
        // Clear production table
        console.log(`   🗑️  Clearing production table...`);
        await clearTable(prodDb, table, args.dryRun || false);
        
        // Insert data into production
        console.log(`   💾 Inserting data into production...`);
        const inserted = await insertTableData(prodDb, table, devData, args.dryRun || false);
        
        if (!args.dryRun) {
          // Verify row count
          const prodCount = await getTableRowCount(prodDb, table);
          if (prodCount !== devData.length) {
            throw new Error(
              `Row count mismatch: expected ${devData.length}, got ${prodCount}`
            );
          }
        }
        
        console.log(`   ✅ Successfully copied ${inserted} rows`);
        stats.copiedTables++;
        stats.totalRows += inserted;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error processing ${table}:`, errorMsg);
        stats.errors.push({ table, error: errorMsg });
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEEDING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total tables processed: ${stats.totalTables}`);
    console.log(`Successfully copied: ${stats.copiedTables}`);
    console.log(`Skipped (no data): ${stats.skippedTables}`);
    console.log(`Total rows copied: ${stats.totalRows}`);
    
    if (stats.errors.length > 0) {
      console.log(`\n❌ Errors encountered: ${stats.errors.length}`);
      stats.errors.forEach(err => {
        console.log(`   - ${err.table}: ${err.error}`);
      });
      process.exit(1);
    } else {
      console.log('\n🎉 Production database seeded successfully!');
    }
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await devDb.close();
    await prodDb.close();
    console.log('\n✅ Database connections closed');
  }
}

// Main execution
if (require.main === module) {
  const args = parseArgs();
  
  if (args.help) {
    console.log(`
Seed Production Database from Development

Usage:
  npm run seed:production [options]

Options:
  --dev-host HOST          Development database host (default: localhost)
  --dev-port PORT          Development database port (default: 5432)
  --dev-db NAME            Development database name (default: boathouse_trc)
  --dev-user USER          Development database user (default: postgres)
  --dev-password PASSWORD  Development database password
  
  --prod-host HOST         Production database host (default: DB_HOST from .env or localhost)
  --prod-port PORT         Production database port (default: DB_PORT from .env or 5432)
  --prod-db NAME           Production database name (default: DB_NAME from .env or boathouse_etl)
  --prod-user USER         Production database user (default: DB_USER from .env or postgres)
  --prod-password PASSWORD Production database password (default: DB_PASSWORD from .env)
  
  --dry-run                Show what would be done without making changes
  --exclude-tables LIST     Comma-separated list of tables to exclude (default: SequelizeMeta,etl_jobs)
  --include-tables LIST    Comma-separated list of tables to include (only these will be processed)
  --help, -h               Show this help message

Environment Variables:
  All database connection settings can be set via environment variables:
  - DEV_DB_HOST, DEV_DB_PORT, DEV_DB_NAME, DEV_DB_USER, DEV_DB_PASSWORD
  - PROD_DB_HOST, PROD_DB_PORT, PROD_DB_NAME, PROD_DB_USER, PROD_DB_PASSWORD
  - Or use DB_HOST, DB_PORT, etc. for production (from .env file)

Examples:
  # Basic usage (from local machine, uses .env for prod connection)
  npm run seed:production
  
  # With custom production host
  npm run seed:production -- --prod-host 192.168.1.244 --prod-db boathouse_etl
  
  # Dry run to see what would happen
  npm run seed:production -- --dry-run
  
  # Copy only specific tables
  npm run seed:production -- --include-tables athletes,teams,boats
  
  # Exclude additional tables
  npm run seed:production -- --exclude-tables SequelizeMeta,etl_jobs,erg_tests
`);
    process.exit(0);
  }
  
  seedProduction(args).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default seedProduction;
