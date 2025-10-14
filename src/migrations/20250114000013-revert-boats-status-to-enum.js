'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, update all existing status values to 'Available' to ensure they're valid ENUM values
    await queryInterface.sequelize.query(`
      UPDATE boats 
      SET status = 'Available' 
      WHERE status IS NOT NULL;
    `);
    
    // Remove the default value first
    await queryInterface.changeColumn('boats', 'status', {
      type: Sequelize.TEXT,
      defaultValue: null
    });
    
    // Now change to ENUM without default
    await queryInterface.changeColumn('boats', 'status', {
      type: Sequelize.ENUM('Available', 'Reserved', 'In Use', 'Maintenance', 'Retired'),
      allowNull: false
    });
    
    // Finally, set the default value
    await queryInterface.changeColumn('boats', 'status', {
      type: Sequelize.ENUM('Available', 'Reserved', 'In Use', 'Maintenance', 'Retired'),
      defaultValue: 'Available',
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to TEXT (this might fail if there are invalid values)
    await queryInterface.changeColumn('boats', 'status', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: 'Available'
    });
  }
};
