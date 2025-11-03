'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add PIN authentication fields to athletes table
    await queryInterface.addColumn('athletes', 'pin_hash', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Hashed PIN for authentication'
    });

    await queryInterface.addColumn('athletes', 'pin_salt', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Salt used for PIN hashing'
    });

    await queryInterface.addColumn('athletes', 'pin_created_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When the PIN was first created'
    });

    await queryInterface.addColumn('athletes', 'last_login', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Last successful login timestamp'
    });

    await queryInterface.addColumn('athletes', 'failed_login_attempts', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of consecutive failed login attempts'
    });

    await queryInterface.addColumn('athletes', 'locked_until', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Account lockout expiration timestamp'
    });

    await queryInterface.addColumn('athletes', 'pin_reset_required', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether user must reset PIN on next login'
    });

    // Add indexes for performance
    await queryInterface.addIndex('athletes', ['last_login'], {
      name: 'idx_athletes_last_login'
    });

    await queryInterface.addIndex('athletes', ['locked_until'], {
      name: 'idx_athletes_locked_until'
    });

    await queryInterface.addIndex('athletes', ['pin_reset_required'], {
      name: 'idx_athletes_pin_reset_required'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('athletes', 'idx_athletes_last_login');
    await queryInterface.removeIndex('athletes', 'idx_athletes_locked_until');
    await queryInterface.removeIndex('athletes', 'idx_athletes_pin_reset_required');

    // Remove columns
    await queryInterface.removeColumn('athletes', 'pin_hash');
    await queryInterface.removeColumn('athletes', 'pin_salt');
    await queryInterface.removeColumn('athletes', 'pin_created_at');
    await queryInterface.removeColumn('athletes', 'last_login');
    await queryInterface.removeColumn('athletes', 'failed_login_attempts');
    await queryInterface.removeColumn('athletes', 'locked_until');
    await queryInterface.removeColumn('athletes', 'pin_reset_required');
  }
};
