from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.geo import metrics_from_geojson
from ..core.security import get_current_user_id
from ..models import Notification, Project, Site, SiteAnalytics
from ..schemas import SiteIn

router = APIRouter(prefix="/api/sites", tags=["sites"])


def _site_payload(s: Site, project_name: str = "") -> dict:
    return {
        "id": s.id, "project_id": s.project_id, "project_name": project_name,
        "name": s.name, "description": s.description, "site_type": s.site_type,
        "status": s.status, "area_ha": s.area_ha, "perimeter_km": s.perimeter_km,
        "centroid_lat": s.centroid_lat, "centroid_lng": s.centroid_lng,
        "geometry": s.geometry_geojson, "carbon_estimate": s.carbon_estimate,
        "biodiversity_score": s.biodiversity_score, "vegetation_index": s.vegetation_index,
        "coverage_pct": s.coverage_pct,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }


@router.get("")
def list_sites(project_id: str = "", search: str = "", db: Session = Depends(get_db),
               _uid: str = Depends(get_current_user_id)):
    q = db.query(Site, Project.name).join(Project, Project.id == Site.project_id, isouter=True)
    if project_id:
        q = q.filter(Site.project_id == project_id)
    if search:
        q = q.filter(Site.name.ilike(f"%{search}%"))
    rows = q.order_by(Site.created_at.desc()).limit(500).all()
    return [_site_payload(s, pname or "") for s, pname in rows]


@router.post("", status_code=201)
def create_site(body: SiteIn, db: Session = Depends(get_db), uid: str = Depends(get_current_user_id)):
    proj = db.query(Project).filter(Project.id == body.project_id).first()
    if not proj:
        raise HTTPException(404, "Project not found")
    geom = body.geometry
    if not geom or geom.get("type") != "Polygon":
        raise HTTPException(400, "Invalid polygon: geometry must be a GeoJSON Polygon")
    calc = metrics_from_geojson(geom)
    s = Site(
        project_id=body.project_id, name=body.name, description=body.description,
        site_type=body.site_type, status=body.status, geometry_geojson=geom,
        area_ha=body.area_ha or calc["area_ha"], perimeter_km=body.perimeter_km or calc["perimeter_km"],
        centroid_lat=body.centroid_lat if body.centroid_lat is not None else calc["centroid_lat"],
        centroid_lng=body.centroid_lng if body.centroid_lng is not None else calc["centroid_lng"],
        carbon_estimate=body.carbon_estimate or round((body.area_ha or calc["area_ha"]) * 30.2, 1),
        biodiversity_score=body.biodiversity_score or 72.5,
        vegetation_index=body.vegetation_index or 81.0,
        coverage_pct=body.coverage_pct or 92.0,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    # seed 12 months analytics
    months = [f"2025-{m:02d}" for m in range(7, 13)] + [f"2026-{m:02d}" for m in range(1, 7)]
    for i, m in enumerate(months):
        db.add(SiteAnalytics(site_id=s.id, month=m,
                             carbon=round(s.carbon_estimate * (0.5 + i * 0.05), 2),
                             vegetation=round(min(96, s.vegetation_index - 12 + i * 1.4), 1),
                             biodiversity=round(min(95, s.biodiversity_score - 10 + i * 1.1), 1),
                             area_monitored=round(s.area_ha * (0.6 + i * 0.033), 2)))
    db.add(Notification(user_id=uid, title="Site added", message=f"Site {s.name} was successfully added.", kind="success"))
    db.commit()
    # best-effort PostGIS sync
    try:
        if "postgresql" in str(db.bind.url):
            import json
            db.execute(__import__("sqlalchemy").text(
                "UPDATE sites SET geom = ST_SetSRID(ST_GeomFromGeoJSON(:g), 4326) WHERE id = :id"),
                {"g": json.dumps(geom), "id": s.id})
            db.commit()
    except Exception:
        pass
    return _site_payload(s, proj.name)


@router.get("/{sid}")
def get_site(sid: str, db: Session = Depends(get_db), _uid: str = Depends(get_current_user_id)):
    s = db.query(Site).filter(Site.id == sid).first()
    if not s:
        raise HTTPException(404, "Site not found")
    pname = ""
    proj = db.query(Project).filter(Project.id == s.project_id).first()
    if proj:
        pname = proj.name
    return _site_payload(s, pname)


@router.put("/{sid}")
def update_site(sid: str, body: SiteIn, db: Session = Depends(get_db), _uid: str = Depends(get_current_user_id)):
    s = db.query(Site).filter(Site.id == sid).first()
    if not s:
        raise HTTPException(404, "Site not found")
    for k in ["name", "description", "site_type", "status", "carbon_estimate",
              "biodiversity_score", "vegetation_index", "coverage_pct"]:
        setattr(s, k, getattr(body, k))
    if body.geometry and body.geometry.get("type") == "Polygon":
        s.geometry_geojson = body.geometry
        calc = metrics_from_geojson(body.geometry)
        s.area_ha = body.area_ha or calc["area_ha"]
        s.perimeter_km = body.perimeter_km or calc["perimeter_km"]
    s.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.delete("/{sid}")
def delete_site(sid: str, db: Session = Depends(get_db), _uid: str = Depends(get_current_user_id)):
    s = db.query(Site).filter(Site.id == sid).first()
    if not s:
        raise HTTPException(404, "Site not found")
    db.query(SiteAnalytics).filter(SiteAnalytics.site_id == sid).delete()
    db.delete(s)
    db.commit()
    return {"ok": True}


@router.get("/{sid}/analytics")
def site_analytics(sid: str, db: Session = Depends(get_db), _uid: str = Depends(get_current_user_id)):
    s = db.query(Site).filter(Site.id == sid).first()
    if not s:
        raise HTTPException(404, "Site not found")
    rows = db.query(SiteAnalytics).filter(SiteAnalytics.site_id == sid).order_by(SiteAnalytics.month).all()
    return {
        "site": {"id": s.id, "name": s.name, "area_ha": s.area_ha,
                 "carbon_estimate": s.carbon_estimate, "biodiversity_score": s.biodiversity_score,
                 "vegetation_index": s.vegetation_index, "coverage_pct": s.coverage_pct},
        "series": [{"month": r.month, "carbon": r.carbon, "vegetation": r.vegetation,
                    "biodiversity": r.biodiversity, "area_monitored": r.area_monitored} for r in rows],
    }
