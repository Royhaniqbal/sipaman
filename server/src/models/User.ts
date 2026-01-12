import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db";

class User extends Model {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public role!: string;
  public unitKerja!: string; // ✅ Menambahkan properti di class
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: { type: DataTypes.STRING, allowNull: false },
    email: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true,
      validate: { isEmail: true }
    },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: "user" },
    unitKerja: {
      type: DataTypes.STRING,
      allowNull: false, // Wajib diisi saat registrasi
      comment: "Unit kerja user: Setditjen-URT, Bina Stankom, dll"
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: false, // ✅ Mematikan createdAt & updatedAt
  }
);

export default User;