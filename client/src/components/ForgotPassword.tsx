import { useState } from "react";
import axios from "axios";
import { Loader2, ArrowLeft } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

export default function ForgotPassword({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/forgot-password`, { email });
      setMessage({ type: "success", text: "Kode verifikasi telah dikirim ke email Anda! ✅" });
      setStep(2);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Email tidak terdaftar ❌" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/reset-password`, { email, token, newPassword });
      setMessage({ type: "success", text: "Password berhasil diubah! Silakan login. 🎉" });
      setTimeout(onBackToLogin, 2000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Kode verifikasi salah atau kadaluarsa ❌" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen relative bg-blue-900 justify-center items-center">
      <div className="relative z-10 w-full flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full bg-white bg-opacity-10 p-8 rounded-3xl backdrop-blur-md border border-white border-opacity-20 text-white shadow-xl">
          
          <h2 className="text-3xl font-bold text-center mb-2">LUPA PASSWORD</h2>
          <p className="text-center text-sm mb-8 opacity-80">
            {step === 1 ? "Masukkan email untuk menerima kode verifikasi reset password" : "Masukkan kode verifikasi dari email dan password baru Anda"}
          </p>

          {message.text && (
            <div className={`p-3 rounded-lg mb-6 text-center text-sm ${message.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={step === 1 ? handleRequestToken : handleResetPassword} className="space-y-4">
            <input
              type="email"
              placeholder="Email Terdaftar"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={step === 2 || loading}
              className="w-full px-5 py-3 rounded-full bg-white text-black text-lg focus:outline-none"
              required
            />

            {step === 2 && (
              <>
                <input
                  type="text"
                  placeholder="Masukkan Kode Verifikasi"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-5 py-3 rounded-full bg-white text-black text-lg focus:outline-none"
                  required
                />
                <input
                  type="password"
                  placeholder="Password Baru"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-5 py-3 rounded-full bg-white text-black text-lg focus:outline-none"
                  required
                />
              </>
            )}

            {/* Tombol Utama */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-blue-700 font-bold rounded-full hover:bg-gray-100 transition shadow-lg flex justify-center items-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : (step === 1 ? "Kirim Kode Verifikasi" : "Reset Password")}
            </button>

            {/* Tombol Kembali ke Login */}
            <div className="pt-4 flex justify-center">
              <button 
                type="button"
                onClick={onBackToLogin} 
                className="flex items-center text-xs opacity-70 hover:opacity-100 hover:text-blue-300 transition-all bg-transparent border-none p-0"
              >
                <ArrowLeft size={14} className="mr-1" /> Kembali ke Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}