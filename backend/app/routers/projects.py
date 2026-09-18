from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import get_current_user_id
from ..models import Project, Site
from ..schemas import ProjectIn

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _project_payload(p: Project, db: Session) -> dict:
    sites = db.query(Site).filter(Site.project_id == p.id).all()
    area = round(sum(s.area_ha for s in sites), 1)
    carbon = round(sum(s.carbon_estimate for s in sites), 1)
    bio = round(sum(s.biodiversity_score for s in sites) / len(sites), 1) if sites else 0
    progress = min(96, 34 + (len(sites) * 5) + int(area % 17))
    return {
        "id": p.id, "name": p.name, "description": p.description,
        "project_type": p.project_type, "status": p.status,
        "location_label": p.location_label, "image": p.image,
        "start_date": p.start_date, "end_date": p.end_date,
        "sites_count": len(sites), "total_area_ha": area,
        "carbon_estimate": carbon, "biodiversity_avg": bio,
        "progress": progress,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


@router.get("")
def list_projects(search: str = "", status: str = "", ptype: str = "", db: Session = Depends(get_db),
                  _uid: str = Depends(get_current_user_id)):
    q = db.query(Project)
    if search:
        q = q.filter(Project.name.ilike(f"%{search}%"))
    if status and status != "All":
        q = q.filter(Project.status == status)
    if ptype and ptype != "All":
        q = q.filter(Project.project_type == ptype)
    projects = q.order_by(Project.created_at.desc()).all()
    return [_project_payload(p, db) for p in projects]


@router.post("", status_code=201)
def create_project(body: ProjectIn, db: Session = Depends(get_db), uid: str = Depends(get_current_user_id)):
    p = Project(**body.model_dump(), owner_id=uid)
    db.add(p)
    db.commit()
    db.refresh(p)
    return _project_payload(p, db)


@router.get("/{pid}")
def get_project(pid: str, db: Session = Depends(get_db), _uid: str = Depends(get_current_user_id)):
    p = db.query(Project).filter(Project.id == pid).first()
    if not p:
        raise HTTPException(404, "Project not found")
    data = _project_payload(p, db)
    sites = db.query(Site).filter(Site.project_id == pid).all()
    data["sites"] = [ {"id": s.id, "name": s.name, "status": s.status, "area_ha": s.area_ha,
                       "carbon_estimate": s.carbon_estimate, "centroid_lat": s.centroid_lat,
                       "centroid_lng": s.centroid_lng, "geometry": s.geometry_geojson} for s in sites]
    # monthly performance (aggregate demo trend)
    months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    base = max(data["carbon_estimate"], 100)
    data["performance"] = {
        "months": months,
        "carbon": [round(base * (0.55 + i * 0.045), 1) for i in range(12)],
        "vegetation": [round(58 + i * 2.1 + (len(sites) % 5), 1) for i in range(12)],
        "biodiversity": [round(52 + i * 2.3 + (len(sites) % 4), 1) for i in range(12)],
        "area_monitored": [round(data["total_area_ha"] * (0.6 + i * 0.035), 1) for i in range(12)],
    }
    return data


@router.put("/{pid}")
def update_project(pid: str, body: ProjectIn, db: Session = Depends(get_db), _uid: str = Depends(get_current_user_id)):
    p = db.query(Project).filter(Project.id == pid).first()
    if not p:
        raise HTTPException(404, "Project not found")
    for k, v in body.model_dump().items():
        setattr(p, k, v)
    p.updated_at = datetime.utcnow()
    db.commit()
    return _project_payload(p, db)


@router.delete("/{pid}")
def delete_project(pid: str, db: Session = Depends(get_db), _uid: str = Depends(get_current_user_id)):
    p = db.query(Project).filter(Project.id == pid).first()
    if not p:
        raise HTTPException(404, "Project not found")
    db.delete(p)
    db.commit()
    return {"ok": True}
