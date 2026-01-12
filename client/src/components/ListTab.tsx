import { useEffect, useState } from "react";
import BookingTab from "./BookingTab";

type BookingData = {
  id?: number;
  room: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  pic: string | null;
  unitKerja?: string | null;
};

type ListTabProps = {
  history: BookingData[];
  setHistory: React.Dispatch<React.SetStateAction<any[]>>;
};

export default function ListTab({ history, setHistory }: ListTabProps) {
  const [editingBooking, setEditingBooking] = useState<BookingData | null>(null);

  // ✅ Ambil riwayat booking user berdasarkan token
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
        setHistory(data);
      } catch (err) {
        console.error("❌ Error fetch my bookings:", err);
      }
    };

    fetchBookings();
  }, [setHistory]);

  if (!history || history.length === 0) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Belum ada riwayat peminjaman.</p>
      </div>
    );
  }

  const handleCancel = async (index: number) => {
    const booking = history[index];

    const confirmCancel = window.confirm(
      `Apakah Anda yakin ingin membatalkan peminjaman ruangan "${booking.room}" pada tanggal ${booking.date} pukul ${booking.startTime} - ${booking.endTime}?`
    );

    if (!confirmCancel) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cancel-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });


      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal batalkan booking");
      }

      setHistory((prev) => prev.filter((_, i) => i !== index));

      alert("✅ Peminjaman berhasil dibatalkan!");
    } catch (error) {
      console.error("❌ Error cancel booking:", error);
      alert("❌ Terjadi kesalahan saat koneksi ke server");
    }
  };

  // ✅ Fungsi cek apakah booking sudah lewat
  const isPastBooking = (date: string | null, endTime: string | null) => {
    if (!date || !endTime) return false;
    const bookingEnd = new Date(`${date}T${endTime}:00`);
    return bookingEnd < new Date();
  };

  // ✅ Dipanggil setelah berhasil edit
  const handleBookingUpdated = (updated: BookingData) => {
    setHistory((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
    setEditingBooking(null); // tutup modal
  };

  return (
    <div className="p-3">
      <div className="space-y-4">
        {history.map((item, idx) => (
          <div
            key={item._id || idx}
            className="p-4 border rounded-lg shadow-sm bg-white flex justify-between items-start"
          >
            {/* Info booking */}
            <div className="grid grid-cols-[100px_10px_1fr] gap-y-2">
              <p className="text-sm font-semibold">Ruangan</p>
              <p className="text-sm">:</p>
              <p className="text-sm">{item.room}</p>

              <p className="text-sm font-semibold">Tanggal</p>
              <p className="text-sm">:</p>
              <p className="text-sm">{item.date}</p>

              <p className="text-sm font-semibold">Waktu</p>
              <p className="text-sm">:</p>
              <p className="text-sm">
                {item.startTime} - {item.endTime}
              </p>

              <p className="text-sm font-semibold">PIC</p>
              <p className="text-sm">:</p>
              <p className="text-sm">{item.pic}</p>
            </div>

            {/* Tombol Aksi */}
            <div className="flex flex-col gap-2 ml-4 mt-2">
              {!isPastBooking(item.date, item.endTime) && (
                <>
                  <button
                    onClick={() => handleCancel(idx)}
                    className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-700"
                  >
                    Batalkan
                  </button>
                  <button
                    onClick={() => setEditingBooking(item)}
                    className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-700"
                  >
                    Edit Peminjaman
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Edit Booking */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Edit Peminjaman</h2>
              <button
                onClick={() => setEditingBooking(null)}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
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
