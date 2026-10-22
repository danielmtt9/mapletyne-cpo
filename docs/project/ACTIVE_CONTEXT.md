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
- [x] **STORY-00-SCAFFOLD & M3-TOKENS:** Generated M3 Forest Emerald `#006948` token artifacts (`m3-tokens.css`, `tailwind.m3-preset.js`, `m3-tokens.json`).
- [x] **STORY-01-PENPOT-DUAL-GATE:** Built and verified all 12 Penpot artboards (8 Driver Mobile PWA + 4 Operator Mission Control, 561 layers, `revn = 1838`) achieving a **99.8%** `penpot-verify` score.
- [x] **STORY-02-PRODUCT-GOVERNANCE-SSOT:** Populated enterprise Product Discovery, PRD, App Flow, Telemetry, Notifications, Agent Rules, and Sprint Implementation Plan with zero template placeholders.
