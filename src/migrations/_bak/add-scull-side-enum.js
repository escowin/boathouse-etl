'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add 'scull' to the existing ENUM for the side column
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_gauntlet_seat_assignments_side" 
      ADD VALUE 'scull';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type and updating all references
    // For now, we'll leave the 'scull' value in place as it doesn't break anything
    console.log('Warning: Cannot remove enum value "scull" from PostgreSQL enum type');
    console.log('The enum value will remain in the database but will not be used');
  }
};
