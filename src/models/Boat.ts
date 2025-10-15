import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface BoatAttributes {
  boat_id: string;
  name: string;
  type: 'Single' | 'Double' | 'Pair' | 'Quad' | 'Four' | 'Eight';
  status: 'Available' | 'Reserved' | 'In Use' | 'Maintenance' | 'Retired';
  description?: string;
  min_weight_kg?: number;
  max_weight_kg?: number;
  rigging_type?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  etl_source: string;
  etl_last_sync: Date;
}

// Define the creation attributes
interface BoatCreationAttributes extends Optional<BoatAttributes,
  'boat_id' | 'status' | 'description' | 'min_weight_kg' | 'max_weight_kg' |
  'rigging_type' | 'notes' | 'created_at' | 'updated_at' |
  'etl_source' | 'etl_last_sync'
> {}

class Boat extends Model<BoatAttributes, BoatCreationAttributes> implements BoatAttributes {
  public boat_id!: string;
  public name!: string;
  public type!: 'Single' | 'Double' | 'Pair' | 'Quad' | 'Four' | 'Eight';
  public status!: 'Available' | 'Reserved' | 'In Use' | 'Maintenance' | 'Retired';
  public description?: string;
  public min_weight_kg?: number;
  public max_weight_kg?: number;
  public rigging_type?: string;
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;
  public etl_source!: string;
  public etl_last_sync!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Boat.init(
  {
    boat_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM('Single', 'Double', 'Pair', 'Quad', 'Four', 'Eight'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Available', 'Reserved', 'In Use', 'Maintenance', 'Retired'),
      defaultValue: 'Available',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    min_weight_kg: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 1000,
      },
    },
    max_weight_kg: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 1000,
      },
    },
    rigging_type: {
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
    modelName: 'Boat',
    tableName: 'boats',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['name'],
        unique: true,
      },
      {
        fields: ['type'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default Boat;
