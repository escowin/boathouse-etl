import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface AthleteAttributes {
  athlete_id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  type: 'Cox' | 'Rower' | 'Rower & Coxswain';
  gender?: 'M' | 'F';
  birth_year?: number;
  age?: number;
  sweep_scull?: 'Sweep' | 'Scull' | 'Sweep & Scull';
  port_starboard?: 'Starboard' | 'Prefer Starboard' | 'Either' | 'Prefer Port' | 'Port';
  cox_capability?: 'No' | 'Sometimes' | 'Only';
  bow_in_dark?: 'Yes' | 'No' | 'If I have to';
  weight_kg?: number;
  height_cm?: number;
  experience_years?: number;
  usra_age_category_2025?: string;
  usra_age_category_id?: string;
  us_rowing_number?: string;
  emergency_contact?: string;
  emergency_contact_phone?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  etl_source: string;
  etl_last_sync: Date;
}

// Define the creation attributes (optional fields for creation)
interface AthleteCreationAttributes extends Optional<AthleteAttributes, 
  'athlete_id' | 'first_name' | 'last_name' | 'email' | 'phone' | 'gender' | 
  'birth_year' | 'age' | 'sweep_scull' | 'port_starboard' | 'cox_capability' | 
  'bow_in_dark' | 'weight_kg' | 'height_cm' | 'experience_years' | 
  'usra_age_category_2025' | 'usra_age_category_id' | 'us_rowing_number' | 'emergency_contact' | 
  'emergency_contact_phone' | 'active' | 'created_at' | 'updated_at' | 
  'etl_source' | 'etl_last_sync'
> {}

class Athlete extends Model<AthleteAttributes, AthleteCreationAttributes> implements AthleteAttributes {
  public athlete_id!: string;
  public name!: string;
  public first_name?: string;
  public last_name?: string;
  public email?: string;
  public phone?: string;
  public type!: 'Cox' | 'Rower' | 'Rower & Coxswain';
  public gender?: 'M' | 'F';
  public birth_year?: number;
  public age?: number;
  public sweep_scull?: 'Sweep' | 'Scull' | 'Sweep & Scull';
  public port_starboard?: 'Starboard' | 'Prefer Starboard' | 'Either' | 'Prefer Port' | 'Port';
  public cox_capability?: 'No' | 'Sometimes' | 'Only';
  public bow_in_dark?: 'Yes' | 'No' | 'If I have to';
  public weight_kg?: number;
  public height_cm?: number;
  public experience_years?: number;
  public usra_age_category_2025?: string;
  public usra_age_category_id?: string;
  public us_rowing_number?: string;
  public emergency_contact?: string;
  public emergency_contact_phone?: string;
  public active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
  public etl_source!: string;
  public etl_last_sync!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Athlete.init(
  {
    athlete_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    first_name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    last_name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('Cox', 'Rower', 'Rower & Coxswain'),
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('M', 'F'),
      allowNull: true,
    },
    birth_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1900,
        max: new Date().getFullYear(),
      },
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 150,
      },
    },
    sweep_scull: {
      type: DataTypes.ENUM('Sweep', 'Scull', 'Sweep & Scull'),
      allowNull: true,
    },
    port_starboard: {
      type: DataTypes.ENUM('Starboard', 'Prefer Starboard', 'Either', 'Prefer Port', 'Port'),
      allowNull: true,
    },
    cox_capability: {
      type: DataTypes.ENUM('No', 'Sometimes', 'Only'),
      allowNull: true,
    },
    bow_in_dark: {
      type: DataTypes.ENUM('Yes', 'No', 'If I have to'),
      allowNull: true,
    },
    weight_kg: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 1000,
      },
    },
    height_cm: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 300,
      },
    },
    experience_years: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    usra_age_category_2025: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    usra_age_category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'usra_categories',
        key: 'usra_category_id'
      }
    },
    us_rowing_number: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    emergency_contact: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    emergency_contact_phone: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    modelName: 'Athlete',
    tableName: 'athletes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['name'],
      },
      {
        fields: ['type'],
      },
      {
        fields: ['active'],
      },
      {
        fields: ['weight_kg'],
      },
    ],
  }
);

export default Athlete;
