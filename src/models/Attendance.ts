import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface AttendanceAttributes {
  attendance_id: string; // Changed from number to string (UUID)
  session_id: number;
  athlete_id: string;
  status: 'Yes' | 'No' | 'Maybe' | 'Late' | 'Excused' | null;
  notes?: string;
  team_id: number;
  created_at: Date;
  updated_at: Date;
  etl_source: string;
  etl_last_sync: Date;
}

// Define the creation attributes
interface AttendanceCreationAttributes extends Optional<AttendanceAttributes,
  'attendance_id' | 'notes' | 'created_at' | 'updated_at' | 'etl_source' | 'etl_last_sync'
> {}

class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
  public attendance_id!: string; // Changed from number to string (UUID)
  public session_id!: number;
  public athlete_id!: string;
  public status!: 'Yes' | 'No' | 'Maybe' | 'Late' | 'Excused' | null;
  public notes?: string;
  public team_id!: number;
  public created_at!: Date;
  public updated_at!: Date;
  public etl_source!: string;
  public etl_last_sync!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Attendance.init(
  {
    attendance_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    session_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'practice_sessions',
        key: 'session_id',
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
    status: {
      type: DataTypes.ENUM('Yes', 'No', 'Maybe', 'Late', 'Excused'),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'team_id',
      },
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
    modelName: 'Attendance',
    tableName: 'attendance',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['session_id'],
      },
      {
        fields: ['athlete_id'],
      },
      {
        fields: ['team_id'],
      },
      {
        fields: ['status'],
      },
      {
        // Ensure one record per athlete per session
        fields: ['session_id', 'athlete_id'],
        unique: true,
      },
    ],
  }
);

export default Attendance;
