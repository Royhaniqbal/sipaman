// src/models/Room.ts
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db";

class Room extends Model {
  public id!: number;
  public name!: string;
  public capacity!: string;
  public imageUrl!: string | null;
  public isActive!: boolean;
}

Room.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    imageUrl: { type: DataTypes.STRING, allowNull: true },
    capacity: { type: DataTypes.STRING, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }, // Default: Ruangan Aktif
  },
  { 
    sequelize, 
    modelName: "room",
    tableName: "rooms",
    timestamps: false // 👈 TAMBAHKAN BARIS INI untuk mematikan createdAt/updatedAt
  }
);

export default Room;