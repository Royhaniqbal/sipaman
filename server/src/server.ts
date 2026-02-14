import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { Op } from "sequelize";
import { connectDB } from "./db"; // ✅ Pastikan hanya import connectDB dari ./db
import Booking from "./models/Booking";
import User from "./models/User";
import authRoutes from "./routes/auth";
import { appendBookingToSheet, deleteBookingFromSheet } from "./syncSheets";
import jwt from "jsonwebtoken";
import { sendWhatsAppMessage } from "./sendWhatsAppMessage";
import Room from "./models/Room"; // Import model Room baru
import { isAdmin } from "./routes/auth"; // Import middleware isAdmin (jika diletakkan di auth.ts)
import { sequelize } from "./db";

import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || "your_secret_key";

app.use(cors());
app.use(bodyParser.json());

const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Format nama file: room-1700000000.jpg
    cb(null, `room-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } // Batas 2MB agar tidak membebani cPanel
});

// EXPOSE FOLDER UPLOAD AGAR BISA DIAKSES URL ---
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ✅ Connect ke MySQL
connectDB().then(async () => {
  try {
    // alter: true akan memeriksa tabel dan menambahkan kolom yang kurang otomatis
    await sequelize.sync({ alter: true });
    console.log("✅ Database synced and columns updated!");
  } catch (err) {
    console.error("❌ Sync failed:", err);
  }
});

app.use("/api/auth", authRoutes);

// ✅ Endpoint: Cek ketersediaan & Ambil Detail Peminjam
app.post("/api/check-availability", async (req: Request, res: Response) => {
  const { room, date } = req.body;
  const roomData = await Room.findOne({ where: { name: room } });
    if (roomData && !roomData.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: "⚠️ Ruangan ini sedang tidak tersedia untuk dipinjam (Dinonaktifkan Admin)." 
      });
    }

  if (!room || !date) {
    return res.status(400).json({ error: "Room dan date wajib diisi" });
  }

  try {
    // 1. Ambil semua data booking untuk ruangan dan tanggal tersebut
    const roomBookings = await Booking.findAll({ 
      where: { room, date },
      order: [['startTime', 'ASC']] 
    });
    
    // 2. Tentukan jam kerja operasional
    const WORKING_HOURS = [{ startTime: "07:30", endTime: "17:00" }];
    let availableSlots = [...WORKING_HOURS];

    // 3. Algoritma menghitung slot kosong
    roomBookings.forEach((booked: any) => {
      availableSlots = availableSlots.flatMap((slot) => {
        if (booked.startTime >= slot.endTime || booked.endTime <= slot.startTime) {
          return [slot];
        }
        const result: { startTime: string; endTime: string }[] = [];
        if (booked.startTime > slot.startTime) {
          result.push({ startTime: slot.startTime, endTime: booked.startTime });
        }
        if (booked.endTime < slot.endTime) {
          result.push({ startTime: booked.endTime, endTime: slot.endTime });
        }
        return result;
      });
    });

    // 4. Kirim respon tunggal yang berisi slot kosong DAN daftar peminjam
    return res.json({ 
      room, 
      date, 
      available: availableSlots, 
      booked: roomBookings // Data ini yang akan tampil di tabel pop-up Frontend
    });

  } catch (error) {
    console.error("❌ Error check-availability:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Endpoint: Buat booking baru
// ✅ Endpoint: Buat booking baru
app.post("/api/book", async (req: Request, res: Response) => {
  const { room, date, startTime, endTime, pic, unitKerja, agenda, phone } = req.body;

  if (!room || !date || !startTime || !endTime || !pic || !unitKerja || !agenda || !phone) {
    return res.status(400).json({ success: false, message: "Data tidak lengkap" });
  }

  try {
    // 1. Cek Konflik
    const conflict = await Booking.findOne({
      where: {
        room, date,
        startTime: { [Op.lt]: endTime },
        endTime: { [Op.gt]: startTime },
      },
    });

    if (conflict) {
      return res.status(409).json({ success: false, message: "⚠️ Ruangan sudah dibooking" });
    }

    // 2. Simpan ke Database (Wajib Berhasil)
    const newBooking = await Booking.create({ room, date, startTime, endTime, pic, unitKerja, agenda, phone });

    // 3. Sinkron Sheets & WA secara Independen (Jangan pakai 'await' yang menggandeng keduanya)
    
    appendBookingToSheet({ room, date, startTime, endTime, pic, unitKerja, agenda, phone })
      .catch(err => console.error("❌ Gagal Sinkron Sheets:", err.message));

    const msg = `📢 Booking Baru!\n🏢 ${room}\n📅 ${date}\n⏰ ${startTime} - ${endTime}\n📝 Agenda: ${agenda}\n👤 ${pic}\n📱 WA: ${phone}\n🏬 Unit Kerja: ${unitKerja}`;
    
    sendWhatsAppMessage("6281335382726", msg)
      .catch(err => console.error("❌ Gagal Kirim WA:", err.message));

    // Kirim respon sukses ke frontend karena data sudah masuk DB
    res.json({ success: true, message: "Booking berhasil dibuat", ...newBooking.get({ plain: true }) });

  } catch (error) {
    console.error("❌ Error Database:", error);
    res.status(500).json({ success: false, message: "Gagal simpan booking" });
  }
});

// ✅ Endpoint: Update booking
app.put("/api/book/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { room, date, startTime, endTime, pic, unitKerja, agenda, phone } = req.body;

  try {
    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking tidak ditemukan" });

    const conflict = await Booking.findOne({
      where: {
        id: { [Op.ne]: id }, 
        room,
        date,
        startTime: { [Op.lt]: endTime },
        endTime: { [Op.gt]: startTime },
      },
    });

    if (conflict) return res.status(409).json({ success: false, message: "⚠️ Jadwal bentrok" });

    const oldData = { ...booking.get({ plain: true }) };

    await booking.update({ room, date, startTime, endTime, pic, unitKerja, agenda, phone });

    await deleteBookingFromSheet(oldData);
    await appendBookingToSheet({ room, date, startTime, endTime, pic, unitKerja, agenda, phone });

    // 🔹 Pesan WA Update (Agenda sudah masuk di sini)
    const msg = `🔄 UPDATE BOOKING!\n🏢 ${room}\n📅 ${date}\n⏰ ${startTime} - ${endTime}\n📝 Agenda: ${agenda}\n👤 ${pic}\n📱 WA: ${phone}\n🏬 Unit Kerja: ${unitKerja}\n\nStatus: Diperbarui oleh user.`;
    
    await sendWhatsAppMessage("6281335382726", msg);

    res.json({ success: true, message: "Booking diperbarui", ...booking.get({ plain: true }) });
  } catch (error) {
    console.error("❌ Error update booking:", error);
    res.status(500).json({ success: false, message: "Gagal memperbarui booking" });
  }
});

// ✅ Endpoint: Cancel booking
app.post("/api/cancel-booking", async (req: Request, res: Response) => {
  const { id } = req.body; 

  try {
    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ success: false, message: "Tidak ditemukan" });

    const dataToDelete = { ...booking.get({ plain: true }) };
    
    await booking.destroy(); 

    // ✅ Pesan WA Pembatalan (Ditambahkan baris Agenda)
    const msg = `❌ PEMBATALAN BOOKING!\n🏢 ${dataToDelete.room}\n📅 ${dataToDelete.date}\n⏰ ${dataToDelete.startTime} - ${dataToDelete.endTime}\n📝 Agenda: ${dataToDelete.agenda}\n👤 ${dataToDelete.pic}\n📱 WA: ${dataToDelete.phone}\n🏬 Unit Kerja: ${dataToDelete.unitKerja}\n\nStatus: Dibatalkan oleh user.`;
    
    await sendWhatsAppMessage("6281335382726", msg);

    await deleteBookingFromSheet(dataToDelete);

    res.json({ success: true, message: "Booking berhasil dibatalkan dan notifikasi terkirim" });
  } catch (err) {
    console.error("Gagal batal:", err);
    res.status(500).json({ success: false, message: "Gagal membatalkan booking" });
  }
});

// ✅ Endpoint: Semua booking
app.get("/api/bookings", async (_req: Request, res: Response) => {
  const allBookings = await Booking.findAll(); // 🔹 findAll menggantikan find()
  res.json(allBookings);
});

// ✅ Endpoint: Booking user login
app.get("/api/my-bookings", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, SECRET) as { id: string };
    const user = await User.findByPk(decoded.id); // 🔹 Pakai findByPk
    if (!user) return res.status(404).json({ message: "User not found" });

    const bookings = await Booking.findAll({ 
      where: { pic: user.username },
      order: [['date', 'DESC']] 
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Endpoint: Ambil semua status ruangan
app.get("/api/rooms", async (_req, res) => {
  try {
    const rooms = await Room.findAll();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data ruangan" });
  }
});

// ✅ Endpoint: Toggle Status Ruangan (KHUSUS ADMIN)
app.patch("/api/rooms/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findByPk(id);
    if (!room) return res.status(404).json({ message: "Ruangan tidak ditemukan" });

    room.isActive = !room.isActive;
    await room.save();

    res.json({ success: true, isActive: room.isActive });
  } catch (err) {
    res.status(500).json({ message: "Gagal mengubah status" });
  }
});

// --- UPDATE ENDPOINT TAMBAH RUANGAN (DENGAN MULTER) ---
app.post("/api/rooms", isAdmin, upload.single("image"), async (req: Request, res: Response) => {
  const { name, capacity } = req.body;

  if (!name || !capacity) {
    return res.status(400).json({ success: false, message: "Nama dan Kapasitas wajib diisi" });
  }

  try {
    const existingRoom = await Room.findOne({ where: { name } });
    if (existingRoom) {
      return res.status(409).json({ success: false, message: "Nama ruangan sudah terdaftar" });
    }

    // Ambil path file jika admin mengunggah gambar
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const newRoom = await Room.create({
      name,
      capacity,
      imageUrl, // Pastikan field ini sudah ada di model Room.ts
      isActive: true 
    });

    res.status(201).json({ 
      success: true, 
      message: "Ruangan berhasil ditambahkan", 
      data: newRoom 
    });
  } catch (error) {
    console.error("❌ Error add room:", error);
    res.status(500).json({ success: false, message: "Gagal menambahkan ruangan ke database" });
  }
});

// ✅ Endpoint: Hapus Ruangan (KHUSUS ADMIN)
app.delete("/api/rooms/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const room = await Room.findByPk(id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Ruangan tidak ditemukan" });
    }

    if (room.imageUrl) {
      const filePath = path.join(process.cwd(), room.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await room.destroy();

    res.json({ success: true, message: "Ruangan berhasil dihapus" });
  } catch (error) {
    console.error("❌ Error delete room:", error);
    res.status(500).json({ success: false, message: "Gagal menghapus ruangan" });
  }
});

// ✅ Endpoint: Update Ruangan (KHUSUS ADMIN)
app.put("/api/rooms/:id", isAdmin, upload.single("image"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, capacity } = req.body;
    const room = await Room.findByPk(id);

    if (!room) return res.status(404).json({ success: false, message: "Ruangan tidak ditemukan" });

    // Jika ada file baru, hapus foto lama (opsional)
    let imageUrl = room.imageUrl;
    if (req.file) {
      if (room.imageUrl) {
        const oldPath = path.join(process.cwd(), room.imageUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      imageUrl = `/uploads/${req.file.filename}`;
    }

    await room.update({ name, capacity, imageUrl });

    res.json({ success: true, message: "Ruangan berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal update ruangan" });
  }
});

app.get("/", (_req: Request, res: Response) => {
  res.send("✅ API MySQL running...");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});