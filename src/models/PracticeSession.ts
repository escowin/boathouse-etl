import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface PracticeSessionAttributes {
  session_id: number;
  team_id: number;
  date: Date;
  start_time: string;
  end_time?: string;
  session_type: 'Practice' | 'Race' | 'Erg Test' | 'Meeting' | 'Other';
  location?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Define the creation attributes
interface PracticeSessionCreationAttributes extends Optional<PracticeSessionAttributes,
  'session_id' | 'end_time' | 'location' | 'notes' | 'created_at' | 'updated_at'
> {}

class PracticeSession extends Model<PracticeSessionAttributes, PracticeSessionCreationAttributes> implements PracticeSessionAttributes {
  public session_id!: number;
  public team_id!: number;
  public date!: Date;
  public start_time!: string;
  public end_time?: string;
  public session_type!: 'Practice' | 'Race' | 'Erg Test' | 'Meeting' | 'Other';
  public location?: string;
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PracticeSession.init(
  {
    session_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    team_id: {
      type: DataTypes.INTEGER,
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
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    session_type: {
      type: DataTypes.ENUM('Practice', 'Race', 'Erg Test', 'Meeting', 'Other'),
      allowNull: false,
      defaultValue: 'Practice',
    },
    location: {
      type: DataTypes.TEXT,
      allowNull: true,
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
