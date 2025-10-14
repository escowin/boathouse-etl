import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface SeatAssignmentAttributes {
  assignment_id: string;
  lineup_id: string;
  athlete_id: string;
  seat_number: number;
  is_coxswain: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  etl_source: string;
  etl_last_sync: Date;
}

// Define the creation attributes
interface SeatAssignmentCreationAttributes extends Optional<SeatAssignmentAttributes,
  'is_coxswain' | 'notes' | 'created_at' | 'updated_at' | 'etl_source' | 'etl_last_sync'
> {}

class SeatAssignment extends Model<SeatAssignmentAttributes, SeatAssignmentCreationAttributes> implements SeatAssignmentAttributes {
  public assignment_id!: string;
  public lineup_id!: string;
  public athlete_id!: string;
  public seat_number!: number;
  public is_coxswain!: boolean;
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;
  public etl_source!: string;
  public etl_last_sync!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SeatAssignment.init(
  {
    assignment_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
      validate: {
        min: 1,
        max: 9,
      },
    },
    is_coxswain: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    notes: {
      type: DataTypes.TEXT,
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
    etl_source: {
      type: DataTypes.TEXT,
      defaultValue: 'google_sheets',
    },
    etl_last_sync: {
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
