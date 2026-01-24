// src/routes/roomRoutes.ts
import express from "express";
import Room from "../models/Room";
const router = express.Router();

// Ambil semua status ruangan
router.get("/", async (req, res) => {
  const rooms = await Room.findAll();
  res.json(rooms);
});

// Update status ruangan (Hanya Admin)
router.patch("/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findByPk(id);
    if (!room) return res.status(404).json({ message: "Ruangan tidak ditemukan" });

    // Switch status (true ke false, atau sebaliknya)
    room.isActive = !room.isActive;
    await room.save();

    res.json({ message: `Status ${room.name} diperbarui`, room });
  } catch (err) {
    res.status(500).json({ message: "Gagal update status" });
  }
});

export default router;