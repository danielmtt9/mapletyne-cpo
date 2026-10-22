# API Contract & Schema Specifications (OpenAPI 3.1 & OCPP/OCPI Standard)

**Specification Version:** 3.2.0 (Enterprise Gold Standard)  
**Service Endpoint:** `mapletyne-core` (`http://localhost:34800` / `https://api.mapletyne.com`)  
**OpenAPI Schema Path:** `GET /openapi.json` (Strict source for `mtt-admin` TypeScript codegen via `openapi-typescript`)

---

## 1. Global API Standards & Protocols

### 1.1 Transport & Content Negotiation
- **REST API Base Path:** `/api/v1` over HTTPS (TLS 1.3). All payloads use `Content-Type: application/json; charset=utf-8`.
- **Server-Sent Events (SSE):** `GET /api/v1/events/stream` and `GET /api/v1/events/chargers/{cp_id}/live` use `Content-Type: text/event-stream` with `Cache-Control: no-cache` and 15-second keep-alive comment ticks (`: keepalive\n\n`).
- **OCPP WebSockets:**
  - OCPP 1.6-J: `wss://ocpp.mapletyne.com/ocpp16/{cp_id}` (Port `34100` -> `9100`, subprotocol `ocpp1.6`)
  - OCPP 2.0.1 & ISO 15118-20: `wss://ocpp.mapletyne.com/ocpp201/{cp_id}` (Port `34201` -> `9201`, subprotocol `ocpp2.0.1`)
- **Idempotency:** Mutating requests (`POST`, `PUT`, `DELETE`) support `X-Idempotency-Key: <UUIDv4>`. Duplicate requests within 24 hours return the cached status code and response body.

### 1.2 Authentication & RBAC Matrix

| Auth Scheme | Header Format | Issued By | Allowed Scopes / Roles |
| :--- | :--- | :--- | :--- |
| **Keycloak Admin / Operator JWT** | `Authorization: Bearer <rs256_jwt>` | Keycloak 26 (`/api/v1/admin/auth/login`) | `cpo-admin`, `site-operator`, `billing-manager`, `fleet-manager` |
| **Management M2M API Key** | `X-API-Key: <MANAGEMENT_API_KEY>` | Platform Provisioner (`.env` / Vault) | Full tenant-scoped management & SCADA EMS overrides |
| **Driver JWT** | `Authorization: Bearer <driver_jwt>` | Keycloak 26 (`/api/v1/public/account/login`) | `driver` (`/api/v1/public/*` endpoints only) |
| **OCPI 2.2.1 Roaming Token** | `Authorization: Token <base64_token>` | OCPI Credentials Handshake | Peer eMSP / Hubject / Gireve (`/api/v1/ocpi/2.2.1/*`) |

### 1.3 Rate Limiting Tiers (Redis Token Bucket)

| Endpoint Group | Rate Limit | Burst | Key Identifier | Response Headers |
| :--- | :---: | :---: | :--- | :--- |
| `/api/v1/admin/auth/*` & `/api/v1/public/account/*` | 10 req / min | 5 | Client IP + Email | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` |
| `/api/v1/chargers/{cp_id}/*` (Remote Commands) | 30 req / min | 10 | `tenant_slug` + `cp_id` | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` |
| `/api/v1/ems/telemetry` & `/api/v1/ems/override` | 600 req / min | 60 | `X-API-Key` + `site_id` | `X-RateLimit-Limit`, `X-RateLimit-Remaining` |
| Standard Management REST (`/api/v1/*`) | 300 req / min | 50 | User Subject / API Key | `X-RateLimit-Limit`, `X-RateLimit-Remaining` |

---

## 2. Standard Envelopes & Error Schema

### 2.1 Paginated List Response Envelope
```json
{
  "status": "success",
  "data": [],
  "meta": {
    "total": 248,
    "offset": 0,
    "limit": 50,
    "tenant_slug": "fleetalpha",
    "timestamp": "2026-10-21T17:30:00Z"
  }
}
```

### 2.2 Standard Error Response Schema
All `4xx` and `5xx` responses conform to a deterministic machine-readable error envelope:
```json
{
  "status": "error",
  "error": {
    "code": "OCPP_CHARGER_OFFLINE",
    "message": "Charge point CP-DEPOT-04 is currently offline and cannot accept RemoteStartTransaction.",
    "target": "cp_id",
    "request_id": "req_0192b0c8-7e4a-7b12-9a11-409283746512",
    "details": {
      "cp_id": "CP-DEPOT-04",
      "last_heartbeat_at": "2026-10-21T17:12:04Z"
    }
  }
}
```

| Error Code | HTTP Status | Description |
| :--- | :---: | :--- |
| `VALIDATION_ERROR` | `400` | Request payload or query parameters failed Pydantic v2 schema validation. |
| `UNAUTHORIZED` | `401` | Missing, expired, or cryptographically invalid JWT Bearer token or `X-API-Key`. |
| `FORBIDDEN_ROLE` | `403` | Authenticated user lacks required RBAC role (e.g., `site-operator` attempting PKI revocation). |
| `RESOURCE_NOT_FOUND` | `404` | Requested entity (`cp_id`, `session_id`, `tariff_id`, `token_id`) does not exist in tenant scope. |
| `OCPP_COMMAND_IN_FLIGHT` | `409` | Another OCPP Call is currently awaiting response on the target charger. |
| `OCPP_CHARGER_OFFLINE` | `422` | Target charger does not have an active WebSocket session in Redis. |
| `RATE_LIMIT_EXCEEDED` | `429` | Token bucket exhausted; inspect `Retry-After` header. |
| `OCPP_COMMAND_TIMEOUT` | `504` | Charger failed to reply with `CALLRESULT` within 30 seconds. |

---

## 3. Comprehensive Endpoint Catalog by Domain

### 3.1 Chargers, Hardware Inventory & Remote Operations (`/api/v1/chargers`)

| Method | Path | Auth | Summary & Query/Body Contract |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/chargers` | Admin / Key | List charge points merged with live Redis connector state & active kW. Query: `status`, `site`, `simulated`, `offset`, `limit`. |
| `POST` | `/api/v1/chargers` | Admin / Key | Provision charger. Body: `id`, `vendor`, `model`, `serial_number`, `ocpp_version` (`"1.6"` \| `"2.0.1"`), `site`, `display_name`, `address`, `city`, `latitude`, `longitude`, `max_power_kw`, `tariff_kwh`, `simulated`. |
| `GET` | `/api/v1/chargers/{cp_id}` | Admin / Key | Full charger details, EVSE/connector tree, firmware version, security profile, live L1/L2/L3 telemetry. |
| `PUT` | `/api/v1/chargers/{cp_id}` | Admin / Key | Update charger metadata, site assignment, max power limit, or assigned tariff ID. |
| `DELETE` | `/api/v1/chargers/{cp_id}` | Admin / Key | Unregister charger and archive historical records. |
| `DELETE` | `/api/v1/chargers` | Admin / Key | Bulk delete chargers (Query `simulated=true` by default). |
| `GET` | `/api/v1/chargers/{cp_id}/meter-values` | Admin / Key | Latest 3-phase telemetry readings per connector (`limit`, `from_ts`, `to_ts`). |
| `GET` | `/api/v1/chargers/{cp_id}/sessions` | Admin / Key | Paginated charging sessions for `cp_id` (`status`, `offset`, `limit`). |
| `POST` | `/api/v1/chargers/{cp_id}/start` | Admin / Key | Dispatch `RemoteStartTransaction` / `RequestStartTransaction`. Body: `{"connector_id": 1, "id_tag": "RFID-001"}`. |
| `POST` | `/api/v1/chargers/{cp_id}/stop` | Admin / Key | Dispatch `RemoteStopTransaction` / `RequestStopTransaction`. Query: `transaction_id`, `connector_id`. |
| `POST` | `/api/v1/chargers/{cp_id}/reset` | Admin / Key | Dispatch `Reset`. Query: `reset_type` (`"Soft"` \| `"Hard"`). |
| `POST` | `/api/v1/chargers/{cp_id}/profile` | Admin / Key | Dispatch `SetChargingProfile`. Body: `{"connector_id": 1, "limit_kw": 75.0, "duration_seconds": 1800}`. |
| `POST` | `/api/v1/chargers/{cp_id}/unlock` | Admin / Key | Dispatch `UnlockConnector`. Query: `connector_id`. |
| `POST` | `/api/v1/chargers/{cp_id}/clear-cache` | Admin / Key | Dispatch `ClearCache` to flush local authorization cache on charger. |
| `POST` | `/api/v1/chargers/{cp_id}/config` | Admin / Key | Dispatch `ChangeConfiguration` / `SetVariables`. Body: `{"key": "HeartbeatInterval", "value": "60"}`. |
| `POST` | `/api/v1/chargers/{cp_id}/trigger` | Admin / Key | Dispatch `TriggerMessage`. Query: `message` (`"Heartbeat"` \| `"StatusNotification"` \| `"MeterValues"` \| `"BootNotification"`). |
| `POST` | `/api/v1/chargers/{cp_id}/firmware` | Admin / Key | Dispatch `UpdateFirmware`. Body: `{"location": "https://...", "retrieve_date": "...", "retries": 3}`. |
| `POST` | `/api/v1/chargers/{cp_id}/command` | Admin / Key | Generic OCPP command passthrough for Terminal Inspector (`{ "action": "GetConfiguration", "payload": {} }`). |

#### Example: `GET /api/v1/chargers/CP-DEPOT-01` Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "id": "CP-DEPOT-01",
    "display_name": "North Depot Hypercharger Bay 1",
    "vendor": "Alpitronic",
    "model": "HYC300",
    "serial_number": "ALP-HYC300-99281",
    "firmware_version": "2.4.1-v2g",
    "ocpp_version": "2.0.1",
    "security_profile": 3,
    "site": "depot-north",
    "online": true,
    "status": "Charging",
    "max_power_kw": 300.0,
    "active_power_kw": 148.4,
    "last_heartbeat": "2026-10-21T17:35:02Z",
    "connectors": [
      {
        "connector_id": 1,
        "type": "CCS2",
        "status": "Charging",
        "error_code": "NoError",
        "active_session_id": "ses_0192b0a1-4c22-7d88-b012-998877665544",
        "live_telemetry": {
          "power_kw": 148.4,
          "energy_kwh": 64.25,
          "soc_pct": 72,
          "voltage_l1_v": 401.2,
          "voltage_l2_v": 399.8,
          "voltage_l3_v": 400.5,
          "current_l1_a": 214.1,
          "current_l2_a": 213.8,
          "current_l3_a": 214.0,
          "frequency_hz": 50.02,
          "thd_pct": 1.8,
          "temperature_c": 38.5
        }
      }
    ]
  }
}
```

---

### 3.2 Charging Sessions & Fiscal CDRs (`/api/v1/sessions`)

| Method | Path | Auth | Summary & Query/Body Contract |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/sessions` | Admin / Key | Filter sessions by `status` (`active`\|`completed`\|`failed`), `charge_point`, `auth_id`, `simulated`, `date_from`, `date_to`, `offset`, `limit`. |
| `GET` | `/api/v1/sessions/stats/today` | Admin / Key | Today's aggregate kWh delivered, active session count, completed sessions, and gross revenue. |
| `GET` | `/api/v1/sessions/stats/summary` | Admin / Key | All-time/period KPIs including `avg_duration_min`, `total_energy_kwh`, `total_revenue`, `network_uptime_pct`. |
| `GET` | `/api/v1/sessions/stats/daily` | Admin / Key | Daily time-series buckets (`days=30`) of energy (kWh), session counts, and revenue. |
| `GET` | `/api/v1/sessions/{session_id}` | Admin / Key | Full session record, TOU tariff breakdown, immutable CDR payload, and SHA-256 fiscal signature. |
| `GET` | `/api/v1/sessions/{session_id}/meter` | Admin / Key | High-resolution TimescaleDB meter curve (`offset`, `limit`) for power/SoC/3-phase charting. |
| `GET` | `/api/v1/public-sessions/receipts` | Public | Searchable completed public sessions eligible for VAT PDF receipt download (`search`, `limit`, `offset`). |

---

### 3.3 Tariffs & Dynamic Spot Pricing (`/api/v1/tariffs`, `/api/v1/pricing`)

| Method | Path | Auth | Summary & Query/Body Contract |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/tariffs` | Admin / Key | List all static and Time-of-Use (TOU) tariff schedules. |
| `POST` | `/api/v1/tariffs` | Admin / Key | Create tariff (`id`, `name`, `currency`, `energy_rate`, `time_rate`, `idle_rate`, `flat_fee`, `tax_pct`, `tou_periods`). |
| `PUT` | `/api/v1/tariffs/{tariff_id}` | Admin / Key | Update tariff rates and TOU windows. |
| `DELETE` | `/api/v1/tariffs/{tariff_id}` | Admin / Key | Archive/delete unused tariff. |
| `GET` | `/api/v1/pricing/current` | Admin / Key | Current wholesale spot price (ENTSO-E / NordPool) + CPO margin calculation. |
| `GET` | `/api/v1/pricing/config` | Admin / Key | Get dynamic pricing engine config (`exchange`, `bidding_zone`, `multiplier`, `price_floor`, `price_cap`). |
| `PUT` | `/api/v1/pricing/config` | Admin / Key | Update dynamic spot pricing rules. |
| `POST` | `/api/v1/pricing/tiers` | Admin / Key | Create driver/fleet pricing tier (`id`, `name`, `margin_kwh`, `description`). |
| `PUT` | `/api/v1/pricing/tiers/{tier_id}` | Admin / Key | Modify pricing tier margin. |

---

### 3.4 RFID Tokens, Fleet Groups & Depot Cockpit (`/api/v1/tokens`, `/api/v1/groups`, `/api/v1/fleet`)

| Method | Path | Auth | Summary & Query/Body Contract |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/tokens` | Admin / Key | List RFID/ISO 15118 EMAID tokens (`status`, `group_id`, `search`). |
| `POST` | `/api/v1/tokens` | Admin / Key | Register token (`uid`, `type` (`RFID`\|`EMAID`\|`APP_USER`), `status`, `group_id`, `driver_name`, `driver_email`, `valid_from`, `valid_until`). |
| `GET` | `/api/v1/tokens/{token_id}` | Admin / Key | Token details and recent authorization audit log. |
| `PUT` | `/api/v1/tokens/{token_id}` | Admin / Key | Update token metadata or validity window. |
| `DELETE` | `/api/v1/tokens/{token_id}` | Admin / Key | Delete token and trigger OCPP `SendLocalList` delta update. |
| `POST` | `/api/v1/tokens/{token_id}/activate` | Admin / Key | Activate pending token. |
| `POST` | `/api/v1/tokens/{token_id}/block` | Admin / Key | Immediately block token (`reason`) and invalidate Redis auth cache. |
| `POST` | `/api/v1/tokens/{token_id}/unblock` | Admin / Key | Restore blocked token to `ACTIVE`. |
| `GET` | `/api/v1/groups` | Admin / Key | List corporate fleet groups and cost centers. |
| `POST` | `/api/v1/groups` | Admin / Key | Create fleet group (`name`, `billing_email`, `billing_address`, `billing_reference`, `monthly_credit_limit`). |
| `GET` | `/api/v1/groups/{group_id}/usage` | Admin / Key | Consolidated monthly fleet energy & cost statement (`month`, `year`). |
| `GET` | `/api/v1/fleet/depots` | Admin / Key | Live depot capacity, occupied bays, active charging kW, grid limit, and available headroom kW. |
| `GET` | `/api/v1/fleet/depot-bays` | Admin / Key | Real-time bay states with docked vehicle plate/VIN, `target_departure_at`, `current_soc_pct`, `target_soc_pct`. |

---

### 3.5 Energy Management System (EMS) & SCADA Overrides (`/api/v1/ems`)

| Method | Path | Auth | Summary & Query/Body Contract |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/ems/sites` | Admin / Key | List configured EMS sites, transformer limits, and load-balancing strategies. |
| `POST` | `/api/v1/ems/sites` | Admin / Key | Configure site (`id`, `name`, `grid_connection_kw`, `grid_phases`, `strategy`: `EQUAL_SHARE` \| `SOC_PRIORITY` \| `DEPARTURE_DEADLINE`). |
| `POST` | `/api/v1/ems/telemetry` | Admin / Key | Ingest site meter reading (`site_id`, `grid_kw`, `solar_kw`, `battery_kw`, `charger_kw`, `building_kw`). |
| `POST` | `/api/v1/ems/override` | Admin / Key | External SCADA / SkyOp EMS / DSR power curtailment override (`site_id`, `override_limit_kw`, `duration_seconds`, `reason`). |
| `GET` | `/api/v1/ems/live` | Admin / Key | Real-time site power flow vector (`grid_kw`, `solar_kw`, `battery_kw`, `charger_kw`, `building_kw`, `headroom_kw`). |
| `GET` | `/api/v1/ems/daily` | Admin / Key | Daily solar self-consumption ratio, peak shaving kW saved, and load profile (`site_id`, `date`). |

---

### 3.6 ISO 15118-20 PKI, OCPI 2.2.1 Roaming, SSE Events & IAM (`/api/v1/pki`, `/api/v1/ocpi`, `/api/v1/events`, `/api/v1/admin`)

| Method | Path | Auth | Summary & Query/Body Contract |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/pki/stats` | Admin / Key | V2G Root CA health, active SECC & EMAID certificates, revoked count. |
| `GET` | `/api/v1/pki/ca-hierarchy` | Admin / Key | Full X.509 PEM chain & fingerprint tree (V2G Root CA $\rightarrow$ SECC Sub-CA / MO Sub-CA). |
| `GET` | `/api/v1/pki/expiring` | Admin / Key | Certificates expiring within `days_threshold` (default 30). |
| `GET` | `/api/v1/pki/crl` | Public / Key | Download DER/PEM Certificate Revocation List (CRL). |
| `POST` | `/api/v1/pki/validate` | Admin / Key | Cryptographically validate leaf certificate (`cert_pem`, `cert_chain`). |
| `POST` | `/api/v1/pki/revoke` | Admin | Revoke certificate (`serial`, `reason`) and trigger CRL rebuild. |
| `POST` | `/api/v1/pki/issue/secc` | Admin / Key | Sign Charger SECC CSR (`charge_point_id`, `csr_pem`). |
| `POST` | `/api/v1/pki/issue/contract` | Admin / Key | Sign ISO 15118 EV Contract Certificate (`emaid`, `csr_pem`). |
| `GET` | `/api/v1/pki/audit-log` | Admin / Key | Immutable cryptographic audit trail (`limit`, `offset`). |
| `GET` | `/api/v1/ocpi/partners` | Admin / Key | List OCPI 2.2.1 roaming peers (Hubject, Gireve, eMSPs). |
| `POST` | `/api/v1/ocpi/partners` | Admin / Key | Register OCPI peer (`party_id`, `country_code`, `role`, `name`, `url`, `token_b`, `base_tariff_id`). |
| `POST` | `/api/v1/ocpi/partners/{id}/sync` | Admin / Key | Trigger asynchronous OCPI `locations`, `tariffs`, and `tokens` synchronization. |
| `POST` | `/api/v1/ocpi/partners/{id}/test` | Admin / Key | Execute live OCPI `/versions` and `/credentials` handshake diagnostic. |
| `GET` | `/api/v1/events/stream` | Admin / Key | Global Server-Sent Events (SSE) stream (`charger.status`, `meter.values`, `session.started`, `session.stopped`, `ems.telemetry`). |
| `GET` | `/api/v1/events/chargers/{cp_id}/live` | Admin / Key | Single-station high-frequency SSE telemetry stream for 3-phase oscilloscope. |
| `POST` | `/api/v1/events/webhooks` | Admin / Key | Register outbound webhook subscription (`url`, `events[]`, `secret`). |
| `DELETE` | `/api/v1/events/webhooks/{id}` | Admin / Key | Remove outbound webhook subscription. |
| `POST` | `/api/v1/admin/auth/login` | Public | Direct Access Grant login via Keycloak (`username`, `password`) $\rightarrow$ returns RS256 JWT. |
| `GET` | `/api/v1/admin/auth/me` | Admin JWT | Current operator identity, Keycloak realm roles, and tenant scope. |
| `GET` | `/api/v1/settings` | Admin / Key | Fetch white-label branding, `organization` legal profile, and `smtp` configuration. |
| `PUT` | `/api/v1/settings/{key}` | Admin | Update system setting profile (`branding`, `organization`, `smtp`). |
| `GET` | `/api/v1/features` | Admin / Key | List runtime feature flags (`smart_load_balancing`, `iso15118_pnc`, `ocpi_roaming`, `payment_gateway`). |
| `POST` | `/api/v1/features/{key}/toggle` | Admin | Toggle runtime feature flag. |
| `POST` | `/api/v1/admin/backups` | Admin | Trigger asynchronous `pg_dump` encrypted tenant snapshot. |
| `POST` | `/api/v1/admin/backups/{id}/restore` | Admin | Restore tenant database from verified backup archive. |
| `POST` | `/api/v1/public/sessions` | Driver / Public | Ad-hoc or authenticated mobile session start (`cp_id`, `connector_id`, `driver_email`, `pricing_tier`). |
| `GET` | `/api/v1/public/sessions/{id}` | Driver / Public | Live mobile session state (kW, kWh, SoC %, accrued cost). |
| `POST` | `/api/v1/public/sessions/{id}/stop` | Driver / Public | Stop mobile charging session and finalize receipt. |
| `POST` | `/api/v1/public/account/register` | Public | Step 1 & 2 OTP-verified driver registration (`email`, `password`, `name`, `phone`, `otp_code`). |
| `POST` | `/api/v1/public/account/login` | Public | Driver login returning Keycloak RS256 JWT. |
| `POST` | `/api/v1/public/payments/webhook/stripe` | Stripe HMAC | Inbound raw-buffer Stripe payment intent webhook (`payment_intent.amount_capturable_updated`, `charge.succeeded`). |
