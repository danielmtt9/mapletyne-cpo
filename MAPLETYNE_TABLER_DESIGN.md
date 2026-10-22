---
name: Mapletyne Tabler Executive M3 Precision
colors:
  surface: '#f8fafc'
  surface-dim: '#f1f5f9'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f5f9'
  surface-container: '#ffffff'
  surface-container-high: '#e2e8f0'
  surface-container-highest: '#cbd5e1'
  on-surface: '#0f172a'
  on-surface-variant: '#475569'
  inverse-surface: '#0f172a'
  inverse-on-surface: '#f8fafc'
  outline: '#e2e8f0'
  outline-variant: '#cbd5e1'
  surface-tint: '#006948'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#91e5bc'
  on-primary-container: '#002114'
  inverse-primary: '#83d7ae'
  secondary: '#0f172a'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#131b2e'
  tertiary: '#0284c7'
  on-tertiary: '#ffffff'
  tertiary-container: '#cce5ff'
  on-tertiary-container: '#001d31'
  error: '#dc2626'
  on-error: '#ffffff'
  error-container: '#fee2e2'
  on-error-container: '#991b1b'
  status-online: '#059669'
  status-fault: '#dc2626'
  status-in-use: '#0284c7'
  status-offline: '#64748b'
  background: '#f8fafc'
  on-background: '#0f172a'
  surface-variant: '#f1f5f9'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-strong:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  nav-link:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  table-data:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-compact:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  chart-tick:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

# Mapletyne Tabler Executive Design System & Token SSOT

## 1. Single Source of Truth (SSOT) Iconography: Google Material Symbols
All icons across all screens MUST strictly use Google Material Symbols. No third-party icon libraries (Lucide, Heroicons, FontAwesome, Feather, React Icons) are permitted.
- HTML Ligature Syntax: `<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'opsz' 24" aria-hidden="true">{symbol_name}</span>`
- Mandatory Head Stylesheet: `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />`
- Core Symbol Catalog:
  - Operations: `dashboard`, `ev_station`, `receipt_long`, `bolt`, `power`
  - Energy & EMS: `monitoring`, `battery_charging_full`, `solar_power`, `electric_meter`, `payments`
  - Fleet & Access: `badge`, `directions_car`, `credit_card`, `group`
  - Security & System: `lock`, `vpn_key`, `verified_user`, `settings`, `history`, `tune`, `refresh`

## 2. Strict Accessibility & Typography Scale
- **16px (1rem / 16pt) Absolute Minimum:** All body paragraphs, form inputs, select dropdowns, table cells, navigation links, and descriptions must be >= 16px.
- **14px (0.875rem) Floor:** Exclusively reserved for chart axis tick labels and compact status pill badges. No text smaller than 14px anywhere.
- **Font Family:** Inter or Plus Jakarta Sans. Tabular figures (`tnum`) enabled for all numeric telemetry and data grids.

## 3. Tabler Component Archetypes & Layout Architecture
- **Classic 260px Left Vertical Sidebar:**
  - Width: `w-[260px]` fixed desktop, collapsible to `w-[76px]` rail.
  - Background: Pure white (`#FFFFFF`) or high-contrast Slate (`#0F172A`).
  - Active Nav Link: Left 3px emerald pill (`#006948`), emerald tint background (`bg-emerald-50`), font 16px medium.
- **Top Header Bar:** Height `h-16`, aligned with sidebar (`ml-[260px]`), containing breadcrumbs, real-time EMS connection status pill, quick stats, theme toggle, and operator avatar.
- **Tabler Card Shells:** `bg-white rounded-xl border border-slate-200 shadow-sm p-6`.
- **High-Density Data Tables:** 48px header row (`bg-slate-50 border-b border-slate-200`), 56px data rows (`text-base text-slate-900 border-b border-slate-100 hover:bg-slate-50`), right-aligned tabular numerals.

## 4. Hardware-Accelerated Apache ECharts Integration
- **Power Balance Area Chart:** Canvas-rendered stacked area chart displaying Solar Generation (Green `#059669`), Grid Demand (Amber `#D97706`), Battery Discharge (Emerald `#006948`), and EV Charger Load (Sky Blue `#0284C7`), equipped with an interactive `dataZoom` slider brush.
- **Battery SoC Liquid Wave Gauge:** Circular animated gauge showing `battery_soc` percentage with fluid wave animation and dynamic color thresholds.
- **Revenue & Tariff Waterfall Bridge:** Step-wise financial waterfall chart (`Gross Revenue` -> `Wholesale Cost` -> `Demand Charge` -> `Net Margin`).

## 5. Mapletyne Core Operational Data Schemas
- **EMS Telemetry:** `grid_kw` (import/export), `solar_kw`, `battery_kw`, `battery_soc` (0-100%), `charger_kw`, `building_kw`.
- **Charging Sessions:** `session_id`, `charger_id`, `driver_name`, `rfid_uid`, `realtime_power_kw`, `energy_kwh`, `duration_seconds`, `status`.
- **PKI Certificate:** `cert_serial`, `issued_by`, `valid_from`, `expires_at`, `cert_status`.
- **Hardware Profile:** `ABB Terra 184 (180 kW DC)`, `Alpitronic HYC300 (300 kW)`, `OCPP 2.0.1`.
