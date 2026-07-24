/* Generator template Excel: Database Tenaga Kerja & HOK + Kehadiran (Fingerprint).
   Kolom & nilai referensi diselaraskan dengan model data aplikasi (LB_WORKERS, LB_ATTEND,
   LB_WORKTYPES, LB_RATES, FS_ROSTER). Jalankan: node scripts/gen-hok-template.mjs
   Output: public/Template-Database-Tenaga-Kerja-HOK.xlsx */
import ExcelJS from "exceljs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "Template-Database-Tenaga-Kerja-HOK.xlsx");

/* ---- nilai referensi (selaras aplikasi) ---- */
const BLOK       = ["Blok 1", "Blok 2", "Blok 3", "Blok 4"];
const KODE_BLOK  = ["GH-B01", "GH-B02", "GH-B03", "GH-B04"];
const REGU       = ["Regu HOK Blok 1", "Regu HOK Blok 2", "Regu HOK Blok 3", "Regu HOK Blok 4"];
const FS         = ["Yudha Kubil", "Saktian", "Indra", "Asep Ganjar"];
const TIPE       = ["HOK Reguler", "HOK Musiman", "Borongan", "Tenaga Spesialis", "Estate Manager", "Agronomy Head", "Field Supervisor", "Warehouse Officer", "Water Management Officer"];
const PERAN      = ["Ketua Regu", "Anggota HOK"];
const STATUS     = ["Aktif", "Tidak Aktif", "Berhenti"];
const AVAIL      = ["Tersedia", "Sedang bertugas", "Cuti/Izin", "Tidak tersedia"];
const DOKUMEN    = ["Lengkap", "Belum lengkap", "Menunggu verifikasi"];
const KEHADIRAN  = ["Hadir penuh", "Setengah hari", "Lembur", "Izin", "Sakit", "Tidak hadir"];
const NILAI_HOK  = ["1", "0.5", "0"];
const VERIF      = ["Terverifikasi", "Menunggu verifikasi"];
const BANK       = ["BRI", "BNI", "Mandiri", "BJB", "BCA"];
const GENDER     = ["L", "P"];
const DEVICE     = ["FP-B01 · Fingerspot Revo", "FP-B02 · Fingerspot Revo", "FP-B03 · Solution X105", "FP-B04 · Fingerspot Revo-W"];
const SUMBER     = ["Fingerprint", "Manual"];

const WORKTYPES = [
 ["PK-LBH", "Pembuatan lubang tanam", "Persiapan lahan", "lubang", 60, 80000, "Sedang"],
 ["PK-TAN", "Penanaman bibit", "Penanaman", "pohon", 70, 80000, "Sedang"],
 ["PK-SUL", "Penyulaman", "Penanaman", "pohon", 80, 80000, "Ringan"],
 ["PK-PUP", "Pemupukan", "Perawatan", "pohon", 120, 80000, "Ringan"],
 ["PK-SIA", "Penyiangan / babat", "Perawatan", "m²", 400, 80000, "Ringan"],
 ["PK-SEM", "Penyemprotan HPT", "Perawatan", "pohon", 150, 90000, "Sedang"],
 ["PK-PGK", "Pemangkasan", "Perawatan", "pohon", 90, 85000, "Sedang"],
 ["PK-SIR", "Penyiraman", "Perawatan", "pohon", 200, 80000, "Ringan"],
 ["PK-IRG", "Pemasangan irigasi", "Infrastruktur", "m", 120, 95000, "Berat"],
 ["PK-SEN", "Sensus tanaman", "Monitoring", "pohon", 250, 85000, "Sedang"],
 ["PK-INS", "Inspeksi tanaman", "Monitoring", "pohon", 300, 85000, "Ringan"],
 ["PK-PAN", "Pemanenan", "Panen", "kg", 180, 90000, "Sedang"],
 ["PK-SOR", "Sortasi hasil", "Panen", "kg", 300, 80000, "Ringan"],
 ["PK-ANG", "Pengangkutan", "Logistik", "trip", 8, 85000, "Berat"],
 ["PK-MSN", "Operasi mesin", "Mekanisasi", "jam", 7, 110000, "Berat"],
 ["PK-PET", "Pemetaan lapangan", "Monitoring", "petak", 3, 100000, "Sedang"],
];
const RATES = [
 ["RATE-2026", "Tarif Standar 2026", 80000, 40000, 12000, "per output", "2026-01-01", "Aktif"],
 ["RATE-SPES", "Tarif Spesialis (mesin/irigasi)", 110000, 55000, 16000, "per output", "2026-01-01", "Aktif"],
 ["RATE-2025", "Tarif Standar 2025", 75000, 37500, 11000, "per output", "2025-01-01", "Nonaktif"],
];

/* ---- helpers gaya ---- */
const GREEN = "FF166534", GREENL = "FFDCFCE7", HEADTXT = "FFFFFFFF", AMBERL = "FFFEF3C7", GRAY = "FFF3F4F6";
const border = { top: { style: "thin", color: { argb: "FFE5E7EB" } }, left: { style: "thin", color: { argb: "FFE5E7EB" } }, bottom: { style: "thin", color: { argb: "FFE5E7EB" } }, right: { style: "thin", color: { argb: "FFE5E7EB" } } };

function styleHeader(ws, row = 1) {
 const r = ws.getRow(row);
 r.eachCell((c) => {
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
  c.font = { bold: true, color: { argb: HEADTXT }, size: 11 };
  c.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  c.border = border;
 });
 r.height = 30;
}
function fillRow(ws, rowIdx, argb) { ws.getRow(rowIdx).eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb } }; c.font = { italic: true, color: { argb: "FF6B7280" } }; }); }
function applyBorders(ws, fromRow, toRow, cols) { for (let r = fromRow; r <= toRow; r++) for (let c = 1; c <= cols; c++) ws.getCell(r, c).border = border; }
function dv(ws, col, fromRow, toRow, formula) { for (let r = fromRow; r <= toRow; r++) ws.getCell(r, col).dataValidation = { type: "list", allowBlank: true, formulae: [formula], showErrorMessage: true, errorStyle: "warning", error: "Nilai di luar daftar referensi.", errorTitle: "Cek referensi" }; }

const wb = new ExcelJS.Workbook();
wb.creator = "VarmOS Plantation";
wb.created = new Date("2026-07-24T00:00:00Z");

/* ================= Sheet: Petunjuk ================= */
const ws0 = wb.addWorksheet("Petunjuk", { properties: { tabColor: { argb: GREEN } } });
ws0.columns = [{ width: 3 }, { width: 26 }, { width: 90 }];
const lines = [
 ["", "TEMPLATE DATABASE TENAGA KERJA & HOK — Kebun Agroforestry Gunung Hejo, Purwakarta", "title"],
 ["", "Diisi oleh tim lapangan, lalu diimpor kembali ke VarmOS Plantation.", "sub"],
 ["", "", ""],
 ["", "Lembar / Sheet", "Keterangan"],
 ["", "1. Data Pekerja", "Master data tenaga kerja HOK: identitas, penempatan (blok/regu/mandor), tipe, status, rekening, kelengkapan dokumen, dan ID Fingerprint."],
 ["", "2. Kehadiran (Fingerprint)", "Rekaman kehadiran harian dari mesin sidik jari per blok. Nilai HOK dihitung dari status kehadiran (Hadir penuh=1, Setengah hari=0,5, lainnya=0)."],
 ["", "3. Jenis Pekerjaan & Tarif HOK", "Referensi jenis pekerjaan (standar output/hari) dan tarif upah HOK. Untuk acuan pengisian & perhitungan — umumnya tidak diubah tim lapangan."],
 ["", "4. Referensi", "Daftar nilai baku untuk dropdown (blok, regu, mandor, status, dll). Jangan mengubah lembar ini."],
 ["", "", ""],
 ["", "Cara pengisian", ""],
 ["", "• Baris CONTOH (kuning)", "Baris berlatar kuning hanya contoh format — HAPUS sebelum file diserahkan/diimpor."],
 ["", "• Kolom bertanda *", "Wajib diisi."],
 ["", "• Sel dropdown", "Pilih dari daftar (panah di sel). Nilai harus sesuai daftar Referensi agar impor tidak gagal."],
 ["", "• ID Pekerja", "Format TK-#### (mis. TK-1001). Harus unik & konsisten antara sheet Data Pekerja dan Kehadiran."],
 ["", "• ID Fingerprint", "Nomor enrollment pekerja di mesin sidik jari — kunci pencocokan data kehadiran ke pekerja."],
 ["", "• Tanggal", "Format YYYY-MM-DD (mis. 2026-07-20). Jam: HH:MM 24 jam (mis. 06:52)."],
 ["", "• Nomor rekening", "Isi lengkap; ini data sensitif — pastikan penanganan sesuai kebijakan."],
 ["", "", ""],
 ["", "Catatan", "40 pekerja terbagi per blok: Blok 1 = 10, Blok 2 = 10, Blok 3 = 6, Blok 4 = 14 (1 Ketua Regu + anggota per blok). Sesuaikan bila komposisi berubah."],
];
lines.forEach((l, i) => {
 const row = ws0.addRow(l);
 if (l[2] === "title") { ws0.mergeCells(`B${i + 1}:C${i + 1}`); row.getCell(2).font = { bold: true, size: 14, color: { argb: GREEN } }; }
 else if (l[2] === "sub") { ws0.mergeCells(`B${i + 1}:C${i + 1}`); row.getCell(2).font = { italic: true, color: { argb: "FF6B7280" } }; }
 else if (l[1] === "Lembar / Sheet" || l[1] === "Cara pengisian" || l[1] === "Catatan") { row.getCell(2).font = { bold: true, color: { argb: GREEN } }; row.getCell(3).font = { bold: true, color: { argb: GREEN } }; }
 else { row.getCell(2).font = { bold: true }; row.getCell(3).alignment = { wrapText: true, vertical: "top" }; }
});

/* ================= Sheet: Referensi ================= */
const wsR = wb.addWorksheet("Referensi", { properties: { tabColor: { argb: "FF9CA3AF" } } });
const refCols = [
 ["Blok", BLOK], ["Kode Blok", KODE_BLOK], ["Regu", REGU], ["Field Supervisor (Mandor)", FS],
 ["Tipe Pekerja", TIPE], ["Peran", PERAN], ["Status Pekerja", STATUS], ["Ketersediaan", AVAIL],
 ["Kelengkapan Dokumen", DOKUMEN], ["Status Kehadiran", KEHADIRAN], ["Nilai HOK", NILAI_HOK],
 ["Status Verifikasi", VERIF], ["Bank", BANK], ["Jenis Kelamin", GENDER], ["Mesin Fingerprint", DEVICE], ["Sumber Data", SUMBER],
];
wsR.getRow(1).values = ["", ...refCols.map((c) => c[0])];
for (let c = 0; c < refCols.length; c++) {
 const list = refCols[c][1];
 wsR.getColumn(c + 2).width = Math.max(16, refCols[c][0].length + 2);
 for (let r = 0; r < list.length; r++) wsR.getCell(r + 2, c + 2).value = list[r];
}
styleHeader(wsR, 1);
applyBorders(wsR, 2, 10, refCols.length + 1);
wsR.views = [{ state: "frozen", ySplit: 1 }];
/* helper: kolom referensi 1-based index → huruf */
const refRange = (idx, n) => { const col = wsR.getColumn(idx + 1).letter; return `Referensi!$${col}$2:$${col}$${1 + n}`; };
const R = {}; refCols.forEach((c, i) => { R[c[0]] = refRange(i + 1, c[1].length); });

/* ================= Sheet: Data Pekerja ================= */
const wsP = wb.addWorksheet("Data Pekerja", { properties: { tabColor: { argb: GREEN } } });
const pCols = [
 ["No", 5], ["ID Pekerja *", 12], ["Nama Lengkap *", 22], ["No. HP *", 15], ["NIK (KTP)", 20],
 ["Jenis Kelamin", 13], ["Tanggal Lahir", 14], ["Domisili (Desa) *", 16], ["Blok Penugasan *", 15],
 ["Regu *", 17], ["Peran *", 14], ["Tipe Pekerja *", 16], ["Field Supervisor (Mandor)", 20],
 ["Keahlian", 28], ["Tanggal Bergabung", 16], ["Status *", 13], ["Ketersediaan", 16],
 ["Bank", 10], ["No. Rekening", 16], ["Kelengkapan Dokumen", 18], ["ID Fingerprint", 14], ["Catatan", 26],
];
wsP.columns = pCols.map(([header, width]) => ({ header, width }));
styleHeader(wsP, 1);
wsP.views = [{ state: "frozen", xSplit: 3, ySplit: 1 }];
const pEx = [
 [1, "TK-1001", "Asep Suryana", "081234500001", "3214010203040001", "L", "1990-05-12", "Gununghejo", "Blok 1", "Regu HOK Blok 1", "Ketua Regu", "HOK Reguler", "Yudha Kubil", "Pemupukan; Penyiangan", "2023-02-15", "Aktif", "Tersedia", "BRI", "0021-01-000123", "Lengkap", "1001", "Contoh — hapus baris ini"],
 [2, "TK-1002", "Dedi Nugraha", "081234500002", "3214010203040002", "L", "1995-08-03", "Cirende", "Blok 1", "Regu HOK Blok 1", "Anggota HOK", "HOK Musiman", "Yudha Kubil", "Penyemprotan HPT", "2024-06-01", "Aktif", "Sedang bertugas", "BNI", "0192-77-000456", "Belum lengkap", "1002", "Contoh — hapus baris ini"],
];
pEx.forEach((r) => wsP.addRow(r));
fillRow(wsP, 2, AMBERL); fillRow(wsP, 3, AMBERL);
const P_ROWS = 60;
for (let i = 0; i < P_ROWS; i++) wsP.addRow([pEx.length + 1 + i]);
applyBorders(wsP, 2, 1 + pEx.length + P_ROWS, pCols.length);
const pLast = 1 + pEx.length + P_ROWS;
dv(wsP, 6, 2, pLast, R["Jenis Kelamin"]);
dv(wsP, 9, 2, pLast, R["Blok"]);
dv(wsP, 10, 2, pLast, R["Regu"]);
dv(wsP, 11, 2, pLast, R["Peran"]);
dv(wsP, 12, 2, pLast, R["Tipe Pekerja"]);
dv(wsP, 13, 2, pLast, R["Field Supervisor (Mandor)"]);
dv(wsP, 16, 2, pLast, R["Status Pekerja"]);
dv(wsP, 17, 2, pLast, R["Ketersediaan"]);
dv(wsP, 18, 2, pLast, R["Bank"]);
dv(wsP, 20, 2, pLast, R["Kelengkapan Dokumen"]);
["No. HP *", "No. Rekening", "ID Fingerprint", "NIK (KTP)"].forEach(() => {});
[4, 5, 19, 21].forEach((col) => { for (let r = 2; r <= pLast; r++) wsP.getCell(r, col).numFmt = "@"; }); /* teks agar 0 di depan tidak hilang */

/* ================= Sheet: Kehadiran (Fingerprint) ================= */
const wsA = wb.addWorksheet("Kehadiran (Fingerprint)", { properties: { tabColor: { argb: "FF1D4ED8" } } });
const aCols = [
 ["No", 5], ["Tanggal *", 13], ["ID Pekerja *", 12], ["Nama", 22], ["Blok *", 12],
 ["Mesin Fingerprint", 26], ["Jam Masuk", 12], ["Jam Pulang", 12], ["Status Kehadiran *", 17],
 ["Nilai HOK", 11], ["Jam Lembur (OT)", 14], ["Sumber Data", 13], ["Status Verifikasi", 17], ["Catatan", 24],
];
wsA.columns = aCols.map(([header, width]) => ({ header, width }));
styleHeader(wsA, 1);
wsA.views = [{ state: "frozen", xSplit: 4, ySplit: 1 }];
const aEx = [
 [1, "2026-07-20", "TK-1001", "Asep Suryana", "Blok 1", "FP-B01 · Fingerspot Revo", "06:52", "15:10", "Hadir penuh", 1, 0, "Fingerprint", "Terverifikasi", "Contoh — hapus baris ini"],
 [2, "2026-07-20", "TK-1002", "Dedi Nugraha", "Blok 1", "FP-B01 · Fingerspot Revo", "06:58", "11:20", "Setengah hari", 0.5, 0, "Fingerprint", "Menunggu verifikasi", "Contoh — hapus baris ini"],
];
aEx.forEach((r) => wsA.addRow(r));
fillRow(wsA, 2, AMBERL); fillRow(wsA, 3, AMBERL);
const A_ROWS = 120;
for (let i = 0; i < A_ROWS; i++) wsA.addRow([aEx.length + 1 + i]);
const aLast = 1 + aEx.length + A_ROWS;
applyBorders(wsA, 2, aLast, aCols.length);
dv(wsA, 5, 2, aLast, R["Blok"]);
dv(wsA, 6, 2, aLast, R["Mesin Fingerprint"]);
dv(wsA, 9, 2, aLast, R["Status Kehadiran"]);
dv(wsA, 10, 2, aLast, R["Nilai HOK"]);
dv(wsA, 12, 2, aLast, R["Sumber Data"]);
dv(wsA, 13, 2, aLast, R["Status Verifikasi"]);
[3].forEach((col) => { for (let r = 2; r <= aLast; r++) wsA.getCell(r, col).numFmt = "@"; });

/* ================= Sheet: Jenis Pekerjaan & Tarif HOK ================= */
const wsH = wb.addWorksheet("Jenis Pekerjaan & Tarif HOK", { properties: { tabColor: { argb: "FFB45309" } } });
wsH.addRow(["JENIS PEKERJAAN — standar output & tarif per HOK"]);
wsH.getRow(1).getCell(1).font = { bold: true, size: 12, color: { argb: GREEN } };
const wtHead = ["Kode", "Jenis Pekerjaan", "Kategori", "Satuan", "Standar Output / HOK", "Tarif (Rp / HOK)", "Tingkat Kesulitan"];
wsH.addRow(wtHead);
styleHeader(wsH, 2);
WORKTYPES.forEach((w) => wsH.addRow(w));
const wtLast = 2 + WORKTYPES.length;
applyBorders(wsH, 3, wtLast, wtHead.length);
for (let r = 3; r <= wtLast; r++) wsH.getCell(r, 6).numFmt = '#,##0';
wsH.addRow([]); wsH.addRow([]);
const rateTitleRow = wtLast + 3;
wsH.getCell(rateTitleRow, 1).value = "TARIF UPAH HOK";
wsH.getCell(rateTitleRow, 1).font = { bold: true, size: 12, color: { argb: GREEN } };
const rHead = ["Kode Tarif", "Nama Tarif", "HOK Penuh (Rp)", "Setengah Hari (Rp)", "Lembur / jam (Rp)", "Borongan", "Berlaku Sejak", "Status"];
wsH.addRow(rHead);
styleHeader(wsH, rateTitleRow + 1);
RATES.forEach((r) => wsH.addRow(r));
const rLast = rateTitleRow + 1 + RATES.length;
applyBorders(wsH, rateTitleRow + 2, rLast, rHead.length);
for (let r = rateTitleRow + 2; r <= rLast; r++) [3, 4, 5].forEach((c) => wsH.getCell(r, c).numFmt = '#,##0');
[["A", 12], ["B", 34], ["C", 16], ["D", 18], ["E", 18], ["F", 14], ["G", 14], ["H", 12]].forEach(([col, w]) => { wsH.getColumn(col).width = w; });

await wb.xlsx.writeFile(OUT);
console.log("Wrote", OUT);
