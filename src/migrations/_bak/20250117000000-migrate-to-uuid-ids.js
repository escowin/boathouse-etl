'use strict';

const crypto = require('crypto');

// Generate a UUID v4
function generateUUID() {
  return crypto.randomUUID();
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Starting UUID migration for concurrent user models...');
      
      // Step 1: Add UUID columns to main tables
      console.log('📝 Adding UUID columns to main tables...');
      
      // Add attendance_uuid column
      await queryInterface.addColumn('attendance', 'attendance_uuid', {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: Sequelize.UUIDV4
      }, { transaction });
      
      // Add lineup_uuid column
      await queryInterface.addColumn('lineups', 'lineup_uuid', {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: Sequelize.UUIDV4
      }, { transaction });
      
      // Add seat_assignment_uuid column
      await queryInterface.addColumn('seat_assignments', 'seat_assignment_uuid', {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: Sequelize.UUIDV4
      }, { transaction });

      // Step 2: Generate UUIDs for existing records
      console.log('🔄 Generating UUIDs for existing records...');
      
      // Generate UUIDs for attendance records
      const attendanceRecords = await queryInterface.sequelize.query(
        'SELECT attendance_id FROM attendance ORDER BY attendance_id',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      
      console.log(`📊 Found ${attendanceRecords.length} attendance records to migrate`);
      for (const record of attendanceRecords) {
        const uuid = generateUUID();
        await queryInterface.sequelize.query(
          'UPDATE attendance SET attendance_uuid = :uuid WHERE attendance_id = :id',
          {
            replacements: { uuid, id: record.attendance_id },
            transaction
          }
        );
      }
      
      // Generate UUIDs for lineup records
      const lineupRecords = await queryInterface.sequelize.query(
        'SELECT lineup_id FROM lineups ORDER BY lineup_id',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      
      console.log(`📊 Found ${lineupRecords.length} lineup records to migrate`);
      for (const record of lineupRecords) {
        const uuid = generateUUID();
        await queryInterface.sequelize.query(
          'UPDATE lineups SET lineup_uuid = :uuid WHERE lineup_id = :id',
          {
            replacements: { uuid, id: record.lineup_id },
            transaction
          }
        );
      }
      
      // Generate UUIDs for seat assignment records
      const seatAssignmentRecords = await queryInterface.sequelize.query(
        'SELECT seat_assignment_id FROM seat_assignments ORDER BY seat_assignment_id',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      
      console.log(`📊 Found ${seatAssignmentRecords.length} seat assignment records to migrate`);
      for (const record of seatAssignmentRecords) {
        const uuid = generateUUID();
        await queryInterface.sequelize.query(
          'UPDATE seat_assignments SET seat_assignment_uuid = :uuid WHERE seat_assignment_id = :id',
          {
            replacements: { uuid, id: record.seat_assignment_id },
            transaction
          }
        );
      }

      // Step 3: Make UUID columns NOT NULL
      console.log('🔒 Making UUID columns NOT NULL...');
      
      await queryInterface.changeColumn('attendance', 'attendance_uuid', {
        type: Sequelize.UUID,
        allowNull: false
      }, { transaction });
      
      await queryInterface.changeColumn('lineups', 'lineup_uuid', {
        type: Sequelize.UUID,
        allowNull: false
      }, { transaction });
      
      await queryInterface.changeColumn('seat_assignments', 'seat_assignment_uuid', {
        type: Sequelize.UUID,
        allowNull: false
      }, { transaction });

      // Step 4: Drop old primary key constraints
      console.log('🗑️ Dropping old primary key constraints...');
      
      try {
        await queryInterface.sequelize.query('ALTER TABLE attendance DROP CONSTRAINT attendance_pkey CASCADE', { transaction });
      } catch (error) {
        console.log(`⚠️ Could not drop attendance_pkey: ${error.message}`);
      }
      
      try {
        await queryInterface.sequelize.query('ALTER TABLE lineups DROP CONSTRAINT lineups_pkey CASCADE', { transaction });
      } catch (error) {
        console.log(`⚠️ Could not drop lineups_pkey: ${error.message}`);
      }
      
      try {
        await queryInterface.sequelize.query('ALTER TABLE seat_assignments DROP CONSTRAINT seat_assignments_pkey CASCADE', { transaction });
      } catch (error) {
        console.log(`⚠️ Could not drop seat_assignments_pkey: ${error.message}`);
      }

      // Step 5: Set UUID columns as primary keys
      console.log('🔑 Setting UUID columns as primary keys...');
      
      await queryInterface.addConstraint('attendance', {
        fields: ['attendance_uuid'],
        type: 'primary key',
        name: 'attendance_pkey'
      }, { transaction });
      
      await queryInterface.addConstraint('lineups', {
        fields: ['lineup_uuid'],
        type: 'primary key',
        name: 'lineups_pkey'
      }, { transaction });
      
      await queryInterface.addConstraint('seat_assignments', {
        fields: ['seat_assignment_uuid'],
        type: 'primary key',
        name: 'seat_assignments_pkey'
      }, { transaction });

      // Step 6: Rename columns to match new model structure
      console.log('🏷️ Renaming columns to match new model structure...');
      
      await queryInterface.renameColumn('attendance', 'attendance_id', 'attendance_id_old', { transaction });
      await queryInterface.renameColumn('attendance', 'attendance_uuid', 'attendance_id', { transaction });
      
      await queryInterface.renameColumn('lineups', 'lineup_id', 'lineup_id_old', { transaction });
      await queryInterface.renameColumn('lineups', 'lineup_uuid', 'lineup_id', { transaction });
      
      await queryInterface.renameColumn('seat_assignments', 'seat_assignment_id', 'seat_assignment_id_old', { transaction });
      await queryInterface.renameColumn('seat_assignments', 'seat_assignment_uuid', 'seat_assignment_id', { transaction });

      // Step 7: Update foreign key references
      console.log('🔗 Updating foreign key references...');
      
      // Update seat_assignments.lineup_id to reference the new UUID
      await queryInterface.sequelize.query(`
        UPDATE seat_assignments 
        SET lineup_id = l.lineup_id
        FROM lineups l
        WHERE seat_assignments.lineup_id_old = l.lineup_id_old
      `, { transaction });

      // Step 8: Add foreign key constraints
      console.log('🔗 Adding foreign key constraints...');
      
      // Add foreign key constraint for seat_assignments.lineup_id
      try {
        await queryInterface.addConstraint('seat_assignments', {
          fields: ['lineup_id'],
          type: 'foreign key',
          name: 'seat_assignments_lineup_id_fkey',
          references: {
            table: 'lineups',
            field: 'lineup_id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        }, { transaction });
      } catch (error) {
        console.log(`⚠️ Could not add foreign key constraint for seat_assignments.lineup_id: ${error.message}`);
      }

      await transaction.commit();
      
      console.log('✅ UUID migration completed successfully!');
      console.log('⚠️ Old integer ID columns preserved as *_id_old for rollback safety');
      console.log('💡 You can drop these columns after verifying the migration:');
      console.log('   - attendance.attendance_id_old');
      console.log('   - lineups.lineup_id_old');
      console.log('   - seat_assignments.seat_assignment_id_old');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Rolling back UUID migration...');
      
      // Step 1: Drop foreign key constraints
      try {
        await queryInterface.removeConstraint('seat_assignments', 'seat_assignments_lineup_id_fkey', { transaction });
      } catch (error) {
        console.log(`⚠️ Could not drop foreign key constraint: ${error.message}`);
      }
      
      // Step 2: Rename columns back
      await queryInterface.renameColumn('attendance', 'attendance_id', 'attendance_uuid', { transaction });
      await queryInterface.renameColumn('attendance', 'attendance_id_old', 'attendance_id', { transaction });
      
      await queryInterface.renameColumn('lineups', 'lineup_id', 'lineup_uuid', { transaction });
      await queryInterface.renameColumn('lineups', 'lineup_id_old', 'lineup_id', { transaction });
      
      await queryInterface.renameColumn('seat_assignments', 'seat_assignment_id', 'seat_assignment_uuid', { transaction });
      await queryInterface.renameColumn('seat_assignments', 'seat_assignment_id_old', 'seat_assignment_id', { transaction });
      
      // Step 3: Drop UUID primary key constraints
      try {
        await queryInterface.removeConstraint('attendance', 'attendance_pkey', { transaction });
        await queryInterface.removeConstraint('lineups', 'lineups_pkey', { transaction });
        await queryInterface.removeConstraint('seat_assignments', 'seat_assignments_pkey', { transaction });
      } catch (error) {
        console.log(`⚠️ Could not drop primary key constraints: ${error.message}`);
      }
      
      // Step 4: Recreate original primary key constraints
      await queryInterface.addConstraint('attendance', {
        fields: ['attendance_id'],
        type: 'primary key',
        name: 'attendance_pkey'
      }, { transaction });
      
      await queryInterface.addConstraint('lineups', {
        fields: ['lineup_id'],
        type: 'primary key',
        name: 'lineups_pkey'
      }, { transaction });
      
      await queryInterface.addConstraint('seat_assignments', {
        fields: ['seat_assignment_id'],
        type: 'primary key',
        name: 'seat_assignments_pkey'
      }, { transaction });
      
      // Step 5: Remove UUID columns
      await queryInterface.removeColumn('attendance', 'attendance_uuid', { transaction });
      await queryInterface.removeColumn('lineups', 'lineup_uuid', { transaction });
      await queryInterface.removeColumn('seat_assignments', 'seat_assignment_uuid', { transaction });
      
      await transaction.commit();
      console.log('✅ Rollback completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
