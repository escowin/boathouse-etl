'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Starting CASCADE delete constraints migration...');
      
      // Drop existing foreign key constraints and recreate them with CASCADE delete
      
      // 1. Gauntlet -> GauntletMatch
      console.log('📝 Updating gauntlet_matches foreign key constraint...');
      await queryInterface.removeConstraint('gauntlet_matches', 'gauntlet_matches_gauntlet_id_fkey', { transaction });
      await queryInterface.addConstraint('gauntlet_matches', {
        fields: ['gauntlet_id'],
        type: 'foreign key',
        name: 'gauntlet_matches_gauntlet_id_fkey',
        references: {
          table: 'gauntlets',
          field: 'gauntlet_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }, { transaction });

      // 2. Gauntlet -> GauntletLineup
      console.log('📝 Updating gauntlet_lineups foreign key constraint...');
      await queryInterface.removeConstraint('gauntlet_lineups', 'gauntlet_lineups_gauntlet_id_fkey', { transaction });
      await queryInterface.addConstraint('gauntlet_lineups', {
        fields: ['gauntlet_id'],
        type: 'foreign key',
        name: 'gauntlet_lineups_gauntlet_id_fkey',
        references: {
          table: 'gauntlets',
          field: 'gauntlet_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }, { transaction });

      // 3. GauntletLineup -> GauntletSeatAssignment
      console.log('📝 Updating gauntlet_seat_assignments foreign key constraint...');
      await queryInterface.removeConstraint('gauntlet_seat_assignments', 'gauntlet_seat_assignments_gauntlet_lineup_id_fkey', { transaction });
      await queryInterface.addConstraint('gauntlet_seat_assignments', {
        fields: ['gauntlet_lineup_id'],
        type: 'foreign key',
        name: 'gauntlet_seat_assignments_gauntlet_lineup_id_fkey',
        references: {
          table: 'gauntlet_lineups',
          field: 'gauntlet_lineup_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }, { transaction });

      // 4. Gauntlet -> Ladder
      console.log('📝 Updating ladders foreign key constraint...');
      await queryInterface.removeConstraint('ladders', 'ladders_gauntlet_id_fkey', { transaction });
      await queryInterface.addConstraint('ladders', {
        fields: ['gauntlet_id'],
        type: 'foreign key',
        name: 'ladders_gauntlet_id_fkey',
        references: {
          table: 'gauntlets',
          field: 'gauntlet_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }, { transaction });

      // 5. Ladder -> LadderPosition
      console.log('📝 Updating ladder_positions foreign key constraint...');
      await queryInterface.removeConstraint('ladder_positions', 'ladder_positions_ladder_id_fkey', { transaction });
      await queryInterface.addConstraint('ladder_positions', {
        fields: ['ladder_id'],
        type: 'foreign key',
        name: 'ladder_positions_ladder_id_fkey',
        references: {
          table: 'ladders',
          field: 'ladder_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }, { transaction });

      // 6. Ladder -> LadderProgression
      console.log('📝 Updating ladder_progressions foreign key constraint...');
      await queryInterface.removeConstraint('ladder_progressions', 'ladder_progressions_ladder_id_fkey', { transaction });
      await queryInterface.addConstraint('ladder_progressions', {
        fields: ['ladder_id'],
        type: 'foreign key',
        name: 'ladder_progressions_ladder_id_fkey',
        references: {
          table: 'ladders',
          field: 'ladder_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }, { transaction });

      // 7. GauntletMatch -> LadderProgression (optional relationship)
      console.log('📝 Updating ladder_progressions match_id foreign key constraint...');
      await queryInterface.removeConstraint('ladder_progressions', 'ladder_progressions_match_id_fkey', { transaction });
      await queryInterface.addConstraint('ladder_progressions', {
        fields: ['match_id'],
        type: 'foreign key',
        name: 'ladder_progressions_match_id_fkey',
        references: {
          table: 'gauntlet_matches',
          field: 'match_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }, { transaction });

      await transaction.commit();
      console.log('✅ CASCADE delete constraints migration completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ CASCADE delete constraints migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Reverting CASCADE delete constraints migration...');
      
      // Revert to original constraints without CASCADE delete
      
      // 1. Gauntlet -> GauntletMatch
      await queryInterface.removeConstraint('gauntlet_matches', 'gauntlet_matches_gauntlet_id_fkey', { transaction });
      await queryInterface.addConstraint('gauntlet_matches', {
        fields: ['gauntlet_id'],
        type: 'foreign key',
        name: 'gauntlet_matches_gauntlet_id_fkey',
        references: {
          table: 'gauntlets',
          field: 'gauntlet_id'
        }
      }, { transaction });

      // 2. Gauntlet -> GauntletLineup
      await queryInterface.removeConstraint('gauntlet_lineups', 'gauntlet_lineups_gauntlet_id_fkey', { transaction });
      await queryInterface.addConstraint('gauntlet_lineups', {
        fields: ['gauntlet_id'],
        type: 'foreign key',
        name: 'gauntlet_lineups_gauntlet_id_fkey',
        references: {
          table: 'gauntlets',
          field: 'gauntlet_id'
        }
      }, { transaction });

      // 3. GauntletLineup -> GauntletSeatAssignment
      await queryInterface.removeConstraint('gauntlet_seat_assignments', 'gauntlet_seat_assignments_gauntlet_lineup_id_fkey', { transaction });
      await queryInterface.addConstraint('gauntlet_seat_assignments', {
        fields: ['gauntlet_lineup_id'],
        type: 'foreign key',
        name: 'gauntlet_seat_assignments_gauntlet_lineup_id_fkey',
        references: {
          table: 'gauntlet_lineups',
          field: 'gauntlet_lineup_id'
        }
      }, { transaction });

      // 4. Gauntlet -> Ladder
      await queryInterface.removeConstraint('ladders', 'ladders_gauntlet_id_fkey', { transaction });
      await queryInterface.addConstraint('ladders', {
        fields: ['gauntlet_id'],
        type: 'foreign key',
        name: 'ladders_gauntlet_id_fkey',
        references: {
          table: 'gauntlets',
          field: 'gauntlet_id'
        }
      }, { transaction });

      // 5. Ladder -> LadderPosition
      await queryInterface.removeConstraint('ladder_positions', 'ladder_positions_ladder_id_fkey', { transaction });
      await queryInterface.addConstraint('ladder_positions', {
        fields: ['ladder_id'],
        type: 'foreign key',
        name: 'ladder_positions_ladder_id_fkey',
        references: {
          table: 'ladders',
          field: 'ladder_id'
        }
      }, { transaction });

      // 6. Ladder -> LadderProgression
      await queryInterface.removeConstraint('ladder_progressions', 'ladder_progressions_ladder_id_fkey', { transaction });
      await queryInterface.addConstraint('ladder_progressions', {
        fields: ['ladder_id'],
        type: 'foreign key',
        name: 'ladder_progressions_ladder_id_fkey',
        references: {
          table: 'ladders',
          field: 'ladder_id'
        }
      }, { transaction });

      // 7. GauntletMatch -> LadderProgression
      await queryInterface.removeConstraint('ladder_progressions', 'ladder_progressions_match_id_fkey', { transaction });
      await queryInterface.addConstraint('ladder_progressions', {
        fields: ['match_id'],
        type: 'foreign key',
        name: 'ladder_progressions_match_id_fkey',
        references: {
          table: 'gauntlet_matches',
          field: 'match_id'
        }
      }, { transaction });

      await transaction.commit();
      console.log('✅ CASCADE delete constraints migration reverted successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ CASCADE delete constraints migration revert failed:', error);
      throw error;
    }
  }
};
