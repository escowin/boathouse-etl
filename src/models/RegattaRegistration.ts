import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface RegattaRegistrationAttributes {
  registration_id: string; // Changed from number to string (UUID)
  regatta_id: number;
  athlete_id: string;
  team_id: number;
  status: 'Interested' | 'Committed' | 'Declined' | 'Waitlisted';
  preferred_events?: string[];
  availability_notes?: string;
  coach_notes?: string;
  coach_approved: boolean;
  registration_url?: string;
  registered_at: Date;
  status_updated_at: Date;
  coach_reviewed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Define the creation attributes
interface RegattaRegistrationCreationAttributes extends Optional<RegattaRegistrationAttributes,
  'registration_id' | 'preferred_events' | 'availability_notes' | 'coach_notes' | 
  'registration_url' | 'coach_reviewed_at' | 'created_at' | 'updated_at'
> {}

class RegattaRegistration extends Model<RegattaRegistrationAttributes, RegattaRegistrationCreationAttributes> implements RegattaRegistrationAttributes {
  public registration_id!: string; // Changed from number to string (UUID)
  public regatta_id!: number;
  public athlete_id!: string;
  public team_id!: number;
  public status!: 'Interested' | 'Committed' | 'Declined' | 'Waitlisted';
  public preferred_events?: string[];
  public availability_notes?: string;
  public coach_notes?: string;
  public coach_approved!: boolean;
  public registration_url?: string;
  public registered_at!: Date;
  public status_updated_at!: Date;
  public coach_reviewed_at?: Date;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RegattaRegistration.init(
  {
    registration_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    regatta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'regattas',
        key: 'regatta_id',
      },
    },
    athlete_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'athletes',
        key: 'athlete_id',
      },
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'team_id',
      },
    },
    status: {
      type: DataTypes.ENUM('Interested', 'Committed', 'Declined', 'Waitlisted'),
      allowNull: false,
      defaultValue: 'Interested',
    },
    preferred_events: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      defaultValue: [],
    },
    availability_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    coach_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    coach_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    registration_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    registered_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    status_updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    coach_reviewed_at: {
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
    modelName: 'RegattaRegistration',
    tableName: 'regatta_registrations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['regatta_id'],
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
        // Unique constraint: one registration per athlete per regatta
        fields: ['regatta_id', 'athlete_id'],
        unique: true,
      },
    ],
  }
);

export default RegattaRegistration;
