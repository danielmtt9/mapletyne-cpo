# Architectural Decision Records (ADRs — Michael Nygard Standard)

**Specification Version:** 3.2.0  
**Lead Architects:** Winston (System Architect), Pax (OCPP Specialist), Volt (Electrical Engineer)  
**Invariant Rule:** Accepted ADRs represent immutable architectural constraints for the Mapletyne MTT Charge CPO platform. Future engineers and AI coding agents are strictly prohibited from violating or reversing accepted ADRs without explicit architectural sign-off.

---

## ADR Index

| ADR ID | Title | Domain | Status | Date |
| :--- | :--- | :--- | :---: | :---: |
| **ADR-001** | Dual-Stack Asyncio OCPP 1.6-J (`34100`) & 2.0.1 (`34201`) Engine with Redis Socket Routing | Backend / OCPP | Accepted | 2026-10-14 |
| **ADR-002** | Exclusive Google Material Symbols Iconography & 0px Industrial Geometry | Frontend / UI | Accepted | 2026-10-14 |
| **ADR-003** | Hybrid Multi-Tenancy: Database-per-Tenant Naming & PostgreSQL RLS (`tenant_id`) | Database / Security | Accepted | 2026-10-15 |
| **ADR-004** | TimescaleDB Hypertables for High-Frequency 3-Phase Meter Values | Telemetry / DB | Accepted | 2026-10-15 |
| **ADR-005** | Server-Sent Events (SSE) with TanStack Query Invalidation over Client Polling | Real-Time / API | Accepted | 2026-10-16 |
| **ADR-006** | Keycloak 26 OIDC/RS256 Unified IAM with Two-Step Redis OTP Registration | Security / Auth | Accepted | 2026-10-17 |
| **ADR-007** | Autonomous Closed-Loop EMS & Two-Tier Self-Healing Charger Watchdog | Electrical / EMS | Accepted | 2026-10-18 |
| **ADR-008** | Built-In Hierarchical ISO 15118-20 V2G PKI Authority & mTLS Security Profile 3 | PKI / V2G | Accepted | 2026-10-19 |
| **ADR-009** | Immutable Fiscal CDRs & Organization Legal Authority Single Source of Truth | Billing / OCPI | Accepted | 2026-10-20 |
| **ADR-010** | SQLAlchemy 2.0 Async (`asyncpg`) + Pydantic v2 Strict OpenAPI Codegen | Backend / DX | Accepted | 2026-10-21 |

---

### 2026-10-14 — ADR-001: Dual-Stack Asyncio OCPP 1.6-J (`34100`) & 2.0.1 (`34201`) Engine with Redis Socket Routing
- **Status:** Accepted
- **Context:** Commercial CPO networks operate heterogeneous hardware fleets combining legacy AC/DC chargers speaking OCPP 1.6-J and modern high-power/depot chargers speaking OCPP 2.0.1 with ISO 15118 Plug & Charge. Furthermore, when scaling horizontally or separating REST API workers from WebSocket listeners, an HTTP `RemoteStartTransaction` or `SetChargingProfile` request may land on a worker that does not hold the target charger's physical TCP WebSocket connection.
- **Decision:** Run dedicated Python 3.12 `asyncio` WebSocket servers on host port `34100` (container `9100`, subprotocol `ocpp1.6`) and host port `34201` (container `9201`, subprotocol `ocpp2.0.1`), backed by Redis session routing (`mtt:{env}:{tenant}:ws:route:{cp_id}`) and Redis Pub/Sub command channels (`mtt:{env}:{tenant}:ws:cmd:{cp_id}`). Evaluated and rejected running a single port with path-only multiplexing due to load-balancer mTLS policy differences between OCPP 1.6 Security Profile 1/2 and OCPP 2.0.1 Security Profile 3.
- **Consequences:** Enables zero-downtime horizontal scaling of REST workers (`:34800`) independent of stateful WebSocket gateways. Requires a 30-second `SIGTERM` drain grace period on `mapletyne-core` containers so chargers can gracefully reconnect without losing active transaction state.

---

### 2026-10-14 — ADR-002: Exclusive Google Material Symbols Iconography & 0px Industrial Geometry
- **Status:** Accepted
- **Context:** Mixing icon libraries (`lucide-react`, `@fortawesome`, `@heroicons`) and rounded consumer-grade UI cards across operator dashboards caused 140KB+ bundle bloat and diluted the high-density industrial SCADA mission-control aesthetic.
- **Decision:** Enforce Google Material Symbols (`material-symbols-outlined`) as the sole iconography Single Source of Truth across `mtt-admin` and `mtt-charge-app`, and lock all interactive UI primitives to `0px` sharp border radius (`rounded-none`) with 40px virtualized table rows (`@tanstack/react-virtual`).
- **Consequences:** Never import `lucide-react`, `react-icons`, or `heroicons`. All large tables (>100 rows) must use virtualized rendering.

---

### 2026-10-15 — ADR-003: Hybrid Multi-Tenancy: Database-per-Tenant Naming & PostgreSQL RLS (`tenant_id`)
- **Status:** Accepted
- **Context:** Enterprise fleet customers require strict cryptographic and logical data isolation for regulatory compliance, independent point-in-time recovery (PITR), and protection against noisy-neighbor telemetry spikes, while multi-site sub-operators within a tenant cluster require row-level isolation.
- **Decision:** Adopt the deterministic 4-segment PostgreSQL database naming convention `{platform}_{environment}_{tenant_slug}_{domain}` (e.g., `mapletyne_prod_fleetalpha_core`) owned by scoped credentials (`mtt_{tenant_slug}_user`), paired with mandatory `tenant_id UUID NOT NULL` columns and PostgreSQL Row-Level Security (RLS) policies on every table in the `ocpp` schema. Redis keys are strictly namespaced as `mtt:{environment}:{tenant_slug}:{resource}:{id}`.
- **Consequences:** Every database transaction in `mapletyne-core` must execute `SET LOCAL app.current_tenant_id = '<tenant_uuid>'` via SQLAlchemy session checkout listeners. Raw unscoped queries or unprefixed Redis keys are forbidden.

---

### 2026-10-15 — ADR-004: TimescaleDB Hypertables for High-Frequency 3-Phase Meter Values
- **Status:** Accepted
- **Context:** A 200-charger DC fast-charging depot reporting 3-phase `MeterValues` (`L1/L2/L3` voltage, current, active/reactive power, frequency, THD, SoC, cable temperature) every 5–15 seconds generates over 115 million rows per month. Standard PostgreSQL B-tree tables suffer severe index bloat, vacuum stalls, and slow historical charting queries at this volume.
- **Decision:** Store all time-series telemetry in a TimescaleDB hypertable (`ocpp.meter_values`) partitioned into 7-day chunks on `timestamp`, compressed column-wise after 14 days (`timescaledb.compress`), and pre-aggregated via continuous aggregates (`ocpp.meter_values_hourly`, `ocpp.meter_values_daily`).
- **Consequences:** Cuts telemetry storage footprint by >85% and keeps `/api/v1/sessions/{id}/meter` and `/api/v1/sessions/stats/daily` queries under 25ms. Standard `DELETE` operations on compressed chunks are replaced by automated retention policies (365-day retention).

---

### 2026-10-16 — ADR-005: Server-Sent Events (SSE) with TanStack Query Invalidation over Client Polling
- **Status:** Accepted
- **Context:** Operator dashboards monitoring 500+ chargers previously polled `/api/v1/chargers` and `/api/v1/ems/live` every 3 seconds, saturating PostgreSQL connection pools and causing UI jitter. Bidirectional WebSockets for browser clients introduced unnecessary firewall/proxy drop issues.
- **Decision:** Use unidirectional HTTP/2 Server-Sent Events (`GET /api/v1/events/stream` and `GET /api/v1/events/chargers/{cp_id}/live`) backed by Redis Pub/Sub (`mtt:{env}:{tenant}:pubsub:events`). The frontend `useLiveEvents` hook consumes SSE frames and selectively invalidates TanStack Query v5 cache keys (`['chargers']`, `['telemetry', cp_id]`, `['ems', 'live', site_id]`).
- **Consequences:** Client `refetchInterval` polling is banned for charger states and meter telemetry. NGINX ingress must configure `proxy_buffering off` and `proxy_read_timeout 3600s` on `/api/v1/events/*`.

---

### 2026-10-17 — ADR-006: Keycloak 26 OIDC/RS256 Unified IAM with Two-Step Redis OTP Registration
- **Status:** Accepted
- **Context:** Custom password hashing and fragmented admin vs. driver authentication tables created maintenance risk and lacked enterprise SSO/SAML federation and standardized RBAC claims.
- **Decision:** Standardize all human authentication on Keycloak 26 (`opencpo` realm) issuing RS256 JWTs verified by `mapletyne-core` via cached JWKS public keys. Preserve the custom glassmorphic login experience via Direct Access Grants (`POST /api/v1/admin/auth/login`), and enforce a 2-step self-registration flow where Step 1 caches pending credentials and a 6-digit OTP in Redis (`600s` TTL, max 5 attempts) dispatched via SMTP before Step 2 provisions the verified user in Keycloak.
- **Consequences:** `mapletyne-core` never stores plaintext or hashed user passwords in `ocpp` tables. M2M integrations continue to support `X-API-Key` header authentication.

---

### 2026-10-18 — ADR-007: Autonomous Closed-Loop EMS & Two-Tier Self-Healing Charger Watchdog
- **Status:** Accepted
- **Context:** Unmanaged simultaneous EV charging at fleet depots trips main PCC breakers and incurs punitive utility demand charges. Additionally, transient EVSE hardware faults (stuck connector locks, pilot signal glitches) required manual operator intervention at 03:00 AM.
- **Decision:** Embed a closed-loop Autonomous EMS engine inside `mapletyne-core` that reconciles site grid import limits, solar PV generation, BESS state, building baseload, and external SCADA overrides (`POST /api/v1/ems/override`) to dispatch OCPP `SetChargingProfile` commands within 2 seconds. Pair this with a Two-Tier Autonomous Self-Healing Watchdog: Tier 1 (`UnlockConnector`) and Tier 2 (`SoftReset`), with immediate hardware lockout (`Inoperative`) on electrical safety faults (`GroundFailure`, `OverCurrentFailure`).
- **Consequences:** All EMS profile calculations and watchdog state machines use Redis distributed locks (`mtt:{env}:{tenant}:locks:ems:{site_id}`) to prevent race conditions across worker replicas.

---

### 2026-10-19 — ADR-008: Built-In Hierarchical ISO 15118-20 V2G PKI Authority & mTLS Security Profile 3
- **Status:** Accepted
- **Context:** OCPP 2.0.1 Security Profile 3 and ISO 15118-20 Plug & Charge require X.509 certificate chains (V2G Root CA $\rightarrow$ SECC Sub-CA / MO Sub-CA $\rightarrow$ Leaf EVSE & EMAID Contract Certificates), CSR signing (`SignCertificate.req`), and real-time OCSP/CRL revocation checks.
- **Decision:** Implement a native X.509 cryptographic PKI engine in `mapletyne-core` (`/api/v1/pki/*`) using ECDSA `secp256r1` (prime256v1) and `secp521r1` curves, encrypted private key storage (AES-256-GCM / KMS), automated CRL generation (`GET /api/v1/pki/crl`), and seamless external Sub-CA chaining (Hubject / CharIN).
- **Consequences:** Private CA keys must never be returned in API responses or committed to source control; every CSR signature and revocation writes an immutable entry to `ocpp.pki_audit_log`.

---

### 2026-10-20 — ADR-009: Immutable Fiscal CDRs & Organization Legal Authority Single Source of Truth
- **Status:** Accepted
- **Context:** European Eichrecht / MessEV, UK Public Charge Point Regulations, and North American utility billing laws require tamper-evident Charge Detail Records (CDRs) with accurate Time-of-Use (TOU) tariff breakdowns, VAT/tax rates, and legal entity attribution.
- **Decision:** Upon `StopTransaction` or `TransactionEvent(Ended)`, calculate the final financial breakdown using `decimal.Decimal` (4 decimal places internal precision, rounded to 2 decimal places via `ROUND_HALF_UP` for invoice totals) and persist an immutable `ocpp.cdrs` record signed with a SHA-256 fiscal integrity hash. All legal entity details (Company Name, VAT/Tax ID, Registration Number, Base Currency) are read from the `organization` setting profile (`AD-10`).
- **Consequences:** Floating-point (`float`) arithmetic is strictly banned for currency, tariff rates, and CDR cost calculations. Published CDRs cannot be mutated via `UPDATE` or `DELETE`; adjustments require credit/debit reversal records.

---

### 2026-10-21 — ADR-010: SQLAlchemy 2.0 Async (`asyncpg`) + Pydantic v2 Strict OpenAPI Codegen
- **Status:** Accepted
- **Context:** Synchronous database drivers (`psycopg2`) blocked the Python `asyncio` event loop during concurrent OCPP WebSocket bursts, causing charger heartbeat timeouts. Hand-written frontend TypeScript interfaces drifted from backend response payloads.
- **Decision:** Standardize `mapletyne-core` on SQLAlchemy 2.0 AsyncEngine with `asyncpg` connection pooling and Pydantic v2 strict models. Export `/openapi.json` as the contractual schema from which `mtt-admin` generates `src/lib/types/api.ts` via `openapi-typescript`.
- **Consequences:** Synchronous I/O calls (`requests`, `time.sleep`, blocking DB drivers) are strictly forbidden inside FastAPI routes and OCPP handlers.
