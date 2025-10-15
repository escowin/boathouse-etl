import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface RegattaAttributes {
  regatta_id: number;
  name: string;
  location?: string;
  body_of_water?: string;
  start_date?: Date;
  end_date?: Date;
  registration_deadline?: Date;
  registration_open: boolean;
  registration_notes?: string;
  regatta_type: 'Local' | 'Regional' | 'National' | 'International' | 'Scrimmage';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Define the creation attributes
interface RegattaCreationAttributes extends Optional<RegattaAttributes,
  'regatta_id' | 'location' | 'body_of_water' | 'start_date' | 'end_date' | 
  'registration_deadline' | 'registration_notes' | 'notes' | 'created_at' | 'updated_at'
> {}

class Regatta extends Model<RegattaAttributes, RegattaCreationAttributes> implements RegattaAttributes {
  public regatta_id!: number;
  public name!: string;
  public location?: string;
  public body_of_water?: string;
  public start_date?: Date;
  public end_date?: Date;
  public registration_deadline?: Date;
  public registration_open!: boolean;
  public registration_notes?: string;
  public regatta_type!: 'Local' | 'Regional' | 'National' | 'International' | 'Scrimmage';
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Regatta.init(
  {
    regatta_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    location: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    body_of_water: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    registration_deadline: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    registration_open: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    registration_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    regatta_type: {
      type: DataTypes.ENUM('Local', 'Regional', 'National', 'International', 'Scrimmage'),
      allowNull: false,
      defaultValue: 'Local',
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
    modelName: 'Regatta',
    tableName: 'regattas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['name'],
      },
      {
        fields: ['start_date'],
      },
      {
        fields: ['registration_open'],
      },
      {
        fields: ['regatta_type'],
      },
    ],
  }
);

export default Regatta;
