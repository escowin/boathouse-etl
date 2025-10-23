import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface RaceAttributes {
  race_id: string; // Changed from number to string (UUID)
  regatta_id: number;
  lineup_id?: string; // Changed from number to string (UUID) to match Lineup model
  event_name: string;
  race_date?: Date;
  race_time?: string;
  distance_meters: number;
  result_time_seconds?: number;
  placement?: number;
  total_entries?: number;
  lane_number?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Define the creation attributes
interface RaceCreationAttributes extends Optional<RaceAttributes,
  'race_id' | 'lineup_id' | 'race_date' | 'race_time' | 'result_time_seconds' | 
  'placement' | 'total_entries' | 'lane_number' | 'notes' | 'created_at' | 'updated_at'
> {}

class Race extends Model<RaceAttributes, RaceCreationAttributes> implements RaceAttributes {
  public race_id!: string; // Changed from number to string (UUID)
  public regatta_id!: number;
  public lineup_id?: string; // Changed from number to string (UUID) to match Lineup model
  public event_name!: string;
  public race_date?: Date;
  public race_time?: string;
  public distance_meters!: number;
  public result_time_seconds?: number;
  public placement?: number;
  public total_entries?: number;
  public lane_number?: number;
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Race.init(
  {
    race_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    regatta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'regattas',
        key: 'regatta_id',
      },
    },
    lineup_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'lineups',
        key: 'lineup_id',
      },
    },
    event_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    race_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    race_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    distance_meters: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2000,
      validate: {
        min: 0,
      },
    },
    result_time_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    placement: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
      },
    },
    total_entries: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
      },
    },
    lane_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 8, // Most regattas have max 8 lanes
      },
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
  },
  {
    sequelize,
    modelName: 'Race',
    tableName: 'races',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['regatta_id'],
      },
      {
        fields: ['lineup_id'],
      },
      {
        fields: ['race_date'],
      },
      {
        fields: ['event_name'],
      },
    ],
  }
);

export default Race;
