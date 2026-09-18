# EcoAtlas.Earth — Geospatial Carbon & Biodiversity Intelligence

Premium climate-tech SaaS for managing carbon & biodiversity projects: draw site polygons on Mapbox, store them as PostGIS geometry, explore them spatially, and track carbon / vegetation / biodiversity trends.

> **Demo data notice:** all seeded metrics and charts are **sample/demo values** for evaluation — not real-world measurements.

## Features
- JWT auth (register / login / me), protected routes, hashed passwords
- Dashboard with animated KPIs, sparklines, live Mapbox polygons, portfolio chart
- Projects CRUD + search/filter, project intelligence (summary, performance chart, site map)
- Multi-step Create Project with polygon drawing + automatic area calculation
- Add Site with Mapbox Draw (polygon / edit / delete / reset), area · perimeter · centroid auto-computed
- Site analytics (4 KPI cards, carbon + vegetation/biodiversity time series, satellite boundary + Fit to Site)
- Map Explorer with status filters, style switcher, hover tooltips, click-to-open animated site drawer
- ⌘K/Ctrl-K global search, notifications panel, light/dark mode (remembered), responsive sidebar + mobile bottom nav
- Empty / loading / error states, toasts via inline alerts, accessible labels & focus states

## Architecture
```
frontend/ (React+TS+Vite+Tailwind+Mapbox GL+Draw+Chart.js+Router+Lucide+Framer Motion)
backend/  (FastAPI REST + JWT + SQLAlchemy; Postgres/PostGIS in prod, JSON-geometry compatible)
backend/app/schema_postgis.sql  (PostGIS DDL incl. sites.geom GEOMETRY(Polygon,4326) + GIST index)
```

## Frontend stack
React 18 · TypeScript · Vite · Tailwind · Mapbox GL JS · @mapbox/mapbox-gl-draw · Chart.js + react-chartjs-2 · React Router 6 · Lucide · Framer Motion.

## Backend stack
Python · FastAPI · SQLAlchemy · GeoAlchemy2/Shapely (geometry validation) · PyJWT · Passlib/bcrypt · pydantic-settings.

## Database schema (PostGIS)
- `users(id, name, email UNIQUE, password_hash, role, created_at)`
- `projects(id, name, description, project_type, status, location_label, image, owner_id→users, start_date, end_date, created_at, updated_at)`
- `sites(id, project_id→projects, name, description, site_type, status, area_ha, perimeter_km, centroid_lat/lng, geometry_geojson JSONB, geom GEOMETRY(Polygon,4326), carbon_estimate, biodiversity_score, vegetation_index, coverage_pct, timestamps)` + GIST index on `geom`
- `site_analytics(id, site_id→sites, month YYYY-MM, carbon, vegetation, biodiversity, area_monitored)`
- `notifications(id, user_id→users, title, message, kind, read, created_at)`
PostGIS: polygons sent as GeoJSON from Mapbox Draw are validated, metrics computed server-side (`core/geo.py`), and synced with `ST_SetSRID(ST_GeomFromGeoJSON(...),4326)`; spatial queries (e.g. `ST_Area(geom::geography)`, `ST_Contains`) can replace the JSON columns without API changes.

## API documentation
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | no | Register → `{access_token, user}` |
| POST | /api/auth/login | no | Login → `{access_token, user}` |
| GET | /api/auth/me | JWT | Current user |
| GET | /api/projects?search&status | JWT | List projects (aggregated) |
| POST | /api/projects | JWT | Create project |
| GET/PUT/DELETE | /api/projects/{id} | JWT | Details (+sites, performance) / update / delete |
| GET | /api/sites?project_id&search | JWT | List sites (GeoJSON included) |
| POST | /api/sites | JWT | Create site from GeoJSON Polygon (validates, computes metrics, seeds 12-mo analytics) |
| GET/PUT/DELETE | /api/sites/{id} | JWT | Get / update / delete |
| GET | /api/sites/{id}/analytics | JWT | Site KPIs + monthly series |
| GET | /api/dashboard/stats | JWT | KPIs + trends + sparklines |
| GET | /api/notifications | JWT | Notifications |
| GET | /api/search?q= | JWT | Global search |
| GET | /api/health | no | Health check |

## Authentication flow
Register/Login → bcrypt verify → `create_access_token(sub=user.id)` (PyJWT, HS256, 24h) → client stores token in `localStorage`, sends `Authorization: Bearer …` → `get_current_user_id` dependency guards routes → 401 clears token & redirects to /login.

## Local setup
### 1) Database (PostGIS)
```bash
createdb ecoatlas
psql ecoatlas -c "CREATE EXTENSION postgis;"
psql ecoatlas -f backend/app/schema_postgis.sql
```
### 2) Backend
```bash
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env
python -m app.seed            # seeds 8 projects, ~60 sites, demo admin
uvicorn app.main:app --reload --port 8000
```
Docs: http://localhost:8000/docs
### 3) Frontend
```bash
cd frontend
copy .env.example .env        # set VITE_MAPBOX_TOKEN (https://account.mapbox.com)
npm install
npm run dev                   # http://localhost:5173
```
### 4) Full flow to test
Register → Login → Dashboard → Projects → Project → Add Site → draw polygon → Save Site → Map → click polygon → Analytics.

## Environment variables
Frontend (`frontend/.env`): `VITE_API_URL`, `VITE_MAPBOX_TOKEN`. Backend (`backend/.env`): `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`. Never commit real secrets; `.env.example` files provided.

## Mapbox setup
1. Create a free token at https://account.mapbox.com (public `pk.` token is enough).
2. Put it in `frontend/.env` as `VITE_MAPBOX_TOKEN=pk.…`, restart `npm run dev`.
3. Without a token the app shows a setup notice instead of crashing.

## Testing
```bash
python -m pytest backend/test_api.py -q   # register→login→project→site→stats
cd frontend && npm run build
```

## CI/CD
`.github/workflows/ci.yml` installs backend deps + runs pytest, installs frontend + builds. Husky + lint-staged + Prettier/ESLint configured.

## Demo credentials
`admin@ecoatlas.earth` / `EcoAtlas123!` (after seeding).

## Known limitations
- SQLite fallback (used in tests) stores geometry as JSON; area functions use equirectangular approximation (PostGIS `ST_Area(geography)` is exact in prod).
- Charts use generated demo series; no live satellite ingestion.
- Token refresh rotation not implemented (24h access tokens).

## Future improvements
- Org roles + project_members table wiring, S3 image uploads, ST_Within radius search, NDVI tile ingestion, offline map packs, audit logs.
