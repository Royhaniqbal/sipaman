import { useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

interface LoginProps {
  onLogin: (user: any, token: string) => void;
  onSwitchToRegister: () => void;
  nForgotPassword: () => void;
}

export default function Login({ onLogin, onSwitchToRegister, onForgotPassword }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API}/api/auth/login`, {
        email,
        password,
      });
      const data = res.data as { user: any; token: string };
      localStorage.setItem("token", data.token);
      onLogin(data.user, data.token);
    } catch (err) {
      setError("E-mail atau password salah ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen relative">
      {/* Overlay Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-white border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-white text-sm">Sedang proses login...</p>
        </div>
      )}

      {/* Desktop view (md ke atas) - logo tetap ada */}
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

        {/* Right Panel dengan background gambar */}
        <div
          className="w-2/5 flex flex-col justify-center items-center text-white px-10 bg-cover bg-center relative"
          style={{
            backgroundImage: "url('/gedungvokasi.png')",
          }}
        >
          {/* Overlay agar teks tetap terbaca */}
          <div className="absolute inset-0 bg-blue-800 bg-opacity-70"></div>

          <div className="max-w-xl w-full relative z-10">
            <div className="mb-40">
              <h2 className="text-center text-4xl font-bold">SELAMAT DATANG DI</h2>
              <h1 className="text-center text-8xl font-bold mb-2">SIPAMAN</h1>
              <p className="text-center text-2xl mb-6">
                Sistem Informasi Pelayanan Peminjaman Ruangan
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4 flex flex-col items-center">
              {error && (
                <p className="text-red-300 bg-red-800 bg-opacity-40 p-2 rounded text-center w-8/12">
                  {error}
                </p>
              )}

              <input
                type="email"
                placeholder="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-7/12 px-3 py-2 rounded-full border bg-white border-gray-300 text-black text-lg"
                required
              />

              {/* Password */}
              <div className="relative w-7/12">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-full border bg-white border-gray-300 text-black text-lg pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 bg-white p-1 rounded-full shadow-sm"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="w-7/12 text-right !-mt-1 pr-4">
                <button 
                  type="button"
                  onClick={onForgotPassword}
                  className="bg-transparent border-none p-0 text-xs text-white hover:underline opacity-80 hover:opacity-100 transition-opacity"
                >
                  Lupa password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-3/12 py-2 bg-white text-blue-700 font-semibold rounded-full 
                          hover:bg-gray-100 transition text-lg shadow-md active:scale-95 disabled:opacity-60"
              >
                Login
              </button>

              {/* Switch to Register */}
              <p className="mt-6 text-sm">
                Belum punya akun?{" "}
                <button
                  onClick={onSwitchToRegister}
                  className="bg-transparent p-0 text-white underline hover:text-blue-300 font-semibold cursor-pointer focus:outline-none"
                >
                  Daftar di sini
                </button>
              </p>
            </form>
          </div>
        </div>

        <p className="absolute bottom-6 right-[15.5rem] text-[9px] text-white">
          Dibuat oleh M. Royhan Iqbal
        </p>
      </div>

      {/* Mobile view (md:hidden) - logo dihapus, background diganti gambar */}
      <div
        className="flex flex-col md:hidden w-full items-center justify-center text-white px-6 py-10 bg-cover bg-center relative"
        style={{
          backgroundImage: "url('/gedungvokasi.png')",
        }}
      >
        <div className="absolute inset-0 bg-blue-800 bg-opacity-70"></div>

        <div className="max-w-md w-full relative z-10">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold">SELAMAT DATANG DI</h2>
            <h1 className="text-5xl font-bold mb-1">SIPAMAN</h1>
            <p className="text-lg mb-4">
              Sistem Informasi Pelayanan Peminjaman Ruangan
            </p>
          </div>

          {/* Form Mobile */}
          <form onSubmit={handleLogin} className="space-y-4 flex flex-col items-center w-full">
            {error && (
              <p className="text-red-300 bg-red-800 bg-opacity-40 p-2 rounded text-center w-10/12">
                {error}
              </p>
            )}

            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-10/12 px-3 py-2 rounded-full border bg-white border-gray-300 text-black text-base"
              required
            />

            <div className="relative w-10/12">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-full border bg-white border-gray-300 text-black text-base pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 bg-white p-1 rounded-full shadow-sm"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-5/12 py-2 bg-white text-blue-700 font-semibold rounded-full 
                        hover:bg-gray-100 transition text-base shadow-md active:scale-95 disabled:opacity-60"
            >
              Login
            </button>

            <p className="mt-6 text-sm text-center">
              Belum punya akun?{" "}
              <button
                onClick={onSwitchToRegister}
                className="bg-transparent p-0 text-white underline hover:text-blue-300 font-semibold"
              >
                Daftar di sini
              </button>
            </p>
          </form>

          <p className="mt-6 mb-4 text-[9px] text-center text-white">
            Dibuat oleh M. Royhan Iqbal
          </p>
        </div>
      </div>
    </div>
  );
}
