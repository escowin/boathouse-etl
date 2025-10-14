'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change team_type column from ENUM to TEXT
    await queryInterface.changeColumn('teams', 'team_type', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to ENUM (this might fail if there are values not in the enum)
    await queryInterface.changeColumn('teams', 'team_type', {
      type: Sequelize.ENUM('Masters', 'Juniors', 'Seniors', 'Recreational', 'Competitive'),
      allowNull: false,
    });
  }
};
