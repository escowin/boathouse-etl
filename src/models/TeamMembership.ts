import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface TeamMembershipAttributes {
  membership_id: string;
  team_id: number;
  athlete_id: string;
  role: 'Athlete' | 'Captain' | 'Secretary' | 'Coach' | 'Assistant Coach';
  start_date: Date;
  end_date?: Date;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Define the creation attributes
interface TeamMembershipCreationAttributes extends Optional<TeamMembershipAttributes,
  'membership_id' | 'end_date' | 'active' | 'created_at' | 'updated_at'
> {}

class TeamMembership extends Model<TeamMembershipAttributes, TeamMembershipCreationAttributes> implements TeamMembershipAttributes {
  public membership_id!: string;
  public team_id!: number;
  public athlete_id!: string;
  public role!: 'Athlete' | 'Captain' | 'Secretary' | 'Coach' | 'Assistant Coach';
  public start_date!: Date;
  public end_date?: Date;
  public active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TeamMembership.init(
  {
    membership_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
      type: DataTypes.ENUM('Athlete', 'Captain', 'Secretary', 'Coach', 'Assistant Coach'),
      defaultValue: 'Athlete',
    },
    start_date: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
    },
    end_date: {
      type: DataTypes.DATEONLY,
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
    modelName: 'TeamMembership',
    tableName: 'team_memberships',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['team_id'],
      },
      {
        fields: ['athlete_id'],
      },
      {
        fields: ['active'],
      },
      {
        fields: ['role'],
      },
      {
        // Ensure one active membership per athlete per team
        fields: ['team_id', 'athlete_id', 'active'],
        unique: true,
        where: {
          active: true,
        },
      },
    ],
  }
);

export default TeamMembership;
