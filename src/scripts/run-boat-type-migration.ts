import { getModels } from '../shared';
import { QueryTypes } from 'sequelize';

// Get shared models
const { sequelize } = getModels();

async function runBoatTypeMigration() {
  try {
    console.log('🚀 Starting boat type enum migration...');
    
    // Check current boat data before migration
    console.log('\n📊 Current boat data:');
    const currentBoats = await sequelize.query(`
      SELECT boat_id, name, type, created_at 
      FROM boats 
      ORDER BY type, name
    `, { type: QueryTypes.SELECT });
    
    console.table(currentBoats);
    
    // Run the migration directly
    console.log('\n🔄 Running migration...');
    
    try {
      // Import and run the migration directly
      const migration = require('../migrations/20250115000002-update-boat-type-enum.js');
      await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
      console.log('✅ Migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
    
    // Check boat data after migration
    console.log('\n📊 Updated boat data:');
    const updatedBoats = await sequelize.query(`
      SELECT boat_id, name, type, created_at 
      FROM boats 
      ORDER BY type, name
    `, { type: QueryTypes.SELECT });
    
    console.table(updatedBoats);
    
    // Verify enum values
    console.log('\n🔍 Verifying enum values:');
    const enumValues = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_boats_type)) as enum_value
    `, { type: QueryTypes.SELECT });
    
    console.log('Available boat types:', enumValues.map((row: any) => row.enum_value));
    
    console.log('\n✅ Boat type migration completed successfully!');
    console.log('📝 Updated values:');
    console.log('  - Single → 1x');
    console.log('  - Double → 2x');
    console.log('  - Pair → 2-');
    console.log('  - Quad → 4x');
    console.log('  - Four → 4+');
    console.log('  - Eight → 8+');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
runBoatTypeMigration();
