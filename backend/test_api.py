from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app

from sqlalchemy.pool import StaticPool

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=engine)


def _override():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override
client = TestClient(app)


def test_health():
    assert client.get("/api/health").json()["status"] == "ok"


def test_register_login_and_project_crud():
    r = client.post("/api/auth/register", json={"name": "T", "email": "t@ecoatlas.earth", "password": "pass1234"})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    h = {"Authorization": f"Bearer {token}"}
    p = client.post("/api/projects", json={"name": "Demo P", "project_type": "Carbon",
                                           "location_label": "Karnataka"}, headers=h)
    assert p.status_code == 201, p.text
    pid = p.json()["id"]
    geom = {"type": "Polygon", "coordinates": [[[77.5, 12.9], [77.6, 12.9], [77.6, 13.0], [77.5, 13.0], [77.5, 12.9]]]}
    s = client.post("/api/sites", json={"project_id": pid, "name": "S-01", "geometry": geom}, headers=h)
    assert s.status_code == 201, s.text
    assert s.json()["area_ha"] > 0
    stats = client.get("/api/dashboard/stats", headers=h)
    assert stats.json()["total_projects"] >= 1
