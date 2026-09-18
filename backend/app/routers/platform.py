from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import get_current_user_id
from ..models import Notification, Project, Site

router = APIRouter(prefix="/api", tags=["platform"])


@router.get("/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db), _uid: str = Depends(get_current_user_id)):
    total_projects = db.query(func.count(Project.id)).scalar() or 0
    total_sites = db.query(func.count(Site.id)).scalar() or 0
    total_area = db.query(func.coalesce(func.sum(Site.area_ha), 0)).scalar() or 0
    total_carbon = db.query(func.coalesce(func.sum(Site.carbon_estimate), 0)).scalar() or 0
    active_sites = db.query(func.count(Site.id)).filter(Site.status == "Active").scalar() or 0
    return {
        "total_projects": total_projects,
        "active_sites": total_sites,
        "active_sites_active": active_sites,
        "total_area_ha": round(float(total_area), 1),
        "carbon_impact": round(float(total_carbon), 1),
        "trends": {"projects": 12.5, "sites": 8.2, "area": 6.4, "carbon": 9.7},
        "sparklines": {
            "projects": [14, 16, 15, 18, 20, 22, 24],
            "sites": [120, 134, 141, 152, 168, 175, 186],
            "area": [30, 32, 35, 37, 39, 41, 42.8],
            "carbon": [0.9, 0.98, 1.05, 1.12, 1.18, 1.24, 1.28],
        },
    }


@router.get("/notifications")
def list_notifications(db: Session = Depends(get_db), _uid: str = Depends(get_current_user_id)):
    rows = db.query(Notification).order_by(Notification.created_at.desc()).limit(30).all()
    return [{"id": n.id, "title": n.title, "message": n.message, "kind": n.kind,
             "read": n.read, "created_at": n.created_at.isoformat() if n.created_at else None} for n in rows]


@router.post("/notifications/{nid}/read")
def mark_read(nid: str, db: Session = Depends(get_db), _uid: str = Depends(get_current_user_id)):
    n = db.query(Notification).filter(Notification.id == nid).first()
    if n:
        n.read = True
        db.commit()
    return {"ok": True}


@router.get("/search")
def global_search(q: str = "", db: Session = Depends(get_db), _uid: str = Depends(get_current_user_id)):
    if not q:
        return {"projects": [], "sites": []}
    projs = db.query(Project).filter(Project.name.ilike(f"%{q}%")).limit(6).all()
    sites = db.query(Site).filter(Site.name.ilike(f"%{q}%")).limit(6).all()
    return {
        "projects": [{"id": p.id, "name": p.name, "location": p.location_label, "status": p.status} for p in projs],
        "sites": [{"id": s.id, "name": s.name, "project_id": s.project_id, "area_ha": s.area_ha} for s in sites],
    }
