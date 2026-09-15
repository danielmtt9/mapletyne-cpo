# Project PRD: OpenCPO Enterprise Management Suite

## 1. Executive Summary
OpenCPO is a high-performance, enterprise-grade Charge Point Operator (CPO) management platform. It is designed to handle thousands of charge points, complex energy management (EMS), multi-network roaming (OCPI), and advanced security protocols (ISO 15118 PKI) within a unified, high-fidelity dashboard.

## 2. Target Audience
- **CPO Administrators:** Managing hardware, tariffs, and network health.
- **Fleet Managers:** Overseeing organizational vehicle groups and RFID authorizations.
- **Energy Specialists:** Monitoring site telemetry and grid load balancing.
- **Security Officers:** Managing PKI infrastructure and certificate lifecycles for Plug & Charge.

## 3. Product Vision & Principles
- **Industrial Intelligence:** A design language built on high-contrast dark modes, monospaced data clarity, and high-density information architecture.
- **API-First Architecture:** Every UI element maps directly to established REST API endpoints (v1).
- **Security by Default:** Integrated PKI vault and audit logs for all administrative actions.
- **Scalability:** Built to support thousands of concurrent sessions and chargers with TanStack Table patterns.

## 4. Feature Breakdown & Information Architecture

### 4.1 Asset Management
- **Hardware Inventory:** Real-time list of chargers with live status (Online/Offline) from Redis.
- **Charger Detail Panel:** Deep-dive telemetry, meter values, and remote command controls (Reset, Start, Stop).
- **Fleet Vehicles:** Registry for make/model/license plates with ISO 15118 PnC readiness tracking.

### 4.2 Financial Core
- **Tariffs & Pricing Engine:** Management of energy rates, time rates, idle fees, and flat fees. Supports dynamic pricing tiers and spot-price markups.
- **Sessions & Billing:** Ledger of all active and historical charging sessions with energy usage and billing resolution.

### 4.3 Connectivity & Roaming
- **OCPI Roaming Dashboard:** Management of roaming partners (Hubject, Gireve) with live sync logs and connection health monitoring.
- **RFID & Token Management:** Lifecycle control for physical RFID cards, app tokens, and vehicle PnC certificates.

### 4.4 Advanced Infrastructure
- **EMS Telemetry Dashboard:** Site-level energy monitoring (Solar, Grid, Battery, Building) with real-time telemetry ingestion.
- **PKI & Security Vault:** Certificate management for SECC, Contract, and User certs. CRL/OCSP status monitoring and CA hierarchy visualization.

### 4.5 System Administration
- **Global Configuration:** Organization profile, branding, and system-wide feature flags.
- **Maintenance Center:** Automated database backups, restoration points, and one-click version updates.

## 5. Technical Specifications
- **Design System:** `Industrial Intelligence` (Custom tokens, Hanken Grotesk typography, Emerald accent #10b981).
- **Frameworks:** React/Next.js style architecture with Tailwind CSS.
- **Data Handling:** TanStack Table for data grids, monospaced font for IDs and serials.
- **Endpoints:** Aligned with `ADMIN_MANAGEMENT_API_INVENTORY.md` (v1 prefix).

## 6. Success Metrics
- **Uptime:** 99.9% availability of the management core.
- **Latency:** Sub-second response time for live charger commands.
- **Security:** 100% audit trail coverage for PKI lifecycle events.
- **Efficiency:** 50% reduction in operator time for bulk hardware registration.
