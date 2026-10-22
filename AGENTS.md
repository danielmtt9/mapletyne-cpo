# Project Agent Instructions & Operational Rules

## 1. Project Overview & Identity
- **Repository:** `mapletynecpo` (Mapletyne MTT Charge CPO Enterprise Platform)
- **Architecture:** Multi-Service CSMS & E-Mobility Platform (`mapletyne-core` Python 3.12+ FastAPI / OCPP 1.6-J & 2.0.1 / ISO 15118-20 CSMS Engine on ports `34800`/`34100`/`34201`; `mapletyne-admin` React 18 + TypeScript + Vite + Tailwind CSS Operator Mission Control on port `34000`; `mapletyne-chargeapp` FastAPI + Jinja2 + HTMX Driver Mobile PWA on port `34003`; `keycloak` 26 OIDC/RS256 IAM; PostgreSQL 16 + Redis 7).
- **Primary Language:** TypeScript 5.x (Strict Mode) / Python 3.12+
- **Brand & Design System SSOT:** Forest Emerald Material Design 3 (`#006948` seed, `#10B981` / `#48E260` semantic highlights), Dual-Adaptive theme (`#F8FAFC` Light Mode operator default with Dark Mode toggle; `#0B0F19` Dark-Mode-First driver mobile PWA), strict 4px/8px spatial grid, $\ge 12\text{px}$ typography floor (`text-xs`), and $\ge 44\times 44\text{px}$ Fitts's Law interactive hit targets.
- **Penpot Visual SSOT:**
  - **Project ID:** `b0861d9d-6919-8015-8008-d26610b454c5` ("Mapletyne CPO Enterprise")
  - **File ID:** `b0861d9d-6919-8015-8008-d266309e53fd` ("Design System & Responsive Artboards")
  - **Page ID:** `b0861d9d-6919-8015-8008-d266309e53fe` (12 verified artboards: 8 Driver Mobile PWA screens + 4 Operator Mission Control screens, 561 layers, 99.8% `penpot-verify` score, `revn = 1838`)
  - **Workspace URL:** `http://localhost:15050/#/workspace?project-id=b0861d9d-6919-8015-8008-d26610b454c5&file-id=b0861d9d-6919-8015-8008-d266309e53fd&page-id=b0861d9d-6919-8015-8008-d266309e53fe`

## 2. Tool & Execution Boundaries
- **Iconography SSOT:** Strictly and exclusively Google Material Symbols (`material-symbols-outlined`). NEVER import Lucide, FontAwesome, Feather, or Heroicons.
- **Type Safety & OpenAPI Pipeline:** In `mapletyne-admin`, all REST API payloads and schemas must derive from `mapletyne-core`'s `/openapi.json` via `openapi-typescript` (`npm run codegen`). Hand-written API payload interfaces and `any` types are strictly prohibited.
- **Real-Time State Synchronization:** Use Server-Sent Events (`/api/v1/events/stream`) to trigger targeted TanStack Query cache invalidations (`queryClient.invalidateQueries`) on `StatusNotification` and `MeterValues` events. Never use high-frequency HTTP polling intervals (`refetchInterval`) for live charger telemetry.
- **High-Density Data Ledgers:** Any table exceeding 100 rows (Sessions & CDRs, Meter Telemetry, OCPP Event Logs) must render using `@tanstack/react-virtual` locked at a 40px row height to preserve 60 FPS scrolling.
- **Package Manager:** Prefer `pnpm` / `npm` for frontend workspaces and `pip` / `uv` in isolated virtual environments or Docker containers for Python services. Never run global host installs.
- **Git Hygiene:** Never commit directly to `main`. Work on isolated vertical feature branches (`feat/STORY-XX`).

## 3. Autonomous Execution Rules
- Maintain single-responsibility vertical slices spanning database, FastAPI endpoint, SSE event publication, and UI presentation.
- Do not remove existing comments, docstrings, or automated tests without explicit authorization.
- Always consult `docs/project/ACTIVE_CONTEXT.md` first when starting a session to restore current sprint state, port mappings, and active tasks, and cross-reference `docs/ARCHITECTURE-SPINE.md` and `docs/architecture/DECISION_RECORDS.md` for immutable architectural decisions (`AD-1` through `AD-12`).
