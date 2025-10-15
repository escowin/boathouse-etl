import { DataTypes, Model } from 'sequelize';
import { sequelize } from './index';

export interface UsraCategoryAttributes {
  usra_category_id: number;
  start_age: number;
  end_age: number;
  category: string;
  created_at: Date;
  updated_at: Date;
}

export interface UsraCategoryCreationAttributes {
  start_age: number;
  end_age: number;
  category: string;
}

class UsraCategory extends Model<UsraCategoryAttributes, UsraCategoryCreationAttributes> implements UsraCategoryAttributes {
  public usra_category_id!: number;
  public start_age!: number;
  public end_age!: number;
  public category!: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UsraCategory.init(
  {
    usra_category_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    start_age: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    end_age: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
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
    tableName: 'usra_categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['start_age', 'end_age', 'category']
      },
      {
        fields: ['start_age']
      },
      {
        fields: ['end_age']
      }
    ]
  }
);

export default UsraCategory;
