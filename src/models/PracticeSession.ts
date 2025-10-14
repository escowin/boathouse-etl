import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface PracticeSessionAttributes {
  session_id: string;
  team_id: string;
  date: Date;
  start_time?: string;
  end_time?: string;
  location?: string;
  session_type: 'Practice' | 'Scrimmage' | 'Test' | 'Regatta' | 'Team Building';
  session_name?: string;
  focus_area?: string;
  notes?: string;
  weather_conditions?: string;
  created_at: Date;
  updated_at: Date;
  etl_source: string;
  etl_last_sync: Date;
}

// Define the creation attributes
interface PracticeSessionCreationAttributes extends Optional<PracticeSessionAttributes,
  'start_time' | 'end_time' | 'location' | 'session_name' | 'focus_area' |
  'notes' | 'weather_conditions' | 'created_at' | 'updated_at' |
  'etl_source' | 'etl_last_sync'
> {}

class PracticeSession extends Model<PracticeSessionAttributes, PracticeSessionCreationAttributes> implements PracticeSessionAttributes {
  public session_id!: string;
  public team_id!: string;
  public date!: Date;
  public start_time?: string;
  public end_time?: string;
  public location?: string;
  public session_type!: 'Practice' | 'Scrimmage' | 'Test' | 'Regatta' | 'Team Building';
  public session_name?: string;
  public focus_area?: string;
  public notes?: string;
  public weather_conditions?: string;
  public created_at!: Date;
  public updated_at!: Date;
  public etl_source!: string;
  public etl_last_sync!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PracticeSession.init(
  {
    session_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    team_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'team_id',
      },
      onDelete: 'CASCADE',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    location: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    session_type: {
      type: DataTypes.ENUM('Practice', 'Scrimmage', 'Test', 'Regatta', 'Team Building'),
      allowNull: false,
    },
    session_name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    focus_area: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    weather_conditions: {
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
    modelName: 'PracticeSession',
    tableName: 'practice_sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['team_id'],
      },
      {
        fields: ['date'],
      },
      {
        fields: ['team_id', 'date'],
      },
    ],
  }
);

export default PracticeSession;
