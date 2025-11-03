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
      console.log('🚀 Starting Race UUID migration...');
      
      // Step 1: Add UUID column
      console.log('📝 Adding race_uuid column...');
      await queryInterface.addColumn('races', 'race_uuid', {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: Sequelize.UUIDV4
      }, { transaction });

      // Step 2: Generate UUIDs for existing records (if any)
      console.log('🔄 Generating UUIDs for existing records...');
      const raceCount = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM races WHERE race_uuid IS NULL;
      `, { type: Sequelize.QueryTypes.SELECT, transaction });
      
      if (raceCount[0].count > 0) {
        console.log(`Generating UUIDs for ${raceCount[0].count} race records...`);
        await queryInterface.sequelize.query(`
          UPDATE races SET race_uuid = gen_random_uuid() WHERE race_uuid IS NULL;
        `, { transaction });
      } else {
        console.log('No race records to migrate (table is empty).');
      }

      // Step 3: Make UUID column NOT NULL
      console.log('🔒 Making race_uuid column NOT NULL...');
      await queryInterface.changeColumn('races', 'race_uuid', {
        type: Sequelize.UUID,
        allowNull: false
      }, { transaction });

      // Step 4: Drop old primary key constraint
      console.log('🗑️ Dropping old primary key constraint...');
      try {
        await queryInterface.sequelize.query('ALTER TABLE races DROP CONSTRAINT races_pkey CASCADE', { transaction });
      } catch (error) {
        console.log(`⚠️ Could not drop races_pkey: ${error.message}`);
      }

      // Step 5: Set UUID column as primary key
      console.log('🔑 Setting race_uuid as primary key...');
      await queryInterface.addConstraint('races', {
        fields: ['race_uuid'],
        type: 'primary key',
        name: 'races_pkey'
      }, { transaction });

      // Step 6: Rename columns
      console.log('🏷️ Renaming columns...');
      await queryInterface.renameColumn('races', 'race_id', 'race_id_old', { transaction });
      await queryInterface.renameColumn('races', 'race_uuid', 'race_id', { transaction });

      // Step 7: Update lineup_id to UUID (if there are any records)
      if (raceCount[0].count > 0) {
        console.log('🔗 Updating lineup_id references to UUIDs...');
        await queryInterface.sequelize.query(`
          UPDATE races 
          SET lineup_id = l.lineup_id
          FROM lineups l
          WHERE races.lineup_id_old = l.lineup_id_old;
        `, { transaction });
      }

      await transaction.commit();
      
      console.log('✅ Race UUID migration completed successfully!');
      console.log('⚠️ Old integer race_id column preserved as race_id_old for rollback safety');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Race migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Rolling back Race UUID migration...');
      
      // Step 1: Rename columns back
      await queryInterface.renameColumn('races', 'race_id', 'race_uuid', { transaction });
      await queryInterface.renameColumn('races', 'race_id_old', 'race_id', { transaction });
      
      // Step 2: Drop UUID primary key constraint
      try {
        await queryInterface.removeConstraint('races', 'races_pkey', { transaction });
      } catch (error) {
        console.log(`⚠️ Could not drop primary key constraint: ${error.message}`);
      }
      
      // Step 3: Recreate original primary key constraint
      await queryInterface.addConstraint('races', {
        fields: ['race_id'],
        type: 'primary key',
        name: 'races_pkey'
      }, { transaction });
      
      // Step 4: Remove UUID column
      await queryInterface.removeColumn('races', 'race_uuid', { transaction });
      
      await transaction.commit();
      console.log('✅ Race rollback completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Race rollback failed:', error);
      throw error;
    }
  }
};
