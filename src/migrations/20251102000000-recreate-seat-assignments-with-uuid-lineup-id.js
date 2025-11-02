'use strict';

/**
 * Migration: Recreate seat_assignments table with UUID lineup_id
 * 
 * This migration:
 * 1. Drops the existing seat_assignments table (destructive - only safe if table is empty)
 * 2. Recreates the table with correct schema:
 *    - seat_assignment_id: UUID (primary key)
 *    - lineup_id: UUID (references lineups.lineup_id) - FIXED from INTEGER to UUID
 *    - athlete_id: UUID (references athletes.athlete_id)
 *    - seat_number: INTEGER
 *    - side: TEXT ENUM ('Port', 'Starboard')
 *    - created_at, updated_at: TIMESTAMP
 * 3. Creates all required indexes and constraints
 * 
 * IMPORTANT: This migration is destructive and will delete all data in seat_assignments.
 * Only run this if the table is empty or if data loss is acceptable.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔄 Starting migration: Recreate seat_assignments with UUID lineup_id...');

      // Step 1: Verify table is empty (safety check)
      console.log('🔍 Step 1: Verifying table is empty...');
      const recordCount = await queryInterface.sequelize.query(
        'SELECT COUNT(*) as count FROM seat_assignments',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (recordCount[0].count > 0) {
        throw new Error(
          `⚠️ WARNING: seat_assignments table contains ${recordCount[0].count} records. ` +
          'This migration will delete all data. Aborting for safety. ' +
          'If you need to preserve data, use a different migration strategy.'
        );
      }

      console.log('✅ Table is empty, safe to proceed');

      // Step 2: Drop existing table and all its constraints/indexes
      console.log('🗑️  Step 2: Dropping seat_assignments table...');
      await queryInterface.dropTable('seat_assignments', { 
        cascade: true, 
        transaction 
      });

      // Step 3: Recreate table with correct schema (lineup_id as UUID)
      console.log('✨ Step 3: Creating seat_assignments table with UUID lineup_id...');
      await queryInterface.createTable('seat_assignments', {
        seat_assignment_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.literal('gen_random_uuid()')
        },
        lineup_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'lineups',
            key: 'lineup_id'
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
          allowNull: true,
          // Note: PostgreSQL CHECK constraint will be added separately
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

      // Step 4: Add CHECK constraint for side enum
      console.log('📋 Step 4: Adding CHECK constraint for side field...');
      await queryInterface.sequelize.query(
        `ALTER TABLE seat_assignments 
         ADD CONSTRAINT seat_assignments_side_check 
         CHECK (side IN ('Port', 'Starboard'))`,
        { transaction }
      );

      // Step 5: Create indexes
      console.log('📊 Step 5: Creating indexes...');
      
      // Index on lineup_id
      await queryInterface.addIndex(
        'seat_assignments',
        ['lineup_id'],
        {
          name: 'idx_seat_assignments_lineup_id',
          transaction
        }
      );

      // Index on athlete_id
      await queryInterface.addIndex(
        'seat_assignments',
        ['athlete_id'],
        {
          name: 'idx_seat_assignments_athlete_id',
          transaction
        }
      );

      // Step 6: Create unique constraint on (lineup_id, seat_number)
      console.log('🔑 Step 6: Creating unique constraint on (lineup_id, seat_number)...');
      await queryInterface.addIndex(
        'seat_assignments',
        ['lineup_id', 'seat_number'],
        {
          name: 'seat_assignments_lineup_id_seat_number_unique',
          unique: true,
          transaction
        }
      );

      await transaction.commit();
      console.log('✅ Migration completed successfully!');
      console.log('✅ seat_assignments table recreated with UUID lineup_id');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔄 Rolling back migration: Restore seat_assignments with INTEGER lineup_id...');

      // Step 1: Drop the new table
      console.log('🗑️  Step 1: Dropping seat_assignments table...');
      await queryInterface.dropTable('seat_assignments', { 
        cascade: true, 
        transaction 
      });

      // Step 2: Recreate with old schema (INTEGER lineup_id)
      console.log('📝 Step 2: Recreating seat_assignments with INTEGER lineup_id...');
      await queryInterface.createTable('seat_assignments', {
        seat_assignment_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.literal('gen_random_uuid()')
        },
        lineup_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'lineups',
            key: 'lineup_id'
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

      // Step 3: Add CHECK constraint for side enum
      await queryInterface.sequelize.query(
        `ALTER TABLE seat_assignments 
         ADD CONSTRAINT seat_assignments_side_check 
         CHECK (side IN ('Port', 'Starboard'))`,
        { transaction }
      );

      // Step 4: Recreate indexes
      console.log('📊 Step 3: Creating indexes...');
      
      await queryInterface.addIndex(
        'seat_assignments',
        ['lineup_id'],
        {
          name: 'idx_seat_assignments_lineup_id',
          transaction
        }
      );

      await queryInterface.addIndex(
        'seat_assignments',
        ['athlete_id'],
        {
          name: 'idx_seat_assignments_athlete_id',
          transaction
        }
      );

      await queryInterface.addIndex(
        'seat_assignments',
        ['lineup_id', 'seat_number'],
        {
          name: 'seat_assignments_lineup_id_seat_number_unique',
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
