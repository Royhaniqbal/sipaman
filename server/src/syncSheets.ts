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

// Menggunakan GoogleAuth dengan parsing private_key yang sangat ketat.
// Gunakan String.raw untuk memastikan tidak ada interpretasi karakter miring yang salah
const formattedKey = CREDENTIALS.private_key
  .replace(/\\n/g, '\n') // Mengubah teks literal \n menjadi baris baru
  .trim();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: CREDENTIALS.client_email,
    // Menggunakan String.raw untuk memastikan newline (\n) dibaca dengan benar oleh Windows
    private_key: CREDENTIALS.private_key.replace(/\\n/g, '\n'),
  },
  scopes: SCOPES,
});

const sheets = google.sheets({ version: "v4", auth });

// Spreadsheet ID
const SPREADSHEET_ID = "1ud5WmNwZlactleFzU5U92WgFcUsgAZvAobjSm0cqfxo";

// ------------------------------
// 🔹 Sheet name normalizer
// ------------------------------
function getSheetName(room: string): string {
  const cleaned = room.trim().replace(/\s+/g, " ").toLowerCase();
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
export async function appendBookingToSheet(bookingData: any) {
  try {
    const sheetName = getSheetName(bookingData.room);
    
    // Pastikan auth melakukan validasi sebelum eksekusi
    const client = await auth.getClient();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:G`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          bookingData.room,
          `'${bookingData.date}`,
          `'${bookingData.startTime}`,
          `'${bookingData.endTime}`,
          bookingData.pic,
          bookingData.unitKerja,
          bookingData.agenda,
        ]],
      },
    });
    console.log(`✅ Data booking masuk ke sheet "${sheetName}"`);
  } catch (error: any) {
    console.error("❌ Gagal Sinkron Sheets (Append):", error.message);
  }
}

// ------------------------------------
// ✅ DELETE booking dari Google Sheets
// ------------------------------------
export async function deleteBookingFromSheet(bookingData: any) {
  try {
    await auth.getClient();
    const sheetName = getSheetName(bookingData.room);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:G`,
    });

    const rows = response.data.values || [];
    const normalize = (v: any) => (v ?? "").toString().trim().replace(/\s+/g, " ");

    const rowIndex = rows.findIndex((row) => {
      const [room, date, startTime, , pic] = row.map(normalize);
      return (
        room === normalize(bookingData.room) &&
        date === normalize(bookingData.date) &&
        startTime.startsWith(normalize(bookingData.startTime)) &&
        pic === normalize(bookingData.pic)
      );
    });

    if (rowIndex === -1) return;

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
  } catch (error: any) {
    console.error("❌ Gagal Sinkron Sheets (Delete):", error.message);
  }
}