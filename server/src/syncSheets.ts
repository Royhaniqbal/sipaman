import { google } from "googleapis";
import fs from "fs";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// ------------------------------
// 🔹 Load Google Credentials
// ------------------------------
const credentialsPath = process.env.GOOGLE_CREDENTIALS;
if (!credentialsPath) {
  throw new Error("GOOGLE_CREDENTIALS environment variable is not set");
}

const raw = fs.readFileSync(credentialsPath, "utf8");
const CREDENTIALS = JSON.parse(raw);

// Auth
const auth = new google.auth.GoogleAuth({
  credentials: CREDENTIALS,
  scopes: SCOPES,
});

const sheets = google.sheets({ version: "v4", auth });

// Spreadsheet ID
const SPREADSHEET_ID = "1ud5WmNwZlactleFzU5U92WgFcUsgAZvAobjSm0cqfxo";

// ------------------------------
// 🔹 Sheet name normalizer (ANTI DOUBLE SPACE)
// ------------------------------
function getSheetName(room: string): string {
  const cleaned = room
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

  const normalizedRooms: Record<string, string> = {
    "ballroom": "Ballroom",
    "ruang rapat dirjen": "Ruang Rapat Dirjen",
    "ruang rapat sesditjen": "Ruang Rapat Sesditjen",
    "command center": "Command Center",
    "ruang rapat lt2": "Ruang Rapat Lt2",
  };

  return normalizedRooms[cleaned] || "Sheet1";
}

// ------------------------------------
// ✅ APPEND booking ke Google Sheets
// ------------------------------------
export async function appendBookingToSheet(bookingData: {
  room: string;
  date: string;
  startTime: string;
  endTime: string;
  pic: string;
  unitKerja: string;
  agenda: string; 
}) {
  const sheetName = getSheetName(bookingData.room);
  const range = `${sheetName}!A:G`;

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          bookingData.room,
          `'${bookingData.date}`,      // 👈 Tambahkan petik satu
          `'${bookingData.startTime}`, // 👈 Tambahkan petik satu
          `'${bookingData.endTime}`,   // 👈 Tambahkan petik satu
          bookingData.pic,
          bookingData.unitKerja,
          bookingData.agenda,
        ],
      ],
    },
  });

  console.log(`✅ Data booking masuk ke sheet "${sheetName}"`);
}

// ------------------------------------
// ✅ DELETE booking dari Google Sheets (FINAL FIX)
// ------------------------------------
// ------------------------------------
// ✅ DELETE booking dari Google Sheets (NO HEADER - FINAL FIX)
// ------------------------------------
export async function deleteBookingFromSheet(bookingData: {
  room: string;
  date: string;
  startTime: string;
  endTime: string;
  pic: string;
  unitKerja?: string;
}) {
  const sheetName = getSheetName(bookingData.room);
  const range = `${sheetName}!A:G`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const rows = response.data.values || [];
  const normalize = (v: any) => (v ?? "").toString().trim().replace(/\s+/g, " ");

  const rowIndex = rows.findIndex((row, index) => {
    const [room, date, startTime, endTime, pic, unitKerja, agenda] = row.map(normalize);
    
    const targetRoom = normalize(bookingData.room);
    const targetDate = normalize(bookingData.date);
    const targetStart = normalize(bookingData.startTime);
    const targetPic = normalize(bookingData.pic);

    // LOG UNTUK DEBUGGING (Cukup nyalakan saat tes)
    if (index < 5) { // Cek 5 baris pertama saja agar log tidak penuh
      console.log(`--- Baris ${index} ---`);
      console.log(`Room: "${room}" vs "${targetRoom}" -> ${room === targetRoom}`);
      console.log(`Date: "${date}" vs "${targetDate}" -> ${date === targetDate}`);
      console.log(`Time: "${startTime}" startsWith "${targetStart}" -> ${startTime.startsWith(targetStart)}`);
      console.log(`PIC: "${pic}" vs "${targetPic}" -> ${pic === targetPic}`);
    }

    return (
      room === targetRoom &&
      date === targetDate &&
      startTime.startsWith(targetStart) &&
      pic === targetPic
    );
  });

  if (rowIndex === -1) {
    console.error("❌ Data tidak ditemukan untuk dihapus:", bookingData);
    return;
  }

  // Lanjutkan proses batchUpdate deleteDimension seperti biasa...
  const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetId = sheetInfo.data.sheets?.find(s => s.properties?.title === sheetName)?.properties?.sheetId;

  if (sheetId !== undefined) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: { sheetId, dimension: "ROWS", startIndex: rowIndex, endIndex: rowIndex + 1 }
          }
        }]
      }
    });
    console.log(`🗑️ Baris ${rowIndex + 1} di sheet "${sheetName}" berhasil dihapus`);
  }
}
