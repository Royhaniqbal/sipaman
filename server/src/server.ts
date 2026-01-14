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

// ... sisa kode app.use dan endpoint Anda ...

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || "your_secret_key";

app.use(cors());
app.use(bodyParser.json());

// ✅ Connect ke MySQL
connectDB();

app.use("/api/auth", authRoutes);

// ✅ Endpoint: Cek ketersediaan
app.post("/api/check-availability", async (req: Request, res: Response) => {
  const { room, date } = req.body;
  if (!room || !date) {
    return res.status(400).json({ error: "Room dan date wajib diisi" });
  }

  // 🔹 Query MySQL: Menggunakan findAll & where
  const roomBookings = await Booking.findAll({ where: { room, date } });
  
  const WORKING_HOURS = [{ startTime: "07:30", endTime: "17:00" }];
  let availableSlots = [...WORKING_HOURS];

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

  res.json({ room, date, available: availableSlots });
});

// ✅ Endpoint: Buat booking baru
// ✅ Endpoint: Buat booking baru
app.post("/api/book", async (req: Request, res: Response) => {
  const { room, date, startTime, endTime, pic, unitKerja, agenda } = req.body;

  if (!room || !date || !startTime || !endTime || !pic || !unitKerja || !agenda) {
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
    const newBooking = await Booking.create({ room, date, startTime, endTime, pic, unitKerja, agenda });

    // 3. Sinkron Sheets & WA secara Independen (Jangan pakai 'await' yang menggandeng keduanya)
    // Kita jalankan tanpa await di depan fungsi agar jika satu gagal, respon API tetap sukses
    
    appendBookingToSheet({ room, date, startTime, endTime, pic, unitKerja, agenda })
      .catch(err => console.error("❌ Gagal Sinkron Sheets:", err.message));

    const msg = `📢 Booking Baru!\n🏢 ${room}\n📅 ${date}\n⏰ ${startTime} - ${endTime}\n📝 Agenda: ${agenda}\n👤 ${pic}\n🏬 Unit Kerja: ${unitKerja}`;
    
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
  const { room, date, startTime, endTime, pic, unitKerja, agenda } = req.body;

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

    await booking.update({ room, date, startTime, endTime, pic, unitKerja, agenda });

    await deleteBookingFromSheet(oldData);
    await appendBookingToSheet({ room, date, startTime, endTime, pic, unitKerja, agenda });

    // 🔹 Pesan WA Update (Agenda sudah masuk di sini)
    const msg = `🔄 UPDATE BOOKING!\n🏢 ${room}\n📅 ${date}\n⏰ ${startTime} - ${endTime}\n📝 Agenda: ${agenda}\n👤 ${pic}\n🏬 Unit Kerja: ${unitKerja}\n\nStatus: Diperbarui oleh user.`;
    
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
    const msg = `❌ PEMBATALAN BOOKING!\n🏢 ${dataToDelete.room}\n📅 ${dataToDelete.date}\n⏰ ${dataToDelete.startTime} - ${dataToDelete.endTime}\n📝 Agenda: ${dataToDelete.agenda}\n👤 ${dataToDelete.pic}\n🏬 Unit Kerja: ${dataToDelete.unitKerja}\n\nStatus: Dibatalkan oleh user.`;
    
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

app.get("/", (_req: Request, res: Response) => {
  res.send("✅ API MySQL running...");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});