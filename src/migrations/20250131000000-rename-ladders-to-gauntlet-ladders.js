'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Starting migration: Rename ladders to gauntlet_ladders...');
      console.log('⚠️  Dropping and recreating tables (no data to preserve)...');
      
      // ===================================================================
      // Step 1: Drop tables in reverse dependency order
      // ===================================================================
      console.log('📝 Dropping old tables...');
      
      // Drop ladder_progressions first (if it exists)
      await queryInterface.sequelize.query(
        'DROP TABLE IF EXISTS ladder_progressions CASCADE;',
        { transaction }
      );
      console.log('✅ Dropped ladder_progressions table');
      
      // Drop ladder_positions (depends on ladders)
      await queryInterface.sequelize.query(
        'DROP TABLE IF EXISTS ladder_positions CASCADE;',
        { transaction }
      );
      console.log('✅ Dropped ladder_positions table');
      
      // Drop ladders table
      await queryInterface.sequelize.query(
        'DROP TABLE IF EXISTS ladders CASCADE;',
        { transaction }
      );
      console.log('✅ Dropped ladders table');
      
      // ===================================================================
      // Step 2: Create gauntlet_ladders table
      // ===================================================================
      console.log('📝 Creating gauntlet_ladders table...');
      
      await queryInterface.createTable('gauntlet_ladders', {
        ladder_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.literal('gen_random_uuid()')
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
      
      // Add index on gauntlet_id
      await queryInterface.addIndex('gauntlet_ladders', ['gauntlet_id'], {
        name: 'idx_gauntlet_ladders_gauntlet_id',
        transaction
      });
      
      console.log('✅ Created gauntlet_ladders table');
      
      // ===================================================================
      // Step 3: Create gauntlet_positions table
      // ===================================================================
      console.log('📝 Creating gauntlet_positions table...');
      
      await queryInterface.createTable('gauntlet_positions', {
        position_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.literal('gen_random_uuid()')
        },
        ladder_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'gauntlet_ladders',
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
          type: Sequelize.TEXT,
          allowNull: true,
          // Note: Using TEXT instead of ENUM for flexibility
          // The CHECK constraint is handled in the schema.sql
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
      
      // Add unique constraint on (ladder_id, gauntlet_lineup_id)
      await queryInterface.addIndex('gauntlet_positions', ['ladder_id', 'gauntlet_lineup_id'], {
        name: 'idx_gauntlet_positions_unique',
        unique: true,
        transaction
      });
      
      // Add indexes
      await queryInterface.addIndex('gauntlet_positions', ['ladder_id'], {
        name: 'idx_gauntlet_positions_ladder_id',
        transaction
      });
      
      await queryInterface.addIndex('gauntlet_positions', ['gauntlet_lineup_id'], {
        name: 'idx_gauntlet_positions_gauntlet_lineup_id',
        transaction
      });
      
      await queryInterface.addIndex('gauntlet_positions', ['position'], {
        name: 'idx_gauntlet_positions_position',
        transaction
      });
      
      // Add CHECK constraint for streak_type using raw SQL
      await queryInterface.sequelize.query(
        `ALTER TABLE gauntlet_positions 
         ADD CONSTRAINT check_streak_type 
         CHECK (streak_type IS NULL OR streak_type IN ('win', 'loss', 'draw', 'none'));`,
        { transaction }
      );
      
      console.log('✅ Created gauntlet_positions table');
      
      await transaction.commit();
      console.log('✅ Migration completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Rolling back migration: Rename gauntlet_ladders back to ladders...');
      
      // Drop new tables
      await queryInterface.sequelize.query(
        'DROP TABLE IF EXISTS gauntlet_positions CASCADE;',
        { transaction }
      );
      
      await queryInterface.sequelize.query(
        'DROP TABLE IF EXISTS gauntlet_ladders CASCADE;',
        { transaction }
      );
      
      // Recreate old tables (for rollback purposes)
      await queryInterface.createTable('ladders', {
        ladder_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.literal('gen_random_uuid()')
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
      
      await queryInterface.createTable('ladder_positions', {
        position_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.literal('gen_random_uuid()')
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
          type: Sequelize.TEXT,
          allowNull: true
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
      
      await transaction.commit();
      console.log('✅ Rollback completed');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};

