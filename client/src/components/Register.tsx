import { useState } from "react";
import axios from "axios";
import { Eye, EyeOff, Loader2 } from "lucide-react"; // Tambah icon Building

const API = import.meta.env.VITE_API_BASE_URL;

interface RegisterProps {
  onRegister: (user: any, token: string) => void;
  onSwitchToLogin: () => void;
}

// Daftar Unit Kerja (Sesuai dengan yang ada di database/logic Anda)
const UNIT_OPTIONS = [
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

export default function Register({ onRegister, onSwitchToLogin }: RegisterProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [unitKerja, setUnitKerja] = useState(""); // 🔹 State Baru
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitKerja) {
      setError("Silakan pilih Unit Kerja terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/register`, {
        username,
        email,
        password,
        phone,
        role,
        unitKerja, // 🔹 Kirim ke Backend
      });
      const data = res.data as { user: any; token: string };

      localStorage.setItem("token", data.token);
      onRegister(data.user, data.token);

      setError("");
      setSuccess("✅ Pendaftaran berhasil! Silakan login.");
    } catch (err: any) {
      setSuccess("");
      setError(err.response?.data?.message || "Pendaftaran gagal ❌.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen relative">
      {/* Desktop view */}
      <div className="hidden md:flex w-full">
        {/* Left Panel */}
        <div className="w-3/5 bg-white flex flex-col justify-center items-center space-y-10">
          <img
            src="/logokemnaker.png"
            alt="Kemnaker"
            className="h-80 select-none pointer-events-none"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
          <hr className="w-2/3 border-t-2 border-blue-700" />
          <img
            src="/logovokasi.png"
            alt="Pelatihan Vokasi"
            className="h-40 select-none pointer-events-none"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        {/* Right Panel */}
        <div
          className="w-2/5 flex flex-col justify-center items-center text-white px-10 relative"
          style={{
            backgroundImage: `url('/gedungvokasi.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-blue-800 bg-opacity-70"></div>

          <div className="relative max-w-xl w-full flex flex-col items-center">
            <div className="mb-10 text-center">
              <h2 className="text-4xl font-bold">BUAT AKUN BARU</h2>
              <h1 className="text-8xl font-bold mb-2">SIPAMAN</h1>
              <p className="text-2xl">Sistem Informasi Pelayanan Peminjaman Ruangan</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 flex flex-col items-center w-full">
              {error && <p className="text-red-300 bg-red-800 bg-opacity-40 p-2 rounded text-center w-8/12">{error}</p>}
              {success && <p className="text-green-300 bg-green-800 bg-opacity-40 p-2 rounded text-center w-8/12">{success}</p>}

              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-8/12 px-5 py-2 rounded-full border bg-white border-gray-300 text-black text-lg"
                required
              />
              <input
                type="email"
                placeholder="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-8/12 px-5 py-2 rounded-full border bg-white border-gray-300 text-black text-lg"
                required
              />
              <input
                type="tel"
                placeholder="Nomor WA (Contoh: 08123456789)"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-8/12 px-5 py-2 rounded-full border bg-white border-gray-300 text-black text-lg"
                required
              />
              
            <div className="relative w-8/12">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-2 rounded-full border bg-white border-gray-300 text-black text-lg pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 bg-white p-1 rounded-full"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

               {/* 🔹 Dropdown Unit Kerja Desktop */}
              <div className="relative w-8/12">
                <select
                  value={unitKerja}
                  onChange={(e) => setUnitKerja(e.target.value)}
                  className="appearance-none w-full px-5 py-2 rounded-full border border-gray-300 bg-white text-black text-lg"
                  required
                >
                  <option value="" disabled>Pilih Unit Kerja</option>
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-6 flex items-center text-gray-500">▼</div>
              </div>

              {/* 🔹 Dropdown Role Desktop */}
              <div className="relative w-8/12">
                <select value={role} onChange={(e) => setRole(e.target.value)} className="appearance-none w-full px-5 py-2 rounded-full border border-gray-300 bg-white text-black text-lg" required>
                  <option value="user">Daftar sebagai User</option>
                  <option value="admin">Daftar sebagai Admin</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-6 flex items-center text-gray-500">▼</div>
              </div>


              {loading && (
                <div className="flex flex-col items-center justify-center text-white mt-2">
                  <Loader2 className="animate-spin w-6 h-6 mb-2" />
                  <p>Sedang proses register...</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-4/12 py-2 bg-white text-blue-700 font-semibold rounded-full hover:bg-gray-100 transition text-lg shadow-md active:scale-95 disabled:opacity-50"
              >
                Register
              </button>
            </form>

            <p className="mt-6 text-sm">
              Sudah punya akun?{" "}
              <button onClick={onSwitchToLogin} className="bg-transparent p-0 text-white underline hover:text-blue-300 font-semibold">
                Login di sini
              </button>
            </p>
          </div>
        </div>
        {/* <p className="absolute bottom-6 right-[15.5rem] text-[9px] text-white">Dibuat oleh M. Royhan Iqbal</p> */}
      </div>

      {/* Mobile view */}
      <div
        className="flex flex-col md:hidden w-full items-center justify-center text-white px-6 py-10 relative"
        style={{ backgroundImage: `url('/gedungvokasi.png')`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-blue-800 bg-opacity-70"></div>
        <div className="relative max-w-md w-full">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold">DAFTAR AKUN BARU</h2>
            <h1 className="text-5xl font-bold mb-1">SIPAMAN</h1>
            <p className="text-lg mb-4 text-center">Sistem Informasi Pelayanan Peminjaman Ruangan</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4 flex flex-col items-center w-full">
            {error && <p className="text-red-300 bg-red-800 bg-opacity-40 p-2 rounded text-center w-10/12">{error}</p>}
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-10/12 px-4 py-2 rounded-full border bg-white border-gray-300 text-black text-base"
              required
            />
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-10/12 px-4 py-2 rounded-full border bg-white border-gray-300 text-black text-base"
              required
            />

            <input
              type="tel"
              placeholder="Nomor WA (Contoh: 08123456789)"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-10/12 px-4 py-2 rounded-full border bg-white border-gray-300 text-black text-base"
              required
            />

            <div className="relative w-10/12">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-full border bg-white border-gray-300 text-black text-base pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 bg-white p-1 rounded-full shadow-sm"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            
            <div className="relative w-10/12">
              <select
                value={unitKerja}
                onChange={(e) => setUnitKerja(e.target.value)}
                className="appearance-none w-full px-4 py-2 rounded-full border border-gray-300 bg-white text-black text-base"
                required
              >
                <option value="" disabled>Pilih Unit Kerja</option>
                {UNIT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-gray-500">▼</div>
            </div>

            {/* 🔹 Dropdown Role Mobile */}
            <div className="relative w-10/12">
              <select value={role} onChange={(e) => setRole(e.target.value)} className="appearance-none w-full px-4 py-2 rounded-full border border-gray-300 bg-white text-black text-base" required>
                <option value="user">Daftar sebagai User</option>
                <option value="admin">Daftar sebagai Admin</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-gray-500">▼</div>
            </div>

            {/* 🔹 Dropdown Unit Kerja Mobile */}

            <button
              type="submit"
              disabled={loading}
              className="w-6/12 py-2 bg-white text-blue-700 font-semibold rounded-full hover:bg-gray-100 transition text-base shadow-md disabled:opacity-50"
            >
              Register
            </button>
          </form>

          <p className="mt-6 text-sm text-center">
            Sudah punya akun?{" "}
            <button onClick={onSwitchToLogin} className="bg-transparent p-0 text-white underline font-semibold">
              Login di sini
            </button>
          </p>
          {/* <p className="mt-6 mb-4 text-[9px] text-center text-white">Dibuat oleh M. Royhan Iqbal</p> */}
        </div>
      </div>
    </div>
  );
}
