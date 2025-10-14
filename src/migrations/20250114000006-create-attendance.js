'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendance', {
      attendance_id: {
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
      athlete_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id',
        },
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('Yes', 'No', 'Maybe', 'Late', 'Excused'),
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      team_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id',
        },
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
    await queryInterface.addIndex('attendance', ['session_id']);
    await queryInterface.addIndex('attendance', ['athlete_id']);
    await queryInterface.addIndex('attendance', ['team_id']);
    await queryInterface.addIndex('attendance', ['status']);
    
    // Add unique constraint for one record per athlete per session
    await queryInterface.addIndex('attendance', ['session_id', 'athlete_id'], {
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('attendance');
  }
};
