import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface GauntletAttributes {
  gauntlet_id: string; // Changed to UUID
  name: string;
  description?: string;
  boat_type: '1x' | '2x' | '2-' | '4x' | '4+' | '8+';
  created_by: string; // UUID reference to athletes
  status: 'setup' | 'active' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

// Define the creation attributes interface (optional fields for creation)
interface GauntletCreationAttributes extends Optional<GauntletAttributes, 'gauntlet_id' | 'description' | 'created_at' | 'updated_at'> {}

// Define the model class
class Gauntlet extends Model<GauntletAttributes, GauntletCreationAttributes> {
  // Public class fields for TypeScript compatibility
  public gauntlet_id!: string;
  public name!: string;
  public description?: string;
  public boat_type!: '1x' | '2x' | '2-' | '4x' | '4+' | '8+';
  public created_by!: string;
  public status!: 'setup' | 'active' | 'completed' | 'cancelled';
  public created_at!: Date;
  public updated_at!: Date;
}

// Initialize the model
Gauntlet.init(
  {
    gauntlet_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    boat_type: {
      type: DataTypes.ENUM('1x', '2x', '2-', '4x', '4+', '8+'),
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
    status: {
      type: DataTypes.ENUM('setup', 'active', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'setup'
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
    modelName: 'Gauntlet',
    tableName: 'gauntlets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_gauntlets_created_by',
        fields: ['created_by']
      },
      {
        name: 'idx_gauntlets_status',
        fields: ['status']
      },
      {
        name: 'idx_gauntlets_boat_type',
        fields: ['boat_type']
      }
    ]
  }
);

export default Gauntlet;
