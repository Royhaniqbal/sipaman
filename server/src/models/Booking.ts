import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db";

class Booking extends Model {
  public id!: number;
  public room!: string;
  public date!: string;
  public startTime!: string;
  public endTime!: string;
  public pic!: string;
  public unitKerja!: string;
  public agenda!: string;
}

Booking.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    room: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.STRING, allowNull: false },
    startTime: { type: DataTypes.STRING, allowNull: false },
    endTime: { type: DataTypes.STRING, allowNull: false },
    pic: { type: DataTypes.STRING, allowNull: false },
    unitKerja: { type: DataTypes.STRING, allowNull: false },
    agenda: { 
      type: DataTypes.TEXT, // Menggunakan TEXT agar bisa menampung input yang panjang
      allowNull: false 
    },
  },
  {
    sequelize,
    modelName: "Booking",
    tableName: "bookings",
    timestamps: false, // ✅ Mematikan createdAt & updatedAt
  }
);

export default Booking;