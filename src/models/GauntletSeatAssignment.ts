import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the attributes interface
interface GauntletSeatAssignmentAttributes {
  gauntlet_seat_assignment_id: string;
  gauntlet_lineup_id: string;
  athlete_id: string;
  seat_number: number;
  side: 'port' | 'starboard' | 'scull';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Define the creation attributes
interface GauntletSeatAssignmentCreationAttributes extends Optional<GauntletSeatAssignmentAttributes, 
  'gauntlet_seat_assignment_id' | 'notes' | 'created_at' | 'updated_at'
> {}

class GauntletSeatAssignment extends Model<GauntletSeatAssignmentAttributes, GauntletSeatAssignmentCreationAttributes> implements GauntletSeatAssignmentAttributes {
  public gauntlet_seat_assignment_id!: string;
  public gauntlet_lineup_id!: string;
  public athlete_id!: string;
  public seat_number!: number;
  public side!: 'port' | 'starboard' | 'scull';
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Custom toJSON method to ensure correct field names
  public override toJSON() {
    const values = Object.assign({}, this.get());
    return {
      gauntlet_seat_assignment_id: values.gauntlet_seat_assignment_id,
      gauntlet_lineup_id: values.gauntlet_lineup_id,
      athlete_id: values.athlete_id,
      seat_number: values.seat_number,
      side: values.side,
      notes: values.notes,
      created_at: values.created_at,
      updated_at: values.updated_at
    };
  }
}

GauntletSeatAssignment.init(
  {
    gauntlet_seat_assignment_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    gauntlet_lineup_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'gauntlet_lineups',
        key: 'gauntlet_lineup_id'
      },
      onDelete: 'CASCADE'
    },
    athlete_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'athletes',
        key: 'athlete_id'
      },
      onDelete: 'CASCADE'
    },
    seat_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 8 // Maximum seats in an 8+
      }
    },
    side: {
      type: DataTypes.ENUM('port', 'starboard', 'scull'),
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
    modelName: 'GauntletSeatAssignment',
    tableName: 'gauntlet_seat_assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['gauntlet_lineup_id']
      },
      {
        fields: ['athlete_id']
      },
      {
        fields: ['seat_number']
      },
      {
        unique: true,
        fields: ['gauntlet_lineup_id', 'seat_number'] // Ensure only one athlete per seat per lineup
      }
    ]
  }
);

export default GauntletSeatAssignment;
