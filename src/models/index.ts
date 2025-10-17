import sequelize from '../config/database';

// Import all models
import Athlete from './Athlete';
import Team from './Team';
import Boat from './Boat';
import TeamMembership from './TeamMembership';
import PracticeSession from './PracticeSession';
import Attendance from './Attendance';
import Lineup from './Lineup';
import SeatAssignment from './SeatAssignment';
import ETLJob from './ETLJob';
import UsraCategory from './UsraCategory';
import MailingList from './MailingLists';
import Regatta from './Regatta';
import RegattaRegistration from './RegattaRegistration';
import Race from './Race';
import ErgTest from './ErgTest';
// Rowcalibur models
import Gauntlet from './Gauntlet';
import GauntletMatch from './GauntletMatch';
import GauntletLineup from './GauntletLineup';
import GauntletSeatAssignment from './GauntletSeatAssignment';
import Ladder from './Ladder';
import LadderPosition from './LadderPosition';
import LadderProgression from './LadderProgression';

// Define associations
export function setupAssociations() {
  // Team -> Athlete (Many-to-Many through TeamMembership)
  Team.belongsToMany(Athlete, {
    through: TeamMembership,
    foreignKey: 'team_id',
    otherKey: 'athlete_id',
    as: 'athletes'
  });

  Athlete.belongsToMany(Team, {
    through: TeamMembership,
    foreignKey: 'athlete_id',
    otherKey: 'team_id',
    as: 'teams'
  });

  // TeamMembership associations
  TeamMembership.belongsTo(Team, {
    foreignKey: 'team_id',
    as: 'team'
  });

  TeamMembership.belongsTo(Athlete, {
    foreignKey: 'athlete_id',
    as: 'athlete'
  });

  // Team -> PracticeSession (One-to-Many)
  Team.hasMany(PracticeSession, {
    foreignKey: 'team_id',
    as: 'practice_sessions'
  });

  PracticeSession.belongsTo(Team, {
    foreignKey: 'team_id',
    as: 'team'
  });

  // PracticeSession -> Attendance (One-to-Many)
  PracticeSession.hasMany(Attendance, {
    foreignKey: 'session_id',
    as: 'attendance'
  });

  Attendance.belongsTo(PracticeSession, {
    foreignKey: 'session_id',
    as: 'session'
  });

  // Athlete -> Attendance (One-to-Many)
  Athlete.hasMany(Attendance, {
    foreignKey: 'athlete_id',
    as: 'attendance'
  });

  Attendance.belongsTo(Athlete, {
    foreignKey: 'athlete_id',
    as: 'athlete'
  });

  // Team -> Attendance (One-to-Many)
  Team.hasMany(Attendance, {
    foreignKey: 'team_id',
    as: 'attendance'
  });

  Attendance.belongsTo(Team, {
    foreignKey: 'team_id',
    as: 'team'
  });

  // PracticeSession -> Lineup (One-to-Many)
  PracticeSession.hasMany(Lineup, {
    foreignKey: 'session_id',
    as: 'lineups'
  });

  Lineup.belongsTo(PracticeSession, {
    foreignKey: 'session_id',
    as: 'session'
  });

  // Boat -> Lineup (One-to-Many)
  Boat.hasMany(Lineup, {
    foreignKey: 'boat_id',
    as: 'lineups'
  });

  Lineup.belongsTo(Boat, {
    foreignKey: 'boat_id',
    as: 'boat'
  });

  // Team -> Lineup (One-to-Many)
  Team.hasMany(Lineup, {
    foreignKey: 'team_id',
    as: 'lineups'
  });

  Lineup.belongsTo(Team, {
    foreignKey: 'team_id',
    as: 'team'
  });

  // Lineup -> SeatAssignment (One-to-Many)
  Lineup.hasMany(SeatAssignment, {
    foreignKey: 'lineup_id',
    as: 'seat_assignments'
  });

  SeatAssignment.belongsTo(Lineup, {
    foreignKey: 'lineup_id',
    as: 'lineup'
  });

  // Athlete -> SeatAssignment (One-to-Many)
  Athlete.hasMany(SeatAssignment, {
    foreignKey: 'athlete_id',
    as: 'seat_assignments'
  });

  SeatAssignment.belongsTo(Athlete, {
    foreignKey: 'athlete_id',
    as: 'athlete'
  });

  // Team -> Athlete (Head Coach relationship)
  Team.belongsTo(Athlete, {
    foreignKey: 'head_coach_id',
    as: 'head_coach'
  });

  Athlete.hasMany(Team, {
    foreignKey: 'head_coach_id',
    as: 'coached_teams'
  });

  // Athlete -> UsraCategory (Many-to-One)
  Athlete.belongsTo(UsraCategory, {
    foreignKey: 'usra_age_category_id',
    as: 'usra_age_category'
  });

  UsraCategory.hasMany(Athlete, {
    foreignKey: 'usra_age_category_id',
    as: 'category_athletes'
  });

  // Team -> MailingList (One-to-Zero-or-One)
  Team.hasOne(MailingList, {
    foreignKey: 'team_id',
    as: 'mailing_list'
  });

  MailingList.belongsTo(Team, {
    foreignKey: 'team_id',
    as: 'team'
  });

  // Regatta associations
  // Regatta -> RegattaRegistration (One-to-Many)
  Regatta.hasMany(RegattaRegistration, {
    foreignKey: 'regatta_id',
    as: 'registrations'
  });

  RegattaRegistration.belongsTo(Regatta, {
    foreignKey: 'regatta_id',
    as: 'regatta'
  });

  // Athlete -> RegattaRegistration (One-to-Many)
  Athlete.hasMany(RegattaRegistration, {
    foreignKey: 'athlete_id',
    as: 'regatta_registrations'
  });

  RegattaRegistration.belongsTo(Athlete, {
    foreignKey: 'athlete_id',
    as: 'athlete'
  });

  // Team -> RegattaRegistration (One-to-Many)
  Team.hasMany(RegattaRegistration, {
    foreignKey: 'team_id',
    as: 'regatta_registrations'
  });

  RegattaRegistration.belongsTo(Team, {
    foreignKey: 'team_id',
    as: 'team'
  });

  // Regatta -> Race (One-to-Many)
  Regatta.hasMany(Race, {
    foreignKey: 'regatta_id',
    as: 'races'
  });

  Race.belongsTo(Regatta, {
    foreignKey: 'regatta_id',
    as: 'regatta'
  });

  // Lineup -> Race (One-to-Many)
  Lineup.hasMany(Race, {
    foreignKey: 'lineup_id',
    as: 'races'
  });

  Race.belongsTo(Lineup, {
    foreignKey: 'lineup_id',
    as: 'lineup'
  });

  // Athlete -> ErgTest (One-to-Many)
  Athlete.hasMany(ErgTest, {
    foreignKey: 'athlete_id',
    as: 'erg_tests'
  });

  ErgTest.belongsTo(Athlete, {
    foreignKey: 'athlete_id',
    as: 'athlete'
  });

  // Rowcalibur Gauntlet System associations
  // Athlete -> Gauntlet (One-to-Many) - created_by relationship
  Athlete.hasMany(Gauntlet, {
    foreignKey: 'created_by',
    as: 'created_gauntlets'
  });

  Gauntlet.belongsTo(Athlete, {
    foreignKey: 'created_by',
    as: 'creator'
  });

  // Gauntlet -> GauntletMatch (One-to-Many)
  Gauntlet.hasMany(GauntletMatch, {
    foreignKey: 'gauntlet_id',
    as: 'matches'
  });

  GauntletMatch.belongsTo(Gauntlet, {
    foreignKey: 'gauntlet_id',
    as: 'gauntlet'
  });

  // Gauntlet -> GauntletLineup (One-to-Many)
  Gauntlet.hasMany(GauntletLineup, {
    foreignKey: 'gauntlet_id',
    as: 'gauntlet_lineups'
  });

  GauntletLineup.belongsTo(Gauntlet, {
    foreignKey: 'gauntlet_id',
    as: 'gauntlet'
  });

  // Boat -> GauntletLineup (One-to-Many)
  Boat.hasMany(GauntletLineup, {
    foreignKey: 'boat_id',
    as: 'gauntlet_lineups'
  });

  GauntletLineup.belongsTo(Boat, {
    foreignKey: 'boat_id',
    as: 'boat'
  });

  // Note: Removed Team -> GauntletLineup relationship as team_id was removed from gauntlet_lineups

  // GauntletLineup -> GauntletSeatAssignment (One-to-Many)
  GauntletLineup.hasMany(GauntletSeatAssignment, {
    foreignKey: 'gauntlet_lineup_id',
    as: 'gauntlet_seat_assignments'
  });

  GauntletSeatAssignment.belongsTo(GauntletLineup, {
    foreignKey: 'gauntlet_lineup_id',
    as: 'lineup'
  });

  // Athlete -> GauntletSeatAssignment (One-to-Many)
  Athlete.hasMany(GauntletSeatAssignment, {
    foreignKey: 'athlete_id',
    as: 'gauntlet_seat_assignments'
  });

  GauntletSeatAssignment.belongsTo(Athlete, {
    foreignKey: 'athlete_id',
    as: 'athlete'
  });

  // Gauntlet -> Ladder (One-to-One) - simplified relationship
  Gauntlet.hasOne(Ladder, {
    foreignKey: 'gauntlet_id',
    as: 'ladder'
  });

  Ladder.belongsTo(Gauntlet, {
    foreignKey: 'gauntlet_id',
    as: 'gauntlet'
  });

  // Ladder -> LadderPosition (One-to-Many)
  Ladder.hasMany(LadderPosition, {
    foreignKey: 'ladder_id',
    as: 'positions'
  });

  LadderPosition.belongsTo(Ladder, {
    foreignKey: 'ladder_id',
    as: 'ladder'
  });

  // Athlete -> LadderPosition (One-to-Many)
  Athlete.hasMany(LadderPosition, {
    foreignKey: 'athlete_id',
    as: 'ladder_positions'
  });

  LadderPosition.belongsTo(Athlete, {
    foreignKey: 'athlete_id',
    as: 'athlete'
  });

  // Ladder -> LadderProgression (One-to-Many)
  Ladder.hasMany(LadderProgression, {
    foreignKey: 'ladder_id',
    as: 'progressions'
  });

  LadderProgression.belongsTo(Ladder, {
    foreignKey: 'ladder_id',
    as: 'ladder'
  });

  // Athlete -> LadderProgression (One-to-Many)
  Athlete.hasMany(LadderProgression, {
    foreignKey: 'athlete_id',
    as: 'ladder_progressions'
  });

  LadderProgression.belongsTo(Athlete, {
    foreignKey: 'athlete_id',
    as: 'athlete'
  });

  // GauntletMatch -> LadderProgression (One-to-Many) - optional relationship
  GauntletMatch.hasMany(LadderProgression, {
    foreignKey: 'match_id',
    as: 'ladder_progressions'
  });

  LadderProgression.belongsTo(GauntletMatch, {
    foreignKey: 'match_id',
    as: 'match'
  });
}

// Initialize associations
setupAssociations();

// Export all models and sequelize instance
export {
  sequelize,
  Athlete,
  Team,
  Boat,
  TeamMembership,
  PracticeSession,
  Attendance,
  Lineup,
  SeatAssignment,
  ETLJob,
  UsraCategory,
  MailingList,
  Regatta,
  RegattaRegistration,
  Race,
  ErgTest,
  // Rowcalibur models
  Gauntlet,
  GauntletMatch,
  GauntletLineup,
  GauntletSeatAssignment,
  Ladder,
  LadderPosition,
  LadderProgression
};

export default sequelize;
