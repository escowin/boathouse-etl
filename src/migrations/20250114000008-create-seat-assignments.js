'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('seat_assignments', {
      assignment_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      lineup_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'lineups',
          key: 'lineup_id',
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
      seat_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      is_coxswain: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
    await queryInterface.addIndex('seat_assignments', ['lineup_id']);
    await queryInterface.addIndex('seat_assignments', ['athlete_id']);
    
    // Add unique constraint for one athlete per seat per lineup
    await queryInterface.addIndex('seat_assignments', ['lineup_id', 'seat_number'], {
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('seat_assignments');
  }
};
