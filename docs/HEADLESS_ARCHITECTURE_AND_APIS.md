# OpenCPO Headless Architecture & API Reference Manual

This document provides the complete specification of all REST APIs exposed by **OpenCPO Core** to the Admin dashboard and external systems, along with an implementation guide on how to run OpenCPO purely as a **headless Charge Station Management System (CSMS)** behind custom web or mobile frontends.

---

## Table of Contents
1. [Headless Architecture Overview](#1-headless-architecture-overview)
2. [CPO Core to Admin API Reference](#2-cpo-core-to-admin-api-reference)
   - [Chargers & Hardware Inventory](#21-chargers--hardware-inventory-apiv1chargers)
   - [Remote Charger Operations](#22-remote-charger-operations-apiv1chargerscp_id)
   - [Sessions & Billing CDRs](#23-sessions--billing-cdrs-apiv1sessions)
   - [Tariffs & Dynamic Pricing](#24-tariffs--dynamic-pricing-apiv1tariffs-apiv1pricing)
   - [RFID Tokens & Fleet Groups](#25-rfid-tokens--fleet-groups-apiv1tokens-apiv1groups)
   - [ISO 15118 PKI & Plug & Charge](#26-iso-15118-pki--plug--charge-apiv1pki)
   - [Energy Management System (EMS)](#27-energy-management-system-ems-apiv1ems)
   - [OCPI 2.2.1 Roaming](#28-ocpi-221-roaming-apiv1ocpi)
   - [Real-Time Events & Webhooks](#29-real-time-events--webhooks-apiv1events)
   - [Admin Auth & System Settings](#210-admin-auth--system-settings)
   - [Public Driver / Mobile Endpoints](#211-public-driver--charge-app-endpoints-apiv1public)
3. [Running OpenCPO Purely as a Headless Backend](#3-running-opencpo-purely-as-a-headless-backend)
   - [Architecture Diagram](#31-architecture-diagram)
   - [Step 1: Configure CORS](#step-1-configure-cors)
   - [Step 2: Headless Docker Compose Configuration](#step-2-headless-docker-compose-configuration)
   - [Step 3: Frontend Authentication](#step-3-frontend-authentication)
   - [Step 4: Real-Time Telemetry via Server-Sent Events (SSE)](#step-4-real-time-telemetry-via-server-sent-events-sse)
   - [Step 5: Executing Remote Commands](#step-5-executing-remote-commands)

---

## 1. Headless Architecture Overview

OpenCPO is designed as an **API-first, event-driven CSMS**. The backend engine (`opencpo-core`) is completely decoupled from any presentation layer.

* **Core Responsibilities:**
  * Maintains bidirectional WebSocket connections with EV chargers over **OCPP 1.6-J** and **OCPP 2.0.1**.
  * Executes ISO 15118 V2G TLS certificate management and PKI validation.
  * Manages energy curtailment algorithms and Smart Load Balancing (`SetChargingProfile`).
  * Ingests high-frequency meter values into Redis and PostgreSQL.
  * Exposes 147 REST API endpoints and Server-Sent Event (SSE) streams for external clients.

---

## 2. CPO Core to Admin API Reference

All management endpoints require authentication via an **Admin Bearer Token** (`Authorization: Bearer <jwt>`) or the **Management API Key** (`X-API-Key: <MANAGEMENT_API_KEY>`).

### 2.1 Chargers & Hardware Inventory (`/api/v1/chargers`)

| Method | Route | Description | Parameters / Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/chargers` | List all charge points | Query: `status`, `site`, `limit`, `offset` |
| `POST` | `/api/v1/chargers` | Provision a new charger | Body: `id`, `vendor`, `model`, `serial_number`, `ocpp_version`, `site`, `display_name`, `address`, `city`, `latitude`, `longitude`, `max_power_kw`, `tariff_kwh` |
| `GET` | `/api/v1/chargers/{cp_id}` | Get charger details | Path: `cp_id` |
| `PUT` | `/api/v1/chargers/{cp_id}` | Update charger metadata | Body: `display_name`, `address`, `city`, `latitude`, `longitude`, `max_power_kw`, `tariff_kwh`, etc. |
| `DELETE` | `/api/v1/chargers/{cp_id}` | Unregister a charger | Path: `cp_id` |
| `DELETE` | `/api/v1/chargers` | Bulk unregister chargers | Body: `["cp_id_1", "cp_id_2"]` |
| `GET` | `/api/v1/chargers/{cp_id}/meter-values` | Query raw meter values | Query: `limit`, `from_ts`, `to_ts` |
| `GET` | `/api/v1/chargers/{cp_id}/sessions` | Sessions for specific charger | Query: `limit`, `offset` |

### 2.2 Remote Charger Operations (`/api/v1/chargers/{cp_id}/...`)

| Method | Route | Description | Parameters / Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/chargers/{cp_id}/start` | **RemoteStartTransaction** | Body: `connector_id` (int), `id_tag` (string) |
| `POST` | `/api/v1/chargers/{cp_id}/stop` | **RemoteStopTransaction** | Query: `transaction_id` (int), `connector_id` (int) |
| `POST` | `/api/v1/chargers/{cp_id}/reset` | **Reset Charger** | Query: `reset_type` (`"Soft"` or `"Hard"`) |
| `POST` | `/api/v1/chargers/{cp_id}/profile` | **SetChargingProfile** | Body: `connector_id`, `limit_kw`, `duration_seconds` |
| `POST` | `/api/v1/chargers/{cp_id}/unlock` | **UnlockConnector** | Query: `connector_id` (int) |
| `POST` | `/api/v1/chargers/{cp_id}/clear-cache` | Clear local RFID cache | None |
| `POST` | `/api/v1/chargers/{cp_id}/config` | Change OCPP Configuration | Body: `key`, `value` |
| `POST` | `/api/v1/chargers/{cp_id}/trigger` | Trigger OCPP Message | Query: `message` (`"Heartbeat"`, `"StatusNotification"`, `"MeterValues"`) |
| `POST` | `/api/v1/chargers/{cp_id}/firmware` | OTA Firmware Update | Body: `location` (URL), `retrieve_date`, `retries` |

### 2.3 Sessions & Billing CDRs (`/api/v1/sessions`)

| Method | Route | Description | Parameters / Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/sessions` | List charging sessions | Query: `cp_id`, `driver_email`, `status`, `from`, `to`, `limit` |
| `GET` | `/api/v1/sessions/{session_id}` | Full session record & CDR | Path: `session_id` (UUID) |
| `GET` | `/api/v1/sessions/{session_id}/meter` | Granular meter curve | Path: `session_id` (UUID) |
| `GET` | `/api/v1/sessions/stats/today` | Today's aggregate KPIs | Returns total kWh, active sessions, revenue |
| `GET` | `/api/v1/sessions/stats/summary` | Historical overview | Returns historical energy, uptime, driver counts |
| `GET` | `/api/v1/sessions/stats/daily` | Daily breakdown | Query: `days` (default 30) |
| `GET` | `/api/v1/public-sessions/receipts`| Public invoice archive | Query: `search`, `limit`, `offset` |

### 2.4 Tariffs & Dynamic Pricing (`/api/v1/tariffs`, `/api/v1/pricing`)

| Method | Route | Description | Parameters / Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/tariffs` | List all tariffs | None |
| `POST` | `/api/v1/tariffs` | Create a tariff | Body: `id`, `name`, `currency`, `energy_rate`, `time_rate`, `idle_rate`, `flat_fee` |
| `PUT` | `/api/v1/tariffs/{tariff_id}` | Update tariff rates | Body: `name`, `energy_rate`, `time_rate`, `idle_rate`, `flat_fee` |
| `DELETE`| `/api/v1/tariffs/{tariff_id}` | Delete a tariff | Path: `tariff_id` |
| `GET` | `/api/v1/pricing/current` | Real-time spot price | Returns ENTSO-E spot price + markup calculation |
| `GET` | `/api/v1/pricing/config` | Spot pricing config | Returns active exchange, multiplier, floor/cap |
| `PUT` | `/api/v1/pricing/config` | Update spot engine | Body: `exchange`, `multiplier`, `price_floor`, `price_cap` |
| `POST` | `/api/v1/pricing/tiers` | Create pricing tier | Body: `id`, `name`, `margin_kwh`, `description` |
| `PUT` | `/api/v1/pricing/tiers/{tier_id}` | Update pricing tier | Body: `name`, `margin_kwh`, `description` |

### 2.5 RFID Tokens & Fleet Groups (`/api/v1/tokens`, `/api/v1/groups`)

| Method | Route | Description | Parameters / Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/tokens` | List all RFID tags | Query: `status`, `group_id`, `search` |
| `POST` | `/api/v1/tokens` | Register RFID token | Body: `uid`, `type`, `status`, `group_id`, `driver_name`, `driver_email`, `valid_from`, `valid_until` |
| `GET` | `/api/v1/tokens/{token_id}` | Get token details | Path: `token_id` |
| `PUT` | `/api/v1/tokens/{token_id}` | Update token | Body: `group_id`, `driver_name`, `driver_email`, `valid_until` |
| `DELETE`| `/api/v1/tokens/{token_id}` | Delete token | Path: `token_id` |
| `POST` | `/api/v1/tokens/{token_id}/activate` | Activate token | Path: `token_id` |
| `POST` | `/api/v1/tokens/{token_id}/block` | Block token | Path: `token_id`, Body: `reason` |
| `POST` | `/api/v1/tokens/{token_id}/unblock`| Unblock token | Path: `token_id` |
| `GET` | `/api/v1/groups` | List fleet groups | None |
| `POST` | `/api/v1/groups` | Create fleet group | Body: `name`, `billing_email`, `billing_address`, `billing_reference` |
| `GET` | `/api/v1/groups/{group_id}/usage` | Fleet monthly usage | Path: `group_id`, Query: `month`, `year` |

### 2.6 ISO 15118 PKI & Plug & Charge (`/api/v1/pki`)

| Method | Route | Description | Parameters / Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/pki/stats` | PKI status & health | Returns root CA state, total active/revoked certs |
| `GET` | `/api/v1/pki/ca-hierarchy` | CA tree structure | Returns V2G Root CA, SECC Sub-CA, MO Sub-CA hierarchy |
| `GET` | `/api/v1/pki/expiring` | Expiring certificates | Query: `days_threshold` (default 30) |
| `GET` | `/api/v1/pki/crl` | Fetch CRL | Returns DER / PEM Certificate Revocation List |
| `POST` | `/api/v1/pki/validate` | Cryptographic cert check | Body: `cert_pem`, `cert_chain` |
| `POST` | `/api/v1/pki/revoke` | Revoke certificate | Body: `serial`, `reason` |
| `POST` | `/api/v1/pki/issue/secc` | Sign charger SECC CSR | Body: `charge_point_id`, `csr_pem` |
| `POST` | `/api/v1/pki/issue/contract` | Sign EV contract cert | Body: `emaid`, `csr_pem` |
| `GET` | `/api/v1/pki/audit-log` | PKI audit log | Query: `limit`, `offset` |

### 2.7 Energy Management System (EMS) (`/api/v1/ems`)

| Method | Route | Description | Parameters / Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/ems/sites` | List EMS sites | None |
| `POST` | `/api/v1/ems/sites` | Define site grid limits | Body: `id`, `name`, `grid_connection_kw`, `grid_phases`, `strategy` |
| `POST` | `/api/v1/ems/telemetry` | Ingest real-time energy | Body: `site_id`, `grid_kw`, `solar_kw`, `battery_kw`, `charger_kw`, `building_kw` |
| `GET` | `/api/v1/ems/live` | Live site power balance | Query: `site_id` |
| `GET` | `/api/v1/ems/daily` | Self-consumption stats | Query: `site_id`, `date` |

### 2.8 OCPI 2.2.1 Roaming (`/api/v1/ocpi`)

| Method | Route | Description | Parameters / Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/ocpi/partners` | List roaming partners | None |
| `POST` | `/api/v1/ocpi/partners` | Add roaming partner | Body: `party_id`, `country_code`, `role`, `name`, `url`, `token_b`, `base_tariff_id` |
| `POST` | `/api/v1/ocpi/partners/{id}/sync` | Trigger sync with eMSP | Path: `partner_id` |
| `POST` | `/api/v1/ocpi/partners/{id}/test` | Test OCPI connection | Path: `partner_id` |

### 2.9 Real-Time Events & Webhooks (`/api/v1/events`)

| Method | Route | Description | Parameters / Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/events/stream` | **SSE Global Stream** | Server-Sent Events stream for all OCPP/CSMS events |
| `GET` | `/api/v1/events/chargers/{cp_id}/live` | **SSE Station Stream** | Server-Sent Events stream for a specific charger |
| `POST` | `/api/v1/events/webhooks` | Register HTTP Webhook | Body: `url`, `events` (array of event names), `secret` |
| `DELETE`| `/api/v1/events/webhooks/{id}` | Delete Webhook | Path: `webhook_id` |

### 2.10 Admin Auth & System Settings

| Method | Route | Description | Parameters / Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/admin/auth/login` | Admin login | Body: `username`, `password` ➔ Returns JWT token |
| `GET` | `/api/v1/admin/auth/me` | Current session | Returns authenticated user role and permissions |
| `GET` | `/api/v1/features` | List feature flags | Returns toggle state for all feature modules |
| `POST` | `/api/v1/features/{key}/toggle`| Toggle feature flag | Path: `key` (e.g. `smart_load_balancing`, `payment_gateway`) |
| `GET` | `/api/v1/settings` | System settings | Returns system configuration (branding, SMTP, SMS) |
| `PUT` | `/api/v1/settings/{key}` | Update setting | Path: `key`, Body: `value` |
| `POST` | `/api/v1/admin/backups` | Trigger full backup | Returns backup ID and archive status |
| `POST` | `/api/v1/admin/backups/{id}/restore` | Restore from backup | Path: `backup_id` |

### 2.11 Public Driver / Charge App Endpoints (`/api/v1/public/*`)

| Method | Route | Description | Parameters / Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/public/sessions` | Driver starts session | Body: `cp_id`, `connector_id`, `driver_email`, `driver_phone`, `pricing_tier` |
| `GET` | `/api/v1/public/sessions/{id}` | Poll live session | Path: `session_id` |
| `POST` | `/api/v1/public/sessions/{id}/stop` | Stop driver session | Path: `session_id` |
| `POST` | `/api/v1/public/account/register` | Register driver | Body: `email`, `password`, `name`, `phone`, `language` |
| `POST` | `/api/v1/public/account/login` | Driver login | Body: `email`, `password` |
| `GET` | `/api/v1/public/account/profile` | Driver profile | Headers: `Authorization: Bearer <driver_jwt>` |
| `GET` | `/api/v1/public/account/sessions` | Driver charging history | Headers: `Authorization: Bearer <driver_jwt>` |
| `POST` | `/api/v1/public/payments/webhook/stripe` | Stripe webhook | Stripe HMAC signature and event payload |
| `GET` | `/api/v1/public/push/key` | VAPID public key | Returns public key for Web Push |
| `POST` | `/api/v1/public/push/subscribe` | Register push sub | Body: `session_id`, `subscription` |

---

## 3. Running OpenCPO Purely as a Headless Backend

You can run OpenCPO purely as a **headless backend engine** (handling OCPP charger protocols, ISO 15118 PKI, Redis event bus, and database persistence) while serving your own custom frontend (e.g., Next.js, React, Vue, Flutter, iOS/Android).

### 3.1 Architecture Diagram

```
┌────────────────────────────────────────────────────────┐
│   Your Custom Frontend (Next.js / React / Mobile App)   │
└───────────────────────────┬────────────────────────────┘
                            │ REST APIs + Server-Sent Events
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Nginx / API Gateway                  │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌────────────────────────┐
│  opencpo-core:8000    │       │     PostgreSQL/Redis   │
│  - REST API Engine    │◄─────►│  - State & Telemetry   │
│  - OCPP 1.6 / 2.0.1   │       └────────────────────────┘
└───────────────────────┘
```

---

### Step 1: Configure CORS

To allow your custom frontend domains to make browser-based API calls to OpenCPO Core, configure `CORS_ORIGINS` in your `.env`:

```bash
# Allow your frontend origins (comma-separated, or * for local development)
CORS_ORIGINS="https://dashboard.yourcompany.com,https://app.yourcompany.com,http://localhost:3000"
```

---

### Step 2: Headless Docker Compose Configuration

If you do not need OpenCPO's built-in web frontends, disable `opencpo-charge-app` in `docker-compose.yml` to minimize footprint:

```yaml
services:
  # 1. OCPP & REST Backend Engine
  ocpp-core:
    build: ./opencpo-core
    restart: unless-stopped
    env_file: .env
    depends_on:
      - postgres
      - redis

  # 2. Database
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    env_file: .env
    volumes:
      - pgdata:/var/lib/postgresql/data

  # 3. Cache & Real-Time Event Bus
  redis:
    image: redis:7-alpine
    restart: unless-stopped

  # 4. Reverse Proxy & SSL Termination
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
```

---

### Step 3: Frontend Authentication

#### **Option A: Admin / CPO Authentication (JWT Token)**
```typescript
// 1. Authenticate admin user
async function loginAdmin(username: string, password: string) {
  const res = await fetch('https://api.yourdomain.com/api/v1/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  localStorage.setItem('opencpo_admin_token', data.token);
  return data.token;
}

// 2. Fetch chargers using Bearer token
async function fetchChargers() {
  const token = localStorage.getItem('opencpo_admin_token');
  const res = await fetch('https://api.yourdomain.com/api/v1/chargers', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await res.json();
}
```

#### **Option B: Service-to-Service API Key (`X-API-Key`)**
For server-rendered frontends (Next.js Server Components / Remix / Node.js backend):
```typescript
const res = await fetch('https://api.yourdomain.com/api/v1/chargers', {
  headers: {
    'X-API-Key': process.env.MANAGEMENT_API_KEY!
  }
});
const chargers = await res.json();
```

---

### Step 4: Real-Time Telemetry via Server-Sent Events (SSE)

Instead of polling for meter values or charger status changes, connect to OpenCPO's real-time SSE stream.

#### **React / TypeScript Hook Example:**
```typescript
import { useEffect, useState } from 'react';

export interface ChargerTelemetry {
  power_kw: number;
  energy_kwh: number;
  soc_pct: number;
  status: string;
  connector_id: number;
}

export function useChargerTelemetry(cpId: string) {
  const [telemetry, setTelemetry] = useState<ChargerTelemetry | null>(null);

  useEffect(() => {
    // Connect to OpenCPO SSE live stream
    const eventSource = new EventSource(
      `https://api.yourdomain.com/api/v1/events/chargers/${cpId}/live`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setTelemetry(data);
      } catch (err) {
        console.error('Failed to parse telemetry frame:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE connection error, retrying...', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [cpId]);

  return telemetry;
}
```

---

### Step 5: Executing Remote Commands

Trigger charger operations directly from your custom UI components:

```typescript
const BASE_URL = 'https://api.yourdomain.com/api/v1';

// Remote Start
export async function remoteStart(cpId: string, connectorId: number, idTag: string, token: string) {
  const res = await fetch(`${BASE_URL}/chargers/${cpId}/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ connector_id: connectorId, id_tag: idTag })
  });
  return await res.json();
}

// Remote Stop
export async function remoteStop(cpId: string, transactionId: number, token: string) {
  const res = await fetch(`${BASE_URL}/chargers/${cpId}/stop?transaction_id=${transactionId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await res.json();
}

// Smart Load Balancing Power Throttling
export async function setPowerLimit(cpId: string, connectorId: number, limitKw: number, token: string) {
  const res = await fetch(`${BASE_URL}/chargers/${cpId}/profile`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      connector_id: connectorId,
      limit_kw: limitKw,
      duration_seconds: 3600
    })
  });
  return await res.json();
}
```
