import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface TeamMembershipAttributes {
  membership_id: number;
  athlete_id: string;
  team_id: number;
  role: 'Member' | 'Captain' | 'Coach' | 'Admin';
  joined_at: Date;
  left_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Define the creation attributes
interface TeamMembershipCreationAttributes extends Optional<TeamMembershipAttributes,
  'membership_id' | 'left_at' | 'created_at' | 'updated_at'
> {}

class TeamMembership extends Model<TeamMembershipAttributes, TeamMembershipCreationAttributes> implements TeamMembershipAttributes {
  public membership_id!: number;
  public athlete_id!: string;
  public team_id!: number;
  public role!: 'Member' | 'Captain' | 'Coach' | 'Admin';
  public joined_at!: Date;
  public left_at?: Date;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TeamMembership.init(
  {
    membership_id: {
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
    athlete_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'athletes',
        key: 'athlete_id',
      },
      onDelete: 'CASCADE',
    },
    role: {
      type: DataTypes.ENUM('Athlete', 'Captain', 'Coach', 'Assistant Coach', 'Secretary'),
      allowNull: false,
      defaultValue: 'Athlete',
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    left_at: {
      type: DataTypes.DATE,
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
    modelName: 'TeamMembership',
    tableName: 'team_memberships',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['athlete_id', 'team_id'],
        unique: true,
      },
    ],
  }
);

export default TeamMembership;
