import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface SeatAssignmentAttributes {
  seat_assignment_id: string; // Changed from number to string (UUID)
  lineup_id: string; // Changed from number to string (UUID) - references lineup.lineup_id
  athlete_id: string;
  seat_number: number;
  side?: 'Port' | 'Starboard';
  created_at: Date;
  updated_at: Date;
}

// Define the creation attributes
interface SeatAssignmentCreationAttributes extends Optional<SeatAssignmentAttributes,
  'seat_assignment_id' | 'side' | 'created_at' | 'updated_at'
> {}

class SeatAssignment extends Model<SeatAssignmentAttributes, SeatAssignmentCreationAttributes> implements SeatAssignmentAttributes {
  public seat_assignment_id!: string; // Changed from number to string (UUID)
  public lineup_id!: string; // Changed from number to string (UUID)
  public athlete_id!: string;
  public seat_number!: number;
  public side?: 'Port' | 'Starboard';
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SeatAssignment.init(
  {
    seat_assignment_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    lineup_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'lineups',
        key: 'lineup_id',
      },
      onDelete: 'CASCADE',
    },
    athlete_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'athletes',
        key: 'athlete_id',
      },
      onDelete: 'CASCADE',
    },
    seat_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    side: {
      type: DataTypes.ENUM('Port', 'Starboard'),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'SeatAssignment',
    tableName: 'seat_assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['lineup_id'],
      },
      {
        fields: ['athlete_id'],
      },
      {
        // Ensure one athlete per seat per lineup
        fields: ['lineup_id', 'seat_number'],
        unique: true,
      },
    ],
  }
);

export default SeatAssignment;
