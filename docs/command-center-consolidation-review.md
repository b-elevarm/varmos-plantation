# Command Center Consolidation Review

**Tanggal:** 23 Juli 2026 · **Sumber kebenaran:** `varmos-plantation_15.jsx` (running: `src/App.jsx`) · **Status:** REVIEW — belum ada perubahan kode

---

## 1. Executive Summary

**Ya, kedua halaman sebaiknya digabungkan.** Audit menunjukkan ExecDashboard dan OpsDashboard bukan dua produk berbeda, melainkan satu cerita yang dipotong di tempat yang salah: eksekutif melihat *akibat* (skor, tren, anggaran) tanpa *penyebab operasional*-nya, dan operasional melihat *pekerjaan* tanpa *konteks prioritas*-nya.

**Masalah utama desain sekarang:**
1. **17 KPI cards** di dua halaman (10 exec + 7 ops), dengan 3 di antaranya duplikat/tumpang tindih langsung (verifikasi, WO, alert) dan 4 KPI ops berupa **angka hardcoded** yang tidak terhubung ke state (`128/142 HOK`, `2 WO material`, `1 unit downtime`, `2 blok air`).
2. **Empat representasi risiko blok yang dihitung terpisah**: tabel "Peringkat risiko blok" (exec), tabel "Peringkat beban kerja" (ops), panel "Area memerlukan perhatian" di ExecEstateHealthMap (via `vzBlockExecAll`), dan panel serupa di Peta Kebun — dua di antaranya menghitung sendiri dari `CEN_DATA`+`BLOCKS`, dua dari kontrak `vzBlockExecAll`. Angka bisa berbeda antar-widget untuk konsep yang sama.
3. **Berorientasi laporan, bukan keputusan**: 7 chart di dua halaman, satu di antaranya ("Populasi per komoditas") berisi data nol semua; tabel Keputusan manajemen statis tanpa aksi.
4. Freshness data campur aduk tanpa penanda: sensus Des 2025 (±208 hari), citra 20 Jul 2026, WO/alert live — semuanya tampil seolah setara.

**Konsep yang direkomendasikan:** **Alternatif 3 — Role-Adaptive Command Center**, dengan **Priority & Action Center bergaya exception-driven (Alternatif 1) sebagai jantungnya**. Satu component, satu route, urutan & prominence section mengikuti role via `ROLES`/`can()` yang sudah ada.

**Manfaat yang diharapkan:** status estate terbaca <10 detik (5 KPI, bukan 17), masalah prioritas terbaca <20 detik (satu antrean terpadu, bukan 6 widget), duplikasi hilang (satu kontrak data blok), dan navigasi menyusut satu level.

---

## 2. Current-State Inventory

### ExecDashboard (`ExecDashboard`, ~L4167)
| # | Elemen | Sumber data | Aksi/deep link |
|---|---|---|---|
| E1 | PageHeader + "Ekspor Ringkasan" | — | toast simulasi PDF |
| E2 | KPI Luas Estate (200,68 ha) | statis | — |
| E3 | KPI Populasi Pohon | `CEN_DATA.total` | — |
| E4 | KPI Survival Rate | `CEN_DATA.byStatus` | — |
| E5 | KPI Pohon Sehat | `CEN_DATA.byStatus` | — |
| E6 | KPI Pohon Sulaman YTD (0) | statis + `CEN_DATA` mati | — |
| E7 | KPI Work Order Aktif | `counts.wo` (+overdue sub) | `nav("workorders")` |
| E8 | KPI Antrian Verifikasi | `counts.verif` | `nav("verification")` |
| E9 | KPI Alert Kritis | `counts.alerts` | `nav("alerts")` |
| E10 | KPI Realisasi Anggaran (92,5%) | hardcoded | — |
| E11 | KPI Kasus SLA Terlewat (0) | hardcoded | `nav("health")` |
| E12 | `AlertLoopExecStrip` — 6 tile closed-loop (kritis, unack, SLA, verif, reopened, MTTR) | `alerts` + lifecycle helpers | `nav("alerts",{qf})` per tile |
| E13 | `ExecEstateHealthMap` — peta mini + skor estate + "Area memerlukan perhatian" + tindakan cepat | **`vzBlockExecAll`/`vzExecRank`/`vzEstateExec`** (kontrak tunggal) | `nav("map")`, `nav("hs-map")`, BlockDrawer |
| E14 | Chart Tren survival | `SURVIVAL_TREND` | — |
| E15 | Chart Anggaran vs aktual | `BUDGET_TREND` | — |
| E16 | Chart Penyelesaian WO | `WO_COMPLETION` | — |
| E17 | Chart Distribusi kesehatan (pie) | `CEN_DATA.byStatus` | — |
| E18 | Chart Populasi per komoditas | `COMMODITIES` (**semua 0**) | — |
| E19 | Tabel Peringkat risiko blok | hitung sendiri: `BLOCKS`+`CEN_DATA` | `nav("block",{blockId})` |
| E20 | Tabel Keputusan manajemen | `DECISIONS` (statis) | tidak ada |
| E21 | `BlockDrawer` (via "Detail lengkap") | campuran | multi deep link |

### OpsDashboard (`OpsDashboard`, ~L4243)
| # | Elemen | Sumber data | Aksi/deep link |
|---|---|---|---|
| O1 | PageHeader + "Buat Work Order" | `can(role,"createWo")` | `nav("wo-new")` |
| O2 | KPI WO Hari Ini | `wos` filter | `nav("workorders")` |
| O3 | KPI WO Terlambat | `counts.overdue` | `nav("workorders",{overdue:true})` |
| O4 | KPI Tenaga Kerja "128/142" | **hardcoded** | — |
| O5 | KPI Kendala Material "2 WO" | **hardcoded** | `nav("inventory")` |
| O6 | KPI Downtime Alat "1 unit" | **hardcoded** | `nav("water")` |
| O7 | KPI Backlog Verifikasi | `counts.verif` | `nav("verification")` |
| O8 | KPI Status Air "2 blok" | **hardcoded** | `nav("water")` |
| O9 | Chart Biaya per aktivitas | `COST_BY_ACTIVITY` | — |
| O10 | Chart Progres harian WO | `DAILY_PROGRESS` | — |
| O11 | Tabel Pekerjaan hari ini | `wos` | `nav("wo",{woId})`, `nav("workorders")` |
| O12 | Tabel Peringkat beban kerja blok | hitung sendiri: `BLOCKS`+`CEN_DATA` | `nav("block",{blockId})` |

---

## 3. Key Findings

**F1 — Duplication.** (a) `counts.verif` tampil sebagai KPI di kedua halaman (E8=O7). (b) Konsep WO terpecah tiga: E7, O2, O3 — plus chart E16 dan O10. (c) Risiko blok dihitung **4×** dengan 2 formula berbeda (E13/Peta Kebun via `vzBlockExecAll` vs E19/O12 hitung inline) — pelanggaran single source of truth yang sudah dipecahkan `vzBlockExecAll` untuk peta tetapi tidak dipakai tabel. (d) Alert kritis tampil di E9, E12, dan panel E13. (e) Kesehatan populasi tampil di E4, E5, E13 (skor), E17 (pie), E19 (kolom) — lima kali.

**F2 — Cognitive load.** 17 KPI + 7 chart + 4 tabel + 1 strip + 1 peta = **30 widget** untuk memahami satu estate 200 ha / 4 blok. Semua KPI dirender dengan bobot visual sama; yang statis-deskriptif (Luas Estate) setara dengan yang genting (Alert Kritis).

**F3 — Lack of prioritization.** Tidak ada satu tempat yang menjawab "apa yang harus saya urus hari ini?" — pengguna harus mensintesis sendiri dari alert strip + risiko blok + WO terlambat + keputusan manajemen + kendala sumber daya di dua halaman.

**F4 — Reporting vs action imbalance.** 7 chart hanya informatif (tidak ada satu pun yang clickable); 1 chart datanya kosong (E18); tabel DECISIONS tanpa tombol aksi/approve; sedangkan aksi nyata (Buat WO, verifikasi, review alert) terpencar.

**F5 — Role relevance.** `ROLES` menunjukkan pemisahan tidak dipatuhi rapi: Field Supervisor & Warehouse & Seedling *hide* `exec`; Direksi & Mitra Lahan default `exec`; EM & FS default `ops` — tetapi Finance dan Agronomy Head tidak punya "rumah" di Command Center yang relevan (Finance butuh anggaran+keputusan, AH butuh kesehatan+kasus — keduanya harus meraba dua halaman). Catatan: sejak 23 Jul, login landing sudah diubah ke `map`, sehingga `ROLES.def` kini hanya dipakai `switchRole`.

**F6 — Data freshness.** E13 sudah mencantumkan `censusAt`/`observedAt` di kontraknya, tetapi KPI dan tabel tidak: Survival (sensus 208 hari lalu) tampil setara dengan WO hari ini; anggaran hardcoded tampil seolah live. Tidak ada penanda simulasi vs nyata di kedua halaman (padahal peta & modul lain sudah punya bahasa "simulasi/aktual").

**F7 — Navigation complexity.** Dua route (`exec`, `ops`) + `PAGE_TITLE` ganda + dua entri command palette + hide-list per role yang menyulitkan reasoning. Satu klik ekstra tanpa nilai.

---

## 4. Content Disposition Matrix

| Elemen | Sumber | Pengguna utama | Nilai keputusan | Duplikasi | Rekomendasi | Alasan / tujuan pindah |
|---|---|---|---|---|---|---|
| E2 Luas Estate | statis | semua | tidak ada | header Peta Kebun | **REMOVE** | Fakta statis; sudah permanen di header Peta Kebun & Pengaturan |
| E3 Populasi | CEN_DATA | Direksi | rendah | Peta Kebun KPI | **MERGE** → subteks KPI Health | Konteks, bukan keputusan |
| E4 Survival | CEN_DATA | Direksi/AH | sedang | E14, E19 | **MERGE** → KPI Estate Health (komponen skor) + Performance Pulse | `vzScore` sudah menggabungkan healthy%+alive% |
| E5 Pohon Sehat | CEN_DATA | Direksi/AH | sedang | E13, E17 | **MERGE** → KPI Estate Health | idem |
| E6 Sulaman YTD | statis | AH | rendah | — | **MOVE TO DETAIL MODULE** (Tanaman/Penanaman) | Metrik program tanam, bukan status harian |
| E7/O2/O3 WO KPIs | counts/wos | EM/FS | tinggi | 3× | **MERGE** → KPI Operational Completion + Priority Queue (item overdue) | Satu angka gabungan + antrean untuk yang bermasalah |
| E8/O7 Verifikasi | counts.verif | EM | tinggi | 2× | **MERGE** → Priority Queue + Execution Snapshot | Duplikat persis |
| E9 Alert Kritis | counts.alerts | semua | tinggi | E12, E13 | **MERGE** → KPI Critical Exceptions + Priority Queue | |
| E10 Realisasi Anggaran | hardcoded | Direksi/Finance | tinggi | E15 | **KEEP (ROLE-BASED)** → KPI Budget Variance | Satu-satunya sinyal finansial ringkas; sambungkan ke data budget module |
| E11 SLA Kesehatan | hardcoded | AH | sedang | E12 (SLA) | **MERGE** → Priority Queue (kategori SLA) | |
| E12 AlertLoopExecStrip | alerts | EM/Direksi | tinggi | E9 | **MERGE** → Priority Queue header stats; MTTR → Performance Pulse | Strip = proto-priority-queue; jadikan satu |
| E13 ExecEstateHealthMap | vzBlockExecAll | semua | tinggi | Peta Kebun panel | **KEEP (SIMPLIFY)** | Satu-satunya widget berkontrak tunggal; jadikan pusat spasial + sumber "Area perhatian" TUNGGAL |
| E14 Survival trend | SURVIVAL_TREND | Direksi | sedang | — | **KEEP** → Performance Pulse (1 dari 3) | Tren inti estate muda |
| E15 Budget vs aktual | BUDGET_TREND | Direksi/Finance | sedang | E10 | **ROLE-BASED** → Performance Pulse (Finance/Direksi/EM) | |
| E16 WO completion | WO_COMPLETION | EM | sedang | O10 | **MERGE** dengan O10 → satu chart "Eksekusi WO" | Dua chart WO → satu |
| E17 Health pie | CEN_DATA | AH | rendah | E4/E5/E13 | **MOVE TO DRAWER** (drawer blok/estate detail) | Informasi ke-5 tentang hal sama |
| E18 Populasi/komoditas | COMMODITIES (0) | — | tidak ada | Tanaman module | **REMOVE FROM COMMAND CENTER** | Data kosong; sudah ada di modul Tanaman saat terisi |
| E19 Risiko blok (tabel) | inline calc | Direksi/EM | tinggi | E13, O12 | **MERGE** → panel blok di Estate Health Map, data dari `vzBlockExecAll` diperluas | Hapus formula ganda |
| E20 Keputusan manajemen | DECISIONS | Direksi/EM | tinggi | — | **KEEP (SIMPLIFY + actionable)** → Level 6 / item due ke Priority Queue | Tambah status flow & PIC action |
| E21 BlockDrawer | campuran | EM/AH | tinggi | — | **KEEP** → CommandCenterDrawer | Progressive disclosure yang sudah benar |
| O1 Buat WO | can() | EM/FS | tinggi | — | **KEEP (ROLE-BASED primary action)** | |
| O4 Tenaga Kerja | hardcoded | EM/FS | tinggi | Tenaga Kerja module | **MERGE** → KPI Resource Readiness + Execution Snapshot; sambungkan ke data labor | Hardcoded harus diganti sumber nyata |
| O5 Material | hardcoded | EM/WH | tinggi | Inventori | **MERGE** → Resource Readiness + Priority Queue | idem |
| O6 Downtime | hardcoded | EM | sedang | Manajemen Air | **MERGE** → Resource Readiness + Priority Queue | idem |
| O8 Status Air | hardcoded | EM | tinggi | Manajemen Air (RESERVOIRS kini data lapangan) | **MERGE** → Resource Readiness; item kritis (B1A 32%, B4A Bocor) → Priority Queue | RESERVOIRS sudah real — pakai |
| O9 Cost by activity | COST_BY_ACTIVITY | Finance/EM | sedang | E15 tema | **ROLE-BASED** → Pulse slot finansial (toggle dgn E15) | Dua chart finansial → satu slot |
| O10 Daily WO progress | DAILY_PROGRESS | EM | sedang | E16 | **MERGE** → chart "Eksekusi WO" | |
| O11 Pekerjaan hari ini | wos | FS/EM | tinggi | — | **KEEP (SIMPLIFY)** → Execution Snapshot (compact) | |
| O12 Beban kerja blok | inline calc | EM | sedang | E19 | **MERGE** → kolom tambahan panel blok (WO aktif, kasus, supervisor) | Satu tabel blok untuk semua |

---

## 5. Three Design Alternatives

| | Alt 1 — Exception-Driven | Alt 2 — Estate Performance | Alt 3 — Role-Adaptive |
|---|---|---|---|
| Orientasi | "Apa yang rusak, siapa PIC, apa aksinya" | "Bagaimana performa vs target" | Satu layout, urutan/prominence per role |
| Struktur | Priority queue di atas segalanya; KPI minimal; peta & tren sekunder | KPI + tren + peta dominan; exceptions sekunder | Level 1–6 tetap; section di-reorder/collapse per role |
| Kelebihan | Paling actionable; waktu-ke-masalah tercepat; cocok musim kemarau/krisis | Paling nyaman untuk Direksi/Mitra; naratif rapi | Melayani 7 role dengan 1 component; tidak ada halaman "bukan untuk saya" |
| Kekurangan | Direksi/Mitra kehilangan narasi performa; saat estate sehat halaman terasa kosong | Mengulang kelemahan exec sekarang (reporting-heavy); FS tidak terlayani | Kompleksitas konfigurasi urutan; QA per role lebih banyak |
| Risiko implementasi | Sedang — butuh unified queue adapter baru | Rendah — mirip exec sekarang | Sedang — tapi `ROLES`/`can()`/pola `hide` sudah tersedia |
| Kesesuaian VarmOS | Tinggi (alert loop & DQ issue sudah ada bahannya) | Rendah–sedang | **Tinggi** — permission ada, kontrak `vzBlockExecAll` ada, pola drawer ada |
| Estimasi perubahan | ±40% konten baru | ±15% (kosmetik) | ±35% (komposisi ulang, komponen sebagian besar reuse) |

## 6. Recommended Concept

**Alternatif 3 (Role-Adaptive), dengan Level 2 mengadopsi penuh unified priority queue dari Alternatif 1.** Alasan: (a) satu halaman untuk 7 role hanya masuk akal jika prominence menyesuaikan role — kalau tidak, kita sekadar membuat halaman panjang baru; (b) bahan bakunya sudah ada di source: `ROLES.hide`, `can()`, `vzBlockExecAll`/`vzExecRank` (ranking prioritas), `AlertLoopExecStrip` (proto-queue), `alertIsOverdue`/SLA helpers, DQ issues; (c) Alt 1 murni menghukum role strategis, Alt 2 murni mengulang masalah lama.

## 7. Information Architecture (final)

```
Level 1  ESTATE STATUS STRIP     — 5 KPI + chip data-confidence      (selalu tampil)
Level 2  PRIORITY & ACTION CENTER— unified queue, max 7 tampil       (default terbuka; posisi #1 utk EM/FS saat ada item merah)
Level 3  ESTATE HEALTH MAP       — ExecEstateHealthMap disederhanakan (kanan berdampingan dgn Level 2 di desktop)
Level 4  PERFORMANCE PULSE       — 3 slot chart                       (collapsed utk FS)
Level 5  EXECUTION SNAPSHOT      — strip status + tabel WO compact    (Primary utk FS; collapsed utk Direksi)
Level 6  DECISIONS & ACCOUNTABILITY — tabel keputusan actionable      (Primary utk Direksi; hidden utk FS)
Drawer   CommandCenterDrawer     — blok detail / alert detail / decision evidence
```

**Data confidence (Tahap 11):** satu chip global di header: `Sensus Des 2025 (208 hr) · Citra 20 Jul · WO live · demo: labor/budget` — klik membuka popover rincian per sumber (last updated, coverage, simulated marker). Setiap KPI mencantumkan sumber di subteksnya; nilai bersumber simulasi diberi tanda `~`. Konflik antar-sumber (mis. jumlah pohon peta vs sensus — sudah ada DQ-2026-005) dirujuk ke Data Issues, bukan disembunyikan.

## 8. KPI Recommendation (Level 1 — 5 KPI)

| KPI | Definisi | Formula / source | Target | Warning | Critical | Drill-down | Role |
|---|---|---|---|---|---|---|---|
| **Estate Health Score** | Skor komposit kesehatan populasi tertimbang | `vzEstateExec(vzBlockExecAll(...)).score` (0–100) | ≥80 | 60–79 | <60 | Peta Kebun / Level 3 | semua |
| **Critical Exceptions** | Jumlah item merah di priority queue | count(queue.severity=Kritis): alert kritis open + WO overdue + SLA terlewat + DQ critical + embung kritis/bocor | 0 | 1–3 | ≥4 | Level 2 (scroll) | semua |
| **Operational Completion** | % WO selesai tepat waktu, 7 hari | `done_on_time/total_due` dari `wos` (gantikan E7/O2/O3/E16/O10 angka) | ≥90% | 75–89% | <75% | Work Order | EM, FS, Direksi |
| **Resource Readiness** | Skor kesiapan sumber daya hari ini | min/komposit: HOK% · material-blocked WO · alat down · embung level (RESERVOIRS) — sambungkan ke module, hapus hardcode | ≥90% | 70–89% | <70% | Execution Snapshot / modul terkait | EM, FS, Warehouse |
| **Budget Variance** | Realisasi vs anggaran YTD | dari data budget module (gantikan hardcode 92,5%) | 95–105% | ±5–10% | >±10% | Keuangan & Kinerja | Direksi, Finance, EM (hidden utk FS via `can`) |

## 9. Wireframes (ASCII, low-fi)

**Desktop (≥xl):**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ COMMAND CENTER   Estate ▾ · Periode ▾ · [chip: data confidence]   [CTA role] │
├──────────┬──────────┬──────────┬──────────┬──────────────────────────────────┤
│ Health 77│ Except. 4│ Compl 82%│ Resrc 71%│ Budget 92,5%  (role-gated)       │
├──────────┴──────────┴──────────┴─┬────────┴──────────────────────────────────┤
│ PRIORITY & ACTION CENTER (queue) │  ESTATE HEALTH MAP                        │
│ ▸ [KRITIS] Alert OPT B2 · PIC ·  │  (mini peta + skor + blok panel dgn       │
│   SLA 4j · [Tindak] [→ Alert]    │   kolom: skor·WO·kasus·air·supervisor)    │
│ ▸ [KRITIS] Embung B4A Bocor ...  │   klik blok ⇄ filter queue                │
│ ▸ [TINGGI] WO-0131 overdue ...   │                                           │
│   ... (maks 7, "+N lainnya")     │                                           │
├──────────────────────────────────┴─┬─────────────────────────────────────────┤
│ PERFORMANCE PULSE (3 slot chart)   │ EXECUTION SNAPSHOT                      │
│ [Survival] [Eksekusi WO] [Finansial│ strip: WO 12 · Verif 1 · HOK 128/142 ·  │
│  role-gated]                       │ Air 56% · Alat 1↓ + tabel WO hari ini   │
├────────────────────────────────────┴─────────────────────────────────────────┤
│ DECISIONS & ACCOUNTABILITY (tabel + status + [Approve/Update] per baris)     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Tablet (md):** KPI 2×3 (Budget masuk baris 2); Queue full-width; Map full-width di bawahnya; Pulse jadi carousel 1-per-view; Snapshot & Decisions stack.

**Mobile (<md), urutan dipaksa:**
```
[1] Status strip: Health · Exceptions (2 KPI besar, sisanya swipe)
[2] Priority queue (5 teratas, tombol aksi besar)
[3] Today's execution (WO saya / verifikasi)
[4] Map summary (skor + 4 chip blok — buka Peta Kebun utk peta penuh)
[5] Trends (collapsed accordion)
```

## 10. Role-Based Matrix

| Section | Direksi | Estate Manager | Agronomy Head | Field Supervisor | Finance |
|---|---|---|---|---|---|
| L1 Status Strip | Primary | Primary | Primary | Primary (tanpa Budget) | Primary |
| L2 Priority Queue | Visible (filter: keputusan+kritis) | **Primary** | Primary (filter: kesehatan/OPT) | Primary (filter: WO/blok saya) | Visible (filter: finansial) |
| L3 Health Map | Primary | Visible | Primary (default metric NDVI) | Collapsed | Collapsed |
| L4 Performance Pulse | **Primary** | Visible | Visible (survival) | Collapsed | Primary (finansial) |
| L5 Execution Snapshot | Collapsed | Primary | Visible | **Primary** | Hidden |
| L6 Decisions | **Primary** | Visible | Visible | Hidden | Visible (approve PO) |
| Primary CTA | Ekspor Ringkasan | Buat WO | Buat Inspeksi | Verifikasi/Update WO | Approve Decision |

(Mitra Lahan ≈ Direksi minus finansial detail; Warehouse/Seedling: L5 Primary + L2 filter material/bibit; Super Admin = semua Visible.)

## 11. Navigation Recommendation

- NAV: `{id:"g-dash",label:"Command Center",children:[exec,ops]}` → **`{id:"command-center",label:"Command Center",icon:LayoutDashboard,page:"command-center"}`** (tanpa children).
- `PAGE_TITLE`: hapus `exec`/`ops`, tambah `command-center:"Command Center"`.
- **Backward compatibility:** resolver di `nav()`/`setRoute`: `const ROUTE_ALIAS={exec:"command-center",ops:"command-center"}` — semua deep link lama, browser history, dan command palette entry lama tetap hidup. `ROLES.def` `exec|ops` → `command-center` (dipakai `switchRole`; login landing tetap `map` sesuai keputusan 23 Jul).
- Permission: role yang menyembunyikan **kedua** route lama → hide `command-center`; yang menyembunyikan salah satu (FS/Warehouse/Seedling hide `exec`) → **tampilkan** `command-center` (konten role-adaptive menggantikan kebutuhan hide). Hide-list dibersihkan dari `exec`/`ops`.
- Command palette & active-menu state otomatis benar karena membaca NAV.

## 12. Component Architecture

```
CommandCenterPage
├── CommandCenterHeader          (baru; PageHeader + filter + confidence chip + CTA role)
├── EstateKpiSummary             (reuse <Kpi>; 5 KPI; data dari useCommandData)
├── PriorityActionCenter         (baru; absorbsi AlertLoopExecStrip + item adapters)
├── EstateHealthMapPanel         (reuse ExecEstateHealthMap, minus duplikasi tabel)
├── PerformancePulse             (reuse Card+Recharts; 3 slot, slot-3 role-gated)
├── ExecutionSnapshot            (reuse tabel Pekerjaan hari ini + strip status baru)
├── DecisionAccountabilityPanel  (upgrade tabel DECISIONS: status/PIC/aksi)
└── CommandCenterDrawer          (reuse BlockDrawer + varian alert/decision)
```

- **Reuse langsung:** `Kpi`, `Card`, `Badge`, `ProgressBar`, `BlockDrawer`, `ExecEstateHealthMap` (90%), tabel WO ops.
- **Digabungkan:** AlertLoopExecStrip + KPI alert + SLA + resource blockers → `PriorityActionCenter`; dua tabel blok → panel blok map; dua chart WO → satu.
- **Dipecah:** `ExecDashboard`/`OpsDashboard` dihapus setelah migrasi (route alias tetap).
- **Data contract:** perluas `vzBlockExecAll` → **`vzBlockCommandAll`**: + `activeWO`, `activeCases`, `supervisor`, `waterStatus` (dari RESERVOIRS per blok) — SEMUA konsumen (KPI, map, queue, tabel) membaca dari sini; formula risiko inline di E19/O12 dihapus. Item queue distandardisasi: `{id, severity, category, issue, area, impact, pic, due, action:{label,nav,params}, source:{module,at,confidence}}` dengan adapter dari `alerts`, `wos`, `verifQueue`, `RESERVOIRS`, `dqIssues`, `DECISIONS`.
- **State lokal:** filter halaman, drawer target, collapsed sections. **Dari `Ctx`:** `alerts, wos, counts, role, nav, dateRange, hsTreePts`.

## 13. Implementation Roadmap

1. **Navigation consolidation** — route `command-center`, alias exec/ops, NAV/PAGE_TITLE/ROLES.def, halaman sementara = ExecDashboard (tanpa regresi).
2. **Data-contract consolidation** — `vzBlockCommandAll` + priority-item adapters + sambungkan KPI hardcoded (labor/material/alat/air/budget) ke sumber module; unit sanity: angka map = tabel = KPI.
3. **Core page composition** — susun Level 1–6 dengan komponen reuse; hapus widget REMOVE/MOVE sesuai matriks §4.
4. **Role adaptation** — urutan/visibility per matriks §10 via `ROLES`/`can()`; primary CTA per role.
5. **Interaction & drawer** — cross-highlight peta⇄queue, drawer varian, progressive disclosure.
6. **Responsive implementation** — layout tablet/mobile §9 (bukan sekadar mengecil).
7. **Testing & cleanup** — verifikasi 7 role × 3 breakpoint, hapus `ExecDashboard`/`OpsDashboard`, update dokumentasi.

## 14. Acceptance Criteria

1. Sidebar memuat tepat satu entri Command Center tanpa submenu; route `exec` dan `ops` (deep link lama) membuka `command-center` tanpa error.
2. Level 1 menampilkan ≤6 KPI; tidak ada KPI bernilai hardcoded yang tak bersumber dari state/module.
3. Satu konsep (kesehatan blok, WO, verifikasi, alert) hanya memiliki **satu** representasi angka per halaman; nilai KPI = nilai map = nilai tabel untuk blok yang sama (dibuktikan dengan satu sumber `vzBlockCommandAll`).
4. Setiap item priority queue memiliki severity, area, PIC/penanggung jawab, due/SLA, dan minimal satu tombol aksi yang menavigasi ke modul sumber (≤2 klik ke modul detail).
5. Setiap role pada matriks §10 melihat urutan/visibility sesuai kolomnya (dicek per role via switch user).
6. Chip data-confidence tampil dan popover mencantumkan last-updated per sumber; metrik simulasi bertanda.
7. Pada viewport 390 px, urutan mobile §9 terpenuhi dan tidak ada horizontal overflow.
8. `npm run build` lulus; tidak ada regresi navigasi di command palette/browser back.

## 15. Open Questions (perlu keputusan stakeholder)

1. **Budget visibility untuk Mitra Lahan** — matriks mengasumsikan Mitra melihat Health/Exceptions tetapi bukan detail finansial. Benar?
2. **Login landing** — tetap `map` (keputusan 23 Jul) atau pindah ke `command-center` setelah konsolidasi?
3. **Keputusan manajemen** — cukup status-flow ringan (Baru→Berjalan→Selesai + PIC) atau perlu approval berjenjang (usulan → approve Direksi) di fase ini?
4. **Ambang KPI** (§8: target/warning/critical) — angka usulan perlu validasi agronomi/manajemen sebelum dipakai.
5. **MTTR & metrik closed-loop** — tetap tampil (Performance Pulse) atau cukup di Pusat Alert?
