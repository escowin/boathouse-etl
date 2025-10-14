'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('team_memberships', {
      membership_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      team_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id',
        },
        onDelete: 'CASCADE',
      },
      athlete_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id',
        },
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('Athlete', 'Captain', 'Secretary', 'Coach', 'Assistant Coach'),
        defaultValue: 'Athlete',
      },
      start_date: {
        type: Sequelize.DATEONLY,
        defaultValue: Sequelize.NOW,
      },
      end_date: {
        type: Sequelize.DATEONLY,
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
    await queryInterface.addIndex('team_memberships', ['team_id']);
    await queryInterface.addIndex('team_memberships', ['athlete_id']);
    await queryInterface.addIndex('team_memberships', ['active']);
    await queryInterface.addIndex('team_memberships', ['role']);
    
    // Add unique constraint for one active membership per athlete per team
    await queryInterface.addIndex('team_memberships', ['team_id', 'athlete_id', 'active'], {
      unique: true,
      where: {
        active: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('team_memberships');
  }
};
