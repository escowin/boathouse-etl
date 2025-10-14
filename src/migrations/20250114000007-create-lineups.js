'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('lineups', {
      lineup_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'practice_sessions',
          key: 'session_id',
        },
        onDelete: 'CASCADE',
      },
      boat_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'boats',
          key: 'boat_id',
        },
        onDelete: 'CASCADE',
      },
      team_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id',
        },
      },
      lineup_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lineup_type: {
        type: Sequelize.ENUM('Practice', 'Race', 'Test'),
        allowNull: false,
      },
      total_weight_kg: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
      },
      average_weight_kg: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      average_age: {
        type: Sequelize.DECIMAL(4, 1),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      etl_source: {
        type: Sequelize.TEXT,
        defaultValue: 'google_sheets',
      },
      etl_last_sync: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex('lineups', ['session_id']);
    await queryInterface.addIndex('lineups', ['boat_id']);
    await queryInterface.addIndex('lineups', ['team_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('lineups');
  }
};
