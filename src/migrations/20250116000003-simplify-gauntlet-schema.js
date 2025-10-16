'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Simplifying gauntlet schema by removing unnecessary fields...');
    
    // Remove unnecessary fields from gauntlet_lineups
    console.log('📋 Removing name and description from gauntlet_lineups...');
    await queryInterface.removeColumn('gauntlet_lineups', 'name');
    await queryInterface.removeColumn('gauntlet_lineups', 'description');
    await queryInterface.removeColumn('gauntlet_lineups', 'team_id');
    
    // Remove unnecessary fields from ladders
    console.log('📋 Removing name, settings, and type from ladders...');
    await queryInterface.removeColumn('ladders', 'name');
    await queryInterface.removeColumn('ladders', 'settings');
    await queryInterface.removeColumn('ladders', 'type'); // Redundant with gauntlets.boat_type
    
    // Add gauntlet_id to ladders to tie them to specific gauntlets
    console.log('📋 Adding gauntlet_id to ladders...');
    await queryInterface.addColumn('ladders', 'gauntlet_id', {
      type: Sequelize.UUID,
      allowNull: true, // Allow null for now, can be populated later
      references: {
        model: 'gauntlets',
        key: 'gauntlet_id'
      },
      onDelete: 'CASCADE'
    });
    
    // Add index for gauntlet_id in ladders
    await queryInterface.addIndex('ladders', ['gauntlet_id'], {
      name: 'idx_ladders_gauntlet_id'
    });
    
    // Remove created_by from ladders since they're now tied to gauntlets
    console.log('📋 Removing created_by from ladders (now tied to gauntlet creator)...');
    await queryInterface.removeColumn('ladders', 'created_by');
    
    console.log('✅ Gauntlet schema simplified successfully!');
    console.log('');
    console.log('📝 Simplified schema:');
    console.log('  gauntlets: id, name, boat_type, created_by, status, timestamps');
    console.log('  gauntlet_lineups: id, gauntlet_id, match_id, boat_id, timestamps');
    console.log('  gauntlet_seat_assignments: id, lineup_id, athlete_id, seat_number, side, timestamps');
    console.log('  gauntlet_matches: id, gauntlet_id, workout, sets, wins, losses, date, timestamps');
    console.log('  ladders: id, gauntlet_id, timestamps (tied to gauntlet)');
    console.log('  ladder_positions: id, ladder_id, athlete_id, position, wins, losses, streaks, timestamps');
    console.log('  ladder_progressions: id, ladder_id, athlete_id, from_position, to_position, match_id, timestamps');
    console.log('');
    console.log('🎯 Removed unnecessary complexity:');
    console.log('  ❌ gauntlet_lineups.name (implicit: user vs opponent)');
    console.log('  ❌ gauntlet_lineups.description (not needed)');
    console.log('  ❌ gauntlet_lineups.team_id (not needed for gauntlets)');
    console.log('  ❌ ladders.name (tied to gauntlet)');
    console.log('  ❌ ladders.settings (hardcode scoring rules)');
    console.log('  ❌ ladders.type (redundant with gauntlets.boat_type)');
    console.log('  ❌ ladders.created_by (redundant with gauntlets.created_by)');
    console.log('  ✅ Added ladders.gauntlet_id (explicit 1:1 relationship)');
    console.log('');
    console.log('🔄 Simplified relationships:');
    console.log('  User -> hasMany -> Gauntlets');
    console.log('  Gauntlet -> hasOne -> Ladder (auto-created)');
    console.log('  Gauntlet -> hasMany -> GauntletMatches');
    console.log('  Ladder -> hasMany -> LadderPositions');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Restoring complex gauntlet schema...');
    
    // Remove gauntlet_id from ladders
    await queryInterface.removeIndex('ladders', 'idx_ladders_gauntlet_id');
    await queryInterface.removeColumn('ladders', 'gauntlet_id');
    
    // Restore fields to ladders
    await queryInterface.addColumn('ladders', 'name', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: 'Ladder'
    });
    await queryInterface.addColumn('ladders', 'settings', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: '{}'
    });
    await queryInterface.addColumn('ladders', 'type', {
      type: Sequelize.ENUM('1x', '2x', '2-', '4x', '4+', '8+'),
      allowNull: false,
      defaultValue: '1x'
    });
    await queryInterface.addColumn('ladders', 'created_by', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'athletes',
        key: 'athlete_id'
      }
    });
    
    // Restore fields to gauntlet_lineups
    await queryInterface.addColumn('gauntlet_lineups', 'team_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'teams',
        key: 'team_id'
      }
    });
    await queryInterface.addColumn('gauntlet_lineups', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('gauntlet_lineups', 'name', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: 'Lineup'
    });
    
    console.log('✅ Complex gauntlet schema restored!');
  }
};
