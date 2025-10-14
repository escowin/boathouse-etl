import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface ETLJobAttributes {
  job_id: string;
  job_type: 'full_etl' | 'incremental_etl' | 'athletes_sync' | 'boats_sync' | 'attendance_sync';
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: Date;
  completed_at?: Date;
  duration_seconds?: number;
  records_processed: number;
  records_failed: number;
  records_created: number;
  records_updated: number;
  error_message?: string;
  error_details?: any;
  metadata?: any;
  created_at: Date;
}

// Define the creation attributes
interface ETLJobCreationAttributes extends Optional<ETLJobAttributes,
  'completed_at' | 'duration_seconds' | 'records_processed' | 'records_failed' |
  'records_created' | 'records_updated' | 'error_message' | 'error_details' |
  'metadata' | 'created_at'
> {}

class ETLJob extends Model<ETLJobAttributes, ETLJobCreationAttributes> implements ETLJobAttributes {
  public job_id!: string;
  public job_type!: 'full_etl' | 'incremental_etl' | 'athletes_sync' | 'boats_sync' | 'attendance_sync';
  public status!: 'running' | 'completed' | 'failed' | 'cancelled';
  public started_at!: Date;
  public completed_at?: Date;
  public duration_seconds?: number;
  public records_processed!: number;
  public records_failed!: number;
  public records_created!: number;
  public records_updated!: number;
  public error_message?: string;
  public error_details?: any;
  public metadata?: any;
  public created_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ETLJob.init(
  {
    job_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    job_type: {
      type: DataTypes.ENUM('full_etl', 'incremental_etl', 'athletes_sync', 'boats_sync', 'attendance_sync'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('running', 'completed', 'failed', 'cancelled'),
      allowNull: false,
    },
    started_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    duration_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    records_processed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    records_failed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    records_created: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    records_updated: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    error_details: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ETLJob',
    tableName: 'etl_jobs',
    timestamps: false, // We're using created_at manually
    indexes: [
      {
        fields: ['status'],
      },
      {
        fields: ['started_at'],
      },
      {
        fields: ['job_type'],
      },
    ],
  }
);

export default ETLJob;
