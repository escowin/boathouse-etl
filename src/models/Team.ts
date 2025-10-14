import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface TeamAttributes {
  team_id: string;
  name: string;
  display_name: string;
  team_type: 'Masters' | 'Juniors' | 'Seniors' | 'Recreational' | 'Competitive';
  age_range_min?: number;
  age_range_max?: number;
  gender_focus?: 'M' | 'F' | 'Mixed';
  skill_level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';
  head_coach_id?: string;
  assistant_coaches?: string[];
  team_notes?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Define the creation attributes
interface TeamCreationAttributes extends Optional<TeamAttributes,
  'team_id' | 'age_range_min' | 'age_range_max' | 'gender_focus' | 'skill_level' |
  'head_coach_id' | 'assistant_coaches' | 'team_notes' | 'active' |
  'created_at' | 'updated_at'
> {}

class Team extends Model<TeamAttributes, TeamCreationAttributes> implements TeamAttributes {
  public team_id!: string;
  public name!: string;
  public display_name!: string;
  public team_type!: 'Masters' | 'Juniors' | 'Seniors' | 'Recreational' | 'Competitive';
  public age_range_min?: number;
  public age_range_max?: number;
  public gender_focus?: 'M' | 'F' | 'Mixed';
  public skill_level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';
  public head_coach_id?: string;
  public assistant_coaches?: string[];
  public team_notes?: string;
  public active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Team.init(
  {
    team_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    display_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    team_type: {
      type: DataTypes.ENUM('Masters', 'Juniors', 'Seniors', 'Recreational', 'Competitive'),
      allowNull: false,
    },
    age_range_min: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 150,
      },
    },
    age_range_max: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 150,
      },
    },
    gender_focus: {
      type: DataTypes.ENUM('M', 'F', 'Mixed'),
      allowNull: true,
    },
    skill_level: {
      type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced', 'Elite'),
      allowNull: true,
    },
    head_coach_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'athletes',
        key: 'athlete_id',
      },
    },
    assistant_coaches: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
      defaultValue: [],
    },
    team_notes: {
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
  },
  {
    sequelize,
    modelName: 'Team',
    tableName: 'teams',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['name'],
        unique: true,
      },
      {
        fields: ['team_type'],
      },
      {
        fields: ['active'],
      },
    ],
  }
);

export default Team;
