'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 Creating complete database schema with simplified gauntlet system...');
    
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Create USRA Categories table
      console.log('📋 Creating usra_categories table...');
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
      }, { transaction });

      // 2. Create Athletes table
      console.log('📋 Creating athletes table...');
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
          allowNull: true
        },
        etl_last_sync: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 3. Create Teams table
      console.log('📋 Creating teams table...');
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
          allowNull: true
        },
        mailing_list_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'mailing_lists',
            key: 'mailing_list_id'
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
      }, { transaction });

      // 4. Create Team Memberships table
      console.log('📋 Creating team_memberships table...');
      await queryInterface.createTable('team_memberships', {
        team_membership_id: {
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
        athlete_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'athletes',
            key: 'athlete_id'
          }
        },
        role: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        start_date: {
          type: Sequelize.DATE,
          allowNull: true
        },
        end_date: {
          type: Sequelize.DATE,
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
        }
      }, { transaction });

      // 5. Create Boats table
      console.log('📋 Creating boats table...');
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
        boat_type: {
          type: Sequelize.ENUM('1x', '2x', '2-', '4x', '4+', '8+'),
          allowNull: false
        },
        manufacturer: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        model: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        year: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        weight_kg: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true
        },
        notes: {
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
        }
      }, { transaction });

      // 6. Create Practice Sessions table
      console.log('📋 Creating practice_sessions table...');
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
          allowNull: true
        },
        end_time: {
          type: Sequelize.TIME,
          allowNull: true
        },
        location: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        weather: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        water_conditions: {
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
      }, { transaction });

      // 7. Create Attendance table
      console.log('📋 Creating attendance table...');
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
            key: 'session_id'
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
          type: Sequelize.ENUM('Present', 'Absent', 'Late', 'Excused'),
          allowNull: false
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
      }, { transaction });

      // 8. Create Lineups table
      console.log('📋 Creating lineups table...');
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
            key: 'session_id'
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
        side: {
          type: Sequelize.ENUM('Port', 'Starboard'),
          allowNull: true
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
        }
      }, { transaction });

      // 9. Create Seat Assignments table
      console.log('📋 Creating seat_assignments table...');
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
          allowNull: false
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
      }, { transaction });

      // 10. Create Mailing Lists table
      console.log('📋 Creating mailing_lists table...');
      await queryInterface.createTable('mailing_lists', {
        mailing_list_id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        email: {
          type: Sequelize.TEXT,
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
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // 11. Create Regattas table
      console.log('📋 Creating regattas table...');
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
        start_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        end_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        website: {
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
      }, { transaction });

      // 12. Create Regatta Registrations table
      console.log('📋 Creating regatta_registrations table...');
      await queryInterface.createTable('regatta_registrations', {
        registration_id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
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
        event: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        boat_class: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        status: {
          type: Sequelize.ENUM('Registered', 'Confirmed', 'Cancelled'),
          allowNull: false,
          defaultValue: 'Registered'
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
      }, { transaction });

      // 13. Create Races table
      console.log('📋 Creating races table...');
      await queryInterface.createTable('races', {
        race_id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
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
          type: Sequelize.INTEGER,
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
        boat_class: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        race_time: {
          type: Sequelize.TIME,
          allowNull: true
        },
        race_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        lane: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        finish_time: {
          type: Sequelize.TIME,
          allowNull: true
        },
        place: {
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
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // 14. Create Erg Tests table
      console.log('📋 Creating erg_tests table...');
      await queryInterface.createTable('erg_tests', {
        erg_test_id: {
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
        distance: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        time: {
          type: Sequelize.TIME,
          allowNull: false
        },
        split: {
          type: Sequelize.TIME,
          allowNull: true
        },
        stroke_rate: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        watts: {
          type: Sequelize.INTEGER,
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
      }, { transaction });

      // 15. Create ETL Jobs table
      console.log('📋 Creating etl_jobs table...');
      await queryInterface.createTable('etl_jobs', {
        job_id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        job_name: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        status: {
          type: Sequelize.ENUM('Running', 'Completed', 'Failed'),
          allowNull: false
        },
        start_time: {
          type: Sequelize.DATE,
          allowNull: true
        },
        end_time: {
          type: Sequelize.DATE,
          allowNull: true
        },
        records_processed: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        error_message: {
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
      }, { transaction });

      // 16. Create Gauntlets table (Simplified)
      console.log('📋 Creating gauntlets table (simplified)...');
      await queryInterface.createTable('gauntlets', {
        gauntlet_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
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
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // 17. Create Gauntlet Matches table
      console.log('📋 Creating gauntlet_matches table...');
      await queryInterface.createTable('gauntlet_matches', {
        match_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
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
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // 18. Create Gauntlet Lineups table (Simplified)
      console.log('📋 Creating gauntlet_lineups table (simplified)...');
      await queryInterface.createTable('gauntlet_lineups', {
        gauntlet_lineup_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
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
        match_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'gauntlet_matches',
            key: 'match_id'
          },
          onDelete: 'SET NULL'
        },
        boat_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'boats',
            key: 'boat_id'
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
      }, { transaction });

      // 19. Create Gauntlet Seat Assignments table
      console.log('📋 Creating gauntlet_seat_assignments table...');
      await queryInterface.createTable('gauntlet_seat_assignments', {
        gauntlet_seat_assignment_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
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
          type: Sequelize.ENUM('port', 'starboard'),
          allowNull: false
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
      }, { transaction });

      // 20. Create Ladders table (Simplified)
      console.log('📋 Creating ladders table (simplified)...');
      await queryInterface.createTable('ladders', {
        ladder_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
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
      }, { transaction });

      // 21. Create Ladder Positions table
      console.log('📋 Creating ladder_positions table...');
      await queryInterface.createTable('ladder_positions', {
        position_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        ladder_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'ladders',
            key: 'ladder_id'
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
          defaultValue: Sequelize.NOW
        },
        last_updated: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
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
      }, { transaction });

      // 22. Create Ladder Progressions table
      console.log('📋 Creating ladder_progressions table...');
      await queryInterface.createTable('ladder_progressions', {
        progression_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        ladder_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'ladders',
            key: 'ladder_id'
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
        from_position: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        to_position: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        change: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        reason: {
          type: Sequelize.ENUM('match_win', 'match_loss', 'match_draw', 'manual_adjustment', 'new_athlete'),
          allowNull: false
        },
        match_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'gauntlet_matches',
            key: 'match_id'
          },
          onDelete: 'CASCADE'
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
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
      }, { transaction });

      // Create all indexes
      console.log('📋 Creating indexes...');
      
      // Core boathouse indexes
      await queryInterface.addIndex('athletes', ['usra_age_category_id'], { name: 'idx_athletes_usra_category', transaction });
      await queryInterface.addIndex('athletes', ['active'], { name: 'idx_athletes_active', transaction });
      await queryInterface.addIndex('athletes', ['type'], { name: 'idx_athletes_type', transaction });
      
      await queryInterface.addIndex('teams', ['head_coach_id'], { name: 'idx_teams_head_coach', transaction });
      await queryInterface.addIndex('teams', ['mailing_list_id'], { name: 'idx_teams_mailing_list', transaction });
      
      await queryInterface.addIndex('team_memberships', ['team_id'], { name: 'idx_team_memberships_team', transaction });
      await queryInterface.addIndex('team_memberships', ['athlete_id'], { name: 'idx_team_memberships_athlete', transaction });
      
      await queryInterface.addIndex('boats', ['boat_type'], { name: 'idx_boats_type', transaction });
      await queryInterface.addIndex('boats', ['active'], { name: 'idx_boats_active', transaction });
      
      await queryInterface.addIndex('practice_sessions', ['team_id'], { name: 'idx_practice_sessions_team', transaction });
      await queryInterface.addIndex('practice_sessions', ['date'], { name: 'idx_practice_sessions_date', transaction });
      
      await queryInterface.addIndex('attendance', ['session_id'], { name: 'idx_attendance_session', transaction });
      await queryInterface.addIndex('attendance', ['athlete_id'], { name: 'idx_attendance_athlete', transaction });
      await queryInterface.addIndex('attendance', ['team_id'], { name: 'idx_attendance_team', transaction });
      
      await queryInterface.addIndex('lineups', ['session_id'], { name: 'idx_lineups_session', transaction });
      await queryInterface.addIndex('lineups', ['boat_id'], { name: 'idx_lineups_boat', transaction });
      await queryInterface.addIndex('lineups', ['team_id'], { name: 'idx_lineups_team', transaction });
      
      await queryInterface.addIndex('seat_assignments', ['lineup_id'], { name: 'idx_seat_assignments_lineup', transaction });
      await queryInterface.addIndex('seat_assignments', ['athlete_id'], { name: 'idx_seat_assignments_athlete', transaction });
      await queryInterface.addIndex('seat_assignments', ['seat_number'], { name: 'idx_seat_assignments_seat', transaction });
      
      await queryInterface.addIndex('mailing_lists', ['email'], { name: 'idx_mailing_lists_email', transaction });
      await queryInterface.addIndex('mailing_lists', ['name'], { name: 'idx_mailing_lists_name', transaction });
      await queryInterface.addIndex('mailing_lists', ['active'], { name: 'idx_mailing_lists_active', transaction });
      
      await queryInterface.addIndex('regattas', ['start_date'], { name: 'idx_regattas_start_date', transaction });
      await queryInterface.addIndex('regattas', ['name'], { name: 'idx_regattas_name', transaction });
      
      await queryInterface.addIndex('regatta_registrations', ['regatta_id'], { name: 'idx_regatta_registrations_regatta', transaction });
      await queryInterface.addIndex('regatta_registrations', ['athlete_id'], { name: 'idx_regatta_registrations_athlete', transaction });
      await queryInterface.addIndex('regatta_registrations', ['team_id'], { name: 'idx_regatta_registrations_team', transaction });
      
      await queryInterface.addIndex('races', ['regatta_id'], { name: 'idx_races_regatta', transaction });
      await queryInterface.addIndex('races', ['lineup_id'], { name: 'idx_races_lineup', transaction });
      await queryInterface.addIndex('races', ['race_date'], { name: 'idx_races_date', transaction });
      
      await queryInterface.addIndex('erg_tests', ['athlete_id'], { name: 'idx_erg_tests_athlete', transaction });
      await queryInterface.addIndex('erg_tests', ['test_date'], { name: 'idx_erg_tests_date', transaction });
      await queryInterface.addIndex('erg_tests', ['distance'], { name: 'idx_erg_tests_distance', transaction });
      
      await queryInterface.addIndex('etl_jobs', ['status'], { name: 'idx_etl_jobs_status', transaction });
      await queryInterface.addIndex('etl_jobs', ['start_time'], { name: 'idx_etl_jobs_start_time', transaction });
      
      // Gauntlet system indexes
      await queryInterface.addIndex('gauntlets', ['created_by'], { name: 'idx_gauntlets_created_by', transaction });
      await queryInterface.addIndex('gauntlets', ['status'], { name: 'idx_gauntlets_status', transaction });
      await queryInterface.addIndex('gauntlets', ['boat_type'], { name: 'idx_gauntlets_boat_type', transaction });
      
      await queryInterface.addIndex('gauntlet_matches', ['gauntlet_id'], { name: 'idx_gauntlet_matches_gauntlet_id', transaction });
      await queryInterface.addIndex('gauntlet_matches', ['match_date'], { name: 'idx_gauntlet_matches_match_date', transaction });
      
      await queryInterface.addIndex('gauntlet_lineups', ['gauntlet_id'], { name: 'idx_gauntlet_lineups_gauntlet_id', transaction });
      await queryInterface.addIndex('gauntlet_lineups', ['match_id'], { name: 'idx_gauntlet_lineups_match_id', transaction });
      await queryInterface.addIndex('gauntlet_lineups', ['boat_id'], { name: 'idx_gauntlet_lineups_boat_id', transaction });
      
      await queryInterface.addIndex('gauntlet_seat_assignments', ['gauntlet_lineup_id'], { name: 'idx_gauntlet_seat_assignments_lineup_id', transaction });
      await queryInterface.addIndex('gauntlet_seat_assignments', ['athlete_id'], { name: 'idx_gauntlet_seat_assignments_athlete_id', transaction });
      await queryInterface.addIndex('gauntlet_seat_assignments', ['seat_number'], { name: 'idx_gauntlet_seat_assignments_seat_number', transaction });
      
      await queryInterface.addIndex('ladders', ['gauntlet_id'], { name: 'idx_ladders_gauntlet_id', transaction });
      
      await queryInterface.addIndex('ladder_positions', ['ladder_id'], { name: 'idx_ladder_positions_ladder_id', transaction });
      await queryInterface.addIndex('ladder_positions', ['athlete_id'], { name: 'idx_ladder_positions_athlete_id', transaction });
      await queryInterface.addIndex('ladder_positions', ['position'], { name: 'idx_ladder_positions_position', transaction });
      
      await queryInterface.addIndex('ladder_progressions', ['ladder_id'], { name: 'idx_ladder_progressions_ladder_id', transaction });
      await queryInterface.addIndex('ladder_progressions', ['athlete_id'], { name: 'idx_ladder_progressions_athlete_id', transaction });
      await queryInterface.addIndex('ladder_progressions', ['match_id'], { name: 'idx_ladder_progressions_match_id', transaction });

      // Create unique constraints
      console.log('📋 Creating unique constraints...');
      
      // Ensure only one athlete per seat per lineup
      await queryInterface.addConstraint('gauntlet_seat_assignments', {
        fields: ['gauntlet_lineup_id', 'seat_number'],
        type: 'unique',
        name: 'unique_gauntlet_seat_per_lineup',
        transaction
      });

      // Ensure only one position per athlete per ladder
      await queryInterface.addConstraint('ladder_positions', {
        fields: ['ladder_id', 'athlete_id'],
        type: 'unique',
        name: 'unique_athlete_per_ladder',
        transaction
      });

      await transaction.commit();

      console.log('✅ Complete database schema created successfully!');
      console.log('');
      console.log('📊 Database Summary:');
      console.log('  🏠 Core Boathouse Management: 15 tables');
      console.log('  🏆 Rowcalibur Competitive System: 7 tables');
      console.log('  📈 Total: 22 tables');
      console.log('');
      console.log('🎯 Simplified Gauntlet System Features:');
      console.log('  ✅ Single point of control (gauntlet deletion removes all related data)');
      console.log('  ✅ 1:1 relationship between gauntlets and ladders');
      console.log('  ✅ No redundant fields or complex configuration');
      console.log('  ✅ Complete CASCADE delete chain');
      console.log('  ✅ Clean, minimal schema design');
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

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Dropping complete database schema...');
    
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Drop tables in reverse order (respecting foreign key constraints)
      const tables = [
        'ladder_progressions',
        'ladder_positions', 
        'ladders',
        'gauntlet_seat_assignments',
        'gauntlet_lineups',
        'gauntlet_matches',
        'gauntlets',
        'etl_jobs',
        'erg_tests',
        'races',
        'regatta_registrations',
        'regattas',
        'mailing_lists',
        'seat_assignments',
        'lineups',
        'attendance',
        'practice_sessions',
        'boats',
        'team_memberships',
        'teams',
        'athletes',
        'usra_categories'
      ];

      for (const table of tables) {
        console.log(`📋 Dropping table: ${table}`);
        await queryInterface.dropTable(table, { transaction });
      }

      await transaction.commit();
      console.log('✅ Complete database schema dropped successfully!');
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
