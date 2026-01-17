import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db";

class User extends Model {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public role!: string;
  public unitKerja!: string; // ✅ Menambahkan properti di class

  public reset_token!: string | null;
  public reset_token_expiry!: Date | null;
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
    reset_token: {
      type: DataTypes.STRING,
      allowNull: true, // Harus true agar tidak error saat register biasa
    },
    reset_token_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
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