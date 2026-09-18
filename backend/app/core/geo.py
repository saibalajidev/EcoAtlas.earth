import math
from typing import Any


def _ring_area_m2(ring: list[list[float]]) -> float:
    # Equirectangular approximation around centroid latitude (good enough for demo + server validation)
    if len(ring) < 4:
        return 0.0
    lats = [p[1] for p in ring]
    lngs = [p[0] for p in ring]
    lat0 = sum(lats) / len(lats)
    kx = 111320 * math.cos(math.radians(lat0))
    ky = 110540
    pts = [(lng * kx, lat * ky) for lng, lat in ring]
    area = 0.0
    for i in range(len(pts) - 1):
        x1, y1 = pts[i]
        x2, y2 = pts[i + 1]
        area += x1 * y2 - x2 * y1
    return abs(area) / 2


def _ring_perimeter_km(ring: list[list[float]]) -> float:
    total_m = 0.0
    for i in range(len(ring) - 1):
        lon1, lat1 = ring[i]
        lon2, lat2 = ring[i + 1]
        mx = (lon2 - lon1) * 111320 * math.cos(math.radians((lat1 + lat2) / 2))
        my = (lat2 - lat1) * 110540
        total_m += math.hypot(mx, my)
    return total_m / 1000


def metrics_from_geojson(geometry: dict[str, Any]) -> dict[str, float]:
    """Compute area_ha, perimeter_km, centroid from a GeoJSON Polygon."""
    try:
        coords = geometry.get("coordinates", [])
        ring = coords[0] if coords else []
        if len(ring) < 4:
            return {"area_ha": 0, "perimeter_km": 0, "centroid_lat": 0, "centroid_lng": 0}
        area_ha = _ring_area_m2(ring) / 10000
        perim = _ring_perimeter_km(ring)
        clng = sum(p[0] for p in ring[:-1]) / (len(ring) - 1)
        clat = sum(p[1] for p in ring[:-1]) / (len(ring) - 1)
        return {
            "area_ha": round(area_ha, 2),
            "perimeter_km": round(perim, 2),
            "centroid_lat": round(clat, 6),
            "centroid_lng": round(clng, 6),
        }
    except Exception:
        return {"area_ha": 0, "perimeter_km": 0, "centroid_lat": 0, "centroid_lng": 0}
