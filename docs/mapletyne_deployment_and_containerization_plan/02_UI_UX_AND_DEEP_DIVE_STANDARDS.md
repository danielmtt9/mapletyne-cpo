# Mapletyne CPO — UI/UX & Deep-Dive Inspection Standards

## 1. UI/UX Design Principles

1. **Strict Apple HIG Dark Theme Aesthetic**: Deep slate containers (`bg-slate-900/90`), subtle borders (`border-slate-700/80`), and high-contrast typography.
2. **Standardized Summary Metric Cards**: Consistent height, padding, and alignment across all pages (`min-h-[96px] h-24 p-5 rounded-2xl flex flex-col justify-between shadow-md`).
3. **Zero Speculative Trading Clutter**: 100% elimination of wholesale spot price curves, day-ahead arbitrage charts, and unnecessary static graphs from main views.
4. **On-Demand Inspection Over Main Screen Squeeze**: Dense analytical data and secondary charts are moved to dedicated, interactive on-demand modals and slide-out drawers.

---

## 2. Standardized Summary Metric Cards Across Pages

| Page Route | Standardized Metric 1 | Standardized Metric 2 | Standardized Metric 3 | Standardized Metric 4 |
| :--- | :--- | :--- | :--- | :--- |
| **`/tariffs`** | Active Tariff Plans (16) | Customer Pricing Tiers (16) | Network Cost Basis (£0.220) | Standard Tax / VAT (21%) |
| **`/chargers`** | Total Charging Assets | Active Dispensing Load | Online & Ready Stations | Station Faults / Alerts |
| **`/sessions`** | Recorded Transactions | Total Dispensed Energy (kWh)| Gross Settled Revenue (£) | Avg Session Energy (kWh) |
| **`/rfid-fleet`** | Total Authorized Tokens | Active Badges | Corporate Fleet Groups | Monthly Fleet Energy (kWh) |
| **`/roaming`** | Connected eMSP Partners | Protocol Dialect (OCPI 2.2.1)| Local Node Identifier | Bi-directional Sync Status |

---

## 3. Entity Deep-Dive Modal & Drawer Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        MASTER ENTITY DEEP-DIVE ARCHITECTURE                            │
├──────────────────┬─────────────────────────────┬───────────────────────────────────────┤
│ Module           │ Component                   │ Multi-Tab Inspection Capabilities     │
├──────────────────┼─────────────────────────────┼───────────────────────────────────────┤
│ 1. Tariffs       │ TariffDetailModal.tsx       │ • Tab 1: Rate Anatomy & Dimension Share│
│                  │                             │ • Tab 2: Session Simulator Calculator │
│                  │                             │ • Tab 3: Connector & Tier Scope       │
├──────────────────┼─────────────────────────────┼───────────────────────────────────────┤
│ 2. Chargers      │ ChargerDetailDrawer.tsx     │ • Tab 1: Live Telemetry & 3-Phase Scope│
│                  │                             │ • Tab 2: OCPP 2.0.1 Device Diagnostics│
│                  │                             │ • Tab 3: Remote Controls & Throttling │
├──────────────────┼─────────────────────────────┼───────────────────────────────────────┤
│ 3. Sessions      │ SessionDetailModal.tsx      │ • Tab 1: Metering Profile (Power/SoC) │
│                  │                             │ • Tab 2: Itemized CDR Invoice & VAT   │
│                  │                             │ • Tab 3: OCPP Protocol Lifecycle Trace│
├──────────────────┼─────────────────────────────┼───────────────────────────────────────┤
│ 4. Fleet & RFID  │ TokenAuditDrawer.tsx        │ • Tab 1: Quota & Monthly Energy Limits│
│                  │ GroupUsageModal.tsx         │ • Tab 2: Security (Block/Unblock)     │
│                  │                             │ • Tab 3: Vehicle & Driver Session Trace│
├──────────────────┼─────────────────────────────┼───────────────────────────────────────┤
│ 5. OCPI Roaming  │ OcpiPartnerDetailModal.tsx  │ • Tab 1: Module Handshake Matrix      │
│                  │                             │ • Tab 2: Credentials & Versions URL   │
│                  │                             │ • Tab 3: CDR & Session Reconciliation │
└──────────────────┴─────────────────────────────┴───────────────────────────────────────┘
```
