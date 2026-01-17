import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import nodemailer from "nodemailer";

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "your_secret_key";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

// ✅ FORGOT PASSWORD (Kirim Token)
router.post("/forgot-password", async (req, res) => {
  try {
    // 1. Ambil email dan bersihkan (trim spasi & ubah ke huruf kecil)
    const emailInput = req.body.email ? req.body.email.trim().toLowerCase() : "";

    if (!emailInput) {
      return res.status(400).json({ message: "Email wajib diisi" });
    }

    // 2. Cari di database
    const user = await User.findOne({ where: { email: emailInput } });

    if (!user) {
      // Jika tetap tidak ketemu, kirim error agar user tahu
      return res.status(404).json({ message: "Email tidak terdaftar" });
    }

    // 3. Buat Token 6 Digit
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 3600000); // Berlaku 1 jam

    // 4. Update Database
    await user.update({
      reset_token: token,
      reset_token_expiry: expiry,
    });

    // 5. Kirim Email
    const mailOptions = {
      from: `"SIPAMAN Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Token Reset Password SIPAMAN",
      html: `<h3>Halo ${user.username},</h3>
             <p>Gunakan kode berikut untuk reset password Anda:</p>
             <h2 style="color: #1d4ed8;">${token}</h2>
             <p>Berlaku selama 1 jam.</p>`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Token berhasil dikirim!" });

  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Gagal mengirim token" });
  }
});

// ✅ RESET PASSWORD (Update Password Baru)
router.post("/reset-password", async (req, res) => {
  const { email, token, newPassword } = req.body;
  const emailInput = email.trim().toLowerCase();

  try {
    const user = await User.findOne({ 
      where: { email: emailInput, reset_token: token } 
    });

    if (!user) {
      return res.status(400).json({ message: "Token atau Email salah" });
    }

    // Cek Expiry
    if (user.reset_token_expiry && new Date() > new Date(user.reset_token_expiry)) {
      return res.status(400).json({ message: "Token sudah kadaluarsa" });
    }

    // Hash Password Baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update & Hapus Token
    await user.update({
      password: hashedPassword,
      reset_token: null,
      reset_token_expiry: null,
    });

    res.json({ message: "Password berhasil diperbarui!" });
  } catch (err) {
    res.status(500).json({ message: "Gagal reset password" });
  }
});

export default router;