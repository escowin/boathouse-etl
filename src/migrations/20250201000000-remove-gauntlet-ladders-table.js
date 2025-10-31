'use strict';

/**
 * Migration: Remove gauntlet_ladders table and update gauntlet_positions
 * 
 * This migration:
 * 1. Drops the gauntlet_ladders table (no longer needed)
 * 2. Updates gauntlet_positions to use gauntlet_id instead of ladder_id
 *    - Adds gauntlet_id column
 *    - Migrates data from ladder_id (via gauntlet_ladders join) to gauntlet_id
 *    - Drops ladder_id column and related indexes
 *    - Creates new indexes on gauntlet_id
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔄 Starting migration: Remove gauntlet_ladders table...');

      // Step 1: Add gauntlet_id column to gauntlet_positions (temporarily nullable)
      console.log('📝 Step 1: Adding gauntlet_id column to gauntlet_positions...');
      await queryInterface.addColumn(
        'gauntlet_positions',
        'gauntlet_id',
        {
          type: Sequelize.UUID,
          allowNull: true, // Temporarily nullable while we migrate data
          references: {
            model: 'gauntlets',
            key: 'gauntlet_id'
          },
          onDelete: 'CASCADE'
        },
        { transaction }
      );

      // Step 2: Migrate data - populate gauntlet_id from gauntlet_ladders
      console.log('📊 Step 2: Migrating ladder_id references to gauntlet_id...');
      await queryInterface.sequelize.query(`
        UPDATE gauntlet_positions gp
        SET gauntlet_id = gl.gauntlet_id
        FROM gauntlet_ladders gl
        WHERE gp.ladder_id = gl.ladder_id
      `, { transaction });

      // Step 3: Make gauntlet_id NOT NULL after data migration
      console.log('🔒 Step 3: Making gauntlet_id NOT NULL...');
      await queryInterface.changeColumn(
        'gauntlet_positions',
        'gauntlet_id',
        {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'gauntlets',
            key: 'gauntlet_id'
          },
          onDelete: 'CASCADE'
        },
        { transaction }
      );

      // Step 4: Drop old indexes on ladder_id
      console.log('🗑️  Step 4: Dropping old indexes...');
      
      // Drop unique constraint on (ladder_id, gauntlet_lineup_id)
      try {
        await queryInterface.removeIndex(
          'gauntlet_positions',
          'idx_gauntlet_positions_unique',
          { transaction }
        );
      } catch (error) {
        // Index might have different name
        console.warn('Could not drop idx_gauntlet_positions_unique, trying alternatives...');
      }

      // Drop index on ladder_id
      try {
        await queryInterface.removeIndex(
          'gauntlet_positions',
          'idx_ladder_positions_ladder_id',
          { transaction }
        );
      } catch (error) {
        // Try alternative name
        try {
          await queryInterface.removeIndex(
            'gauntlet_positions',
            'idx_gauntlet_positions_ladder_id',
            { transaction }
          );
        } catch (err) {
          console.warn('Could not drop ladder_id index:', err.message);
        }
      }

      // Step 5: Create new indexes on gauntlet_id
      console.log('✨ Step 5: Creating new indexes...');
      
      // Index on gauntlet_id
      await queryInterface.addIndex(
        'gauntlet_positions',
        ['gauntlet_id'],
        {
          name: 'idx_gauntlet_positions_gauntlet_id',
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

      // Step 6: Drop foreign key constraint on ladder_id
      console.log('🔓 Step 6: Dropping foreign key constraint on ladder_id...');
      try {
        await queryInterface.removeConstraint(
          'gauntlet_positions',
          'gauntlet_positions_ladder_id_fkey',
          { transaction }
        );
      } catch (error) {
        // Constraint name might be different
        console.warn('Could not drop foreign key constraint:', error.message);
      }

      // Step 7: Drop ladder_id column
      console.log('🗑️  Step 7: Dropping ladder_id column...');
      await queryInterface.removeColumn('gauntlet_positions', 'ladder_id', { transaction });

      // Step 8: Drop gauntlet_ladders table
      console.log('🗑️  Step 8: Dropping gauntlet_ladders table...');
      await queryInterface.dropTable('gauntlet_ladders', { transaction });

      // Step 9: Drop index on gauntlet_ladders if it exists
      try {
        await queryInterface.removeIndex('gauntlet_ladders', 'idx_gauntlet_ladders_gauntlet_id', { transaction });
      } catch (error) {
        // Table already dropped, index is gone
      }

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
      console.log('🔄 Rolling back migration: Restore gauntlet_ladders table...');

      // Step 1: Recreate gauntlet_ladders table
      console.log('📝 Step 1: Recreating gauntlet_ladders table...');
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

      // Create index on gauntlet_id
      await queryInterface.addIndex(
        'gauntlet_ladders',
        ['gauntlet_id'],
        {
          name: 'idx_gauntlet_ladders_gauntlet_id',
          transaction
        }
      );

      // Step 2: Recreate ladder_id column in gauntlet_positions (temporarily nullable)
      console.log('📝 Step 2: Recreating ladder_id column...');
      await queryInterface.addColumn(
        'gauntlet_positions',
        'ladder_id',
        {
          type: Sequelize.UUID,
          allowNull: true, // Temporarily nullable
          references: {
            model: 'gauntlet_ladders',
            key: 'ladder_id'
          },
          onDelete: 'CASCADE'
        },
        { transaction }
      );

      // Step 3: Create ladders for each unique gauntlet_id and populate ladder_id
      console.log('📊 Step 3: Creating ladders and populating ladder_id...');
      await queryInterface.sequelize.query(`
        -- Create a ladder for each unique gauntlet_id
        INSERT INTO gauntlet_ladders (ladder_id, gauntlet_id, created_at, updated_at)
        SELECT DISTINCT ON (gauntlet_id)
          gen_random_uuid() as ladder_id,
          gp.gauntlet_id,
          CURRENT_TIMESTAMP as created_at,
          CURRENT_TIMESTAMP as updated_at
        FROM gauntlet_positions gp
        WHERE NOT EXISTS (
          SELECT 1 FROM gauntlet_ladders gl WHERE gl.gauntlet_id = gp.gauntlet_id
        );

        -- Update gauntlet_positions with ladder_id
        UPDATE gauntlet_positions gp
        SET ladder_id = gl.ladder_id
        FROM gauntlet_ladders gl
        WHERE gp.gauntlet_id = gl.gauntlet_id;
      `, { transaction });

      // Step 4: Make ladder_id NOT NULL
      await queryInterface.changeColumn(
        'gauntlet_positions',
        'ladder_id',
        {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'gauntlet_ladders',
            key: 'ladder_id'
          },
          onDelete: 'CASCADE'
        },
        { transaction }
      );

      // Step 5: Drop new indexes
      console.log('🗑️  Step 5: Dropping new indexes...');
      try {
        await queryInterface.removeIndex('gauntlet_positions', 'idx_gauntlet_positions_gauntlet_id', { transaction });
        await queryInterface.removeIndex('gauntlet_positions', 'idx_gauntlet_positions_unique', { transaction });
      } catch (error) {
        console.warn('Could not drop new indexes:', error.message);
      }

      // Step 6: Recreate old indexes
      console.log('✨ Step 6: Recreating old indexes...');
      await queryInterface.addIndex(
        'gauntlet_positions',
        ['ladder_id'],
        {
          name: 'idx_ladder_positions_ladder_id',
          transaction
        }
      );

      await queryInterface.addIndex(
        'gauntlet_positions',
        ['ladder_id', 'gauntlet_lineup_id'],
        {
          name: 'idx_ladder_positions_unique',
          unique: true,
          transaction
        }
      );

      // Step 7: Drop gauntlet_id column
      console.log('🗑️  Step 7: Dropping gauntlet_id column...');
      await queryInterface.removeColumn('gauntlet_positions', 'gauntlet_id', { transaction });

      await transaction.commit();
      console.log('✅ Rollback completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};

