# Audit Navigasi VarmOS Plantation

**Tanggal:** 23 Juli 2026 · **Sumber:** `src/App.jsx` (NAV, PAGE_TITLE, ROLES, Sidebar, CommandPalette, field nav) · **Status:** REVIEW — belum ada perubahan kode

---

## 1. Executive Summary

**Mengapa terasa kompleks:** sidebar memuat **18 grup top-level dengan ±49 item terlihat** (65 page ID total), padahal guardrail-nya 6–8 grup. Struktur mengikuti *arsitektur sistem* (Hybrid Sensing, Data Quality, Integration Hub sebagai silo), bukan *pekerjaan pengguna* — pengguna harus tahu datanya berasal dari satelit/sensor/sensus sebelum menemukan fiturnya.

**Masalah paling utama:** (1) dua grup raksasa 10-anak (Hybrid Sensing, Lapangan PWA) yang bukan pekerjaan melainkan teknologi/moda; (2) konsep yang sama punya 2–3 pintu masuk (verifikasi 2×, alert 2×, monitoring pohon 3×, peta 3×); (3) label campur bahasa/teknis (Command Map, Sources & Sync, Validation Rules, Sync Center, Field Pack).

**Pendekatan yang direkomendasikan:** **Alternatif 2 — Domain-Based Navigation** + role-based visibility (mekanisme `ROLES.hide` yang sudah ada) + pemisahan **mode lapangan** dari sidebar manajemen. Bukan Alternatif 3 penuh, karena struktur grup yang berubah-ubah per role melanggar prinsip *stable navigation* — kebutuhan role sudah cukup dilayani oleh visibility + Command Center yang kini role-adaptive.

**Estimasi pengurangan:** 18 grup → **8 grup** (EM) / **5 grup** (Direksi/Mitra); item terlihat ±49 → **±24**; sensing/DQ/field utilities pindah ke tab kontekstual & area Sistem. Tidak ada route yang dihapus.

---

## 2. Current Navigation Inventory

| # | Grup (label) | Anak (page id) | Jenis | Frekuensi dominan |
|---|---|---|---|---|
| 1 | Peta Kebun | `map` | Workspace | Harian |
| 2 | Command Center | `command-center` (alias exec/ops) | Dashboard | Harian |
| 3 | Tanaman | `trees`, `census`, `planting` | Reference/Workspace | Mingguan |
| 4 | Perencanaan | `plan-dashboard`, `plan-annual`, `calendar`, `plan-weekly`, `plan-resources`, `plan-scenario` | Workspace/Report | Mingguan |
| 5 | Agronomi | `protocols`, `health`, `surveillance`, `weather`, `fertilization` | Workspace | Mingguan |
| 6 | Hybrid Sensing | `hs-map`, `hs-satellite`, `hs-drone`, `hs-sensors`, `hs-trees`, `hs-verification`, `hs-history`, `hs-compare`, `hs-alerts` (badge), `hs-data` | Technical monitoring | Mingguan–Insidental |
| 7 | Operasional Lapangan | `workorders` (badge), `verification` (badge) | Transaction | Harian |
| 8 | Lapangan (PWA Offline) | `field-home`, `field-tasks`, `field-attendance`, `field-work`, `field-inspection`, `field-census`, `field-map`, `field-drafts`, `field-sync` (badge), `field-downloads` | Workspace (moda lapangan) | Harian (FS) |
| 9 | Sumber Daya | `water`, `inventory` | Workspace | Mingguan |
| 10 | Tenaga Kerja | `labor`, `workers`, `assign`, `hokrecap`, `hokrate` | Workspace/Config | Harian–Bulanan |
| 11 | Panen | `harvest` | Workspace | Musiman |
| 12 | Keuangan & Kinerja | `budget` | Dashboard | Bulanan |
| 13 | Pusat Alert | `alerts` (badge) | Action center | Harian |
| 14 | Rekomendasi AI | `ai-recs` (badge) | Report | Mingguan |
| 15 | Data Quality | `dq-dashboard`, `dq-issues` (badge), `dq-sources`, `dq-rules` | Technical/Config | Insidental–Admin |
| 16 | Pusat Laporan | `reports` | Report | Bulanan |
| 17 | Integration Hub | `integrations` | Technical | Admin |
| 18 | Administrasi | `admin`, `users` | Configuration | Admin |

**Route detail (benar TIDAK di sidebar — pertahankan):** `block`, `tree`, `case`, `wo`, `wo-new`, `dq-issue`, dan varian detail lain di PAGE_TITLE (65 id total).

## 3. Key Navigation Problems

- **Quantity:** 18 grup; role terberat **Super Admin/EM ±44 item terlihat**; Direksi masih melihat ±30. >⅓ item berfrekuensi insidental/administratif tetapi selalu tampil.
- **Duplication:** verifikasi (`verification` vs `hs-verification`); alert (`alerts` vs `hs-alerts`); pohon (`trees` vs `census` vs `hs-trees`); peta (`map` vs `hs-map` vs `field-map`); kehadiran (`assign` vs `field-attendance`); air vs sensor tanah (`water` vs `hs-sensors`).
- **Naming:** campur EN/ID ("Command Map", "Sources & Sync", "Validation Rules", "Sync Center", "Download Field Pack", "Integration Hub"); istilah teknologi sebagai kategori ("Hybrid Sensing"); "Work Order" vs "Pekerjaan" vs "Tugas" tidak konsisten.
- **Hierarchy:** grup 10-anak (HS, Field) vs grup 1-anak yang jadi top-level (Panen, Budget, Reports, Integrations, AI); 6 menu tunggal top-level menyamakan bobot visual hal besar dan kecil.
- **Role relevance:** struktur identik untuk semua role, hanya di-hide per item; Direksi tetap memindai kerangka 18 grup.
- **Technical orientation:** HS/DQ/Integrations memaksa pengguna paham arsitektur data.
- **Mobile complexity:** grup "Lapangan (PWA Offline)" tampil di sidebar desktop padahal moda perangkat berbeda; 10 item padahal bottom-nav lapangan yang ada hanya 5.

## 4. Menu Usage Classification

Harian: map, command-center, workorders, verification, alerts, field-*(FS), labor/assign. Mingguan: plan-weekly, calendar, health, surveillance, weather, fertilization, hs-map/satellite/sensors, inventory, water, ai-recs, trees. Bulanan: budget, reports, hokrecap, plan-annual, census, harvest(musiman). Insidental: hs-history/compare/drone/data, plan-scenario, dq-dashboard/issues. Administratif/System-only: dq-sources, dq-rules, integrations, admin, users, hokrate, field-downloads.

## 5. Three Reorganization Alternatives

| | Alt 1 — Lifecycle (Monitor→Plan→Execute→Analyze) | Alt 2 — Domain + role visibility | Alt 3 — Role-Adaptive penuh |
|---|---|---|---|
| Kelebihan | Alur kerja jelas; cocok untuk EM | Peta mental plantation familiar; label domain stabil; migrasi termudah (regrouping saja) | Paling ramping per role |
| Kekurangan | "Monitoring" jadi keranjang raksasa (peta+sensing+health+alert); banyak halaman lintas-fase (WO = plan+execute+verify) | Perlu disiplin memangkas anak grup | Melanggar *stable navigation*; QA 9 role; memori spasial pengguna multi-role kacau |
| Risiko/dampak source | Sedang | **Rendah** (NAV regroup + hide) | Tinggi (NAV per role) |
| Skalabilitas / non-teknis | Sedang / baik | **Baik / baik** | Baik / baik |
| Estimasi item terlihat | ±28 | **±24** | ±18–22 per role |

**Rekomendasi: Alternatif 2**, dengan elemen role-adaptive terbatas pada *visibility, default landing, dan prominence* (mekanisme yang sudah ada) — bukan struktur berbeda per role.

## 6. Recommended Information Architecture (final)

```
1. Peta Kebun                    (tunggal — tetap teratas, keputusan 23 Jul)
2. Command Center                (tunggal, role-adaptive di dalam halaman)
3. Estate & Tanaman
   - Registri Pohon (trees)      [default child]
   - Sensus Tanaman (census)
   - Progres Penanaman (planting)
   - Panen (harvest)                          ← naik dari top-level
4. Agronomi & Pemantauan
   - Kesehatan Tanaman (health)  [default child]
   - Surveilans OPT (surveillance)
   - Pemantauan Digital (hs-map) ← landing sensing; satelit/drone/sensor/pohon/
     histori/perbandingan/ketersediaan menjadi TAB di dalamnya (hs-satellite,
     hs-drone, hs-sensors, hs-trees, hs-history, hs-compare, hs-data)
   - Klimatologi (weather)
   - Pemupukan & Tanah (fertilization)
   - Pustaka SOP (protocols)
5. Rencana & Pekerjaan
   - Pekerjaan / WO (workorders) [default child; badge wo]
   - Verifikasi (verification)   [badge verif; tab kedua: Verifikasi Sensing (hs-verification)]
   - Kalender (calendar)
   - Rencana Mingguan (plan-weekly)
   - Perencanaan (plan-dashboard; annual/resources/scenario jadi tab di dalamnya)
6. Sumber Daya
   - Tenaga Kerja & HOK (labor)  [default child; workers/assign/hokrecap/hokrate jadi tab]
   - Inventori Material (inventory)
   - Manajemen Air (water)
7. Kinerja & Risiko
   - Pusat Alert (alerts)        [default child; badge; menyerap hs-alerts sebagai filter "Sensing"]
   - Keuangan (budget)
   - Rekomendasi (ai-recs)
   - Laporan (reports)
   - Data Issues (dq-issues)     [badge dq; dq-dashboard jadi tab ringkasan]
8. Sistem                        (Super Admin/EM saja)
   - Pengaturan & Peran (admin), Manajemen Pengguna (users)
   - Integrasi Sistem (integrations), Sumber Data (dq-sources), Aturan Validasi (dq-rules)

MODE LAPANGAN (bukan grup sidebar): tombol "Masuk Mode Lapangan" (topbar/CC) →
bottom-nav 5: Beranda · Tugas · Kehadiran · Kerja (WO+Inspeksi+Sensus) · Sinkron.
Peta Offline, Data Tersimpan, Field Pack = utilitas di dalam Beranda/Sinkron.
```

## 7. Old-to-New Mapping (semua page ID)

| Lama | Page ID | Baru | Status |
|---|---|---|---|
| Peta Kebun | map | 1 | KEEP AS PRIMARY |
| Command Center | command-center (exec/ops alias) | 2 | KEEP AS PRIMARY |
| Tanaman/* | trees, census, planting | 3 | MERGE INTO GROUP |
| Panen | harvest | 3 | MERGE INTO GROUP |
| Agronomi/* | protocols, health, surveillance, weather, fertilization | 4 | MERGE INTO GROUP (weather RENAME "Klimatologi") |
| HS Command Map | hs-map | 4 · "Pemantauan Digital" | RENAME + KEEP |
| HS Satelit/Drone/Sensor/Pohon/Historis/Perbandingan/Data | hs-satellite, hs-drone, hs-sensors, hs-trees, hs-history, hs-compare, hs-data | tab dalam Pemantauan Digital | MOVE TO CONTEXTUAL NAVIGATION |
| HS Verifikasi Lapangan | hs-verification | tab dalam Verifikasi | MOVE TO CONTEXTUAL NAVIGATION |
| HS Anomali Sensing | hs-alerts | filter dalam Pusat Alert | MOVE TO CONTEXTUAL NAVIGATION |
| Work Order, Antrian Verifikasi | workorders, verification | 5 | MERGE INTO GROUP (verification RENAME "Verifikasi") |
| Perencanaan/* | plan-dashboard, calendar, plan-weekly | 5 | MERGE INTO GROUP |
| Rencana Tahunan, Sumber Daya & Kesiapan, Skenario | plan-annual, plan-resources, plan-scenario | tab dalam Perencanaan | MOVE TO CONTEXTUAL NAVIGATION |
| Lapangan (PWA)/* | field-home, field-tasks, field-attendance, field-work, field-inspection, field-census | Mode Lapangan (bottom nav) | ROLE-BASED + HIDE FROM SIDEBAR |
| Peta Offline, Data Tersimpan, Sync Center, Field Pack | field-map, field-drafts, field-sync, field-downloads | utilitas Mode Lapangan | MOVE TO CONTEXTUAL NAVIGATION |
| Sumber Daya + Tenaga Kerja | water, inventory, labor | 6 | MERGE INTO GROUP |
| Database Pekerja, Penugasan, Rekap HOK, Tarif HOK | workers, assign, hokrecap, hokrate | tab dalam Tenaga Kerja & HOK | MOVE TO CONTEXTUAL NAVIGATION (hokrate → MOVE TO SETTINGS opsional) |
| Keuangan & Kinerja | budget | 7 | MERGE INTO GROUP |
| Pusat Alert | alerts | 7 | KEEP AS PRIMARY (dalam grup) |
| Rekomendasi AI | ai-recs | 7 · "Rekomendasi" | RENAME + MERGE |
| Pusat Laporan | reports | 7 · "Laporan" | RENAME + MERGE |
| DQ Dashboard, Data Issues | dq-dashboard, dq-issues | 7 (dashboard jadi tab) | MERGE / MOVE TO CONTEXTUAL |
| Sources & Sync, Validation Rules | dq-sources, dq-rules | 8 · "Sumber Data", "Aturan Validasi" | MOVE TO SETTINGS + RENAME |
| Integration Hub | integrations | 8 · "Integrasi Sistem" | MOVE TO SETTINGS + RENAME |
| Administrasi/* | admin, users | 8 | KEEP (grup Sistem) |
| Detail: block, tree, case, wo, wo-new, dq-issue, dst. | (65 id) | — | MOVE TO DETAIL FLOW (tetap route, tanpa sidebar) |

## 8. Role-Based Menu Matrix

| Grup final | SA | Direksi | Mitra | EM | AH | FS | WH | Seedling | Finance |
|---|---|---|---|---|---|---|---|---|---|
| 1 Peta Kebun | P | P | P | P | P | P | V | V | V |
| 2 Command Center | P | **P** | **P** | **P** | P | P | V | V | P |
| 3 Estate & Tanaman | V | V | V | V | V | Sh | H | **P** | H |
| 4 Agronomi & Pemantauan | V | C | C | V | **P** | Sh | H | V | H |
| 5 Rencana & Pekerjaan | V | C | H | **P** | V | **P**(mode lapangan) | Sh | Sh | H |
| 6 Sumber Daya | V | C | H | V | C | Sh | **P** | V | C |
| 7 Kinerja & Risiko | V | **P** | V(tanpa Keuangan detail) | V | V | Sh(alert saja) | C | H | **P** |
| 8 Sistem | **P** | H | H | C | H | H | H | H | H |

P=Primary · V=Visible · C=Collapsed · Sh=Shortcut only (command palette/deep link) · H=Hidden.
**Permission ≠ visibility:** `ROLES.hide` + `can()` tetap menjadi kontrol akses; hide sidebar hanya prominence. Direksi/Mitra melihat **5 grup**; EM **7**; FS praktis 3 + Mode Lapangan.

## 9. Naming Recommendations

| Label lama | Masalah | Rekomendasi |
|---|---|---|
| Hybrid Sensing / Command Map | teknis, EN | **Pemantauan Digital** / Peta Pemantauan |
| Sources & Sync | EN, teknis | **Sumber Data** |
| Validation Rules | EN | **Aturan Validasi** |
| Integration Hub | EN | **Integrasi Sistem** |
| Data Quality → menu | teknis sebagai grup | lebur: **Data Issues** (kinerja) + Sistem |
| Antrian Verifikasi | panjang | **Verifikasi** |
| Sync Center / Download Field Pack | EN | **Sinkronisasi** / **Unduh Paket Lapangan** |
| Rekomendasi AI | jargon | **Rekomendasi** (subtitle "berbasis AI") |
| Klimatologi Agronomi | panjang | **Klimatologi** |
| Work Order | dipertahankan (istilah baku pengguna); konsisten: WO=dokumen kerja, "Tugas"=WO milik saya di lapangan | Work Order |

## 10. Sidebar Interaction Recommendation

Expanded 240 px / collapsed 56 px (ikon + tooltip). Grup = accordion, **maks satu grup terbuka**, grup aktif auto-terbuka, section-label huruf kecil di atas kelompok (ESTATE · OPERASI · KENDALI · SISTEM). Active state: bar hijau kiri + bold; hover: bg-green-50. Badge hanya di: Pekerjaan (WO terlambat), Verifikasi, Pusat Alert (kritis), Data Issues (critical), Sinkron lapangan (draft) — **maks 5 badge**, angka cap "9+", hilang saat masalah selesai (bukan saat dibaca). Footer sticky: bantuan + collapse + role indicator. Command palette (Ctrl+K) dipertahankan; diperluas untuk mencari blok/petak/pohon/WO/alert/pekerja/issue + aksi ("Buat WO"); menjadi jalan utama item "Shortcut only". Favorites/pin: **tidak dulu** — nilai belum jelas, tambah kompleksitas.

## 11. Wireframes

**Desktop expanded:**
```
┌───────────────────────────┐
│ VarmOS · Gunung Hejo      │
├───────────────────────────┤
│ ⌂ Peta Kebun              │
│ ▦ Command Center       (3)│
│ ESTATE                    │
│ ▸ Estate & Tanaman        │
│ ▸ Agronomi & Pemantauan   │
│ OPERASI                   │
│ ▾ Rencana & Pekerjaan     │
│    Pekerjaan (WO)      (2)│
│    Verifikasi          (1)│
│    Kalender               │
│    Rencana Mingguan       │
│    Perencanaan            │
│ ▸ Sumber Daya             │
│ KENDALI                   │
│ ▸ Kinerja & Risiko     (1)│
│ SISTEM                    │
│ ▸ Sistem                  │
├───────────────────────────┤
│ ⌕ Ctrl+K   ‹ Ciutkan  ⚙EM │
└───────────────────────────┘
```
**Desktop collapsed:** kolom 56 px ikon grup + tooltip; badge dot merah. **Tablet:** drawer overlay struktur sama, satu level terlihat. **Mobile manajemen:** hamburger → daftar 8 grup (accordion), tanpa submenu dalam >1 level. **Mobile lapangan (bottom nav):**
```
┌──────────────────────────────┐
│  [Beranda][Tugas][Kehadiran] │
│  [Kerja ▾][Sinkron ●]        │
└──────────────────────────────┘
Kerja ▾ = WO · Inspeksi · Sensus ; utilitas (Peta Offline, Draft, Paket) di Beranda.
```

## 12. Default Landing Page per Role

| Role | Saat ini | Rekomendasi | Alasan |
|---|---|---|---|
| Semua (login) | map | **map** (keputusan 23 Jul — tetap) | konsisten; peta = orientasi tercepat |
| switchRole: Direksi/Mitra | command-center | command-center | ringkasan+keputusan |
| Estate Manager | command-center | command-center | prioritas harian |
| Agronomy Head | health | health | kasus & kesehatan |
| Field Supervisor | command-center | **field-home** (di perangkat mobile) / command-center (desktop) | pekerjaan hari ini actionable |
| Warehouse | inventory | inventory | stok |
| Seedling | planting | planting | pembibitan |
| Finance | budget | budget | biaya |
| Super Admin | admin | **command-center** | admin bukan pekerjaan harian; Sistem tetap 1 klik |

## 13. Backward Compatibility Plan

Semua **page ID dipertahankan** — perubahan hanya pada grouping NAV + label + hide list. Pola alias `CC_ROUTE_ALIAS` yang sudah ada diperluas menjadi `ROUTE_ALIAS` generik bila ada id yang kelak berganti. Deep link, browser history, notification link, alert→WO, map→block, worker→assignment, DQ flow, field flow: tidak tersentuh karena `nav(page,params)` dan parameter route tidak berubah. Command palette otomatis mengikuti NAV baru; entri lama (label lama) tetap ditemukan via PAGE_TITLE. Permission checks (`ROLES.hide`, `can()`) tidak dilonggarkan.

## 14. Implementation Roadmap

1. **Navigation data refactor** — NAV mendukung `section` label & `tabsOf` (halaman induk dengan tab kontekstual); route alias generik.
2. **Menu regrouping** — susun 8 grup; pindahkan anak sesuai mapping §7 (tanpa menghapus route).
3. **Role visibility** — perbarui `ROLES.hide` + prominence per matriks §8.
4. **Naming migration** — label §9 di NAV + PAGE_TITLE (id tetap).
5. **Contextual navigation** — tab dalam Pemantauan Digital, Verifikasi, Perencanaan, Tenaga Kerja, Pusat Alert (filter sensing), Data Issues.
6. **Mobile navigation** — pisahkan Mode Lapangan (bottom nav 5) dari sidebar; tombol masuk/keluar mode.
7. **Route compatibility** — uji semua deep link lama + palette.
8. **Usability testing** — 10 skenario §15 pada 9 role × 3 device.

## 15. Usability Test Scenarios (ringkas)

| Skenario | Path harapan | Maks klik |
|---|---|---|
| Pengguna baru: status estate | login → Peta Kebun (auto) | 0–1 |
| EM buat WO | CC → CTA "Buat Work Order" | 2 |
| AH cari kasus OPT | Agronomi & Pemantauan → Surveilans OPT | 2 |
| FS buka tugas hari ini | Mode Lapangan → Tugas | 2 |
| WH cek stok menipis | Sumber Daya → Inventori (badge) | 2 |
| Finance lihat biaya & HOK | Kinerja & Risiko → Keuangan; Sumber Daya → Tenaga Kerja (tab HOK) | 2 |
| Direksi buka laporan | Kinerja & Risiko → Laporan | 2 |
| Tangani alert sensing | Pusat Alert (badge) → filter Sensing | 2 |
| Buka data issue dari badge | Kinerja & Risiko → Data Issues | 2 |
| Kembali dari detail | breadcrumb/Kembali (state dipertahankan) | 1 |

Success: pengguna menemukan tanpa membuka >1 grup salah; tidak bertanya "di mana menu X".

## 16. Open Product Decisions

1. **Panen** di "Estate & Tanaman" (hasil kebun) atau "Kinerja & Risiko" (hasil bisnis)? Rekomendasi: Estate & Tanaman.
2. **Mode Lapangan untuk FS di desktop** — sembunyikan grup field dari sidebar semua role dan jadikan tombol mode, atau tetap tampil untuk FS? Rekomendasi: tombol mode untuk semua.
3. **Label "Work Order"** dipertahankan (istilah baku) atau diganti "Pekerjaan"? Rekomendasi: pertahankan WO, gunakan "Tugas" hanya untuk daftar milik-saya di lapangan.
4. **Tarif HOK** — tab di Tenaga Kerja atau pindah ke Sistem (konfigurasi)? Rekomendasi: tab, karena diakses bersama rekap.
5. **Default Super Admin** pindah ke command-center (dari admin) — setuju?
