'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Step 1: Create new enum type with standardized values
      console.log('Creating new enum_boats_type_new...');
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_boats_type_new AS ENUM ('1x', '2x', '2-', '4x', '4+', '8+')
      `, { transaction });

      // Step 2: Update the column to use the new enum with data conversion
      console.log('Updating boats.type column to use new enum with data conversion...');
      await queryInterface.sequelize.query(`
        ALTER TABLE boats 
        ALTER COLUMN type TYPE enum_boats_type_new 
        USING CASE 
          WHEN type = 'Single' THEN '1x'::enum_boats_type_new
          WHEN type = 'Double' THEN '2x'::enum_boats_type_new
          WHEN type = 'Pair' THEN '2-'::enum_boats_type_new
          WHEN type = 'Quad' THEN '4x'::enum_boats_type_new
          WHEN type = 'Four' THEN '4+'::enum_boats_type_new
          WHEN type = 'Eight' THEN '8+'::enum_boats_type_new
          ELSE type::text::enum_boats_type_new
        END
      `, { transaction });

      // Step 3: Drop the old enum type
      console.log('Dropping old enum_boats_type...');
      await queryInterface.sequelize.query(`
        DROP TYPE enum_boats_type
      `, { transaction });

      // Step 4: Rename the new enum to the original name
      console.log('Renaming new enum to enum_boats_type...');
      await queryInterface.sequelize.query(`
        ALTER TYPE enum_boats_type_new RENAME TO enum_boats_type
      `, { transaction });

      await transaction.commit();
      console.log('Boat type enum migration completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error during boat type enum migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Step 1: Create old enum type
      console.log('Creating old enum_boats_type_old...');
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_boats_type_old AS ENUM ('Single', 'Double', 'Pair', 'Quad', 'Four', 'Eight')
      `, { transaction });

      // Step 2: Update the column to use the old enum with data conversion
      console.log('Updating boats.type column to use old enum with data conversion...');
      await queryInterface.sequelize.query(`
        ALTER TABLE boats 
        ALTER COLUMN type TYPE enum_boats_type_old 
        USING CASE 
          WHEN type = '1x' THEN 'Single'::enum_boats_type_old
          WHEN type = '2x' THEN 'Double'::enum_boats_type_old
          WHEN type = '2-' THEN 'Pair'::enum_boats_type_old
          WHEN type = '4x' THEN 'Quad'::enum_boats_type_old
          WHEN type = '4+' THEN 'Four'::enum_boats_type_old
          WHEN type = '8+' THEN 'Eight'::enum_boats_type_old
          ELSE type::text::enum_boats_type_old
        END
      `, { transaction });

      // Step 3: Drop the new enum type
      console.log('Dropping new enum_boats_type...');
      await queryInterface.sequelize.query(`
        DROP TYPE enum_boats_type
      `, { transaction });

      // Step 4: Rename the old enum back to the original name
      console.log('Renaming old enum to enum_boats_type...');
      await queryInterface.sequelize.query(`
        ALTER TYPE enum_boats_type_old RENAME TO enum_boats_type
      `, { transaction });

      await transaction.commit();
      console.log('Boat type enum rollback completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error during boat type enum rollback:', error);
      throw error;
    }
  }
};
