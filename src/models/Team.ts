import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface TeamAttributes {
  team_id: number;
  name: string;
  team_type?: string;
  description?: string;
  head_coach_id?: string;
  assistant_coaches?: string[];
  mailing_list_id?: number;
  created_at: Date;
  updated_at: Date;
}

// Define the creation attributes
interface TeamCreationAttributes extends Optional<TeamAttributes,
  'team_id' | 'team_type' | 'description' | 'head_coach_id' | 'assistant_coaches' | 'mailing_list_id' |
  'created_at' | 'updated_at'
> {}

class Team extends Model<TeamAttributes, TeamCreationAttributes> implements TeamAttributes {
  public team_id!: number;
  public name!: string;
  public team_type?: string;
  public description?: string;
  public head_coach_id?: string;
  public assistant_coaches?: string[];
  public mailing_list_id?: number;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Team.init(
  {
    team_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    team_type: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
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
    mailing_list_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'mailing_lists',
        key: 'mailing_list_id',
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
      },
      {
        fields: ['team_type'],
      },
      {
        fields: ['mailing_list_id'],
      },
    ],
  }
);

export default Team;
