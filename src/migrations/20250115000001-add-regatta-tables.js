'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Starting migration: Add regatta-related tables...');

    // Step 1: Create regattas table
    console.log('🏁 Creating regattas table...');
    await queryInterface.createTable('regattas', {
      regatta_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      location: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      body_of_water: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      registration_deadline: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      registration_open: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      registration_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      regatta_type: {
        type: Sequelize.ENUM('Local', 'Regional', 'National', 'International', 'Scrimmage'),
        allowNull: false,
        defaultValue: 'Local',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Step 2: Create regatta_registrations table
    console.log('📝 Creating regatta_registrations table...');
    await queryInterface.createTable('regatta_registrations', {
      registration_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      regatta_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'regattas',
          key: 'regatta_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      athlete_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('Interested', 'Committed', 'Declined', 'Waitlisted'),
        allowNull: false,
        defaultValue: 'Interested',
      },
      preferred_events: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
        defaultValue: [],
      },
      availability_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      coach_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      coach_approved: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      registration_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      registered_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      status_updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      coach_reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Step 3: Create races table
    console.log('🏃 Creating races table...');
    await queryInterface.createTable('races', {
      race_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      regatta_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'regattas',
          key: 'regatta_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      lineup_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'lineups',
          key: 'lineup_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      event_name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      race_time: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      distance_meters: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2000,
      },
      result_time_seconds: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      placement: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      total_entries: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      lane_number: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Step 4: Create erg_tests table
    console.log('💪 Creating erg_tests table...');
    await queryInterface.createTable('erg_tests', {
      test_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      athlete_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      test_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      test_type: {
        type: Sequelize.ENUM('2K', '5K', '1K', '6K', '10K', '30min', '1hour'),
        allowNull: false,
      },
      distance_meters: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      time_seconds: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      split_seconds: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      watts: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
      },
      calories: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      test_conditions: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Step 5: Add indexes to regattas table
    console.log('📊 Adding indexes to regattas table...');
    await queryInterface.addIndex('regattas', ['name'], {
      name: 'idx_regattas_name'
    });
    await queryInterface.addIndex('regattas', ['start_date'], {
      name: 'idx_regattas_start_date'
    });
    await queryInterface.addIndex('regattas', ['registration_open'], {
      name: 'idx_regattas_registration_open'
    });
    await queryInterface.addIndex('regattas', ['regatta_type'], {
      name: 'idx_regattas_regatta_type'
    });

    // Step 6: Add indexes to regatta_registrations table
    console.log('📊 Adding indexes to regatta_registrations table...');
    await queryInterface.addIndex('regatta_registrations', ['regatta_id'], {
      name: 'idx_regatta_registrations_regatta_id'
    });
    await queryInterface.addIndex('regatta_registrations', ['athlete_id'], {
      name: 'idx_regatta_registrations_athlete_id'
    });
    await queryInterface.addIndex('regatta_registrations', ['team_id'], {
      name: 'idx_regatta_registrations_team_id'
    });
    await queryInterface.addIndex('regatta_registrations', ['status'], {
      name: 'idx_regatta_registrations_status'
    });
    await queryInterface.addIndex('regatta_registrations', ['regatta_id', 'athlete_id'], {
      unique: true,
      name: 'idx_regatta_registrations_unique'
    });

    // Step 7: Add indexes to races table
    console.log('📊 Adding indexes to races table...');
    await queryInterface.addIndex('races', ['regatta_id'], {
      name: 'idx_races_regatta_id'
    });
    await queryInterface.addIndex('races', ['lineup_id'], {
      name: 'idx_races_lineup_id'
    });
    await queryInterface.addIndex('races', ['race_date'], {
      name: 'idx_races_race_date'
    });
    await queryInterface.addIndex('races', ['event_name'], {
      name: 'idx_races_event_name'
    });

    // Step 8: Add indexes to erg_tests table
    console.log('📊 Adding indexes to erg_tests table...');
    await queryInterface.addIndex('erg_tests', ['athlete_id'], {
      name: 'idx_erg_tests_athlete_id'
    });
    await queryInterface.addIndex('erg_tests', ['test_date'], {
      name: 'idx_erg_tests_test_date'
    });
    await queryInterface.addIndex('erg_tests', ['test_type'], {
      name: 'idx_erg_tests_test_type'
    });
    await queryInterface.addIndex('erg_tests', ['athlete_id', 'test_type', 'test_date'], {
      name: 'idx_erg_tests_athlete_performance'
    });

    console.log('✅ Migration completed successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Rolling back migration: Remove regatta-related tables...');

    // Drop tables in reverse order (due to foreign key constraints)
    console.log('🗑️ Dropping erg_tests table...');
    await queryInterface.dropTable('erg_tests');

    console.log('🗑️ Dropping races table...');
    await queryInterface.dropTable('races');

    console.log('🗑️ Dropping regatta_registrations table...');
    await queryInterface.dropTable('regatta_registrations');

    console.log('🗑️ Dropping regattas table...');
    await queryInterface.dropTable('regattas');

    console.log('✅ Rollback completed successfully!');
  }
};
