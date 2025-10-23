'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Starting UUID defaults removal migration...');
      
      // Remove default values from all UUID primary key columns
      
      // 1. Athletes table
      console.log('📝 Removing UUID default from athletes.athlete_id...');
      await queryInterface.changeColumn('athletes', 'athlete_id', {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 2. Gauntlets table
      console.log('📝 Removing UUID default from gauntlets.gauntlet_id...');
      await queryInterface.changeColumn('gauntlets', 'gauntlet_id', {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 3. Ladders table
      console.log('📝 Removing UUID default from ladders.ladder_id...');
      await queryInterface.changeColumn('ladders', 'ladder_id', {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 4. Ladder Positions table
      console.log('📝 Removing UUID default from ladder_positions.position_id...');
      await queryInterface.changeColumn('ladder_positions', 'position_id', {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 5. Ladder Progressions table
      console.log('📝 Removing UUID default from ladder_progressions.progression_id...');
      await queryInterface.changeColumn('ladder_progressions', 'progression_id', {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 6. Gauntlet Lineups table
      console.log('📝 Removing UUID default from gauntlet_lineups.gauntlet_lineup_id...');
      await queryInterface.changeColumn('gauntlet_lineups', 'gauntlet_lineup_id', {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 7. Gauntlet Seat Assignments table
      console.log('📝 Removing UUID default from gauntlet_seat_assignments.gauntlet_seat_assignment_id...');
      await queryInterface.changeColumn('gauntlet_seat_assignments', 'gauntlet_seat_assignment_id', {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 8. Gauntlet Matches table
      console.log('📝 Removing UUID default from gauntlet_matches.match_id...');
      await queryInterface.changeColumn('gauntlet_matches', 'match_id', {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 9. Boats table
      console.log('📝 Removing UUID default from boats.boat_id...');
      await queryInterface.changeColumn('boats', 'boat_id', {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 10. Races table
      console.log('📝 Removing UUID default from races.race_id...');
      await queryInterface.changeColumn('races', 'race_id', {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 11. Regatta Registrations table
      console.log('📝 Removing UUID default from regatta_registrations.registration_id...');
      await queryInterface.changeColumn('regatta_registrations', 'registration_id', {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 12. Seat Assignments table
      console.log('📝 Removing UUID default from seat_assignments.seat_assignment_id...');
      await queryInterface.changeColumn('seat_assignments', 'seat_assignment_id', {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 13. Attendance table
      console.log('📝 Removing UUID default from attendance.attendance_id...');
      await queryInterface.changeColumn('attendance', 'attendance_id', {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 14. Lineups table
      console.log('📝 Removing UUID default from lineups.lineup_id...');
      await queryInterface.changeColumn('lineups', 'lineup_id', {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      }, { transaction });

      await transaction.commit();
      console.log('✅ UUID defaults removal migration completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ UUID defaults removal migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Reverting UUID defaults removal migration...');
      
      // Restore default values for all UUID primary key columns
      
      // 1. Athletes table
      console.log('📝 Restoring UUID default for athletes.athlete_id...');
      await queryInterface.changeColumn('athletes', 'athlete_id', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 2. Gauntlets table
      console.log('📝 Restoring UUID default for gauntlets.gauntlet_id...');
      await queryInterface.changeColumn('gauntlets', 'gauntlet_id', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 3. Ladders table
      console.log('📝 Restoring UUID default for ladders.ladder_id...');
      await queryInterface.changeColumn('ladders', 'ladder_id', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 4. Ladder Positions table
      console.log('📝 Restoring UUID default for ladder_positions.position_id...');
      await queryInterface.changeColumn('ladder_positions', 'position_id', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 5. Ladder Progressions table
      console.log('📝 Restoring UUID default for ladder_progressions.progression_id...');
      await queryInterface.changeColumn('ladder_progressions', 'progression_id', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 6. Gauntlet Lineups table
      console.log('📝 Restoring UUID default for gauntlet_lineups.gauntlet_lineup_id...');
      await queryInterface.changeColumn('gauntlet_lineups', 'gauntlet_lineup_id', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 7. Gauntlet Seat Assignments table
      console.log('📝 Restoring UUID default for gauntlet_seat_assignments.gauntlet_seat_assignment_id...');
      await queryInterface.changeColumn('gauntlet_seat_assignments', 'gauntlet_seat_assignment_id', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 8. Gauntlet Matches table
      console.log('📝 Restoring UUID default for gauntlet_matches.match_id...');
      await queryInterface.changeColumn('gauntlet_matches', 'match_id', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 9. Boats table
      console.log('📝 Restoring UUID default for boats.boat_id...');
      await queryInterface.changeColumn('boats', 'boat_id', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 10. Races table
      console.log('📝 Restoring UUID default for races.race_id...');
      await queryInterface.changeColumn('races', 'race_id', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 11. Regatta Registrations table
      console.log('📝 Restoring UUID default for regatta_registrations.registration_id...');
      await queryInterface.changeColumn('regatta_registrations', 'registration_id', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 12. Seat Assignments table
      console.log('📝 Restoring UUID default for seat_assignments.seat_assignment_id...');
      await queryInterface.changeColumn('seat_assignments', 'seat_assignment_id', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 13. Attendance table
      console.log('📝 Restoring UUID default for attendance.attendance_id...');
      await queryInterface.changeColumn('attendance', 'attendance_id', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      }, { transaction });
      
      // 14. Lineups table
      console.log('📝 Restoring UUID default for lineups.lineup_id...');
      await queryInterface.changeColumn('lineups', 'lineup_id', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      }, { transaction });

      await transaction.commit();
      console.log('✅ UUID defaults restoration migration completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ UUID defaults restoration migration failed:', error);
      throw error;
    }
  }
};
