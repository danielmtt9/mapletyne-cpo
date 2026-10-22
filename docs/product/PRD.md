<!--
<agent-discovery-protocol>
ROLE: Product Manager (John - bmm-pm)
CO-PILOT: Business Analyst (Mary - bmm-analyst)
PHASE: Phase 1 (Product Strategy & Requirements Elicitation)

MANDATORY USER INTERVIEW CHECKLIST:
Ask the user directly in conversational chat before writing this PRD:
1. "Who is the primary end user, and what is their single most critical goal in this feature?"
2. "What are the non-negotiable Must-Haves for this sprint versus features we can safely classify as Won't-Have for v1?"
3. "What does the ideal user workflow look like from start to finish?"
4. "What catastrophic edge cases or failure modes must we guard against (e.g. payment dropouts, double submissions, offline state)?"
5. "What measurable success metric tells us this feature is working as intended in production?"

PRE-FLIGHT CODEBASE INSPECTION:
- Read `docs/product/RESEARCH.md` to review business pain points and verified competitor benchmarks.
- Inspect `package.json` and existing routes to avoid proposing redundant capabilities.

INVARIANT: All user stories must follow the Gherkin syntax (`Given / When / Then`). Do NOT create broad horizontal stories like "Build backend API"; every story must be an end-to-end vertical slice.
</agent-discovery-protocol>
-->

# Product Requirements Document: Mapletyne MTT Charge CPO Enterprise Platform

## 1. Executive Summary & Objective
- **Feature Name:** Mapletyne MTT Charge CPO Enterprise Suite (`mapletyne-core` CSMS Engine, `mapletyne-admin` Operator Mission Control, and `mapletyne-chargeapp` Driver Mobile PWA)
- **Target Release:** Sprint `SPRINT-01` (Enterprise CPO Alignment, M3 Forest Emerald `#006948` SSOT & Penpot Dual-Gate Verification)
- **High-Level Objective:** Deliver an industrial-grade, multi-tenant Charge Point Operator (CPO) and E-Mobility platform combining OCPP 1.6-J (`:34100`) & OCPP 2.0.1 / ISO 15118-20 (`:34201`) hardware orchestration, Keycloak 26 unified RS256 IAM, real-time Server-Sent Event (SSE) telemetry, automated 5-phase charger self-healing, multi-tenant site host revenue splits, "What-If" ENTSO-E dynamic tariff simulation, and a Dark-Mode-First Driver Mobile PWA—while maintaining `<250ms` optimistic command feedback, `60 FPS` virtualized table rendering across 100,000+ CDRs, and a verified `99.8%` Penpot M3 design compliance score across all 12 production artboards.

## 2. MoSCoW Prioritization Matrix
| Category | Requirement | Acceptance Criteria (Gherkin) |
| :--- | :--- | :--- |
| **Must Have** | **Keycloak 26 Unified OIDC IAM & 2-Step Email OTP Registration (`AD-11`, `AD-12`)** | Given a user submits credentials on `/login` or `/register`, When verified via Keycloak Direct Access Grant or 6-digit Redis OTP (`600s` TTL, max 5 attempts), Then issue RS256 `access_token` & `refresh_token` and enforce RBAC (`cpo-admin`, `site-operator`, `billing-manager`, `fleet-manager`, `driver`). |
| **Must Have** | **Real-Time Hardware Inventory, SSE Cache Invalidation & Optimistic Remote Commands (`AD-3`, `AD-8`)** | Given an operator views `mapletyne-admin` (`:34000`), When an EVSE emits `StatusNotification` or `MeterValues` over `/api/v1/events/stream` or the operator clicks `RemoteStart`/`RemoteStop`/`SoftReset`/`UnlockConnector`, Then update UI state within `<250ms` and invalidate TanStack Query keys without HTTP polling. |
| **Must Have** | **Virtualized Sessions & CDR Billing Ledger (`AD-6`, `AD-10`)** | Given 100,000+ Charge Detail Records (CDRs) in PostgreSQL, When the operator scrolls `/sessions` in `mapletyne-admin`, Then render fixed `40px` rows via `@tanstack/react-virtual` at `60 FPS` and generate VAT/Tax-compliant PDF invoices governed by the `organization` legal profile. |
| **Must Have** | **Driver Mobile PWA End-to-End Charging Flow (`mapletyne-chargeapp` `:34003`)** | Given an EV driver opens the Dark-Mode-First PWA (`#0B0F19` canvas), When they discover a station on the map, estimate cost (`+10/+25/+50 kWh`), initiate a charge, monitor live SoC % & kW curves, and slide to stop, Then settle the CDR and provide a 1-click VAT-compliant PDF receipt. |
| **Must Have** | **Dual-Adaptive M3 Forest Emerald Design System & White-Label Studio (`AD-7`, `AD-9`)** | Given the Forest Emerald M3 seed (`#006948`, highlights `#10B981`/`#48E260`, exclusively `material-symbols-outlined` icons, $\ge 12\text{px}$ font floor, $\ge 44\times 44\text{px}$ hit targets), When an admin updates `/settings/branding`, Then inject `:root` CSS variables immediately across `mapletyne-admin` and `mapletyne-chargeapp` without container rebuilds. |
| **Should Have** | **5-Phase Automated Fault Detection & Self-Healing Engine** | Given an EVSE reports `status == 'Faulted'` or `errorCode != 'NoError'`, When detected on the SSE event bus, Then sequentially execute Verification (`TriggerMessage`), Cable Unlock (`UnlockConnector`), Soft Reboot (`Reset(Soft)`), RFID Cache Flush (`ClearCache`), and Incident Webhook escalation. |
| **Should Have** | **Multi-Tenant Site Host Revenue Splits & "What-If" Tariff Simulator** | Given historical session telemetry and ENTSO-E Day-Ahead spot prices, When a `billing-manager` simulates dynamic multipliers or runs monthly host settlements, Then compute projected gross margin deltas and export itemized Site Host Payout PDF/CSV statements. |
| **Could Have** | **ISO 15118-20 PKI Vault & EMS Site Load Balancing Gauges** | Given an admin accesses `/pki` or `/ems`, When inspecting V2G Root/Sub-CA hierarchies or real-time Grid/Solar/Battery/EV load distribution, Then allow CSR signing, OCSP revocation, and dynamic `SetChargingProfile` kW curtailment. |
| **Won't Have** | **Native App Store Binaries, GraphQL Gateway, or Offline Admin Mode** | Explicitly excluded in v1 per `docs/ARCHITECTURE-SPINE.md` Section 7. |

## 3. User Stories & Gherkin Acceptance Criteria

### US-001: Unified Keycloak 26 Direct Grant Authentication & Two-Step Email OTP Onboarding
- **As a** CPO Operator (`cpo-admin`, `site-operator`, `billing-manager`, `fleet-manager`) or EV Driver (`driver`)
- **I want to** register with a 6-digit email OTP verification code and sign in directly from the branded login screen without jarring external redirects
- **So that** my account is provisioned in Keycloak 26 with cryptographic RS256 JWTs and strict role-based access control

```gherkin
Scenario: Two-step self-registration with Redis OTP verification and auto-login
  Given an unauthenticated user submits email, password, name, and requested role on step 1 of registration
  When the client sends POST "/api/v1/public/account/register/init" (or "/api/v1/admin/auth/register")
  Then "mapletyne-core" stores the pending registration and 6-digit OTP in Redis with a 600-second TTL and 5-attempt limit
  And dispatches a branded HTML + plaintext verification email via the configured SMTP provider
  When the user submits the valid 6-digit OTP within 600 seconds
  Then "mapletyne-core" provisions the user in Keycloak 26 ("POST /admin/realms/opencpo/users") with "emailVerified: true" and assigns the realm role
  And exchanges credentials via Keycloak Direct Access Grant ("/auth/realms/opencpo/protocol/openid-connect/token")
  And responds with HTTP 200 containing the RS256 "access_token", "refresh_token", and user profile
  And emits the "user:registered" and "user:authenticated" telemetry events
```

### US-002: Operator Mission Control Real-Time Charger Inventory & Optimistic Remote Commands
- **As a** CPO Operations Administrator (`cpo-admin`) or Site Operator (`site-operator`)
- **I want to** monitor live EVSE connector states via Server-Sent Events and dispatch remote OCPP commands (`RemoteStart`, `RemoteStop`, `SoftReset`, `UnlockConnector`, `SetChargingProfile`) with `<250ms` optimistic UI feedback
- **So that** I can operate high-density charging depots in real time without page reloads or duplicate command clicks

```gherkin
Scenario: Live SSE state invalidation and optimistic remote charger command execution
  Given the authenticated operator is viewing the Hardware Inventory screen in "mapletyne-admin" (:34000)
  And the client is subscribed to "GET /api/v1/events/stream" via EventSource
  When the operator opens the Charger Detail Drawer for "CP-LON-001" and clicks "Unlock Connector #1"
  Then the button immediately disables and renders an optimistic loading state within 250ms
  And the client sends POST "/api/v1/chargers/CP-LON-001/unlock?connector_id=1" with the RS256 Bearer token
  When "mapletyne-core" receives the OCPP "Unlocked" confirmation from "CP-LON-001" and broadcasts "charger.status" over SSE
  Then TanStack Query invalidates "['chargers']" and "['charger', 'CP-LON-001']"
  And the UI displays a confirmation toast and updates Connector #1 status badge without polling
```

### US-003: Automated 5-Phase Fault Detection & Tiered Self-Healing Pipeline
- **As a** CPO Operations Administrator (`cpo-admin`)
- **I want** the CSMS to automatically execute a tiered 5-phase remediation sequence whenever a charger reports `Faulted` or a non-zero `errorCode`
- **So that** transient hardware faults and stuck connector locks self-heal without dispatching a field technician

```gherkin
Scenario: Tiered self-healing escalation on EVSE StatusNotification fault
  Given "CP-DEPOT-04" is online and connected to "mapletyne-core" (:34100 or :34201)
  When "CP-DEPOT-04" sends an OCPP "StatusNotification" with "status: Faulted" and "errorCode: ConnectorLockFailure"
  Then the Self-Healing Engine initiates Phase 1 by sending "TriggerMessage(StatusNotification)"
  And if the connector remains faulted or stuck in "Finishing", executes Phase 2 "POST /api/v1/chargers/CP-DEPOT-04/unlock"
  And if the fault persists for >60 seconds, executes Phase 3 "POST /api/v1/chargers/CP-DEPOT-04/reset?reset_type=Soft"
  And if authorization cache errors occur, executes Phase 4 "POST /api/v1/chargers/CP-DEPOT-04/clear-cache"
  And if "CP-DEPOT-04" remains unresponsive after 180 seconds, executes Phase 5 by dispatching a signed incident payload to "/api/v1/events/webhooks" and alerting the operator via email/SMS
```

### US-004: Virtualized CDR Ledger & Multi-Tenant Site Host Revenue Split Settlement
- **As a** Billing Manager (`billing-manager`)
- **I want to** audit 100,000+ Charge Detail Records at 60 FPS and generate automated monthly Site Host Revenue Split settlement statements
- **So that** property partners receive accurate payouts deducting wholesale energy costs and OCPI commissions

```gherkin
Scenario: High-density virtualized CDR inspection and Site Host Payout calculation
  Given the authenticated "billing-manager" navigates to the Sessions & Billing view in "mapletyne-admin"
  When 100,000+ session records match the active filter
  Then "@tanstack/react-virtual" mounts only visible 40px rows plus a 5-row overscan buffer at 60 FPS
  When the billing manager selects Site "SITE-RETAIL-NORTH" and billing period "2026-10-01 to 2026-10-31"
  Then the system aggregates gross session revenue, subtracts wholesale electricity cost and OCPI partner commissions, and applies the contractual "Host Split %"
  And generates a downloadable PDF settlement statement and CSV export stamped with the "organization" legal entity and VAT/Tax ID ("AD-10")
```

### US-005: Advanced "What-If" Dynamic Tariff Simulator & 1-Click Production Publish
- **As a** Billing Manager (`billing-manager`) or CPO Admin (`cpo-admin`)
- **I want to** replay historical 15-minute charging meter samples against ENTSO-E Day-Ahead spot price formulas before activating a tariff
- **So that** I can verify gross margin impact and peak/off-peak sensitivity prior to live deployment

```gherkin
Scenario: Simulating dynamic spot tariff multipliers against historical sessions
  Given historical 15-minute meter values ("GET /api/v1/sessions/{session_id}/meter") and ENTSO-E spot prices ("GET /api/v1/pricing/current")
  When the operator configures "SimulatedPrice(t) = (SpotPrice_t * Multiplier) + MarginPerKwh" in the Tariff Simulator
  Then the UI renders a comparative baseline vs. simulated revenue and gross margin % chart within 500ms
  When the operator clicks "Publish to Production Tariffs"
  Then the client executes "PUT /api/v1/pricing/config"
  And invalidates the "['tariffs']" and "['pricing', 'current']" TanStack Query caches
```

### US-006: Driver Mobile PWA Station Discovery, Pre-Charge Estimator, Live Session & VAT Receipt
- **As an** EV Driver (`driver` or Guest)
- **I want to** find an available charger on a dark-mode map, preview estimated session cost (`+10/+25/+50 kWh`), start and monitor my live charge (SoC %, kW curve, accrued cost), and download a VAT receipt upon completion
- **So that** I have a transparent, low-friction charging experience on my mobile device

```gherkin
Scenario: Complete Driver Mobile PWA charging lifecycle
  Given an EV driver opens "mapletyne-chargeapp" (:34003) on a 390x844 mobile viewport in Dark Mode ("#0B0F19")
  When the driver selects an available CCS2 connector and taps the "+25 kWh" Estimator pill
  Then the bottom sheet displays the transparent tariff breakdown (€/kWh, idle fee/min, estimated duration, and total cost)
  When the driver taps "Start Charge" (44x44px minimum touch target)
  Then "mapletyne-core" dispatches "RemoteStartTransaction" to the EVSE and transitions the PWA to the Live Active Session view
  And streams real-time Battery SoC Ring (%), instant power (kW), energy delivered (kWh), and ECharts power/voltage curves
  When the driver slides to stop the session
  Then "mapletyne-core" dispatches "RemoteStopTransaction", finalizes the CDR, and transitions to the Receipt screen with 1-click PDF download
```

### US-007: Reactive White-Label Brand Studio & Multi-Tenant M3 Token Injection
- **As a** CPO Operations Administrator (`cpo-admin`)
- **I want to** customize company name, logos, support contact details, and primary/accent brand colors in `/settings/branding`
- **So that** both `mapletyne-admin` and `mapletyne-chargeapp` dynamically reflect our corporate identity without rebuilding containers

```gherkin
Scenario: Instant DOM CSS variable injection and PWA manifest propagation
  Given an authenticated "cpo-admin" opens "/settings/branding" in "mapletyne-admin"
  When the admin updates "primary_color", "accent_color", "company_name", or "logo_url" and clicks "Save Branding"
  Then the client sends PUT "/api/v1/settings/branding" (or POST "/api/v1/admin/setup/step/branding")
  And the "ThemeProvider" immediately writes updated CSS Custom Properties ("--color-primary", "--color-accent") to "document.documentElement.style" without a page reload
  And "mapletyne-chargeapp" dynamically serves the updated brand assets via "/skin/style.css", "/skin/logo.svg", and "/manifest.json"
```

### US-008: ISO 15118-20 PKI Certificate Vault & EMS Site Energy Curtailment
- **As a** CPO Operations Administrator (`cpo-admin`) or Energy Specialist (`site-operator`)
- **I want to** manage the ISO 15118 V2G Root/Sub-CA certificate hierarchy and monitor real-time Grid, Solar, Battery (BESS), and EV load balance gauges
- **So that** Plug & Charge sessions authenticate securely and depot loads never breach site transformer capacity limits

```gherkin
Scenario: Signing an SECC Leaf CSR and applying dynamic EMS load curtailment
  Given an authenticated "cpo-admin" views "/pki" or "/ems" in "mapletyne-admin"
  When a charger submits an ISO 15118 SECC Certificate Signing Request (CSR) or site load approaches transformer capacity
  Then the admin can sign or revoke certificates via "/api/v1/pki/*" and update site load limits via "/api/v1/ems/*"
  And "mapletyne-core" dispatches OCPP "SetChargingProfile" curtailment limits to active EVSEs and broadcasts updated "ems.telemetry" via SSE
```

## 4. Edge Cases & Boundary Conditions
- **SSE Connection Drop / Network Flap:** Both `mapletyne-admin` and `mapletyne-chargeapp` implement exponential backoff reconnection (`1s`, `2s`, `4s`, `8s`, max `30s`) on `/api/v1/events/stream`, displaying an amber `Offline / Reconnecting` status badge in the header and reconciling missed state via a targeted TanStack Query invalidation upon reconnect.
- **Duplicate Remote OCPP Commands (Double-Tap Prevention):** Remote action buttons (`RemoteStart`, `RemoteStop`, `SoftReset`, `UnlockConnector`) lock immediately upon click (`<250ms` optimistic mutation state) and attach an idempotency key (`X-Idempotency-Key`) until the OCPP `CallResult` or timeout (`30s`) resolves (`AD-8`).
- **Stuck Connector / Ghost Session Recovery:** If an EVSE loses WebSocket connectivity mid-session or fails to respond to `RemoteStopTransaction`, the 5-phase Self-Healing Engine triggers `TriggerMessage(StatusNotification)` $\rightarrow$ `UnlockConnector` $\rightarrow$ `Reset(Soft)` and flags the CDR for operator reconciliation rather than double-billing idle minutes.
- **OTP Brute-Force & Expiry Protection (`AD-12`):** Registration 6-digit email OTPs stored in Redis expire strictly after `600 seconds` (10 minutes) and lock after `5 failed attempts`, requiring a fresh rate-limited OTP request.
- **Expired RS256 JWT Mid-Session (`AD-11`):** The `openapi-fetch` client interceptor catches `HTTP 401 Unauthorized` responses, silently attempts a single token refresh via Keycloak's `refresh_token`, and only redirects to `/login` if the refresh grant is also expired or revoked.
