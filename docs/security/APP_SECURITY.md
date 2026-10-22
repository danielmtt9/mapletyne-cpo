# Application Security Standards, IAM & API Hardening (OWASP ASVS v4.0.3 L2/L3)

```yaml
title: Mapletyne MTT Charge Application Security & Multi-Tenant Hardening Specification
version: "2.0.0"
date: "2026-10-21"
status: approved
author: Murat (Master Test Architect & SecureCoder Lead)
scope: Keycloak OIDC/OAuth 2.1, Multi-Tenant RLS, OWASP Top 10 & API Security, HTTP Headers, Rate Limiting
components: [opencpo-core, mtt-admin, opencpo-charge-app, keycloak-26, postgresql-16, redis-7, nginx]
```

---

## 1. Identity & Access Management (Keycloak 26 OIDC / OAuth 2.1 + PKCE)

In accordance with architectural invariants `AD-11` and `AD-12`, all authentication and authorization across the Operator Dashboard (`mtt-admin`), Driver PWA (`opencpo-charge-app`), and Core CSMS REST API (`opencpo-core`) are governed by **Keycloak 26** (`quay.io/keycloak/keycloak:26.1`, realm `opencpo`):

### 1.1 Authentication Flows & Cryptographic Token Verification
- **OAuth 2.1 Authorization Code + PKCE (`S256`):** Supported across `opencpo-admin-ui` and `opencpo-charge-app` public clients to prevent authorization code interception attacks.
- **Controlled Direct Grant Flow:** Landing page authentication (`POST /api/v1/admin/auth/login`) proxies credentials over TLS 1.3 to Keycloak's token endpoint (`/auth/realms/opencpo/protocol/openid-connect/token`) and enforces strict rate limiting.
- **Two-Step SMTP OTP Self-Registration (`AD-12`):**
  1. `POST /api/v1/admin/auth/register/initiate` validates account uniqueness, generates a cryptographically random 6-digit OTP (`secrets.SystemRandom`), and stores the pending registration intent in Redis (`reg:pending:<email>`) with a strict **600-second (10-minute) TTL**.
  2. `POST /api/v1/admin/auth/register/verify` enforces a **maximum 5-attempt brute-force lockout** per OTP before provisioning the user via the confidential `opencpo-backend` service account.
- **Stateless RS256 JWT Verification:** `opencpo-core` validates every `Authorization: Bearer <JWT>` header against Keycloak's JWKS public key cache (`/auth/realms/opencpo/protocol/openid-connect/certs`), enforcing strict checks on `iss` (issuer), `aud` (audience), `exp` (1-hour access token lifespan), `nbf`, and `realm_access.roles`.
- **Password Storage Invariant:** Keycloak hashes user credentials using **Argon2id** (or PBKDF2-SHA512 / bcrypt with work factor $\ge 12$ for legacy imports).

---

## 2. Unified Role-Based Access Control (RBAC) Matrix

`opencpo-core` route guards enforce least-privilege access across both canonical enterprise roles and Keycloak realm role mappings:

| Enterprise Role | Keycloak Realm Role Mapping | Permitted API Scopes | Prohibited Operations |
| :--- | :--- | :--- | :--- |
| **`cpo_superadmin`** | `cpo-admin` | Full platform authority: `/api/v1/pki/*` (Root/Sub-CA), `/api/v1/settings/*`, cross-tenant supervision, backups, all station/tariff/fleet APIs. | Direct modification of immutable audit logs. |
| **`depot_operator`** | `site-operator` | `/api/v1/chargers/*`, `/api/v1/sessions/*`, station remote commands (`Reset`, `RemoteStartTransaction`, `SetChargingProfile`), site telemetry. | Cannot access `/api/v1/pki/*`, system settings, or other tenants' depots. |
| **`billing_manager`** | `billing-manager` | `/api/v1/tariffs/*`, `/api/v1/sessions/*`, CDR export, VAT invoicing, host revenue split settlement. | Cannot issue OCPP hardware commands or modify PKI certificates. |
| **`fleet_manager`** | `fleet-manager` | `/api/v1/fleet/*`, `/api/v1/tokens/*` (corporate RFID/VID provisioning, driver group quotas, fleet cost center reports). | Cannot alter public station tariffs or access unrelated fleet tenants. |
| **`driver`** | `driver` | `/api/v1/driver-accounts/*` (strictly scoped to own `sub` / `driver_id`), personal RFID tokens, Plug & Charge EMAID status, wallet & VAT receipts. | Zero access to operator endpoints, other drivers' CDRs, or station administration. |

---

## 3. Multi-Tenant Isolation & PostgreSQL Row-Level Security (RLS)

To eliminate **Broken Object Level Authorization (BOLA / IDOR - OWASP API1:2023)** and **Broken Function Level Authorization (BFLA - OWASP API5:2023)** across multi-tenant CPO hosts, site operators, and fleets:

1. **Tenant Context Binding:** On every authenticated HTTP request, `opencpo-core` extracts the verified `tenant_id` (organization/host scope) and `sub` (user UUID) from the signed RS256 JWT—never from client-supplied query parameters, headers, or JSON bodies.
2. **PostgreSQL Session Context Injection:** Before executing any database transaction in the `ocpp` database, the connection pool sets session-local variables:
   ```sql
   SET LOCAL app.current_tenant_id = '<verified_jwt_tenant_uuid>';
   SET LOCAL app.current_user_role = '<verified_jwt_role>';
   SET LOCAL app.current_user_id   = '<verified_jwt_sub>';
   ```
3. **Mandatory Row-Level Security (RLS) Policies:** Core tables (`ocpp.chargers`, `ocpp.sessions`, `ocpp.tariffs`, `ocpp.tokens`, `ocpp.driver_accounts`, `ocpp.fleet_groups`) enforce RLS policies at the database engine layer:
   ```sql
   ALTER TABLE ocpp.chargers ENABLE ROW LEVEL SECURITY;
   ALTER TABLE ocpp.chargers FORCE ROW LEVEL SECURITY;

   CREATE POLICY tenant_isolation_chargers ON ocpp.chargers
     USING (
       current_setting('app.current_user_role', true) = 'cpo-admin'
       OR tenant_id::text = current_setting('app.current_tenant_id', true)
     );
   ```
4. **Object Ownership Verification:** Driver API calls (`/api/v1/driver-accounts/{id}/*`) verify `id == jwt.driver_account_id` (unless role is `cpo-admin`), returning `403 Forbidden` and logging a security event on mismatch.

---

## 4. HTTP Security Headers & Ingress Hardening

The NGINX Reverse Proxy (`deploy/nginx/default.conf.template`) and Kubernetes Ingress enforce strict defensive headers on all responses:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' wss: https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(self), microphone=(), payment=(self)
Cross-Origin-Opener-Policy: same-origin
```

- **Cookie & Token Storage Defense:** When cookies are used by Keycloak (`/auth/`), they are issued with `HttpOnly; Secure; SameSite=Lax` (or `SameSite=Strict` for state cookies). CSRF tokens are validated on all state-mutating cookie-authenticated endpoints.

---

## 5. Rate Limiting, DDoS Mitigation & OWASP Top 10 Guardrails

### 5.1 Redis-Backed Rate Limiting Tiers
| Endpoint Category | Rate Limit Window | Threshold | Enforcement Action |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/admin/auth/login` | Sliding 15 min per IP + Email | 10 attempts | `429 Too Many Requests` + exponential backoff |
| `POST /api/v1/admin/auth/register/verify` | 10 min TTL per OTP | 5 attempts | Immediate invalidation of Redis key `reg:pending:<email>` |
| `POST /api/v1/admin/auth/register/resend` | Cooldown per Email | 1 req / 60s | `429 Too Many Requests` |
| `/api/v1/*` Authenticated REST API | 1 min per Bearer Token | 300 req / min | `429 Too Many Requests` + `Retry-After` header |
| `/ocpp16/*`, `/ocpp201/*` WebSocket Handshake | 1 min per Source IP | 60 handshakes / min | NGINX connection drop + dynamic IP ban |

### 5.2 OWASP Web & API Security Controls
- **SQL Injection Prevention (CWE-89):** 100% parameterized queries via SQLAlchemy / asyncpg bindings; raw string interpolation in SQL is blocked by static analysis gates.
- **Cross-Site Scripting Prevention (CWE-79):** React 19 automatic JSX escaping in `mtt-admin` and `opencpo-charge-app`; prohibition of unvetted `dangerouslySetInnerHTML`.
- **Server-Side Request Forgery Defense (CWE-918):** Outbound webhook and OCPI roaming callbacks validate target URLs against an allowlist and block RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`), and cloud metadata IPs (`169.254.169.254`).
- **OCPP JSON Schema Validation:** All inbound OCPP 1.6J and 2.0.1 RPC payloads (`Call`, `CallResult`, `CallError`) are strictly validated against canonical OCA JSON schemas with a maximum frame size limit of `64 KB` (except segmented firmware/diagnostics diagnostics payloads).
