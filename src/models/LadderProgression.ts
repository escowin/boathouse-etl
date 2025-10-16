import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface LadderProgressionAttributes {
  progression_id: string; // Changed to UUID
  ladder_id: string; // Changed to UUID
  athlete_id: string; // UUID reference to athletes
  from_position: number;
  to_position: number;
  change: number; // Positive = moved up, Negative = moved down
  reason: 'match_win' | 'match_loss' | 'match_draw' | 'manual_adjustment' | 'new_athlete';
  match_id?: string; // Optional reference to gauntlet_matches (changed to UUID)
  notes?: string;
  date: Date;
}

// Define the creation attributes interface
interface LadderProgressionCreationAttributes extends Optional<LadderProgressionAttributes, 'progression_id' | 'match_id' | 'notes' | 'date'> {}

// Define the model class
class LadderProgression extends Model<LadderProgressionAttributes, LadderProgressionCreationAttributes> implements LadderProgressionAttributes {
  public progression_id!: string;
  public ladder_id!: string;
  public athlete_id!: string;
  public from_position!: number;
  public to_position!: number;
  public change!: number;
  public reason!: 'match_win' | 'match_loss' | 'match_draw' | 'manual_adjustment' | 'new_athlete';
  public match_id?: string;
  public notes?: string;
  public date!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
LadderProgression.init(
  {
    progression_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    ladder_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'ladders',
        key: 'ladder_id'
      },
      onDelete: 'CASCADE'
    },
    athlete_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'athletes',
        key: 'athlete_id'
      },
      onDelete: 'CASCADE'
    },
    from_position: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    to_position: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    change: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reason: {
      type: DataTypes.ENUM('match_win', 'match_loss', 'match_draw', 'manual_adjustment', 'new_athlete'),
      allowNull: false
    },
    match_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'gauntlet_matches',
        key: 'match_id'
      },
      onDelete: 'CASCADE'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'LadderProgression',
    tableName: 'ladder_progressions',
    timestamps: false, // Using custom date field
    indexes: [
      {
        name: 'idx_ladder_progressions_ladder_id',
        fields: ['ladder_id']
      },
      {
        name: 'idx_ladder_progressions_athlete_id',
        fields: ['athlete_id']
      },
      {
        name: 'idx_ladder_progressions_match_id',
        fields: ['match_id']
      }
    ]
  }
);

export default LadderProgression;
