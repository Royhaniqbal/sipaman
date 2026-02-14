// src/components/BookingTab.tsx
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Info, X, Plus, Trash2, Edit, Image as ImageIcon } from "lucide-react";
import axios from "axios";

type AvailabilitySlot = { startTime: string; endTime: string };
type BookingDetail = { 
  startTime: string; 
  endTime: string; 
  pic: string; 
  unitKerja: string; 
  agenda: string;
  phone?: string; 
};

const API = import.meta.env.VITE_API_BASE_URL;

export default function BookingTab({
  // setHistory,
  editingBooking = null,
  onFinishEdit,
}: {
  setHistory: React.Dispatch<React.SetStateAction<any[]>>;
  editingBooking?: any | null;
  onFinishEdit?: (updated: any) => void;
}) {
  const [userRole, setUserRole] = useState<string>("user");
  const [roomsData, setRoomsData] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [timeStart, setTimeStart] = useState<string>("");
  const [timeEnd, setTimeEnd] = useState<string>("");
  const [pic, setPic] = useState<string>("");
  const [unitKerja, setUnitKerja] = useState<string>("");
  const [agenda, setAgenda] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  const [showModal, setShowModal] = useState(false);
  const [details, setDetails] = useState<BookingDetail[]>([]);
  const [modalRoomName, setModalRoomName] = useState("");

  // --- STATE MANAGEMENT RUANGAN ---
  const [isLoading, setIsLoading] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", capacity: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [editingRoomData, setEditingRoomData] = useState<any>(null);

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API}/api/rooms`);
      const data = await res.json();
      setRoomsData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const resUser = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resUser.ok) {
          const data = await resUser.json();
          setUserRole(data.role);
          if (data.username) setPic(data.username);
          if (data.unitKerja) setUnitKerja(data.unitKerja);
          if (data.phone) setPhone(data.phone);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
    fetchRooms();
  }, []);

  // --- LOGIKA MANAJEMEN RUANGAN ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAddRoom = async () => {
    if (!newRoom.name || !newRoom.capacity || !selectedFile) return toast.error("Lengkapi data ruangan & foto!");
    const formData = new FormData();
    formData.append("name", newRoom.name);
    formData.append("capacity", newRoom.capacity);
    formData.append("image", selectedFile);

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      await axios.post(`${API}/api/rooms`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      toast.success("Ruangan berhasil ditambah!");
      setNewRoom({ name: "", capacity: "" });
      setPreviewUrl(null);
      setSelectedFile(null);
      fetchRooms();
    } catch (err) { toast.error("Gagal menambah ruangan"); }
    finally { setIsLoading(false); }
  };

  const handleDeleteRoom = async (id: number) => {
    // Pastikan ID ada
    if (!id) return toast.error("ID Ruangan tidak ditemukan");

    if (!confirm("Apakah Anda yakin ingin menghapus ruangan ini? Semua data booking terkait mungkin akan terpengaruh.")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Sesi habis, silakan login ulang");
        return;
      }

      // Menggunakan axios.delete
      const res = await axios.delete(`${API}/api/rooms/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (res.status === 200 || res.status === 204) {
        toast.success("Ruangan berhasil dihapus!");
        fetchRooms(); // Refresh daftar ruangan
      }
    } catch (err: any) {
      console.error("Delete Error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Gagal hapus ruangan");
    }
  };

  const handleUpdateRoom = async () => {
    const formData = new FormData();
    formData.append("name", editingRoomData.name);
    formData.append("capacity", editingRoomData.capacity);
    if (selectedFile) formData.append("image", selectedFile);

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      await axios.put(`${API}/api/rooms/${editingRoomData.id}`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      toast.success("Berhasil diperbarui!");
      setIsEditingRoom(false);
      setSelectedFile(null);
      fetchRooms();
    } catch (err) { toast.error("Gagal update"); }
    finally { setIsLoading(false); }
  };

  // --- LOGIKA BOOKING ---
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
      setDetails(data.booked || []);
      setModalRoomName(roomName);
      setShowModal(true);
    } catch (err) {
      toast.error("Gagal memuat detail data");
    }
  };

  const bookingData = {
    id: editingBooking?.id || null,
    room: roomsData.find((r) => r.id === selected)?.name || null,
    date: selectedDate || null,
    startTime: timeStart || null,
    endTime: timeEnd || null,
    pic: pic || null,
    unitKerja: unitKerja || null,
    agenda: agenda || null,
    phone: phone || null,
  };

  const parseToMinutes = (t: string) => {
    const [hh, mm] = t.split(":").map(Number);
    return hh * 60 + mm;
  };
  const formatFromMinutes = (m: number) => {
    const hh = Math.floor(m / 60).toString().padStart(2, "0");
    const mm = (m % 60).toString().padStart(2, "0");
    return `${hh}:${mm}`;
  };

  useEffect(() => {
    const fetchAvailability = async () => {
      const selectedRoomName = roomsData.find(r => r.id === selected)?.name;
      if (selectedRoomName && selectedDate) {
        try {
          const res = await fetch(`${API}/api/check-availability`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room: selectedRoomName, date: selectedDate }),
          });
          if (!res.ok) { setAvailability([]); return; }
          const data = await res.json();
          let slots = Array.isArray(data.available) ? data.available : [];
          setAvailability(slots.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime)));
        } catch (err) {
          setAvailability([]);
        }
      } else {
        setAvailability([]);
      }
    };
    fetchAvailability();
  }, [selected, selectedDate, roomsData]);

  const generateStartOptions = () => {
    if (!availability.length) return [];
    const options: string[] = [];
    availability.forEach((slot) => {
      let current = parseToMinutes(slot.startTime);
      const end = parseToMinutes(slot.endTime);
      while (current < end) { options.push(formatFromMinutes(current)); current += 30; }
    });
    return Array.from(new Set(options)).sort();
  };

  const generateEndOptions = () => {
    if (!timeStart || !availability.length) return [];
    const startMin = parseToMinutes(timeStart);
    const slot = availability.find((s) => startMin >= parseToMinutes(s.startTime) && startMin < parseToMinutes(s.endTime));
    if (!slot) return [];
    const options: string[] = [];
    let current = startMin + 30;
    while (current <= parseToMinutes(slot.endTime)) { options.push(formatFromMinutes(current)); current += 30; }
    return options;
  };

  const handleSubmit = async () => {
    if (!bookingData.room || !bookingData.date || !bookingData.startTime || !bookingData.endTime || !bookingData.agenda) {
      toast.error("⚠️ Mohon lengkapi semua data!");
      return;
    }
    try {
      const endpoint = editingBooking ? `${API}/api/book/${bookingData.id}` : `${API}/api/book`;
      const res = await fetch(endpoint, {
        method: editingBooking ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success("✅ Booking berhasil disimpan!");
      setSelected(null); 
      setSelectedDate(""); 
      setTimeStart(""); 
      setTimeEnd(""); 
      setAgenda("");
      if (editingBooking && onFinishEdit) onFinishEdit(data);
    } catch (err: any) {
      toast.error(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen text-black font-bold bg-white pt-0 px-0">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* KOLOM KIRI: DAFTAR RUANGAN */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {roomsData.map((room) => (
              <div key={room.id} 
                className={`relative border-2 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ${selected === room.id ? "border-blue-600 shadow-xl ring-2 ring-blue-100" : "border-gray-200 shadow-sm"}`}>
                
                {/* Admin Controls */}
                {userRole === "admin" && (
                  <div className="absolute top-2 right-2 z-10 flex gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // <--- PENTING: Mencegah card terpilih
                        setEditingRoomData(room); 
                        setIsEditingRoom(true); 
                        setPreviewUrl(`${API}${room.imageUrl}`);
                      }}
                      className="p-2 !bg-white border border-gray-200 shadow-sm rounded-full text-blue-600 hover:!bg-blue-600 hover:!text-white transition"
                    >
                      <Edit size={14} />
                    </button>
    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // <--- PENTING: Mencegah card terpilih
                        handleDeleteRoom(room.id);
                      }}
                      className="p-2 !bg-white border border-gray-200 shadow-sm rounded-full text-red-600 hover:!bg-red-600 hover:!text-white transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div className="h-44 w-full bg-gray-100">
                  <img 
                    src={room.imageUrl ? `${API}${room.imageUrl}` : "/assets/default-room.jpg"} 
                    alt={room.name} 
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4 flex flex-col flex-grow bg-white">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg leading-tight text-black">{room.name}</h3>
                    <button 
                      onClick={() => handleShowInfo(room.name)} 
                      title="Info detail peminjam" // <--- Tambahkan ini
                      className="p-1.5 bg-blue-50 text-blue-400 rounded-full hover:bg-blue-600 hover:text-white transition shadow-sm"
                    >
                      <Info size={18} />
                    </button>
                  </div>
                  <p className="text-xs font-normal text-gray-500 mb-4 italic">Kapasitas: {room.capacity}</p>
                  <button 
                    onClick={() => setSelected(room.id)} 
                    className={`w-full py-2.5 rounded-xl font-bold transition-all active:scale-95 ${selected === room.id ? "bg-blue-600 text-white shadow-lg" : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"}`}
                  >
                    {selected === room.id ? "Terpilih" : "Pilih Ruangan"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* FITUR TAMBAH RUANGAN (ADMIN) */}
          {userRole === "admin" && (
            <div className="mt-12 p-6 border-2 border-dashed border-gray-200 rounded-3xl bg-white">
              <h3 className="text-black uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                <Plus size={16} /> Tambah Ruangan Baru
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  type="text" placeholder="Nama Ruangan" 
                  className="p-3 border rounded-xl font-normal bg-white"
                  value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})}
                />
                <input 
                  type="text" placeholder="Kapasitas (contoh: 20 Orang)" 
                  className="p-3 border rounded-xl font-normal bg-white"
                  value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: e.target.value})}
                />
                <div className="relative border rounded-xl bg-white p-3 flex items-center justify-between">
                   <span className="text-xs text-gray-400 truncate">{selectedFile ? selectedFile.name : "Pilih Foto..."}</span>
                   <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                   <ImageIcon size={18} className="text-gray-400" />
                </div>
              </div>
              <button 
                onClick={handleAddRoom} 
                disabled={isLoading}
                className="mt-4 w-full md:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-800 text-white font-bold transition active:scale-95 shadow-lg disabled:bg-gray-300"
              >
                {isLoading ? "Proses..." : "Simpan Ruangan"}
              </button>
            </div>
          )}
        </div>

        {/* KOLOM KANAN: FORM BOOKING */}
        <div className="w-full lg:w-[350px] p-4 border rounded-lg shadow-md bg-white h-fit lg:sticky lg:top-4">
          <div className="mb-4">
            <label className="block text-sm mb-1 font-bold">Tanggal Pemakaian</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 font-normal bg-white" />
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1 font-bold">Jam Kosong</label>
            <div className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-700 font-normal min-h-[50px]">
              {availability.length > 0 ? (
                <ul className="text-sm">
                  {availability.map((slot, idx) => <li key={idx} className="flex justify-between border-b last:border-0 py-1"><span>{slot.startTime} - {slot.endTime}</span></li>)}
                </ul>
              ) : <span className="text-gray-400 text-xs italic">(Pilih ruangan & tanggal)</span>}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1 font-bold">Waktu Pemakaian</label>
            <div className="flex items-center gap-2">
              <select value={timeStart} onChange={(e) => { setTimeStart(e.target.value); setTimeEnd(""); }} className="w-1/2 border rounded-lg px-3 py-2 font-normal bg-white text-sm">
                <option value="">Mulai</option>
                {generateStartOptions().map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <span>-</span>
              <select value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} className="w-1/2 border rounded-lg px-3 py-2 font-normal bg-white text-sm" disabled={!timeStart}>
                <option value="">Selesai</option>
                {generateEndOptions().map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1 font-bold">Agenda Kegiatan</label>
            <textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 font-normal bg-white h-24 resize-none text-sm"
              placeholder="Contoh: Rapat Koordinasi..."
            />
          </div>

          <button onClick={handleSubmit} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-800 text-white font-bold transition active:scale-95 shadow-lg">
            {editingBooking ? "Simpan Perubahan" : "Kirim Pengajuan"}
          </button>
          <Toaster position="top-center" />
        </div>
      </div>

      {/* MODAL EDIT RUANGAN (POPUP) */}
      {isEditingRoom && editingRoomData && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Edit Ruangan</h2>
              <button 
                onClick={() => setIsEditingRoom(false)} 
                className="p-2 !bg-white border border-gray-200 !text-gray-500 rounded-xl hover:!bg-gray-50 transition-all shadow-sm"
              >
                <X /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block font-bold">Nama Ruangan</label>
                {/* Memastikan background putih bersih dan border halus */}
                <input 
                  className="w-full p-3 border border-gray-200 rounded-xl font-normal bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
                  value={editingRoomData.name} 
                  onChange={e => setEditingRoomData({...editingRoomData, name: e.target.value})} 
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-400 mb-1 block font-bold">Kapasitas</label>
                <input 
                  className="w-full p-3 border border-gray-200 rounded-xl font-normal bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
                  value={editingRoomData.capacity} 
                  onChange={e => setEditingRoomData({...editingRoomData, capacity: e.target.value})} 
                />
              </div>

              {/* Area Upload/Preview Foto */}
              <div className="relative border-2 border-dashed border-gray-100 rounded-xl p-4 text-center bg-white hover:border-blue-300 transition-colors">
                {previewUrl ? (
                  <img src={previewUrl} className="h-32 mx-auto rounded-lg mb-2 object-cover shadow-sm" />
                ) : (
                  <ImageIcon size={30} className="mx-auto text-gray-300 mb-2" />
                )}
                <p className="text-[10px] text-gray-400 font-normal">Klik untuk ganti foto</p>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
              </div>

              <button 
                onClick={handleUpdateRoom} 
                disabled={isLoading} 
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition active:scale-[0.98] shadow-lg disabled:bg-gray-300"
              >
                {isLoading ? "Menyimpan..." : "Update Ruangan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INFO PEMINJAM */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b flex justify-between items-center bg-blue-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-blue-900">Peminjam: {modalRoomName}</h3>
                <p className="text-xs font-normal text-gray-600">{selectedDate}</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-blue-900 hover:text-red-500 transition-colors p-1"
              >
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
                        <th className="p-3">WhatsApp</th>
                        <th className="p-3">Unit Kerja</th>
                        <th className="p-3">Agenda</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {details.map((d, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 whitespace-nowrap">{d.startTime} - {d.endTime}</td>
                          <td className="p-3">{d.pic}</td>
                          <td className="p-3 text-blue-600 font-medium">
                            {d.phone ? (
                              <a href={`https://wa.me/${d.phone.replace(/^0/, '62')}`} target="_blank" rel="noreferrer" className="hover:underline">
                                {d.phone}
                              </a>
                            ) : "-"}
                          </td>
                          <td className="p-3">{d.unitKerja}</td>
                          <td className="p-3 italic text-gray-600">{d.agenda}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="text-center py-12 text-gray-400 font-normal">Belum ada peminjaman.</div>}
            </div>
            <div className="p-4 border-t text-right">
              <button onClick={() => setShowModal(false)} className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition shadow-md font-bold">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}