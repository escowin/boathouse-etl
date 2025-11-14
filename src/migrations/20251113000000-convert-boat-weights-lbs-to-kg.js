'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Starting boat weight conversion from lbs to kg...');
      
      // Conversion factor: 1 pound = 0.45359237 kilograms
      const LBS_TO_KG = 0.45359237;
      
      // Get all boats with weight values (including nulls for reporting)
      const allBoats = await queryInterface.sequelize.query(
        `SELECT boat_id, name, min_weight_kg, max_weight_kg 
         FROM boats 
         ORDER BY name`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      
      const boatsWithWeights = allBoats.filter(boat => 
        boat.min_weight_kg !== null && boat.min_weight_kg !== undefined ||
        boat.max_weight_kg !== null && boat.max_weight_kg !== undefined
      );
      
      const boatsWithNulls = allBoats.filter(boat => 
        (boat.min_weight_kg === null || boat.min_weight_kg === undefined) &&
        (boat.max_weight_kg === null || boat.max_weight_kg === undefined)
      );
      
      console.log(`📊 Found ${boatsWithWeights.length} boats with weight values to convert`);
      if (boatsWithNulls.length > 0) {
        console.log(`ℹ️  Found ${boatsWithNulls.length} boats with null weight values (will be skipped)`);
      }
      
      if (boatsWithWeights.length === 0) {
        console.log('✅ No boats found with weight values. Migration complete.');
        await transaction.commit();
        return;
      }
      
      // Show sample data before conversion
      if (boatsWithWeights.length > 0) {
        console.log('\n📋 Sample data before conversion (first 5):');
        boatsWithWeights.slice(0, 5).forEach(boat => {
          const minWeight = boat.min_weight_kg != null ? `${boat.min_weight_kg} lbs` : 'null';
          const maxWeight = boat.max_weight_kg != null ? `${boat.max_weight_kg} lbs` : 'null';
          console.log(`  ${boat.name}: min=${minWeight}, max=${maxWeight}`);
        });
      }
      
      // Update each boat's weight values
      // Note: Schema uses DECIMAL(5, 2) - max value is 999.99 with 2 decimal places
      const MAX_DECIMAL_VALUE = 999.99;
      let updatedCount = 0;
      let warningCount = 0;
      const warnings = [];
      
      for (const boat of boatsWithWeights) {
        const updates = {};
        const boatWarnings = [];
        
        // Convert min_weight_kg from lbs to kg
        // Round to 2 decimal places to match DECIMAL(5, 2) schema
        if (boat.min_weight_kg !== null && boat.min_weight_kg !== undefined) {
          const convertedValue = parseFloat((boat.min_weight_kg * LBS_TO_KG).toFixed(2));
          
          // Validate against schema constraint (max 999.99)
          if (convertedValue > MAX_DECIMAL_VALUE) {
            boatWarnings.push(`min_weight_kg exceeds max (${convertedValue} > ${MAX_DECIMAL_VALUE})`);
            warnings.push(`${boat.name}: ${boatWarnings.join(', ')}`);
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
            boatWarnings.push(`max_weight_kg exceeds max (${convertedValue} > ${MAX_DECIMAL_VALUE})`);
            warnings.push(`${boat.name}: ${boatWarnings.join(', ')}`);
            warningCount++;
          } else {
            updates.max_weight_kg = convertedValue;
          }
        }
        
        // Only update if we have values to update
        if (Object.keys(updates).length > 0) {
          // Build dynamic UPDATE query based on what needs to be updated
          const updateFields = [];
          const replacements = { boatId: boat.boat_id };
          
          if (updates.min_weight_kg !== undefined) {
            updateFields.push('min_weight_kg = :minWeight');
            replacements.minWeight = updates.min_weight_kg;
          } else {
            updateFields.push('min_weight_kg = :minWeight');
            replacements.minWeight = boat.min_weight_kg;
          }
          
          if (updates.max_weight_kg !== undefined) {
            updateFields.push('max_weight_kg = :maxWeight');
            replacements.maxWeight = updates.max_weight_kg;
          } else {
            updateFields.push('max_weight_kg = :maxWeight');
            replacements.maxWeight = boat.max_weight_kg;
          }
          
          await queryInterface.sequelize.query(
            `UPDATE boats 
             SET ${updateFields.join(', ')}
             WHERE boat_id = :boatId`,
            {
              replacements,
              transaction
            }
          );
          updatedCount++;
        }
      }
      
      if (warningCount > 0) {
        console.warn(`\n⚠️  ${warningCount} boats had values that exceeded the DECIMAL(5, 2) maximum:`);
        warnings.forEach(warning => console.warn(`  - ${warning}`));
        console.warn('\n⚠️  Please review these boats manually.');
      }
      
      // Verify the conversion
      const convertedBoats = await queryInterface.sequelize.query(
        `SELECT boat_id, name, min_weight_kg, max_weight_kg 
         FROM boats 
         WHERE min_weight_kg IS NOT NULL OR max_weight_kg IS NOT NULL
         ORDER BY name
         LIMIT 10`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      
      console.log(`\n✅ Converted ${updatedCount} boats`);
      console.log('\n📋 Sample data after conversion (first 10):');
      convertedBoats.forEach(boat => {
        const minWeight = boat.min_weight_kg != null ? `${parseFloat(boat.min_weight_kg).toFixed(2)} kg` : 'null';
        const maxWeight = boat.max_weight_kg != null ? `${parseFloat(boat.max_weight_kg).toFixed(2)} kg` : 'null';
        console.log(`  ${boat.name}: min=${minWeight}, max=${maxWeight}`);
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
      const warnings = [];
      
      for (const boat of boatsWithWeights) {
        const updates = {};
        const boatWarnings = [];
        
        // Convert min_weight_kg from kg back to lbs
        // Round to 2 decimal places to match DECIMAL(5, 2) schema
        if (boat.min_weight_kg !== null && boat.min_weight_kg !== undefined) {
          const convertedValue = parseFloat((boat.min_weight_kg * KG_TO_LBS).toFixed(2));
          
          // Validate against schema constraint (max 999.99)
          if (convertedValue > MAX_DECIMAL_VALUE) {
            boatWarnings.push(`min_weight_kg exceeds max (${convertedValue} > ${MAX_DECIMAL_VALUE})`);
            warnings.push(`${boat.name}: ${boatWarnings.join(', ')}`);
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
            boatWarnings.push(`max_weight_kg exceeds max (${convertedValue} > ${MAX_DECIMAL_VALUE})`);
            warnings.push(`${boat.name}: ${boatWarnings.join(', ')}`);
            warningCount++;
          } else {
            updates.max_weight_kg = convertedValue;
          }
        }
        
        // Only update if we have values to update
        if (Object.keys(updates).length > 0) {
          // Build dynamic UPDATE query based on what needs to be updated
          const updateFields = [];
          const replacements = { boatId: boat.boat_id };
          
          if (updates.min_weight_kg !== undefined) {
            updateFields.push('min_weight_kg = :minWeight');
            replacements.minWeight = updates.min_weight_kg;
          } else {
            updateFields.push('min_weight_kg = :minWeight');
            replacements.minWeight = boat.min_weight_kg;
          }
          
          if (updates.max_weight_kg !== undefined) {
            updateFields.push('max_weight_kg = :maxWeight');
            replacements.maxWeight = updates.max_weight_kg;
          } else {
            updateFields.push('max_weight_kg = :maxWeight');
            replacements.maxWeight = boat.max_weight_kg;
          }
          
          await queryInterface.sequelize.query(
            `UPDATE boats 
             SET ${updateFields.join(', ')}
             WHERE boat_id = :boatId`,
            {
              replacements,
              transaction
            }
          );
          updatedCount++;
        }
      }
      
      if (warningCount > 0) {
        console.warn(`\n⚠️  ${warningCount} boats had values that exceeded the DECIMAL(5, 2) maximum:`);
        warnings.forEach(warning => console.warn(`  - ${warning}`));
        console.warn('\n⚠️  Please review these boats manually.');
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

