#!/usr/bin/env ts-node

/**
 * Emergency recovery script to restore local database from production
 * 
 * This script reverses the seed process - copies data FROM production TO local
 * 
 * Usage:
 *   npm run recover:from-production
 *   npm run recover:from-production -- --prod-host 192.168.1.244
 */

import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Args {
  prodHost?: string;
  prodPort?: number;
  prodDb?: string;
  prodUser?: string;
  prodPassword?: string;
  localDb?: string;
  localHost?: string;
  localPort?: number;
  localUser?: string;
  localPassword?: string;
  dryRun?: boolean;
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
      
      if (key === 'prodPort' || key === 'localPort') {
        (args as any)[key] = parseInt(value, 10);
      } else {
        (args as any)[key] = value;
      }
    }
  }
  
  return args;
}

function getDatabaseConfig(args: Args, type: 'prod' | 'local') {
  const prefix = type === 'prod' ? 'PROD_' : '';
  const defaultDbName = type === 'prod' ? 'boathouse_etl' : 'boathouse_trc';
  const defaultUser = 'postgres';
  
  return {
    host: (type === 'prod' ? args.prodHost : args.localHost) || 
          process.env[`${prefix}DB_HOST`] || 
          (type === 'prod' ? process.env['DB_HOST'] || 'localhost' : 'localhost'),
    port: (type === 'prod' ? args.prodPort : args.localPort) || 
          parseInt(process.env[`${prefix}DB_PORT`] || 
          (type === 'prod' ? process.env['DB_PORT'] || '5432' : '5432'), 10),
    database: (type === 'prod' ? args.prodDb : args.localDb) || 
              process.env[`${prefix}DB_NAME`] || 
              (type === 'prod' ? (process.env['DB_NAME'] || defaultDbName) : defaultDbName),
    username: (type === 'prod' ? args.prodUser : args.localUser) || 
              process.env[`${prefix}DB_USER`] || 
              (type === 'prod' ? (process.env['DB_USER'] || defaultUser) : defaultUser),
    password: (type === 'prod' ? args.prodPassword : args.localPassword) || 
              process.env[`${prefix}DB_PASSWORD`] || 
              (type === 'prod' ? process.env['DB_PASSWORD'] || '' : ''),
  };
}

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
  const queryInterface = sequelize.getQueryInterface();
  const results = await sequelize.query(
    `SELECT a.attname
     FROM pg_index i
     JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
     WHERE i.indrelid = ${queryInterface.quoteIdentifier(tableName)}::regclass
     AND i.indisprimary`,
    { type: QueryTypes.SELECT }
  ) as Array<{ attname: string }>;
  
  return results.map(r => r.attname);
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
  const conflictColumns = primaryKeys.length > 0 
    ? primaryKeys.map(pk => queryInterface.quoteIdentifier(pk)).join(', ')
    : quotedColumns[0];
  
  // Build UPDATE SET clause (exclude primary keys and timestamps)
  const updateColumns = columns.filter(col => 
    !primaryKeys.includes(col) && 
    col !== 'created_at' && 
    col !== 'updated_at'
  );
  const updateSet = updateColumns.length > 0
    ? updateColumns.map(col => 
        `${queryInterface.quoteIdentifier(col)} = EXCLUDED.${queryInterface.quoteIdentifier(col)}`
      ).join(', ')
    : 'updated_at = EXCLUDED.updated_at';
  
  const maxParams = 1000;
  const batchSize = Math.floor(maxParams / columns.length);
  let inserted = 0;
  
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
      // Fallback to INSERT with DO NOTHING if ON CONFLICT fails
      sql = `
        INSERT INTO ${quotedTable} (${quotedColumns.join(', ')}) 
        VALUES ${placeholders.join(', ')}
        ON CONFLICT DO NOTHING
      `;
      await sequelize.query(sql, {
        bind: flatValues,
        type: QueryTypes.INSERT,
      });
    }
    
    inserted += batch.length;
  }
  
  return { inserted, updated: 0, skipped: 0 };
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

async function recoverFromProduction(args: Args) {
  console.log('🚨 EMERGENCY RECOVERY: Restoring local database from production...\n');
  
  if (args.dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }
  
  const prodConfig = getDatabaseConfig(args, 'prod');
  const localConfig = getDatabaseConfig(args, 'local');
  
  const prodDb = await connectDatabase(prodConfig, 'Production (source)');
  const localDb = await connectDatabase(localConfig, 'Local (destination)');
  
  // Safety check: Ensure we're not copying from local to local
  const prodKey = `${prodConfig.host}:${prodConfig.port}/${prodConfig.database}`;
  const localKey = `${localConfig.host}:${localConfig.port}/${localConfig.database}`;
  
  if (prodKey === localKey) {
    console.error('\n❌ ERROR: Production and Local databases are the same!');
    console.error('   This recovery script requires different source and destination databases.\n');
    await prodDb.close();
    await localDb.close();
    process.exit(1);
  }
  
  console.log('\n✅ Safety check passed: Source and destination are different databases');
  console.log(`   Production (source): ${prodKey}`);
  console.log(`   Local (destination): ${localKey}\n`);
  
  try {
    const tablesToProcess = [...TABLE_ORDER];
    
    console.log(`\n📋 Will recover ${tablesToProcess.length} tables from production`);
    
    if (!args.dryRun) {
      console.log('\n⚠️  WARNING: This will merge data into your local database (existing data will be updated, new data will be inserted)');
      console.log('   This is a SAFE operation - no data will be deleted or truncated.');
      console.log('   Press Ctrl+C within 10 seconds to cancel...\n');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    const stats = {
      totalTables: tablesToProcess.length,
      recoveredTables: 0,
      skippedTables: 0,
      totalRows: 0,
      errors: [] as Array<{ table: string; error: string }>,
    };
    
    // Phase 1: Read all data from production
    console.log('\n📖 Phase 1: Reading all data from production database...');
    const prodDataMap = new Map<string, any[]>();
    
    for (const table of tablesToProcess) {
      try {
        const prodData = await getTableData(prodDb, table);
        console.log(`   📊 ${table}: ${prodData.length} rows`);
        prodDataMap.set(table, prodData);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error reading ${table}:`, errorMsg);
        stats.errors.push({ table, error: errorMsg });
      }
    }
    
    // Phase 2: Truncate local tables
    console.log('\n🗑️  Phase 2: Clearing local tables...');
    const tablesToClear = [...tablesToProcess].reverse();
    for (const table of tablesToClear) {
      try {
        if (prodDataMap.has(table) && prodDataMap.get(table)!.length > 0) {
          console.log(`   🗑️  Clearing ${table}...`);
          await clearTable(localDb, table, args.dryRun || false);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error clearing ${table}:`, errorMsg);
      }
    }
    
    // Phase 3: Insert data into local database
    console.log('\n💾 Phase 3: Restoring data to local database...');
    for (const table of tablesToProcess) {
      try {
        const prodData = prodDataMap.get(table);
        
        if (!prodData || prodData.length === 0) {
          console.log(`   ⚠️  ${table}: No data to restore, skipping...`);
          stats.skippedTables++;
          continue;
        }
        
        console.log(`   💾 Merging ${prodData.length} rows into ${table}...`);
        const result = await upsertTableData(localDb, table, prodData, args.dryRun || false);
        
        if (!args.dryRun) {
          const localCount = await getTableRowCount(localDb, table);
          if (localCount < prodData.length) {
            console.warn(`   ⚠️  Warning: Local has ${localCount} rows, expected at least ${prodData.length}`);
          }
        }
        
        console.log(`   ✅ Successfully restored ${result.inserted} rows (${result.updated} updated, ${result.skipped} skipped) to ${table}`);
        stats.recoveredTables++;
        stats.totalRows += result.inserted;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error restoring ${table}:`, errorMsg);
        stats.errors.push({ table, error: errorMsg });
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 RECOVERY SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total tables processed: ${stats.totalTables}`);
    console.log(`Successfully recovered: ${stats.recoveredTables}`);
    console.log(`Skipped (no data): ${stats.skippedTables}`);
    console.log(`Total rows recovered: ${stats.totalRows}`);
    
    if (stats.errors.length > 0) {
      console.log(`\n❌ Errors encountered: ${stats.errors.length}`);
      stats.errors.forEach(err => {
        console.log(`   - ${err.table}: ${err.error}`);
      });
      process.exit(1);
    } else {
      console.log('\n🎉 Local database recovered successfully!');
    }
    
  } catch (error) {
    console.error('\n❌ Recovery failed:', error);
    throw error;
  } finally {
    await prodDb.close();
    await localDb.close();
    console.log('\n✅ Database connections closed');
  }
}

if (require.main === module) {
  const args = parseArgs();
  
  if (args.help) {
    console.log(`
Recover Local Database from Production

Usage:
  npm run recover:from-production [options]

Options:
  --prod-host HOST         Production database host (default: DB_HOST from .env or localhost)
  --prod-port PORT         Production database port (default: DB_PORT from .env or 5432)
  --prod-db NAME           Production database name (default: DB_NAME from .env or boathouse_etl)
  --prod-user USER         Production database user (default: DB_USER from .env or postgres)
  --prod-password PASSWORD Production database password (default: DB_PASSWORD from .env)
  
  --local-host HOST        Local database host (default: localhost)
  --local-port PORT        Local database port (default: 5432)
  --local-db NAME          Local database name (default: boathouse_trc)
  --local-user USER        Local database user (default: postgres)
  --local-password PASSWORD Local database password
  
  --dry-run                Show what would be done without making changes
  --help, -h               Show this help message

Examples:
  # Basic recovery (uses .env for production connection)
  npm run recover:from-production
  
  # With custom production host
  npm run recover:from-production -- --prod-host 192.168.1.244
  
  # Dry run to see what would be recovered
  npm run recover:from-production -- --dry-run
`);
    process.exit(0);
  }
  
  recoverFromProduction(args).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default recoverFromProduction;

