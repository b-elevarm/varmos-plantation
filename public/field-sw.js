/* VarmOS Plantation — service worker minimal untuk eksekusi lapangan (prototype).
   Strategi: network-first untuk navigasi & aset same-origin (fallback ke cache
   saat offline). Hanya method GET yang dicache. Request API eksternal
   (Open-Meteo, BMKG) dan modul dev Vite tidak pernah dicache. */
const CACHE_VERSION = "varmos-field-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {}) // app-shell precache gagal ≠ instalasi gagal
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function isCacheable(request, url) {
  if (request.method !== "GET") return false;
  if (url.origin !== self.location.origin) return false; // jangan cache API eksternal
  // Jangan cache pipeline dev Vite (HMR, module graph) agar tidak infinite reload.
  if (url.pathname.startsWith("/@") || url.pathname.startsWith("/src/")) return false;
  if (url.pathname.includes("node_modules")) return false;
  return true;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (!isCacheable(request, url)) return; // biarkan browser menangani langsung

  // Network-first: respons segar diprioritaskan, cache dipakai saat offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(
          (cached) =>
            cached ||
            (request.mode === "navigate" ? caches.match("/index.html") : Response.error())
        )
      )
  );
});
