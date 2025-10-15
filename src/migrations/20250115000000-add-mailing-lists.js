'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Starting migration: Add mailing_lists table and update teams table...');

    // Step 1: Create mailing_lists table
    console.log('📧 Creating mailing_lists table...');
    await queryInterface.createTable('mailing_lists', {
      mailing_list_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Step 2: Add indexes to mailing_lists table
    console.log('📊 Adding indexes to mailing_lists table...');
    await queryInterface.addIndex('mailing_lists', ['email'], {
      unique: true,
      name: 'mailing_lists_email_unique'
    });

    await queryInterface.addIndex('mailing_lists', ['name'], {
      name: 'mailing_lists_name_idx'
    });

    await queryInterface.addIndex('mailing_lists', ['active'], {
      name: 'mailing_lists_active_idx'
    });

    // Step 3: Add mailing_list_id column to teams table
    console.log('🔗 Adding mailing_list_id column to teams table...');
    await queryInterface.addColumn('teams', 'mailing_list_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'mailing_lists',
        key: 'mailing_list_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Step 4: Add index to teams.mailing_list_id
    console.log('📊 Adding index to teams.mailing_list_id...');
    await queryInterface.addIndex('teams', ['mailing_list_id'], {
      name: 'teams_mailing_list_id_idx'
    });

    // Step 5: Note about seeding mailing lists
    console.log('📝 Note: Mailing lists table created successfully!');
    console.log('   You can now manually add your actual mailing lists using:');
    console.log('   INSERT INTO mailing_lists (name, email, description) VALUES');
    console.log('   (\'Your Team Name\', \'your-actual-email@domain.com\', \'Description\');');

    console.log('✅ Migration completed successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Rolling back migration: Remove mailing_lists table and mailing_list_id column...');

    // Step 1: Remove index from teams.mailing_list_id
    console.log('📊 Removing index from teams.mailing_list_id...');
    await queryInterface.removeIndex('teams', 'teams_mailing_list_id_idx');

    // Step 2: Remove mailing_list_id column from teams table
    console.log('🔗 Removing mailing_list_id column from teams table...');
    await queryInterface.removeColumn('teams', 'mailing_list_id');

    // Step 3: Remove indexes from mailing_lists table
    console.log('📊 Removing indexes from mailing_lists table...');
    await queryInterface.removeIndex('mailing_lists', 'mailing_lists_email_unique');
    await queryInterface.removeIndex('mailing_lists', 'mailing_lists_name_idx');
    await queryInterface.removeIndex('mailing_lists', 'mailing_lists_active_idx');

    // Step 4: Drop mailing_lists table
    console.log('📧 Dropping mailing_lists table...');
    await queryInterface.dropTable('mailing_lists');

    console.log('✅ Rollback completed successfully!');
  }
};
