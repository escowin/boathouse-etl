'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('athletes', 'usra_age_category_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'usra_categories',
        key: 'usra_category_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for the foreign key
    await queryInterface.addIndex('athletes', {
      fields: ['usra_age_category_id'],
      name: 'athletes_usra_age_category_id_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('athletes', 'athletes_usra_age_category_id_idx');
    await queryInterface.removeColumn('athletes', 'usra_age_category_id');
  }
};
