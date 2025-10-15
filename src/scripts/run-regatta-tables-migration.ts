#!/usr/bin/env ts-node

import sequelize from '../config/database';

/**
 * Script to run the regatta tables migration
 * This adds the regattas, regatta_registrations, races, and erg_tests tables
 */

async function runRegattaTablesMigration() {
  try {
    console.log('🚀 Starting regatta tables migration...');
    console.log('='.repeat(60));

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Step 1: Create regattas table
    console.log('🏁 Creating regattas table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS regattas (
        regatta_id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT,
        body_of_water TEXT,
        start_date DATE,
        end_date DATE,
        registration_deadline DATE,
        registration_open BOOLEAN DEFAULT true,
        registration_notes TEXT,
        regatta_type TEXT CHECK (regatta_type IN ('Local', 'Regional', 'National', 'International', 'Scrimmage')) DEFAULT 'Local',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Step 2: Create regatta_registrations table
    console.log('📝 Creating regatta_registrations table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS regatta_registrations (
        registration_id SERIAL PRIMARY KEY,
        regatta_id INTEGER REFERENCES regattas(regatta_id) ON DELETE CASCADE,
        athlete_id UUID REFERENCES athletes(athlete_id) ON DELETE CASCADE,
        team_id INTEGER REFERENCES teams(team_id),
        status TEXT CHECK (status IN ('Interested', 'Committed', 'Declined', 'Waitlisted')) DEFAULT 'Interested',
        preferred_events TEXT[],
        availability_notes TEXT,
        coach_notes TEXT,
        coach_approved BOOLEAN DEFAULT false,
        registration_url TEXT,
        registered_at TIMESTAMP DEFAULT NOW(),
        status_updated_at TIMESTAMP DEFAULT NOW(),
        coach_reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(regatta_id, athlete_id)
      );
    `);

    // Step 3: Create races table
    console.log('🏃 Creating races table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS races (
        race_id SERIAL PRIMARY KEY,
        regatta_id INTEGER REFERENCES regattas(regatta_id) ON DELETE CASCADE,
        lineup_id INTEGER REFERENCES lineups(lineup_id),
        event_name TEXT NOT NULL,
        race_date DATE,
        race_time TIME,
        distance_meters INTEGER DEFAULT 2000,
        result_time_seconds INTEGER,
        placement INTEGER,
        total_entries INTEGER,
        lane_number INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Step 4: Create erg_tests table
    console.log('💪 Creating erg_tests table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS erg_tests (
        test_id SERIAL PRIMARY KEY,
        athlete_id UUID REFERENCES athletes(athlete_id) ON DELETE CASCADE,
        test_date DATE NOT NULL,
        test_type TEXT CHECK (test_type IN ('2K', '5K', '1K', '6K', '10K', '30min', '1hour')),
        distance_meters INTEGER,
        time_seconds INTEGER,
        split_seconds DECIMAL(5,2),
        watts DECIMAL(6,2),
        calories INTEGER,
        notes TEXT,
        test_conditions TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Step 5: Add indexes to regattas table
    console.log('📊 Adding indexes to regattas table...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_regattas_name ON regattas(name);
      CREATE INDEX IF NOT EXISTS idx_regattas_start_date ON regattas(start_date);
      CREATE INDEX IF NOT EXISTS idx_regattas_registration_open ON regattas(registration_open);
      CREATE INDEX IF NOT EXISTS idx_regattas_regatta_type ON regattas(regatta_type);
    `);

    // Step 6: Add indexes to regatta_registrations table
    console.log('📊 Adding indexes to regatta_registrations table...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_regatta_registrations_regatta_id ON regatta_registrations(regatta_id);
      CREATE INDEX IF NOT EXISTS idx_regatta_registrations_athlete_id ON regatta_registrations(athlete_id);
      CREATE INDEX IF NOT EXISTS idx_regatta_registrations_team_id ON regatta_registrations(team_id);
      CREATE INDEX IF NOT EXISTS idx_regatta_registrations_status ON regatta_registrations(status);
    `);

    // Step 7: Add indexes to races table
    console.log('📊 Adding indexes to races table...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_races_regatta_id ON races(regatta_id);
      CREATE INDEX IF NOT EXISTS idx_races_lineup_id ON races(lineup_id);
      CREATE INDEX IF NOT EXISTS idx_races_race_date ON races(race_date);
      CREATE INDEX IF NOT EXISTS idx_races_event_name ON races(event_name);
    `);

    // Step 8: Add indexes to erg_tests table
    console.log('📊 Adding indexes to erg_tests table...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_erg_tests_athlete_id ON erg_tests(athlete_id);
      CREATE INDEX IF NOT EXISTS idx_erg_tests_test_date ON erg_tests(test_date);
      CREATE INDEX IF NOT EXISTS idx_erg_tests_test_type ON erg_tests(test_type);
      CREATE INDEX IF NOT EXISTS idx_erg_tests_athlete_performance ON erg_tests(athlete_id, test_type, test_date);
    `);

    console.log('✅ Migration completed successfully!');
    console.log('='.repeat(60));
    console.log('📋 Summary of created tables:');
    console.log('  • regattas - Competitive events and scrimmages');
    console.log('  • regatta_registrations - Athlete registrations for events');
    console.log('  • races - Individual race events within regattas');
    console.log('  • erg_tests - Performance test tracking');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runRegattaTablesMigration()
    .then(() => {
      console.log('🎉 Migration script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export default runRegattaTablesMigration;
