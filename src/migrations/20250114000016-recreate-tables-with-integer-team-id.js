'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Since we can't easily convert UUID primary keys to integers,
    // we'll drop and recreate the affected tables
    
    // First, drop all tables that reference team_id (in dependency order)
    await queryInterface.dropTable('seat_assignments');
    await queryInterface.dropTable('lineups');
    await queryInterface.dropTable('attendance');
    await queryInterface.dropTable('team_memberships');
    await queryInterface.dropTable('practice_sessions');
    await queryInterface.dropTable('teams');
    
    // Recreate teams table with INTEGER team_id
    await queryInterface.createTable('teams', {
      team_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      team_type: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      age_range_min: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      age_range_max: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      gender_focus: {
        type: Sequelize.ENUM('M', 'F', 'Mixed'),
        allowNull: true,
      },
      skill_level: {
        type: Sequelize.ENUM('Beginner', 'Intermediate', 'Advanced', 'Elite'),
        allowNull: true,
      },
      head_coach_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'athletes',
          key: 'athlete_id',
        },
        onDelete: 'SET NULL',
      },
      assistant_coaches: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
      },
      team_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
    
    // Recreate practice_sessions table with INTEGER team_id
    await queryInterface.createTable('practice_sessions', {
      session_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id',
        },
        onDelete: 'CASCADE',
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      location: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      session_type: {
        type: Sequelize.ENUM('Practice', 'Scrimmage', 'Test', 'Regatta', 'Team Building'),
        allowNull: false,
      },
      session_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      focus_area: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      weather_conditions: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      etl_source: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: 'google_sheets',
      },
      etl_last_sync: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
    
    // Recreate team_memberships table with INTEGER team_id
    await queryInterface.createTable('team_memberships', {
      membership_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id',
        },
        onDelete: 'CASCADE',
      },
      athlete_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id',
        },
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('Athlete', 'Captain', 'Secretary', 'Coach', 'Assistant Coach'),
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
    
    // Recreate attendance table with INTEGER team_id
    await queryInterface.createTable('attendance', {
      attendance_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'practice_sessions',
          key: 'session_id',
        },
        onDelete: 'CASCADE',
      },
      athlete_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id',
        },
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('Yes', 'No', 'Maybe', 'Late', 'Excused'),
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id',
        },
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      etl_source: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: 'google_sheets',
      },
      etl_last_sync: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
    
    // Recreate lineups table with INTEGER team_id
    await queryInterface.createTable('lineups', {
      lineup_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'practice_sessions',
          key: 'session_id',
        },
        onDelete: 'CASCADE',
      },
      boat_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'boats',
          key: 'boat_id',
        },
        onDelete: 'CASCADE',
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'team_id',
        },
      },
      lineup_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lineup_type: {
        type: Sequelize.ENUM('Practice', 'Race', 'Test'),
        allowNull: false,
      },
      total_weight_kg: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      average_weight_kg: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      average_age: {
        type: Sequelize.DECIMAL(4, 1),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      etl_source: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: 'google_sheets',
      },
      etl_last_sync: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
    
    // Recreate seat_assignments table
    await queryInterface.createTable('seat_assignments', {
      seat_assignment_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      lineup_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'lineups',
          key: 'lineup_id',
        },
        onDelete: 'CASCADE',
      },
      athlete_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'athlete_id',
        },
        onDelete: 'CASCADE',
      },
      seat_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      side: {
        type: Sequelize.ENUM('Port', 'Starboard', 'Coxswain'),
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      etl_source: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: 'google_sheets',
      },
      etl_last_sync: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
    
    // Add indexes
    await queryInterface.addIndex('teams', ['name']);
    await queryInterface.addIndex('teams', ['team_type']);
    await queryInterface.addIndex('teams', ['active']);
    
    await queryInterface.addIndex('practice_sessions', ['team_id']);
    await queryInterface.addIndex('practice_sessions', ['date']);
    await queryInterface.addIndex('practice_sessions', ['team_id', 'date']);
    
    await queryInterface.addIndex('team_memberships', ['team_id']);
    await queryInterface.addIndex('team_memberships', ['athlete_id']);
    await queryInterface.addIndex('team_memberships', ['team_id', 'athlete_id']);
    
    await queryInterface.addIndex('attendance', ['session_id']);
    await queryInterface.addIndex('attendance', ['athlete_id']);
    await queryInterface.addIndex('attendance', ['team_id']);
    
    await queryInterface.addIndex('lineups', ['session_id']);
    await queryInterface.addIndex('lineups', ['boat_id']);
    await queryInterface.addIndex('lineups', ['team_id']);
    
    await queryInterface.addIndex('seat_assignments', ['lineup_id']);
    await queryInterface.addIndex('seat_assignments', ['athlete_id']);
    await queryInterface.addIndex('seat_assignments', ['lineup_id', 'seat_number']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the recreated tables
    await queryInterface.dropTable('seat_assignments');
    await queryInterface.dropTable('lineups');
    await queryInterface.dropTable('attendance');
    await queryInterface.dropTable('team_memberships');
    await queryInterface.dropTable('practice_sessions');
    await queryInterface.dropTable('teams');
    
    // Note: This down migration doesn't recreate the original UUID tables
    // as that would require the original migration files to be re-run
  }
};
