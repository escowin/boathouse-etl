'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Starting boat weight conversion from lbs to kg...');
      
      // Conversion factor: 1 pound = 0.45359237 kilograms
      const LBS_TO_KG = 0.45359237;
      
      // Get all boats with weight values
      const boatsWithWeights = await queryInterface.sequelize.query(
        `SELECT boat_id, name, min_weight_kg, max_weight_kg 
         FROM boats 
         WHERE min_weight_kg IS NOT NULL OR max_weight_kg IS NOT NULL`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      
      console.log(`📊 Found ${boatsWithWeights.length} boats with weight values to convert`);
      
      if (boatsWithWeights.length === 0) {
        console.log('✅ No boats found with weight values. Migration complete.');
        await transaction.commit();
        return;
      }
      
      // Show sample data before conversion
      if (boatsWithWeights.length > 0) {
        console.log('\n📋 Sample data before conversion (first 5):');
        boatsWithWeights.slice(0, 5).forEach(boat => {
          console.log(`  ${boat.name}: min=${boat.min_weight_kg} lbs, max=${boat.max_weight_kg} lbs`);
        });
      }
      
      // Update each boat's weight values
      // Note: Schema uses DECIMAL(5, 2) - max value is 999.99 with 2 decimal places
      const MAX_DECIMAL_VALUE = 999.99;
      let updatedCount = 0;
      let warningCount = 0;
      
      for (const boat of boatsWithWeights) {
        const updates = {};
        const warnings = [];
        
        // Convert min_weight_kg from lbs to kg
        // Round to 2 decimal places to match DECIMAL(5, 2) schema
        if (boat.min_weight_kg !== null && boat.min_weight_kg !== undefined) {
          const convertedValue = parseFloat((boat.min_weight_kg * LBS_TO_KG).toFixed(2));
          
          // Validate against schema constraint (max 999.99)
          if (convertedValue > MAX_DECIMAL_VALUE) {
            warnings.push(`min_weight_kg exceeds max (${convertedValue} > ${MAX_DECIMAL_VALUE})`);
            console.warn(`⚠️  ${boat.name}: ${warnings.join(', ')}`);
            warningCount++;
          } else {
            updates.min_weight_kg = convertedValue;
          }
        }
        
        // Convert max_weight_kg from lbs to kg
        // Round to 2 decimal places to match DECIMAL(5, 2) schema
        if (boat.max_weight_kg !== null && boat.max_weight_kg !== undefined) {
          const convertedValue = parseFloat((boat.max_weight_kg * LBS_TO_KG).toFixed(2));
          
          // Validate against schema constraint (max 999.99)
          if (convertedValue > MAX_DECIMAL_VALUE) {
            warnings.push(`max_weight_kg exceeds max (${convertedValue} > ${MAX_DECIMAL_VALUE})`);
            console.warn(`⚠️  ${boat.name}: ${warnings.join(', ')}`);
            warningCount++;
          } else {
            updates.max_weight_kg = convertedValue;
          }
        }
        
        // Only update if we have values to update and no validation errors
        if (Object.keys(updates).length > 0) {
          await queryInterface.sequelize.query(
            `UPDATE boats 
             SET min_weight_kg = :minWeight, max_weight_kg = :maxWeight 
             WHERE boat_id = :boatId`,
            {
              replacements: {
                minWeight: updates.min_weight_kg !== undefined ? updates.min_weight_kg : boat.min_weight_kg,
                maxWeight: updates.max_weight_kg !== undefined ? updates.max_weight_kg : boat.max_weight_kg,
                boatId: boat.boat_id
              },
              transaction
            }
          );
          updatedCount++;
        }
      }
      
      if (warningCount > 0) {
        console.warn(`\n⚠️  ${warningCount} boats had values that exceeded the DECIMAL(5, 2) maximum. Please review.`);
      }
      
      // Verify the conversion
      const convertedBoats = await queryInterface.sequelize.query(
        `SELECT boat_id, name, min_weight_kg, max_weight_kg 
         FROM boats 
         WHERE min_weight_kg IS NOT NULL OR max_weight_kg IS NOT NULL
         ORDER BY name
         LIMIT 5`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      
      console.log(`\n✅ Converted ${updatedCount} boats`);
      console.log('\n📋 Sample data after conversion (first 5):');
      convertedBoats.forEach(boat => {
        const minWeight = boat.min_weight_kg != null ? parseFloat(boat.min_weight_kg).toFixed(2) : 'null';
        const maxWeight = boat.max_weight_kg != null ? parseFloat(boat.max_weight_kg).toFixed(2) : 'null';
        console.log(`  ${boat.name}: min=${minWeight} kg, max=${maxWeight} kg`);
      });
      
      await transaction.commit();
      console.log('\n✅ Boat weight conversion completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Rolling back boat weight conversion (converting from kg back to lbs)...');
      
      // Conversion factor: 1 kilogram = 2.20462262 pounds
      const KG_TO_LBS = 2.20462262;
      
      // Get all boats with weight values
      const boatsWithWeights = await queryInterface.sequelize.query(
        `SELECT boat_id, name, min_weight_kg, max_weight_kg 
         FROM boats 
         WHERE min_weight_kg IS NOT NULL OR max_weight_kg IS NOT NULL`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      
      console.log(`📊 Found ${boatsWithWeights.length} boats with weight values to rollback`);
      
      if (boatsWithWeights.length === 0) {
        console.log('✅ No boats found with weight values. Rollback complete.');
        await transaction.commit();
        return;
      }
      
      // Update each boat's weight values back to lbs
      // Note: Schema uses DECIMAL(5, 2) - max value is 999.99 with 2 decimal places
      const MAX_DECIMAL_VALUE = 999.99;
      let updatedCount = 0;
      let warningCount = 0;
      
      for (const boat of boatsWithWeights) {
        const updates = {};
        const warnings = [];
        
        // Convert min_weight_kg from kg back to lbs
        // Round to 2 decimal places to match DECIMAL(5, 2) schema
        if (boat.min_weight_kg !== null && boat.min_weight_kg !== undefined) {
          const convertedValue = parseFloat((boat.min_weight_kg * KG_TO_LBS).toFixed(2));
          
          // Validate against schema constraint (max 999.99)
          if (convertedValue > MAX_DECIMAL_VALUE) {
            warnings.push(`min_weight_kg exceeds max (${convertedValue} > ${MAX_DECIMAL_VALUE})`);
            console.warn(`⚠️  ${boat.name}: ${warnings.join(', ')}`);
            warningCount++;
          } else {
            updates.min_weight_kg = convertedValue;
          }
        }
        
        // Convert max_weight_kg from kg back to lbs
        // Round to 2 decimal places to match DECIMAL(5, 2) schema
        if (boat.max_weight_kg !== null && boat.max_weight_kg !== undefined) {
          const convertedValue = parseFloat((boat.max_weight_kg * KG_TO_LBS).toFixed(2));
          
          // Validate against schema constraint (max 999.99)
          if (convertedValue > MAX_DECIMAL_VALUE) {
            warnings.push(`max_weight_kg exceeds max (${convertedValue} > ${MAX_DECIMAL_VALUE})`);
            console.warn(`⚠️  ${boat.name}: ${warnings.join(', ')}`);
            warningCount++;
          } else {
            updates.max_weight_kg = convertedValue;
          }
        }
        
        // Only update if we have values to update and no validation errors
        if (Object.keys(updates).length > 0) {
          await queryInterface.sequelize.query(
            `UPDATE boats 
             SET min_weight_kg = :minWeight, max_weight_kg = :maxWeight 
             WHERE boat_id = :boatId`,
            {
              replacements: {
                minWeight: updates.min_weight_kg !== undefined ? updates.min_weight_kg : boat.min_weight_kg,
                maxWeight: updates.max_weight_kg !== undefined ? updates.max_weight_kg : boat.max_weight_kg,
                boatId: boat.boat_id
              },
              transaction
            }
          );
          updatedCount++;
        }
      }
      
      if (warningCount > 0) {
        console.warn(`\n⚠️  ${warningCount} boats had values that exceeded the DECIMAL(5, 2) maximum. Please review.`);
      }
      
      console.log(`✅ Rolled back ${updatedCount} boats`);
      
      await transaction.commit();
      console.log('✅ Rollback completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
