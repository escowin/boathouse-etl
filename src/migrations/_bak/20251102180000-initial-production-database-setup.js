'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Starting initial production database setup migration...');
      
      // ===================================================================
      // 1. Create ENUM types (must be done before tables)
      // ===================================================================
      console.log('📝 Creating ENUM types...');
      
      // Athlete type enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_athletes_type" AS ENUM ('Cox', 'Rower', 'Rower & Coxswain');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Athlete gender enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_athletes_gender" AS ENUM ('M', 'F');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Athlete discipline enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_athletes_discipline" AS ENUM ('Sweep', 'Scull', 'Sweep & Scull');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Athlete side enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_athletes_side" AS ENUM ('Starboard', 'Prefer Starboard', 'Either', 'Prefer Port', 'Port');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Athlete competitive status enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_athletes_competitive_status" AS ENUM ('active', 'inactive', 'retired', 'banned');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Athlete retirement reason enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_athletes_retirement_reason" AS ENUM ('deceased', 'transferred', 'graduated', 'personal', 'unknown');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Athlete ban reason enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_athletes_ban_reason" AS ENUM ('misconduct', 'safety_violation', 'harassment', 'other');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Boat type enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_boats_type" AS ENUM ('1x', '2x', '2-', '4x', '4+', '8+');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Boat status enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_boats_status" AS ENUM ('Available', 'Reserved', 'In Use', 'Maintenance', 'Retired');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Lineup type enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_lineups_lineup_type" AS ENUM ('Practice', 'Race', 'Test');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Seat assignment side enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_seat_assignments_side" AS ENUM ('Port', 'Starboard');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Team membership role enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_team_memberships_role" AS ENUM ('Athlete', 'Captain', 'Coach', 'Assistant Coach', 'Secretary');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Practice session type enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_practice_sessions_session_type" AS ENUM ('Practice', 'Race', 'Erg Test', 'Meeting', 'Other');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Attendance status enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_attendance_status" AS ENUM ('Yes', 'No', 'Maybe', 'Late', 'Excused');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Regatta type enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_regattas_regatta_type" AS ENUM ('Local', 'Regional', 'National', 'International', 'Scrimmage');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Regatta registration status enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_regatta_registrations_status" AS ENUM ('Interested', 'Committed', 'Declined', 'Waitlisted');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Erg test type enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_erg_tests_test_type" AS ENUM ('2K', '5K', '1K', '6K', '10K', '30min', '1hour');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Gauntlet boat type enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_gauntlets_boat_type" AS ENUM ('1x', '2x', '2-', '4x', '4+', '8+');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Gauntlet status enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_gauntlets_status" AS ENUM ('setup', 'active', 'completed', 'cancelled');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Gauntlet seat assignment side enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_gauntlet_seat_assignments_side" AS ENUM ('port', 'starboard', 'scull');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // Gauntlet position streak type enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_gauntlet_positions_streak_type" AS ENUM ('win', 'loss', 'draw', 'none');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // ETL job type enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_etl_jobs_job_type" AS ENUM ('full_etl', 'incremental_etl', 'athletes_sync', 'boats_sync', 'attendance_sync');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // ETL job status enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_etl_jobs_status" AS ENUM ('running', 'completed', 'failed', 'cancelled');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });
      
      // ===================================================================
      // 2. Create base tables (no dependencies)
      // ===================================================================
      console.log('📝 Creating base tables...');
      
      // USRA Categories table (no dependencies)
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
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Athletes table (depends on usra_categories, but usra_age_category_id is nullable)
      await queryInterface.createTable('athletes', {
        athlete_id: {
          type: Sequelize.UUID,
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
        discipline: {
          type: Sequelize.ENUM('Sweep', 'Scull', 'Sweep & Scull'),
          allowNull: true
        },
        side: {
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
          defaultValue: true
        },
        competitive_status: {
          type: Sequelize.ENUM('active', 'inactive', 'retired', 'banned'),
          allowNull: false,
          defaultValue: 'active'
        },
        retirement_reason: {
          type: Sequelize.ENUM('deceased', 'transferred', 'graduated', 'personal', 'unknown'),
          allowNull: true
        },
        retirement_date: {
          type: Sequelize.DATE,
          allowNull: true
        },
        ban_reason: {
          type: Sequelize.ENUM('misconduct', 'safety_violation', 'harassment', 'other'),
          allowNull: true
        },
        ban_date: {
          type: Sequelize.DATE,
          allowNull: true
        },
        ban_notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        pin_hash: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        pin_created_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        last_login: {
          type: Sequelize.DATE,
          allowNull: true
        },
        failed_login_attempts: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        locked_until: {
          type: Sequelize.DATE,
          allowNull: true
        },
        pin_reset_required: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        etl_source: {
          type: Sequelize.TEXT,
          defaultValue: 'google_sheets'
        },
        etl_last_sync: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Teams table (depends on athletes for head_coach_id)
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
          type: Sequelize.ARRAY(Sequelize.UUID),
          allowNull: true,
          defaultValue: []
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Boats table
      await queryInterface.createTable('boats', {
        boat_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.TEXT,
          allowNull: false,
          unique: true
        },
        type: {
          type: Sequelize.ENUM('1x', '2x', '2-', '4x', '4+', '8+'),
          allowNull: false
        },
        status: {
          type: Sequelize.ENUM('Available', 'Reserved', 'In Use', 'Maintenance', 'Retired'),
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
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        etl_source: {
          type: Sequelize.TEXT,
          defaultValue: 'google_sheets'
        },
        etl_last_sync: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // ===================================================================
      // 3. Create dependent tables (with foreign keys to base tables)
      // ===================================================================
      console.log('📝 Creating dependent tables...');
      
      // Team Memberships table
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
          },
          onDelete: 'CASCADE'
        },
        role: {
          type: Sequelize.ENUM('Athlete', 'Captain', 'Coach', 'Assistant Coach', 'Secretary'),
          allowNull: false,
          defaultValue: 'Athlete'
        },
        joined_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        left_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Practice Sessions table
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
          },
          onDelete: 'CASCADE'
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
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Attendance table
      await queryInterface.createTable('attendance', {
        attendance_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        session_id: {
          type: Sequelize.INTEGER,
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
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        etl_source: {
          type: Sequelize.TEXT,
          defaultValue: 'google_sheets'
        },
        etl_last_sync: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Lineups table
      await queryInterface.createTable('lineups', {
        lineup_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        session_id: {
          type: Sequelize.INTEGER,
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
        lineup_name: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        lineup_type: {
          type: Sequelize.ENUM('Practice', 'Race', 'Test'),
          allowNull: false
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
        set_by_athlete: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        set_by_athlete_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'athletes',
            key: 'athlete_id'
          },
          onDelete: 'CASCADE'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        etl_source: {
          type: Sequelize.TEXT,
          defaultValue: 'google_sheets'
        },
        etl_last_sync: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Seat Assignments table
      await queryInterface.createTable('seat_assignments', {
        seat_assignment_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
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
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // ===================================================================
      // 4. Create Regatta system tables
      // ===================================================================
      console.log('📝 Creating regatta system tables...');
      
      // Regattas table
      await queryInterface.createTable('regattas', {
        regatta_id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        location: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        body_of_water: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        start_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        end_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        registration_deadline: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        registration_open: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        registration_notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        regatta_type: {
          type: Sequelize.ENUM('Local', 'Regional', 'National', 'International', 'Scrimmage'),
          allowNull: false,
          defaultValue: 'Local'
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Regatta Registrations table
      await queryInterface.createTable('regatta_registrations', {
        registration_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        regatta_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'regattas',
            key: 'regatta_id'
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
        team_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'teams',
            key: 'team_id'
          }
        },
        status: {
          type: Sequelize.ENUM('Interested', 'Committed', 'Declined', 'Waitlisted'),
          allowNull: false,
          defaultValue: 'Interested'
        },
        preferred_events: {
          type: Sequelize.ARRAY(Sequelize.TEXT),
          allowNull: true,
          defaultValue: []
        },
        availability_notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        coach_notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        coach_approved: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        registration_url: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        registered_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        status_updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        coach_reviewed_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Races table
      await queryInterface.createTable('races', {
        race_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        regatta_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'regattas',
            key: 'regatta_id'
          }
        },
        lineup_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'lineups',
            key: 'lineup_id'
          }
        },
        event_name: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        race_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        race_time: {
          type: Sequelize.TIME,
          allowNull: true
        },
        distance_meters: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 2000
        },
        result_time_seconds: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        placement: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        total_entries: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        lane_number: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // ===================================================================
      // 5. Create Gauntlet system tables
      // ===================================================================
      console.log('📝 Creating gauntlet system tables...');
      
      // Gauntlets table
      await queryInterface.createTable('gauntlets', {
        gauntlet_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        boat_type: {
          type: Sequelize.ENUM('1x', '2x', '2-', '4x', '4+', '8+'),
          allowNull: false
        },
        created_by: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'athletes',
            key: 'athlete_id'
          }
        },
        status: {
          type: Sequelize.ENUM('setup', 'active', 'completed', 'cancelled'),
          allowNull: false,
          defaultValue: 'setup'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Gauntlet Lineups table
      await queryInterface.createTable('gauntlet_lineups', {
        gauntlet_lineup_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        gauntlet_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'gauntlets',
            key: 'gauntlet_id'
          },
          onDelete: 'CASCADE'
        },
        boat_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'boats',
            key: 'boat_id'
          },
          onDelete: 'CASCADE'
        },
        is_user_lineup: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Gauntlet Seat Assignments table
      await queryInterface.createTable('gauntlet_seat_assignments', {
        gauntlet_seat_assignment_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        gauntlet_lineup_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'gauntlet_lineups',
            key: 'gauntlet_lineup_id'
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
          type: Sequelize.ENUM('port', 'starboard', 'scull'),
          allowNull: false
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Gauntlet Matches table
      await queryInterface.createTable('gauntlet_matches', {
        match_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        gauntlet_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'gauntlets',
            key: 'gauntlet_id'
          },
          onDelete: 'CASCADE'
        },
        user_lineup_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'gauntlet_lineups',
            key: 'gauntlet_lineup_id'
          },
          onDelete: 'CASCADE'
        },
        challenger_lineup_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'gauntlet_lineups',
            key: 'gauntlet_lineup_id'
          },
          onDelete: 'CASCADE'
        },
        workout: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        sets: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        user_wins: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        user_losses: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        match_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Gauntlet Positions table
      await queryInterface.createTable('gauntlet_positions', {
        position_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        gauntlet_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'gauntlets',
            key: 'gauntlet_id'
          },
          onDelete: 'CASCADE'
        },
        gauntlet_lineup_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'gauntlet_lineups',
            key: 'gauntlet_lineup_id'
          },
          onDelete: 'CASCADE'
        },
        position: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        previous_position: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        wins: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        losses: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        draws: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        win_rate: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        total_matches: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        points: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        streak_type: {
          type: Sequelize.ENUM('win', 'loss', 'draw', 'none'),
          allowNull: false,
          defaultValue: 'none'
        },
        streak_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        last_match_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        joined_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_DATE')
        },
        last_updated: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // ===================================================================
      // 6. Create other system tables
      // ===================================================================
      console.log('📝 Creating other system tables...');
      
      // Erg Tests table
      await queryInterface.createTable('erg_tests', {
        test_id: {
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
            key: 'athlete_id'
          }
        },
        test_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        test_type: {
          type: Sequelize.ENUM('2K', '5K', '1K', '6K', '10K', '30min', '1hour'),
          allowNull: false
        },
        distance_meters: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        time_seconds: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        split_seconds: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true
        },
        watts: {
          type: Sequelize.DECIMAL(6, 2),
          allowNull: true
        },
        calories: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        test_conditions: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Mailing Lists table
      await queryInterface.createTable('mailing_lists', {
        mailing_list_id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        team_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'teams',
            key: 'team_id'
          },
          onDelete: 'CASCADE'
        },
        name: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true
        },
        description: {
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
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // ETL Jobs table
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
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
          defaultValue: 0
        },
        records_failed: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        records_created: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        records_updated: {
          type: Sequelize.INTEGER,
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
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // ===================================================================
      // 7. Create indexes
      // ===================================================================
      console.log('📝 Creating indexes...');
      
      // Teams indexes
      await queryInterface.addIndex('teams', ['name'], {
        name: 'idx_teams_name',
        transaction
      });
      await queryInterface.addIndex('teams', ['team_type'], {
        name: 'idx_teams_team_type',
        transaction
      });
      
      // USRA Categories indexes
      await queryInterface.addIndex('usra_categories', ['start_age', 'end_age', 'category'], {
        unique: true,
        name: 'idx_usra_categories_unique',
        transaction
      });
      await queryInterface.addIndex('usra_categories', ['start_age'], {
        name: 'idx_usra_categories_start_age',
        transaction
      });
      await queryInterface.addIndex('usra_categories', ['end_age'], {
        name: 'idx_usra_categories_end_age',
        transaction
      });
      
      // Athletes indexes
      await queryInterface.addIndex('athletes', ['name'], {
        name: 'idx_athletes_name',
        transaction
      });
      await queryInterface.addIndex('athletes', ['type'], {
        name: 'idx_athletes_type',
        transaction
      });
      await queryInterface.addIndex('athletes', ['active'], {
        name: 'idx_athletes_active',
        transaction
      });
      await queryInterface.addIndex('athletes', ['competitive_status'], {
        name: 'idx_athletes_competitive_status',
        transaction
      });
      await queryInterface.addIndex('athletes', ['weight_kg'], {
        name: 'idx_athletes_weight_kg',
        transaction
      });
      await queryInterface.addIndex('athletes', ['last_login'], {
        name: 'idx_athletes_last_login',
        transaction
      });
      await queryInterface.addIndex('athletes', ['locked_until'], {
        name: 'idx_athletes_locked_until',
        transaction
      });
      await queryInterface.addIndex('athletes', ['pin_reset_required'], {
        name: 'idx_athletes_pin_reset_required',
        transaction
      });
      
      // Boats indexes
      await queryInterface.addIndex('boats', ['name'], {
        unique: true,
        name: 'idx_boats_name_unique',
        transaction
      });
      await queryInterface.addIndex('boats', ['type'], {
        name: 'idx_boats_type',
        transaction
      });
      await queryInterface.addIndex('boats', ['status'], {
        name: 'idx_boats_status',
        transaction
      });
      
      // Team Memberships indexes
      await queryInterface.addIndex('team_memberships', ['athlete_id', 'team_id'], {
        unique: true,
        name: 'idx_team_memberships_athlete_team_unique',
        transaction
      });
      
      // Practice Sessions indexes
      await queryInterface.addIndex('practice_sessions', ['team_id'], {
        name: 'idx_practice_sessions_team_id',
        transaction
      });
      await queryInterface.addIndex('practice_sessions', ['date'], {
        name: 'idx_practice_sessions_date',
        transaction
      });
      await queryInterface.addIndex('practice_sessions', ['team_id', 'date'], {
        name: 'idx_practice_sessions_team_date',
        transaction
      });
      
      // Attendance indexes
      await queryInterface.addIndex('attendance', ['session_id'], {
        name: 'idx_attendance_session_id',
        transaction
      });
      await queryInterface.addIndex('attendance', ['athlete_id'], {
        name: 'idx_attendance_athlete_id',
        transaction
      });
      await queryInterface.addIndex('attendance', ['team_id'], {
        name: 'idx_attendance_team_id',
        transaction
      });
      await queryInterface.addIndex('attendance', ['status'], {
        name: 'idx_attendance_status',
        transaction
      });
      await queryInterface.addIndex('attendance', ['session_id', 'athlete_id'], {
        unique: true,
        name: 'idx_attendance_session_athlete_unique',
        transaction
      });
      
      // Lineups indexes
      await queryInterface.addIndex('lineups', ['session_id'], {
        name: 'idx_lineups_session_id',
        transaction
      });
      await queryInterface.addIndex('lineups', ['boat_id'], {
        name: 'idx_lineups_boat_id',
        transaction
      });
      await queryInterface.addIndex('lineups', ['team_id'], {
        name: 'idx_lineups_team_id',
        transaction
      });
      
      // Seat Assignments indexes
      await queryInterface.addIndex('seat_assignments', ['lineup_id'], {
        name: 'idx_seat_assignments_lineup_id',
        transaction
      });
      await queryInterface.addIndex('seat_assignments', ['athlete_id'], {
        name: 'idx_seat_assignments_athlete_id',
        transaction
      });
      await queryInterface.addIndex('seat_assignments', ['lineup_id', 'seat_number'], {
        unique: true,
        name: 'idx_seat_assignments_lineup_seat_unique',
        transaction
      });
      
      // Regattas indexes
      await queryInterface.addIndex('regattas', ['name'], {
        name: 'idx_regattas_name',
        transaction
      });
      await queryInterface.addIndex('regattas', ['start_date'], {
        name: 'idx_regattas_start_date',
        transaction
      });
      await queryInterface.addIndex('regattas', ['registration_open'], {
        name: 'idx_regattas_registration_open',
        transaction
      });
      await queryInterface.addIndex('regattas', ['regatta_type'], {
        name: 'idx_regattas_regatta_type',
        transaction
      });
      
      // Regatta Registrations indexes
      await queryInterface.addIndex('regatta_registrations', ['regatta_id'], {
        name: 'idx_regatta_registrations_regatta_id',
        transaction
      });
      await queryInterface.addIndex('regatta_registrations', ['athlete_id'], {
        name: 'idx_regatta_registrations_athlete_id',
        transaction
      });
      await queryInterface.addIndex('regatta_registrations', ['team_id'], {
        name: 'idx_regatta_registrations_team_id',
        transaction
      });
      await queryInterface.addIndex('regatta_registrations', ['status'], {
        name: 'idx_regatta_registrations_status',
        transaction
      });
      await queryInterface.addIndex('regatta_registrations', ['regatta_id', 'athlete_id'], {
        unique: true,
        name: 'idx_regatta_registrations_regatta_athlete_unique',
        transaction
      });
      
      // Races indexes
      await queryInterface.addIndex('races', ['regatta_id'], {
        name: 'idx_races_regatta_id',
        transaction
      });
      await queryInterface.addIndex('races', ['lineup_id'], {
        name: 'idx_races_lineup_id',
        transaction
      });
      await queryInterface.addIndex('races', ['race_date'], {
        name: 'idx_races_race_date',
        transaction
      });
      await queryInterface.addIndex('races', ['event_name'], {
        name: 'idx_races_event_name',
        transaction
      });
      
      // Gauntlets indexes
      await queryInterface.addIndex('gauntlets', ['created_by'], {
        name: 'idx_gauntlets_created_by',
        transaction
      });
      await queryInterface.addIndex('gauntlets', ['status'], {
        name: 'idx_gauntlets_status',
        transaction
      });
      await queryInterface.addIndex('gauntlets', ['boat_type'], {
        name: 'idx_gauntlets_boat_type',
        transaction
      });
      
      // Gauntlet Lineups indexes
      await queryInterface.addIndex('gauntlet_lineups', ['gauntlet_id'], {
        name: 'idx_gauntlet_lineups_gauntlet_id',
        transaction
      });
      await queryInterface.addIndex('gauntlet_lineups', ['boat_id'], {
        name: 'idx_gauntlet_lineups_boat_id',
        transaction
      });
      await queryInterface.addIndex('gauntlet_lineups', ['is_user_lineup'], {
        name: 'idx_gauntlet_lineups_is_user_lineup',
        transaction
      });
      
      // Gauntlet Seat Assignments indexes
      await queryInterface.addIndex('gauntlet_seat_assignments', ['gauntlet_lineup_id'], {
        name: 'idx_gauntlet_seat_assignments_lineup_id',
        transaction
      });
      await queryInterface.addIndex('gauntlet_seat_assignments', ['athlete_id'], {
        name: 'idx_gauntlet_seat_assignments_athlete_id',
        transaction
      });
      await queryInterface.addIndex('gauntlet_seat_assignments', ['seat_number'], {
        name: 'idx_gauntlet_seat_assignments_seat_number',
        transaction
      });
      await queryInterface.addIndex('gauntlet_seat_assignments', ['gauntlet_lineup_id', 'seat_number'], {
        unique: true,
        name: 'idx_gauntlet_seat_assignments_lineup_seat_unique',
        transaction
      });
      
      // Gauntlet Matches indexes
      await queryInterface.addIndex('gauntlet_matches', ['gauntlet_id'], {
        name: 'idx_gauntlet_matches_gauntlet_id',
        transaction
      });
      await queryInterface.addIndex('gauntlet_matches', ['user_lineup_id'], {
        name: 'idx_gauntlet_matches_user_lineup_id',
        transaction
      });
      await queryInterface.addIndex('gauntlet_matches', ['challenger_lineup_id'], {
        name: 'idx_gauntlet_matches_challenger_lineup_id',
        transaction
      });
      await queryInterface.addIndex('gauntlet_matches', ['match_date'], {
        name: 'idx_gauntlet_matches_match_date',
        transaction
      });
      
      // Gauntlet Positions indexes
      await queryInterface.addIndex('gauntlet_positions', ['gauntlet_id'], {
        name: 'idx_gauntlet_positions_gauntlet_id',
        transaction
      });
      await queryInterface.addIndex('gauntlet_positions', ['gauntlet_lineup_id'], {
        name: 'idx_gauntlet_positions_gauntlet_lineup_id',
        transaction
      });
      await queryInterface.addIndex('gauntlet_positions', ['position'], {
        name: 'idx_gauntlet_positions_position',
        transaction
      });
      await queryInterface.addIndex('gauntlet_positions', ['gauntlet_id', 'gauntlet_lineup_id'], {
        unique: true,
        name: 'idx_gauntlet_positions_gauntlet_lineup_unique',
        transaction
      });
      
      // Erg Tests indexes
      await queryInterface.addIndex('erg_tests', ['athlete_id'], {
        name: 'idx_erg_tests_athlete_id',
        transaction
      });
      await queryInterface.addIndex('erg_tests', ['test_date'], {
        name: 'idx_erg_tests_test_date',
        transaction
      });
      await queryInterface.addIndex('erg_tests', ['test_type'], {
        name: 'idx_erg_tests_test_type',
        transaction
      });
      await queryInterface.addIndex('erg_tests', ['athlete_id', 'test_type', 'test_date'], {
        name: 'idx_erg_tests_athlete_type_date',
        transaction
      });
      
      // Mailing Lists indexes
      await queryInterface.addIndex('mailing_lists', ['email'], {
        unique: true,
        name: 'idx_mailing_lists_email_unique',
        transaction
      });
      await queryInterface.addIndex('mailing_lists', ['name'], {
        name: 'idx_mailing_lists_name',
        transaction
      });
      await queryInterface.addIndex('mailing_lists', ['active'], {
        name: 'idx_mailing_lists_active',
        transaction
      });
      await queryInterface.addIndex('mailing_lists', ['team_id'], {
        name: 'idx_mailing_lists_team_id',
        transaction
      });
      
      // ETL Jobs indexes
      await queryInterface.addIndex('etl_jobs', ['status'], {
        name: 'idx_etl_jobs_status',
        transaction
      });
      await queryInterface.addIndex('etl_jobs', ['started_at'], {
        name: 'idx_etl_jobs_started_at',
        transaction
      });
      await queryInterface.addIndex('etl_jobs', ['job_type'], {
        name: 'idx_etl_jobs_job_type',
        transaction
      });
      
      // ===================================================================
      // 8. Add deferred foreign key constraints (teams.head_coach_id)
      // ===================================================================
      console.log('📝 Adding foreign key constraints...');
      
      // Note: teams.head_coach_id references athletes, but athletes table is created first
      // Since athletes.athlete_id is UUID and not auto-incrementing, we don't need deferred constraints
      // But we do need to add the FK after athletes table exists
      
      await transaction.commit();
      console.log('✅ Successfully completed initial production database setup migration');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error in migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Rolling back initial production database setup migration...');
      console.log('⚠️  Dropping all tables...');
      
      // Drop tables in reverse dependency order
      await queryInterface.dropTable('etl_jobs', { transaction, cascade: true });
      await queryInterface.dropTable('mailing_lists', { transaction, cascade: true });
      await queryInterface.dropTable('erg_tests', { transaction, cascade: true });
      await queryInterface.dropTable('gauntlet_positions', { transaction, cascade: true });
      await queryInterface.dropTable('gauntlet_matches', { transaction, cascade: true });
      await queryInterface.dropTable('gauntlet_seat_assignments', { transaction, cascade: true });
      await queryInterface.dropTable('gauntlet_lineups', { transaction, cascade: true });
      await queryInterface.dropTable('gauntlets', { transaction, cascade: true });
      await queryInterface.dropTable('races', { transaction, cascade: true });
      await queryInterface.dropTable('regatta_registrations', { transaction, cascade: true });
      await queryInterface.dropTable('regattas', { transaction, cascade: true });
      await queryInterface.dropTable('seat_assignments', { transaction, cascade: true });
      await queryInterface.dropTable('lineups', { transaction, cascade: true });
      await queryInterface.dropTable('attendance', { transaction, cascade: true });
      await queryInterface.dropTable('practice_sessions', { transaction, cascade: true });
      await queryInterface.dropTable('team_memberships', { transaction, cascade: true });
      await queryInterface.dropTable('boats', { transaction, cascade: true });
      await queryInterface.dropTable('athletes', { transaction, cascade: true });
      await queryInterface.dropTable('usra_categories', { transaction, cascade: true });
      await queryInterface.dropTable('teams', { transaction, cascade: true });
      
      // Drop ENUM types
      console.log('📝 Dropping ENUM types...');
      const enumTypes = [
        'enum_athletes_type',
        'enum_athletes_gender',
        'enum_athletes_discipline',
        'enum_athletes_side',
        'enum_athletes_competitive_status',
        'enum_athletes_retirement_reason',
        'enum_athletes_ban_reason',
        'enum_boats_type',
        'enum_boats_status',
        'enum_lineups_lineup_type',
        'enum_seat_assignments_side',
        'enum_team_memberships_role',
        'enum_practice_sessions_session_type',
        'enum_attendance_status',
        'enum_regattas_regatta_type',
        'enum_regatta_registrations_status',
        'enum_erg_tests_test_type',
        'enum_gauntlets_boat_type',
        'enum_gauntlets_status',
        'enum_gauntlet_seat_assignments_side',
        'enum_gauntlet_positions_streak_type',
        'enum_etl_jobs_job_type',
        'enum_etl_jobs_status'
      ];
      
      for (const enumType of enumTypes) {
        try {
          await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumType}" CASCADE;`, { transaction });
        } catch (error) {
          console.log(`⚠️  Could not drop enum ${enumType}: ${error.message}`);
        }
      }
      
      await transaction.commit();
      console.log('✅ Successfully rolled back initial production database setup migration');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error rolling back migration:', error);
      throw error;
    }
  }
};
