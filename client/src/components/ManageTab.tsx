// src/components/ManageTab.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { LogOut } from "lucide-react";
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
  const [phone, setPhone] = useState("");
  const [isEditing, setIsEditing] = useState(false); // Mode edit
  const [isLoading, setIsLoading] = useState(false);

  // ✅ 1. Fetch data user
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedUser = (res.data as any).user || res.data;
        setUsername(fetchedUser.username || "");
        setEmail(fetchedUser.email || "");
        setUnitKerja(fetchedUser.unitKerja || "");
        setPhone(fetchedUser.phone || "");
      } catch (err: any) {
        console.error("❌ Failed to fetch user:", err.message);
      }
    };
    fetchUser();
  }, []);

  // ✅ 2. Fungsi Simpan Perubahan
  const handleUpdateProfile = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true); // 👈 Mulai loading
    try {
      await axios.put(
        `${API}/api/auth/update-profile`, 
        { username, email, unitKerja, phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Profil berhasil diperbarui!");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memperbarui profil");
    } finally {
      setIsLoading(false); // 👈 Berhenti loading (baik sukses maupun gagal)
    }
  };

  // ✅ 3. Fungsi Logout
  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      localStorage.removeItem("token");
      window.location.reload();
    }
  };

  // ✅ 4. Fungsi Hapus Akun
  const handleDeleteAccount = async () => {
    const confirmDelete = confirm(
      "PERINGATAN! Akun Anda akan dihapus permanen. Tindakan ini tidak dapat dibatalkan. Lanjutkan?"
    );
    
    if (confirmDelete) {
      const token = localStorage.getItem("token");
      try {
        await axios.delete(`${API}/api/auth/delete-account`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Akun Anda telah dihapus.");
        localStorage.removeItem("token");
        window.location.reload();
      } catch (err: any) {
        toast.error("Gagal menghapus akun.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-white text-black p-2">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 mt-1 border border-gray-100">
        
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-800">{username || "User"}</h1>
        <p className="text-gray-500 text-sm mt-0">{unitKerja || "Unit Kerja"}</p>
      </div>

        <div className="space-y-3">
          {/* Username Input */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              readOnly={!isEditing}
              className={`w-full p-2.5 border border-gray-200 rounded-xl transition ${
                isEditing ? "bg-white border-blue-400 shadow-sm" : "bg-gray-50 text-gray-500 cursor-not-allowed"
              }`}
            />
          </div>

          {/* Email Input */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={!isEditing}
              className={`w-full p-3 border border-gray-200 rounded-xl transition ${
                isEditing ? "bg-white border-blue-400 shadow-sm" : "bg-gray-50 text-gray-500 cursor-not-allowed"
              }`}
            />
          </div>
          
          <div>
            <label className="block mb-1 font-semibold text-gray-700">Nomor WhatsApp</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 08123456789"
              readOnly={!isEditing}
              className={`w-full p-3 border border-gray-200 rounded-xl transition ${
                isEditing ? "bg-white border-blue-400 shadow-sm" : "bg-gray-50 text-gray-500 cursor-not-allowed"
              }`}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-gray-700">Unit Kerja</label>
            {isEditing ? (
              <select
                value={unitKerja}
                onChange={(e) => setUnitKerja(e.target.value)}
                className="w-full p-3 border border-blue-400 rounded-xl bg-white shadow-sm transition"
              >
                <option value="">Pilih Unit Kerja</option>
                {unitOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={unitKerja}
                readOnly
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            )}
          </div>

          {/* Row Tombol Action */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button 
              onClick={handleUpdateProfile}
              disabled={!isEditing || isLoading} // 👈 Disable jika sedang loading
              className={`w-full py-3 rounded-xl font-semibold transition shadow-md active:scale-95 flex items-center justify-center ${
                isEditing ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } ${isLoading ? "opacity-80 cursor-wait" : ""}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </button>
            <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`w-full py-2.5 text-sm rounded-xl font-semibold transition shadow-md active:scale-95 ${
                  isEditing 
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300" // Saat mode edit: tombol Batal jadi abu-abu
                    : "bg-blue-600 text-white hover:bg-blue-800" // Saat mode biasa: tombol Edit jadi BIRU
                }`}
              >
                {isEditing ? "Batal Edit" : "Edit Profil"}
              </button>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-gray-100 mt-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 font-bold hover:text-red-800 transition active:scale-95 bg-transparent border-none p-0"
              >
                <div className="bg-red-600 p-1 rounded-md">
                  <LogOut size={18} className="text-white" />
                </div>
                Logout
              </button>
              
              <button 
                onClick={handleDeleteAccount}
                className="text-red-600 text-sm font-semibold hover:text-red-800 transition-colors bg-transparent border-none p-0"
              >
                Hapus Akun
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}