'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Starting challenge leaderboard tables migration...');
      
      // ===================================================================
      // 1. Create ENUM types (if needed)
      // ===================================================================
      // Note: saved_lineup_seat_assignments.side uses TEXT with CHECK constraint
      // instead of ENUM to support 'Port', 'Starboard', 'Scull', or ''
      
      // ===================================================================
      // 2. Create challenges table
      // ===================================================================
      console.log('📝 Creating challenges table...');
      await queryInterface.createTable('challenges', {
        challenge_id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        distance_meters: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          validate: {
            min: 1
          }
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Add CHECK constraint for distance_meters
      await queryInterface.sequelize.query(`
        ALTER TABLE challenges 
        ADD CONSTRAINT check_distance_meters_positive 
        CHECK (distance_meters > 0);
      `, { transaction });
      
      // Create index on distance_meters
      await queryInterface.addIndex('challenges', ['distance_meters'], {
        name: 'idx_challenges_distance',
        transaction
      });
      
      // ===================================================================
      // 3. Create saved_lineups table
      // ===================================================================
      console.log('📝 Creating saved_lineups table...');
      await queryInterface.createTable('saved_lineups', {
        saved_lineup_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        boat_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'boats',
            key: 'boat_id'
          },
          onDelete: 'CASCADE'
        },
        lineup_name: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        team_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'teams',
            key: 'team_id'
          }
        },
        created_by: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'athletes',
            key: 'athlete_id'
          }
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Create indexes for saved_lineups
      await queryInterface.addIndex('saved_lineups', ['boat_id'], {
        name: 'idx_saved_lineups_boat_id',
        transaction
      });
      
      await queryInterface.addIndex('saved_lineups', ['team_id'], {
        name: 'idx_saved_lineups_team_id',
        transaction
      });
      
      await queryInterface.addIndex('saved_lineups', ['created_by'], {
        name: 'idx_saved_lineups_created_by',
        transaction
      });
      
      await queryInterface.addIndex('saved_lineups', ['is_active'], {
        name: 'idx_saved_lineups_is_active',
        transaction
      });
      
      // ===================================================================
      // 4. Create saved_lineup_seat_assignments table
      // ===================================================================
      console.log('📝 Creating saved_lineup_seat_assignments table...');
      await queryInterface.createTable('saved_lineup_seat_assignments', {
        saved_lineup_seat_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        saved_lineup_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'saved_lineups',
            key: 'saved_lineup_id'
          },
          onDelete: 'CASCADE'
        },
        athlete_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'athletes',
            key: 'athlete_id'
          },
          onDelete: 'CASCADE'
        },
        seat_number: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        side: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Add CHECK constraints
      await queryInterface.sequelize.query(`
        ALTER TABLE saved_lineup_seat_assignments 
        ADD CONSTRAINT check_seat_number_range 
        CHECK (seat_number >= 1 AND seat_number <= 9);
      `, { transaction });
      
      await queryInterface.sequelize.query(`
        ALTER TABLE saved_lineup_seat_assignments 
        ADD CONSTRAINT check_side_values 
        CHECK (side IN ('Port', 'Starboard', 'Scull', '') OR side IS NULL);
      `, { transaction });
      
      // Add unique constraint for (saved_lineup_id, seat_number)
      await queryInterface.addIndex('saved_lineup_seat_assignments', 
        ['saved_lineup_id', 'seat_number'], {
        unique: true,
        name: 'saved_lineup_seat_assignments_saved_lineup_id_seat_number_key',
        transaction
      });
      
      // Create indexes for saved_lineup_seat_assignments
      await queryInterface.addIndex('saved_lineup_seat_assignments', ['saved_lineup_id'], {
        name: 'idx_saved_lineup_seat_assignments_saved_lineup_id',
        transaction
      });
      
      await queryInterface.addIndex('saved_lineup_seat_assignments', ['athlete_id'], {
        name: 'idx_saved_lineup_seat_assignments_athlete_id',
        transaction
      });
      
      await queryInterface.addIndex('saved_lineup_seat_assignments', ['seat_number'], {
        name: 'idx_saved_lineup_seat_assignments_seat_number',
        transaction
      });
      
      // ===================================================================
      // 5. Create challenge_lineups table
      // ===================================================================
      console.log('📝 Creating challenge_lineups table...');
      await queryInterface.createTable('challenge_lineups', {
        challenge_lineup_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        challenge_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'challenges',
            key: 'challenge_id'
          },
          onDelete: 'CASCADE'
        },
        saved_lineup_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'saved_lineups',
            key: 'saved_lineup_id'
          },
          onDelete: 'CASCADE'
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Add unique constraint for (challenge_id, saved_lineup_id)
      await queryInterface.addIndex('challenge_lineups', 
        ['challenge_id', 'saved_lineup_id'], {
        unique: true,
        name: 'challenge_lineups_challenge_id_saved_lineup_id_key',
        transaction
      });
      
      // Create indexes for challenge_lineups
      await queryInterface.addIndex('challenge_lineups', ['challenge_id'], {
        name: 'idx_challenge_lineups_challenge_id',
        transaction
      });
      
      await queryInterface.addIndex('challenge_lineups', ['saved_lineup_id'], {
        name: 'idx_challenge_lineups_saved_lineup_id',
        transaction
      });
      
      await queryInterface.addIndex('challenge_lineups', ['is_active'], {
        name: 'idx_challenge_lineups_is_active',
        transaction
      });
      
      // Create partial index for active challenge lineups
      await queryInterface.sequelize.query(`
        CREATE INDEX idx_challenge_lineups_challenge_saved_lineup_active 
        ON challenge_lineups(challenge_id, saved_lineup_id, is_active) 
        WHERE is_active = true;
      `, { transaction });
      
      // ===================================================================
      // 6. Create challenge_entries table
      // ===================================================================
      console.log('📝 Creating challenge_entries table...');
      await queryInterface.createTable('challenge_entries', {
        challenge_entry_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        lineup_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'challenge_lineups',
            key: 'challenge_lineup_id'
          },
          onDelete: 'CASCADE'
        },
        time_seconds: {
          type: Sequelize.DECIMAL(6, 2),
          allowNull: false
        },
        stroke_rate: {
          type: Sequelize.DECIMAL(4, 1),
          allowNull: true
        },
        split_seconds: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true
        },
        entry_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_DATE')
        },
        entry_time: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        conditions: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Add CHECK constraint for time_seconds
      await queryInterface.sequelize.query(`
        ALTER TABLE challenge_entries 
        ADD CONSTRAINT check_time_seconds_positive 
        CHECK (time_seconds >= 0);
      `, { transaction });
      
      // Add CHECK constraint for stroke_rate
      await queryInterface.sequelize.query(`
        ALTER TABLE challenge_entries 
        ADD CONSTRAINT check_stroke_rate_range 
        CHECK (stroke_rate IS NULL OR (stroke_rate >= 0 AND stroke_rate <= 100));
      `, { transaction });
      
      // Add CHECK constraint for split_seconds
      await queryInterface.sequelize.query(`
        ALTER TABLE challenge_entries 
        ADD CONSTRAINT check_split_seconds_positive 
        CHECK (split_seconds IS NULL OR split_seconds >= 0);
      `, { transaction });
      
      // Create indexes for challenge_entries
      await queryInterface.addIndex('challenge_entries', ['lineup_id'], {
        name: 'idx_challenge_entries_lineup_id',
        transaction
      });
      
      await queryInterface.addIndex('challenge_entries', ['entry_date'], {
        name: 'idx_challenge_entries_entry_date',
        transaction
      });
      
      await queryInterface.addIndex('challenge_entries', ['entry_time'], {
        name: 'idx_challenge_entries_entry_time',
        transaction
      });
      
      await queryInterface.addIndex('challenge_entries', ['time_seconds'], {
        name: 'idx_challenge_entries_time_seconds',
        transaction
      });
      
      await queryInterface.addIndex('challenge_entries', ['lineup_id', 'entry_date'], {
        name: 'idx_challenge_entries_lineup_date',
        transaction
      });
      
      await queryInterface.addIndex('challenge_entries', ['lineup_id', 'entry_date', 'entry_time'], {
        name: 'idx_challenge_entries_lineup_date_time',
        transaction
      });
      
      // ===================================================================
      // 7. Seed initial challenge data
      // ===================================================================
      console.log('🌱 Seeding initial challenge data...');
      await queryInterface.bulkInsert('challenges', [
        { distance_meters: 500, description: '500m Sprint', created_at: new Date(), updated_at: new Date() },
        { distance_meters: 1000, description: '1k Challenge', created_at: new Date(), updated_at: new Date() },
        { distance_meters: 2000, description: '2k Challenge', created_at: new Date(), updated_at: new Date() },
        { distance_meters: 5000, description: '5k Challenge', created_at: new Date(), updated_at: new Date() },
        { distance_meters: 10000, description: '10k Challenge', created_at: new Date(), updated_at: new Date() }
      ], { transaction });
      
      await transaction.commit();
      console.log('✅ Successfully created challenge leaderboard tables and seeded initial data');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error creating challenge leaderboard tables:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Rolling back challenge leaderboard tables migration...');
      
      // Drop tables in reverse order (respecting foreign key dependencies)
      await queryInterface.dropTable('challenge_entries', { transaction });
      await queryInterface.dropTable('challenge_lineups', { transaction });
      await queryInterface.dropTable('saved_lineup_seat_assignments', { transaction });
      await queryInterface.dropTable('saved_lineups', { transaction });
      await queryInterface.dropTable('challenges', { transaction });
      
      await transaction.commit();
      console.log('✅ Successfully rolled back challenge leaderboard tables migration');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error rolling back migration:', error);
      throw error;
    }
  }
};

