# Local Development Environment, Deterministic Seeding & Virtual Charger Farm (`SEEDING_AND_LOCAL_DEV.md`)

**Specification Version:** 3.2.0 (Enterprise Gold Standard)  
**Scope:** Local Docker Compose Topology, Deterministic Tenant & Database Seeding, Virtual OCPP 1.6-J / 2.0.1 Charger Simulation, and Developer Verification Workflow

---

## 1. Local Development Port & Service Map

All local and containerized services bind to deterministic host ports matching the Mapletyne CPO enterprise specification:

| Service | Container Name | Host Port | Internal Port | Local URL / Endpoint |
| :--- | :--- | :---: | :---: | :--- |
| **`mapletyne-admin`** | `mapletyne-admin` | `34000` | `8080` | `http://localhost:34000` (Operator Mission Control SPA) |
| **`mapletyne-chargeapp`** | `mapletyne-chargeapp` | `34003` | `8003` | `http://localhost:34003` (Driver Mobile PWA & Receipts) |
| **`mapletyne-core` (REST & SSE)** | `mapletyne-core` | `34800` | `8000` | `http://localhost:34800/api/v1` & `http://localhost:34800/openapi.json` |
| **`mapletyne-core` (OCPP 1.6-J)** | `mapletyne-core` | `34100` | `9100` | `ws://localhost:34100/ocpp16/{cp_id}` |
| **`mapletyne-core` (OCPP 2.0.1)** | `mapletyne-core` | `34201` | `9201` | `ws://localhost:34201/ocpp201/{cp_id}` |
| **`keycloak`** | `mapletyne-keycloak` | `8081` | `8080` | `http://localhost:8081/auth` (`opencpo` realm) |
| **`postgres` (TimescaleDB)** | `mapletyne-postgres` | `5432` | `5432` | `postgresql://mtt_default_user:...@localhost:5432/mapletyne_dev_default_core` |
| **`redis`** | `mapletyne-redis` | `6379` | `6379` | `redis://localhost:6379/0` (Prefix: `mtt:dev:default`) |

---

## 2. Local Development Docker Compose Blueprint (`docker-compose.dev.yml`)

```yaml
services:
  postgres:
    image: timescale/timescaledb:latest-pg16
    container_name: mapletyne-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: mapletyne_dev_default_core
      POSTGRES_USER: mtt_default_user
      POSTGRES_PASSWORD: mtt_dev_password_2026
    volumes:
      - pgdata_dev:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mtt_default_user -d mapletyne_dev_default_core"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: mapletyne-redis
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--maxmemory", "512mb", "--maxmemory-policy", "allkeys-lru"]
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  keycloak:
    image: quay.io/keycloak/keycloak:26.0
    container_name: mapletyne-keycloak
    command: ["start-dev", "--import-realm", "--http-relative-path=/auth"]
    ports:
      - "8081:8080"
    environment:
      KC_BOOTSTRAP_ADMIN_USERNAME: admin
      KC_BOOTSTRAP_ADMIN_PASSWORD: admin_dev_password
    volumes:
      - ./infra/keycloak/realm-opencpo.json:/opt/keycloak/data/import/realm-opencpo.json:ro

  mapletyne-core:
    build:
      context: ./opencpo-core
      dockerfile: Dockerfile
    container_name: mapletyne-core
    stop_signal: SIGTERM
    stop_grace_period: 30s
    ports:
      - "34800:8000"
      - "34100:9100"
      - "34201:9201"
    environment:
      ENVIRONMENT: dev
      TENANT_SLUG: default
      ORG_NAME: "Mapletyne Fleet Alpha (Dev)"
      PG_HOST: postgres
      PG_PORT: 5432
      PG_NAME: mapletyne_dev_default_core
      PG_USER: mtt_default_user
      PG_PASSWORD: mtt_dev_password_2026
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PREFIX: mtt:dev:default
      KEYCLOAK_URL: http://keycloak:8080/auth
      KEYCLOAK_REALM: opencpo
      KEYCLOAK_CLIENT_ID: mtt-admin-client
      KEYCLOAK_CLIENT_SECRET: dev-client-secret
      SECRET_KEY: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
      MANAGEMENT_API_KEY: mtt_dev_api_key_2026
      PUBLIC_URL: http://localhost:34000
      CHARGEAPP_URL: http://localhost:34003
      CORE_API_PUBLIC_URL: http://localhost:34800
      CORS_ORIGINS: http://localhost:34000,http://localhost:34003
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  pgdata_dev:
```

---

## 3. Deterministic Database & IAM Seeding Specification

Running `python -m app.scripts.seed_dev` inside `mapletyne-core` executes an idempotent (`ON CONFLICT DO UPDATE`) seed pipeline so local development, E2E Playwright suites, and compliance testers have realistic, reproducible state immediately on boot.

### 3.1 Seeded Keycloak Realm Roles & Test Accounts (`opencpo` Realm)

| Username / Email | Password (Dev Only) | Keycloak Realm Role | Assigned Fleet / Scope | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `admin@mapletyne.com` | `Mapletyne!Admin2026` | `cpo-admin` | Global Tenant (`default`) | Full access to Chargers, PKI, OCPI, EMS, Tariffs, Settings |
| `ops@mapletyne.com` | `Mapletyne!Ops2026` | `site-operator` | `depot-north`, `hub-central` | Charger remote operations, fault triage, live telemetry |
| `billing@mapletyne.com` | `Mapletyne!Bill2026` | `billing-manager` | Global Tenant (`default`) | Tariffs, spot pricing, CDR audit, VAT receipt exports |
| `fleet@mapletyne.com` | `Mapletyne!Fleet2026` | `fleet-manager` | `GRP-ALPHA-LOGISTICS` | Depot Cockpit, bay schedules, RFID tokens, fleet usage |
| `driver@mapletyne.com` | `Mapletyne!Driver2026` | `driver` | Personal Account | Driver Mobile PWA (`:34003`), QR start/stop, receipts |

### 3.2 Seeded Hardware Inventory, Sites, Tariffs & PKI Hierarchy

| Entity Category | Seeded Identifiers | Seeded Attributes & Configuration |
| :--- | :--- | :--- |
| **Tenant & Legal Authority** | `default` (`Fleet Alpha Logistics Ltd`) | VAT ID: `GB994827112`, Reg: `12948271`, Base Currency: `GBP`, Skin: `modern-emerald` (`#10b981`). |
| **EMS Sites** | `depot-north`, `hub-central` | `depot-north`: `350.0 kW` 3-phase 400V PCC limit, `DEPARTURE_DEADLINE` strategy, 12 depot bays.<br/>`hub-central`: `600.0 kW` 3-phase 400V PCC limit, `EQUAL_SHARE` strategy, 50 kWp Solar + 100 kWh BESS. |
| **OCPP 2.0.1 Chargers** | `CP-DEPOT-01` .. `CP-DEPOT-04` | Alpitronic `HYC300` (`300 kW` Dual CCS2, Security Profile 3 mTLS, ISO 15118-20 V2G enabled). |
| **OCPP 1.6-J Chargers** | `CP-HUB-01` .. `CP-HUB-04` | Kempower `T-Series` (`150 kW` DC) & Easee `Charge Max` (`22 kW` 3-Phase AC Type 2). |
| **TOU Tariffs** | `TAR-DEPOT-TOU`, `TAR-PUBLIC-FAST` | `TAR-DEPOT-TOU`: Off-Peak (00:00–06:00) `£0.14/kWh`, Standard `£0.28/kWh`, Peak (16:00–19:00) `£0.42/kWh`.<br/>`TAR-PUBLIC-FAST`: `£0.59/kWh` + `£0.50/min` idle fee after 15m grace period (20% VAT). |
| **RFID & EMAID Tokens** | `RFID-ALPHA-001` .. `010`, `GB-MTT-C0992817-W` | Active corporate RFID tags and ISO 15118-20 Plug & Charge Contract EMAIDs linked to `GRP-ALPHA-LOGISTICS`. |
| **ISO 15118 PKI Chain** | `V2G-ROOT-CA`, `SECC-SUB-CA`, `MO-SUB-CA` | Auto-generated ECDSA `secp256r1` CA chain in `/app/data/pki` with signed leaf certs for `CP-DEPOT-01..04`. |
| **Historical Sessions & CDRs**| 30 days of synthetic sessions (`120` rows) | Complete with 3-phase `ocpp.meter_values` curves (`L1/L2/L3` V/A, SoC, THD) and SHA-256 signed `ocpp.cdrs`. |

---

## 4. Developer Quickstart & Virtual Charger Simulation

### 4.1 Booting the Stack & Syncing OpenAPI Types
```bash
# 1. Start PostgreSQL (TimescaleDB), Redis, Keycloak, and mapletyne-core
docker compose -f docker-compose.dev.yml up -d

# 2. Run Alembic database migrations & deterministic seed script
docker exec -it mapletyne-core alembic upgrade head
docker exec -it mapletyne-core python -m app.scripts.seed_dev

# 3. Verify health & generate strict TypeScript OpenAPI types for mtt-admin
curl -fsSL http://localhost:34800/health
cd mtt-admin && npm run codegen && npm run dev
```

### 4.2 Running Virtual OCPP 1.6-J & 2.0.1 Chargers
To test real-time 3-phase oscilloscope waveforms, autonomous EMS curtailment, and remote commands locally without physical hardware:
```bash
# Launch 4 simulated OCPP 2.0.1 hyperchargers and 4 OCPP 1.6-J AC/DC chargers
docker exec -it mapletyne-core python -m app.simulator.farm \
  --ocpp201-url ws://localhost:9201/ocpp201 \
  --ocpp16-url ws://localhost:9100/ocpp16 \
  --chargers CP-DEPOT-01,CP-DEPOT-02,CP-HUB-01,CP-HUB-02 \
  --meter-interval 5
```
Each virtual charger performs a full `BootNotification`, sends `StatusNotification(Available)`, accepts `RemoteStartTransaction` / `SetChargingProfile`, and streams realistic 3-phase AC/DC `MeterValues` (`400V`, `L1/L2/L3` current, rising `SoC %`, and temperature) every 5 seconds.
