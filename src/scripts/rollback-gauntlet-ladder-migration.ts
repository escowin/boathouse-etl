import { getModels } from '../shared';

// Get shared models
const { sequelize } = getModels();

async function rollbackGauntletLadderMigration() {
  try {
    console.log('🔄 Starting Gauntlet and Ladder tables rollback...');
    
    // Import and run the rollback
    const migration = require('../migrations/20250115000003-create-gauntlet-ladder-tables.js');
    await migration.down(sequelize.getQueryInterface(), sequelize.constructor);
    
    console.log('✅ Gauntlet and Ladder tables rollback completed successfully!');
    console.log('📝 Dropped tables:');
    console.log('  - ladder_progressions');
    console.log('  - ladder_positions');
    console.log('  - ladders');
    console.log('  - gauntlet_seat_assignments');
    console.log('  - gauntlet_matches');
    console.log('  - gauntlet_lineups');
    console.log('  - gauntlets');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the rollback
rollbackGauntletLadderMigration();
