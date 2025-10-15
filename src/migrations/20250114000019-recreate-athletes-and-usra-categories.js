'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Drop dependent tables first (in reverse dependency order)
    await queryInterface.dropTable('seat_assignments');
    await queryInterface.dropTable('lineups');
    await queryInterface.dropTable('attendance');
    await queryInterface.dropTable('team_memberships');
    await queryInterface.dropTable('practice_sessions'); // practice_sessions has FK to teams
    await queryInterface.dropTable('teams'); // teams has FK to athletes
    
    // Drop the main tables
    await queryInterface.dropTable('athletes');
    await queryInterface.dropTable('usra_categories');
    
    // Recreate usra_categories with auto-increment primary key
    await queryInterface.createTable('usra_categories', {
      usra_category_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
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
    
    // Recreate athletes table with integer usra_age_category_id
    await queryInterface.createTable('athletes', {
      athlete_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      email: {
        type: Sequelize.TEXT,
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      phone: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('Cox', 'Rower', 'Rower & Coxswain'),
        allowNull: false
      },
      gender: {
        type: Sequelize.ENUM('M', 'F'),
        allowNull: true
      },
      birth_year: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1900,
          max: 2025
        }
      },
      sweep_scull: {
        type: Sequelize.ENUM('Sweep', 'Scull', 'Sweep & Scull'),
        allowNull: true
      },
      port_starboard: {
        type: Sequelize.ENUM('Starboard', 'Prefer Starboard', 'Either', 'Prefer Port', 'Port'),
        allowNull: true
      },
      bow_in_dark: {
        type: Sequelize.ENUM('Yes', 'No', 'If I have to'),
        allowNull: true
      },
      weight_kg: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        validate: {
          min: 0,
          max: 1000,
        }
      },
      height_cm: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          max: 300,
        }
      },
      experience_years: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          max: 100,
        }
      },
      usra_age_category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usra_categories',
          key: 'usra_category_id'
        }
      },
      us_rowing_number: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      emergency_contact: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      emergency_contact_phone: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
      },
      etl_source: {
        type: Sequelize.TEXT,
        defaultValue: 'google_sheets'
      },
      etl_last_sync: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
    
    // Recreate teams table
    await queryInterface.createTable('teams', {
      team_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      display_name: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      team_type: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      head_coach_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'athletes',
          key: 'athlete_id'
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
    
    // Recreate practice_sessions table
    await queryInterface.createTable('practice_sessions', {
      session_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id'
        }
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: true
      },
      session_type: {
        type: Sequelize.ENUM('Practice', 'Race', 'Erg Test', 'Meeting', 'Other'),
        allowNull: false,
        defaultValue: 'Practice'
      },
      location: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
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
    
    // Recreate dependent tables
    await queryInterface.createTable('team_memberships', {
      membership_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      athlete_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        },
        onDelete: 'CASCADE'
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id'
        }
      },
      role: {
        type: Sequelize.ENUM('Member', 'Captain', 'Coach', 'Admin'),
        allowNull: false,
        defaultValue: 'Member'
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      left_at: {
        type: Sequelize.DATE,
        allowNull: true
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
    
    await queryInterface.createTable('attendance', {
      attendance_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'practice_sessions',
          key: 'session_id'
        },
        onDelete: 'CASCADE'
      },
      athlete_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        },
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('Yes', 'No', 'Maybe', 'Late', 'Excused'),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id'
        }
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      etl_source: {
        type: Sequelize.TEXT,
        defaultValue: 'google_sheets'
      },
      etl_last_sync: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
    
    await queryInterface.createTable('lineups', {
      lineup_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'practice_sessions',
          key: 'session_id'
        },
        onDelete: 'CASCADE'
      },
      boat_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'boats',
          key: 'boat_id'
        }
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id'
        }
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
    
    await queryInterface.createTable('seat_assignments', {
      seat_assignment_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      lineup_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'lineups',
          key: 'lineup_id'
        },
        onDelete: 'CASCADE'
      },
      athlete_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        },
        onDelete: 'CASCADE'
      },
      seat_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      side: {
        type: Sequelize.ENUM('Port', 'Starboard'),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
    
    // Add indexes
    await queryInterface.addIndex('usra_categories', {
      fields: ['start_age', 'end_age', 'category'],
      unique: true,
      name: 'usra_categories_unique_age_category'
    });
    
    await queryInterface.addIndex('athletes', {
      fields: ['usra_age_category_id'],
      name: 'athletes_usra_age_category_id_idx'
    });
    
    await queryInterface.addIndex('team_memberships', {
      fields: ['athlete_id', 'team_id'],
      unique: true,
      name: 'team_memberships_athlete_team_unique'
    });
    
    await queryInterface.addIndex('attendance', {
      fields: ['session_id', 'athlete_id'],
      unique: true,
      name: 'attendance_session_athlete_unique'
    });
    
    await queryInterface.addIndex('seat_assignments', {
      fields: ['lineup_id', 'seat_number'],
      unique: true,
      name: 'seat_assignments_lineup_seat_unique'
    });
  },

  async down (queryInterface, Sequelize) {
    // Drop dependent tables
    await queryInterface.dropTable('seat_assignments');
    await queryInterface.dropTable('lineups');
    await queryInterface.dropTable('attendance');
    await queryInterface.dropTable('team_memberships');
    
    // Drop main tables
    await queryInterface.dropTable('athletes');
    await queryInterface.dropTable('usra_categories');
    
    // Recreate with original structure (UUID for usra_category_id)
    await queryInterface.createTable('usra_categories', {
      usra_category_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      start_age: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      end_age: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false
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
    
    // Note: This down migration doesn't recreate all dependent tables
    // as it would be too complex to restore the exact previous state
  }
};
