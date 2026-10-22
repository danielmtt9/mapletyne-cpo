# Mapletyne MTT Charge CPO Platform — Test Infrastructure & Architecture Specification

```yaml
title: Mapletyne MTT Charge CPO Platform Test Infrastructure & Architecture Specification
document_type: E2E Test Suite Infrastructure & Quality Gate Definition
version: 1.0.0
date: 2026-10-22
classification: Internal Engineering & QA Standard
author: Test Writer Subagent (Dual-Track E2E Testing Track)
target_platform: Mapletyne MTT Charge CPO Enterprise Platform
governing_standards:
  - AGENTS.md (Project Agent Instructions & Operational Invariants)
  - docs/ARCHITECTURE-SPINE.md (Architectural Decisions AD-1 through AD-12)
  - docs/audits/GAP_AUDIT_REGISTER.md (Gap Remediation Tracking)
  - .agents/teamwork/orchestrator_3/PROJECT.md (Feature Inventory)
```

---

## 1. Executive Summary & Test Infrastructure Topology

The **Mapletyne MTT Charge CPO Enterprise Platform** requires an opaque-box, multi-service End-to-End (E2E) automated verification suite. Testing operates strictly over external interfaces (HTTP/REST, WebSocket, SSE streams, Keycloak OIDC flows, PostgreSQL queries, and container port boundaries) without instrumenting internal application code.

### 1.1 Service Interface Topology

| Microservice | Internal Container Port | Host Port Binding | Protocol | Primary Route / Gateway Mount |
| :--- | :---: | :---: | :---: | :--- |
| **Edge Ingress Gateway (`nginx`)** | `80` | `34080` | HTTP / WS | Reverse proxy root `/`, `/api/`, `/app/`, `/auth/` |
| **Core CSMS Engine (`mapletyne-core`)** | `8000` | `34800` | HTTP / SSE | `/api/v1/`, `/health`, `/metrics`, `/docs` |
| **OCPP 1.6-J WebSocket Server** | `9100` | `34100` | WS / WSS | `ws://host:34100/{charge_point_id}` |
| **OCPP 2.0.1 WebSocket Server** | `9201` | `34201` | WS / WSS | `ws://host:34201/{charge_point_id}` |
| **Keycloak 26 IAM Provider** | `8080` | `34085` | HTTP / OIDC | `/auth/realms/opencpo/` |
| **Operator Mission Control (`mapletyne-admin`)** | `8080` | `34000` | HTTP | Single Page App (React 18 + Vite + M3) |
| **Driver Mobile PWA (`mapletyne-chargeapp`)** | `8003` | `34003` | HTTP / HTMX | `/app/`, `/skin/`, `/receipt/` |
| **Virtual Charger Farm (`charger-farm`)** | `8087` | `34087` | HTTP / WS | Simulator UI & synthetic chargers |
| **PostgreSQL 16 Multi-Tenant Database** | `5432` | `5432` / `54321` | TCP / PG | Schema `ocpp` with RLS policies |
| **Redis 7 Event Bus & Rate Limiter** | `6379` | `6379` | TCP / RESP | Pub/Sub, Streams, Sliding Window Keys |

---

## 2. 4-Tier Test Methodology & Coverage Framework

The test suite implements a rigorous 4-Tier verification hierarchy guaranteeing comprehensive, boundary-tested, interaction-tested, and scenario-tested coverage across all 40 features in the `PROJECT.md § Feature Inventory`.

```
┌────────────────────────────────────────────────────────────────────────┐
│             TIER 4: Real-World Application Workload Scenarios          │
│   (Depot Fleet Charging, Ad-Hoc Driver PWA QR + Receipt, RLS Isolation)│
├────────────────────────────────────────────────────────────────────────┤
│             TIER 3: Cross-Feature Pairwise Interactions                │
│    (RLS + RBAC, Ingress Tunnel + Keycloak OIDC, SSE + Virtualization)  │
├────────────────────────────────────────────────────────────────────────┤
│             TIER 2: Boundary & Corner Cases (Negative Invariants)      │
│  (Expired Tokens, Invalid Audiences, Rate Limits, Zero-Duration CDRs)  │
├────────────────────────────────────────────────────────────────────────┤
│             TIER 1: Feature Coverage (Opaque-Box Contract)             │
│ (Auth/Keycloak, Ingress, RBAC, RLS, Protocols, Billing, Frontends, Ops)│
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Tier 1: Feature Coverage
Validates the fundamental contract (happy path) for all 8 core feature areas. Each feature area contains a minimum of 5 distinct test cases (total >= 40 tests):
1. **Auth & Keycloak 26**: OIDC discovery, direct grant token issuance, token refresh, RS256 token claims & TTL, client allowed redirect/webOrigins.
2. **Edge Ingress Gateway**: Forwarded header preservation (`X-Forwarded-Host`, `X-Forwarded-Proto`, `X-Forwarded-For`), edge security headers (HSTS, CSP, nosniff), dynamic origin detection, strict CORS allowlist without wildcard credentials.
3. **RBAC (Role-Based Access Control)**: Granular route access across `admin`, `operator`, `driver`, `technician`, with 401 unauthenticated and 403 unauthorized enforcement.
4. **RLS (Row-Level Security & Multi-Tenancy)**: Data schema `tenant_id` validation, tenant data partitioning, cross-tenant read/write isolation, default tenant fallback.
5. **Protocols (OCPP 1.6-J, 2.0.1, ISO 15118-20)**: WebSocket handshakes, subprotocol negotiation, `BootNotification` schema validation, ISO 15118 PKI certificate authority hierarchy and PnC contract validation.
6. **Billing & Dynamic Tariffs**: Dynamic tariff-driven CDR energy calculation ($kWh \times rate$), parking overtime fees, VAT/tax breakdown, transaction ID database sequence allocation, OCPI 2.2.1 CDR export.
7. **Frontends (Admin & Driver PWA)**: Driver PWA responsive 390px viewport and dark M3 canvas, CSRF protection on driver forms, Admin Mission Control shell & Forest Emerald tokens, real-time SSE `/api/v1/events/stream`, table virtualization contracts.
8. **Operations & Observability**: Prometheus `/metrics` CSMS telemetry, health and readiness probes (`/health`, `/health/ready`), Redis event bus Pub/Sub, container host port binding, security audit logging.

### 2.2 Tier 2: Boundary & Corner Cases
Evaluates system resilience against extreme values, malicious inputs, boundary conditions, and negative invariants (>= 25 tests):
1. **Expired & Clock-Skewed Tokens**: Past expiration timestamps, future clock skew (`nbf`/`iat`), malformed JWT payloads, untrusted key IDs (`kid`), and `alg: none` rejection.
2. **Invalid Audiences & Issuers**: Mismatched audience (`aud`), spoofed issuer domain, foreign realm tokens, missing client ID (`azp`), client credentials token impersonation attacks.
3. **Missing & Malformed Ingress Headers**: Missing `Host` header, malformed `X-Forwarded-For` injection, conflicting protocol headers, missing `Bearer` authorization prefixes, oversized header buffers (>16KB).
4. **Extreme Rate Limits & Brute-Force Stress**: Sliding window burst limits triggering HTTP 429 with `Retry-After`, 5-attempt OTP lockout with 600s TTL, IP spoofing resistance, concurrent authentication flooding.
5. **Zero-Duration & Extreme Billing Sessions**: Zero-duration / zero-energy sessions (plugged and immediately unplugged), negative meter value deltas (meter counter rollbacks), extreme megawatt-hour energy sessions, multi-day idle parking fees, free tariff zero-invoices.

### 2.3 Tier 3: Cross-Feature Combinations
Evaluates pairwise emergent behavior across subsystem boundaries (>= 10 tests):
- `RLS + RBAC`: Administrative authority bounded by tenant boundary (Tenant A Admin cannot alter Tenant B chargers).
- `Ingress Tunnel + Keycloak OIDC`: Cloudflare Tunnel domain forwarded through Nginx matches Keycloak OIDC token validation.
- `SSE Event Bus + DOM Virtualization`: Burst telemetry stream invalidations maintain stable virtualized table row rendering.
- `OCPP 1.6-J + Dynamic Tariff Engine`: Full transaction lifecycle (`Boot` -> `Start` -> `Meter` -> `Stop`) seamlessly produces calculated CDR.
- `Rate Limiting + Multi-Tenancy`: Tenant A request volume saturation does not starve Tenant B rate limits.
- `Keycloak Token Refresh + Active Session`: Refreshing credentials mid-session preserves active transaction telemetry.
- `OCPI Roaming + Dynamic Tariffs`: Roaming partner tokens dynamically resolve MSP-specific tariff structures.
- `CSRF Protection + Session Cookies`: Driver state changes strictly validate matched CSRF token and session context.
- `Prometheus Metrics + Heavy Load`: Concurrent charging sessions accurately report active transaction gauges.
- `PKI Revocation + ISO 15118 Handshake`: Revoked certificate triggers immediate authorization refusal and audit logging.

### 2.4 Tier 4: Real-World Application Workload Scenarios
Simulates complete enterprise workflows (>= 5 end-to-end scenarios):
- **Scenario 1**: Depot Fleet Overnight Charging Flow (Connecting, Authorizing, Charging, EMS Peak Shaving throttle, Disconnecting, Storing CDR).
- **Scenario 2**: Driver Ad-Hoc Mobile PWA QR Scan, Real-Time Meter Telemetry, Session Completion, and Digital Receipt.
- **Scenario 3**: Multi-Tenant Operator Fleet & Tariff Isolation under Concurrent Operations.
- **Scenario 4**: Charger Watchdog Self-Healing & Fault Recovery (`StatusNotification(Faulted)` -> Soft Reset -> `Available`).
- **Scenario 5**: Peak Shaving & Smart Charging Energy Dispatcher (Site grid overload triggering dynamic profile throttles).

---

## 3. Test Runner & Execution Guide

The test harness uses `pytest` with `httpx`, `requests`, `websockets`, `cryptography`, and `psycopg2`.

### 3.1 Directory Structure

```
tests/e2e/
├── __init__.py
├── conftest.py                   # Central fixtures, HTTP/WS clients, Keycloak token auth
├── test_tier1_features.py        # Tier 1: Feature Coverage (41 tests)
├── test_tier2_boundaries.py      # Tier 2: Boundary & Corner Cases (25 tests)
├── test_tier3_combinations.py    # Tier 3: Pairwise Cross-Feature Interactions (10 tests)
├── test_tier4_scenarios.py       # Tier 4: Real-World Workload Scenarios (5 tests)
├── test_penpot_visual_replication.py # Visual replication contract (M1-M6)
└── run_tests.sh                  # Master bash execution runner
```

### 3.2 CLI Execution Commands

```bash
# Run all E2E tests across all 4 tiers
./tests/e2e/run_tests.sh --all

# Run Tier 1 Feature Coverage tests only
./tests/e2e/run_tests.sh --tier 1

# Run Tier 2 Boundary & Negative tests only
./tests/e2e/run_tests.sh --tier 2

# Run Tier 3 Cross-Feature Combination tests only
./tests/e2e/run_tests.sh --tier 3

# Run Tier 4 Real-World Application Scenarios only
./tests/e2e/run_tests.sh --tier 4

# Direct Pytest Invocation with verbose output
python3 -m pytest tests/e2e/test_tier1_features.py -v
python3 -m pytest tests/e2e/test_tier2_boundaries.py -v
python3 -m pytest tests/e2e/test_tier3_combinations.py -v
python3 -m pytest tests/e2e/test_tier4_scenarios.py -v
```

### 3.3 Environment Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `CORE_BASE_URL` | `http://localhost:34800` | Direct REST API endpoint for `mapletyne-core` |
| `INGRESS_BASE_URL` | `http://localhost:34080` | Edge Ingress Gateway reverse proxy URL |
| `KEYCLOAK_BASE_URL` | `http://localhost:34085` | Keycloak 26 OIDC base URL |
| `ADMIN_BASE_URL` | `http://localhost:34000` | Operator Mission Control UI base URL |
| `DRIVER_BASE_URL` | `http://localhost:34003` | Driver Mobile PWA base URL |
| `OCPP16_WS_URL` | `ws://localhost:34100` | OCPP 1.6-J WebSocket listener |
| `OCPP201_WS_URL` | `ws://localhost:34201` | OCPP 2.0.1 WebSocket listener |
| `MANAGEMENT_API_KEY` | `opencpo_mgmt_api_91d4e021a8dcf8a3c9b7` | Master admin API key for management routes |
| `KEYCLOAK_ADMIN_PASSWORD` | `admin` | Keycloak master administrator password |

---

## 4. Quality Gates & Coverage Thresholds

| Quality Pillar | Threshold | Enforcement Mechanism |
| :--- | :---: | :--- |
| **Feature Coverage** | 100% of Feature Inventory | >= 5 test cases per feature area in Tier 1 |
| **Negative Invariant Coverage** | >= 5 tests per area | Tier 2 Boundary test suites |
| **Latency Floor (Optimistic UI)** | $< 250\text{ ms}$ | Timestamp delta validation on remote commands |
| **WebSocket Response Ceiling** | $< 2.0\text{ s}$ | `asyncio.wait_for` timeout bounds |
| **Execution Pass Rate** | 100% of implemented code | Pytest exit code 0 |
| **Defect Reporting** | Zero silent fixes | Strict escalation of any implementation gap |

---

## 5. Escalation & Defect Reporting Protocol

As Test Writer subagent with `qa` and `specialist` roles:
1. **Never modify implementation code**: Under no circumstances should backend or frontend source files be altered to make a test pass.
2. **Authoritative Expected Output**: All expected responses must derive directly from `PROJECT.md`, `GAP_AUDIT_REGISTER.md`, and official standards (OCPP 1.6-J / 2.0.1, OIDC, ISO 15118-20).
3. **Escalation Mechanism**: When a test fails due to an underlying platform defect (such as missing RLS migration, absent route guards, or unhandled headers), document the failure with exact request/response data in `handoff.md` and report it directly to the orchestrator.
