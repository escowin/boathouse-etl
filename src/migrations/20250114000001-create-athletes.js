'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('athletes', {
      athlete_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      first_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      last_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      email: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      phone: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM('Cox', 'Rower', 'Rower & Coxswain'),
        allowNull: false,
      },
      gender: {
        type: Sequelize.ENUM('M', 'F'),
        allowNull: true,
      },
      birth_year: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      sweep_scull: {
        type: Sequelize.ENUM('Sweep', 'Scull', 'Sweep & Scull'),
        allowNull: true,
      },
      port_starboard: {
        type: Sequelize.ENUM('Starboard', 'Prefer Starboard', 'Either', 'Prefer Port', 'Port'),
        allowNull: true,
      },
      cox_capability: {
        type: Sequelize.ENUM('No', 'Sometimes', 'Only'),
        allowNull: true,
      },
      bow_in_dark: {
        type: Sequelize.ENUM('Yes', 'No', 'If I have to'),
        allowNull: true,
      },
      weight_kg: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      height_cm: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      experience_years: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      usra_age_category_2025: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      us_rowing_number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      emergency_contact: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      emergency_contact_phone: {
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
    await queryInterface.addIndex('athletes', ['name']);
    await queryInterface.addIndex('athletes', ['type']);
    await queryInterface.addIndex('athletes', ['active']);
    await queryInterface.addIndex('athletes', ['weight_kg']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('athletes');
  }
};
