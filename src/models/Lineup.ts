import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface LineupAttributes {
  lineup_id: string;
  session_id: string;
  boat_id: string;
  team_id: number;
  lineup_name?: string;
  lineup_type: 'Practice' | 'Race' | 'Test';
  total_weight_kg?: number;
  average_weight_kg?: number;
  average_age?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  etl_source: string;
  etl_last_sync: Date;
}

// Define the creation attributes
interface LineupCreationAttributes extends Optional<LineupAttributes,
  'lineup_name' | 'total_weight_kg' | 'average_weight_kg' | 'average_age' |
  'notes' | 'created_at' | 'updated_at' | 'etl_source' | 'etl_last_sync'
> {}

class Lineup extends Model<LineupAttributes, LineupCreationAttributes> implements LineupAttributes {
  public lineup_id!: string;
  public session_id!: string;
  public boat_id!: string;
  public team_id!: number;
  public lineup_name?: string;
  public lineup_type!: 'Practice' | 'Race' | 'Test';
  public total_weight_kg?: number;
  public average_weight_kg?: number;
  public average_age?: number;
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;
  public etl_source!: string;
  public etl_last_sync!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Lineup.init(
  {
    lineup_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'practice_sessions',
        key: 'session_id',
      },
      onDelete: 'CASCADE',
    },
    boat_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'boats',
        key: 'boat_id',
      },
      onDelete: 'CASCADE',
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'team_id',
      },
    },
    lineup_name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lineup_type: {
      type: DataTypes.ENUM('Practice', 'Race', 'Test'),
      allowNull: false,
    },
    total_weight_kg: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 10000,
      },
    },
    average_weight_kg: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 1000,
      },
    },
    average_age: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true,
      validate: {
        min: 0,
        max: 150,
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
    modelName: 'Lineup',
    tableName: 'lineups',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['session_id'],
      },
      {
        fields: ['boat_id'],
      },
      {
        fields: ['team_id'],
      },
    ],
  }
);

export default Lineup;
