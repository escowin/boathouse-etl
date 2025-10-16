import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface GauntletMatchAttributes {
  match_id: string; // UUID
  gauntlet_id: string; // UUID
  workout: string;
  sets: number;
  user_wins: number;
  user_losses: number;
  match_date: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Define the creation attributes interface
interface GauntletMatchCreationAttributes extends Optional<GauntletMatchAttributes, 'match_id' | 'notes' | 'created_at' | 'updated_at'> {}

// Define the model class
class GauntletMatch extends Model<GauntletMatchAttributes, GauntletMatchCreationAttributes> implements GauntletMatchAttributes {
  public match_id!: string;
  public gauntlet_id!: string;
  public workout!: string;
  public sets!: number;
  public user_wins!: number;
  public user_losses!: number;
  public match_date!: Date;
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
GauntletMatch.init(
  {
    match_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    gauntlet_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'gauntlets',
        key: 'gauntlet_id'
      },
      onDelete: 'CASCADE'
    },
    workout: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    sets: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_wins: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    user_losses: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    match_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
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
    modelName: 'GauntletMatch',
    tableName: 'gauntlet_matches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_gauntlet_matches_gauntlet_id',
        fields: ['gauntlet_id']
      },
      {
        name: 'idx_gauntlet_matches_match_date',
        fields: ['match_date']
      }
    ]
  }
);

export default GauntletMatch;
