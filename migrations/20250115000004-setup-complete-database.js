'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Starting comprehensive database setup...');
      
      // Step 1: Create core schema tables
      console.log('\n📋 Step 1: Creating core schema tables...');
      const coreMigration = require('../src/migrations/20250114000020-create-complete-schema.js');
      await coreMigration.up(queryInterface, Sequelize);
      console.log('✅ Core schema tables created');
      
      // Step 2: Add mailing lists
      console.log('\n📋 Step 2: Adding mailing lists...');
      await this.addMailingLists(queryInterface, Sequelize);
      console.log('✅ Mailing lists added');
      
      // Step 3: Add regatta tables
      console.log('\n📋 Step 3: Adding regatta tables...');
      await this.addRegattaTables(queryInterface, Sequelize);
      console.log('✅ Regatta tables added');
      
      // Step 4: Update boat type enum
      console.log('\n📋 Step 4: Updating boat type enum...');
      await this.updateBoatTypeEnum(queryInterface, Sequelize);
      console.log('✅ Boat type enum updated');
      
      // Step 5: Add competitive systems
      console.log('\n📋 Step 5: Adding competitive systems...');
      await this.addCompetitiveSystems(queryInterface, Sequelize);
      console.log('✅ Competitive systems added');
      
      await transaction.commit();
      console.log('\n🎉 Database setup completed successfully!');
      console.log('📝 All tables and systems are ready for ETL processing');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Database setup failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Starting database rollback...');
      
      // Rollback in reverse order
      console.log('\n📋 Rolling back competitive systems...');
      await this.removeCompetitiveSystems(queryInterface, Sequelize);
      console.log('✅ Competitive systems rolled back');
      
      console.log('\n📋 Rolling back boat type enum...');
      await this.removeBoatTypeEnum(queryInterface, Sequelize);
      console.log('✅ Boat type enum rolled back');
      
      console.log('\n📋 Rolling back regatta tables...');
      await this.removeRegattaTables(queryInterface, Sequelize);
      console.log('✅ Regatta tables rolled back');
      
      console.log('\n📋 Rolling back mailing lists...');
      await this.removeMailingLists(queryInterface, Sequelize);
      console.log('✅ Mailing lists rolled back');
      
      console.log('\n📋 Rolling back core schema...');
      const coreMigration = require('../src/migrations/20250114000020-create-complete-schema.js');
      await coreMigration.down(queryInterface, Sequelize);
      console.log('✅ Core schema rolled back');
      
      await transaction.commit();
      console.log('\n🎉 Database rollback completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Database rollback failed:', error);
      throw error;
    }
  },

  // Helper methods for each migration step
  async addMailingLists(queryInterface, Sequelize) {
    // Create mailing_lists table
    await queryInterface.createTable('mailing_lists', {
      mailing_list_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    // Add indexes
    await queryInterface.addIndex('mailing_lists', ['email'], {
      unique: true,
      name: 'mailing_lists_email_unique'
    });
    await queryInterface.addIndex('mailing_lists', ['name'], {
      name: 'mailing_lists_name_idx'
    });
    await queryInterface.addIndex('mailing_lists', ['active'], {
      name: 'mailing_lists_active_idx'
    });

    // Add mailing_list_id column to teams table
    await queryInterface.addColumn('teams', 'mailing_list_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'mailing_lists',
        key: 'mailing_list_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('teams', ['mailing_list_id'], {
      name: 'teams_mailing_list_id_idx'
    });
  },

  async addRegattaTables(queryInterface, Sequelize) {
    // Create regattas table
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

    // Create regatta_registrations table
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

    // Create races table
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

    // Create erg_tests table
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

    // Add indexes for all regatta tables
    await queryInterface.addIndex('regattas', ['name'], { name: 'idx_regattas_name' });
    await queryInterface.addIndex('regattas', ['start_date'], { name: 'idx_regattas_start_date' });
    await queryInterface.addIndex('regattas', ['registration_open'], { name: 'idx_regattas_registration_open' });
    await queryInterface.addIndex('regattas', ['regatta_type'], { name: 'idx_regattas_regatta_type' });

    await queryInterface.addIndex('regatta_registrations', ['regatta_id'], { name: 'idx_regatta_registrations_regatta_id' });
    await queryInterface.addIndex('regatta_registrations', ['athlete_id'], { name: 'idx_regatta_registrations_athlete_id' });
    await queryInterface.addIndex('regatta_registrations', ['team_id'], { name: 'idx_regatta_registrations_team_id' });
    await queryInterface.addIndex('regatta_registrations', ['status'], { name: 'idx_regatta_registrations_status' });
    await queryInterface.addIndex('regatta_registrations', ['regatta_id', 'athlete_id'], { unique: true, name: 'idx_regatta_registrations_unique' });

    await queryInterface.addIndex('races', ['regatta_id'], { name: 'idx_races_regatta_id' });
    await queryInterface.addIndex('races', ['lineup_id'], { name: 'idx_races_lineup_id' });
    await queryInterface.addIndex('races', ['race_date'], { name: 'idx_races_race_date' });
    await queryInterface.addIndex('races', ['event_name'], { name: 'idx_races_event_name' });

    await queryInterface.addIndex('erg_tests', ['athlete_id'], { name: 'idx_erg_tests_athlete_id' });
    await queryInterface.addIndex('erg_tests', ['test_date'], { name: 'idx_erg_tests_test_date' });
    await queryInterface.addIndex('erg_tests', ['test_type'], { name: 'idx_erg_tests_test_type' });
    await queryInterface.addIndex('erg_tests', ['athlete_id', 'test_type', 'test_date'], { name: 'idx_erg_tests_athlete_performance' });
  },

  async updateBoatTypeEnum(queryInterface, Sequelize) {
    // Create new enum type
    await queryInterface.sequelize.query('CREATE TYPE enum_boats_type_new AS ENUM (\'1x\', \'2x\', \'2-\', \'4x\', \'4+\', \'8+\')');
    
    // Update boats.type column to use new enum with data conversion
    await queryInterface.sequelize.query(`
      ALTER TABLE boats 
      ALTER COLUMN type TYPE enum_boats_type_new
      USING CASE
        WHEN type = 'Single' THEN '1x'::enum_boats_type_new
        WHEN type = 'Double' THEN '2x'::enum_boats_type_new
        WHEN type = 'Pair' THEN '2-'::enum_boats_type_new
        WHEN type = 'Quad' THEN '4x'::enum_boats_type_new
        WHEN type = 'Four' THEN '4+'::enum_boats_type_new
        WHEN type = 'Eight' THEN '8+'::enum_boats_type_new
        ELSE type::text::enum_boats_type_new
      END
    `);
    
    // Drop old enum type
    await queryInterface.sequelize.query('DROP TYPE enum_boats_type');
    
    // Rename new enum to original name
    await queryInterface.sequelize.query('ALTER TYPE enum_boats_type_new RENAME TO enum_boats_type');
  },

  async addCompetitiveSystems(queryInterface, Sequelize) {
    // Create gauntlets table
    await queryInterface.createTable('gauntlets', {
      gauntlet_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      boat_type: {
        type: Sequelize.ENUM('1x', '2x', '2-', '4x', '4+', '8+'),
        allowNull: false
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        }
      },
      status: {
        type: Sequelize.ENUM('setup', 'active', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'setup'
      },
      configuration: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create gauntlet_lineups table
    await queryInterface.createTable('gauntlet_lineups', {
      gauntlet_lineup_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      gauntlet_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'gauntlets',
          key: 'gauntlet_id'
        },
        onDelete: 'CASCADE'
      },
      boat_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'boats',
          key: 'boat_id'
        }
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'teams',
          key: 'team_id'
        }
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create gauntlet_matches table
    await queryInterface.createTable('gauntlet_matches', {
      match_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      gauntlet_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'gauntlets',
          key: 'gauntlet_id'
        }
      },
      workout: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      sets: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      user_wins: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      user_losses: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      match_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create gauntlet_seat_assignments table
    await queryInterface.createTable('gauntlet_seat_assignments', {
      gauntlet_seat_assignment_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      gauntlet_lineup_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'gauntlet_lineups',
          key: 'gauntlet_lineup_id'
        },
        onDelete: 'CASCADE'
      },
      athlete_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        }
      },
      seat_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      side: {
        type: Sequelize.ENUM('port', 'starboard'),
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create ladders table
    await queryInterface.createTable('ladders', {
      ladder_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('1x', '2x', '2-', '4+', '8+'),
        allowNull: false
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        }
      },
      settings: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create ladder_positions table
    await queryInterface.createTable('ladder_positions', {
      position_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      ladder_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ladders',
          key: 'ladder_id'
        }
      },
      athlete_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        }
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      previous_position: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      wins: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      losses: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      draws: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      win_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      total_matches: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      streak_type: {
        type: Sequelize.ENUM('win', 'loss', 'draw', 'none'),
        allowNull: false,
        defaultValue: 'none'
      },
      streak_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      last_match_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      joined_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      last_updated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create ladder_progressions table
    await queryInterface.createTable('ladder_progressions', {
      progression_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      ladder_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ladders',
          key: 'ladder_id'
        }
      },
      athlete_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        }
      },
      from_position: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      to_position: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      change: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      reason: {
        type: Sequelize.ENUM('match_win', 'match_loss', 'match_draw', 'manual_adjustment', 'new_athlete'),
        allowNull: false
      },
      match_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'gauntlet_matches',
          key: 'match_id'
        }
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add all indexes for competitive systems
    await queryInterface.addIndex('gauntlets', ['created_by'], { name: 'idx_gauntlets_created_by' });
    await queryInterface.addIndex('gauntlets', ['status'], { name: 'idx_gauntlets_status' });
    await queryInterface.addIndex('gauntlets', ['boat_type'], { name: 'idx_gauntlets_boat_type' });

    await queryInterface.addIndex('gauntlet_lineups', ['gauntlet_id'], { name: 'idx_gauntlet_lineups_gauntlet_id' });
    await queryInterface.addIndex('gauntlet_lineups', ['boat_id'], { name: 'idx_gauntlet_lineups_boat_id' });
    await queryInterface.addIndex('gauntlet_lineups', ['team_id'], { name: 'idx_gauntlet_lineups_team_id' });

    await queryInterface.addIndex('gauntlet_matches', ['gauntlet_id'], { name: 'idx_gauntlet_matches_gauntlet_id' });
    await queryInterface.addIndex('gauntlet_matches', ['match_date'], { name: 'idx_gauntlet_matches_match_date' });

    await queryInterface.addIndex('gauntlet_seat_assignments', ['gauntlet_lineup_id']);
    await queryInterface.addIndex('gauntlet_seat_assignments', ['athlete_id']);
    await queryInterface.addIndex('gauntlet_seat_assignments', ['seat_number']);
    await queryInterface.addIndex('gauntlet_seat_assignments', ['gauntlet_lineup_id', 'seat_number'], { unique: true });

    await queryInterface.addIndex('ladders', ['type'], { name: 'idx_ladders_type' });
    await queryInterface.addIndex('ladders', ['created_by'], { name: 'idx_ladders_created_by' });

    await queryInterface.addIndex('ladder_positions', ['ladder_id'], { name: 'idx_ladder_positions_ladder_id' });
    await queryInterface.addIndex('ladder_positions', ['athlete_id'], { name: 'idx_ladder_positions_athlete_id' });
    await queryInterface.addIndex('ladder_positions', ['position'], { name: 'idx_ladder_positions_position' });
    await queryInterface.addIndex('ladder_positions', ['ladder_id', 'athlete_id'], { unique: true, name: 'idx_ladder_positions_unique' });

    await queryInterface.addIndex('ladder_progressions', ['ladder_id'], { name: 'idx_ladder_progressions_ladder_id' });
    await queryInterface.addIndex('ladder_progressions', ['athlete_id'], { name: 'idx_ladder_progressions_athlete_id' });
    await queryInterface.addIndex('ladder_progressions', ['match_id'], { name: 'idx_ladder_progressions_match_id' });
  },

  // Rollback helper methods
  async removeCompetitiveSystems(queryInterface, Sequelize) {
    await queryInterface.dropTable('ladder_progressions');
    await queryInterface.dropTable('ladder_positions');
    await queryInterface.dropTable('ladders');
    await queryInterface.dropTable('gauntlet_seat_assignments');
    await queryInterface.dropTable('gauntlet_matches');
    await queryInterface.dropTable('gauntlet_lineups');
    await queryInterface.dropTable('gauntlets');
  },

  async removeBoatTypeEnum(queryInterface, Sequelize) {
    // This would need to be implemented if rollback is needed
    // For now, we'll skip this as it's complex to rollback enum changes
    console.log('⚠️  Boat type enum rollback skipped (complex operation)');
  },

  async removeRegattaTables(queryInterface, Sequelize) {
    await queryInterface.dropTable('erg_tests');
    await queryInterface.dropTable('races');
    await queryInterface.dropTable('regatta_registrations');
    await queryInterface.dropTable('regattas');
  },

  async removeMailingLists(queryInterface, Sequelize) {
    await queryInterface.removeIndex('teams', 'teams_mailing_list_id_idx');
    await queryInterface.removeColumn('teams', 'mailing_list_id');
    await queryInterface.removeIndex('mailing_lists', 'mailing_lists_email_unique');
    await queryInterface.removeIndex('mailing_lists', 'mailing_lists_name_idx');
    await queryInterface.removeIndex('mailing_lists', 'mailing_lists_active_idx');
    await queryInterface.dropTable('mailing_lists');
  }
};