import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "your_secret_key";

// ✅ REGISTER
router.post("/register", async (req, res) => {
  const { username, email, password, role, unitKerja } = req.body;

  try {
    if (!unitKerja) {
      return res.status(400).json({ message: "Unit Kerja wajib diisi" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Email sudah digunakan" });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
      unitKerja, 
    });

    // 🔹 Langkah 4: Pastikan Payload JWT Lengkap
    const token = jwt.sign(
      { 
        id: newUser.id, 
        username: newUser.username, 
        unitKerja: newUser.unitKerja, // Sangat penting untuk Langkah 5 nanti
        role: newUser.role 
      }, 
      SECRET, 
      { expiresIn: "1d" }
    );

    res.json({ user: newUser, token });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Gagal register" });
  }
});

// ✅ LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Password salah" });

    // 🔹 Langkah 4: Tambahkan info unitKerja di Payload JWT Login
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        unitKerja: user.unitKerja, // Data ini akan dibaca otomatis oleh Frontend
        role: user.role 
      }, 
      SECRET, 
      { expiresIn: "1d" }
    );

    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET ME (Ambil data user login secara real-time)
router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, SECRET) as { id: number };
    
    // Pastikan field unitKerja ikut terambil dari DB
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] } 
    });

    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
    
    res.json(user);
  } catch (err) {
    res.status(401).json({ message: "Token tidak valid" });
  }
});

export default router;
// import express from "express";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import User from "../models/User";

// const router = express.Router();
// const SECRET = process.env.JWT_SECRET || "your_secret_key";

// // ✅ REGISTER
// router.post("/register", async (req, res) => {
//   const { username, email, password, role } = req.body;
//   try {
//     // Cek apakah email sudah terdaftar
//     const existingUser = await User.findOne({ where: { email } });
//     if (existingUser) return res.status(400).json({ message: "Email sudah digunakan" });

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = await User.create({
//       username,
//       email,
//       password: hashedPassword,
//       role,
//     });

//     const token = jwt.sign({ id: newUser.id }, SECRET, { expiresIn: "1d" });
//     res.json({ user: newUser, token });
//   } catch (err) {
//     res.status(500).json({ message: "Gagal register" });
//   }
// });

// // ✅ LOGIN
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await User.findOne({ where: { email } });
//     if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: "Password salah" });

//     const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "1d" });
//     res.json({ user, token });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // ✅ GET ME (Ambil data user login)
// router.get("/me", async (req, res) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token) return res.status(401).json({ message: "Unauthorized" });

//   try {
//     const decoded = jwt.verify(token, SECRET) as { id: number };
//     const user = await User.findByPk(decoded.id);
//     res.json(user);
//   } catch (err) {
//     res.status(401).json({ message: "Token tidak valid" });
//   }
// });

// export default router;