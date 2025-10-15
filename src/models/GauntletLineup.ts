import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface GauntletLineupAttributes {
  gauntlet_lineup_id: string;
  match_id: string;
  boat_id: string;
  team_id?: number;
  lineup_name?: string;
  side: 'user' | 'challenger';
  total_weight_kg?: number;
  average_weight_kg?: number;
  average_age?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Define the creation attributes
interface GauntletLineupCreationAttributes extends Optional<GauntletLineupAttributes, 
  'gauntlet_lineup_id' | 'team_id' | 'lineup_name' | 'total_weight_kg' | 'average_weight_kg' | 
  'average_age' | 'notes' | 'created_at' | 'updated_at'
> {}

class GauntletLineup extends Model<GauntletLineupAttributes, GauntletLineupCreationAttributes> implements GauntletLineupAttributes {
  public gauntlet_lineup_id!: string;
  public match_id!: string;
  public boat_id!: string;
  public team_id?: number;
  public lineup_name?: string;
  public side!: 'user' | 'challenger';
  public total_weight_kg?: number;
  public average_weight_kg?: number;
  public average_age?: number;
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

GauntletLineup.init(
  {
    gauntlet_lineup_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    match_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'gauntlet_matches',
        key: 'match_id'
      },
      onDelete: 'CASCADE'
    },
    boat_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'boats',
        key: 'boat_id'
      }
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'teams',
        key: 'team_id'
      }
    },
    lineup_name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    side: {
      type: DataTypes.ENUM('user', 'challenger'),
      allowNull: false
    },
    total_weight_kg: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 10000
      }
    },
    average_weight_kg: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 1000
      }
    },
    average_age: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true,
      validate: {
        min: 0,
        max: 150
      }
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
    modelName: 'GauntletLineup',
    tableName: 'gauntlet_lineups',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['match_id']
      },
      {
        fields: ['boat_id']
      },
      {
        fields: ['side']
      },
      {
        unique: true,
        fields: ['match_id', 'side'] // Ensure only one lineup per side per match
      }
    ]
  }
);

export default GauntletLineup;
