import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface ErgTestAttributes {
  test_id: number;
  athlete_id: string;
  test_date: Date;
  test_type: '2K' | '5K' | '1K' | '6K' | '10K' | '30min' | '1hour';
  distance_meters?: number;
  time_seconds?: number;
  split_seconds?: number;
  watts?: number;
  calories?: number;
  notes?: string;
  test_conditions?: string;
  created_at: Date;
  updated_at: Date;
}

// Define the creation attributes
interface ErgTestCreationAttributes extends Optional<ErgTestAttributes,
  'test_id' | 'distance_meters' | 'time_seconds' | 'split_seconds' | 'watts' | 
  'calories' | 'notes' | 'test_conditions' | 'created_at' | 'updated_at'
> {}

class ErgTest extends Model<ErgTestAttributes, ErgTestCreationAttributes> implements ErgTestAttributes {
  public test_id!: number;
  public athlete_id!: string;
  public test_date!: Date;
  public test_type!: '2K' | '5K' | '1K' | '6K' | '10K' | '30min' | '1hour';
  public distance_meters?: number;
  public time_seconds?: number;
  public split_seconds?: number;
  public watts?: number;
  public calories?: number;
  public notes?: string;
  public test_conditions?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ErgTest.init(
  {
    test_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    athlete_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'athletes',
        key: 'athlete_id',
      },
    },
    test_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    test_type: {
      type: DataTypes.ENUM('2K', '5K', '1K', '6K', '10K', '30min', '1hour'),
      allowNull: false,
    },
    distance_meters: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    time_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    split_seconds: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    watts: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    calories: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    test_conditions: {
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
    modelName: 'ErgTest',
    tableName: 'erg_tests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['athlete_id'],
      },
      {
        fields: ['test_date'],
      },
      {
        fields: ['test_type'],
      },
      {
        // Composite index for athlete performance tracking
        fields: ['athlete_id', 'test_type', 'test_date'],
      },
    ],
  }
);

export default ErgTest;
