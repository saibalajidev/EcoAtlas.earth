"""Realistic demo seed across India. All metric values are SAMPLE/DEMO data."""
import random
from datetime import datetime

from .core.database import Base, SessionLocal, engine
from .core.security import hash_password
from .models import Notification, Project, Site, SiteAnalytics, User

random.seed(42)

PROJECTS = [
    ("Western Ghats Forest Restoration", "Carbon + Biodiversity", "Active", "Western Ghats, Karnataka", 12.97, 77.59),
    ("Sundarbans Mangrove Shield", "Carbon + Biodiversity", "Active", "Sundarbans, West Bengal", 22.28, 89.07),
    ("Kaziranga Grassland Corridor", "Biodiversity", "Monitoring", "Kaziranga, Assam", 26.57, 93.17),
    ("Aravalli Green Belt Revival", "Carbon", "Active", "Aravalli, Rajasthan", 27.02, 76.35),
    ("Nilgiri Shola Conservation", "Biodiversity", "Active", "Nilgiris, Tamil Nadu", 11.41, 76.70),
    ("Similipal Tiger Landscape", "Carbon + Biodiversity", "At Risk", "Similipal, Odisha", 21.83, 86.33),
    ("Satpura Deciduous Carbon sinks", "Carbon", "Monitoring", "Satpura, Madhya Pradesh", 22.45, 78.13),
    ("Periyar Evergreen Protection", "Carbon + Biodiversity", "Completed", "Periyar, Kerala", 9.46, 77.24),
]

STATUS_POOL = ["Active", "Active", "Active", "Monitoring", "Completed", "At Risk"]


def poly_around(lat: float, lng: float, size_deg: float = 0.018) -> dict:
    d = size_deg * random.uniform(0.5, 1.4)
    squish = random.uniform(0.6, 1.3)
    ring = [
        [lng - d, lat - d * squish],
        [lng + d * 0.7, lat - d],
        [lng + d, lat + d * 0.5],
        [lng + d * 0.3, lat + d],
        [lng - d * 0.8, lat + d * 0.6],
        [lng - d, lat - d * squish],
    ]
    return {"type": "Polygon", "coordinates": [ring]}


def approx_area_ha(geom: dict) -> float:
    ring = geom["coordinates"][0]
    lats = [p[1] for p in ring]
    lat0 = sum(lats) / len(lats)
    import math
    kx = 111320 * math.cos(math.radians(lat0))
    ky = 110540
    pts = [(p[0] * kx, p[1] * ky) for p in ring]
    a = abs(sum(pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1] for i in range(len(pts) - 1))) / 2
    return round(a / 10000, 1)


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Project).count() > 0:
            print("Seed skipped: projects already exist")
            return
        admin = db.query(User).filter(User.email == "admin@ecoatlas.earth").first()
        if not admin:
            admin = User(name="Admin", email="admin@ecoatlas.earth",
                         password_hash=hash_password("EcoAtlas123!"))
            db.add(admin)
            db.commit()
            db.refresh(admin)
        months = [f"2025-{m:02d}" for m in range(7, 13)] + [f"2026-{m:02d}" for m in range(1, 7)]
        for idx, (name, ptype, status, loc, lat, lng) in enumerate(PROJECTS):
            p = Project(name=name, description=f"Sample restoration programme in {loc}. Demo data for evaluation.",
                        project_type=ptype, status=status, location_label=loc,
                        image="", owner_id=admin.id,
                        start_date="2024-06-01", end_date="2027-05-31")
            db.add(p)
            db.commit()
            db.refresh(p)
            n_sites = random.randint(6, 11)
            for s_i in range(n_sites):
                slat = lat + random.uniform(-0.35, 0.35)
                slng = lng + random.uniform(-0.35, 0.35)
                geom = poly_around(slat, slng)
                area = approx_area_ha(geom)
                carbon = round(area * random.uniform(24, 38), 1)
                bio = round(random.uniform(58, 91), 1)
                veg = round(random.uniform(62, 94), 1)
                cov = round(random.uniform(78, 98), 1)
                st = random.choice(STATUS_POOL)
                ring = geom["coordinates"][0]
                clat = round(sum(p[1] for p in ring[:-1]) / (len(ring) - 1), 6)
                clng = round(sum(p[0] for p in ring[:-1]) / (len(ring) - 1), 6)
                s = Site(project_id=p.id, name=f"{loc.split(',')[0].strip()}-{s_i + 1:02d}",
                         description="Demo monitoring site with sample metrics.",
                         site_type=random.choice(["Restoration", "Conservation", "Agroforestry", "Mangrove"]),
                         status=st, area_ha=area, perimeter_km=round((area ** 0.5) * 0.42 + 2, 2),
                         centroid_lat=clat, centroid_lng=clng, geometry_geojson=geom,
                         carbon_estimate=carbon, biodiversity_score=bio,
                         vegetation_index=veg, coverage_pct=cov)
                db.add(s)
                db.commit()
                db.refresh(s)
                for mi, m in enumerate(months):
                    db.add(SiteAnalytics(site_id=s.id, month=m,
                                         carbon=round(carbon * (0.5 + mi * 0.05), 2),
                                         vegetation=round(min(96, veg - 12 + mi * 1.4), 1),
                                         biodiversity=round(min(95, bio - 10 + mi * 1.1), 1),
                                         area_monitored=round(area * (0.6 + mi * 0.033), 2)))
            db.commit()
        db.add_all([
            Notification(user_id=admin.id, title="Site added",
                         message="Site Western Ghats-04 was successfully added.", kind="success"),
            Notification(user_id=admin.id, title="Data refresh",
                         message="Project Western Ghats data updated.", kind="info"),
            Notification(user_id=admin.id, title="Attention needed",
                         message="Site 12 has not been updated for 30 days.", kind="warning"),
            Notification(user_id=admin.id, title="Carbon uplift",
                         message="Carbon performance increased by 8.4%.", kind="success"),
        ])
        db.commit()
        print(f"Seeded {db.query(Project).count()} projects, {db.query(Site).count()} sites (DEMO data).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
