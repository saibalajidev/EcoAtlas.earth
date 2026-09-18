"""PostGIS DDL applied when running on PostgreSQL. SQLite fallback uses JSON geometry."""

POSTGIS_DDL = """
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(120) DEFAULT 'Admin',
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  project_type VARCHAR(64) DEFAULT 'Carbon',
  status VARCHAR(32) DEFAULT 'Active',
  location_label VARCHAR(255) DEFAULT '',
  image VARCHAR(512) DEFAULT '',
  owner_id VARCHAR(36) REFERENCES users(id),
  start_date VARCHAR(32) DEFAULT '',
  end_date VARCHAR(32) DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sites (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  site_type VARCHAR(64) DEFAULT 'Restoration',
  status VARCHAR(32) DEFAULT 'Active',
  area_ha DOUBLE PRECISION DEFAULT 0,
  perimeter_km DOUBLE PRECISION DEFAULT 0,
  centroid_lat DOUBLE PRECISION DEFAULT 0,
  centroid_lng DOUBLE PRECISION DEFAULT 0,
  geometry_geojson JSONB DEFAULT '{}'::jsonb,
  geom GEOMETRY(Polygon, 4326),
  carbon_estimate DOUBLE PRECISION DEFAULT 0,
  biodiversity_score DOUBLE PRECISION DEFAULT 0,
  vegetation_index DOUBLE PRECISION DEFAULT 0,
  coverage_pct DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sites_geom ON sites USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_sites_project ON sites (project_id);

CREATE TABLE IF NOT EXISTS site_analytics (
  id VARCHAR(36) PRIMARY KEY,
  site_id VARCHAR(36) REFERENCES sites(id) ON DELETE CASCADE,
  month VARCHAR(16) NOT NULL,
  carbon DOUBLE PRECISION DEFAULT 0,
  vegetation DOUBLE PRECISION DEFAULT 0,
  biodiversity DOUBLE PRECISION DEFAULT 0,
  area_monitored DOUBLE PRECISION DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_analytics_site ON site_analytics (site_id);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  message TEXT DEFAULT '',
  kind VARCHAR(32) DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) REFERENCES projects(id) ON DELETE CASCADE,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(32) DEFAULT 'viewer',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_members_project ON project_members (project_id);
"""
