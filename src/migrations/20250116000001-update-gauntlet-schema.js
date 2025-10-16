'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Updating gauntlet schema...');
    
    // Add match_id column to gauntlet_lineups table
    console.log('📋 Adding match_id to gauntlet_lineups...');
    await queryInterface.addColumn('gauntlet_lineups', 'match_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'gauntlet_matches',
        key: 'match_id'
      },
      onDelete: 'SET NULL'
    });

    // Add index for match_id
    await queryInterface.addIndex('gauntlet_lineups', ['match_id'], {
      name: 'idx_gauntlet_lineups_match_id'
    });

    // Remove configuration column from gauntlets table (replaced by settings in ladders)
    console.log('📋 Removing configuration column from gauntlets...');
    await queryInterface.removeColumn('gauntlets', 'configuration');

    // Add settings column to gauntlets table for minimal configuration
    console.log('📋 Adding settings column to gauntlets...');
    await queryInterface.addColumn('gauntlets', 'settings', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: '{}'
    });

    // Update ladder_positions table to add missing columns
    console.log('📋 Updating ladder_positions table...');
    await queryInterface.addColumn('ladder_positions', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    });

    await queryInterface.addColumn('ladder_positions', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    });

    // Update ladder_progressions table to add missing columns
    console.log('📋 Updating ladder_progressions table...');
    await queryInterface.addColumn('ladder_progressions', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    });

    await queryInterface.addColumn('ladder_progressions', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    });

    // Add missing foreign key constraints
    console.log('📋 Adding missing foreign key constraints...');
    
    // Add CASCADE delete to gauntlet_matches
    await queryInterface.changeColumn('gauntlet_matches', 'gauntlet_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'gauntlets',
        key: 'gauntlet_id'
      },
      onDelete: 'CASCADE'
    });

    // Add CASCADE delete to ladder_positions
    await queryInterface.changeColumn('ladder_positions', 'ladder_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'ladders',
        key: 'ladder_id'
      },
      onDelete: 'CASCADE'
    });

    await queryInterface.changeColumn('ladder_positions', 'athlete_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'athletes',
        key: 'athlete_id'
      },
      onDelete: 'CASCADE'
    });

    // Add CASCADE delete to ladder_progressions
    await queryInterface.changeColumn('ladder_progressions', 'ladder_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'ladders',
        key: 'ladder_id'
      },
      onDelete: 'CASCADE'
    });

    await queryInterface.changeColumn('ladder_progressions', 'athlete_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'athletes',
        key: 'athlete_id'
      },
      onDelete: 'CASCADE'
    });

    // Add missing unique constraints
    console.log('📋 Adding missing unique constraints...');
    
    // Ensure only one athlete per seat per lineup
    await queryInterface.addConstraint('gauntlet_seat_assignments', {
      fields: ['gauntlet_lineup_id', 'seat_number'],
      type: 'unique',
      name: 'unique_gauntlet_seat_per_lineup'
    });

    // Ensure only one position per athlete per ladder
    await queryInterface.addConstraint('ladder_positions', {
      fields: ['ladder_id', 'athlete_id'],
      type: 'unique',
      name: 'unique_athlete_per_ladder'
    });

    console.log('✅ Gauntlet schema updated successfully!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back gauntlet schema changes...');
    
    // Remove unique constraints
    await queryInterface.removeConstraint('ladder_positions', 'unique_athlete_per_ladder');
    await queryInterface.removeConstraint('gauntlet_seat_assignments', 'unique_gauntlet_seat_per_lineup');
    
    // Remove match_id column and index
    await queryInterface.removeIndex('gauntlet_lineups', 'idx_gauntlet_lineups_match_id');
    await queryInterface.removeColumn('gauntlet_lineups', 'match_id');
    
    // Remove settings column and restore configuration
    await queryInterface.removeColumn('gauntlets', 'settings');
    await queryInterface.addColumn('gauntlets', 'configuration', {
      type: Sequelize.JSONB,
      allowNull: true
    });
    
    // Remove added timestamp columns
    await queryInterface.removeColumn('ladder_positions', 'updated_at');
    await queryInterface.removeColumn('ladder_positions', 'created_at');
    await queryInterface.removeColumn('ladder_progressions', 'updated_at');
    await queryInterface.removeColumn('ladder_progressions', 'created_at');
    
    console.log('✅ Gauntlet schema rollback completed!');
  }
};
