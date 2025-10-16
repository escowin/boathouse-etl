'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Fixing mailing list relationship to allow team deletion to cascade to mailing list...');
    
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Step 1: Add team_id column to mailing_lists table
      console.log('📋 Adding team_id column to mailing_lists table...');
      await queryInterface.addColumn('mailing_lists', 'team_id', {
        type: Sequelize.INTEGER,
        allowNull: true, // Allow null initially for data migration
        references: {
          model: 'teams',
          key: 'team_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // Step 2: Migrate existing data - copy team_id from teams to mailing_lists
      console.log('📋 Migrating existing team-mailing list relationships...');
      console.log('   Note: Only teams with mailing lists will be migrated');
      
      // First, let's see what teams have mailing lists
      const teamsWithMailingLists = await queryInterface.sequelize.query(`
        SELECT t.team_id, t.name as team_name, t.mailing_list_id, ml.name as mailing_list_name
        FROM teams t
        JOIN mailing_lists ml ON t.mailing_list_id = ml.mailing_list_id
      `, { transaction });
      
      console.log(`   📊 Found ${teamsWithMailingLists[0].length} team(s) with mailing lists:`);
      teamsWithMailingLists[0].forEach(row => {
        console.log(`     - Team "${row.team_name}" (ID: ${row.team_id}) → Mailing List "${row.mailing_list_name}" (ID: ${row.mailing_list_id})`);
      });
      
      // Check for teams without mailing lists
      const teamsWithoutMailingLists = await queryInterface.sequelize.query(`
        SELECT t.team_id, t.name as team_name
        FROM teams t
        WHERE t.mailing_list_id IS NULL
      `, { transaction });
      
      if (teamsWithoutMailingLists[0].length > 0) {
        console.log(`   ⚠️  Found ${teamsWithoutMailingLists[0].length} team(s) without mailing lists:`);
        teamsWithoutMailingLists[0].forEach(row => {
          console.log(`     - Team "${row.team_name}" (ID: ${row.team_id}) - No mailing list`);
        });
      }
      
      const migrationResult = await queryInterface.sequelize.query(`
        UPDATE mailing_lists 
        SET team_id = teams.team_id 
        FROM teams 
        WHERE teams.mailing_list_id = mailing_lists.mailing_list_id
      `, { transaction });
      
      console.log(`   ✅ Migrated ${migrationResult[1]} mailing list(s) to new relationship`);

      // Step 2.5: Validate the migration
      console.log('📋 Validating migration results...');
      const validationResult = await queryInterface.sequelize.query(`
        SELECT 
          ml.mailing_list_id,
          ml.team_id,
          t.team_id as original_team_id,
          t.name as team_name,
          ml.name as mailing_list_name
        FROM mailing_lists ml
        JOIN teams t ON ml.team_id = t.team_id
        WHERE ml.team_id IS NOT NULL
      `, { transaction });
      
      console.log('   📊 Migration validation results:');
      if (validationResult[0].length > 0) {
        validationResult[0].forEach(row => {
          console.log(`     - Mailing List "${row.mailing_list_name}" (ID: ${row.mailing_list_id}) → Team "${row.team_name}" (ID: ${row.team_id})`);
        });
      } else {
        console.log('     - No mailing lists were migrated (all teams lack mailing lists)');
      }

      // Step 3: Keep team_id nullable (some teams may not have mailing lists)
      console.log('📋 Keeping team_id nullable (teams without mailing lists are allowed)...');
      // No need to change the column - it's already nullable from Step 1

      // Step 4: Remove the old mailing_list_id column from teams table
      console.log('📋 Removing mailing_list_id column from teams table...');
      await queryInterface.removeColumn('teams', 'mailing_list_id', { transaction });

      // Step 5: Add index for the new relationship
      console.log('📋 Adding index for mailing_lists.team_id...');
      await queryInterface.addIndex('mailing_lists', ['team_id'], { 
        name: 'idx_mailing_lists_team_id', 
        transaction 
      });

      // Step 6: Remove the old index
      console.log('📋 Removing old index for teams.mailing_list_id...');
      await queryInterface.removeIndex('teams', 'idx_teams_mailing_list', { transaction });

      await transaction.commit();

      console.log('✅ Mailing list relationship fixed successfully!');
      console.log('');
      console.log('🔄 Relationship Change Summary:');
      console.log('  BEFORE: teams.mailing_list_id → mailing_lists.mailing_list_id');
      console.log('  AFTER:  mailing_lists.team_id → teams.team_id');
      console.log('');
      console.log('🗑️  New CASCADE Delete Chain:');
      console.log('  DELETE team → CASCADE deletes:');
      console.log('    ├── team_memberships');
      console.log('    ├── practice_sessions');
      console.log('    │   ├── attendance');
      console.log('    │   └── lineups');
      console.log('    │       └── seat_assignments');
      console.log('    ├── attendance (direct)');
      console.log('    ├── lineups (direct)');
      console.log('    ├── regatta_registrations');
      console.log('    └── mailing_lists ← NEW!');
      console.log('');
      console.log('🎯 Benefits:');
      console.log('  ✅ Deleting a team now removes its mailing list (if it has one)');
      console.log('  ✅ Teams without mailing lists are handled gracefully');
      console.log('  ✅ No orphaned mailing lists left behind');
      console.log('  ✅ Cleaner relationship model');
      console.log('  ✅ Consistent with other team-owned resources');

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Reverting mailing list relationship changes...');
    
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Step 1: Add mailing_list_id column back to teams table
      console.log('📋 Adding mailing_list_id column back to teams table...');
      await queryInterface.addColumn('teams', 'mailing_list_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'mailing_lists',
          key: 'mailing_list_id'
        }
      }, { transaction });

      // Step 2: Migrate data back - copy team_id from mailing_lists to teams
      console.log('📋 Migrating data back to original relationship...');
      console.log('   Note: Restoring teams.mailing_list_id = mailing_lists.mailing_list_id');
      
      const rollbackResult = await queryInterface.sequelize.query(`
        UPDATE teams 
        SET mailing_list_id = mailing_lists.mailing_list_id 
        FROM mailing_lists 
        WHERE mailing_lists.team_id = teams.team_id
      `, { transaction });
      
      console.log(`   ✅ Rolled back ${rollbackResult[1]} team(s) to original relationship`);

      // Step 3: Remove the new team_id column from mailing_lists
      console.log('📋 Removing team_id column from mailing_lists table...');
      await queryInterface.removeColumn('mailing_lists', 'team_id', { transaction });

      // Step 4: Add back the old index
      console.log('📋 Adding back old index for teams.mailing_list_id...');
      await queryInterface.addIndex('teams', ['mailing_list_id'], { 
        name: 'idx_teams_mailing_list', 
        transaction 
      });

      // Step 5: Remove the new index
      console.log('📋 Removing new index for mailing_lists.team_id...');
      await queryInterface.removeIndex('mailing_lists', 'idx_mailing_lists_team_id', { transaction });

      await transaction.commit();
      console.log('✅ Mailing list relationship reverted successfully!');
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
