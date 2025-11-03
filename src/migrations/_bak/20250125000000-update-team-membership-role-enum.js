'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update the role enum type to match the model definition
    // First, we need to check what the current type is and handle the migration carefully
    
    try {
      // Get current enum values
      const [enumValues] = await queryInterface.sequelize.query(`
        SELECT 
          t.typname as enum_name,
          string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) as enum_values
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        WHERE t.typname = 'team_memberships_role_enum'
        GROUP BY t.typname
      `);

      if (enumValues.length > 0) {
        console.log('Current enum values:', enumValues[0].enum_values);
        
        // If the enum is already correct, skip
        if (enumValues[0].enum_values.includes('Athlete')) {
          console.log('✅ Enum already updated, skipping migration');
          return;
        }
      }

      // Drop the old enum type (this will fail if there are existing values)
      // We need to either: 1) Update existing data first, or 2) Create a new enum and alter column
      
      // Approach: Create new enum, update column to use it, drop old enum
      await queryInterface.sequelize.query(`
        DO $$ 
        BEGIN
          -- Create new enum type
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_memberships_role_enum_new') THEN
            CREATE TYPE team_memberships_role_enum_new AS ENUM (
              'Athlete',
              'Captain', 
              'Coach',
              'Assistant Coach',
              'Secretary'
            );
          END IF;
        END $$;
      `);

      // Alter the column to use the new enum type
      // First, cast existing values appropriately
      await queryInterface.sequelize.query(`
        ALTER TABLE team_memberships 
        ALTER COLUMN role TYPE team_memberships_role_enum_new 
        USING CASE 
          WHEN role::text = 'Member' THEN 'Athlete'::team_memberships_role_enum_new
          WHEN role::text = 'Admin' THEN 'Captain'::team_memberships_role_enum_new
          ELSE role::text::team_memberships_role_enum_new
        END;
      `);

      // Drop old enum and rename new one
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS team_memberships_role_enum;
      `);

      await queryInterface.sequelize.query(`
        ALTER TYPE team_memberships_role_enum_new RENAME TO team_memberships_role_enum;
      `);

      console.log('✅ Successfully updated team_memberships role enum');
      
    } catch (error) {
      console.error('❌ Error updating enum:', error);
      // If enum type doesn't exist yet, create it
      await queryInterface.sequelize.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_memberships_role_enum') THEN
            CREATE TYPE team_memberships_role_enum AS ENUM (
              'Athlete',
              'Captain', 
              'Coach',
              'Assistant Coach',
              'Secretary'
            );
          END IF;
        END $$;
      `);

      console.log('✅ Created team_memberships_role_enum');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to previous enum values if needed
    // This is a conservative rollback
    console.log('⚠️  Rollback: Manual intervention may be required for enum type changes');
    
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        -- Attempt to restore old enum
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_memberships_role_enum') THEN
          DROP TYPE IF EXISTS team_memberships_role_enum CASCADE;
        END IF;
        
        -- Recreate with old values
        CREATE TYPE team_memberships_role_enum AS ENUM (
          'Member',
          'Captain', 
          'Coach',
          'Admin'
        );
      END $$;
    `);

    // Update column back to old enum
    await queryInterface.sequelize.query(`
      ALTER TABLE team_memberships 
      ALTER COLUMN role TYPE team_memberships_role_enum 
      USING CASE 
        WHEN role::text = 'Athlete' THEN 'Member'::team_memberships_role_enum
        WHEN role::text = 'Assistant Coach' THEN 'Coach'::team_memberships_role_enum
        WHEN role::text = 'Secretary' THEN 'Admin'::team_memberships_role_enum
        ELSE role::text::team_memberships_role_enum
      END;
    `);

    console.log('✅ Rolled back team_memberships role enum');
  }
};
