# Mapletyne CPO — System Architecture & Topology

## 1. High-Level Architecture Topology

The **Mapletyne CPO Platform** is built upon a 3-tier cloud-native architecture ensuring real-time hardware telemetry, protocol isolation, and dynamic energy management.

```mermaid
graph TD
    subgraph Client_Tier["Client Ingress (*.mapletyne.com)"]
        ADMIN_WEB["Operator Dashboard<br/>admin.mapletyne.com"]
        DRIVER_PWA["Driver Mobile App<br/>app.mapletyne.com"]
        OCPP_WSS["Hardware EVSEs<br/>ocpp.mapletyne.com"]
        EXT_EMS["SkyOp EMS / SCADA Engine<br/>skyop.mapletyne.com"]
    end

    subgraph Security_Layer["Ingress & Gateway"]
        INGRESS["Traefik / NGINX Ingress<br/>(WSS 3600s Keep-Alive)"]
        CERTMGR["Cert-Manager<br/>(Let's Encrypt TLS)"]
    end

    subgraph Service_Tier["Mapletyne Container Workloads"]
        MAPLE_ADMIN["mapletyne-admin<br/>(React 18 + Vite + NGINX)<br/>Port: 34000 (8080)"]
        MAPLE_APP["mapletyne-chargeapp<br/>(Driver PWA & Receipts)<br/>Port: 34003 (8003)"]
        MAPLE_CORE["mapletyne-core<br/>(CSMS + REST Management API)<br/>Ports: 34800, 34100, 34201"]
    end

    subgraph Data_Tier["State & Persistence"]
        REDIS_DB["Redis 7.0<br/>(Live Telemetry & Streams)"]
        POSTGRES_DB["PostgreSQL 16<br/>(CDRs, Fleet, Tariffs DB)"]
    end

    ADMIN_WEB -->|HTTPS| INGRESS
    DRIVER_PWA -->|HTTPS| INGRESS
    OCPP_WSS -->|WSS| INGRESS
    EXT_EMS -->|REST / gRPC| INGRESS

    INGRESS --> MAPLE_ADMIN
    INGRESS --> MAPLE_APP
    INGRESS --> MAPLE_CORE

    MAPLE_ADMIN -->|REST API| MAPLE_CORE
    MAPLE_APP -->|REST API| MAPLE_CORE
    EXT_EMS -->|POST /api/v1/ems/override| MAPLE_CORE

    MAPLE_CORE <--> REDIS_DB
    MAPLE_CORE <--> POSTGRES_DB
```

---

## 2. Workload Roles & Responsibilities

### 2.1 `mapletyne-core`
- **OCPP 1.6J & 2.0.1 Server**: Manages bidirectional WebSocket connections with EVSE field hardware.
- **Device Model & Diagnostics**: Inspects variables, component statuses, and firmware events.
- **REST Management API**: Powers the Operator Dashboard and Mobile Driver App.
- **Autonomous Self-Healing Watchdog**: Automatically initiates Tier 1 (UnlockCable) and Tier 2 (SoftReboot) recovery sequences upon anomaly detection.
- **External EMS Controller**: Ingests power curtailment and load setpoints from external SCADA systems (such as SkyOp EMS).

### 2.2 `mapletyne-admin`
- **CPO Operator Dashboard**: Single Page Application (SPA) built with React 18, Vite, and TailwindCSS.
- **Hardware Telemetry Oscilloscope**: Displays real-time 3-phase AC waveforms (L1/L2/L3 Volts & Amps) and active power gauges using custom `opencpo-dark` Apache ECharts theme.
- **Depot Fleet Cockpit**: Manages bay-level charging schedules, target departure times, vehicle SoC, and grid headroom.
- **On-Demand Inspection Drawers**: Provides detailed modals for Tariffs, Chargers, Sessions, Fleet Tokens, and OCPI Roaming.

### 2.3 `mapletyne-chargeapp`
- **Driver Mobile PWA**: Responsive mobile app for end-user charging session control.
- **Real-Time Metering Curve**: Displays live kW delivery and SoC % progress.
- **Digital Tax Invoices**: Generates automated VAT receipts with downloadable PDF receipts.
- **RFID & Virtual Wallet**: Manages corporate badge authorizations and payment methods.
