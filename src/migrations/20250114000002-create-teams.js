'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('teams', {
      team_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      team_type: {
        type: Sequelize.ENUM('Masters', 'Juniors', 'Seniors', 'Recreational', 'Competitive'),
        allowNull: false,
      },
      age_range_min: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      age_range_max: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      gender_focus: {
        type: Sequelize.ENUM('M', 'F', 'Mixed'),
        allowNull: true,
      },
      skill_level: {
        type: Sequelize.ENUM('Beginner', 'Intermediate', 'Advanced', 'Elite'),
        allowNull: true,
      },
      head_coach_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'athletes',
          key: 'athlete_id',
        },
      },
      assistant_coaches: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        allowNull: true,
        defaultValue: [],
      },
      team_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex('teams', ['name'], { unique: true });
    await queryInterface.addIndex('teams', ['team_type']);
    await queryInterface.addIndex('teams', ['active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('teams');
  }
};
