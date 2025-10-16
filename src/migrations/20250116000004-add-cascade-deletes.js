'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Adding CASCADE delete constraints for gauntlet system...');
    
    // Add CASCADE delete to gauntlet_lineups -> gauntlets
    console.log('📋 Adding CASCADE delete to gauntlet_lineups -> gauntlets...');
    await queryInterface.changeColumn('gauntlet_lineups', 'gauntlet_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'gauntlets',
        key: 'gauntlet_id'
      },
      onDelete: 'CASCADE'
    });
    
    // Add CASCADE delete to gauntlet_matches -> gauntlets
    console.log('📋 Adding CASCADE delete to gauntlet_matches -> gauntlets...');
    await queryInterface.changeColumn('gauntlet_matches', 'gauntlet_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'gauntlets',
        key: 'gauntlet_id'
      },
      onDelete: 'CASCADE'
    });
    
    // Add CASCADE delete to ladders -> gauntlets
    console.log('📋 Adding CASCADE delete to ladders -> gauntlets...');
    await queryInterface.changeColumn('ladders', 'gauntlet_id', {
      type: Sequelize.UUID,
      allowNull: true, // Keep as nullable for now
      references: {
        model: 'gauntlets',
        key: 'gauntlet_id'
      },
      onDelete: 'CASCADE'
    });
    
    // Add CASCADE delete to gauntlet_seat_assignments -> gauntlet_lineups
    console.log('📋 Adding CASCADE delete to gauntlet_seat_assignments -> gauntlet_lineups...');
    await queryInterface.changeColumn('gauntlet_seat_assignments', 'gauntlet_lineup_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'gauntlet_lineups',
        key: 'gauntlet_lineup_id'
      },
      onDelete: 'CASCADE'
    });
    
    // Add CASCADE delete to ladder_positions -> ladders
    console.log('📋 Adding CASCADE delete to ladder_positions -> ladders...');
    await queryInterface.changeColumn('ladder_positions', 'ladder_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'ladders',
        key: 'ladder_id'
      },
      onDelete: 'CASCADE'
    });
    
    // Add CASCADE delete to ladder_progressions -> ladders
    console.log('📋 Adding CASCADE delete to ladder_progressions -> ladders...');
    await queryInterface.changeColumn('ladder_progressions', 'ladder_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'ladders',
        key: 'ladder_id'
      },
      onDelete: 'CASCADE'
    });
    
    // Add CASCADE delete to ladder_progressions -> gauntlet_matches
    console.log('📋 Adding CASCADE delete to ladder_progressions -> gauntlet_matches...');
    await queryInterface.changeColumn('ladder_progressions', 'match_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'gauntlet_matches',
        key: 'match_id'
      },
      onDelete: 'CASCADE'
    });
    
    console.log('✅ CASCADE delete constraints added successfully!');
    console.log('');
    console.log('🗑️  CASCADE Delete Chain:');
    console.log('  DELETE gauntlet → CASCADE deletes:');
    console.log('    ├── gauntlet_lineups');
    console.log('    │   └── gauntlet_seat_assignments');
    console.log('    ├── gauntlet_matches');
    console.log('    │   └── ladder_progressions (via match_id)');
    console.log('    └── ladders');
    console.log('        ├── ladder_positions');
    console.log('        └── ladder_progressions (via ladder_id)');
    console.log('');
    console.log('🎯 Single Point of Control:');
    console.log('  ✅ Deleting a gauntlet removes ALL related data');
    console.log('  ✅ No orphaned records left behind');
    console.log('  ✅ Clean, atomic deletion');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Removing CASCADE delete constraints...');
    
    // Remove CASCADE deletes (restore to original state)
    await queryInterface.changeColumn('gauntlet_lineups', 'gauntlet_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'gauntlets',
        key: 'gauntlet_id'
      }
      // Remove onDelete: 'CASCADE'
    });
    
    await queryInterface.changeColumn('gauntlet_matches', 'gauntlet_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'gauntlets',
        key: 'gauntlet_id'
      }
      // Remove onDelete: 'CASCADE'
    });
    
    await queryInterface.changeColumn('ladders', 'gauntlet_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'gauntlets',
        key: 'gauntlet_id'
      }
      // Remove onDelete: 'CASCADE'
    });
    
    await queryInterface.changeColumn('gauntlet_seat_assignments', 'gauntlet_lineup_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'gauntlet_lineups',
        key: 'gauntlet_lineup_id'
      }
      // Remove onDelete: 'CASCADE'
    });
    
    await queryInterface.changeColumn('ladder_positions', 'ladder_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'ladders',
        key: 'ladder_id'
      }
      // Remove onDelete: 'CASCADE'
    });
    
    await queryInterface.changeColumn('ladder_progressions', 'ladder_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'ladders',
        key: 'ladder_id'
      }
      // Remove onDelete: 'CASCADE'
    });
    
    await queryInterface.changeColumn('ladder_progressions', 'match_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'gauntlet_matches',
        key: 'match_id'
      }
      // Remove onDelete: 'CASCADE'
    });
    
    console.log('✅ CASCADE delete constraints removed!');
  }
};
