'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('etl_jobs', {
      job_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      job_type: {
        type: Sequelize.ENUM('full_etl', 'incremental_etl', 'athletes_sync', 'boats_sync', 'attendance_sync'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('running', 'completed', 'failed', 'cancelled'),
        allowNull: false,
      },
      started_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      duration_seconds: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      records_processed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      records_failed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      records_created: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      records_updated: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      error_details: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex('etl_jobs', ['status']);
    await queryInterface.addIndex('etl_jobs', ['started_at']);
    await queryInterface.addIndex('etl_jobs', ['job_type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('etl_jobs');
  }
};
