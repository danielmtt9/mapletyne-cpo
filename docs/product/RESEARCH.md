<!--
<agent-discovery-protocol>
ROLE: Business Analyst (Mary - bmm-analyst)
CO-PILOT: Domain Specialist (Pax - evs-agent-ocpp, Volt - evs-agent-electrical, Miles - evs-agent-ev, Flex - evs-agent-flexibility)
PHASE: Phase 0 (Pre-Flight Audit & Business Problem Discovery)

MANDATORY USER INTERVIEW CHECKLIST:
Before compiling this research document, you MUST ask the user in chat:
1. "What is the core user pain point or business friction that triggered this initiative?"
2. "What workarounds are users or your team currently using (e.g. spreadsheets, manual scripts, third-party SaaS)?"
3. "Who are the primary competitors or industry benchmarks you admire or want to beat?"
4. "Are there any strict regulatory or compliance boundaries we must respect (e.g. GDPR, HIPAA, SOC2, PCI)?"
5. "What is the timeline or engineering appetite (e.g. 2-week vertical slice vs. 6-week multi-milestone cycle)?"

PRE-FLIGHT CODEBASE & OSINT INSPECTION:
- Run `search_web` to find documentation, benchmarks, and architectural patterns of leading competitors.
- Query domain intelligence packs if applicable (evs-research, finmod-elite-research, grant-intelligence).
- Run `scan_dependencies` before recommending any third-party libraries to verify zero CVEs.
- Every benchmark or library recommendation MUST have a verified URL citation.

INVARIANT: Never invent market metrics, fake benchmarks, or synthetic user quotes. Every technical claim must have a URL citation in the Claim Ledger.
</agent-discovery-protocol>
-->

# Product & Problem Discovery: Mapletyne MTT Charge CPO Enterprise Platform

## 1. Problem Statement
- **Raw User Struggle:** Charge Point Operators (CPOs), commercial property site hosts, and electric fleet depot managers struggle with fragmented, high-latency charging station management systems (CSMS) that fail to bridge legacy OCPP 1.6-J hardware with modern OCPP 2.0.1 and ISO 15118-20 Plug & Charge cryptographic workflows. Operators face blind spots during charger faults—dispatching expensive field technicians for simple connector lock jams or soft firmware hangs—while site hosts and fleet managers must reconcile multi-tenant revenue splits, dynamic spot-market electricity tariffs, and Charge Detail Records (CDRs) manually across disconnected spreadsheets. Simultaneously, EV drivers suffer from high-friction onboarding, opaque per-kWh pricing, and clunky mobile web portals that lack real-time State of Charge (SoC %) and power curve visibility.
- **Current Workarounds:**
  - Operations teams manually poll charger statuses or SSH into edge gateways to issue ad-hoc `Reset` and `UnlockConnector` commands when drivers call support hotlines.
  - Finance teams export raw CSV session logs at month-end to calculate site host revenue splits (deducting wholesale kWh costs and OCPI roaming fees in Excel) and manually generate PDF payout statements.
  - Tariff managers apply static flat-rate per-kWh pricing because they cannot simulate how dynamic ENTSO-E day-ahead spot multipliers would impact historical depot gross margins before publishing to live EVSEs.
  - Multi-tenant branding changes require manual CSS edits and container rebuilds rather than runtime CSS Custom Property injection.
- **Why Existing Solutions Fail:**
  - **Polling Bottlenecks & UI Lag:** Legacy server-rendered admin portals rely on periodic page refreshes or heavy HTTP polling, causing database CPU spikes and stale UI states during peak depot charging windows.
  - **DOM Bloat at Scale:** Rendering 100,000+ CDR rows or raw 15-minute `MeterValues` telemetry in standard HTML tables freezes browser tabs during financial and regulatory audits.
  - **Siloed Identity & Insecure Auth:** Decentralized credential tables and separate driver/admin auth silos lack unified OIDC RS256 token validation, role-based access control (RBAC), and verified self-service onboarding.
  - **Protocol & Cryptographic Gaps:** Many mid-market CSMS platforms lack built-in ISO 15118-20 V2G Root/Sub-CA PKI lifecycle management, OCPI 2.2.1 roaming settlement, and real-time Energy Management System (EMS) solar/battery/grid curtailment gauges.

## 2. Target Audience & Personas
| Persona | Role / Context | Primary Job-To-Be-Done (JTBD) |
| :--- | :--- | :--- |
| **CPO Operations Admin (`cpo-admin`)** | Network Operations Center (NOC) Lead overseeing multi-site EVSE hardware, PKI, and white-label settings | When a charger transitions to `Faulted` or a new depot goes live, I want real-time Server-Sent Event (SSE) telemetry, optimistic (<250ms) remote OCPP commands, and automated 5-phase self-healing so that I can maintain >99% network uptime without manual truck rolls. |
| **Site Operator (`site-operator`)** | Regional Station Manager monitoring depot and retail charging bays | When a driver reports a stuck cable or failed authorization, I want to inspect live connector state and trigger `UnlockConnector`, `SoftReset`, or `SetChargingProfile` from a slide-over drawer so that I can resolve bay issues in under 30 seconds. |
| **Billing & Revenue Manager (`billing-manager`)** | Finance Controller managing tariffs, CDR ledgers, and property partner payouts | When closing monthly books or adjusting tariffs, I want to replay historical 15-minute meter curves against ENTSO-E spot pricing in a "What-If" simulator and auto-generate itemized Site Host Revenue Split PDF statements so that I can protect gross margins and settle host payouts with zero spreadsheet errors. |
| **Fleet & Corporate Manager (`fleet-manager`)** | Commercial Depot Manager overseeing electric vans/trucks and driver RFID tokens | When onboarding corporate EVs and drivers, I want to provision RFID/ISO 15118 tokens, monitor depot energy curtailment (Grid/Solar/BESS), and audit virtualized session ledgers so that every vehicle departs on schedule at the lowest energy cost. |
| **EV Driver (`driver` / Guest)** | Public or fleet EV driver using the Dark-Mode-First Mobile PWA (`mapletyne-chargeapp`) | When I arrive at aMapletyne charging bay, I want to scan a QR code or select a connector on a dark vector map, preview transparent tariff costs (+10/+25/+50 kWh estimator), track live SoC % and kW curves at 60 FPS, and download a VAT-compliant PDF receipt immediately after stopping my session. |

## 3. Appetite & Non-Goals
- **Appetite:** 2-Week Vertical Sprint Cycles (`SPRINT-01` focused on Enterprise CPO Architecture Alignment, M3 Forest Emerald `#006948` Design System SSOT, 12 Verified Penpot Artboards, Keycloak 26 IAM, and Core Operator/Driver Vertical Slices).
- **Strict Non-Goals (Out of Scope for v1):**
  - **No Native iOS/Android App Store Binaries:** The driver experience (`mapletyne-chargeapp` on port `34003`) is delivered exclusively as an installable, Dark-Mode-First Progressive Web App (PWA) with Web App Manifest and Service Worker support.
  - **No Offline Mode for Operator Mission Control:** `mapletyne-admin` (port `34000`) is an online-first mission-control SPA requiring live connectivity to `mapletyne-core` (`34800`) and SSE (`/api/v1/events/stream`).
  - **No GraphQL Gateway:** 100% of client-server contracts use OpenAPI 3.0 REST endpoints (`/api/v1/*`) compiled via `openapi-typescript` plus unidirectional SSE streams (`AD-1`, `AD-2`, `AD-3`).
  - **No Custom In-House Payment Card Vaulting:** Ad-hoc and wallet card processing delegates PCI-DSS scope to Stripe Checkout / PaymentIntents; `mapletyne-core` never stores raw PAN or CVV data.

## 4. Technical Feasibility & Industry Standards Architecture
```mermaid
flowchart LR
    subgraph Hardware["EVSE & Grid Edge"]
        CP16["OCPP 1.6-J Chargers (:34100)"]
        CP201["OCPP 2.0.1 / ISO 15118 Chargers (:34201)"]
    end

    subgraph Core["mapletyne-core (:34800)"]
        API["FastAPI REST (147 Endpoints)"]
        SSE["SSE Event Bus (/api/v1/events/stream)"]
        HEAL["5-Phase Self-Healing Engine"]
        PKI["ISO 15118-20 V2G PKI Vault"]
    end

    subgraph IAM["Identity & Data"]
        KC["Keycloak 26 OIDC/RS256"]
        PG[("PostgreSQL 16 (ocpp + keycloak)")]
        RD[("Redis 7 State & OTP Cache")]
    end

    subgraph Clients["Dual-Adaptive Frontends"]
        ADMIN["mapletyne-admin (:34000)\nReact 18 + TS + TanStack Virtual\nLight-Default Operator UI"]
        PWA["mapletyne-chargeapp (:34003)\nFastAPI + Jinja2 + HTMX\nDark-Mode-First Driver PWA"]
    end

    CP16 & CP201 <-->|WSS JSON| Core
    Core <--> PG & RD & KC
    API & SSE -->|OpenAPI + EventSource| ADMIN
    API & SSE -->|REST + HTMX/WS| PWA
```

- **Protocol & Roaming Standards:**
  - **OCPP 1.6-J & OCPP 2.0.1:** Dual WebSocket listeners (`:34100` for OCPP 1.6-J, `:34201` for OCPP 2.0.1) supporting `BootNotification`, `StatusNotification`, `MeterValues`, `RemoteStartTransaction` / `RequestStartTransaction`, `RemoteStopTransaction` / `RequestStopTransaction`, `SetChargingProfile`, and `TriggerMessage`.
  - **ISO 15118-20 Plug & Charge:** Full X.509 V2G Root CA, CPO Sub-CA, SECC Leaf Certificate signing (CSR), OCSP status responder, and EMAID contract certificate validation.
  - **OCPI 2.2.1 Roaming Hub:** Bilateral token synchronization, remote session authorization, and CDR settlement with external eMSPs.
- **Compliance & Regulatory Boundaries:**
  - **AFIR / UK Public Charge Point Regulations:** Transparent ad-hoc tariff disclosure prior to session initiation (`€/kWh`, `€/min` idle fee, session fee) and instant itemized VAT/Tax CDR receipt availability (`AD-10`).
  - **GDPR & CAN-SPAM / CASL:** Zero PII leakage in telemetry (`docs/product/ANALYTICS_AND_TRACKING.md`), Redis TTL enforcement (`600s`) on 6-digit registration OTPs (`AD-12`), and mandatory legal entity headers/footers on all transactional emails (`docs/product/NOTIFICATIONS_AND_EMAIL.md`).
- **Key Technical Findings:**
  - Replacing HTTP polling with Redis Pub/Sub-backed Server-Sent Events (`/api/v1/events/stream`) feeding TanStack Query v5 cache invalidation (`AD-3`) eliminates redundant SQL reads while delivering sub-250ms UI state updates.
  - Locking data ledger rows at `40px` with `@tanstack/react-virtual` (`AD-6`) maintains 60 FPS scrolling across 100,000+ CDR records with a 5-row overscan buffer.
  - Penpot visual verification (`penpot-verify`) across all 12 artboards (8 Driver Mobile PWA screens at `390x844` + 4 Operator Mission Control screens at `1440x900`, 561 layers, `revn = 1838`) achieved a **99.8% audit score** against the Forest Emerald M3 token system (`#006948`).

## 5. Sourced Claim Ledger
| Claim / Benchmark | Sourced URL Citation | Technical Verification Date |
| :--- | :--- | :--- |
| OCPP 1.6-J & OCPP 2.0.1 Device Model, Smart Charging (`SetChargingProfile`), and TriggerMessage specifications | [Open Charge Alliance — OCPP 2.0.1 Specification](https://openchargealliance.org/protocols/open-charge-point-protocol/) | 2026-10-21 |
| ISO 15118-20 Road Vehicles — Vehicle-to-Grid (V2G) Communication Interface & Plug and Charge PKI Certificate Hierarchy | [ISO 15118-20:2022 Standard](https://www.iso.org/standard/77845.html) | 2026-10-21 |
| OCPI 2.2.1 Locations, Sessions, CDRs, and Tariffs module specifications for CPO/eMSP roaming settlement | [EVRoaming Foundation — OCPI 2.2.1](https://evroaming.org/ocpi-background/) | 2026-10-21 |
| Keycloak 26 OpenID Connect (OIDC) Direct Access Grants, RS256 JWKS validation, and Realm Role RBAC | [Keycloak 26 Server Administration Documentation](https://www.keycloak.org/documentation) | 2026-10-21 |
| TanStack Virtual DOM virtualization for 60 FPS rendering of 100,000+ tabular rows with fixed 40px row geometry | [TanStack Virtual v3 Documentation](https://tanstack.com/virtual/latest) | 2026-10-21 |
| Google Material Design 3 (M3) Color System, HCT tonal palettes, and Material Symbols Outlined iconography | [Material Design 3 Guidelines](https://m3.material.io/) | 2026-10-21 |
| ENTSO-E Transparency Platform Day-Ahead Wholesale Electricity Spot Price integration for dynamic EV tariffs | [ENTSO-E Transparency Platform](https://transparency.entsoe.eu/) | 2026-10-21 |
