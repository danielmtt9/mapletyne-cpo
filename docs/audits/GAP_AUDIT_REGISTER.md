# Mapletyne MTT Charge CPO Platform — Comprehensive Platform Gap Audit & Risk Register

```yaml
title: Mapletyne MTT Charge CPO Platform Comprehensive Gap Audit & Risk Register
document_type: Platform Architecture & Security Audit Register
version: 1.0.0
date: 2026-10-22
classification: Confidential — Internal Engineering & Security Audit
status: Published / Actionable
scope: mapletyne-core, mapletyne-admin, mapletyne-chargeapp, ingress (Nginx), Keycloak 26 IAM, DevOps / Infrastructure
auditing_team: Teamwork Preview Squad (Explorer Survey 1, 2, 3 & Audit Register Lead)
governing_standards:
  - AGENTS.md (Project Agent Instructions & Operational Invariants)
  - docs/ARCHITECTURE-SPINE.md (Architectural Decisions AD-1 through AD-12)
  - docs/architecture/DECISION_RECORDS.md (ADR-001 through ADR-010)
  - docs/security/APP_SECURITY.md (OWASP ASVS v4.0.3 L2/L3 & NIST SP 800-63B)
  - docs/ops/RELIABILITY.md (Google SRE, UK PCPR 2023 99% Reliability & AFIR)
```

---

## 1. Executive Summary & Audit Scorecard

### 1.1 Platform Context & Scope
The **Mapletyne MTT Charge CPO Enterprise Platform** is a mission-critical multi-service electric vehicle charge point operator (CPO) and depot management suite. The platform architecture comprises:
1. **Core CSMS Engine (`mapletyne-core`)**: Python 3.12+ FastAPI backend implementing OCPP 1.6-J (`:34100`) and OCPP 2.0.1 (`:34201`) stateful WebSocket servers, REST API engine (`:34800`), Redis 7 event bus, asyncpg connection pooling, and ISO 15118-20 V2G/PnC PKI hooks.
2. **Operator Mission Control (`mapletyne-admin`)**: Single Page Application (SPA) built with React 18, TypeScript 5, Vite, Tailwind CSS, TanStack Query v5, and Recharts/ECharts (`:34000`), designed around an industrial 0px SCADA geometry and Google Material Design 3 tokens (`#006948` Forest Emerald).
3. **Driver Mobile PWA (`mapletyne-chargeapp`)**: Mobile-first progressive web application built with FastAPI, Jinja2, HTMX, Leaflet, and HTML5 QR scanner (`:34003`), providing driver ad-hoc payment, live charging telemetry, and digital receipts.
4. **Identity & Access Management (`keycloak`)**: Keycloak 26 OIDC/RS256 IAM provider on port `:34085`.
5. **Edge Ingress Gateway (`nginx`)**: Reverse proxy gateway on port `:34080`.

This comprehensive audit was commissioned to establish the definitive, code-verified operational status of every route, service boundary, security control, data flow, and operational configuration across the entire platform repository.

### 1.2 Audit Methodology & Integrity Stance
The audit was conducted strictly under **read-only conditions**, preserving zero modifications to existing application source code (`git status` clean outside `docs/audits/`). Findings were compiled through direct static code analysis, abstract syntax tree inspection, filesystem audits, container configuration reviews, and network probe executions against running microservices. Every reported gap includes exact file and line citations, root cause mechanics, business and operational impacts, concrete architectural remediation guidance, and reproduction commands.

### 1.3 High-Level Metrics & Severity Distribution
A total of **44 distinct platform gaps** were identified, categorized across 6 operational areas and prioritized by severity:

| Severity Level | Definition | Finding Count |
| :--- | :--- | :---: |
| **CRITICAL** | Severe vulnerability enabling arbitrary system compromise, unauthorized database drop, remote code execution, unauthenticated charger shutdown, or immediate runtime application crash. | **9** |
| **HIGH** | Significant breach of architectural invariants, disabled cryptographic validations, missing multi-tenant RLS, absent TLS/mTLS, unvirtualized high-density DOM, or 0% backend test coverage. | **17** |
| **MEDIUM** | Inefficient polling architectures, hardcoded fallback configurations, legacy branding/locale remnants, unhandled boundary errors, or missing request correlation tracking. | **13** |
| **LOW** | Minor interactive hit-target violations (< 44px), deprecated installation script loops, or unpinned dependencies. | **5** |
| **TOTAL** | **Consolidated Master Findings** | **44** |

```
Severity Distribution:
  CRITICAL: [█████████                     ] 9  (20.5%)
  HIGH:     [█████████████████             ] 17 (38.6%)
  MEDIUM:   [█████████████                 ] 13 (29.5%)
  LOW:      [█████                         ] 5  (11.4%)
```

### 1.4 Architecture Compliance Scorecard
The platform was evaluated against the immutable Architectural Decisions (`AD-1` to `AD-12`) and Architectural Decision Records (`ADR-001` to `ADR-010`):

| Invariant / Decision | Specification & Target | Audit Status | Key Compliance Failure |
| :--- | :--- | :---: | :--- |
| **`AD-1` / `ADR-001`** | Single-domain reverse proxy; all internal ports isolated behind Nginx gateway. | **NON-COMPLIANT** | All microservice ports (`34800`, `34100`, `34201`, `34000`, `34003`, `34085`) bound directly to `0.0.0.0` on host interface. |
| **`AD-2` / `ADR-010`** | Strict OpenAPI compilation via `openapi-typescript`; zero `any` types; all responses derive from Pydantic `response_model`. | **NON-COMPLIANT** | 35 of 37 FastAPI routers omit `response_model`, generating `unknown` OpenAPI types and forcing `any` casts in `mapletyne-admin`. |
| **`AD-3` / `ADR-005`** | SSE cache invalidation over client polling; zero `refetchInterval` on live charger/session data. | **NON-COMPLIANT** | 10 active polling hooks (`refetchInterval: 2000-15000ms`) in admin components, saturating DB and Redis connections. |
| **`AD-4`** | Static SPA bundle substrate over Node.js SSR container. | **COMPLIANT** | `mapletyne-admin` builds as a static bundle; Nginx serves static HTML/JS assets. |
| **`AD-5` / `ADR-002`** | Industrial 0px sharp geometry (`rounded-none`) and exclusive Google Material Symbols. | **PARTIALLY COMPLIANT** | Admin UI conforms cleanly; Driver ChargeApp leaks inline Lucide SVGs, unicode emojis, and blue `#2563eb` accents. |
| **`AD-6` / `ADR-002`** | High-density tables (>100 rows) virtualized via `@tanstack/react-virtual` at locked 40px row height. | **NON-COMPLIANT** | `@tanstack/react-virtual` is unused across all pages (`Chargers`, `Sessions`, `Fleet`, `Vehicles`), rendering unvirtualized DOM tables. |
| **`AD-7` / `AD-9`** | Dynamic CSS variable theming injected into `:root` without page reload. | **COMPLIANT** | `ThemeProvider` correctly binds CSS custom properties to document root. |
| **`AD-8`** | Optimistic UI feedback (<250ms) on remote charger operations (`RemoteStart`, `Stop`, `Unlock`). | **COMPLIANT** | Remote action buttons implement immediate loading spinners and toast notifications. |
| **`AD-10` / `ADR-009`** | Organization profile as single source of truth for legal, tax, and multi-currency CDR billing. | **NON-COMPLIANT** | CDR generation hardcodes `€0.35/kWh`, `21% VAT`, and `EUR` currency, ignoring configured site tariffs and UK GBP defaults. |
| **`AD-11` / `ADR-006`** | Keycloak 26 unified IAM with RS256 token verification, Direct Grants, and RBAC route guards. | **NON-COMPLIANT** | Keycloak token verification disables `verify_aud` and `verify_iss`; backdoor passwords bypass auth entirely; RBAC treats `"user"` as admin. |
| **`AD-12`** | 2-step registration with 6-digit email OTP (600s Redis TTL, 5-attempt brute-force lockout). | **PARTIALLY COMPLIANT** | Implemented in driver backend, but admin UI registration/profile remains a mocked stub. |
| **`ADR-003`** | Hybrid Multi-Tenancy: PostgreSQL Row-Level Security (RLS) and mandatory `tenant_id` columns. | **NON-COMPLIANT** | Neither RLS policies, session context variable injection, nor `tenant_id` columns exist in database schema. |
| **`ADR-004`** | TimescaleDB hypertables for high-frequency 3-phase meter values and continuous aggregation. | **NON-COMPLIANT** | `create_hypertable` commented out in `db/schema.sql`; meter values stored in unpartitioned standard PostgreSQL table. |
| **`ADR-007`** | Autonomous closed-loop EMS and two-tier self-healing charger watchdog. | **PARTIALLY COMPLIANT** | EMS throttling and watchdog logic present, but frontend displays static Sankey nodes and relies on 5s polling. |
| **`ADR-008`** | Built-in hierarchical ISO 15118-20 V2G PKI Authority & mTLS Security Profile 3. | **NON-COMPLIANT** | `mapletyne-core/iso15118/` is an empty 0-byte stub; PnC returns empty EXI; CA private keys stored unencrypted on disk. |

---

## 2. Per-Route Comprehensive Assessment

### 2.1 Operator Mission Control (`mapletyne-admin`) — 18 Routes

```
Route Inventory: mapletyne-admin (React 18 + TypeScript + Vite)
Total Registered Routes: 18
Operational Breakdown:
  - Fully Functional: 9 routes (/login, /chargers, /sessions, /tariffs, /fleet, /vehicles, /pki, /ems, /roaming)
  - Functional Config/404: 2 routes (/settings, *)
  - Partially Mocked / Fallbacks: 1 route (/)
  - Completely Mocked / Stubs: 3 routes (/profile, /onboarding, /terms)
  - Broken / Runtime Crash Hazard: 3 routes (/editor/:pageId, /posts, /pages/:slug)
```

#### 1. Route: `/login`
- **Component File:** `mapletyne-admin/src/pages/LoginPage.tsx`
- **Functional Status:** Functional Authentication Flow
- **Data Source & API Integration:** `POST /api/v1/auth/login` via `apiClient.ts`
- **UX & Accessibility:** High-contrast dark glassmorphic styling, standard form inputs with keyboard accessibility, proper password masking.
- **Design System & Tokens:** Uses Forest Emerald accents, Google Material Symbols (`material-symbols-outlined`), 0px geometry.
- **Gaps & Evidence:**
  - `LoginPage.tsx:41`: Hardcoded default developer email prefilled in initial state: `daniel.a@mapletynetechnologies.com`.
  - **Verdict:** FUNCTIONAL WITH MINOR GAP (Developer credential prefill must be removed before production).

#### 2. Route: `/` (Executive Depot Dashboard)
- **Component File:** `mapletyne-admin/src/pages/DashboardPage.tsx`
- **Functional Status:** PARTIAL MOCK / COMPROMISED DATA INTEGRITY
- **Data Source & API Integration:** `GET /api/v1/dashboard/stats`, `GET /api/v1/chargers/`
- **UX & Accessibility:** Responsive grid layout, KPI metric cards, Live Network Load chart, Apple HIG dual-activity rings.
- **Design System & Tokens:** Forest Emerald `#006948` primary accents, Google Material Symbols clean.
- **Gaps & Evidence:**
  - `DashboardPage.tsx:21`: Configured with prohibited high-frequency polling: `refetchInterval: 10000` (violates `AD-3` and `ADR-005`). Zero Server-Sent Events integration.
  - `DashboardPage.tsx:305-370`: Active Charging Sessions table is **100% hardcoded static HTML table rows** (e.g. "ABB Terra 184 — Port A", "London Heathrow Hub", "Audi e-tron GT", "148.2 kW", "215.0 kW"). Does NOT render real session data from the backend.
  - `DashboardPage.tsx:199-204`: Artificial fallback masking hides zero-states: `activeChargingCount || 8`, `stats?.total_kwh ?? 18400`, `stats?.green_energy_pct ?? 94.2`.
  - `DashboardPage.tsx:264, 268`: Battery Energy Storage System (BESS) temperature (`24°C`) and state of health (`98.4%`) are hardcoded text strings.
  - `DashboardPage.tsx:19`: Uses unvalidated generic `api.get<any>('/api/v1/dashboard/stats')`, violating `AD-2`.
  - **Verdict:** PARTIAL MOCK REQUIRING IMMEDIATE DATA WIRING.

#### 3. Route: `/chargers` (EVSE Fleet Management)
- **Component File:** `mapletyne-admin/src/pages/ChargersPage.tsx`
- **Functional Status:** Functional CRUD, Status Filtering, and Detail Drawer
- **Data Source & API Integration:** `GET /api/v1/chargers/`, `POST /api/v1/chargers/`, remote command endpoints (`/reset`, `/unlock`, `/start`, `/stop`)
- **UX & Accessibility:** Multi-connector drawers, status pill filters (Available, Charging, Faulted, Offline), search bar, optimistic action spinners.
- **Design System & Tokens:** Strict 0px industrial cards, Google Material Symbols throughout.
- **Gaps & Evidence:**
  - `ChargersPage.tsx:354-449`: Direct array mapping over `filteredChargers.map(...)` inside standard `<tbody>`. Comment on line 348 claims `Virtualization applied`, but `@tanstack/react-virtual` is completely unimported and unused, violating `AD-6` and `ADR-002`.
  - `ChargersPage.tsx:22`: `api.get<any[]>('/api/v1/chargers/')` bypasses OpenAPI types (`AD-2` violation).
  - Sub-component `ChargerTelemetryView.tsx:43, 50`: Polls telemetry every 2000ms (`refetchInterval: 2000`) and 3000ms (`refetchInterval: 3000`).
  - **Verdict:** FUNCTIONAL WITH ARCHITECTURAL VIOLATIONS (Missing virtualization and active polling).

#### 4. Route: `/sessions` (Charging Sessions & CDR Ledgers)
- **Component File:** `mapletyne-admin/src/pages/SessionsPage.tsx`
- **Functional Status:** Functional Session List & Detail Modal
- **Data Source & API Integration:** `GET /api/v1/sessions/`
- **UX & Accessibility:** Date range filters, CSV export trigger, session detail modal, revenue breakdown.
- **Design System & Tokens:** Google Material Symbols clean, 0px border geometry.
- **Gaps & Evidence:**
  - `SessionsPage.tsx:16`: Enforces prohibited polling: `refetchInterval: 15000` (violates `AD-3`).
  - `SessionsPage.tsx:242-286`: Standard `filteredSessions.map` without `@tanstack/react-virtual`. Row height is set to `h-12` (48px) rather than the mandatory locked 40px (`AD-6` violation).
  - `SessionsPage.tsx:14`: Bypasses generated types via `api.get<any[]>('/api/v1/sessions/')`.
  - Child chart `SessionChargingProfileChart.tsx:28-39`: Renders a synthetic mathematical charging curve formula rather than real meter value timeseries data.
  - **Verdict:** FUNCTIONAL WITH HIGH-SEVERITY PERFORMANCE & TELEMETRY GAPS.

#### 5. Route: `/tariffs` (Tariff & Dynamic Pricing Engine)
- **Component File:** `mapletyne-admin/src/pages/TariffsPage.tsx`
- **Functional Status:** FULLY FUNCTIONAL CRUD
- **Data Source & API Integration:** `GET /api/v1/tariffs/`, `POST`, `PUT`, `DELETE /api/v1/tariffs/{id}`
- **UX & Accessibility:** Modals for TOU rate bands, peak/off-peak pricing, currency formatters, clean form validation.
- **Design System & Tokens:** Strict 0px industrial cards, Forest Emerald highlights, Google Material Symbols exclusively.
- **Gaps & Evidence:**
  - **NO GAPS IDENTIFIED IN PAGE LOGIC.** Page handles real database models, validates pricing tiers, and respects currency symbols. Small dataset (~5-20 tariffs) justifies non-virtualized rendering.
  - **Verdict:** NO GAPS IDENTIFIED (Clean reference implementation).

#### 6. Routes: `/fleet` & `/rfid-fleet` (Depot Bays, Tokens & Gantt Schedule)
- **Component File:** `mapletyne-admin/src/pages/RfidFleetPage.tsx`
- **Functional Status:** Functional RFID Token & Fleet Management
- **Data Source & API Integration:** `GET /api/v1/rfid/tokens`, `POST /api/v1/rfid/tokens`, `GET /api/v1/fleet/depot-bays`
- **UX & Accessibility:** Interactive Gantt timeline, Depot Power Headroom chart, RFID token issuance/block/replace drawers.
- **Design System & Tokens:** Material Symbols clean, 0px border geometry.
- **Gaps & Evidence:**
  - `RfidFleetPage.tsx:389-501`: Direct `filteredTokens.map` renders unvirtualized rows in table view (`AD-6` violation).
  - `RfidFleetPage.tsx:24`: `api.get<any>` type bypass (`AD-2` violation).
  - **Verdict:** FUNCTIONAL WITH MISSING VIRTUALIZATION.

#### 7. Route: `/vehicles` (Fleet EV Telemetry & State of Charge)
- **Component File:** `mapletyne-admin/src/pages/VehiclesPage.tsx`
- **Functional Status:** Functional Telemetry & SoC Monitor
- **Data Source & API Integration:** `GET /api/v1/vehicles`, `GET /api/v1/vehicles/{vin}/telemetry`, `GET /api/v1/vehicles/{vin}/charge-sessions`
- **UX & Accessibility:** Vehicle telematics drawer, live SoC circular gauge, battery health cards, VIN search.
- **Design System & Tokens:** Material Symbols clean.
- **Gaps & Evidence:**
  - `VehiclesPage.tsx:52, 75, 82, 91`: Pervasive polling violations across 4 distinct hooks:
    - Line 52: `refetchInterval: 10000` (vehicles query)
    - Line 75: `refetchInterval: 5000` (selected vehicle telematics)
    - Line 82: `refetchInterval: 10000` (selected vehicle sessions)
    - Line 91: `refetchInterval: 5000` (telemetry history)
  - `VehiclesPage.tsx:370-450`: Unvirtualized vehicle list rendering (`AD-6` violation).
  - `VehiclesPage.tsx:50`: `api.get<any[]>` type bypass (`AD-2` violation).
  - **Verdict:** FUNCTIONAL WITH SEVERE POLLING CONGESTION.

#### 8. Routes: `/pki` & `/pki-vault` (ISO 15118 & OCPP 2.0.1 Certificate Authority)
- **Component File:** `mapletyne-admin/src/pages/PkiVaultPage.tsx`
- **Functional Status:** Functional Certificate Ledger & CSR Actions
- **Data Source & API Integration:** `GET /api/v1/pki/certificates`, `POST /api/v1/pki/certificates/revoke`
- **UX & Accessibility:** Certificate hierarchy tree, CSR submission modal, certificate download trigger.
- **Design System & Tokens:** Strict 0px industrial cards, Material Symbols clean.
- **Gaps & Evidence:**
  - `PkiVaultPage.tsx:161, 177, 193`: Hardcoded legacy branding: Certificate Authorities display as **"OpenCPO V2G Root CA"**, **"OpenCPO CPO Sub-CA"**, and **"OpenCPO MO Sub-CA"** instead of Mapletyne enterprise branding.
  - `PkiVaultPage.tsx:22`: `api.get<any>` type bypass (`AD-2` violation).
  - **Verdict:** FUNCTIONAL WITH BRANDING & TYPING GAPS.

#### 9. Route: `/ems` (Energy Management & Smart Charging Dispatcher)
- **Component File:** `mapletyne-admin/src/pages/EmsPage.tsx`
- **Functional Status:** Functional Smart Charging Dispatcher & Guardrails
- **Data Source & API Integration:** `GET /api/v1/ems/status`, `GET /api/v1/chargers/`, `POST /api/v1/ems/override`
- **UX & Accessibility:** Peak shaving guardrails, station throttling table, battery SoC gauge, site energy balance chart.
- **Design System & Tokens:** Material Symbols clean, 0px geometry.
- **Gaps & Evidence:**
  - `EmsPage.tsx:21`: Polling violation: `refetchInterval: 5000` (`AD-3` violation).
  - `SiteStationThrottlingTable.tsx:18`: Second polling hook with `refetchInterval: 5000`.
  - `EmsSiteFlowSankey.tsx`: Visual nodes are static representations rather than a dynamic interactive SVG/Canvas Sankey layout.
  - `EmsPage.tsx:19`: `api.get<any>` type bypass (`AD-2` violation).
  - **Verdict:** FUNCTIONAL WITH POLLING & SANKEY FIDELITY GAPS.

#### 10. Route: `/roaming` (OCPI 2.2.1 Hub & Roaming Partners)
- **Component File:** `mapletyne-admin/src/pages/RoamingPage.tsx`
- **Functional Status:** Functional OCPI Partner & Credentials View
- **Data Source & API Integration:** `GET /api/v1/ocpi/cpo/versions`, `POST /api/v1/ocpi/cpo/2.2/credentials`
- **UX & Accessibility:** Partner status cards, credentials registration drawer, roaming CDR statistics.
- **Design System & Tokens:** Material Symbols clean.
- **Gaps & Evidence:**
  - `RoamingPage.tsx:174`: Hardcoded fallback roaming node identifier defaults to Dutch identifier **`NL*OCP`** instead of Mapletyne's UK identifier **`GB*MTT`**.
  - `RoamingPage.tsx:16`: `api.get<any>` type bypass (`AD-2` violation).
  - **Verdict:** FUNCTIONAL WITH REGIONAL BRANDING GAP.

#### 11. Routes: `/settings` & `/settings/branding` (CPO System Configuration)
- **Component File:** `mapletyne-admin/src/pages/SettingsPage.tsx`
- **Functional Status:** Functional System & Branding Configuration Form
- **Data Source & API Integration:** `GET /api/v1/settings/cpo`, `PUT /api/v1/settings/cpo`
- **UX & Accessibility:** Form tabs, theme preview picker, SMTP test button, logo upload trigger.
- **Design System & Tokens:** Material Symbols clean.
- **Gaps & Evidence:**
  - `SettingsPage.tsx:84, 88`: Default regional settings fallback to Country Code `US`, Party ID `CPO`, and base URL `http://localhost:8000` instead of `GB` and `MTT`.
  - `SettingsPage.tsx:22`: `api.get<any>` type bypass (`AD-2` violation).
  - **Verdict:** FUNCTIONAL WITH CONFIGURATION DEFAULTS GAP.

#### 12. Route: `/profile` (Operator Profile & IAM Settings)
- **Component File:** `mapletyne-admin/src/pages/ProfilePage.tsx`
- **Functional Status:** **COMPLETELY MOCKED STUB**
- **Data Source & API Integration:** ZERO API calls. No queries or mutations are invoked.
- **UX & Accessibility:** Realistic-looking form layout with operator identity, certificates, and RFID credentials.
- **Design System & Tokens:** Material Symbols clean, 0px geometry.
- **Gaps & Evidence:**
  - `ProfilePage.tsx:9-18`: Save profile handler executes a fake `setTimeout`:
    ```typescript
    const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }, 600);
    };
    ```
  - `ProfilePage.tsx:165`: Certificate renewal button executes raw browser alert:
    `onClick={() => alert('Certificate renewal initiated. Please check your secure email.')}`.
  - `ProfilePage.tsx:200`: RFID card registration button executes browser alert:
    `onClick={() => alert('Register new RFID card modal opened.')}`.
  - `ProfilePage.tsx:173-278`: Operator identity (`Elena Vance`, `elena.vance@mapletyne.internal`), client certificate serials, and corporate RFID tokens are completely static mock data.
  - **Verdict:** COMPLETE MOCK STUB REQUIRING REAL BACKEND INTEGRATION.

#### 13. Route: `/onboarding` (CPO Station Provisioning Wizard)
- **Component File:** `mapletyne-admin/src/pages/OnboardingPage.tsx`
- **Functional Status:** **MOCKED WIZARD / INCOMPLETE IMPLEMENTATION**
- **Data Source & API Integration:** ZERO API calls.
- **UX & Accessibility:** Stepper wizard UI indicating 4 steps, but only Step 2 contains form controls.
- **Design System & Tokens:** Material Symbols clean.
- **Gaps & Evidence:**
  - `OnboardingPage.tsx:13-20`: Station latency test is an unconditional fake timeout:
    ```typescript
    const handleTestConnection = () => {
      setIsTesting(true);
      setPingSuccess(null);
      setTimeout(() => {
        setIsTesting(false);
        setPingSuccess(true);
      }, 1200);
    };
    ```
  - `OnboardingPage.tsx:227`: Wizard completion triggers a browser alert:
    `onClick={() => { alert('Configuration saved! Navigating to Operator Dashboard.'); navigate('/'); }}`.
  - Steps 1 (Organization Details), 3 (Security & Certificates), and 4 (Tariff Binding) have no form implementations.
  - **Verdict:** INCOMPLETE MOCK REQUIRING FULL WIZARD IMPLEMENTATION.

#### 14. Route: `/terms` (Operator Terms of Service & Digital Signature)
- **Component File:** `mapletyne-admin/src/pages/TermsPage.tsx`
- **Functional Status:** **NON-PERSISTENT LOCAL STATE STUB**
- **Data Source & API Integration:** ZERO API calls.
- **UX & Accessibility:** Legal scrollable viewport with signature checkbox and action buttons.
- **Design System & Tokens:** Material Symbols clean.
- **Gaps & Evidence:**
  - `TermsPage.tsx:7-11`: Digital signature acceptance only updates local React state:
    ```typescript
    const handleSign = () => {
      setHasSigned(true);
      setSignedDate(new Date().toISOString());
    };
    ```
  - Refreshing the browser resets the signed state. No audit log entry or database persistence is executed.
  - `TermsPage.tsx:154`: Displays a hardcoded static hash: `SHA256:4f89a2b7...b201`.
  - **Verdict:** NON-PERSISTENT STUB REQUIRING BACKEND AUDIT INTEGRATION.

#### 15. Route: `/editor/:pageId` (Puck Visual Page Builder)
- **Component File:** `mapletyne-admin/src/pages/ReactPuckEditor.tsx`
- **Functional Status:** **CRASH HAZARD / MISSING BACKEND SERVICE**
- **Data Source & API Integration:** Calls `/api/cms/pages/${pageId}` and imports `payload.ts`.
- **UX & Accessibility:** Puck visual drag-and-drop editor canvas.
- **Design System & Tokens:** Custom Puck components.
- **Gaps & Evidence:**
  - `mapletyne-admin/src/lib/payload.ts:18`: Accesses Node.js global `process.env` in a Vite browser environment:
    ```typescript
    const serverURL = process.env.PAYLOAD_SERVER_URL || process.env.NEXT_PUBLIC_PAYLOAD_URL || 'http://localhost:3000';
    ```
    In standard Vite production builds, `process` is undefined, throwing `ReferenceError: process is not defined` and crashing the application.
  - `mapletyne-core` does NOT implement or expose any `/api/cms` endpoints; the visual editor cannot persist content.
  - **Verdict:** RUNTIME CRASH HAZARD & UNROUTED SERVICE.

#### 16. Routes: `/posts` & `/posts/:slug` (CMS Articles Ledger)
- **Component File:** `mapletyne-admin/src/pages/ReactPostsPages.tsx`
- **Functional Status:** **CRASH HAZARD / MISSING BACKEND SERVICE**
- **Data Source & API Integration:** Invokes `payload.find({ collection: 'posts' })` via `payload.ts`.
- **UX & Accessibility:** Standard grid of published articles and markdown renderer.
- **Gaps & Evidence:**
  - Same runtime crash hazard via `payload.ts:18` (`process.env`).
  - No CMS collection exists in `mapletyne-core`.
  - **Verdict:** RUNTIME CRASH HAZARD & UNROUTED SERVICE.

#### 17. Route: `/pages/:slug` (CMS Dynamic Render Engine)
- **Component File:** `mapletyne-admin/src/pages/ReactLivePage.tsx`
- **Functional Status:** **CRASH HAZARD / MISSING BACKEND SERVICE**
- **Data Source & API Integration:** Invokes `payload.find({ collection: 'pages' })` via `payload.ts`.
- **Gaps & Evidence:**
  - Same runtime crash hazard via `payload.ts:18` (`process.env`).
  - **Verdict:** RUNTIME CRASH HAZARD & UNROUTED SERVICE.

#### 18. Route: `*` (Universal 404 Catch-All)
- **Component File:** `mapletyne-admin/src/pages/NotFoundPage.tsx`
- **Functional Status:** FULLY FUNCTIONAL 404 CATCH-ALL
- **Data Source & API Integration:** None (Static routing fallback).
- **UX & Accessibility:** Clear error message, return to dashboard CTA button, high-contrast dark palette.
- **Design System & Tokens:** Strict 0px industrial geometry, Google Material Symbols (`arrow_back`, `warning`).
- **Gaps & Evidence:**
  - **NO GAPS IDENTIFIED.** Component handles unmatched routes cleanly and returns the operator to `/`.
  - **Verdict:** NO GAPS IDENTIFIED (Clean reference implementation).


---

### 2.2 Driver Mobile PWA (`mapletyne-chargeapp`) — 14 Routes & Static Endpoints

```
Route Inventory: mapletyne-chargeapp (FastAPI + Jinja2 + HTMX)
Total Registered Endpoints: 15 (14 User-Facing Routes + Static/PWA Handlers)
Operational Breakdown:
  - Fully Functional (Clean): 2 endpoints (/app/#scan, /app/session/{id})
  - Functional with Regional/Brand/Icon Gaps: 10 routes (/app/, /charge, /auth, /receipt, /qr, /account/login, /register, /profile, /history, /settings)
  - Functional with Design Token Violations: 2 routes (/cert-setup, /privacy)
  - Critical Runtime Crash: 1 endpoint block (/manifest.json, /sw.js, /skin/*)
```

#### 1. Route: `/app/` (Depot Map & Charger Search)
- **Component / Handler:** `mapletyne-chargeapp/routes/home.py` -> `templates/home.html`
- **Functional Status:** Functional Leaflet Map & Geolocation Search
- **Data Source & API Integration:** Calls `GET /api/chargers` via internal HTTP client
- **UX & Accessibility:** Interactive pan/zoom Leaflet map, charger status markers, search bar with autocomplete.
- **Design System & Tokens:** Dark canvas (`#0B0F19`), Forest Emerald highlights.
- **Gaps & Evidence:**
  - `templates/home.html:19-20`: Regional locale fallback defaults to Dutch (`nl` / 🇳🇱) if cookie is absent:
    ```html
    <button class="lang-btn {% if lang == 'nl' or not lang %}active{% endif %}" onclick="setLang('nl')">🇳🇱 NL</button>
    ```
    Should default to British English (`en` / 🇬🇧).
  - `templates/home.html:55`: Search clear button touch target is $28\times 28$px (`padding: 4px 6px`), violating Fitts's Law ($\ge 44\times 44$px floor).
  - `templates/base.html:47`: PWA install banner dismiss button is $18\times 18$px (`padding: 0 2px`, `font-size: 14px`), failing Fitts's Law.
  - **Verdict:** FUNCTIONAL WITH REGIONAL DEFAULTS & HIT-TARGET GAPS.

#### 2. Route: `/app/#scan` (Camera QR Code Scanner)
- **Component / Handler:** `mapletyne-chargeapp/templates/home.html` (embedded scanner modal)
- **Functional Status:** FULLY FUNCTIONAL QR SCANNER & MANUAL OVERRIDE
- **Data Source & API Integration:** HTML5 Camera API (`navigator.mediaDevices.getUserMedia`) and jsQR canvas detector.
- **UX & Accessibility:** Live animated laser line viewfinder, camera flip toggle, clean manual text input fallback (`#manual-cp-input`) for damaged stickers.
- **Design System & Tokens:** Google Material Symbols clean (`qr_code_scanner`, `close`, `flip_camera_android`).
- **Gaps & Evidence:**
  - **NO GAPS IDENTIFIED.** Touch targets on camera flip and close controls exceed $48\times 48$px. Viewfinder handles permissions denial gracefully.
  - **Verdict:** NO GAPS IDENTIFIED (Clean reference implementation).

#### 3. Route: `/app/charge/{cp_id}/{connector}` (Charger Detail & Session Initiation)
- **Component / Handler:** `mapletyne-chargeapp/routes/charge.py` -> `templates/charge.html`
- **Functional Status:** Functional Connector Details, Pricing & Session Start
- **Data Source & API Integration:** `GET /api/chargers/{cp_id}`
- **UX & Accessibility:** AC manual battery capacity slider (SoC estimator), 120-second cable insertion modal countdown, direct session initiation.
- **Design System & Tokens:** Dark canvas styling, but extensive foreign iconography.
- **Gaps & Evidence:**
  - `templates/charge.html:7, 35, 120-180`: Non-compliant iconography. Injects raw unicode emojis (`📍`, `⚡`, `●`, `🔌`, `💳`, `🔢`, `⚙️`) and inline SVG paths instead of exclusively using Google Material Symbols, violating `AGENTS.md` and `ADR-002`.
  - `templates/charge.html:35`: Favorite station toggle button hit area is $30\times 30$px (`padding: 4px`), failing Fitts's Law.
  - **Verdict:** FUNCTIONAL WITH ICONOGRAPHY & HIT-TARGET GAPS.

#### 4. Route: `/app/auth/{cp_id}/{connector}` (Ad-Hoc Driver Authentication & Checkout)
- **Component / Handler:** `mapletyne-chargeapp/routes/auth.py` -> `templates/auth.html`
- **Functional Status:** Functional OTP Flow & Guest Checkout
- **Data Source & API Integration:** `POST /app/api/auth/send-otp`, `POST /app/api/auth/verify-otp`, `POST /app/api/sessions/create`
- **UX & Accessibility:** 6-digit numeric input with auto-advance, 30s resend timer, redirect to Stripe checkout or active session.
- **Design System & Tokens:** Dark theme styling.
- **Gaps & Evidence:**
  - `templates/auth.html:29`: Phone country prefix dropdown places the Netherlands (`+31`) as the very first default option:
    ```html
    <option value="+31" selected>🇳🇱 +31 (Nederland)</option>
    <option value="+44">🇬🇧 +44 (UK)</option>
    ```
    Should default to United Kingdom (`+44`).
  - **Verdict:** FUNCTIONAL WITH REGIONAL PREFERENCE GAP.

#### 5. Route: `/app/session/{session_id}` (Active Charging Telemetry & Control)
- **Component / Handler:** `mapletyne-chargeapp/routes/session.py` -> `templates/session.html`
- **Functional Status:** FULLY FUNCTIONAL LIVE TELEMETRY & CONTROLS
- **Data Source & API Integration:** SSE Stream `EventSource('/api/v1/events/stream?session_id=' + SESSION_ID)` with automated HTTP polling fallback to `GET /app/api/sessions/{id}/poll` (`session.html:321-340`).
- **UX & Accessibility:** Apple HIG dual concentric SVG activity rings (animated `stroke-dashoffset`) tracking Battery SoC (%) and Delivered Energy (kWh), live power gauge (kW), cost counter, and emergency solenoid unlock button.
- **Design System & Tokens:** Dark canvas (`#0B0F19`), Forest Emerald highlights. Interactive hit targets all $\ge 48\times 48$px.
- **Gaps & Evidence:**
  - **NO GAPS IDENTIFIED IN CORE LOGIC.** Fully respects `AD-3` by consuming SSE stream for live telemetry with resilient polling fallback. Solenoid unlock modal includes confirmation guard.
  - *Note:* Minor icon styling embeds inline SVG icons at lines 8, 36, 148 which should be aligned with Material Symbols.
  - **Verdict:** NO GAPS IDENTIFIED IN TELEMETRY/STREAM LOGIC (Architecture-compliant).

#### 6. Route: `/app/receipt/{session_id}` (Digital Tax Invoice & PDF Download)
- **Component / Handler:** `mapletyne-chargeapp/routes/receipt.py` -> `templates/receipt.html`
- **Functional Status:** Functional Digital Receipt & PDF Generator
- **Data Source & API Integration:** `GET /app/api/sessions/{id}/receipt`, `GET /app/api/sessions/{id}/pdf`
- **UX & Accessibility:** VAT tax summary, tariff breakdown, environmental CO2 offset badge, share sheet trigger.
- **Design System & Tokens:** Dark theme styling.
- **Gaps & Evidence:**
  - `routes/receipt.py:43`: PDF attachment download filename is hardcoded with a Dutch word:
    ```python
    headers={"Content-Disposition": f'attachment; filename="laadbon-{session_id[:8]}.pdf"'}
    ```
    ("laadbon" is Dutch for charging receipt). Must be renamed to `receipt-{session_id[:8]}.pdf`.
  - **Verdict:** FUNCTIONAL WITH LOCALIZATION GAP.

#### 7. Route: `/app/qr/{token}` (NFC / QR Code Public Resolver)
- **Component / Handler:** `mapletyne-chargeapp/routes/qr.py`
- **Functional Status:** Functional 302 Redirect Handler
- **Data Source & API Integration:** `GET /api/v1/public/qr/{token}`
- **UX & Accessibility:** Seamless HTTP 302 redirection to `/app/charge/{cp_id}/{connector}` upon scanning.
- **Gaps & Evidence:**
  - `routes/qr.py:33`: On invalid or missing QR token, returns a raw JSON error with Dutch text:
    ```python
    return JSONResponse(status_code=404, content={"error": "not_found", "message": "QR-code niet gevonden"})
    ```
    Must return English: `"QR code not found"`.
  - **Verdict:** FUNCTIONAL WITH LOCALIZATION GAP.

#### 8. Route: `/app/cert-setup` (Plug & Charge Root CA Installation Wizard)
- **Component / Handler:** `mapletyne-chargeapp/routes/cert_setup.py` -> `templates/cert_setup.html`
- **Functional Status:** Functional 4-Step OS-Specific Certificate Setup Wizard
- **Data Source & API Integration:** `GET /api/cert-setup/root-ca`, `POST /api/cert-setup/issue`
- **UX & Accessibility:** Dynamic user-agent OS detection (iOS profile, Android CA, macOS keychain, Windows certmgr), step-by-step installation instructions.
- **Design System & Tokens:** **SEVERE DESIGN SYSTEM TOKEN VIOLATION.**
- **Gaps & Evidence:**
  - `templates/cert_setup.html:14, 16, 19, 20, 27, 29, 31, 32`: Uses electric blue `--accent: #2563eb;` and cyan `--accent2: #0284c7;` instead of the mandated Forest Emerald `#006948` / `#10B981` / `#48e260` palette.
  - `templates/cert_setup.html:142`: Certificate download filename is hardcoded as legacy `opencpo-root-ca.crt` instead of `mapletyne-root-ca.crt`.
  - **Verdict:** FUNCTIONAL WITH CRITICAL DESIGN SYSTEM & BRANDING DRIFT.

#### 9. Route: `/app/account/login` (Driver OIDC Authentication)
- **Component / Handler:** `mapletyne-chargeapp/plugins/account/routes.py` -> `templates/account/login.html`
- **Functional Status:** Functional Keycloak Direct Grant / OIDC Proxy
- **Data Source & API Integration:** `POST /api/v1/public/account/login`
- **UX & Accessibility:** Clean dark glassmorphic card, input targets $\ge 46$px, validation error banners.
- **Design System & Tokens:** Dark theme, but leaks Lucide inline SVGs (`login.html:8, 26, 44, 86, 98, 103`).
- **Gaps & Evidence:**
  - Iconography violates `AGENTS.md` by using hand-coded Lucide SVG icons instead of Google Material Symbols.
  - **Verdict:** FUNCTIONAL WITH ICONOGRAPHY GAP.

#### 10. Route: `/app/account/register` (Driver 2-Step Registration)
- **Component / Handler:** `mapletyne-chargeapp/plugins/account/routes.py` -> `templates/account/register.html`
- **Functional Status:** Functional 2-Step Registration with Email OTP
- **Data Source & API Integration:** `POST /api/v1/public/account/register/initiate`, `POST .../verify-otp`
- **UX & Accessibility:** 2-step wizard, 6-digit OTP verification code inputs, password strength meter. Touch targets $\ge 46$px.
- **Design System & Tokens:** Leaks inline SVGs (`register.html:8, 28, 47, 116, 126, 145`).
- **Gaps & Evidence:**
  - Foreign inline SVG icons instead of Google Material Symbols.
  - **Verdict:** FUNCTIONAL WITH ICONOGRAPHY GAP.

#### 11. Route: `/app/account/profile` (Driver Profile & Preferences)
- **Component / Handler:** `mapletyne-chargeapp/plugins/account/routes.py` -> `templates/account/profile.html`
- **Functional Status:** Functional OIDC Profile Edit
- **Data Source & API Integration:** `GET /api/v1/public/account/profile`, `PUT .../profile`
- **UX & Accessibility:** Form layout with vehicle VIN, default payment method, RFID token cards.
- **Design System & Tokens:** Mixed Material Symbols in bottom navigation and inline SVGs in body (`profile.html:8, 31, 63, 72, 77, 82, 88`).
- **Gaps & Evidence:**
  - Mixed icon libraries violating `ADR-002`.
  - **Verdict:** FUNCTIONAL WITH ICONOGRAPHY GAP.

#### 12. Route: `/app/account/history` (Driver Historical Charging Ledger)
- **Component / Handler:** `mapletyne-chargeapp/plugins/account/routes.py` -> `templates/account/history.html`
- **Functional Status:** Functional Session List & Pagination
- **Data Source & API Integration:** `GET /api/v1/public/account/sessions`
- **UX & Accessibility:** Historical session cards, energy consumed, duration, cost breakdown.
- **Design System & Tokens:** Dark canvas styling.
- **Gaps & Evidence:**
  - `templates/account/history.html:23`: Dutch error fallback string:
    ```html
    <div class="error">{{ error or 'Fout bij het laden van sessies' }}</div>
    ```
  - `templates/account/history.html:31, 41`: Hardcodes Euro currency symbol `€` instead of British Pound `£`:
    `<span>€{{ "%.2f"|format(session.cost) }}</span>`.
  - **Verdict:** FUNCTIONAL WITH CURRENCY & LOCALIZATION GAPS.

#### 13. Route: `/app/account/settings` (Driver Preferences & Language)
- **Component / Handler:** `mapletyne-chargeapp/plugins/account/routes.py` -> `templates/account/settings.html`
- **Functional Status:** Functional User Preferences
- **Data Source & API Integration:** Local cookie persistence and query parameter toggles.
- **Gaps & Evidence:**
  - `templates/account/settings.html:35` and `plugins/account/routes.py:131`: Defaults active language to Dutch (`nl`):
    ```python
    "language": account.get("language", "nl")
    ```
    Should default to `en`.
  - **Verdict:** FUNCTIONAL WITH LOCALIZATION GAP.

#### 14. Route: `/app/privacy` (Driver Privacy Policy & Terms)
- **Component / Handler:** `mapletyne-chargeapp/templates/privacy.html`
- **Functional Status:** Static Informational Document
- **Data Source & API Integration:** None (Static Jinja template).
- **UX & Accessibility:** Scrollable legal typography, back button navigation.
- **Design System & Tokens:** **DESIGN SYSTEM TOKEN VIOLATION.**
- **Gaps & Evidence:**
  - `templates/privacy.html:16, 19, 27, 36, 43, 50, 59, 71, 74`: Contains 9 separate instances of hardcoded blue CSS variables:
    `color:var(--accent,#2563eb);` instead of Forest Emerald `#006948`.
  - `templates/error.html:16`: Return home link targets root `/` instead of the sub-path `/app/`, causing a 404 or redirecting drivers to the operator admin portal.
  - **Verdict:** FUNCTIONAL WITH DESIGN TOKEN & NAVIGATION GAPS.

#### 15. Static & PWA Handlers: `/manifest.json`, `/sw.js`, `/skin/{filename:path}`
- **Component / Handler:** `mapletyne-chargeapp/main.py:27-59`
- **Functional Status:** **CRITICAL RUNTIME CRASH (500 Internal Server Error)**
- **Data Source & API Integration:** Local static filesystem.
- **Gaps & Evidence:**
  - `mapletyne-chargeapp/main.py:27, 35, 50, 53, 58, 59`: Handlers invoke `FileResponse`, `Path`, and `HTMLResponse`:
    ```python
    # main.py:26-36
    @app.get("/manifest.json")
    async def pwa_manifest():
        return FileResponse(Path(__file__).parent / "static" / "manifest.json", media_type="application/manifest+json")

    @app.get("/sw.js")
    async def service_worker():
        return FileResponse(Path(__file__).parent / "static" / "sw.js", media_type="application/javascript")

    # main.py:49-61
    @app.get("/skin/{filename:path}")
    async def custom_skin_file(filename: str):
        skin_dir = Path("/etc/opencpo/skin")
        ...
        return FileResponse(skin_path, media_type=media_type)
    ```
  - In lines 1-24 of `main.py`, imports are:
    ```python
    import logging
    import os
    from contextlib import asynccontextmanager
    from fastapi import FastAPI, Request
    from fastapi.staticfiles import StaticFiles
    from fastapi.templating import Jinja2Templates
    import httpx
    import config
    ```
  - **Neither `FileResponse`, `Path`, nor `HTMLResponse` is imported anywhere in `main.py`!**
  - Executing any request to `/manifest.json`, `/sw.js`, or `/skin/*` immediately triggers an unhandled `NameError: name 'FileResponse' is not defined` or `NameError: name 'Path' is not defined`, crashing the endpoint with HTTP 500 and completely disabling PWA service worker installation and custom theme loading.
  - **Verdict:** CRITICAL RUNTIME DEFECT REQUIRING IMMEDIATE IMPORT FIX.

---

## 3. Cross-Cutting Domain Audits

```
Domain Breakdown:
  - Section 1: Design System & UX Conformance
  - Section 2: Application Security & Identity
  - Section 3: Cybersecurity & Transport Infrastructure
  - Section 4: Operations & Observability
  - Section 5: Graphs, Charts & Real-Time Telemetry
  - Section 6: Backend Services, Protocol Engines & APIs
```

### 3.1 Design System & UX Conformance
Governed by `AGENTS.md`, `docs/ARCHITECTURE-SPINE.md` (`AD-5`, `AD-7`), and `docs/architecture/DECISION_RECORDS.md` (`ADR-002`).

#### 3.1.1 Token Adherence vs. Blue Leaks
The Mapletyne design system specifies an immutable Forest Emerald Material Design 3 palette centered on `#006948` (Primary Seed), `#10B981` (Emerald Accent), and `#48E260` (High-Luminance Semantic Highlight).
- **Audit Findings:** While `mapletyne-admin` adheres cleanly to the Forest Emerald token palette, `mapletyne-chargeapp` contains multiple severe token regressions leaking generic blue accents (`#2563eb` and `#0284c7`):
  - `mapletyne-chargeapp/templates/cert_setup.html:14, 16, 19, 20, 27, 29, 31, 32`:
    ```css
    --accent: #2563eb;
    --accent2: #0284c7;
    ```
  - `mapletyne-chargeapp/templates/privacy.html:16, 19, 27, 36, 43, 50, 59, 71, 74`: Hardcodes `color:var(--accent,#2563eb);` across 9 headings and active bullet markers.

#### 3.1.2 Iconography SSOT Compliance
`AGENTS.md` and `ADR-002` establish Google Material Symbols (`material-symbols-outlined`) as the sole, exclusive iconography SSOT, strictly prohibiting Lucide, Feather, FontAwesome, or Heroicons.
- **Audit Findings:**
  - `mapletyne-admin` is 100% compliant with Google Material Symbols.
  - `mapletyne-chargeapp` severely violates the standard by embedding raw inline SVG paths resembling Lucide/Feather icons across 5 core account templates:
    - `templates/account/login.html:8, 26, 44, 86, 98, 103`
    - `templates/account/register.html:8, 28, 47, 116, 126, 145`
    - `templates/account/profile.html:8, 31, 63, 72, 77, 82, 88`
    - `templates/charge.html:7, 35`
    - `templates/session.html:8, 36, 148`
  - In addition, `charge.html` renders consumer unicode emojis (`📍`, `⚡`, `●`, `🔌`, `💳`, `🔢`, `⚙️`) instead of enterprise vector symbols.

#### 3.1.3 Fitts's Law Interactive Hit Target Compliance
Touch controls on mobile interfaces must satisfy the Fitts's Law ergonomic floor of $\ge 44\times 44$px (`min-h-[44px] min-w-[44px]`).
- **Audit Findings:** Three interactive elements in `mapletyne-chargeapp` fail this floor:
  - `templates/base.html:47`: PWA Dismiss button has `padding: 0 2px; font-size: 14px;`, creating a calculated touch target of $\approx 18\times 18$px.
  - `templates/home.html:55`: Search bar clear button has `padding: 4px 6px; font-size: 15px;`, creating a touch target of $\approx 24\times 24$px.
  - `templates/charge.html:35`: Favorite station toggle button has `padding: 4px;`, creating a touch target of $\approx 30\times 30$px.

#### 3.1.4 Dutch Localization & OpenCPO Legacy Branding Remnants
The platform is an enterprise UK/GB CPO platform operated under British regulatory standards (UK PCPR 2023). Multiple files still contain Dutch strings, Dutch defaults, and legacy "OpenCPO" labels inherited from upstream prototypes:
- **Dutch Strings & Locale Defaults:**
  - `mapletyne-chargeapp/routes/receipt.py:43`: PDF filename is hardcoded as `laadbon-{session_id[:8]}.pdf` ("laadbon" is Dutch for charge receipt).
  - `mapletyne-chargeapp/routes/qr.py:33`: Returns Dutch error: `"message": "QR-code niet gevonden"`.
  - `mapletyne-chargeapp/plugins/account/templates/account/history.html:23`: Error fallback is `'Fout'`.
  - `mapletyne-chargeapp/plugins/account/templates/account/history.html:31, 41`: Hardcodes Euro `€` currency symbol instead of British Pound `£`.
  - `mapletyne-chargeapp/templates/home.html:19-20` & `settings.html:35`: Default language fallback is Dutch (`nl` / 🇳🇱).
  - `mapletyne-chargeapp/templates/auth.html:29`: Phone country prefix dropdown defaults to Netherlands `+31`.
  - `mapletyne-chargeapp/plugins/account/routes.py:131`: `"language": account.get("language", "nl")`.
- **Legacy OpenCPO Branding:**
  - `mapletyne-chargeapp/templates/cert_setup.html:142`: File download is `opencpo-root-ca.crt`.
  - `mapletyne-admin/src/pages/PkiVaultPage.tsx:161, 177, 193`: Root CA names are hardcoded as "OpenCPO V2G Root CA".
  - `mapletyne-admin/src/pages/RoamingPage.tsx:174`: Roaming node identifier fallback is `NL*OCP` instead of `GB*MTT`.
  - `mapletyne-admin/src/pages/SettingsPage.tsx:84, 88`: Default country code is `US` and party ID is `CPO`.

---

### 3.2 Application Security & Identity
Governed by `docs/security/APP_SECURITY.md` (OWASP ASVS v4.0.3 L2/L3), `docs/ARCHITECTURE-SPINE.md` (`AD-11`, `AD-12`), and `docs/architecture/DECISION_RECORDS.md` (`ADR-003`, `ADR-006`).

#### 3.2.1 Universal Backdoor Passwords in Authentication Handlers
- **File Citations:** `mapletyne-core/api/admin_auth.py:223-228` and `mapletyne-core/api/accounts.py:416-423`
- **Code Quote (`admin_auth.py:223-228`):**
  ```python
  if not valid and (password in ("ZPn2bUrFWu2@tyYU", "otaskies", "OpenCPO2026!", "admin", "byoWkDX86ndK49$3") or body.password in ("ZPn2bUrFWu2@tyYU", "otaskies", "OpenCPO2026!", "admin", "byoWkDX86ndK49$3")):
      valid = True
      try:
          async with db.write() as wconn:
              new_h = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
              await wconn.execute("UPDATE ocpp.users SET password_hash = $1 WHERE id = $2", new_h, row["id"])
      except Exception:
          pass
  ```
- **Code Quote (`accounts.py:416-421`):**
  ```python
  if not match and password in ("otaskies", "ZPn2bUrFWu2@tyYU", "OpenCPO2026!"):
      match = True
      try:
          async with db.write() as wconn:
              new_h = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
              await wconn.execute("UPDATE ocpp.driver_accounts SET password_hash = $1 WHERE id = $2::uuid", new_h, row["id"])
  ```
- **Vulnerability Mechanism & Impact:** If an attacker attempts to log in as any operator or driver using any of these 5 static passwords, normal bcrypt verification is bypassed, the legitimate user's password hash in PostgreSQL is overwritten with the backdoor password hash, and the caller is granted an administrative or driver session token. This constitutes an intentional, catastrophic authentication backdoor.

#### 3.2.2 Cryptographic Signature Verification Bypass (`verify_signature: False`)
- **File Citation:** `mapletyne-core/api/accounts.py:77-87`
- **Code Quote:**
  ```python
  try:
      unverified = jwt.decode(token, options={"verify_signature": False})
      if unverified.get("exp") and unverified["exp"] > datetime.now(timezone.utc).timestamp():
          return {
              "sub": unverified.get("sub", ""),
              "email": unverified.get("email", ""),
              "name": unverified.get("name") or unverified.get("preferred_username") or unverified.get("email", ""),
              "role": unverified.get("role") or "driver",
          }
  ```
- **Vulnerability Mechanism & Impact:** In `get_current_account()`, if standard HS256 and RS256 signature verifications fail, the handler unconditionally decodes the token with signature verification disabled. An attacker can forge an arbitrary JWT with `sub`, `email`, and `exp` claims set to any victim driver account, and the backend will authenticate them as that driver without verifying any cryptographic signature.

#### 3.2.3 Disabled Audience & Issuer Verification in Keycloak Token Validation
- **File Citation:** `mapletyne-core/auth/keycloak_client.py:175-180`
- **Code Quote:**
  ```python
  claims = jwt.decode(
      token,
      signing_key.key,
      algorithms=["RS256"],
      options={"verify_aud": False, "verify_iss": False},
  )
  ```
- **Vulnerability Mechanism & Impact:** Disabling `verify_aud` and `verify_iss` violates OAuth 2.0 / OIDC specifications and `APP_SECURITY.md:25`. It allows cross-realm or cross-client token substitution attacks where a token issued for a completely different application or tenant can be replayed against `mapletyne-core`.

#### 3.2.4 Absence of Granular RBAC in Management Dependency
- **File Citation:** `mapletyne-core/api/api_key_auth.py:80-84`
- **Code Quote:**
  ```python
  if (
      role in ("admin", "operator", "superadmin", "billing", "fleet", "user")
      or any(r in roles for r in ("cpo-admin", "site-operator", "billing-manager", "fleet-manager", "admin"))
  ):
      return
  ```
- **Vulnerability Mechanism & Impact:** The `management_auth` dependency explicitly includes `role == "user"` as an authorized role. Because all management endpoints (`/api/v1/tariffs`, `/api/v1/tokens`, `/api/v1/pki`, `/api/v1/ems`, `/api/v1/settings`, `/api/v1/users`) share this single dependency, any authenticated user—regardless of privilege—can execute destructive administrative actions (deleting tariffs, resetting chargers, modifying PKI). The documented RBAC matrix (`APP_SECURITY.md:34-41`) is completely unenforced.

#### 3.2.5 Complete Absence of Multi-Tenant PostgreSQL Row-Level Security (RLS)
- **File Citations:** `mapletyne-core/state/postgres.py:17-129`, `mapletyne-core/migrations/versions/v0_3_0_baseline.py:1-400`
- **Audit Findings:** `ADR-003` and `APP_SECURITY.md:44-67` mandate that every table in the `ocpp` schema contain a `tenant_id UUID NOT NULL` column, enforce `ROW LEVEL SECURITY`, and bind transactions to `SET LOCAL app.current_tenant_id`. In reality:
  - ZERO tables in `v0_3_0_baseline.py` have `tenant_id` columns.
  - ZERO `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statements exist in migrations or schema files.
  - ZERO `SET LOCAL app.current_tenant_id` statements exist in `postgres.py` connection checkouts.
  - Multi-tenant data isolation is completely nonexistent in the database layer, creating critical Broken Object Level Authorization (BOLA / OWASP API1:2023) vulnerabilities across multi-site operators.

#### 3.2.6 Hardcoded Secrets & Excessive Token Lifespans
- **Hardcoded Startup Passwords (`mapletyne-core/main.py:176-177`):**
  ```python
  std_hash = bcrypt.hashpw("byoWkDX86ndK49$3".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
  otaski_hash = bcrypt.hashpw("otaskies".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
  ```
  Hardcoded cleartext passwords are seeded into `ocpp.users` and `ocpp.driver_accounts` on every startup.
- **Hardcoded JWT Secret & 30-Day TTL (`mapletyne-core/api/admin_auth.py:40-42`):**
  ```python
  JWT_SECRET = config.api.api_key or os.getenv("JWT_SECRET", "opencpo_secret_7f84a329e46a782b1d03cbf")
  JWT_TTL_HOURS = 720  # 30 days
  ```
  Fallback JWT issuance uses a publicly known secret string and issues 30-day tokens without revocation mechanisms.
- **Unencrypted CA Private Keys on Disk (`mapletyne-core/pki/ca.py:229-231`):**
  ```python
  encryption = BestAvailableEncryption(password.encode()) if password else NoEncryption()
  (self.data_dir / f"{name}.key").write_bytes(key.private_bytes(Encoding.PEM, PrivateFormat.PKCS8, encryption))
  ```
  Because `PKI_ROOT_CA_PASSWORD` defaults to empty string, root and sub-CA private keys are written unencrypted to disk. Furthermore, `api/pki.py:191-212` allows downloading `.p12` bundles containing raw private keys via REST API.

---

### 3.3 Cybersecurity & Transport Infrastructure
Governed by `docs/security/APP_SECURITY.md`, `AGENTS.md`, and OWASP Top 10 standards.

#### 3.3.1 Ingress TLS Termination, HTTPS Enforcement & HSTS Headers
- **File Citation:** `nginx/default.conf:8-323`
- **Audit Findings:** Every `server` block in `nginx/default.conf` listens exclusively on `listen 80;`.
  - Port 443 is not listened on.
  - Zero SSL/TLS certificate directives exist (`ssl_certificate`, `ssl_certificate_key`).
  - No HTTP-to-HTTPS redirect rule (`return 301 https://$host$request_uri;`) exists.
  - No `Strict-Transport-Security` (HSTS) header is emitted.
  - All operator sessions, driver credentials, and telemetry transmit over unencrypted plaintext HTTP.

#### 3.3.2 OCPP WebSocket Encryption & mTLS Status
- **File Citations:** `mapletyne-core/ocpp16/server.py:30-42`, `mapletyne-core/ocpp201/server.py:38-40, 59-65`
- **Audit Findings:**
  - `ocpp16` has no SSL context implementation, binding purely to unencrypted `ws://` on port 34100.
  - `ocpp201` checks for `server.crt` on startup, logs `"No TLS certs found — running without TLS (security profile 1)"`, and configures `ctx.verify_mode = ssl.CERT_OPTIONAL`.
  - Furthermore, `nginx/default.conf:297-309` reverse-proxies OCPP 2.0.1 traffic over plain HTTP/WS without client certificate forwarding, completely breaking Mutual TLS (mTLS) for OCPP 2.0.1 Security Profile 3 (`websocket.transport.get_extra_info('ssl_object')` evaluates to `None`).

#### 3.3.3 ISO 15118-20 V2G/PnC Implementation Status
- **File Citations:** `mapletyne-core/iso15118/__init__.py`, `mapletyne-core/ocpp201/security.py:77-96`
- **Audit Findings:**
  - `mapletyne-core/iso15118/` contains only an empty `__init__.py` (0 bytes).
  - There is zero Efficient XML Interchange (EXI) decoding/encoding, zero XML schema validation, and zero V2G state machine implementation.
  - `_on_get_15118_ev_certificate` in `security.py:88-95` returns `{"status": "Accepted", "exiResponse": ""}` with comment `"# For now: log and return pending"`.
  - Electric vehicles attempting Plug & Charge contract certificate provisioning or automated authorization fail immediately.

#### 3.3.4 OWASP Top 10 Critical Exposures
1. **Public Unauthenticated Database Restore Endpoint (`api/admin_backup.py:146, 201-260`):**
   - Mounted in `api/main.py:137` without dependencies.
   - Anyone on the network can invoke `POST /api/v1/admin/backups/{id}/restore`, which executes SQL script drops and table overwrites without requiring any credentials. Verified via `curl -s http://localhost:34800/api/v1/admin/backups` returning 200 OK unauthenticated.
2. **Public Unauthenticated Update Script Execution (`api/admin_update.py:8-10, 30-60`):**
   - Mounted in `api/main.py:136` without authentication.
   - Anyone can invoke `POST /api/v1/admin/update/run` to execute host shell scripts with `AUTO_CONFIRM=1`.
3. **Public Unauthenticated Remote Stop Charging (`api/public_sessions.py:366-405`):**
   - `POST /api/v1/public/sessions/{session_id}/stop` requires zero authentication or session ownership validation. Supplying any active session UUID immediately dispatches `RemoteStopTransaction` to physical hardware, allowing malicious disruption of charging infrastructure.
4. **Public Real-Time SSE Firehose (`api/events.py:44-53`):**
   - `GET /api/v1/events/stream` has no authentication checks (commented: *"intentionally public to allow the admin dashboard to connect"*). Streams live customer sessions, RFID tags, and meter telemetry publicly. Verified via `curl -s -m 2 -i http://localhost:34800/api/v1/events/stream` returning 200 OK.
5. **Wildcard CORS with Credentials Allowed (`api/main.py:23-29`, `config.py:92`):**
   - Sets `allow_origins=["*"]` with `allow_credentials=True`. Violates W3C CORS specifications; modern browsers reject authenticated responses carrying wildcard origins.
6. **Nginx Security Header Drop via Directive Inheritance (`mapletyne-admin/nginx.conf:26`):**
   - Declaring `add_header Cache-Control ...` in `location /` clears all parent `server` block security headers (`X-Frame-Options`, `Content-Security-Policy`, `X-Content-Type-Options`). Document responses are served with zero defensive headers.
7. **In-Memory, Spoofable Rate Limiting (`api/ratelimit.py:26, 46-47`):**
   - Uses in-memory `defaultdict(list)` instead of Redis. Reads spoofable `X-Real-IP`, unconditionally exempts `127.0.0.1`, and allows 300 req/min on authentication endpoints.
8. **Style Injection via `dangerouslySetInnerHTML` (`mapletyne-admin/src/puck.config.tsx:1345-1354`):**
   - Unsanitized dynamic variables `primaryColor` and `activeFont` are interpolated directly into a `<style>` block.

#### 3.3.5 Dependency Vulnerability Audit
- **Node.js (`mapletyne-admin`):**
  - Command `npm audit --json` identified **10 total vulnerabilities** (6 High, 4 Moderate):
    - `vite` $\le 6.4.3$: High (GHSA-587h-7wmj-h5pm CWE-77 arbitrary command execution, GHSA-rq7h-c2jc-7f22 CWE-22 arbitrary file read).
    - `braces` / `micromatch` / `tailwindcss`: High (GHSA-vfj7-8cjw-p6xm CWE-674 stack exhaustion DoS).
    - `uuid`: Moderate (GHSA-w5hq-g745-h8pq buffer bounds check).
    - `postcss-selector-parser`: Moderate (GHSA-rj75-hqrm-r3gf CPU exhaustion DoS).
- **Python (`mapletyne-core`):**
  - Dependencies in `requirements.txt` use unpinned minimum versions (`>=`), lack a reproducible lockfile (`requirements.lock`), and contain duplicates (`psycopg2-binary>=2.9.0`).

---

### 3.4 Operations & Observability
Governed by `docs/ops/RELIABILITY.md` and `docs/ARCHITECTURE-SPINE.md` (`AD-1`).

#### 3.4.1 Host Port Exposure Bypassing Ingress Gateway
- **File Citations:** `docker-compose.yml:28-30, 80, 103, 130, 145, 176` and `docker-compose.prod.yml:65-67, 111, 141`
- **Audit Findings:** Internal microservice ports are bound directly to `0.0.0.0` on the host interface:
  - `34800` (Core REST API)
  - `34100` (OCPP 1.6-J WebSocket)
  - `34201` (OCPP 2.0.1 WebSocket)
  - `34000` (Admin UI)
  - `34003` (Driver ChargeApp)
  - `34085` (Keycloak IAM)
  - `34087` (Charger Farm Simulator)
  - `34090` (Tester Suite)
- Binding these ports directly exposes unauthenticated backend endpoints, bypassing Nginx rate limiting, IP allowlists, and SSL termination (`AD-1` violation).

#### 3.4.2 Production Docker Compose Manifest Gaps
- **File Citation:** `docker-compose.prod.yml:1-175`
- **Audit Findings:** `docker-compose.prod.yml` completely omits service definitions for **`keycloak`** and **`nginx`**. Attempting to launch production via this compose file leaves identity management and the ingress gateway unprovisioned.

#### 3.4.3 Redis Persistent Storage Volume Deficit
- **File Citation:** `docker-compose.yml:7-14`
- **Audit Findings:** The `redis` service has no persistent storage volume mounted (`volumes: - redis-data:/data` is absent) and does not specify `--appendonly yes`. Restarting the Redis container causes total loss of active charging session caches, rate limit counters, and pending 2-step OTP registration intents.

#### 3.4.4 Prometheus Metrics Endpoint 404
- **File Citations:** `mapletyne-core/api/main.py:44-72`, `mapletyne-core/requirements.txt`
- **Audit Findings:** `RELIABILITY.md:89-96` specifies native Prometheus metrics exported at `GET /metrics` (`opencpo_connected_chargers_total`, `opencpo_ocpp_rpc_duration_seconds_bucket`, `opencpo_dlm_control_loop_duration_seconds_bucket`).
- In reality, `curl -s -i http://localhost:34800/metrics` returns `HTTP/1.1 404 Not Found`. Neither `prometheus-client` nor `prometheus-fastapi-instrumentator` is installed or mounted.

#### 3.4.5 Health & Readiness Probe Gaps
- **File Citation:** `mapletyne-core/api/main.py:46-72`
- **Audit Findings:**
  - `GET /health` returns static `{"status": "ok"}` without checking downstream dependencies.
  - `GET /health/ready` returns HTTP 200 with `status: degraded` when database connection fails, instead of returning HTTP 503 Service Unavailable. Kubernetes readiness probes will continue routing traffic to broken pods.
  - The documented `/api/healthz` deep readiness probe (`RELIABILITY.md:87`) does not exist.

#### 3.4.6 Abrupt Shutdown Without Graceful Drain
- **File Citation:** `mapletyne-core/main.py:268-283`
- **Audit Findings:** On `SIGTERM`, `_shutdown()` immediately cancels all `asyncio` tasks. It omits the mandatory 30-second drain grace period and fails to send WebSocket close frames (`1012 Service Restart`) to connected EVSEs (`ADR-001`, `RELIABILITY.md:73-76`). Chargers drop connections abruptly and lose in-flight transaction synchronizations.

---

### 3.5 Graphs, Charts & Real-Time Telemetry
Governed by `docs/ARCHITECTURE-SPINE.md` (`AD-3`, `AD-6`) and `docs/architecture/DECISION_RECORDS.md` (`ADR-004`, `ADR-005`).

#### 3.5.1 Prohibited HTTP Polling Across Admin Components
`AD-3` and `ADR-005` mandate Server-Sent Events (`/api/v1/events/stream`) invalidating TanStack Query cache keys and strictly prohibit HTTP polling intervals (`refetchInterval`).
- **Audit Findings:** A total of **10 active polling hooks** were identified across 7 core admin components:
  1. `DashboardPage.tsx:21`: `refetchInterval: 10000` (10s)
  2. `SessionsPage.tsx:16`: `refetchInterval: 15000` (15s)
  3. `VehiclesPage.tsx:52`: `refetchInterval: 10000` (10s)
  4. `VehiclesPage.tsx:75`: `refetchInterval: 5000` (5s)
  5. `VehiclesPage.tsx:82`: `refetchInterval: 10000` (10s)
  6. `VehiclesPage.tsx:91`: `refetchInterval: 5000` (5s)
  7. `EmsPage.tsx:21`: `refetchInterval: 5000` (5s)
  8. `SiteStationThrottlingTable.tsx:18`: `refetchInterval: 5000` (5s)
  9. `ChargerTelemetryView.tsx:43`: `refetchInterval: 2000` (2s)
  10. `ChargerTelemetryView.tsx:50`: `refetchInterval: 3000` (3s)
- This constant polling generates hundreds of unnecessary HTTP queries per minute, degrading database connection pools and causing client UI jitter.

#### 3.5.2 Complete Absence of DOM Virtualization on High-Density Tables
`AD-6` and `ADR-002` require that all tables exceeding 100 rows use `@tanstack/react-virtual` with locked 40px row heights.
- **Audit Findings:** While `@tanstack/react-virtual` is listed in `mapletyne-admin/package.json:15`, it is **unimported and unused across the entire codebase**:
  - `ChargersPage.tsx:354-449`: Direct `.map()` array iteration.
  - `SessionsPage.tsx:242-286`: Direct `.map()` array iteration with 48px row heights (`h-12`).
  - `RfidFleetPage.tsx:389-501`: Direct `.map()` array iteration.
  - `VehiclesPage.tsx:370-450`: Direct `.map()` array iteration.
- Under production conditions with thousands of sessions or tokens, the unvirtualized DOM will experience massive frame drops and browser memory bloat.

#### 3.5.3 Chart Telemetry Accuracy: Synthetic CC-CV Curve
- **File Citation:** `mapletyne-admin/src/components/sessions/SessionChargingProfileChart.tsx:28-39`
- **Code Quote:**
  ```typescript
  const data: ChargingDataPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i * 2;
    const power = i < 18 ? 148 - (i * 0.5) : Math.max(22, 148 - (i - 18) * 8);
    const soc = Math.min(100, Math.round(20 + (i / steps) * 60));
    data.push({ time: `${t}m`, power: Math.max(0, Math.round(power)), soc });
  }
  ```
- **Audit Findings:** Rather than consuming the session's actual meter value timeseries from `/api/v1/sessions/{id}/meter` or `/api/v1/sessions/{id}/telemetry`, the chart generates a completely artificial CC-CV mathematical curve. Operators are presented with synthetic fictional data instead of real vehicle charging performance.

---

### 3.6 Backend Services, Protocol Engines & APIs
Governed by `docs/ARCHITECTURE-SPINE.md` (`AD-2`, `AD-10`), `docs/architecture/DECISION_RECORDS.md` (`ADR-001`, `ADR-004`, `ADR-010`), and international EV charging specifications.

#### 3.6.1 FastAPI `response_model` Omission & OpenAPI `unknown` Types (`AD-2`)
- **File Citations:** `mapletyne-core/api/*.py` (35 of 37 routers) and `mapletyne-admin/src/lib/types/api.ts:4236-4242`
- **Audit Findings:** `AD-2` mandates strict end-to-end type safety derived from FastAPI's `/openapi.json` via `openapi-typescript`.
  - In `mapletyne-core`, 35 of 37 router modules omit `response_model` annotations on their endpoints.
  - Consequently, FastAPI's OpenAPI generator outputs:
    ```typescript
    responses: {
      200: {
        content: { "application/json": unknown; };
      };
    };
    ```
  - This forces frontend engineers to bypass TypeScript type checking by casting all API responses to `any` (e.g. `api.get<any>('/chargers')`), completely invalidating `AD-2`.

#### 3.6.2 Lack of JSON Schema Validation in OCPP Engines
- **File Citations:** `mapletyne-core/ocpp16/protocol.py:110-139` and `mapletyne-core/ocpp201/protocol.py:184-196`
- **Audit Findings:** Inbound OCPP messages are parsed using raw `json.loads(raw)` with basic list length checks (`len(data) < 3`). Neither engine validates message payloads against canonical OCA JSON schemas (draft-04 JSON schemas). Malformed payloads bypass protocol validation and trigger unhandled Python exceptions (`KeyError`, `ValueError`), returning generic `InternalError` instead of standardized OCPP error codes (`FormatViolation`, `PropertyConstraintViolation`).
- **Test RFID Tag Bypasses (`ocpp16/handler.py:273-275`):**
  ```python
  if id_tag.startswith(("APP_", "SIM_", "TEST_", "EVEREST_")) or id_tag in ("REMOTE", "DEADBEEF", "04A1B2C3", "ISO15118", "BasicAuthSecureKey2026!"):
      self._last_auth_billing = {"type": "prepaid", "group_id": None}
      status = AuthorizationStatus.ACCEPTED
  ```
  Magic strings automatically authorize charging sessions on physical stations without checking the database or verifying user balances.

#### 3.6.3 Concurrency Bottleneck: Table-Locking Transaction ID Generation
- **File Citation:** `mapletyne-core/ocpp16/session.py:45-48`
- **Code Quote:**
  ```python
  transaction_id = await conn.fetchval(
      "UPDATE ocpp.sessions SET transaction_id = (SELECT COALESCE(MAX(transaction_id), 0) + 1 FROM ocpp.sessions) WHERE id = $1 RETURNING transaction_id",
      session["id"],
  )
  ```
- **Audit Findings:** Computing `transaction_id` via `SELECT MAX(...) + 1` inside an open transaction causes row and table locking across concurrent `StartTransaction` requests, creating deadlocks and severe performance degradation under high concurrent depot load. A PostgreSQL `SEQUENCE` is required.

#### 3.6.4 Hardcoded CDR Billing Engine Violating `AD-10`
- **File Citation:** `mapletyne-core/ocpp16/session.py:211-215, 298-316, 344`
- **Code Quote:**
  ```python
  def _calculate_cdr_cost(energy_kwh: float, tariff_rate: Decimal = Decimal("0.35")) -> dict:
      vat_rate = Decimal("0.21")
      ...
      "currency": "EUR"
  ```
- **Audit Findings:** `generate_cdr` unconditionally calculates billing totals using hardcoded `€0.35/kWh`, `21.0% VAT`, and `EUR` currency. Configured site tariffs (`ocpp.tariffs`), customer group discounts, and UK British Pound (`GBP` / `£`) legal defaults (`AD-10`) are completely ignored.

#### 3.6.5 Orphaned OCPI 2.2.1 Application
- **File Citations:** `mapletyne-core/ocpi/main.py:17-21, 123-128` and `mapletyne-core/api/main.py:151`
- **Audit Findings:** A complete OCPI 2.2.1 roaming application (`ocpi_app = FastAPI(...)`) implementing credentials, locations, sessions, CDRs, and tariffs is defined in `ocpi/main.py`. However, it is **never mounted** onto the main FastAPI application in `api/main.py`. All external roaming endpoints (`/ocpi/*`) return HTTP 404 Not Found.

#### 3.6.6 Total Backend Test Coverage Deficit (0%)
- **File Citations:** `mapletyne-core/` (root) and `pytest.ini:1-18`
- **Audit Findings:**
  - `mapletyne-core/` contains **ZERO automated unit or integration tests** (0% test coverage).
  - `requirements.txt` does not install `pytest`, `pytest-asyncio`, or `httpx`.
  - The repository's root `pytest.ini` targets exclusively `tests/`, which contains only frontend Playwright browser automation scripts. The core CSMS, protocol engines, and billing logic have zero automated test validation.


---

## 4. Master Consolidated Prioritized Gap Register

The following consolidated register provides the comprehensive inventory of all **44 code-verified platform gaps**, sorted strictly by severity (**CRITICAL**, **HIGH**, **MEDIUM**, **LOW**).

| Gap ID | Area | Severity | File Path & Line Citation | Root Cause & Security/Operational Impact | Concrete Recommended Fix |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **GAP-SEC-01** | Security / Auth | **CRITICAL** | `mapletyne-core/api/admin_auth.py:223-228` | **Universal Admin Backdoor Passwords:** Submitting any of 5 hardcoded passwords (`"ZPn2bUrFWu2@tyYU"`, `"otaskies"`, `"OpenCPO2026!"`, `"admin"`, `"byoWkDX86ndK49$3"`) bypasses verification, overwrites the user's password hash in PostgreSQL, and issues an administrative JWT session. | Immediately delete the backdoor password list and conditional bypass block. Enforce strict bcrypt verification against Keycloak/DB password hashes only. |
| **GAP-SEC-02** | Security / Auth | **CRITICAL** | `mapletyne-core/api/accounts.py:416-423` | **Universal Driver Backdoor Passwords:** Submitting `"otaskies"`, `"ZPn2bUrFWu2@tyYU"`, or `"OpenCPO2026!"` bypasses driver authentication and overwrites the driver's password hash in `ocpp.driver_accounts`. | Remove the backdoor conditional entirely. Restrict driver login strictly to Keycloak Direct Grants and Argon2/bcrypt hash checks. |
| **GAP-SEC-03** | Security / Crypto | **CRITICAL** | `mapletyne-core/api/accounts.py:77-87` | **Cryptographic Signature Verification Bypass:** In `get_current_account()`, if standard JWT decoding fails, it falls back to `jwt.decode(token, options={"verify_signature": False})`. Any unsigned or forged token with a future `exp` claim is accepted as authenticated. | Remove unverified decoding fallback. Reject any token that does not successfully validate against the Keycloak RS256 JWKS public key or local HS256 secret. |
| **GAP-SEC-04** | Security / Ops | **CRITICAL** | `mapletyne-core/api/main.py:137`<br>`api/admin_backup.py:146, 201-260` | **Public Database Drop/Restore Endpoint:** `admin_backup_router` is included without authentication dependencies. Any anonymous network client can invoke `POST /api/v1/admin/backups/{id}/restore` to drop and overwrite PostgreSQL tables. | Mount `admin_backup_router` with strict `dependencies=[Depends(require_superadmin)]`. Require authenticated operator session with re-authentication challenge. |
| **GAP-SEC-05** | Security / Ops | **CRITICAL** | `mapletyne-core/api/main.py:136`<br>`api/admin_update.py:8-10, 30-60` | **Public Remote Script Execution:** `admin_update_router` is unauthenticated. Any anonymous actor can call `POST /api/v1/admin/update/run` to execute host-level shell update scripts with `AUTO_CONFIRM=1`. | Add strict administrative authentication guard to `admin_update_router`. Never allow unauthenticated callers to execute subprocesses. |
| **GAP-SEC-06** | Security / Ops | **CRITICAL** | `mapletyne-core/api/public_sessions.py:366-405` | **Unauthenticated Remote Stop Charging:** `POST /api/v1/public/sessions/{session_id}/stop` requires zero authentication or session ownership validation. Supplying any active session UUID dispatches `RemoteStopTransaction` to physical hardware. | Require driver session token or admin authorization matching `driver_account_id` before issuing `RemoteStopTransaction`. |
| **GAP-SEC-07** | Cybersecurity | **CRITICAL** | `mapletyne-core/api/events.py:44-53` | **Public Real-Time SSE Event Firehose:** `GET /api/v1/events/stream` has zero authentication. Anonymous callers receive live streams of active charging sessions, RFID token IDs, vehicle telemetry, and PKI audit events. | Implement ticket-based query token or cookie-based JWT authentication on `/api/v1/events/stream`. |
| **GAP-BE-01** | Runtime / Defect | **CRITICAL** | `mapletyne-chargeapp/main.py:27, 35, 50, 53, 58, 59` | **Driver PWA Runtime Crash:** Handlers call `FileResponse`, `Path`, and `HTMLResponse`, none of which are imported in `main.py`. Requests to `/manifest.json`, `/sw.js`, or `/skin/*` immediately fail with `NameError` and HTTP 500. | Add missing imports to `main.py`: `from fastapi.responses import FileResponse, HTMLResponse` and `from pathlib import Path`. |
| **GAP-BE-02** | Security / Secrets | **CRITICAL** | `mapletyne-core/main.py:176-177` | **Hardcoded Passwords Seeded on Startup:** Cleartext passwords (`byoWkDX86ndK49$3` and `otaskies`) are hashed and seeded into `ocpp.users` and `ocpp.driver_accounts` on every service startup. | Remove hardcoded passwords from source code. Require secure environment variables (`INITIAL_ADMIN_PASSWORD`) or generate randomized secrets upon initial bootstrap. |
| **GAP-SEC-08** | Security / IAM | **HIGH** | `mapletyne-core/auth/keycloak_client.py:175-180` | **Disabled Audience & Issuer Checks in Keycloak Validation:** Disables `verify_aud` and `verify_iss`, allowing cross-realm and cross-client token substitution attacks in violation of OAuth 2.0 and `APP_SECURITY.md:25`. | Enable audience and issuer verification against `KEYCLOAK_URL` and target client ID (`opencpo-admin-ui`, `opencpo-charge-app`). |
| **GAP-SEC-09** | Security / RBAC | **HIGH** | `mapletyne-core/api/api_key_auth.py:80-84` | **Absence of Granular RBAC in Management Guard:** `management_auth` treats `role == "user"` as fully authorized, granting non-admin users identical access to tariffs, tokens, settings, and hardware commands. | Implement fine-grained route guards checking specific roles (`cpo-admin`, `site-operator`, `billing-manager`, `fleet-manager`) in accordance with `APP_SECURITY.md:34-41`. |
| **GAP-SEC-10** | Database / RLS | **HIGH** | `mapletyne-core/state/postgres.py:17-129`<br>`migrations/versions/v0_3_0_baseline.py` | **Missing Multi-Tenant RLS & `tenant_id`:** Database tables lack `tenant_id` columns, `ROW LEVEL SECURITY` policies, and `SET LOCAL app.current_tenant_id` session injection, violating `ADR-003` and creating BOLA risks. | Add `tenant_id UUID NOT NULL` to core tables, configure RLS policies, and inject `SET LOCAL app.current_tenant_id` on connection checkout. |
| **GAP-SEC-11** | Transport / TLS | **HIGH** | `nginx/default.conf:8-323`<br>`docker-compose.yml` | **Absence of Ingress TLS, HTTPS & HSTS:** Nginx listens exclusively on HTTP port 80; no SSL certificates are configured, no HTTP-to-HTTPS redirect exists, and HSTS headers are absent. All traffic transmits in cleartext. | Configure `listen 443 ssl;`, mount TLS 1.3 certificates, enforce 301 HTTPS redirection, and set `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. |
| **GAP-SEC-12** | Transport / OCPP | **HIGH** | `mapletyne-core/ocpp16/server.py:30-42`<br>`ocpp201/server.py:38-40`<br>`nginx/default.conf:297-309` | **Unencrypted OCPP WebSockets & Broken mTLS:** OCPP 1.6 defaults to unencrypted `ws://`. OCPP 2.0.1 uses optional TLS verification. Nginx proxies OCPP over plain HTTP without client cert headers, breaking Security Profile 3 mTLS. | Enforce WSS TLS termination, load valid server certs, enforce `ssl.CERT_REQUIRED`, and forward client certificates via Nginx SSL passthrough or `$ssl_client_escaped_cert`. |
| **GAP-SEC-13** | Secrets / PKI | **HIGH** | `mapletyne-core/pki/ca.py:229-231`<br>`api/pki.py:191-212` | **Unencrypted CA Private Keys on Disk & Key Download API:** Root and Sub-CA private keys are written unencrypted to disk when `PKI_ROOT_CA_PASSWORD` is empty. `GET /api/v1/pki/certificates/{serial}/download` downloads raw `.p12` keys. | Encrypt private keys with AES-256-GCM / KMS using mandatory passphrases; disallow raw private key download via REST API. |
| **GAP-SEC-14** | Cybersecurity | **HIGH** | `mapletyne-core/api/main.py:23-29`<br>`config.py:92`, `.env:42` | **Wildcard CORS with Credentials Allowed:** `allow_origins=["*"]` is paired with `allow_credentials=True`. Violates W3C CORS specifications; browsers reject authenticated responses and cross-origin data leaks occur. | Remove wildcard `*` from `CORS_ORIGINS`. Explicitly whitelist authorized frontend origins (`http://localhost:34000`, `http://localhost:34003`). |
| **GAP-SEC-15** | Cybersecurity | **HIGH** | `mapletyne-admin/nginx.conf:26`<br>`nginx/default.conf` | **Nginx Header Inheritance Clearing Security Headers:** Declaring `add_header Cache-Control ...` in `location /` clears parent `server` block security headers (`CSP`, `X-Frame-Options`, `X-Content-Type-Options`). | Move security headers into a shared `conf.d/security-headers.conf` snippet and `include` inside every `location` block. |
| **GAP-SEC-16** | IAM / OAuth | **HIGH** | `keycloak/realm-export.json:50-55, 74-79` | **Permissive OAuth 2.0 Redirect URIs:** Public clients `opencpo-admin-ui` and `opencpo-charge-app` specify `"redirectUris": ["*"]` and `"webOrigins": ["*"]`, enabling authorization code interception. | Restrict `redirectUris` and `webOrigins` strictly to configured production domain origins. |
| **GAP-PROT-01** | Protocols / ISO 15118 | **HIGH** | `mapletyne-core/iso15118/__init__.py:1`<br>`ocpp201/security.py:77-96` | **Empty ISO 15118-20 Engine & Stubbed PnC EXI:** Module is empty (0 bytes). `_on_get_15118_ev_certificate` returns empty string `exiResponse: ""`. Plug & Charge contract certificate provisioning fails completely. | Implement EXI codec and V2G state machine or integrate standard ISO 15118 library (e.g. `iso15118` Python library). |
| **GAP-PROT-02** | Protocols / Validation | **HIGH** | `mapletyne-core/ocpp16/protocol.py:110-139`<br>`ocpp201/protocol.py:184-196` | **Zero JSON Schema Validation on OCPP Messages:** Messages parsed via `json.loads` without schema checks. Malformed types trigger unhandled exceptions, returning `InternalError` instead of spec error codes. | Integrate `jsonschema` validation against standard OCPP 1.6-J and 2.0.1 schemas, returning `FormatViolation` / `PropertyConstraintViolation`. |
| **GAP-BILL-01** | Billing / Data Integrity | **HIGH** | `mapletyne-core/ocpp16/session.py:211-215, 298-316, 344` | **Hardcoded CDR Billing (€0.35/kWh, 21% VAT, EUR):** `generate_cdr` unconditionally computes billing using static €0.35/kWh and 21% VAT in EUR, ignoring configured site tariffs and UK GBP defaults (`AD-10` violation). | Refactor `_calculate_cdr_cost` to resolve assigned site/charger tariff from `ocpp.tariffs` or pricing tiers, respecting `AD-10`. |
| **GAP-API-01** | API Contracts / Codegen | **HIGH** | `mapletyne-core/api/*.py` (35 routers)<br>`mapletyne-admin/src/lib/types/api.ts:4236` | **FastAPI `response_model` Omission Emitting `unknown` Types:** 35 of 37 routers lack Pydantic `response_model`, generating `unknown` OpenAPI schemas, violating `AD-2`, and forcing `any` types in `mapletyne-admin`. | Add explicit Pydantic response models (`response_model=...`) to all router endpoints; re-run `npm run codegen`. |
| **GAP-DB-01** | Database / Scale | **HIGH** | `mapletyne-core/ocpp16/session.py:45-48` | **Concurrency Bottleneck on Transaction ID:** `SELECT MAX(transaction_id) + 1` inside an open transaction locks `ocpp.sessions`, creating deadlocks and race conditions under concurrent sessions. | Replace with native PostgreSQL sequence (`CREATE SEQUENCE ocpp.transaction_id_seq`). |
| **GAP-ROAM-01** | Roaming / OCPI | **HIGH** | `mapletyne-core/ocpi/main.py:17-21`<br>`mapletyne-core/api/main.py:151` | **Orphaned OCPI 2.2.1 Roaming Application:** `ocpi_app` is instantiated in `ocpi/main.py` but never mounted in `api/main.py`. All external roaming endpoints (`/ocpi/*`) return 404 Not Found. | Mount `ocpi_app` in `api/main.py` (`app.mount("/ocpi", ocpi_app)`). |
| **GAP-OPS-01** | Operations / Network | **HIGH** | `docker-compose.yml:28-30`<br>`docker-compose.prod.yml:65-67` | **Microservice Ports Exposed Directly on `0.0.0.0`:** Ports `34800`, `34100`, `34201`, `34000`, `34003`, `34085` bound to host interface, bypassing Nginx gateway and violating `AD-1`. | Bind microservice ports exclusively to `127.0.0.1` or internal Docker network; route all external traffic through Nginx. |
| **GAP-OPS-02** | Operations / Deploy | **HIGH** | `docker-compose.prod.yml:1-175` | **Production Compose Omits Keycloak & Nginx:** `docker-compose.prod.yml` completely omits `keycloak` and `nginx` service blocks, leaving IAM and ingress unprovisioned in production. | Add Keycloak 26 and Nginx services with production environment variables to `docker-compose.prod.yml`. |
| **GAP-QA-01** | Testing / QA | **HIGH** | `mapletyne-core/` (root)<br>`pytest.ini:1-18` | **Zero Automated Backend Unit/Integration Tests (0% Coverage):** `mapletyne-core` has zero test files; `pytest.ini` targets `tests/` which contains only frontend Playwright UI scripts. | Add `pytest`, `pytest-asyncio`, and `httpx` test suite covering API contracts, database operations, and OCPP protocol handlers. |
| **GAP-DEP-01** | Dependencies | **HIGH** | `mapletyne-admin/package.json` | **10 NPM Vulnerabilities (6 High Severity) in Admin UI:** Includes Vite arbitrary command execution and file read (GHSA-587h-7wmj-h5pm) and Tailwind/Braces stack exhaustion DoS. | Upgrade `vite`, `@measured/puck`, and `tailwindcss` to patched versions. |
| **GAP-FE-01** | Frontend / Crash | **HIGH** | `mapletyne-admin/src/lib/payload.ts:18` | **Node `process.env` in Browser Vite Bundle:** References Node's `process.env` in browser code, throwing `ReferenceError: process is not defined` and crashing CMS and Puck editor routes. | Replace with `import.meta.env.VITE_PAYLOAD_SERVER_URL` or guard with `typeof process !== 'undefined' ? process.env : {}`. |
| **GAP-FE-02** | Frontend / Mock | **HIGH** | `mapletyne-admin/src/pages/DashboardPage.tsx:305-370` | **Dashboard Active Sessions Table 100% Mocked:** Active sessions table renders hardcoded static HTML strings ("ABB Terra 184", "Audi e-tron GT", "148.2 kW") instead of live data. | Replace static HTML rows with dynamic TanStack Query mapping over real active sessions from `/api/v1/sessions?status=active`. |
| **GAP-FE-03** | Frontend / Mock | **HIGH** | `mapletyne-admin/src/pages/ProfilePage.tsx:9-200` | **Operator Profile Page Completely Mocked Stub:** `handleSave` has no API mutation; action buttons execute `alert()`; PKI and RFID credentials are static mocks. | Wire `ProfilePage.tsx` to `/api/v1/users/me` or `/api/v1/auth/profile` and implement real certificate renewal / token modal mutations. |
| **GAP-FE-04** | Frontend / Mock | **MEDIUM** | `mapletyne-admin/src/pages/OnboardingPage.tsx:13-229` | **Onboarding Provisioning Wizard Incomplete Mock:** Network latency ping is a fake 1200ms `setTimeout`; finish button calls `alert()`; Steps 1, 3, and 4 are completely missing. | Implement full 4-step wizard forms and connect to station provisioning APIs (`POST /api/v1/chargers/provision`). |
| **GAP-FE-05** | Frontend / Mock | **MEDIUM** | `mapletyne-admin/src/pages/TermsPage.tsx:7-11` | **Terms of Service Signature Non-Persistent:** Signing only updates local React state; refreshing browser resets signed state; displays hardcoded static hash. | Create backend terms acceptance endpoint (`POST /api/v1/users/terms/sign`) and persist signature timestamp and audit hash in DB. |
| **GAP-FE-06** | Real-Time / Perf | **MEDIUM** | `mapletyne-admin/src/pages/`, `components/` (7 files) | **Prohibited HTTP Polling (`refetchInterval`):** 10 active polling hooks down to 2000ms saturate DB connection pools and violate `AD-3` and `ADR-005`. | Remove all `refetchInterval` configurations and rely solely on SSE cache invalidations via `useLiveEvents`. |
| **GAP-FE-07** | UI / Scalability | **MEDIUM** | `mapletyne-admin/src/pages/SessionsPage.tsx`, `ChargersPage.tsx`, etc. | **DOM Virtualization Missing Across All Large Tables:** `@tanstack/react-virtual` is listed in `package.json` but never imported; tables render unvirtualized `.map()`, violating `AD-6`. | Implement `@tanstack/react-virtual` with locked 40px row heights in `ChargersPage`, `SessionsPage`, `RfidFleetPage`, and `VehiclesPage`. |
| **GAP-FE-08** | Telemetry / Accuracy | **MEDIUM** | `mapletyne-admin/src/components/sessions/SessionChargingProfileChart.tsx:28-39` | **Synthetic Math Formula in Charging Profile Chart:** Renders a hardcoded CC-CV mathematical curve rather than real meter value timeseries from the database. | Bind chart to actual meter values fetched from `/api/v1/sessions/{id}/meter` or `/api/v1/sessions/{id}/telemetry`. |
| **GAP-FE-09** | Protocols / Auth | **MEDIUM** | `mapletyne-core/ocpp16/handler.py:273`, `ocpp201/handler.py:242` | **Hardcoded Test RFID Tokens Bypassing Authorization:** Tokens `DEADBEEF`, `04A1B2C3`, `ISO15118` or prefixes `APP_`, `SIM_` automatically accept without DB validation. | Guard test tokens behind an explicit `simulated` environment check or reject untracked tokens in production. |
| **GAP-FE-10** | Design System | **MEDIUM** | `mapletyne-chargeapp/templates/cert_setup.html`, `privacy.html` | **Design Token Regressions (Electric Blue Leaks):** Uses `--accent: #2563eb;` and `#0284c7;` instead of Forest Emerald `#006948` / `#10B981` / `#48e260`. | Replace all instances of `#2563eb` and `#0284c7` with CSS variables `--color-primary: #006948;` and `--color-accent: #10B981;`. |
| **GAP-FE-11** | Design System | **MEDIUM** | `mapletyne-chargeapp/templates/` (5 templates) | **Foreign Iconography Leaks (Inline SVGs & Emojis):** Uses inline Lucide SVGs and unicode emojis instead of Google Material Symbols, violating `AGENTS.md` and `ADR-002`. | Replace inline SVGs and emojis with Google Material Symbols (`<span class="material-symbols-outlined">...</span>`). |
| **GAP-SEC-17** | Secrets / Auth | **MEDIUM** | `mapletyne-core/api/admin_auth.py:40-42` | **Hardcoded Fallback JWT Secret & 30-Day TTL:** Defaults to `"opencpo_secret_7f84a329e46a782b1d03cbf"` and issues 720-hour (30-day) tokens without revocation checks. | Require `JWT_SECRET` in environment variables; fail startup if missing; reduce access token lifetime to 1 hour with refresh token rotation. |
| **GAP-SEC-18** | Cybersecurity | **MEDIUM** | `mapletyne-core/api/ratelimit.py:26, 46` | **In-Memory, Spoofable Rate Limiting:** Reads spoofable `X-Real-IP`, exempts localhost, and defaults auth limits to 300 req/min in memory. | Replace with Redis sliding-window rate limiter reading verified client IP and throttle auth to 10 req/15 min. |
| **GAP-SEC-19** | Cybersecurity | **MEDIUM** | `mapletyne-admin/src/puck.config.tsx:1345` | **Style Injection via `dangerouslySetInnerHTML`:** Dynamic variables `primaryColor` and `activeFont` interpolated into `<style>` block without sanitization. | Sanitize hex color strings and font family tokens with strict regex before DOM injection. |
| **GAP-SEC-20** | Cybersecurity | **MEDIUM** | `mapletyne-chargeapp/` (forms) | **Missing CSRF Token Protection on Driver Forms:** State-mutating forms in driver PWA lack CSRF tokens. | Implement double-submit cookie or Starlette CSRF middleware on state-mutating endpoints. |
| **GAP-OPS-03** | Operations / Storage | **LOW** | `docker-compose.yml:7-14` | **Redis Container Lacks Persistent Storage Volume:** Compose file has no volume mounted for Redis, risking loss of active sessions and rate limit counters on restart. | Add `volumes: - redis-data:/data` and `--appendonly yes` to Redis service in `docker-compose.yml`. |
| **GAP-OPS-04** | Observability | **LOW** | `mapletyne-core/api/main.py:44-72` | **Prometheus `/metrics` Endpoint Returns 404:** Documented Prometheus metrics endpoint does not exist. | Integrate `prometheus-fastapi-instrumentator` or export OCA RPC/DLM metrics on `GET /metrics`. |
| **GAP-FE-12** | Localization | **LOW** | `mapletyne-chargeapp/routes/`, `templates/` | **Dutch Localization Remnants & Defaults:** Filename `laadbon`, phone prefix `+31`, language default `nl`, currency `€`, and error `Fout`. | Replace Dutch defaults with British English defaults (`GB`, `+44`, `£`, `receipt`, `en`). |
| **GAP-FE-13** | Branding | **LOW** | `PkiVaultPage.tsx`, `RoamingPage.tsx`, `SettingsPage.tsx`, `cert_setup.html` | **OpenCPO Legacy Branding Remnants:** "OpenCPO V2G Root CA", roaming node `NL*OCP`, country `US`, and `opencpo-root-ca.crt`. | Rename all CA labels and filenames to Mapletyne standards (`GB*MTT`, `mapletyne-root-ca.crt`). |
| **GAP-FE-14** | Ergonomics / UX | **LOW** | `base.html:47`, `home.html:55`, `charge.html:35` | **Fitts's Law Hit Target Violations (< 44px):** PWA banner dismiss (18px), search clear (24px), and favorite toggle (30px) fail ergonomic floor. | Enforce minimum hit dimensions: `min-height: 44px; min-width: 44px; display: inline-flex; align-items: center; justify-content: center;`. |

---

## 5. Strategic Remediation Roadmap

To transition the Mapletyne CPO platform into an enterprise-ready, production-certified, and publication-grade state, execution is structured into **5 sequential phases**:

```
Remediation Execution Phases:
  ┌────────────────────────────────────────────────────────┐
  │ Phase 1: Immediate Critical Hotfixes                   │ (Days 1–2)  [9 Gaps]
  ├────────────────────────────────────────────────────────┤
  │ Phase 2: Security & Transport Hardening                │ (Days 3–5)  [12 Gaps]
  ├────────────────────────────────────────────────────────┤
  │ Phase 3: Architectural & Protocol Alignment            │ (Days 6–9)  [9 Gaps]
  ├────────────────────────────────────────────────────────┤
  │ Phase 4: Operational Resilience & Observability        │ (Days 10–12)[7 Gaps]
  ├────────────────────────────────────────────────────────┤
  │ Phase 5: Design System & UX Harmonization              │ (Days 13–15)[7 Gaps]
  └────────────────────────────────────────────────────────┘
```

### Phase 1: Immediate Critical Hotfixes (Days 1–2)
*Focus: Eliminate arbitrary takeover backdoors, runtime crashes, and public destructive endpoints.*
1. **Purge Backdoors & Signature Bypass:**
   - Remove lines 223–228 in `mapletyne-core/api/admin_auth.py` and lines 416–421 in `mapletyne-core/api/accounts.py`.
   - Remove lines 77–87 in `mapletyne-core/api/accounts.py` (`verify_signature: False`).
   - Remove hardcoded passwords in `mapletyne-core/main.py:176-177`.
2. **Lock Down Public Destructive Endpoints:**
   - Add `dependencies=[Depends(management_auth)]` to `admin_backup_router` (`api/main.py:137`) and `admin_update_router` (`api/main.py:136`).
   - Require authenticated driver or admin session in `POST /api/v1/public/sessions/{id}/stop` (`api/public_sessions.py:366`).
   - Implement JWT / session verification on `GET /api/v1/events/stream` (`api/events.py:44`).
3. **Fix Driver PWA Runtime Crash:**
   - Add `from fastapi.responses import FileResponse, HTMLResponse` and `from pathlib import Path` to `mapletyne-chargeapp/main.py`.

### Phase 2: Security & Transport Hardening (Days 3–5)
*Focus: Enforce cryptographic token validation, TLS/mTLS encryption, RBAC, and RLS data isolation.*
1. **Keycloak & RBAC Hardening:**
   - Enable `verify_aud=True` and `verify_iss=True` in `mapletyne-core/auth/keycloak_client.py:179`.
   - Remove `role == "user"` from `management_auth` in `api_key_auth.py:81` and implement role-scoped dependencies (`require_admin`, `require_site_operator`, `require_billing`).
   - Restrict Keycloak client redirect URIs and web origins in `realm-export.json`.
2. **Multi-Tenant Row-Level Security (RLS):**
   - Add Alembic migration adding `tenant_id UUID NOT NULL` to all tables in `ocpp` schema (`ADR-003`).
   - Enable `ROW LEVEL SECURITY` on tables and inject `SET LOCAL app.current_tenant_id` on connection pool checkout.
3. **Ingress & Transport Security:**
   - Configure Nginx (`nginx/default.conf`) with `listen 443 ssl;`, TLS 1.3 certificates, 301 HTTPS redirect, and HSTS headers.
   - Configure Nginx stream SSL passthrough for OCPP 2.0.1 mTLS Security Profile 3.
   - Move Nginx security headers into shared snippet to resolve header inheritance clearing.
   - Fix wildcard CORS by whitelisting explicit frontend origins.
4. **Secrets & CA Key Encryption:**
   - Enforce mandatory passphrase for root/sub-CA private keys via AES-256-GCM.
   - Disallow downloading private keys via REST API.

### Phase 3: Architectural & Protocol Alignment (Days 6–9)
*Focus: OpenAPI type safety contracts (`AD-2`), ISO 15118 V2G, OCPP schema validation, and CDR billing (`AD-10`).*
1. **OpenAPI `response_model` Pipeline:**
   - Add Pydantic response models across all 35 FastAPI router modules in `mapletyne-core/api/`.
   - Re-run `npm run codegen` in `mapletyne-admin` to generate strict TypeScript models and purge `any` casting.
2. **OCPP Protocol Validation & Concurrency:**
   - Add `jsonschema` validation against standard OCA schemas in `ocpp16/protocol.py` and `ocpp201/protocol.py`.
   - Replace `SELECT MAX(transaction_id) + 1` with PostgreSQL sequence `ocpp.transaction_id_seq`.
   - Gate test RFID tags (`DEADBEEF`, `04A1B2C3`) behind simulation environment flag.
3. **Fiscal CDR Billing Alignment (`AD-10`):**
   - Refactor `generate_cdr` to resolve assigned site/charger tariff from `ocpp.tariffs`, default to UK GBP (`£`), and compute VAT based on organization settings.
4. **Mount OCPI 2.2.1 Roaming:**
   - Mount `ocpi_app` onto FastAPI in `mapletyne-core/api/main.py:151`.
5. **ISO 15118-20 V2G / PnC Implementation:**
   - Implement EXI decoding/encoding and integrate V2G state machine in `mapletyne-core/iso15118/`.

### Phase 4: Operational Resilience & Observability (Days 10–12)
*Focus: Compose topology, Redis persistence, Prometheus metrics, SSE migration, and virtualization.*
1. **Container Topology & Network Isolation:**
   - Bind microservice ports (`34800`, `34100`, `34201`, `34000`, `34003`, `34085`) to `127.0.0.1` or internal Docker network.
   - Add Keycloak 26 and Nginx service blocks to `docker-compose.prod.yml`.
   - Mount persistent storage volume `redis-data:/data` and enable AOF in `docker-compose.yml`.
2. **Observability & Health Probes:**
   - Implement `GET /metrics` exporting native Prometheus counters and histograms (`RELIABILITY.md`).
   - Refactor `/health/ready` to return HTTP 503 when primary DB is unreachable, and add `/api/healthz`.
   - Add 30-second graceful drain loop sending close frame 1012 on `SIGTERM`.
3. **SSE Invalidation & Virtualization:**
   - Strip all 10 `refetchInterval` polling hooks from admin components and wire cache invalidation to SSE stream (`AD-3`).
   - Implement `@tanstack/react-virtual` with locked 40px row heights in `ChargersPage`, `SessionsPage`, `RfidFleetPage`, and `VehiclesPage` (`AD-6`).
   - Bind `SessionChargingProfileChart.tsx` to real meter value timeseries data.

### Phase 5: Design System & UX Harmonization (Days 13–15)
*Focus: Eliminate mock stubs, purge legacy branding/locales, and enforce Material Symbols.*
1. **Eliminate Operator Mock Stubs:**
   - Wire dynamic session mapping in `DashboardPage.tsx` active sessions table.
   - Wire `ProfilePage.tsx` to `/api/v1/users/me` and implement real certificate/RFID modal actions.
   - Complete 4-step provisioning wizard in `OnboardingPage.tsx`.
   - Wire digital signature persistence in `TermsPage.tsx`.
   - Fix `process.env` in `mapletyne-admin/src/lib/payload.ts`.
2. **Design System & Iconography Conformance:**
   - Replace blue accents (`#2563eb`, `#0284c7`) in `cert_setup.html` and `privacy.html` with Forest Emerald MD3 tokens.
   - Replace inline Lucide SVGs and unicode emojis in `mapletyne-chargeapp` with Google Material Symbols (`material-symbols-outlined`).
   - Fix mobile hit targets (< 44px) on PWA dismiss, search clear, and favorite toggle buttons.
3. **Purge Dutch Locales & Legacy Branding:**
   - Replace Dutch defaults (`laadbon`, `nl`, `+31`, `€`, `Fout`) with British English defaults (`receipt`, `en`, `+44`, `£`).
   - Rename legacy "OpenCPO" labels and filenames to Mapletyne standards (`GB*MTT`, `mapletyne-root-ca.crt`).

---

## 6. Verification & Reproduction Runbook

The following runnable bash commands allow any engineer or forensic auditor to independently verify and reproduce the findings documented in this register.

### 6.1 Authentication Backdoors & Signature Bypass Verification
```bash
# 1. Verify Universal Backdoor Passwords in Admin Auth
grep -n -C 3 "ZPn2bUrFWu2@tyYU" mapletyne-core/api/admin_auth.py
# Expected Output: Conditional bypass at lines 223-228 accepting backdoor strings and rewriting password_hash

# 2. Verify Universal Backdoor Passwords in Driver Auth
grep -n -C 3 "otaskies" mapletyne-core/api/accounts.py
# Expected Output: Conditional bypass at lines 416-421

# 3. Verify Cryptographic Signature Verification Bypass
grep -n -C 5 "verify_signature" mapletyne-core/api/accounts.py
# Expected Output: Line 78 contains jwt.decode(token, options={"verify_signature": False})

# 4. Verify Hardcoded Seeded Passwords on Startup
grep -n -C 2 "hashpw" mapletyne-core/main.py
# Expected Output: Lines 176-177 bcrypt hashing cleartext passwords
```

### 6.2 Public Dangerous Endpoints Verification
```bash
# 1. Verify Public Unauthenticated Backups Endpoint
curl -s -i http://localhost:34800/api/v1/admin/backups
# Expected Output: HTTP/1.1 200 OK returning backup list without credentials

# 2. Verify Public Unauthenticated Update Status Endpoint
curl -s -i http://localhost:34800/api/v1/admin/update/status
# Expected Output: HTTP/1.1 200 OK returning update execution history unauthenticated

# 3. Verify Public Live Event Bus Stream
curl -s -m 2 -i http://localhost:34800/api/v1/events/stream
# Expected Output: HTTP/1.1 200 OK, Content-Type: text/event-stream; charset=utf-8 streaming live events

# 4. Verify Public Session Stop Route Declaration
grep -n -C 2 "async def public_stop_session" mapletyne-core/api/public_sessions.py
# Expected Output: Line 366 declares unauthenticated endpoint dispatching RemoteStopTransaction
```

### 6.3 Driver PWA Runtime Crash Verification
```bash
# 1. Verify Undefined FileResponse / Path / HTMLResponse in main.py
grep -n "FileResponse\|HTMLResponse\|Path(" mapletyne-chargeapp/main.py
# Verify absence of imports
grep -n "import.*FileResponse\|from.*import.*Path" mapletyne-chargeapp/main.py
# Expected Output: Handlers call FileResponse/Path at lines 27, 35, 50, 53, 58, 59 with 0 imports

# 2. Programmatic Execution of Crash Bug
python3 -c "
import sys
sys.path.insert(0, 'mapletyne-chargeapp')
import asyncio, main
try:
    asyncio.run(main.pwa_manifest())
except NameError as e:
    print('VERIFIED RUNTIME CRASH:', e)
"
# Expected Output: VERIFIED RUNTIME CRASH: name 'FileResponse' is not defined
```

### 6.4 Ingress & Transport Encryption Verification
```bash
# 1. Verify Ingress Listens Exclusively on HTTP Port 80
grep -n "listen" nginx/default.conf
# Expected Output: All server blocks specify listen 80; zero listen 443; zero ssl_certificate directives

# 2. Verify Probe to Ingress Gateway
curl -s -I http://localhost:34080/
# Expected Output: Plaintext HTTP response with zero HSTS or SSL encryption

# 3. Verify Nginx Security Header Dropping on Document Root
curl -s -I http://localhost:34000/
# Expected Output: Headers omit X-Frame-Options, Content-Security-Policy, and X-Content-Type-Options
```

### 6.5 Polling Violations & Virtualization Absence Verification
```bash
# 1. Verify Prohibited Polling (refetchInterval) in Admin Components
grep -rn "refetchInterval" mapletyne-admin/src/
# Expected Output: 10 matches across DashboardPage, SessionsPage, VehiclesPage, EmsPage, etc.

# 2. Verify Complete Absence of DOM Virtualization
grep -rn "useVirtualizer" mapletyne-admin/src/
# Expected Output: 0 matches (Empty result confirming @tanstack/react-virtual is unused)
```

### 6.6 Backend Protocol & Billing Gaps Verification
```bash
# 1. Verify Hardcoded CDR Billing Engine (€0.35/kWh, 21% VAT, EUR)
sed -n '298,317p' mapletyne-core/ocpp16/session.py
# Expected Output: Hardcoded Decimal("0.35"), Decimal("0.21"), and "EUR"

# 2. Verify Concurrency Bottleneck on Transaction ID
sed -n '45,49p' mapletyne-core/ocpp16/session.py
# Expected Output: SELECT COALESCE(MAX(transaction_id), 0) + 1 table locking query

# 3. Verify Empty ISO 15118 Module
ls -la mapletyne-core/iso15118/
sed -n '88,95p' mapletyne-core/ocpp201/security.py
# Expected Output: 0-byte __init__.py and exiResponse: ""

# 4. Verify Orphaned OCPI Application
grep -rn "ocpi_app" mapletyne-core/
# Expected Output: Instantiated in ocpi/main.py:17 but never mounted in api/main.py
```

### 6.7 Design System, Localization & Branding Verification
```bash
# 1. Verify Electric Blue Leaks in Driver PWA
grep -n "#2563eb" mapletyne-chargeapp/templates/cert_setup.html mapletyne-chargeapp/templates/privacy.html
# Expected Output: Matches in cert_setup.html lines 14, 19, 27 and privacy.html lines 16, 27, 36, 43, 50, 59

# 2. Verify Dutch Language Strings & Defaults
grep -rn "laadbon" mapletyne-chargeapp/
grep -rn "QR-code niet gevonden" mapletyne-chargeapp/
grep -n "language" mapletyne-chargeapp/plugins/account/routes.py
# Expected Output: Dutch PDF filename in receipt.py:43, Dutch error in qr.py:33, "nl" default in routes.py:131

# 3. Verify Legacy OpenCPO Branding Artifacts
grep -rn "OpenCPO V2G Root CA" mapletyne-admin/src/
grep -rn "opencpo-root-ca.crt" mapletyne-chargeapp/templates/
# Expected Output: Matches in PkiVaultPage.tsx lines 161, 177, 193 and cert_setup.html line 142
```
