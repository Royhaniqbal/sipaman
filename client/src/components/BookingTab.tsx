// src/components/BookingTab.tsx
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Info, X, Plus, Trash2, Edit, Image as ImageIcon, Check, Calendar } from "lucide-react";
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
  const [fullBookedRooms, setFullBookedRooms] = useState<string[]>([]); //code baru

  // --- STATE MANAGEMENT RUANGAN ---
  const [isLoading, setIsLoading] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", capacity: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [editingRoomData, setEditingRoomData] = useState<any>(null);

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API}/rooms`);
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
        const resUser = await fetch(`${API}/auth/me`, {
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
      await axios.post(`${API}/rooms`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-3xl pointer-events-auto flex flex-col items-center p-10 border-4 border-blue-500`}>
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <Plus className="text-blue-600 scale-[2]" size={40} /> 
          </div>
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter text-center">Ruangan Ditambah</h1>
          <p className="text-gray-500 font-normal mt-2">Data ruangan baru telah berhasil disimpan.</p>
        </div>
      ), { duration: 2000, position: 'top-center' });
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
      const res = await axios.delete(`${API}/rooms/${id}`, { 
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
      await axios.put(`${API}/rooms/${editingRoomData.id}`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-3xl pointer-events-auto flex flex-col items-center p-10 border-4 border-orange-500`}>
          <div className="bg-orange-100 p-4 rounded-full mb-4">
            <Edit className="text-orange-600 scale-[2]" size={40} /> 
          </div>
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter text-center">Berhasil Diperbarui</h1>
          <p className="text-gray-500 font-normal mt-2 text-center">Data perubahan ruangan telah disimpan.</p>
        </div>
      ), { duration: 2000, position: 'top-center' });
      setIsEditingRoom(false);
      setSelectedFile(null);
      fetchRooms();
    } catch (err) { toast.error("Gagal update"); }
    finally { setIsLoading(false); }
  };

  interface ToggleResponse {
    success: boolean;
    isActive: boolean;
  }

  const handleToggleRoomStatus = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch<ToggleResponse>(`${API}/rooms/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        // toast.success(currentStatus ? "Ruangan dinonaktifkan" : "Ruangan diaktifkan kembali");
        fetchRooms(); // Refresh data ruangan
        if (selected === id) setSelected(null); // Deselect jika ruangan yang aktif dinonaktifkan
      }
    } catch (err) {
      toast.error("Gagal mengubah status ruangan");
    }
  };

  // --- LOGIKA BOOKING ---
  const handleShowInfo = async (roomName: string) => {
    if (!selectedDate) {
      // NOTIFIKASI CUSTOM BESAR DI TENGAH
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-3xl pointer-events-auto flex flex-col items-center p-10 border-4 border-amber-500`}>
          <div className="bg-amber-100 p-4 rounded-full mb-4">
            <Calendar className="text-amber-600 scale-[2]" size={40} />
          </div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter text-center leading-tight">
            Pilih Tanggal <br/> Terlebih Dahulu
          </h1>
          <p className="text-gray-500 font-normal mt-4 text-center">
            Silahkan tentukan <span className="text-amber-600 font-bold">Tanggal Pemakaian</span> terlebih dahulu untuk melihat informasi pemakai ruangan.
          </p>
        </div>
      ), { duration: 3000, position: 'top-center' });
      return;
    }

    try {
      const res = await fetch(`${API}/check-availability`, {
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
          const res = await fetch(`${API}/check-availability`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room: selectedRoomName, date: selectedDate }),
          });
          if (!res.ok) { setAvailability([]); return; }
          const data = await res.json();
          let slots = Array.isArray(data.available) ? data.available : [];

          // --- LOGIKA TAMBAHAN UNTUK EDIT ---
          // Jika sedang mode edit dan ruangan/tanggal sama dengan data asli
          if (editingBooking && 
              selectedRoomName === editingBooking.room && 
              selectedDate === editingBooking.date) {
            
            // Tambahkan slot waktu asli booking ini ke dalam daftar slot kosong
            slots.push({ 
              startTime: editingBooking.startTime, 
              endTime: editingBooking.endTime 
            });

            // Gabungkan slot yang bersentuhan (overlap) agar pilihan jam tidak terputus
            slots.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
            
            const mergedSlots: AvailabilitySlot[] = [];
            if (slots.length > 0) {
              let current = slots[0];
              for (let i = 1; i < slots.length; i++) {
                // Jika slot saat ini menyambung dengan slot berikutnya
                if (current.endTime >= slots[i].startTime) {
                  current = {
                    startTime: current.startTime,
                    endTime: slots[i].endTime > current.endTime ? slots[i].endTime : current.endTime
                  };
                } else {
                  mergedSlots.push(current);
                  current = slots[i];
                }
              }
              mergedSlots.push(current);
            }
            slots = mergedSlots;
          }
          // ----------------------------------

          setAvailability(slots.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime)));
        } catch (err) {
          setAvailability([]);
        }
      } else {
        setAvailability([]);
      }
    };
    fetchAvailability();
  }, [selected, selectedDate, roomsData, editingBooking]); // Tambahkan editingBooking di dependency

  //code baru
  const showFullBookedToast = (roomName: string) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-3xl pointer-events-auto flex flex-col items-center p-10 border-4 border-red-500`}>
        <div className="bg-red-100 p-4 rounded-full mb-4">
          <X className="text-red-600 scale-[2]" size={40} />
        </div>
        <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter text-center leading-none">Ruangan Penuh</h1>
        <p className="text-gray-500 font-normal mt-4 text-center">
          Maaf, <b className="text-black">{roomName}</b> sudah <span className="text-red-600 font-bold">Full Booked</span> pada tanggal tersebut. Silakan pilih ruangan atau tanggal lain.
        </p>
      </div>
    ), { duration: 3000, position: 'top-center' });
  };

  // 2. Logika Monitoring & Proteksi Otomatis (Solusi untuk Bug Anda)
  useEffect(() => {
    const validateCurrentSelection = async () => {
      // Hanya jalan jika user SUDAH memilih ruangan DAN SUDAH mengisi tanggal
      if (selected && selectedDate) {
        const selectedRoom = roomsData.find(r => r.id === selected);
        if (!selectedRoom) return;

        try {
          const res = await fetch(`${API}/check-availability`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room: selectedRoom.name, date: selectedDate }),
          });
          const data = await res.json();

          // Jika API mengembalikan available slots KOSONG []
          if (data.available && data.available.length === 0) {
            // JIKA ini bukan sedang mode edit (atau jika sedang edit tapi ruangan memang penuh total)
            if (!editingBooking || (editingBooking && selectedRoom.name !== editingBooking.room)) {
                // setSelected(null); // BATALKAN pilihan otomatis (Auto-Eject)
                setTimeStart("");  // Reset jam
                setTimeEnd("");    // Reset jam
                showFullBookedToast(selectedRoom.name); // Munculkan toast besar
            }
          }
        } catch (err) {
          console.error("Gagal validasi ketersediaan");
        }
      }
    };

    validateCurrentSelection();
  }, [selected, selectedDate]); // MEMANTAU PERUBAHAN RUANGAN ATAU TANGGAL

  // 3. Logika Update fullBookedRooms untuk visual tombol (Hanya visual)
  useEffect(() => {
    const checkAllRoomsAvailability = async () => {
      if (!selectedDate || roomsData.length === 0) {
        setFullBookedRooms([]);
        return;
      }
      const fullRooms: string[] = [];
      await Promise.all(roomsData.map(async (room) => {
        try {
          const res = await fetch(`${API}/check-availability`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room: room.name, date: selectedDate }),
          });
          const data = await res.json();
          if (data.available && data.available.length === 0) {
            fullRooms.push(room.name);
          }
        } catch (err) {}
      }));
      setFullBookedRooms(fullRooms);
    };
    checkAllRoomsAvailability();
  }, [selectedDate, roomsData]);

  useEffect(() => {
    if (editingBooking && roomsData.length > 0) {
      // 1. Cari ID ruangan berdasarkan nama yang ada di data booking
      const room = roomsData.find((r) => r.name === editingBooking.room);
      if (room) {
        setSelected(room.id);
      }

      // 2. Set state form dengan data yang akan diedit
      setSelectedDate(editingBooking.date || "");
      setTimeStart(editingBooking.startTime || "");
      setTimeEnd(editingBooking.endTime || "");
      setAgenda(editingBooking.agenda || "");
      
      // Jika data PIC/Unit/Phone ingin di-reset ke data booking yang diedit (opsional)
      if (editingBooking.pic) setPic(editingBooking.pic);
      if (editingBooking.unitKerja) setUnitKerja(editingBooking.unitKerja);
      if (editingBooking.phone) setPhone(editingBooking.phone);
    }
  }, [editingBooking, roomsData]); // Berjalan saat data booking edit atau data ruangan tersedia

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
  if (availability.length === 0 && (!editingBooking || roomsData.find(r => r.id === selected)?.name !== editingBooking.room)) {
    toast.error("Ruangan ini sudah penuh pada tanggal tersebut!");
    return;
  }

  if (!bookingData.room || !bookingData.date || !bookingData.startTime || !bookingData.endTime || !bookingData.agenda) {
    toast.error("⚠️ Mohon lengkapi semua data!");
    return;
  }
  setIsLoading(true);
    try {
      const endpoint = editingBooking ? `${API}/book/${bookingData.id}` : `${API}/book`;
      const res = await fetch(endpoint, {
        method: editingBooking ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // --- LOGIKA NOTIFIKASI ---
      if (!editingBooking) {
        // HANYA muncul jika ini pengajuan baru (bukan edit)
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-3xl pointer-events-auto flex flex-col items-center p-10 border-4 border-green-500`}>
            <div className="bg-green-100 p-4 rounded-full mb-4">
              {/* Logo diubah menjadi Check (Centang) */}
              <Check className="text-green-600 scale-[2]" size={40} /> 
            </div>
            <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Pengajuan Berhasil</h1>
            <p className="text-gray-500 font-normal mt-2">Data Anda telah tersimpan ke sistem.</p>
          </div>
        ), { duration: 2000, position: 'top-center' });
      }

      // Reset & Callback
      setSelected(null); 
      setSelectedDate(""); 
      setTimeStart(""); 
      setTimeEnd(""); 
      setAgenda("");
      
      // Jika mode edit, fungsi onFinishEdit akan langsung dipanggil tanpa toast
      if (editingBooking && onFinishEdit) onFinishEdit(data);
      
    } catch (err: any) {
      // Notifikasi error tetap dimunculkan hanya untuk Pengajuan Baru agar user tahu kenapa gagal
      if (!editingBooking) {
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-3xl pointer-events-auto flex flex-col items-center p-10 border-4 border-red-500`}>
            <div className="bg-red-100 p-4 rounded-full mb-4">
              <X className="text-red-600 scale-[2]" size={40} />
            </div>
            <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Pengajuan Gagal</h1>
            <p className="text-gray-500 font-normal mt-2 text-center">{err.message}</p>
          </div>
        ), { duration: 2000, position: 'top-center' });
      } else {
        // Log error ke konsol saja jika saat edit terjadi kegagalan, atau biarkan kosong sesuai permintaan
        console.error("Gagal update booking:", err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-black font-bold bg-white pt-0 px-0">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* KOLOM KIRI: DAFTAR RUANGAN */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {roomsData.map((room) => (
              <div 
                key={room.id} 
                className={`relative border-2 rounded-2xl flex flex-col transition-all duration-300 ease-out
                    /* EFEK 3D & INTERAKSI */
                    ${!room.isActive || (fullBookedRooms.includes(room.name) && selected !== room.id)
                      ? "opacity-75 grayscale-[0.3] cursor-not-allowed shadow-sm" // Jika tidak bisa dipilih
                      : "hover:-translate-y-2 hover:shadow-2xl hover:scale-[1.02] cursor-pointer" // Efek melayang 3D
                    }
                    /* LOGIKA WARNA BORDER */
                    ${fullBookedRooms.includes(room.name) 
                        ? "border-gray-200" 
                        : selected === room.id 
                          ? "border-blue-600 shadow-2xl ring-4 ring-blue-50 -translate-y-2" // Tetap melayang jika terpilih
                          : "border-gray-200 bg-white"
                    }`}
                style={{ perspective: "1000px" }} // Memberikan konteks kedalaman 3D
              >
                
                {/* Overlay Label Jika Nonaktif */}
                {!room.isActive && (
                  <div className="absolute top-14 left-0 right-0 z-20 bg-red-600 text-white text-[10px] py-1 text-center font-black uppercase tracking-widest rotate-[-5deg] shadow-lg">
                    TUTUP
                  </div>
                )}

                {/* Admin Controls (Tombol Edit & Hapus tetap ada di atas) */}
                {userRole === "admin" && (
                  <div className="absolute top-2 right-2 z-10 flex gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingRoomData(room); setIsEditingRoom(true); setPreviewUrl(`${API}${room.imageUrl}`); }}
                      className="p-2 !bg-white border border-gray-200 shadow-sm rounded-full text-blue-600 hover:!bg-blue-600 hover:!text-white transition"
                    >
                      <Edit size={14} />
                    </button>

                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}
                      className="p-2 !bg-white border border-gray-200 shadow-sm rounded-full text-red-600 hover:!bg-red-600 hover:!text-white transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div className="h-44 w-full bg-gray-100 relative overflow-hidden rounded-t-[14px]">
                  <img 
                    src={room.imageUrl ? `${API}${room.imageUrl}` : "/assets/default-room.jpg"}
                    alt={room.name} 
                    className={`w-full h-full object-cover transition-transform duration-500 
                      ${room.isActive && !fullBookedRooms.includes(room.name) ? "group-hover:scale-110" : ""}
                      ${!room.isActive ? "brightness-50" : ""}`}
                  />
                </div>

                <div className="p-4 flex flex-col flex-grow bg-white rounded-b-[14px] relative">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-lg leading-tight ${!room.isActive ? "text-gray-400 line-through" : "text-black"}`}>
                      {room.name}
                    </h3>
                    {/* Container Ikon Info */}
                    <div className="relative group flex items-center justify-center">
                      <button 
                        onClick={() => handleShowInfo(room.name)} 
                        className="p-1.5 bg-blue-50 text-blue-400 rounded-full hover:bg-blue-600 hover:text-white transition shadow-sm"
                      >
                        <Info size={18} />
                      </button>

                      {/* Tooltip Element - Tambahkan z-50 dan whitespace-nowrap */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-50">
                        <span className="relative z-10 p-2 text-xs leading-none text-white whitespace-nowrap bg-gray-800 rounded shadow-lg font-normal">
                          Info detail pengguna
                        </span>
                        <div className="w-3 h-3 -mt-2 rotate-45 bg-gray-800"></div>
                      </div>
                    </div>
                    
                  </div>
                  <p className="text-xs font-normal text-gray-500 mb-4 italic">Kapasitas: {room.capacity}</p>
                  
                  <div className="flex flex-col gap-2">
                    {/* Tombol Pilih Ruangan (Disable jika nonaktif) */}
                    {/* Tombol Pilih Ruangan */}
                    <button 
                      onClick={() => {
                        if (room.isActive && !fullBookedRooms.includes(room.name)) {
                          setSelected(selected === room.id ? null : room.id);
                        }
                      }} 
                      disabled={!room.isActive || (fullBookedRooms.includes(room.name) && selected !== room.id)}
                      /* Gunakan border-0 untuk mematikan border, dan focus:ring-0 untuk mematikan garis saat diklik */
                      className={`w-full py-2.5 rounded-xl font-bold transition-all duration-300 active:scale-95 !border-none !outline-none focus:!ring-0
                        ${!room.isActive 
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                            : fullBookedRooms.includes(room.name)
                              ? "bg-red-50 text-red-500 cursor-not-allowed" 
                              : selected === room.id 
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                                : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                        }`}
                    >
                      {/* Logika teks tetap sama */}
                      {!room.isActive ? "Tidak Tersedia" : fullBookedRooms.includes(room.name) ? "Full Booked" : selected === room.id ? "Terpilih" : "Pilih Ruangan"}
                    </button>

                    {/* TOMBOL KHUSUS ADMIN: Toggle Nonaktifkan */}
                    {userRole === "admin" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleRoomStatus(room.id); }}
                        className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all border
                          ${room.isActive 
                            ? "border-red-200 text-red-500 hover:bg-red-500 hover:text-white" 
                            : "border-green-200 text-green-500 hover:bg-green-500 hover:text-white"
                          }`}
                      >
                        {room.isActive ? "Nonaktifkan Ruangan" : "Aktifkan Ruangan"}
                      </button>
                    )}
                  </div>
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
            <label className="block text-sm mb-1 font-bold">Jam Kosong Ruangan</label>
            <div className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-700 font-normal min-h-[50px]">
              {availability.length > 0 ? (
                <ul className="text-sm">
                  {availability.map((slot, idx) => (
                    <li key={idx} className="flex justify-between border-b last:border-0 py-1">
                      <span>{slot.startTime} - {slot.endTime}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-400 text-xs italic">
                  {/* LOGIKA BARU: Jika ruangan dipilih & tanggal dipilih, tapi availability kosong */}
                  {selected && selectedDate ? (
                    <b className="text-red-500 not-italic font-bold">Full Booked</b>
                  ) : (
                    "(Pilih ruangan & tanggal)"
                  )}
                </span>
              )}
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

          <button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className={`w-full py-3 rounded-xl font-bold transition active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
              isLoading ? "bg-gray-400 cursor-wait" : "bg-blue-600 hover:bg-blue-800 text-white"
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Memproses...</span>
              </>
            ) : (
              editingBooking ? "Simpan Perubahan" : "Kirim Pengajuan Reservasi"
            )}
          </button>
          {/* <Toaster position="top-center" /> */}
          <Toaster 
            position="top-center" 
            containerStyle={{
              top: '30%', // Menggeser posisi "top" agak ke tengah layar
            }}
            toastOptions={{
              duration: 2000,
            }}
          />
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
                <h3 className="text-lg font-bold text-blue-900">Daftar Pengguna {modalRoomName}</h3>
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