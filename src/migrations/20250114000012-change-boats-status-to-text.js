'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change boats.status from ENUM to TEXT to accommodate boat names/descriptions
    await queryInterface.changeColumn('boats', 'status', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: 'Available'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to ENUM (this might fail if there are invalid values)
    await queryInterface.changeColumn('boats', 'status', {
      type: Sequelize.ENUM('Available', 'Reserved', 'In Use', 'Maintenance', 'Retired'),
      defaultValue: 'Available'
    });
  }
};
