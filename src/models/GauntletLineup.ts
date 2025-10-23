import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface GauntletLineupAttributes {
  gauntlet_lineup_id: string;
  gauntlet_id: string;
  match_id?: string; // Optional - null during configuration, populated when match is created
  boat_id: string;
  created_at: Date;
  updated_at: Date;
}

// Define the creation attributes interface
interface GauntletLineupCreationAttributes extends Optional<GauntletLineupAttributes, 'gauntlet_lineup_id' | 'match_id' | 'created_at' | 'updated_at'> {}

// Define the model class
class GauntletLineup extends Model<GauntletLineupAttributes, GauntletLineupCreationAttributes> implements GauntletLineupAttributes {
  public gauntlet_lineup_id!: string;
  public gauntlet_id!: string;
  public match_id?: string;
  public boat_id!: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
GauntletLineup.init(
  {
    gauntlet_lineup_id: {
      type: DataTypes.UUID,
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
    match_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'gauntlet_matches',
        key: 'match_id'
      },
      onDelete: 'SET NULL'
    },
    boat_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'boats',
        key: 'boat_id'
      },
      onDelete: 'CASCADE'
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
        name: 'idx_gauntlet_lineups_gauntlet_id',
        fields: ['gauntlet_id']
      },
      {
        name: 'idx_gauntlet_lineups_match_id',
        fields: ['match_id']
      },
      {
        name: 'idx_gauntlet_lineups_boat_id',
        fields: ['boat_id']
      },
    ]
  }
);

export default GauntletLineup;