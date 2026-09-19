from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import Base, engine
from .routers import auth, platform, projects, sites

app = FastAPI(title="EcoAtlas.Earth API", version="1.0.0",
              description="Geospatial carbon & biodiversity intelligence API (PostGIS + JWT)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(sites.router)
app.include_router(platform.router)


@app.on_event("startup")
def _startup():
    try:
        Base.metadata.create_all(bind=engine)
        # Auto-seed demo data on first run (fresh Render/Sqlite DB is empty)
        from sqlalchemy import inspect
        from sqlalchemy.orm import Session
        from .core.database import SessionLocal
        from .models import Project
        try:
            # Only seed if projects table is empty
            db = SessionLocal()
            if db.query(Project).count() == 0:
                db.close()
                from .seed import seed
                seed()
            else:
                db.close()
        except Exception as se:
            print(f"Seed check skipped: {se}")
    except Exception as e:
        print(f"DB init warning: {e}")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "ecoatlas-api"}


@app.get("/")
def root():
    return {"service": "EcoAtlas.Earth API", "docs": "/docs", "health": "/api/health"}
