/* Konversi geometri unit HS_GEO (ring [lon,lat] dari KML) → GeoJSON.
   Murni & tanpa dependensi — dipakai MapPage untuk menyiapkan data PlantationMap. */

const closeRing = (ring) => {
  if (!ring || ring.length < 3) return ring || [];
  const [f, l] = [ring[0], ring[ring.length - 1]];
  return f[0] === l[0] && f[1] === l[1] ? ring : [...ring, f];
};

/* Unit → Feature. extraLl (ring tambahan, mis. aneks Blok 4) → MultiPolygon. */
export function unitFeature(u, props) {
  const main = closeRing(u.ll);
  const geometry =
    u.extraLl && u.extraLl.length
      ? { type: "MultiPolygon", coordinates: [[main], ...u.extraLl.map((r) => [closeRing(r)])] }
      : { type: "Polygon", coordinates: [main] };
  return { type: "Feature", id: u.id, geometry, properties: { id: u.id, ...props } };
}

export const featureCollection = (features) => ({ type: "FeatureCollection", features });

/* Bounds [w,s,e,n] sebuah unit (termasuk ring tambahan). */
export function unitBounds(u) {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const eat = (ring) => (ring || []).forEach(([lo, la]) => {
    if (lo < w) w = lo; if (lo > e) e = lo;
    if (la < s) s = la; if (la > n) n = la;
  });
  eat(u.ll);
  (u.extraLl || []).forEach(eat);
  return [w, s, e, n];
}

/* Bounds gabungan beberapa unit. */
export function unitsBounds(units) {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  units.forEach((u) => {
    const [uw, us, ue, un] = unitBounds(u);
    if (uw < w) w = uw; if (ue > e) e = ue;
    if (us < s) s = us; if (un > n) n = un;
  });
  return [w, s, e, n];
}
