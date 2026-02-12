import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME || "booking_sipaman",
  process.env.DB_USER || "root",
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false, // Set ke console.log jika ingin melihat query SQL
  }
);

export async function connectDB() {
  try {
    await sequelize.authenticate();
    // sync() akan membuat table otomatis jika belum ada
    await sequelize.sync(); 
    console.log("✅ MySQL (Sequelize) connected");
  } catch (err) {
    console.error("❌ MySQL connection error:", err);
    process.exit(1);
  }
}