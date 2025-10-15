'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Create gauntlets table
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
        configuration: {
          type: Sequelize.JSONB,
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

      // Create gauntlet_lineups table (referenced by GauntletSeatAssignment)
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
          allowNull: true,
          references: {
            model: 'teams',
            key: 'team_id'
          }
        },
        name: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        description: {
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

      // Create gauntlet_matches table
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
          }
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

      // Create gauntlet_seat_assignments table
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
          }
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

      // Create ladders table
      await queryInterface.createTable('ladders', {
        ladder_id: {
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
          type: Sequelize.ENUM('1x', '2x', '2-', '4+', '8+'),
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
        settings: {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: {}
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

      // Create ladder_positions table
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
        }
      }, { transaction });

      // Create ladder_progressions table
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
          }
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // Add indexes for gauntlets table
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

      // Add indexes for gauntlet_lineups table
      await queryInterface.addIndex('gauntlet_lineups', ['gauntlet_id'], {
        name: 'idx_gauntlet_lineups_gauntlet_id',
        transaction
      });
      await queryInterface.addIndex('gauntlet_lineups', ['boat_id'], {
        name: 'idx_gauntlet_lineups_boat_id',
        transaction
      });
      await queryInterface.addIndex('gauntlet_lineups', ['team_id'], {
        name: 'idx_gauntlet_lineups_team_id',
        transaction
      });

      // Add indexes for gauntlet_matches table
      await queryInterface.addIndex('gauntlet_matches', ['gauntlet_id'], {
        name: 'idx_gauntlet_matches_gauntlet_id',
        transaction
      });
      await queryInterface.addIndex('gauntlet_matches', ['match_date'], {
        name: 'idx_gauntlet_matches_match_date',
        transaction
      });

      // Add indexes for gauntlet_seat_assignments table
      await queryInterface.addIndex('gauntlet_seat_assignments', ['gauntlet_lineup_id'], {
        transaction
      });
      await queryInterface.addIndex('gauntlet_seat_assignments', ['athlete_id'], {
        transaction
      });
      await queryInterface.addIndex('gauntlet_seat_assignments', ['seat_number'], {
        transaction
      });
      // Unique constraint: one athlete per seat per lineup
      await queryInterface.addIndex('gauntlet_seat_assignments', ['gauntlet_lineup_id', 'seat_number'], {
        unique: true,
        transaction
      });

      // Add indexes for ladders table
      await queryInterface.addIndex('ladders', ['type'], {
        name: 'idx_ladders_type',
        transaction
      });
      await queryInterface.addIndex('ladders', ['created_by'], {
        name: 'idx_ladders_created_by',
        transaction
      });

      // Add indexes for ladder_positions table
      await queryInterface.addIndex('ladder_positions', ['ladder_id'], {
        name: 'idx_ladder_positions_ladder_id',
        transaction
      });
      await queryInterface.addIndex('ladder_positions', ['athlete_id'], {
        name: 'idx_ladder_positions_athlete_id',
        transaction
      });
      await queryInterface.addIndex('ladder_positions', ['position'], {
        name: 'idx_ladder_positions_position',
        transaction
      });
      // Unique constraint: one position per athlete per ladder
      await queryInterface.addIndex('ladder_positions', ['ladder_id', 'athlete_id'], {
        unique: true,
        name: 'idx_ladder_positions_unique',
        transaction
      });

      // Add indexes for ladder_progressions table
      await queryInterface.addIndex('ladder_progressions', ['ladder_id'], {
        name: 'idx_ladder_progressions_ladder_id',
        transaction
      });
      await queryInterface.addIndex('ladder_progressions', ['athlete_id'], {
        name: 'idx_ladder_progressions_athlete_id',
        transaction
      });
      await queryInterface.addIndex('ladder_progressions', ['match_id'], {
        name: 'idx_ladder_progressions_match_id',
        transaction
      });

      await transaction.commit();
      console.log('✅ Gauntlet and Ladder tables created successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error creating Gauntlet and Ladder tables:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Drop tables in reverse order due to foreign key constraints
      await queryInterface.dropTable('ladder_progressions', { transaction });
      await queryInterface.dropTable('ladder_positions', { transaction });
      await queryInterface.dropTable('ladders', { transaction });
      await queryInterface.dropTable('gauntlet_seat_assignments', { transaction });
      await queryInterface.dropTable('gauntlet_matches', { transaction });
      await queryInterface.dropTable('gauntlet_lineups', { transaction });
      await queryInterface.dropTable('gauntlets', { transaction });

      await transaction.commit();
      console.log('✅ Gauntlet and Ladder tables dropped successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error dropping Gauntlet and Ladder tables:', error);
      throw error;
    }
  }
};
