import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface LadderAttributes {
  ladder_id: string; // Changed to UUID
  name: string;
  type: '1x' | '2x' | '2-' | '4+' | '8+';
  created_by: string; // UUID reference to athletes
  settings: any; // JSONB field for flexible configuration
  created_at: Date;
  updated_at: Date;
}

// Define the creation attributes interface
interface LadderCreationAttributes extends Optional<LadderAttributes, 'ladder_id' | 'created_at' | 'updated_at'> {}

// Define the model class
class Ladder extends Model<LadderAttributes, LadderCreationAttributes> implements LadderAttributes {
  public ladder_id!: string;
  public name!: string;
  public type!: '1x' | '2x' | '2-' | '4+' | '8+';
  public created_by!: string;
  public settings!: any;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
Ladder.init(
  {
    ladder_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('1x', '2x', '2-', '4+', '8+'),
      allowNull: false
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'athletes',
        key: 'athlete_id'
      }
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'Ladder',
    tableName: 'ladders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_ladders_type',
        fields: ['type']
      },
      {
        name: 'idx_ladders_created_by',
        fields: ['created_by']
      }
    ]
  }
);

export default Ladder;
