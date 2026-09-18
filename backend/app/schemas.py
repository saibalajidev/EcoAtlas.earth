from typing import Any, Optional
from pydantic import BaseModel, EmailStr


class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ProjectIn(BaseModel):
    name: str
    description: str = ""
    project_type: str = "Carbon"
    status: str = "Active"
    location_label: str = ""
    image: str = ""
    start_date: str = ""
    end_date: str = ""


class SiteIn(BaseModel):
    project_id: str
    name: str
    description: str = ""
    site_type: str = "Restoration"
    status: str = "Active"
    geometry: dict[str, Any]
    area_ha: Optional[float] = None
    perimeter_km: Optional[float] = None
    centroid_lat: Optional[float] = None
    centroid_lng: Optional[float] = None
    carbon_estimate: float = 0
    biodiversity_score: float = 0
    vegetation_index: float = 0
    coverage_pct: float = 0
