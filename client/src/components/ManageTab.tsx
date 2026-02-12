// src/components/ManageTab.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { LogOut, Info, X, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL;
const unitOptions = [
  "Setditjen Binalavotas - URT",
  "Setditjen Binalavotas - Keuangan",
  "Setditjen Binalavotas - PEP",
  "Setditjen Binalavotas - SDMA",
  "Bina Lemlatvok",
  "Bina Stankomproglat",
  "Bina Intala",
  "Bina Produktivitas",
  "Bina Lavogan",
  "Sekretariat BNSP",
];

export default function ManageTab() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [unitKerja, setUnitKerja] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState("user");
  const [newRoom, setNewRoom] = useState({ name: "", capacity: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await axios.get(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedUser = (res.data as any).user || res.data;
        setUserRole(fetchedUser.role || "user");
        setUsername(fetchedUser.username || "");
        setEmail(fetchedUser.email || "");
        setUnitKerja(fetchedUser.unitKerja || "");
      } catch (err: any) {
        console.error("❌ Failed to fetch user:", err.message);
      }
    };
    fetchUser();
  }, []);

  const handleUpdateProfile = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true);
    try {
      await axios.put(
        `${API}/api/auth/update-profile`,
        { username, email, unitKerja },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Profil berhasil diperbarui!");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memperbarui profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoom.name || !newRoom.capacity) return toast.error("Nama dan kapasitas wajib diisi!");
    if (!selectedFile) return toast.error("Silakan pilih foto ruangan!");

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("name", newRoom.name);
    formData.append("capacity", newRoom.capacity);
    formData.append("image", selectedFile);

    try {
      setIsLoading(true);
      await axios.post(`${API}/api/rooms`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      toast.success("Ruangan berhasil ditambahkan!");
      setNewRoom({ name: "", capacity: "" });
      setSelectedFile(null);
      setPreviewUrl(null);
      const fileInput = document.getElementById("room-image") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menambah ruangan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      localStorage.removeItem("token");
      window.location.reload();
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("Hapus akun permanen?")) {
      const token = localStorage.getItem("token");
      try {
        await axios.delete(`${API}/api/auth/delete-account`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        localStorage.removeItem("token");
        window.location.reload();
      } catch (err: any) {
        toast.error("Gagal menghapus akun.");
      }
    }
  };

return (
  <div className="min-h-[calc(100vh-80px)] bg-white p-4 md:p-8 flex items-start justify-center">
    <Toaster position="top-center" />

    {/* Ganti grid-cols-1 md:grid-cols-2 menjadi dinamis berdasarkan role */}
    <div className={`w-full max-w-5xl grid grid-cols-1 gap-6 md:items-stretch ${userRole === 'admin' ? 'md:grid-cols-2' : 'max-w-xl'}`}>
      
      {/* --- BAGIAN KIRI: MANAJEMEN RUANGAN --- */}
      {/* Bungkus seluruh kolom dengan pengecekan role, hilangkan div kosong/hidden */}
      {userRole === "admin" && (
        <div className="order-2 md:order-1">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 flex flex-col h-full">
            <h2 className="text-lg font-extrabold text-black uppercase tracking-widest mb-6 flex items-center gap-2">
              Manajemen Ruangan
            </h2>
            
            <div className="space-y-4 flex-grow">
              <div>
                <label className="block mb-1 text-xs font-bold text-gray-400 uppercase">Nama Ruangan</label>
                <input
                  type="text" placeholder="Contoh: Ruang Rapat Utama"
                  className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-bold text-gray-400 uppercase">Kapasitas</label>
                <input
                  type="text" placeholder="Contoh: 20 Orang"
                  className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                  value={newRoom.capacity}
                  onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-bold text-gray-400 uppercase">Foto Ruangan</label>
                <div className="relative border-2 border-dashed border-blue-200 rounded-xl p-4 bg-gray-50 hover:bg-blue-50 transition min-h-[140px] flex items-center justify-center overflow-hidden">
                  <input
                    id="room-image"
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={handleFileChange}
                  />
                  {previewUrl ? (
                    <div className="flex flex-col items-center w-full">
                      <img src={previewUrl} alt="Preview" className="h-28 w-full object-cover rounded-lg mb-2" />
                      <span className="text-xs text-blue-600 font-medium truncate w-full text-center">{selectedFile?.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-blue-400">
                      <ImageIcon size={32} />
                      <span className="text-xs font-bold uppercase">Pilih Foto</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleAddRoom}
              disabled={isLoading}
              className="w-full py-4 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition shadow-lg active:scale-95 disabled:bg-gray-400 mt-6"
            >
              {isLoading ? "Mengunggah..." : "Tambah Ruangan"}
            </button>
          </div>
        </div>
      )}

      {/* --- BAGIAN KANAN: PROFIL USER --- */}
      {/* Jika bukan admin, div ini akan mengambil sisa space atau menjadi center */}
      <div className={`${userRole === 'admin' ? 'order-1 md:order-2' : ''}`}>
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 flex flex-col h-full">
          {/* ... Sisa kode Profil User Anda tetap sama di sini ... */}
          <div className="mb-6">
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">{username || "User"}</h1>
            <p className="text-blue-600 font-bold text-sm uppercase tracking-wider">{unitKerja || "Unit Kerja"}</p>
          </div>

            <div className="space-y-4 flex-grow">
              <div>
                <label className="block mb-1 text-xs font-bold text-gray-400 uppercase tracking-widest">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  readOnly={!isEditing}
                  className={`w-full p-3 border rounded-xl transition ${
                    isEditing ? "border-blue-400 bg-white" : "border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed"
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={!isEditing}
                  className={`w-full p-3 border rounded-xl transition ${
                    isEditing ? "border-blue-400 bg-white" : "border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed"
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-bold text-gray-400 uppercase tracking-widest">Unit Kerja</label>
                {isEditing ? (
                  <select
                    value={unitKerja}
                    onChange={(e) => setUnitKerja(e.target.value)}
                    className="w-full p-3 border border-blue-400 rounded-xl bg-white shadow-sm h-[46px]"
                  >
                    <option value="">Pilih Unit Kerja</option>
                    {unitOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={unitKerja}
                    readOnly
                    className="w-full p-3 border border-gray-100 bg-gray-50 text-gray-500 rounded-xl cursor-not-allowed"
                  />
                )}
              </div>
            </div>

            {/* Tombol Action diletakkan di bawah untuk menjaga posisi tetap konsisten */}
            <div className="mt-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleUpdateProfile}
                  disabled={!isEditing || isLoading}
                  className={`py-3 rounded-xl font-bold transition shadow-md flex items-center justify-center ${
                    isEditing ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isLoading ? "..." : "Simpan"}
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`py-3 rounded-xl font-bold transition shadow-md border ${
                    isEditing ? "bg-white text-gray-600 border-gray-200" : "bg-blue-700 text-white hover:bg-blue-800"
                  }`}
                >
                  {isEditing ? "Batal" : "Edit Profil"}
                </button>
              </div>

              <div className="pt-6 border-t border-gray-100 mt-6 flex items-center justify-between">
                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 text-red-400 font-bold hover:text-red-500 p-2 rounded-lg transition bg-transparent"
                >
                <LogOut size={20} /> Logout
                </button>
                <button 
                  onClick={handleDeleteAccount} 
                  className="text-red-400 text-xs font-bold hover:text-red-500 transition bg-transparent"
                >
                  Hapus Akun
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}