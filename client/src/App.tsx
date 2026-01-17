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
      <div className="hidden md:flex fixed top-0 left-0 right-0 bg-white text-black items-center justify-between px-4 py-1 shadow z-50">
        <div className="flex items-center space-x-6">
          <img src="/logokemnaker.png" alt="Logo Kemnaker" className="h-12" />
          <img src="/logovokasi.png" alt="Logo Vokasi" className="h-5" />
        </div>

        <div className="flex space-x-14 text-sm">
          <button
            onClick={() => setTab('book')}
            className={`flex flex-col items-center justify-center min-w-[185px] px-4 py-2 rounded-lg border focus:outline-none focus:ring-0 ${
              tab === 'book' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <CalendarCheck size={20} />
            <span>PINJAM RUANGAN</span>
          </button>

          <button
            onClick={() => setTab('booklist')}
            className={`flex flex-col items-center justify-center min-w-[185px] px-4 py-2 rounded-lg border focus:outline-none focus:ring-0 ${
              tab === 'booklist' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <List size={20} />
            <span>RIWAYAT PEMINJAMAN</span>
          </button>

          <button
            onClick={() => setTab('manage')}
            className={`flex flex-col items-center justify-center min-w-[185px] px-4 py-2 rounded-lg border focus:outline-none focus:ring-0 ${
              tab === 'manage' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <User size={20} />
            <span>AKUN</span>
          </button>
        </div>
      </div>

      {/* NAVBAR BAWAH → hanya tampil di mobile */}
      <div className="flex md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow z-50">
        <button
          onClick={() => setTab('book')}
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-transform active:scale-90 active:shadow-lg bg-white focus:outline-none focus:ring-0 ${
            tab === 'book' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <CalendarCheck size={24} />
          <span className="text-xs">Pinjam Ruangan</span>
        </button>

        <button
          onClick={() => setTab('booklist')}
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-transform active:scale-90 active:shadow-lg bg-white focus:outline-none focus:ring-0 ${
            tab === 'booklist' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <List size={24} />
          <span className="text-xs">Riwayat Peminjaman</span>
        </button>

        <button
          onClick={() => setTab('manage')}
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-transform active:scale-90 active:shadow-lg bg-white focus:outline-none focus:ring-0 ${
            tab === 'manage' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <User size={24} />
          <span className="text-xs">Akun</span>
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
