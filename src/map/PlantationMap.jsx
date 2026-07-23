/* PlantationMap — wrapper MapLibre GL "bodoh" untuk Peta Kebun.
   Seluruh logika domain (drill, metrik, warna, tooltip) tetap di MapPage;
   komponen ini hanya menerima GeoJSON dengan properti tergambar siap-pakai:
   - areas:   FeatureCollection poligon level aktif — properties {id, fill, pTitle, pSub, pVal}
   - context: FeatureCollection garis batas induk (opsional)
   - trees:   FeatureCollection titik pohon — properties {i, color, op} (opsional)
   - labels:  [{id, lngLat, text, sub}] → chip DOM Marker
   Basemap: satelit (Esri World Imagery) | jalan (OSM) | polos, dengan citra
   tersemat (Google Earth ter-georeferensi) sebagai lapisan cadangan offline
   di bawah tile — tampil otomatis saat tile tak termuat. */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const BASEMAPS = {
  satelit: {
    tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
    maxzoom: 19,
    attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
  },
  jalan: {
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    maxzoom: 19,
    attribution: "© OpenStreetMap contributors",
  },
  polos: { tiles: null, attribution: "" },
  monitoring: { tiles: null, attribution: "HLS Sentinel-2 ±30 m © NASA GIBS · ESA Copernicus" },
};

/* Basemap monitoring: HLS S30 (Sentinel-2) via NASA GIBS — pass terbaru, tanpa API key.
   GIBS meng-404-kan tanggal tanpa liputan granule, jadi tanggal pass terakhir untuk
   lokasi kebun ditemukan dengan menguji satu tile z12 mundur per hari. */
const GIBS_HLS = (date) =>
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/HLS_S30_Nadir_BRDF_Adjusted_Reflectance/default/${date}/GoogleMapsCompatible_Level12/{z}/{y}/{x}.png`;
const tileXY = (lon, lat, z) => {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const rad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n);
  return [x, y];
};
async function findLatestHlsDate(lon, lat, maxDaysBack = 21) {
  const [x, y] = tileXY(lon, lat, 12);
  for (let i = 0; i < maxDaysBack; i++) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    try {
      const res = await fetch(GIBS_HLS(d).replace("{z}/{y}/{x}", `12/${y}/${x}`), { method: "GET" });
      if (res.ok) return d;
    } catch (e) { /* offline → menyerah */ return null; }
  }
  return null;
}

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const EMPTY_FC = { type: "FeatureCollection", features: [] };

const PlantationMap = forwardRef(function PlantationMap(
  { height, basemap = "satelit", offlineImage = null, areas, context = null, trees = null,
    labels = [], showLabels = true, selectedId = null, fitKey = "", focusTarget = null,
    points = [], showPoints = true, roads = null, showRoads = true,
    onAreaClick, onTreeClick },
  ref
) {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [monitorDate, setMonitorDate] = useState(null); /* tanggal pass HLS terbaru | "none" */
  const monitorProbe = useRef(false);
  const markersRef = useRef([]);
  const infraRef = useRef([]);
  const popupRef = useRef(null);
  const cbRef = useRef({});
  cbRef.current = { onAreaClick, onTreeClick };

  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current && mapRef.current.zoomIn(),
    zoomOut: () => mapRef.current && mapRef.current.zoomOut(),
    resetNorth: () => mapRef.current && mapRef.current.easeTo({ bearing: 0, pitch: 0 }),
    getMap: () => mapRef.current,
  }), []);

  /* ---- init sekali ---- */
  useEffect(() => {
    if (!boxRef.current) return;
    const start = BASEMAPS.satelit;
    const sources = {
      base: { type: "raster", tiles: start.tiles, tileSize: 256, maxzoom: start.maxzoom },
    };
    const layersDef = [
      { id: "bg", type: "background", paint: { "background-color": "#3a4453" } },
    ];
    if (offlineImage && offlineImage.url) {
      sources.offline = { type: "image", url: offlineImage.url, coordinates: offlineImage.coordinates };
      layersDef.push({ id: "offline", type: "raster", source: "offline", paint: { "raster-opacity": 1 } });
    }
    layersDef.push({ id: "base", type: "raster", source: "base" });

    const map = new maplibregl.Map({
      container: boxRef.current,
      style: { version: 8, sources, layers: layersDef },
      center: [107.4183, -6.665],
      zoom: 14,
      attributionControl: false,
    });
    mapRef.current = map;
    if (typeof window !== "undefined") window.__vzmap = map; // alat inspeksi (dev)
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.dragRotate.enable();
    map.touchZoomRotate.enable();

    map.on("load", () => {
      map.addSource("areas", { type: "geojson", data: EMPTY_FC, promoteId: "id" });
      map.addSource("context", { type: "geojson", data: EMPTY_FC });
      map.addSource("trees", { type: "geojson", data: EMPTY_FC });

      map.addLayer({ id: "areas-fill", type: "fill", source: "areas",
        paint: { "fill-color": ["coalesce", ["get", "fill"], "#9CA3AF"], "fill-opacity": 0.5 } });
      map.addLayer({ id: "context-line", type: "line", source: "context",
        paint: { "line-color": "#166534", "line-width": 1.6, "line-dasharray": [3, 2], "line-opacity": 0.9 } });
      map.addLayer({ id: "areas-line", type: "line", source: "areas",
        paint: { "line-color": "#FFFFFF", "line-width": 1.6 } });
      map.addLayer({ id: "areas-selected", type: "line", source: "areas",
        filter: ["==", ["get", "id"], "__none__"],
        paint: { "line-color": "#7C3AED", "line-width": 3 } });
      map.addSource("roads", { type: "geojson", data: EMPTY_FC });
      map.addLayer({ id: "roads-casing", type: "line", source: "roads",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#FFFFFF", "line-width": 4, "line-opacity": 0.55 } });
      map.addLayer({ id: "roads-line", type: "line", source: "roads",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#D97706", "line-width": 1.8, "line-dasharray": [2.2, 1.4] } });
      map.addLayer({ id: "trees-pts", type: "circle", source: "trees",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 1.2, 17, 3.4, 20, 7],
          "circle-color": ["coalesce", ["get", "color"], "#22c55e"],
          "circle-opacity": ["coalesce", ["get", "op"], 1],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 0.5,
          "circle-stroke-opacity": ["coalesce", ["get", "op"], 1],
        } });

      map.on("click", "areas-fill", (e) => {
        const f = e.features && e.features[0];
        if (f && cbRef.current.onAreaClick) cbRef.current.onAreaClick(f.properties.id);
      });
      map.on("click", "trees-pts", (e) => {
        const f = e.features && e.features[0];
        if (f && cbRef.current.onTreeClick) { e.preventDefault(); cbRef.current.onTreeClick(+f.properties.i); }
      });
      map.on("mouseenter", "areas-fill", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "areas-fill", () => (map.getCanvas().style.cursor = ""));
      map.on("mouseenter", "trees-pts", () => (map.getCanvas().style.cursor = "pointer"));

      popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10, maxWidth: "260px" });
      map.on("mousemove", "areas-fill", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;
        const p = f.properties;
        popupRef.current
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font:600 12px Inter,system-ui,sans-serif;color:#111827">${esc(p.pTitle)}</div>` +
            (p.pSub ? `<div style="font:11px Inter,system-ui,sans-serif;color:#6B7280">${esc(p.pSub)}</div>` : "") +
            (p.pVal ? `<div style="font:11px Inter,system-ui,sans-serif;color:#374151;margin-top:2px">${esc(p.pVal)}</div>` : "") +
            (p.pCom ? `<div style="font:11px Inter,system-ui,sans-serif;color:#374151">${esc(p.pCom)}</div>` : "")
          )
          .addTo(map);
      });
      map.on("mouseleave", "areas-fill", () => popupRef.current && popupRef.current.remove());

      setReady(true);
    });
    return () => { markersRef.current.forEach((m) => m.remove()); infraRef.current.forEach((m) => m.remove()); map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- data areas / context / trees ---- */
  useEffect(() => { if (ready) mapRef.current.getSource("areas").setData(areas || EMPTY_FC); }, [ready, areas]);
  useEffect(() => { if (ready) mapRef.current.getSource("context").setData(context || EMPTY_FC); }, [ready, context]);
  useEffect(() => { if (ready) mapRef.current.getSource("trees").setData(trees || EMPTY_FC); }, [ready, trees]);
  useEffect(() => { if (ready) mapRef.current.getSource("roads").setData(roads || EMPTY_FC); }, [ready, roads]);
  useEffect(() => {
    if (!ready) return;
    ["roads-casing", "roads-line"].forEach((id) =>
      mapRef.current.setLayoutProperty(id, "visibility", showRoads ? "visible" : "none"));
  }, [ready, showRoads]);

  /* ---- marker infrastruktur (ikon DOM dengan tooltip judul) ---- */
  useEffect(() => {
    if (!ready) return;
    infraRef.current.forEach((m) => m.remove());
    infraRef.current = [];
    if (!showPoints) return;
    (points || []).forEach((p) => {
      const el = document.createElement("div");
      el.style.cssText = "width:26px;height:26px;border-radius:50%;background:#fff;border:1.5px solid #94A3B8;" +
        "box-shadow:0 1px 4px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer";
      el.textContent = p.icon || "•";
      /* Popup hover dengan data status (bukan tooltip title bawaan browser) */
      el.addEventListener("mouseenter", () => {
        if (!popupRef.current || !mapRef.current) return;
        popupRef.current
          .setLngLat(p.lngLat)
          .setHTML(
            `<div style="font:600 12px Inter,system-ui,sans-serif;color:#111827">${esc(p.name || p.title || p.id)}</div>` +
            (p.sub ? `<div style="font:11px Inter,system-ui,sans-serif;color:#374151">${esc(p.sub)}</div>` : "") +
            (p.note ? `<div style="font:11px Inter,system-ui,sans-serif;color:#B45309">${esc(p.note)}</div>` : "") +
            (p.srcLabel ? `<div style="font:10px Inter,system-ui,sans-serif;color:#9CA3AF;margin-top:2px">${esc(p.srcLabel)}</div>` : "")
          )
          .addTo(mapRef.current);
      });
      el.addEventListener("mouseleave", () => popupRef.current && popupRef.current.remove());
      const m = new maplibregl.Marker({ element: el }).setLngLat(p.lngLat).addTo(mapRef.current);
      infraRef.current.push(m);
    });
  }, [ready, points, showPoints]);

  /* ---- highlight terpilih ---- */
  useEffect(() => {
    if (ready) mapRef.current.setFilter("areas-selected", ["==", ["get", "id"], selectedId || "__none__"]);
  }, [ready, selectedId]);

  /* ---- pencarian tanggal pass HLS terbaru (sekali, saat monitoring pertama dipilih) ---- */
  useEffect(() => {
    if (basemap !== "monitoring" || monitorProbe.current) return;
    monitorProbe.current = true;
    const c = areas && areas.features[0] ? areas.features[0].geometry : null;
    const ring = c ? (c.type === "MultiPolygon" ? c.coordinates[0][0] : c.coordinates[0]) : null;
    const [lon, lat] = ring ? ring[0] : [107.4183, -6.665];
    findLatestHlsDate(lon, lat).then((d) => setMonitorDate(d || "none"));
  }, [basemap, areas]);

  /* ---- basemap (tanpa membuat ulang peta) ---- */
  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const cfg = BASEMAPS[basemap] || BASEMAPS.satelit;
    if (!map.getLayer("base")) return;
    const showMonitor = basemap === "monitoring" && monitorDate && monitorDate !== "none";
    if (showMonitor && !map.getSource("monitor")) {
      map.addSource("monitor", { type: "raster", tiles: [GIBS_HLS(monitorDate)], tileSize: 256, maxzoom: 12 });
      map.addLayer({ id: "monitor", type: "raster", source: "monitor" }, "areas-fill");
    }
    if (map.getLayer("monitor")) map.setLayoutProperty("monitor", "visibility", showMonitor ? "visible" : "none");
    if (basemap === "monitoring" || !cfg.tiles) {
      map.setLayoutProperty("base", "visibility", "none");
      if (map.getLayer("offline")) map.setLayoutProperty("offline", "visibility", "none");
    } else {
      map.setLayoutProperty("base", "visibility", "visible");
      if (map.getLayer("offline"))
        map.setLayoutProperty("offline", "visibility", basemap === "satelit" ? "visible" : "none");
      const src = map.getSource("base");
      if (src && src.setTiles) src.setTiles(cfg.tiles);
    }
  }, [ready, basemap, monitorDate]);

  /* ---- label chip (DOM marker, gaya chip SVG lama) ---- */
  useEffect(() => {
    if (!ready) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (!showLabels) return;
    (labels || []).forEach((l) => {
      const el = document.createElement("div");
      el.style.cssText = "pointer-events:none;transform:translateZ(0)";
      el.innerHTML =
        `<div style="background:rgba(17,24,39,.78);color:#fff;font:600 10px Inter,system-ui,sans-serif;padding:2px 6px;border-radius:5px;text-align:center;white-space:nowrap">${esc(l.text)}` +
        (l.sub ? `<div style="font-weight:400;font-size:9px;opacity:.85">${esc(l.sub)}</div>` : "") + "</div>";
      const m = new maplibregl.Marker({ element: el }).setLngLat(l.lngLat).addTo(mapRef.current);
      markersRef.current.push(m);
    });
  }, [ready, labels, showLabels]);

  /* ---- fit saat ganti level drill ---- */
  const lastFit = useRef("");
  useEffect(() => {
    if (!ready || !areas || !areas.features.length || fitKey === lastFit.current) return;
    lastFit.current = fitKey;
    const b = new maplibregl.LngLatBounds();
    areas.features.forEach((f) => {
      const polys = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates];
      polys.forEach((poly) => poly[0].forEach((c) => b.extend(c)));
    });
    mapRef.current.fitBounds(b, { padding: 46, duration: 550 });
  }, [ready, areas, fitKey]);

  /* ---- fokus eksplisit (klik hierarki / panel) ---- */
  const lastFocus = useRef(0);
  useEffect(() => {
    if (!ready || !focusTarget || !focusTarget.bounds || focusTarget.t === lastFocus.current) return;
    lastFocus.current = focusTarget.t;
    const [w, s, e, n] = focusTarget.bounds;
    mapRef.current.fitBounds([[w, s], [e, n]], { padding: 70, duration: 550 });
  }, [ready, focusTarget]);

  const attribution = (BASEMAPS[basemap] || {}).attribution;
  const monitorNote = basemap !== "monitoring" ? "" :
    monitorDate === "none" ? " — pass tidak ditemukan (offline?)" :
    monitorDate ? " · pass " + monitorDate : " · mencari pass terbaru…";
  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <div ref={boxRef} style={{ width: "100%", height: "100%" }} />
      {attribution && (
        <div style={{ position: "absolute", bottom: 2, right: 2, zIndex: 5, font: "9px Inter,system-ui,sans-serif",
          color: "rgba(255,255,255,.92)", background: "rgba(0,0,0,.4)", padding: "1px 5px", borderRadius: 4 }}>
          {attribution}{monitorNote}{offlineImage && basemap === "satelit" ? " · offline © Google Earth" : ""}
        </div>
      )}
    </div>
  );
});

export default PlantationMap;
