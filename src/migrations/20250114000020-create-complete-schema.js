'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create USRA Categories table
    await queryInterface.createTable('usra_categories', {
      usra_category_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
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

    // Create Athletes table
    await queryInterface.createTable('athletes', {
      athlete_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      email: {
        type: Sequelize.TEXT,
        allowNull: true
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
        allowNull: true
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
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      weight_kg: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      height_cm: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      experience_years: {
        type: Sequelize.INTEGER,
        allowNull: true
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
        allowNull: false,
        defaultValue: 'google_sheets'
      },
      etl_last_sync: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create Teams table
    await queryInterface.createTable('teams', {
      team_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false
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
      assistant_coaches: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
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

    // Create Boats table
    await queryInterface.createTable('boats', {
      boat_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('Single', 'Double', 'Pair', 'Quad', 'Four', 'Eight'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('Available', 'Reserved', 'In Use', 'Maintenance', 'Retired'),
        allowNull: false,
        defaultValue: 'Available'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      min_weight_kg: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      max_weight_kg: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      rigging_type: {
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
      },
      etl_source: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: 'google_sheets'
      },
      etl_last_sync: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create Practice Sessions table
    await queryInterface.createTable('practice_sessions', {
      session_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
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

    // Create Team Memberships table
    await queryInterface.createTable('team_memberships', {
      membership_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      athlete_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id',
          onDelete: 'CASCADE'
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
      role: {
        type: Sequelize.ENUM('Athlete', 'Captain', 'Coach', 'Assistant Coach', 'Secretary'),
        allowNull: false,
        defaultValue: 'Athlete'
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

    // Create Attendance table
    await queryInterface.createTable('attendance', {
      attendance_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'practice_sessions',
          key: 'session_id',
          onDelete: 'CASCADE'
        }
      },
      athlete_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id',
          onDelete: 'CASCADE'
        }
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
        allowNull: false,
        defaultValue: 'google_sheets'
      },
      etl_last_sync: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create Lineups table
    await queryInterface.createTable('lineups', {
      lineup_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'practice_sessions',
          key: 'session_id',
          onDelete: 'CASCADE'
        }
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
      lineup_name: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      lineup_type: {
        type: Sequelize.ENUM('Practice', 'Race', 'Test'),
        allowNull: false,
        defaultValue: 'Practice'
      },
      total_weight_kg: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true
      },
      average_weight_kg: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      average_age: {
        type: Sequelize.DECIMAL(4, 1),
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
      },
      etl_source: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: 'google_sheets'
      },
      etl_last_sync: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create Seat Assignments table
    await queryInterface.createTable('seat_assignments', {
      seat_assignment_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      lineup_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'lineups',
          key: 'lineup_id'
        }
      },
      athlete_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id'
        }
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
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create ETL Jobs table
    await queryInterface.createTable('etl_jobs', {
      job_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      job_type: {
        type: Sequelize.ENUM('full_etl', 'incremental_etl', 'athletes_sync', 'boats_sync', 'attendance_sync'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('running', 'completed', 'failed', 'cancelled'),
        allowNull: false
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      duration_seconds: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      records_processed: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      records_failed: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      records_created: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      records_updated: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      error_details: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes for better performance
    await queryInterface.addIndex('athletes', ['name']);
    await queryInterface.addIndex('athletes', ['active']);
    await queryInterface.addIndex('athletes', ['usra_age_category_id']);
    await queryInterface.addIndex('teams', ['name']);
    await queryInterface.addIndex('boats', ['type']);
    await queryInterface.addIndex('boats', ['status']);
    await queryInterface.addIndex('practice_sessions', ['team_id']);
    await queryInterface.addIndex('practice_sessions', ['date']);
    await queryInterface.addIndex('team_memberships', ['athlete_id']);
    await queryInterface.addIndex('team_memberships', ['team_id']);
    await queryInterface.addIndex('attendance', ['session_id']);
    await queryInterface.addIndex('attendance', ['athlete_id']);
    await queryInterface.addIndex('attendance', ['team_id']);
    await queryInterface.addIndex('lineups', ['session_id']);
    await queryInterface.addIndex('lineups', ['boat_id']);
    await queryInterface.addIndex('lineups', ['team_id']);
    await queryInterface.addIndex('seat_assignments', ['lineup_id']);
    await queryInterface.addIndex('seat_assignments', ['athlete_id']);
    await queryInterface.addIndex('etl_jobs', ['job_type']);
    await queryInterface.addIndex('etl_jobs', ['status']);
    await queryInterface.addIndex('etl_jobs', ['started_at']);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse dependency order
    await queryInterface.dropTable('seat_assignments');
    await queryInterface.dropTable('lineups');
    await queryInterface.dropTable('attendance');
    await queryInterface.dropTable('team_memberships');
    await queryInterface.dropTable('practice_sessions');
    await queryInterface.dropTable('boats');
    await queryInterface.dropTable('teams');
    await queryInterface.dropTable('athletes');
    await queryInterface.dropTable('usra_categories');
    await queryInterface.dropTable('etl_jobs');
  }
};
