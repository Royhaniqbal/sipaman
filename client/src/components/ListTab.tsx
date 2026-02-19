import { useEffect, useState } from "react";
import BookingTab from "./BookingTab";

type BookingData = {
  id?: any;
  _id?: any;
  room: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  pic: string | null;
  unitKerja?: string | null;
  agenda?: string | null;
};

type ListTabProps = {
  history: BookingData[];
  setHistory: React.Dispatch<React.SetStateAction<any[]>>;
};

export default function ListTab({ history, setHistory }: ListTabProps) {
  const [editingBooking, setEditingBooking] = useState<BookingData | null>(null);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/my-bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Gagal fetch riwayat booking");

        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Error fetch my bookings:", err);
      }
    };

    fetchBookings();
  }, [setHistory]);

  const handleCancel = async (index: number) => {
    const booking = history[index];
    const confirmCancel = window.confirm(
      `Apakah Anda yakin ingin membatalkan peminjaman ruangan "${booking.room}"?`
    );

    if (!confirmCancel) return;
    setLoadingIndex(index);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cancel-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Gagal batalkan booking");

      setHistory((prev) => prev.filter((_, i) => i !== index));
      alert("✅ Peminjaman berhasil dibatalkan!");
    } catch (error) {
      console.error("❌ Error cancel booking:", error);
      alert("❌ Terjadi kesalahan saat koneksi ke server");
    }
    finally {
      setLoadingIndex(null); // 👈 Selesai loading
    }
  };

  const isPastBooking = (date: string | null, endTime: string | null) => {
    if (!date || !endTime) return false;
    return new Date(`${date}T${endTime}:00`) < new Date();
  };

  const handleBookingUpdated = (updated: BookingData) => {
    setHistory((prev) =>
      prev.map((b) => {
        const bId = b.id || b._id;
        const uId = updated.id || updated._id;
        return bId === uId ? { ...b, ...updated } : b;
      })
    );
    setEditingBooking(null);
  };

  if (!history || history.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-gray-400 italic font-normal">Belum ada riwayat peminjaman.</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="space-y-4">
        {history.map((item, idx) => {
          const past = isPastBooking(item.date, item.endTime);
          return (
            <div
              key={item._id || item.id || idx}
              className={`p-5 border rounded-2xl shadow-sm bg-white flex flex-col md:flex-row justify-between items-start transition-all ${
                past ? "opacity-60 bg-gray-50" : "hover:border-blue-200 shadow-md"
              }`}
            >
              <div className={`grid grid-cols-[110px_10px_1fr] gap-y-1 w-full font-normal ${past ? "text-gray-400" : "text-black"}`}>
              <p className={`text-sm font-bold uppercase text-[10px] self-center ${past ? "text-gray-400" : "text-black"}`}>Ruangan</p>
              <p className="text-sm">:</p>
              <p className={`text-sm font-bold ${past ? "text-gray-400" : "text-black"}`}>{item.room}</p>

              <p className={`text-sm font-bold uppercase text-[10px] self-center ${past ? "text-gray-400" : "text-black"}`}>Waktu</p>
              <p className="text-sm">:</p>
              <p className="text-sm font-bold">{item.date} | <span className="font-bold">{item.startTime} - {item.endTime}</span></p>

              <p className={`text-sm font-bold uppercase text-[10px] self-center ${past ? "text-gray-400" : "text-black"}`}>PIC / Unit</p>
              <p className="text-sm">:</p>
              <p className="text-sm font-bold">{item.pic} <span className={past ? "text-gray-400" : "text-gray-400"}>/ {item.unitKerja || "-"}</span></p>

              <p className={`text-sm font-bold uppercase text-[10px] self-center ${past ? "text-gray-400" : "text-black"}`}>Agenda</p>
              <p className="text-sm">:</p>
              <p className={`text-sm font-bold ${past ? "text-gray-400" : "text-gray-700"}`}>"{item.agenda || "-"}"</p>
            </div>

            <div className="flex flex-row md:flex-col gap-2 w-full md:w-32 mt-4 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0">
              {!past ? (
                <>
                  {/* TOMBOL EDIT */}
                  <button
                    onClick={() => setEditingBooking(item)}
                    disabled={loadingIndex !== null}
                    className="flex-1 w-full py-2.5 text-xs rounded-xl font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100"
                  >
                    Edit
                  </button>

                  {/* TOMBOL BATAL / MEMPROSES */}
                  <button
                    onClick={() => handleCancel(idx)}
                    disabled={loadingIndex !== null}
                    className={`flex-1 w-full py-2.5 text-xs rounded-xl font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 ${
                      loadingIndex === idx
                        ? "bg-gray-100 text-gray-500 cursor-wait border border-gray-200"
                        : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100"
                    }`}
                  >
                    {loadingIndex === idx ? (
                      <>
                        <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Memproses...</span>
                      </>
                    ) : (
                      "Batal"
                    )}
                  </button>
                </>
              ) : (
                <span className="w-full py-2 text-[10px] font-bold text-gray-400 bg-gray-100 rounded-full uppercase text-center border border-gray-200">
                  Selesai
                </span>
              )}
            </div>
            </div>
          );
        })}
      </div>

      {/* MODAL EDIT BOOKING */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Edit Peminjaman Ruangan</h2>
              <button
                onClick={() => setEditingBooking(null)}
                className="text-gray-400 hover:text-red-500 transition-colors text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <BookingTab
                setHistory={setHistory}
                editingBooking={editingBooking}
                onFinishEdit={handleBookingUpdated}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}