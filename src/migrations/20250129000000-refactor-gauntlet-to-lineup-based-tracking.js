'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Starting gauntlet to lineup-based tracking migration...');
      console.log('⚠️  Dropping and recreating tables (no data to preserve)...');
      
      // ===================================================================
      // Drop tables in reverse dependency order
      // ===================================================================
      console.log('📝 Dropping dependent tables...');
      
      // Drop tables that depend on ladder_positions and ladder_progressions
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS ladder_progressions CASCADE;', { transaction });
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS ladder_positions CASCADE;', { transaction });
      
      // Drop gauntlet_matches (references gauntlet_lineups)
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS gauntlet_matches CASCADE;', { transaction });
      
      // gauntlet_lineups and gauntlet_seat_assignments stay, we'll alter gauntlet_lineups
      
      // ===================================================================
      // 1. Add is_user_lineup to gauntlet_lineups (if not exists)
      // ===================================================================
      console.log('📝 Adding is_user_lineup flag to gauntlet_lineups...');
      
      const [lineupColumns] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'gauntlet_lineups' 
        AND column_name = 'is_user_lineup'
      `, { transaction });
      
      if (lineupColumns.length === 0) {
        await queryInterface.addColumn('gauntlet_lineups', 'is_user_lineup', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        }, { transaction });
        
        await queryInterface.addIndex('gauntlet_lineups', ['is_user_lineup'], {
          name: 'idx_gauntlet_lineups_is_user_lineup',
          transaction
        });
      } else {
        console.log('✅ is_user_lineup column already exists');
      }
      
      // ===================================================================
      // 2. Recreate gauntlet_matches table
      // ===================================================================
      console.log('📝 Recreating gauntlet_matches table...');
      
      await queryInterface.createTable('gauntlet_matches', {
        match_id: {
          type: Sequelize.UUID,
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
        user_lineup_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'gauntlet_lineups',
            key: 'gauntlet_lineup_id'
          },
          onDelete: 'CASCADE'
        },
        challenger_lineup_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'gauntlet_lineups',
            key: 'gauntlet_lineup_id'
          },
          onDelete: 'CASCADE'
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
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Add indexes
      await queryInterface.addIndex('gauntlet_matches', ['gauntlet_id'], {
        name: 'idx_gauntlet_matches_gauntlet_id',
        transaction
      });
      
      await queryInterface.addIndex('gauntlet_matches', ['user_lineup_id'], {
        name: 'idx_gauntlet_matches_user_lineup_id',
        transaction
      });
      
      await queryInterface.addIndex('gauntlet_matches', ['challenger_lineup_id'], {
        name: 'idx_gauntlet_matches_challenger_lineup_id',
        transaction
      });
      
      await queryInterface.addIndex('gauntlet_matches', ['match_date'], {
        name: 'idx_gauntlet_matches_match_date',
        transaction
      });
      
      // ===================================================================
      // 3. Recreate ladder_positions table
      // ===================================================================
      console.log('📝 Recreating ladder_positions table...');
      
      await queryInterface.createTable('ladder_positions', {
        position_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        ladder_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'ladders',
            key: 'ladder_id'
          },
          onDelete: 'CASCADE'
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
          defaultValue: Sequelize.literal('CURRENT_DATE')
        },
        last_updated: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
      
      // Add unique constraint
      await queryInterface.addConstraint('ladder_positions', {
        fields: ['ladder_id', 'gauntlet_lineup_id'],
        type: 'unique',
        name: 'ladder_positions_ladder_id_gauntlet_lineup_id_key',
        transaction
      });
      
      // Add indexes
      await queryInterface.addIndex('ladder_positions', ['ladder_id'], {
        name: 'idx_ladder_positions_ladder_id',
        transaction
      });
      
      await queryInterface.addIndex('ladder_positions', ['gauntlet_lineup_id'], {
        name: 'idx_ladder_positions_gauntlet_lineup_id',
        transaction
      });
      
      await queryInterface.addIndex('ladder_positions', ['position'], {
        name: 'idx_ladder_positions_position',
        transaction
      });
      
      // ===================================================================
      // 4. Recreate ladder_progressions table
      // ===================================================================
      console.log('📝 Recreating ladder_progressions table...');
      
      await queryInterface.createTable('ladder_progressions', {
        progression_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        ladder_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'ladders',
            key: 'ladder_id'
          },
          onDelete: 'CASCADE'
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
          type: Sequelize.TEXT,
          allowNull: false
        },
        match_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'gauntlet_matches',
            key: 'match_id'
          },
          onDelete: 'CASCADE'
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
      
      // Add CHECK constraint for reason
      await queryInterface.sequelize.query(`
        ALTER TABLE ladder_progressions 
        ADD CONSTRAINT ladder_progressions_reason_check 
        CHECK (reason IN ('match_win', 'match_loss', 'match_draw', 'manual_adjustment', 'new_lineup'));
      `, { transaction });
      
      // Add indexes
      await queryInterface.addIndex('ladder_progressions', ['ladder_id'], {
        name: 'idx_ladder_progressions_ladder_id',
        transaction
      });
      
      await queryInterface.addIndex('ladder_progressions', ['gauntlet_lineup_id'], {
        name: 'idx_ladder_progressions_gauntlet_lineup_id',
        transaction
      });
      
      await queryInterface.addIndex('ladder_progressions', ['match_id'], {
        name: 'idx_ladder_progressions_match_id',
        transaction
      });
      
      await transaction.commit();
      console.log('✅ Successfully completed gauntlet to lineup-based tracking migration');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error in migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Rolling back gauntlet to lineup-based tracking migration...');
      console.log('⚠️  Dropping and recreating tables with old structure...');
      
      // Drop the new tables
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS ladder_progressions CASCADE;', { transaction });
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS ladder_positions CASCADE;', { transaction });
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS gauntlet_matches CASCADE;', { transaction });
      
      // Recreate gauntlet_matches with old structure (no lineup references)
      console.log('📝 Recreating gauntlet_matches with old structure...');
      await queryInterface.createTable('gauntlet_matches', {
        match_id: {
          type: Sequelize.UUID,
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
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      await queryInterface.addIndex('gauntlet_matches', ['gauntlet_id'], {
        name: 'idx_gauntlet_matches_gauntlet_id',
        transaction
      });
      
      await queryInterface.addIndex('gauntlet_matches', ['match_date'], {
        name: 'idx_gauntlet_matches_match_date',
        transaction
      });
      
      // Recreate ladder_positions with athlete_id
      console.log('📝 Recreating ladder_positions with old structure...');
      await queryInterface.createTable('ladder_positions', {
        position_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        ladder_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'ladders',
            key: 'ladder_id'
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
          defaultValue: Sequelize.literal('CURRENT_DATE')
        },
        last_updated: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
      
      await queryInterface.addConstraint('ladder_positions', {
        fields: ['ladder_id', 'athlete_id'],
        type: 'unique',
        name: 'ladder_positions_ladder_id_athlete_id_key',
        transaction
      });
      
      await queryInterface.addIndex('ladder_positions', ['ladder_id'], {
        name: 'idx_ladder_positions_ladder_id',
        transaction
      });
      
      await queryInterface.addIndex('ladder_positions', ['athlete_id'], {
        name: 'idx_ladder_positions_athlete_id',
        transaction
      });
      
      await queryInterface.addIndex('ladder_positions', ['position'], {
        name: 'idx_ladder_positions_position',
        transaction
      });
      
      // Recreate ladder_progressions with athlete_id
      console.log('📝 Recreating ladder_progressions with old structure...');
      await queryInterface.createTable('ladder_progressions', {
        progression_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        ladder_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'ladders',
            key: 'ladder_id'
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
          type: Sequelize.TEXT,
          allowNull: false
        },
        match_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'gauntlet_matches',
            key: 'match_id'
          },
          onDelete: 'CASCADE'
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      await queryInterface.sequelize.query(`
        ALTER TABLE ladder_progressions 
        ADD CONSTRAINT ladder_progressions_reason_check 
        CHECK (reason IN ('match_win', 'match_loss', 'match_draw', 'manual_adjustment', 'new_athlete'));
      `, { transaction });
      
      await queryInterface.addIndex('ladder_progressions', ['ladder_id'], {
        name: 'idx_ladder_progressions_ladder_id',
        transaction
      });
      
      await queryInterface.addIndex('ladder_progressions', ['athlete_id'], {
        name: 'idx_ladder_progressions_athlete_id',
        transaction
      });
      
      await queryInterface.addIndex('ladder_progressions', ['match_id'], {
        name: 'idx_ladder_progressions_match_id',
        transaction
      });
      
      // Remove is_user_lineup from gauntlet_lineups if it exists
      const [lineupColumns] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'gauntlet_lineups' 
        AND column_name = 'is_user_lineup'
      `, { transaction });
      
      if (lineupColumns.length > 0) {
        await queryInterface.removeIndex('gauntlet_lineups', 'idx_gauntlet_lineups_is_user_lineup', { transaction });
        await queryInterface.removeColumn('gauntlet_lineups', 'is_user_lineup', { transaction });
      }
      
      await transaction.commit();
      console.log('✅ Successfully rolled back gauntlet to lineup-based tracking migration');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error rolling back migration:', error);
      throw error;
    }
  }
};

