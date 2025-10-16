'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Adding CASCADE delete constraints to core boathouse management system...');
    
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Team -> Practice Sessions CASCADE
      console.log('📋 Adding CASCADE delete to practice_sessions -> teams...');
      await queryInterface.changeColumn('practice_sessions', 'team_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 2. Practice Sessions -> Attendance CASCADE
      console.log('📋 Adding CASCADE delete to attendance -> practice_sessions...');
      await queryInterface.changeColumn('attendance', 'session_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'practice_sessions',
          key: 'session_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 3. Practice Sessions -> Lineups CASCADE
      console.log('📋 Adding CASCADE delete to lineups -> practice_sessions...');
      await queryInterface.changeColumn('lineups', 'session_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'practice_sessions',
          key: 'session_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 4. Lineups -> Seat Assignments CASCADE
      console.log('📋 Adding CASCADE delete to seat_assignments -> lineups...');
      await queryInterface.changeColumn('seat_assignments', 'lineup_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'lineups',
          key: 'lineup_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 5. Teams -> Team Memberships CASCADE
      console.log('📋 Adding CASCADE delete to team_memberships -> teams...');
      await queryInterface.changeColumn('team_memberships', 'team_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 6. Athletes -> Team Memberships CASCADE
      console.log('📋 Adding CASCADE delete to team_memberships -> athletes...');
      await queryInterface.changeColumn('team_memberships', 'athlete_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 7. Athletes -> Attendance CASCADE
      console.log('📋 Adding CASCADE delete to attendance -> athletes...');
      await queryInterface.changeColumn('attendance', 'athlete_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 8. Athletes -> Seat Assignments CASCADE
      console.log('📋 Adding CASCADE delete to seat_assignments -> athletes...');
      await queryInterface.changeColumn('seat_assignments', 'athlete_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 9. Athletes -> Erg Tests CASCADE
      console.log('📋 Adding CASCADE delete to erg_tests -> athletes...');
      await queryInterface.changeColumn('erg_tests', 'athlete_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 10. Teams -> Attendance CASCADE
      console.log('📋 Adding CASCADE delete to attendance -> teams...');
      await queryInterface.changeColumn('attendance', 'team_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 11. Teams -> Lineups CASCADE
      console.log('📋 Adding CASCADE delete to lineups -> teams...');
      await queryInterface.changeColumn('lineups', 'team_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 12. Boats -> Lineups CASCADE
      console.log('📋 Adding CASCADE delete to lineups -> boats...');
      await queryInterface.changeColumn('lineups', 'boat_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'boats',
          key: 'boat_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 12.5. Boats -> Gauntlet Lineups CASCADE
      console.log('📋 Adding CASCADE delete to gauntlet_lineups -> boats...');
      await queryInterface.changeColumn('gauntlet_lineups', 'boat_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'boats',
          key: 'boat_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 13. Regattas -> Regatta Registrations CASCADE
      console.log('📋 Adding CASCADE delete to regatta_registrations -> regattas...');
      await queryInterface.changeColumn('regatta_registrations', 'regatta_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'regattas',
          key: 'regatta_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 14. Athletes -> Regatta Registrations CASCADE
      console.log('📋 Adding CASCADE delete to regatta_registrations -> athletes...');
      await queryInterface.changeColumn('regatta_registrations', 'athlete_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 15. Teams -> Regatta Registrations CASCADE
      console.log('📋 Adding CASCADE delete to regatta_registrations -> teams...');
      await queryInterface.changeColumn('regatta_registrations', 'team_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 16. Regattas -> Races CASCADE
      console.log('📋 Adding CASCADE delete to races -> regattas...');
      await queryInterface.changeColumn('races', 'regatta_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'regattas',
          key: 'regatta_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 17. Lineups -> Races CASCADE
      console.log('📋 Adding CASCADE delete to races -> lineups...');
      await queryInterface.changeColumn('races', 'lineup_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'lineups',
          key: 'lineup_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 18. Athletes -> Gauntlets CASCADE
      console.log('📋 Adding CASCADE delete to gauntlets -> athletes...');
      await queryInterface.changeColumn('gauntlets', 'created_by', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 19. USRA Categories -> Athletes CASCADE
      console.log('📋 Adding CASCADE delete to athletes -> usra_categories...');
      await queryInterface.changeColumn('athletes', 'usra_age_category_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usra_categories',
          key: 'usra_category_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 20. Mailing Lists -> Teams CASCADE (handled in separate migration)
      console.log('📋 Skipping mailing list CASCADE - handled in relationship fix migration...');

      // 21. Athletes -> Teams (Head Coach) CASCADE
      console.log('📋 Adding CASCADE delete to teams -> athletes (head coach)...');
      await queryInterface.changeColumn('teams', 'head_coach_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      await transaction.commit();

      console.log('✅ CASCADE delete constraints added successfully!');
      console.log('');
      console.log('🗑️  Core Boathouse CASCADE Delete Chains:');
      console.log('');
      console.log('  DELETE team → CASCADE deletes:');
      console.log('    ├── team_memberships');
      console.log('    ├── practice_sessions');
      console.log('    │   ├── attendance');
      console.log('    │   └── lineups');
      console.log('    │       └── seat_assignments');
      console.log('    ├── attendance (direct)');
      console.log('    ├── lineups (direct)');
      console.log('    ├── regatta_registrations');
      console.log('    └── mailing_lists (via relationship fix migration)');
      console.log('');
      console.log('  DELETE athlete → CASCADE deletes:');
      console.log('    ├── team_memberships');
      console.log('    ├── attendance');
      console.log('    ├── seat_assignments');
      console.log('    ├── erg_tests');
      console.log('    ├── regatta_registrations');
      console.log('    ├── gauntlets (created by)');
      console.log('    └── gauntlet_seat_assignments');
      console.log('');
      console.log('  DELETE practice_session → CASCADE deletes:');
      console.log('    ├── attendance');
      console.log('    └── lineups');
      console.log('        └── seat_assignments');
      console.log('');
      console.log('  DELETE lineup → CASCADE deletes:');
      console.log('    ├── seat_assignments');
      console.log('    └── races');
      console.log('');
      console.log('  DELETE regatta → CASCADE deletes:');
      console.log('    ├── regatta_registrations');
      console.log('    └── races');
      console.log('');
      console.log('  DELETE boat → CASCADE deletes:');
      console.log('    ├── lineups');
      console.log('    │   └── seat_assignments');
      console.log('    └── gauntlet_lineups');
      console.log('        └── gauntlet_seat_assignments');
      console.log('');
      console.log('🎯 Single Point of Control Benefits:');
      console.log('  ✅ Deleting a team removes ALL related data');
      console.log('  ✅ Deleting an athlete removes ALL related data');
      console.log('  ✅ No orphaned records left behind');
      console.log('  ✅ Clean, atomic deletion');
      console.log('  ✅ Consistent with gauntlet system design');

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Removing CASCADE delete constraints from core boathouse management system...');
    
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Remove CASCADE deletes (restore to original state)
      await queryInterface.changeColumn('teams', 'head_coach_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      // Mailing list CASCADE handled in separate migration
      
      await queryInterface.changeColumn('athletes', 'usra_age_category_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usra_categories',
          key: 'usra_category_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('gauntlets', 'created_by', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('races', 'lineup_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'lineups',
          key: 'lineup_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('races', 'regatta_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'regattas',
          key: 'regatta_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('regatta_registrations', 'team_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('regatta_registrations', 'athlete_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('regatta_registrations', 'regatta_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'regattas',
          key: 'regatta_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('lineups', 'boat_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'boats',
          key: 'boat_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('gauntlet_lineups', 'boat_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'boats',
          key: 'boat_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('lineups', 'team_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('attendance', 'team_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('erg_tests', 'athlete_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('seat_assignments', 'athlete_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('attendance', 'athlete_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('team_memberships', 'athlete_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('team_memberships', 'team_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('seat_assignments', 'lineup_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'lineups',
          key: 'lineup_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('lineups', 'session_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'practice_sessions',
          key: 'session_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('attendance', 'session_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'practice_sessions',
          key: 'session_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });
      
      await queryInterface.changeColumn('practice_sessions', 'team_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id'
        }
        // Remove onDelete: 'CASCADE'
      }, { transaction });

      await transaction.commit();
      console.log('✅ CASCADE delete constraints removed!');
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
