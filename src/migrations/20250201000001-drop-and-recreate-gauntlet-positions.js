'use strict';

/**
 * Migration: Drop gauntlet_ladders table and recreate gauntlet_positions with gauntlet_id
 * 
 * This migration:
 * 1. Drops the gauntlet_ladders table (no longer needed)
 * 2. Drops and recreates gauntlet_positions table with gauntlet_id instead of ladder_id
 *    - New table structure matches GauntletPosition model
 *    - Uses gauntlet_id to reference gauntlets directly
 *    - Includes all required indexes
 * 
 * Note: This is a destructive migration that will drop existing data.
 * Only run this if there is no production data to preserve.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔄 Starting migration: Drop gauntlet_ladders and recreate gauntlet_positions...');

      // Step 1: Drop gauntlet_positions table (and all its constraints/indexes)
      console.log('🗑️  Step 1: Dropping gauntlet_positions table...');
      await queryInterface.dropTable('gauntlet_positions', { 
        cascade: true, 
        transaction 
      });

      // Step 2: Drop gauntlet_ladders table
      console.log('🗑️  Step 2: Dropping gauntlet_ladders table...');
      await queryInterface.dropTable('gauntlet_ladders', { 
        cascade: true, 
        transaction 
      });

      // Step 3: Recreate gauntlet_positions with updated schema
      console.log('✨ Step 3: Creating gauntlet_positions table with gauntlet_id...');
      await queryInterface.createTable('gauntlet_positions', {
        position_id: {
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

      // Step 4: Create indexes
      console.log('📊 Step 4: Creating indexes...');
      
      // Index on gauntlet_id
      await queryInterface.addIndex(
        'gauntlet_positions',
        ['gauntlet_id'],
        {
          name: 'idx_gauntlet_positions_gauntlet_id',
          transaction
        }
      );

      // Index on gauntlet_lineup_id
      await queryInterface.addIndex(
        'gauntlet_positions',
        ['gauntlet_lineup_id'],
        {
          name: 'idx_gauntlet_positions_gauntlet_lineup_id',
          transaction
        }
      );

      // Index on position
      await queryInterface.addIndex(
        'gauntlet_positions',
        ['position'],
        {
          name: 'idx_gauntlet_positions_position',
          transaction
        }
      );

      // Unique constraint on (gauntlet_id, gauntlet_lineup_id)
      await queryInterface.addIndex(
        'gauntlet_positions',
        ['gauntlet_id', 'gauntlet_lineup_id'],
        {
          name: 'idx_gauntlet_positions_unique',
          unique: true,
          transaction
        }
      );

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
      console.log('🔄 Rolling back migration: Restore old schema...');

      // Step 1: Drop the new gauntlet_positions table
      console.log('🗑️  Step 1: Dropping gauntlet_positions table...');
      await queryInterface.dropTable('gauntlet_positions', { 
        cascade: true, 
        transaction 
      });

      // Step 2: Recreate gauntlet_ladders table
      console.log('📝 Step 2: Recreating gauntlet_ladders table...');
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

      // Create index on gauntlet_id for gauntlet_ladders
      await queryInterface.addIndex(
        'gauntlet_ladders',
        ['gauntlet_id'],
        {
          name: 'idx_gauntlet_ladders_gauntlet_id',
          transaction
        }
      );

      // Step 3: Recreate gauntlet_positions with old schema (ladder_id)
      console.log('📝 Step 3: Recreating gauntlet_positions with ladder_id...');
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

      // Step 4: Create indexes for old schema
      console.log('📊 Step 4: Creating indexes...');
      
      // Index on ladder_id
      await queryInterface.addIndex(
        'gauntlet_positions',
        ['ladder_id'],
        {
          name: 'idx_gauntlet_positions_ladder_id',
          transaction
        }
      );

      // Index on gauntlet_lineup_id
      await queryInterface.addIndex(
        'gauntlet_positions',
        ['gauntlet_lineup_id'],
        {
          name: 'idx_gauntlet_positions_gauntlet_lineup_id',
          transaction
        }
      );

      // Unique constraint on (ladder_id, gauntlet_lineup_id)
      await queryInterface.addIndex(
        'gauntlet_positions',
        ['ladder_id', 'gauntlet_lineup_id'],
        {
          name: 'idx_gauntlet_positions_unique',
          unique: true,
          transaction
        }
      );

      await transaction.commit();
      console.log('✅ Rollback completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};

