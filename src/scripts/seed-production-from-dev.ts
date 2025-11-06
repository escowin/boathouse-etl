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
  const defaultDbName = 'boathouse_trc'; // Both dev and prod use the same database name (but different hosts)
  const defaultUser = 'postgres';
  
  // Determine host with priority: args > PROD_DB_HOST/DEV_DB_HOST > DB_HOST (for prod only) > localhost
  let host: string;
  if (type === 'dev') {
    host = args.devHost || 
           process.env['DEV_DB_HOST'] || 
           'localhost';
  } else {
    // For production, prefer PROD_DB_HOST, fallback to DB_HOST only if PROD_DB_HOST not set
    host = args.prodHost || 
           process.env['PROD_DB_HOST'] || 
           process.env['DB_HOST'] || 
           'localhost';
  }
  
  // Determine port
  let port: number;
  if (type === 'dev') {
    port = args.devPort || 
           parseInt(process.env['DEV_DB_PORT'] || '5432', 10);
  } else {
    port = args.prodPort || 
           parseInt(process.env['PROD_DB_PORT'] || process.env['DB_PORT'] || '5432', 10);
  }
  
  // Determine database name
  let database: string;
  if (type === 'dev') {
    database = args.devDb || 
               process.env['DEV_DB_NAME'] || 
               defaultDbName;
  } else {
    database = args.prodDb || 
               process.env['PROD_DB_NAME'] || 
               process.env['DB_NAME'] || 
               defaultDbName;
  }
  
  // Determine username
  let username: string;
  if (type === 'dev') {
    username = args.devUser || 
               process.env['DEV_DB_USER'] || 
               defaultUser;
  } else {
    username = args.prodUser || 
               process.env['PROD_DB_USER'] || 
               process.env['DB_USER'] || 
               defaultUser;
  }
  
  // Determine password
  let password: string;
  if (type === 'dev') {
    password = args.devPassword || 
               process.env['DEV_DB_PASSWORD'] || 
               '';
  } else {
    password = args.prodPassword || 
               process.env['PROD_DB_PASSWORD'] || 
               process.env['DB_PASSWORD'] || 
               '';
  }
  
  return {
    host,
    port,
    database,
    username,
    password,
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

/**
 * Get primary key columns for a table
 */
async function getPrimaryKeys(sequelize: Sequelize, tableName: string): Promise<string[]> {
  try {
    // Use information_schema for better compatibility (default schema is 'public')
    const results = await sequelize.query(
      `SELECT a.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage AS a 
         ON tc.constraint_schema = a.constraint_schema 
         AND tc.constraint_name = a.constraint_name
       WHERE tc.table_schema = 'public'
         AND tc.table_name = :tableName
         AND tc.constraint_type = 'PRIMARY KEY'
       ORDER BY a.ordinal_position`,
      {
        type: QueryTypes.SELECT,
        replacements: { tableName }
      }
    ) as Array<{ column_name: string }>;
    
    return results.map(r => r.column_name);
  } catch (error) {
    // Fallback: try pg_index approach with proper escaping
    try {
      const escapedTableName = tableName.replace(/'/g, "''");
      const results = await sequelize.query(
        `SELECT a.attname
         FROM pg_index i
         JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
         WHERE i.indrelid = '${escapedTableName}'::regclass
         AND i.indisprimary`,
        { type: QueryTypes.SELECT }
      ) as Array<{ attname: string }>;
      
      return results.map(r => r.attname);
    } catch (fallbackError) {
      // If we can't get primary keys, return empty array (will use first column as fallback)
      console.warn(`   ⚠️  Could not determine primary keys for ${tableName}, will use first column for conflict resolution`);
      return [];
    }
  }
}

/**
 * Upsert table data using ON CONFLICT (PostgreSQL UPSERT)
 * This safely merges data without truncating existing records
 */
async function upsertTableData(
  sequelize: Sequelize,
  tableName: string,
  data: any[],
  dryRun: boolean
): Promise<{ inserted: number; updated: number; skipped: number }> {
  if (data.length === 0) {
    return { inserted: 0, updated: 0, skipped: 0 };
  }
  
  if (dryRun) {
    console.log(`   [DRY RUN] Would upsert ${data.length} rows into ${tableName}`);
    return { inserted: data.length, updated: 0, skipped: 0 };
  }
  
  const queryInterface = sequelize.getQueryInterface();
  const quotedTable = queryInterface.quoteIdentifier(tableName);
  const columns = Object.keys(data[0]);
  const quotedColumns = columns.map(col => queryInterface.quoteIdentifier(col));
  
  // Get primary key columns for conflict resolution
  const primaryKeys = await getPrimaryKeys(sequelize, tableName);
  let conflictColumns: string;
  if (primaryKeys.length > 0) {
    conflictColumns = primaryKeys.map(pk => queryInterface.quoteIdentifier(pk)).join(', ');
  } else {
    // Fallback to first column if no PK found
    if (quotedColumns.length === 0) {
      throw new Error(`No columns found in data for table ${tableName}`);
    }
    const firstColumn = quotedColumns[0];
    if (!firstColumn) {
      throw new Error(`First column is undefined for table ${tableName}`);
    }
    conflictColumns = firstColumn;
  }
  
  // Build UPDATE SET clause (exclude primary keys and timestamps from update)
  const updateColumns = columns.filter(col => 
    !primaryKeys.includes(col) && 
    col !== 'created_at' && 
    col !== 'updated_at'
  );
  const updateSet = updateColumns.length > 0
    ? updateColumns.map(col => 
        `${queryInterface.quoteIdentifier(col)} = EXCLUDED.${queryInterface.quoteIdentifier(col)}`
      ).join(', ')
    : 'updated_at = EXCLUDED.updated_at'; // At least update timestamp
  
  const maxParams = 1000;
  const batchSize = Math.floor(maxParams / columns.length);
  let inserted = 0;
  let updated = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    let paramIndex = 1;
    
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
    
    // Use ON CONFLICT to upsert (insert or update)
    // If no unique constraint exists, fall back to INSERT with DO NOTHING
    let sql: string;
    try {
      sql = `
        INSERT INTO ${quotedTable} (${quotedColumns.join(', ')}) 
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (${conflictColumns}) 
        DO UPDATE SET ${updateSet}
      `;
      
      await sequelize.query(sql, {
        bind: flatValues,
        type: QueryTypes.RAW,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      // If ON CONFLICT fails due to constraint issues, try without specifying columns
      if (errorMsg.includes('does not exist') || errorMsg.includes('conflict_target')) {
        // Try with ON CONFLICT DO NOTHING (no specific conflict target)
        sql = `
          INSERT INTO ${quotedTable} (${quotedColumns.join(', ')}) 
          VALUES ${placeholders.join(', ')}
          ON CONFLICT DO NOTHING
        `;
        await sequelize.query(sql, {
          bind: flatValues,
          type: QueryTypes.INSERT,
        });
      } else {
        // Re-throw other errors
        throw error;
      }
    }
    
    // Note: PostgreSQL doesn't easily return insert/update counts
    // We'll count all as processed (conservative estimate)
    inserted += batch.length;
  }
  
  return { inserted, updated, skipped: 0 };
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
  
  // WARNING: Check if production is using DB_HOST (ambiguous fallback)
  if (!args.prodHost && !process.env['PROD_DB_HOST'] && process.env['DB_HOST']) {
    console.warn('\n⚠️  WARNING: Production database host is using DB_HOST from .env');
    console.warn('   This may be ambiguous if DB_HOST points to localhost (your dev database).');
    console.warn('   Both dev and prod databases share the same name (boathouse_trc) but are on different hosts.');
    console.warn('   Recommendation: Set PROD_DB_HOST=192.168.1.244 in .env or use --prod-host flag.\n');
  }
  
  // Connect to both databases
  const devDb = await connectDatabase(devConfig, 'Development');
  const prodDb = await connectDatabase(prodConfig, 'Production');
  
  // CRITICAL SAFETY CHECK: Prevent running if both databases are the same
  const devKey = `${devConfig.host}:${devConfig.port}/${devConfig.database}`;
  const prodKey = `${prodConfig.host}:${prodConfig.port}/${prodConfig.database}`;
  
  if (devKey === prodKey) {
    console.error('\n❌ CRITICAL ERROR: Development and Production databases are the same!');
    console.error('   This would destroy your local development data!');
    console.error(`   Both pointing to: ${devKey}`);
    console.error('\n   This operation is BLOCKED to prevent data loss.');
    console.error('   The databases share the same name (boathouse_trc) but must be on different hosts.');
    console.error('   Solution: Set PROD_DB_HOST=192.168.1.244 in .env or use --prod-host 192.168.1.244');
    console.error('   to specify the production server IP address.\n');
    await devDb.close();
    await prodDb.close();
    process.exit(1);
  }
  
  console.log('\n✅ Safety check passed: Development and Production are different databases');
  console.log(`   Development: ${devKey}`);
  console.log(`   Production:  ${prodKey}\n`);
  
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
      console.log('\n⚠️  WARNING: This will merge data into production tables (existing data will be updated, new data will be inserted)');
      console.log('   This is a SAFE operation - no data will be deleted or truncated.');
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
    
    // Phase 1: Read all data from dev database into memory first
    console.log('\n📖 Phase 1: Reading all data from development database...');
    const devDataMap = new Map<string, any[]>();
    
    for (const table of tablesToProcess) {
      try {
        const devData = await getTableData(devDb, table);
        console.log(`   📊 ${table}: ${devData.length} rows`);
        devDataMap.set(table, devData);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error reading ${table}:`, errorMsg);
        stats.errors.push({ table, error: errorMsg });
      }
    }
    
    // Phase 2: Upsert data into production (safe merge - no truncation)
    // Uses ON CONFLICT to update existing records or insert new ones
    console.log('\n💾 Phase 2: Merging data into production database (safe upsert - no data loss)...');
    for (const table of tablesToProcess) {
      try {
        const devData = devDataMap.get(table);
        
        if (!devData || devData.length === 0) {
          console.log(`   ⚠️  ${table}: No data to copy, skipping...`);
          stats.skippedTables++;
          continue;
        }
        
        console.log(`   💾 Merging ${devData.length} rows into ${table}...`);
        const result = await upsertTableData(prodDb, table, devData, args.dryRun || false);
        
        if (!args.dryRun) {
          // Verify we have at least the expected data
          const prodCount = await getTableRowCount(prodDb, table);
          if (prodCount < devData.length) {
            console.warn(`   ⚠️  Warning: Production has ${prodCount} rows, expected at least ${devData.length}`);
          }
        }
        
        console.log(`   ✅ Successfully merged ${result.inserted} rows (${result.updated} updated, ${result.skipped} skipped) to ${table}`);
        stats.copiedTables++;
        stats.totalRows += result.inserted;
        
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
  
  --prod-host HOST         Production database host (default: PROD_DB_HOST from .env, then DB_HOST, then localhost)
  --prod-port PORT         Production database port (default: PROD_DB_PORT from .env, then DB_PORT, then 5432)
  --prod-db NAME           Production database name (default: PROD_DB_NAME from .env, then DB_NAME, then boathouse_trc)
  --prod-user USER         Production database user (default: PROD_DB_USER from .env, then DB_USER, then postgres)
  --prod-password PASSWORD Production database password (default: PROD_DB_PASSWORD from .env, then DB_PASSWORD)
  
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
  npm run seed:production -- --prod-host 192.168.1.244 --prod-db boathouse_trc
  
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
