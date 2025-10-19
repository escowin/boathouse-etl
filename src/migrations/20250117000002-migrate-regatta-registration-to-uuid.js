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
      console.log('🚀 Starting RegattaRegistration UUID migration...');
      
      // Step 1: Add UUID column
      console.log('📝 Adding registration_uuid column...');
      await queryInterface.addColumn('regatta_registrations', 'registration_uuid', {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: Sequelize.UUIDV4
      }, { transaction });

      // Step 2: Generate UUIDs for existing records (if any)
      console.log('🔄 Generating UUIDs for existing records...');
      const registrationCount = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM regatta_registrations WHERE registration_uuid IS NULL;
      `, { type: Sequelize.QueryTypes.SELECT, transaction });
      
      if (registrationCount[0].count > 0) {
        console.log(`Generating UUIDs for ${registrationCount[0].count} registration records...`);
        await queryInterface.sequelize.query(`
          UPDATE regatta_registrations SET registration_uuid = gen_random_uuid() WHERE registration_uuid IS NULL;
        `, { transaction });
      } else {
        console.log('No registration records to migrate (table is empty).');
      }

      // Step 3: Make UUID column NOT NULL
      console.log('🔒 Making registration_uuid column NOT NULL...');
      await queryInterface.changeColumn('regatta_registrations', 'registration_uuid', {
        type: Sequelize.UUID,
        allowNull: false
      }, { transaction });

      // Step 4: Drop old primary key constraint
      console.log('🗑️ Dropping old primary key constraint...');
      try {
        await queryInterface.sequelize.query('ALTER TABLE regatta_registrations DROP CONSTRAINT regatta_registrations_pkey CASCADE', { transaction });
      } catch (error) {
        console.log(`⚠️ Could not drop regatta_registrations_pkey: ${error.message}`);
      }

      // Step 5: Set UUID column as primary key
      console.log('🔑 Setting registration_uuid as primary key...');
      await queryInterface.addConstraint('regatta_registrations', {
        fields: ['registration_uuid'],
        type: 'primary key',
        name: 'regatta_registrations_pkey'
      }, { transaction });

      // Step 6: Rename columns
      console.log('🏷️ Renaming columns...');
      await queryInterface.renameColumn('regatta_registrations', 'registration_id', 'registration_id_old', { transaction });
      await queryInterface.renameColumn('regatta_registrations', 'registration_uuid', 'registration_id', { transaction });

      await transaction.commit();
      
      console.log('✅ RegattaRegistration UUID migration completed successfully!');
      console.log('⚠️ Old integer registration_id column preserved as registration_id_old for rollback safety');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ RegattaRegistration migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Rolling back RegattaRegistration UUID migration...');
      
      // Step 1: Rename columns back
      await queryInterface.renameColumn('regatta_registrations', 'registration_id', 'registration_uuid', { transaction });
      await queryInterface.renameColumn('regatta_registrations', 'registration_id_old', 'registration_id', { transaction });
      
      // Step 2: Drop UUID primary key constraint
      try {
        await queryInterface.removeConstraint('regatta_registrations', 'regatta_registrations_pkey', { transaction });
      } catch (error) {
        console.log(`⚠️ Could not drop primary key constraint: ${error.message}`);
      }
      
      // Step 3: Recreate original primary key constraint
      await queryInterface.addConstraint('regatta_registrations', {
        fields: ['registration_id'],
        type: 'primary key',
        name: 'regatta_registrations_pkey'
      }, { transaction });
      
      // Step 4: Remove UUID column
      await queryInterface.removeColumn('regatta_registrations', 'registration_uuid', { transaction });
      
      await transaction.commit();
      console.log('✅ RegattaRegistration rollback completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ RegattaRegistration rollback failed:', error);
      throw error;
    }
  }
};
