# VarmOS Plantation

Platform manajemen kebun agroforestri (Kebun Gunung Hejo, Purwakarta) — command center eksekutif & operasional, peta estate berbasis SVG dengan basemap satelit tersemat, registry pohon, work order & verifikasi, hybrid sensing, perencanaan, tenaga kerja/HOK, panen, keuangan, data quality, dan eksekusi lapangan offline (PWA demo). Seluruh UI berbahasa Indonesia.

Prototype klik-tayang satu berkas (`src/App.jsx`) yang dijalankan sebagai React SPA lokal dengan Vite.

## Prasyarat

- **Node.js 18+** (disarankan LTS 20/22/24) dan npm.
- Mesin ini sudah terpasang Node v24.18.0 di `~/.local/node` (tanpa akses admin).
  Tambahkan ke PATH bila `node` belum dikenali terminal:

  ```bash
  export PATH="$HOME/.local/node/bin:$PATH"
  ```

## Menjalankan

```bash
npm install
npm run dev
```

Buka: **http://localhost:5173** (atau `http://127.0.0.1:5173`).

Production build & pratinjau hasil build:

```bash
npm run build
npm run preview
```

## Login Demo

Gunakan tombol **Akses cepat demo** di halaman login, atau login manual:

| Field | Nilai |
|---|---|
| Email | akun terdaftar, mis. `bayu.syerli@varmos.id` (Direksi) atau `admin@varmos.id` (Super Admin) |
| Kata sandi | `varmos123` |
| Kode 2FA | `246810` |

9 peran tersedia: Super Admin, Direksi, Mitra Lahan, Estate Manager, Agronomy Head, Field Supervisor, Warehouse Officer, Seedling Officer, Finance. Menu & aksi mengikuti matriks permission masing-masing peran.

## Data Dummy

Seluruh data adalah **data prototype tersemat** di `src/App.jsx` (in-memory, tersimpan selama sesi browser — refresh mengembalikan kondisi awal):

- Geometri estate/blok/cluster/petak dari KML asli (koordinat nyata, jangan diubah).
- Basemap satelit tersemat sebagai data URI Base64 (tidak butuh penyedia peta eksternal).
- Sampel registry 601 pohon dari Sensus Desember 2025 + agregat 19.801 pohon per blok.
- Berkas penuh `registry-trees.json` / `census-dec2025.json` (19.801 record) **tidak disertakan**; loader langsung memakai fallback tersemat tanpa request (bebas 404). Aktifkan kembali `fetch()` pada loader di `src/App.jsx` bila deployment menyediakan berkasnya.
- Beberapa dataset (mis. populasi per komoditas) sengaja bernilai 0 — "data kosong, siap data nyata".

## API Cuaca

Widget cuaca memakai **Open-Meteo** (tanpa API key) dan opsional **BMKG** (perlu kode wilayah adm4 — belum dikonfigurasi, `bmkgAdm4:null`). Saat offline/CORS/timeout/response tak valid, aplikasi otomatis memakai data demo tersemat — halaman tidak crash.

## Keterbatasan Offline / PWA (prototype)

- Service worker `public/field-sw.js` aktif di localhost: app-shell cache, network-first, hanya GET, versi cache (`varmos-field-v1`), tidak meng-cache API eksternal maupun modul dev Vite.
- Sinkronisasi lapangan, antrean offline, dan field pack adalah **simulasi in-memory** — bukan offline production-ready. State hilang saat tab ditutup.
- `manifest.webmanifest` minimal tersedia; ikon dibuat runtime oleh aplikasi (canvas).

## Struktur Project

```
varmos-plantation/
├── public/
│   ├── field-sw.js            # service worker minimal (field/PWA demo)
│   └── manifest.webmanifest
├── src/
│   ├── App.jsx                # seluruh aplikasi (monolit prototype, ±13.9rb baris)
│   ├── map/
│   │   ├── PlantationMap.jsx  # peta MapLibre GL (Peta Kebun) — tile Esri/OSM + fallback offline
│   │   └── geo.js             # konversi geometri KML → GeoJSON
│   ├── main.jsx               # entry React
│   └── index.css              # direktif Tailwind + tinggi viewport
├── backup/
│   └── varmos-plantation_15.original.jsx   # source asli (jangan diedit)
├── varmos-plantation_15.jsx   # source asli dari desain (referensi)
├── index.html
├── vite.config.js / tailwind.config.js / postcss.config.js
└── package.json
```

## Troubleshooting

- **`command not found: npm`** — jalankan `export PATH="$HOME/.local/node/bin:$PATH"` (lihat Prasyarat).
- **`localhost:5173` menampilkan aplikasi lain** — ada dev server lain yang mengikat IPv6 `[::1]:5173` (mis. project VarmOS Sawit). Vite project ini mengikat IPv4; buka `http://127.0.0.1:5173`, atau hentikan server lain tersebut.
- **npm memblokir script `esbuild`** saat install ulang — jalankan `npm approve-scripts esbuild` sekali (sudah tercatat di `package.json` → `allowScripts`).
- **Perubahan service worker tidak terlihat** — naikkan `CACHE_VERSION` di `public/field-sw.js`, lalu hard-refresh; cache lama dibersihkan otomatis saat activate.
- **Chart kosong** pada "Populasi per komoditas" — memang data 0 di prototype (lihat Data Dummy).
