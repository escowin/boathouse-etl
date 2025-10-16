import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface MailingListAttributes {
  mailing_list_id: number;
  team_id?: number; // Optional - some teams may not have mailing lists
  name: string;
  email: string;
  description?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Define the creation attributes
interface MailingListCreationAttributes extends Optional<MailingListAttributes,
  'mailing_list_id' | 'description' | 'active' | 'created_at' | 'updated_at'
> {}

class MailingList extends Model<MailingListAttributes, MailingListCreationAttributes> implements MailingListAttributes {
  public mailing_list_id!: number;
  public team_id?: number; // Optional - some teams may not have mailing lists
  public name!: string;
  public email!: string;
  public description?: string;
  public active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MailingList.init(
  {
    mailing_list_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Some teams may not have mailing lists
      references: {
        model: 'teams',
        key: 'team_id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'MailingList',
    tableName: 'mailing_lists',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['email'],
        unique: true,
      },
      {
        fields: ['name'],
      },
      {
        fields: ['active'],
      },
      {
        fields: ['team_id'],
      },
    ],
  }
);

export default MailingList;
