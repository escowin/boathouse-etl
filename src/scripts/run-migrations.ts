#!/usr/bin/env ts-node

/**
 * Run database migrations
 * Usage: npm run migrate:up
 */

import { DatabaseUtils } from '../utils/database';
import sequelize from '../config/database';
import { DataTypes, QueryTypes } from 'sequelize';

async function runMigrations() {
  console.log('🔄 Running database migrations...\n');
  
  try {
    // Initialize database connection
    const isInitialized = await DatabaseUtils.initialize();
    if (!isInitialized) {
      throw new Error('Failed to initialize database');
    }
    
    console.log('✅ Database connection established\n');
    
    // Check if migrations table exists
    const queryInterface = sequelize.getQueryInterface();
    
    try {
      await queryInterface.describeTable('SequelizeMeta');
      console.log('✅ Migrations table exists');
    } catch (error) {
      console.log('📝 Creating migrations table...');
      await queryInterface.createTable('SequelizeMeta', {
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
          primaryKey: true,
        },
      });
      console.log('✅ Migrations table created');
    }
    
    // List all migration files
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter((file: string) => file.endsWith('.js'))
      .sort();
    
    console.log(`\n📋 Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach((file: string) => {
      console.log(`  - ${file}`);
    });
    
    // Check which migrations have been run
    const executedMigrations = await sequelize.query(
      'SELECT name FROM "SequelizeMeta" ORDER BY name',
      { type: QueryTypes.SELECT }
    ) as Array<{ name: string }>;
    
    const executedNames = executedMigrations.map(m => m.name);
    const pendingMigrations = migrationFiles.filter((file: string) => 
      !executedNames.includes(file.replace('.js', ''))
    );
    
    console.log(`\n📊 Migration Status:`);
    console.log(`  - Executed: ${executedNames.length}`);
    console.log(`  - Pending: ${pendingMigrations.length}`);
    
    if (pendingMigrations.length === 0) {
      console.log('\n✅ All migrations are up to date!');
      return;
    }
    
    console.log(`\n🔄 Running ${pendingMigrations.length} pending migrations...`);
    
    // Run pending migrations
    for (const migrationFile of pendingMigrations) {
      console.log(`\n📝 Running migration: ${migrationFile}`);
      
      try {
        const migration = require(path.join(migrationsDir, migrationFile));
        await migration.up(queryInterface, DataTypes);
        
        // Record migration as executed
        await sequelize.query(
          'INSERT INTO "SequelizeMeta" (name) VALUES (?)',
          {
            replacements: [migrationFile.replace('.js', '')],
            type: QueryTypes.INSERT
          }
        );
        
        console.log(`  ✅ ${migrationFile} completed successfully`);
      } catch (error) {
        console.error(`  ❌ ${migrationFile} failed:`, error);
        throw error;
      }
    }
    
    console.log('\n🎉 All migrations completed successfully!');
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name NOT LIKE 'SequelizeMeta'
      ORDER BY table_name
    `, { type: QueryTypes.SELECT }) as Array<{ table_name: string }>;
    
    console.log(`✅ Created ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await DatabaseUtils.cleanup();
  }
}

// Run migrations
if (require.main === module) {
  runMigrations();
}

export default runMigrations;
