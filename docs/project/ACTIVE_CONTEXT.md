<!--
<agent-discovery-protocol>
ROLE: Scrum Master (bmm-sm)
CO-PILOT: Atlas (evs-coordinator), Pax (evs-agent-ocpp), Sally (bmm-ux-designer), Winston (bmm-architect)
PHASE: Phase 3 (Visual UI Drafting & Verification Gate)

MAINTENANCE PROTOCOL:
- Update this file immediately after completing any phase transition, story dispatch, or test run.
- Keep total file length under 1,500 tokens using the rolling sprint window schema below.
- On sprint completion in Phase 5, archive this file to `docs/project/history/SPRINT_<ID>_SUMMARY.md` before resetting.

INVARIANT: When any agent wakes up or begins a new chat session, it MUST read this file FIRST to restore active project memory without repeating work.
</agent-discovery-protocol>
-->

# Active Sprint & Agent Working Memory

## 1. Active Sprint Objectives & Active Story Focus
- **Current Sprint:** `SPRINT-01` (Enterprise CPO Alignment, M3 Forest Emerald `#006948` SSOT & Vertical Feature Execution)
- **Active Story:** `STORY-02-PRODUCT-GOVERNANCE-SSOT` (Production-Grade Product, Architecture & Sprint Governance Specification Alignment)
- **Responsible Personas:**
  - **John** (`bmm-pm`) & **Mary** (`bmm-analyst`): Product Discovery, PRD, Telemetry, Notifications, and Sprint Governance SSOT.
  - **Atlas** (`evs-coordinator`) & **Pax** (`evs-agent-ocpp`): Multi-tenant CSMS (`mapletyne-core`) & OCPP 1.6-J / 2.0.1 / ISO 15118-20 specs.
  - **Miles** (`evs-agent-ev`) & **Volt** (`evs-agent-electrical`): Depot fleet scheduling, EMS solar/BESS/grid gauges, and power headroom.
  - **Flex** (`evs-agent-flexibility`): ENTSO-E Day-Ahead "What-If" Tariff Simulator & dynamic `SetChargingProfile` curtailment.
  - **Sally** (`bmm-ux-designer`): Forest Emerald M3 Design System, 12 verified Penpot artboards, and Google Material Symbols SSOT.
  - **Winston** (`bmm-architect`): Headless OpenAPI + SSE system topology, Keycloak 26 OIDC/RS256 IAM, and threat model.
  - **Murat** (`bmm-tea`): 3-Way QA Quality Gate (Functional E2E, UI/UX Visual Parity, Shift-Left Security).

## 2. Runtime Topology Ports & Penpot Visual SSOT
- **Runtime Service Ports:**
  - `mapletyne-admin`: `34000` (internal `8080`) — React 18 + TypeScript + Vite + Tailwind CSS + TanStack Query/Virtual Operator Mission Control
  - `mapletyne-chargeapp`: `34003` (internal `8003`) — FastAPI + Jinja2 + HTMX Dark-Mode-First Driver Mobile PWA
  - `mapletyne-core`: `34800` (OpenAPI 3.0 REST & `/api/v1/events/stream` SSE), `34100` (OCPP 1.6-J WSS), `34201` (OCPP 2.0.1 / ISO 15118-20 WSS)
  - `keycloak`: `34080` (`/auth/` OIDC RS256 IAM, Realm `opencpo`)
  - `penpot`: `15050` (Web UI), `8787` (FastMCP Backend)
- **Penpot Visual SSOT (Verified):**
  - **Project ID:** `b0861d9d-6919-8015-8008-d26610b454c5` ("Mapletyne CPO Enterprise")
  - **File ID:** `b0861d9d-6919-8015-8008-d266309e53fd` ("Design System & Responsive Artboards")
  - **Page ID:** `b0861d9d-6919-8015-8008-d266309e53fe` (12 verified artboards: 8 Driver Mobile PWA screens `390x844` + 4 Operator Mission Control screens `1440x900`, `561` layers, `revn = 1838`)
  - **Workspace URL:** `http://localhost:15050/#/workspace?project-id=b0861d9d-6919-8015-8008-d26610b454c5&file-id=b0861d9d-6919-8015-8008-d266309e53fd&page-id=b0861d9d-6919-8015-8008-d266309e53fe`
  - **Automated Critic Score:** **99.8%** (`penpot-verify` PASSED across all 12 artboards)

## 3. Immutable Architectural Decisions (ADR Ledger)
- **ADR-001 (Design System SSOT):** Google Material Design 3 (M3) rooted in Forest Emerald `#006948` (`#10B981` / `#48E260` semantic highlights) with dynamic `:root` CSS Custom Property white-label overrides (`AD-7`, `AD-9`).
- **ADR-002 (Iconography):** Strictly and exclusively Google Material Symbols (`material-symbols-outlined`). Never import Lucide, FontAwesome, Feather, or Heroicons.
- **ADR-003 (Typography & Ergonomics):** Strict `4px`/`8px` grid, $\ge 12\text{px}$ typography floor (`text-xs`), $\ge 44\times 44\text{px}$ touch targets (Fitts's Law), and fixed `40px` virtualized table rows (`AD-6`).
- **ADR-004 (Dual-Adaptive Theme):** Operator Mission Control (`mapletyne-admin`) defaults to `#F8FAFC` Light Mode (with Dark toggle); Driver Mobile PWA (`mapletyne-chargeapp`) is Dark-Mode-First (`#0B0F19` canvas).
- **ADR-005 (Headless OpenAPI + SSE & Keycloak 26 IAM):** 100% `openapi-typescript` generated types (`AD-2`), SSE cache invalidation over `/api/v1/events/stream` (`AD-3`), `<250ms` optimistic remote commands (`AD-8`), Keycloak 26 RS256 Direct Grant auth (`AD-11`), and Redis 6-digit email OTP self-registration (`AD-12`).

## 4. Rolling Recent Activity (Last 3 Completed Milestones)
- [x] **STORY-03-THEME-AND-AUTH-REMEDIATION:** Resolved inline style collisions and dark branding override in `mapletyne-admin` ThemeProvider, updated database branding seed to M3 Forest Emerald, purged hardcoded dark classes across admin drawers and pages, added `.light` tokens to all `mapletyne-chargeapp` skins, and resolved Keycloak 26 Direct Grant auth and token synchronization.
- [x] **STORY-04-SECURITY-HARDENING-AND-DUAL-MODE:** Hardened backend-frontend channels to enterprise standards. Fixed unsigned Stripe webhook forgery, added `management_auth` to `/api/payments/webhook`, eliminated Driver PWA Confused Deputy IDOR on session commands via session cookie ownership validation, restricted connector solenoid unlock with `require_site_operator`, protected telemetry and event streams, prevented PostgreSQL connection pool RLS context bleeding, and eliminated wildcard CORS tunnel exposure.
- [x] **STORY-05-HEALTHCHECK-SECURITY-REMEDIATION:** Triaged and resolved all 39 findings from the automated Health Check scan. Identified and preserved 25 router-level false positives and 6 regulatory guest flows (EU AFIR / OCPI 2.2.1 discovery). Surgically patched the 4 genuine security vulnerabilities: locked down Setup Wizard (`admin_setup.py`) with `require_admin` post-install and 403 upon setup completion, enforced mutual `TOKEN_A` registration authentication on OCPI handshake (`ocpi/credentials.py`), protected public session controls (`/cancel`, `/unlock`, `/soc-params`) with `management_auth` and guarded direct connector unlock on `chargeapp` with session ownership verification, and enforced session ownership and `management_auth` on Web Push subscribe/unsubscribe (`push.py`). Fixed `SettingsPage.tsx` localhost default to `window.location.origin`, integrated `DashboardSkeleton` as initial loading state in `DashboardPage.tsx`, and registered `tailwind.m3-preset.js` in Tailwind presets. Admin build passed with 0 errors.
