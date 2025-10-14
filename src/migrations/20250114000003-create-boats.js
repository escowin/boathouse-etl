'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('boats', {
      boat_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },
      type: {
        type: Sequelize.ENUM('Single', 'Double', 'Pair', 'Quad', 'Four', 'Eight'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('Available', 'Reserved', 'In Use', 'Maintenance', 'Retired'),
        defaultValue: 'Available',
      },
      min_weight_kg: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      max_weight_kg: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      manufacturer: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      year_built: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      rigging_type: {
        type: Sequelize.TEXT,
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
    await queryInterface.addIndex('boats', ['name'], { unique: true });
    await queryInterface.addIndex('boats', ['type']);
    await queryInterface.addIndex('boats', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('boats');
  }
};
