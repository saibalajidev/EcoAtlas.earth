from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

from .config import settings


def _make_engine():
    url = settings.DATABASE_URL
    if url.startswith("sqlite"):
        # File DB -> one connection per thread is fine; :memory: must share
        # a single connection (StaticPool) or tables vanish between sessions.
        if ":memory:" in url or url == "sqlite://":
            return create_engine("sqlite://", connect_args={"check_same_thread": False},
                                 poolclass=StaticPool)
        return create_engine(url, connect_args={"check_same_thread": False})
    try:
        return create_engine(url, pool_pre_ping=True)
    except ModuleNotFoundError:
        # Env without postgres driver -> shared in-memory sqlite fallback
        return create_engine("sqlite://", connect_args={"check_same_thread": False},
                             poolclass=StaticPool)


engine = _make_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
