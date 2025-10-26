import { getModels } from '../shared';

// Get shared models
const { sequelize } = getModels();

async function runGauntletLadderMigration() {
  try {
    console.log('🚀 Starting Gauntlet and Ladder tables migration...');
    
    // Import and run the migration directly
    const migration = require('../migrations/20250115000003-create-gauntlet-ladder-tables.js');
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    
    console.log('✅ Gauntlet and Ladder tables migration completed successfully!');
    console.log('📝 Created tables:');
    console.log('  - gauntlets');
    console.log('  - gauntlet_lineups (with boat_id and team_id)');
    console.log('  - gauntlet_matches');
    console.log('  - gauntlet_seat_assignments');
    console.log('  - ladders');
    console.log('  - ladder_positions');
    console.log('  - ladder_progressions');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
runGauntletLadderMigration();
