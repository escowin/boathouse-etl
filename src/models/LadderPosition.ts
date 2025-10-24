import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface LadderPositionAttributes {
  position_id: string; // Changed to UUID
  ladder_id: string; // Changed to UUID
  athlete_id: string; // UUID reference to athletes
  position: number; // 1-based position (1 = top of ladder)
  previous_position?: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  total_matches: number;
  points: number;
  streak_type: 'win' | 'loss' | 'draw' | 'none';
  streak_count: number;
  last_match_date?: Date;
  joined_date: Date;
  last_updated: Date;
  created_at: Date; // Add missing created_at field
  updated_at: Date; // Add missing updated_at field
}

// Define the creation attributes interface
interface LadderPositionCreationAttributes extends Optional<LadderPositionAttributes, 'position_id' | 'previous_position' | 'wins' | 'losses' | 'draws' | 'win_rate' | 'total_matches' | 'points' | 'streak_type' | 'streak_count' | 'last_match_date' | 'joined_date' | 'last_updated' | 'created_at' | 'updated_at'> {}

// Define the model class
class LadderPosition extends Model<LadderPositionAttributes, LadderPositionCreationAttributes> implements LadderPositionAttributes {
  // Remove public class fields to avoid shadowing Sequelize's attribute getters & setters
  // The attributes are accessible through the model instance without explicit declarations
}

// Initialize the model
LadderPosition.init(
  {
    position_id: {
      type: DataTypes.UUID,
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
    position: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    previous_position: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    wins: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    losses: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    draws: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    win_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    total_matches: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    streak_type: {
      type: DataTypes.ENUM('win', 'loss', 'draw', 'none'),
      allowNull: false,
      defaultValue: 'none'
    },
    streak_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    last_match_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    joined_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'LadderPosition',
    tableName: 'ladder_positions',
    timestamps: false, // Using custom timestamp fields
    indexes: [
      {
        name: 'idx_ladder_positions_ladder_id',
        fields: ['ladder_id']
      },
      {
        name: 'idx_ladder_positions_athlete_id',
        fields: ['athlete_id']
      },
      {
        name: 'idx_ladder_positions_position',
        fields: ['position']
      },
      {
        name: 'idx_ladder_positions_unique',
        fields: ['ladder_id', 'athlete_id'],
        unique: true
      }
    ]
  }
);

export default LadderPosition;
