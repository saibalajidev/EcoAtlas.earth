import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .core.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(120), default="Admin")
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="admin")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Project(Base):
    __tablename__ = "projects"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    project_type: Mapped[str] = mapped_column(String(64), default="Carbon")  # Carbon|Biodiversity|Carbon + Biodiversity
    status: Mapped[str] = mapped_column(String(32), default="Active")  # Active|Monitoring|Completed|At Risk
    location_label: Mapped[str] = mapped_column(String(255), default="")
    image: Mapped[str] = mapped_column(String(512), default="")
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    start_date: Mapped[str] = mapped_column(String(32), default="")
    end_date: Mapped[str] = mapped_column(String(32), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    sites: Mapped[list["Site"]] = relationship("Site", back_populates="project", cascade="all, delete-orphan")


class Site(Base):
    __tablename__ = "sites"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    site_type: Mapped[str] = mapped_column(String(64), default="Restoration")
    status: Mapped[str] = mapped_column(String(32), default="Active")
    area_ha: Mapped[float] = mapped_column(Float, default=0)
    perimeter_km: Mapped[float] = mapped_column(Float, default=0)
    centroid_lat: Mapped[float] = mapped_column(Float, default=0)
    centroid_lng: Mapped[float] = mapped_column(Float, default=0)
    geometry_geojson: Mapped[dict] = mapped_column(JSON, default=dict)  # canonical GeoJSON Polygon
    # PostGIS column (used when running on Postgres/PostGIS; ignored on sqlite fallback)
    geom = None
    carbon_estimate: Mapped[float] = mapped_column(Float, default=0)
    biodiversity_score: Mapped[float] = mapped_column(Float, default=0)
    vegetation_index: Mapped[float] = mapped_column(Float, default=0)
    coverage_pct: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    project: Mapped["Project"] = relationship("Project", back_populates="sites")


class SiteAnalytics(Base):
    __tablename__ = "site_analytics"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id", ondelete="CASCADE"), index=True)
    month: Mapped[str] = mapped_column(String(16))  # YYYY-MM
    carbon: Mapped[float] = mapped_column(Float, default=0)
    vegetation: Mapped[float] = mapped_column(Float, default=0)
    biodiversity: Mapped[float] = mapped_column(Float, default=0)
    area_monitored: Mapped[float] = mapped_column(Float, default=0)


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text, default="")
    kind: Mapped[str] = mapped_column(String(32), default="info")
    read: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ProjectMember(Base):
    __tablename__ = "project_members"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(32), default="viewer")  # owner|editor|viewer
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
