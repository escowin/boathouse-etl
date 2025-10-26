import { getModels } from '../shared';
import { QueryTypes } from 'sequelize';

// Get shared models
const { sequelize } = getModels();

async function rollbackBoatTypeMigration() {
  try {
    console.log('🔄 Starting boat type enum rollback...');
    
    // Check current boat data before rollback
    console.log('\n📊 Current boat data:');
    const currentBoats = await sequelize.query(`
      SELECT boat_id, name, type, created_at 
      FROM boats 
      ORDER BY type, name
    `, { type: QueryTypes.SELECT });
    
    console.table(currentBoats);
    
    // Run the rollback directly
    console.log('\n🔄 Running rollback...');
    
    try {
      // Import and run the migration rollback directly
      const migration = require('../migrations/20250115000002-update-boat-type-enum.js');
      await migration.down(sequelize.getQueryInterface(), sequelize.constructor);
      console.log('✅ Rollback completed successfully!');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
    
    // Check boat data after rollback
    console.log('\n📊 Rolled back boat data:');
    const rolledBackBoats = await sequelize.query(`
      SELECT boat_id, name, type, created_at 
      FROM boats 
      ORDER BY type, name
    `, { type: QueryTypes.SELECT });
    
    console.table(rolledBackBoats);
    
    // Verify enum values
    console.log('\n🔍 Verifying enum values:');
    const enumValues = await sequelize.query(`
      SELECT unnest(enum_range(NULL::boat_type_enum)) as enum_value
    `, { type: QueryTypes.SELECT });
    
    console.log('Available boat types:', enumValues.map((row: any) => row.enum_value));
    
    console.log('\n✅ Boat type rollback completed successfully!');
    console.log('📝 Reverted values:');
    console.log('  - 1x → Single');
    console.log('  - 2x → Double');
    console.log('  - 2- → Pair');
    console.log('  - 4x → Quad');
    console.log('  - 4+ → Four');
    console.log('  - 8+ → Eight');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the rollback
rollbackBoatTypeMigration();
