// src/components/BookingTab.tsx
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Info, X } from "lucide-react";

type AvailabilitySlot = { startTime: string; endTime: string };
type BookingDetail = { startTime: string; endTime: string; pic: string; unitKerja: string; agenda: string };

const API = import.meta.env.VITE_API_BASE_URL;

export default function BookingTab({
  setHistory,
  editingBooking = null,
  onFinishEdit,
}: {
  setHistory: React.Dispatch<React.SetStateAction<any[]>>;
  editingBooking?: any | null;
  onFinishEdit?: (updated: any) => void;
}) {

  const [userRole, setUserRole] = useState<string>("user");
  // const [roomsData, setRoomsData] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [timeStart, setTimeStart] = useState<string>("");
  const [timeEnd, setTimeEnd] = useState<string>("");
  const [pic, setPic] = useState<string>("");
  const [unitKerja, setUnitKerja] = useState<string>("");
  const [agenda, setAgenda] = useState<string>(""); // 🔹 State Baru untuk Agenda

  // 🔹 State Baru untuk Modal Detail
  const [showModal, setShowModal] = useState(false);
  const [details, setDetails] = useState<BookingDetail[]>([]);
  const [modalRoomName, setModalRoomName] = useState("");

  // Mapping Gambar berdasarkan NAMA ruangan di Database
  const roomAssets: Record<string, string> = {
    "Ruang Rapat Dirjen": "/gambarsatu.jpg",
    "Ruang Rapat Sesditjen": "/gambardua.jpeg",
    "Command Center": "/gambarempat.jpg",
    "Ruang Rapat Lt2": "/gambarlima.jpg",
    "Ballroom": "/gambarenam.jpg",
  };

  const rooms: { id: number; name: string; capacity: string; img: string }[] = [
    { id: 1, name: "Ruang Rapat Dirjen", capacity: "24 orang", img: "/gambarsatu.jpg" },
    { id: 2, name: "Ruang Rapat Sesditjen", capacity: "10 orang", img: "/gambardua.jpeg" },
    { id: 3, name: "Command Center", capacity: "12 orang", img: "/gambarempat.jpg" },
    { id: 4, name: "Ruang Rapat Lt2", capacity: "16 orang", img: "/gambarlima.jpg" },
    { id: 5, name: "Ballroom", capacity: "400 orang", img: "/gambarenam.jpg" },
  ];

  // 🔹 Fungsi Baru: Ambil detail pendaftar dari backend
  const handleShowInfo = async (roomName: string) => {
    if (!selectedDate) {
      toast.error("⚠️ Silakan pilih tanggal terlebih dahulu di form!");
      return;
    }

    try {
      const res = await fetch(`${API}/api/check-availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomName, date: selectedDate }),
      });
      const data = await res.json();
      
      // Mengambil properti 'booked' yang berisi daftar peminjam (pastikan backend mengirim ini)
      setDetails(data.booked || []); 
      setModalRoomName(roomName);
      setShowModal(true);
    } catch (err) {
      toast.error("Gagal memuat detail data");
    }
  };

  const bookingData = {
    id: editingBooking?.id || null,
    room: rooms.find((r) => r.id === selected)?.name || null,
    date: selectedDate || null,
    startTime: timeStart || null,
    endTime: timeEnd || null,
    pic: pic || null,
    unitKerja: unitKerja || null,
    agenda: agenda || null, // 🔹 Tambahkan agenda ke data kirim
  };

  // Helpers time
  const parseToMinutes = (t: string) => {
    const [hh, mm] = t.split(":").map(Number);
    return hh * 60 + mm;
  };
  const formatFromMinutes = (m: number) => {
    const hh = Math.floor(m / 60).toString().padStart(2, "0");
    const mm = (m % 60).toString().padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const [roomsData, setRoomsData] = useState<any[]>([]);

  // 1. Fetch data user (Role) & Data Ruangan dari DB
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      
      // Ambil data user
      if (token) {
        try {
          const resUser = await fetch(`${API}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resUser.ok) {
            const data = await resUser.json();
            setUserRole(data.role); // 🔹 Simpan role ke state
            if (data.username) setPic(data.username);
            if (data.unitKerja) setUnitKerja(data.unitKerja);
          }
        } catch (err) { console.error(err); }
      }

      // Ambil status ruangan dari DB
      try {
        const resRooms = await fetch(`${API}/api/rooms`);
        const dataRooms = await resRooms.json();
        setRoomsData(dataRooms);
      } catch (err) { console.error(err); }
    };
    
    fetchData();
  }, []);

  // 2. Fungsi Toggle Admin
  const toggleRoom = async (id: number) => {
    try {
      const res = await fetch(`${API}/api/rooms/${id}/toggle`, { method: "PATCH" });
      if (res.ok) {
        setRoomsData(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
        toast.success("Status ruangan diperbarui!");
      }
    } catch (err) { toast.error("Gagal update status"); }
  };

  // Ambil user (PIC & Unit Kerja)
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.username) setPic(data.username);
          if (data.unitKerja) setUnitKerja(data.unitKerja);
        }
      } catch (err) {
        console.error("❌ Error fetch user:", err);
      }
    };
    fetchUser();
  }, []);

  // Isi form kalau sedang edit
  useEffect(() => {
    if (editingBooking) {
      const room = rooms.find((r) => r.name === editingBooking.room);
      if (room) setSelected(room.id);
      setSelectedDate(editingBooking.date || "");
      setTimeStart(editingBooking.startTime || "");
      setTimeEnd(editingBooking.endTime || "");
      setPic(editingBooking.pic || "");
      setUnitKerja(editingBooking.unitKerja || "");
      setAgenda(editingBooking.agenda || ""); // 🔹 Set agenda saat edit
    }
  }, [editingBooking]);

  // --- Fetch Availability Logic ---
  useEffect(() => {
    const fetchAvailability = async () => {
      if (bookingData.room && bookingData.date) {
        try {
          const res = await fetch(`${API}/api/check-availability`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room: bookingData.room, date: bookingData.date }),
          });
          if (!res.ok) { setAvailability([]); return; }
          let slots: AvailabilitySlot[] = [];
          const data = await res.json();
          if (Array.isArray(data.available)) slots = data.available as AvailabilitySlot[];

          if (editingBooking && editingBooking.startTime && editingBooking.endTime) {
            slots.push({ startTime: editingBooking.startTime, endTime: editingBooking.endTime });
            slots = slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
            const merged: AvailabilitySlot[] = [];
            for (const s of slots) {
              if (!merged.length) merged.push(s);
              else {
                const last = merged[merged.length - 1];
                if (last.endTime === s.startTime) last.endTime = s.endTime;
                else merged.push(s);
              }
            }
            slots = merged;
          }
          slots.sort((a: AvailabilitySlot, b: AvailabilitySlot) => a.startTime.localeCompare(b.startTime));
          setAvailability(slots);
        } catch (err) {
          console.error("❌ Error fetch availability:", err);
          setAvailability([]);
        }
      } else { setAvailability([]); }
    };
    fetchAvailability();
  }, [bookingData.room, bookingData.date, editingBooking]);

  const generateStartOptions = (): string[] => {
    if (!availability.length) return [];
    const options: string[] = [];
    availability.forEach((slot: AvailabilitySlot) => {
      let current = parseToMinutes(slot.startTime);
      const end = parseToMinutes(slot.endTime);
      while (current < end) { options.push(formatFromMinutes(current)); current += 30; }
    });
    return Array.from(new Set(options)).sort();
  };

  const generateEndOptions = (): string[] => {
    if (!timeStart || !availability.length) return [];
    const startMin = parseToMinutes(timeStart);
    const slot = availability.find((s) => startMin >= parseToMinutes(s.startTime) && startMin < parseToMinutes(s.endTime));
    if (!slot) return [];
    const options: string[] = [];
    let current = startMin + 30;
    while (current <= parseToMinutes(slot.endTime)) { options.push(formatFromMinutes(current)); current += 30; }
    return options;
  };

  useEffect(() => {
    const starts = generateStartOptions();
    if (timeStart && !starts.includes(timeStart)) { setTimeStart(""); setTimeEnd(""); }
  }, [availability]);

  useEffect(() => {
    if (!timeStart) return;
    const ends = generateEndOptions();
    if (timeEnd && !ends.includes(timeEnd)) setTimeEnd("");
  }, [timeStart, availability]);

  const handleSubmit = async () => {
    // 🔹 Tambahkan validasi agenda
    if (!bookingData.room || !bookingData.date || !bookingData.startTime || !bookingData.endTime || !bookingData.pic || !bookingData.unitKerja || !bookingData.agenda) {
      alert("⚠️ Mohon lengkapi semua data termasuk Agenda Kegiatan!");
      return;
    }
    if (parseToMinutes(bookingData.endTime) <= parseToMinutes(bookingData.startTime)) {
      alert("⚠️ Jam selesai harus lebih besar dari jam mulai!");
      return;
    }
    try {
      const endpoint = editingBooking ? `${API}/api/book/${bookingData.id}` : `${API}/api/book`;
      const res = await fetch(endpoint, {
        method: editingBooking ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) throw new Error(data.message || "Gagal simpan booking");
      
      const updatedBooking = { ...bookingData, id: data.id || bookingData.id };
      if (editingBooking && onFinishEdit) {
        onFinishEdit(updatedBooking);
        alert("✅ Booking berhasil diperbarui!");
      } else {
        setHistory((prev) => [...prev, updatedBooking]);
        alert("✅ Booking baru berhasil disimpan!");
        // 🔹 Reset form termasuk agenda
        setSelected(null); setSelectedDate(""); setTimeStart(""); setTimeEnd(""); setAgenda("");
      }
    } catch (err: any) {
      toast.error(`❌ Error: ${err.message || ""}`, { style: { background: "#fee2e2", color: "#b91c1c", fontWeight: "600" } });
    }
  };

  const startOptions = generateStartOptions();
  const endOptions = generateEndOptions();

  return (
    <div className="min-h-screen text-black font-bold bg-white pt-0 px-0">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Ruangan */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {roomsData.map((room) => {
              const asset = roomAssets[room.id] || { capacity: "?", img: "" };
              const isAdmin = userRole === "admin";
              const isInactive = !room.isActive;
              const isDisabled = !room.isActive;

              return (
                <div key={room.id} className={`w-full border-2 rounded-xl flex flex-col justify-between items-center p-3 transition ${selected === room.id && !isDisabled ? "border-blue-500 shadow-xl" : "border-gray-300 shadow-sm"} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}>
                  
                  {/* Gambar Ruangan */}
                  {/* <img src={room.img} alt={room.name} className="w-full h-40 object-cover mb-2 rounded-lg" /> */}
                  <img src={roomAssets[room.name] || "/assets/default-room.jpg"} alt={room.name} />
                  

                  {/* 2. Nama Ruangan & Tombol Info (Sejajar/Flex) */}
                  <div className="flex items-center justify-center gap-2 w-full">
                    <p className="text-base text-center">{room.name}</p>
                    <button 
                      onClick={() => handleShowInfo(room.name)}
                      className="bg-white text-blue-600 hover:text-blue-800 transition-all p-1.5 rounded-full shadow-sm border border-gray-100 hover:shadow-md active:scale-90"
                      title="Lihat Detail Peminjam"
                    >
                      <Info size={18} />
                    </button>
                  </div>

                  {/* 3. Kapasitas */}
                  <p className="text-sm text-center font-normal mt-0.5">(Kapasitas {room.capacity})</p>
                  
                  {isAdmin && (
                    <button 
                      onClick={() => toggleRoom(room.id)}
                      className={`w-full py-1 text-[10px] mt-2 rounded border uppercase font-bold transition
                        ${room.isActive ? "border-red-500 text-red-500 hover:bg-red-50" : "border-green-500 text-green-500 hover:bg-green-50"}`}
                    >
                      {room.isActive ? "Nonaktifkan Ruangan" : "Aktifkan Ruangan"}
                    </button>
                  )}

                  {/* Pesan status jika mati */}
                  {isInactive && <p className="text-[10px] text-red-600 mt-1 uppercase">🚫 Sedang Tidak Tersedia</p>}

                  <button 
                    disabled={isInactive && !isAdmin} 
                    onClick={() => (room.isActive || isAdmin) && setSelected(room.id)} 
                    className={`w-full py-1 rounded-lg mt-3 text-white transition 
                      ${isInactive && !isAdmin ? "bg-gray-400 cursor-not-allowed" : 
                        selected === room.id ? "bg-blue-700" : "bg-blue-300 hover:bg-blue-700"}`}
                  >
                    {isInactive && !isAdmin ? "Terkunci" : "Pilih"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <div className="w-full lg:w-[350px] p-4 border rounded-lg shadow-md bg-white h-fit lg:ml-auto">
          <div className="mb-4">
            <label className="block text-sm mb-1 font-bold">Tanggal Pemakaian</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 font-normal bg-white" />
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1 font-bold">Jam Kosong Ruangan</label>
            <div className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700 font-normal min-h-[50px]">
              {availability.length > 0 ? (
                <ul className="list-disc list-inside text-sm">
                  {availability.map((slot, idx) => <li key={idx}>{slot.startTime} - {slot.endTime}</li>)}
                </ul>
              ) : <span className="text-gray-500 text-sm">{bookingData.room && bookingData.date ? "Tidak ada slot kosong" : "(Pilih ruangan & tanggal dulu)"}</span>}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1 font-bold">Waktu Pemakaian</label>
            <div className="flex items-center gap-2">
              <select value={timeStart} onChange={(e) => { setTimeStart(e.target.value); setTimeEnd(""); }} className="w-1/2 border rounded-lg px-3 py-2 font-normal bg-white">
                <option value="">Pilih</option>
                {startOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <span>-</span>
              <select value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} className="w-1/2 border rounded-lg px-3 py-2 font-normal bg-white" disabled={!timeStart || endOptions.length === 0}>
                <option value="">Pilih</option>
                {endOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* 🔹 Input Agenda Kegiatan */}
          <div className="mb-4">
            <label className="block text-sm mb-1 font-bold">Agenda Kegiatan</label>
            <textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 font-normal bg-white h-24 resize-none"
              placeholder="Contoh: Rapat Koordinasi internal..."
            />
          </div>

          <button onClick={handleSubmit} className="w-full py-3 rounded-full bg-blue-300 hover:bg-blue-700 text-white font-semibold transition active:scale-95">
            {editingBooking ? "Simpan Perubahan" : "Kirim Pengajuan"}
          </button>

          <div className="mt-4"><Toaster position="top-center" /></div>
        </div>
      </div>
      {/* 🔹 POP UP TABEL DETAIL PEMINJAM */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b flex justify-between items-center bg-blue-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-blue-900">Daftar Peminjam: {modalRoomName}</h3>
                <p className="text-xs font-normal text-gray-600">Tanggal: {selectedDate}</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="bg-transparent text-blue-900 hover:text-red-500 transition-colors p-1">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 overflow-auto">
              {details.length > 0 ? (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-left text-sm font-normal">
                    <thead className="bg-gray-100 font-bold border-b text-gray-700">
                      <tr>
                        <th className="p-3">Waktu</th>
                        <th className="p-3">PIC</th>
                        <th className="p-3">Unit Kerja</th>
                        <th className="p-3">Agenda</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {details.map((d, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 whitespace-nowrap">{d.startTime} - {d.endTime}</td>
                          <td className="p-3">{d.pic}</td>
                          <td className="p-3">{d.unitKerja}</td>
                          <td className="p-3 italic text-gray-600">{d.agenda}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 font-normal">
                  Belum ada peminjaman pada tanggal ini.
                </div>
              )}
            </div>
            
            <div className="p-4 border-t text-right">
              <button onClick={() => setShowModal(false)} className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition shadow-md">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}