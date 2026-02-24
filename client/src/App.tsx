import { useState } from 'react'
import './App.css'
import BookingTab from './components/BookingTab';
import ListTab from './components/ListTab';
import ManageTab from './components/ManageTab';
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";

import {
  CalendarCheck,
  List, 
  User,
} from 'lucide-react';

interface User {
  username: string;
  email: string;
  role: string;
}

function App() {
  const [tab, setTab] = useState('book');
  const [history, setHistory] = useState<any[]>([]); 
  const [user, setUser] = useState<User | null>(null);
  //const [authPage, setAuthPage] = useState<"login" | "register">("login"); //code lama
  const [authPage, setAuthPage] = useState<"login" | "register" | "forgot-password">("login");

  const renderTab = () => {
    switch (tab) {
      case 'book': 
        return <BookingTab setHistory={setHistory} />;
      case 'booklist': 
        return <ListTab history={history} setHistory={setHistory} />;
      case 'manage': 
        return <ManageTab />;
      default: 
        return <BookingTab setHistory={setHistory} />;
    }
  };

  if (!user) {
    if (authPage === "login") return (
      <Login 
        onLogin={(u) => setUser(u)} 
        onSwitchToRegister={() => setAuthPage("register")} 
        onForgotPassword={() => setAuthPage("forgot-password")} // Prop baru
      />
    );
    if (authPage === "register") return (
      <Register onRegister={(u) => setUser(u)} onSwitchToLogin={() => setAuthPage("login")} />
    );
    if (authPage === "forgot-password") return (
      <ForgotPassword onBackToLogin={() => setAuthPage("login")} />
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      
      {/* NAVBAR ATAS → hanya tampil di layar medium ke atas */}
      {/* NAVBAR ATAS (Desktop) */}
     {/* NAVBAR ATAS (Desktop) */}
      <div className="hidden md:flex fixed top-0 left-0 right-0 bg-white border-b border-gray-100 text-black items-center justify-between px-10 h-20 z-50">
        
        {/* Sisi Kiri: Branding */}
        <div className="flex items-center space-x-6">
          <img src="/logokemnaker.png" alt="Logo Kemnaker" className="h-10 w-auto object-contain" />
          <div className="w-[1px] h-8 bg-gray-200"></div>
          <img src="/logovokasi.png" alt="Logo Vokasi" className="h-4 w-auto object-contain" />
        </div>

        {/* Sisi Kanan: Navigasi Minimalist 3D (Mentok Kanan) */}
        <div className="flex items-center space-x-12">
          <button
            onClick={() => setTab('book')}
            className={`group flex flex-col items-center gap-1 transition-all duration-300 !border-none !outline-none focus:ring-0 ${
              tab === 'book' ? 'scale-110' : 'hover:scale-105'
            }`}
          >
            <CalendarCheck 
              size={22} 
              className={`transition-all duration-300 ${
                tab === 'book' 
                  ? 'text-blue-600 drop-shadow-[0_4px_3px_rgba(37,99,235,0.4)]' 
                  : 'text-gray-400 group-hover:text-gray-600'
              }`} 
            />
            <span className={`text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${
              tab === 'book' 
                ? 'text-blue-600 [text-shadow:0_2px_4px_rgba(37,99,235,0.3)]' 
                : 'text-gray-500 group-hover:text-gray-700'
            }`}>
              Pinjam Ruangan
            </span>
            <div className={`h-1 w-5 rounded-full transition-all duration-300 ${tab === 'book' ? 'bg-blue-600 shadow-[0_2px_4px_rgba(37,99,235,0.4)]' : 'bg-transparent'}`}></div>
          </button>

          <button
            onClick={() => setTab('booklist')}
            className={`group flex flex-col items-center gap-1 transition-all duration-300 !border-none !outline-none focus:ring-0 ${
              tab === 'booklist' ? 'scale-110' : 'hover:scale-105'
            }`}
          >
            <List 
              size={22} 
              className={`transition-all duration-300 ${
                tab === 'booklist' 
                  ? 'text-blue-600 drop-shadow-[0_4px_3px_rgba(37,99,235,0.4)]' 
                  : 'text-gray-400 group-hover:text-gray-600'
              }`} 
            />
            <span className={`text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${
              tab === 'booklist' 
                ? 'text-blue-600 [text-shadow:0_2px_4px_rgba(37,99,235,0.3)]' 
                : 'text-gray-500 group-hover:text-gray-700'
            }`}>
              Riwayat Peminjaman
            </span>
            <div className={`h-1 w-5 rounded-full transition-all duration-300 ${tab === 'booklist' ? 'bg-blue-600 shadow-[0_2px_4px_rgba(37,99,235,0.4)]' : 'bg-transparent'}`}></div>
          </button>

          <button
            onClick={() => setTab('manage')}
            className={`group flex flex-col items-center gap-1 transition-all duration-300 !border-none !outline-none focus:ring-0 ${
              tab === 'manage' ? 'scale-110' : 'hover:scale-105'
            }`}
          >
            <User 
              size={22} 
              className={`transition-all duration-300 ${
                tab === 'manage' 
                  ? 'text-blue-600 drop-shadow-[0_4px_3px_rgba(37,99,235,0.4)]' 
                  : 'text-gray-400 group-hover:text-gray-600'
              }`} 
            />
            <span className={`text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${
              tab === 'manage' 
                ? 'text-blue-600 [text-shadow:0_2px_4px_rgba(37,99,235,0.3)]' 
                : 'text-gray-500 group-hover:text-gray-700'
            }`}>
              Akun
            </span>
            <div className={`h-1 w-5 rounded-full transition-all duration-300 ${tab === 'manage' ? 'bg-blue-600 shadow-[0_2px_4px_rgba(37,99,235,0.4)]' : 'bg-transparent'}`}></div>
          </button>
        </div>
      </div>

      {/* NAVBAR BAWAH → hanya tampil di mobile */}
      {/* NAVBAR BAWAH → hanya tampil di mobile dengan gaya 3D Minimalist */}
      <div className="flex md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-50 px-4">
        <button
          onClick={() => setTab('book')}
          className={`flex flex-col items-center justify-center flex-1 py-3 transition-all duration-300 !border-none !outline-none focus:ring-0 ${
            tab === 'book' ? 'scale-110' : 'active:scale-90'
          }`}
        >
          <CalendarCheck 
            size={24} 
            className={`transition-all duration-300 ${
              tab === 'book' 
                ? 'text-blue-600 drop-shadow-[0_4px_5px_rgba(37,99,235,0.4)]' 
                : 'text-gray-400'
            }`} 
          />
          <span className={`text-[10px] font-black uppercase tracking-tighter mt-1 transition-all duration-300 ${
            tab === 'book' 
              ? 'text-blue-600 [text-shadow:0_2px_4px_rgba(37,99,235,0.3)]' 
              : 'text-gray-500'
          }`}>
            Pinjam Ruangan
          </span>
        </button>

        <button
          onClick={() => setTab('booklist')}
          className={`flex flex-col items-center justify-center flex-1 py-3 transition-all duration-300 !border-none !outline-none focus:ring-0 ${
            tab === 'booklist' ? 'scale-110' : 'active:scale-90'
          }`}
        >
          <List 
            size={24} 
            className={`transition-all duration-300 ${
              tab === 'booklist' 
                ? 'text-blue-600 drop-shadow-[0_4px_5px_rgba(37,99,235,0.4)]' 
                : 'text-gray-400'
            }`} 
          />
          <span className={`text-[10px] font-black uppercase tracking-tighter mt-1 transition-all duration-300 ${
            tab === 'booklist' 
              ? 'text-blue-600 [text-shadow:0_2px_4px_rgba(37,99,235,0.3)]' 
              : 'text-gray-500'
          }`}>
            Riwayat Peminjaman
          </span>
        </button>

        <button
          onClick={() => setTab('manage')}
          className={`flex flex-col items-center justify-center flex-1 py-3 transition-all duration-300 !border-none !outline-none focus:ring-0 ${
            tab === 'manage' ? 'scale-110' : 'active:scale-90'
          }`}
        >
          <User 
            size={24} 
            className={`transition-all duration-300 ${
              tab === 'manage' 
                ? 'text-blue-600 drop-shadow-[0_4px_5px_rgba(37,99,235,0.4)]' 
                : 'text-gray-400'
            }`} 
          />
          <span className={`text-[10px] font-black uppercase tracking-tighter mt-1 transition-all duration-300 ${
            tab === 'manage' 
              ? 'text-blue-600 [text-shadow:0_2px_4px_rgba(37,99,235,0.3)]' 
              : 'text-gray-500'
          }`}>
            Akun
          </span>
        </button>
      </div>

      {/* ISI HALAMAN */}
      <main className="pt-6 md:pt-24 pb-16 md:pb-0 px-4">
        {renderTab()}
      </main>
    </div>
  )
}

export default App;
