#!/usr/bin/env ts-node

import sequelize from '../config/database';

/**
 * Script to run the mailing lists migration
 * This adds the mailing_lists table and updates the teams table with mailing_list_id foreign key
 */

async function runMailingListsMigration() {
  try {
    console.log('🚀 Starting mailing lists migration...');
    console.log('='.repeat(60));

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Step 1: Create mailing_lists table
    console.log('📧 Creating mailing_lists table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS mailing_lists (
        mailing_list_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Step 2: Add indexes to mailing_lists table
    console.log('📊 Adding indexes to mailing_lists table...');
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS mailing_lists_email_unique 
      ON mailing_lists (email);
    `);
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS mailing_lists_name_idx 
      ON mailing_lists (name);
    `);
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS mailing_lists_active_idx 
      ON mailing_lists (active);
    `);

    // Step 3: Add mailing_list_id column to teams table
    console.log('🔗 Adding mailing_list_id column to teams table...');
    await sequelize.query(`
      ALTER TABLE teams 
      ADD COLUMN IF NOT EXISTS mailing_list_id INTEGER;
    `);

    // Step 4: Add foreign key constraint (check if it exists first)
    console.log('🔗 Adding foreign key constraint...');
    const constraintExists = await sequelize.query(`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'teams_mailing_list_id_fkey' 
      AND table_name = 'teams';
    `);
    
    if (constraintExists[0].length === 0) {
      await sequelize.query(`
        ALTER TABLE teams 
        ADD CONSTRAINT teams_mailing_list_id_fkey 
        FOREIGN KEY (mailing_list_id) 
        REFERENCES mailing_lists(mailing_list_id) 
        ON UPDATE CASCADE ON DELETE SET NULL;
      `);
      console.log('✅ Foreign key constraint added');
    } else {
      console.log('ℹ️  Foreign key constraint already exists');
    }

    // Step 5: Add index to teams.mailing_list_id
    console.log('📊 Adding index to teams.mailing_list_id...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS teams_mailing_list_id_idx 
      ON teams (mailing_list_id);
    `);

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📋 What was created:');
    console.log('  • mailing_lists table with proper indexes');
    console.log('  • mailing_list_id foreign key added to teams table');
    console.log('  • Proper constraints and indexes for performance');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('  • Run: npm run seed:mailing-lists (after updating email addresses)');
    console.log('  • Update existing teams to reference appropriate mailing lists');
    console.log('  • Test the new associations in application');

  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
runMailingListsMigration();
