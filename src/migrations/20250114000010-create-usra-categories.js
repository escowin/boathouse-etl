'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usra_categories', {
      usra_category_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      start_age: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0
        }
      },
      end_age: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0
        }
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('usra_categories', {
      fields: ['start_age', 'end_age', 'category'],
      unique: true,
      name: 'usra_categories_unique_constraint'
    });

    await queryInterface.addIndex('usra_categories', {
      fields: ['start_age'],
      name: 'usra_categories_start_age_idx'
    });

    await queryInterface.addIndex('usra_categories', {
      fields: ['end_age'],
      name: 'usra_categories_end_age_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('usra_categories');
  }
};
