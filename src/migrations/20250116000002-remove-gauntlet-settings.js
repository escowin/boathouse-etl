'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Removing settings column from gauntlets table...');
    
    // Remove settings column from gauntlets table
    await queryInterface.removeColumn('gauntlets', 'settings');
    
    console.log('✅ Settings column removed from gauntlets table!');
    console.log('📝 Gauntlets table now contains only essential fields:');
    console.log('  - gauntlet_id (UUID, PK)');
    console.log('  - name (TEXT)');
    console.log('  - description (TEXT, optional)');
    console.log('  - boat_type (ENUM)');
    console.log('  - created_by (UUID, FK to athletes)');
    console.log('  - status (ENUM)');
    console.log('  - created_at, updated_at (TIMESTAMPS)');
    console.log('');
    console.log('🎯 Configuration is now handled by relational tables:');
    console.log('  - gauntlet_lineups (boat assignments)');
    console.log('  - gauntlet_seat_assignments (athlete positions)');
    console.log('  - gauntlet_matches (match results)');
    console.log('  - ladders.settings (scoring rules only)');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Restoring settings column to gauntlets table...');
    
    // Add settings column back to gauntlets table
    await queryInterface.addColumn('gauntlets', 'settings', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: '{}'
    });
    
    console.log('✅ Settings column restored to gauntlets table!');
  }
};
