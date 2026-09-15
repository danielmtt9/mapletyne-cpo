# MTT-Admin UX, Typography & Anti-Overlapping Alignment Plan
## Complete Reconciliation: Apple HIG Transformation Plan · UX Specification · API Inventory

**Target Application**: `mtt-admin` (Charge Station Management System)  
**Author**: 🎨 Sally (UX Designer / Master UX Facilitator)  
**Date**: September 2026  
**Status**: Ready for Implementation  

---

## 1. Executive Summary & Specification Alignment

This plan resolves all typography inconsistencies, font misalignment, and text overlapping across `mtt-admin` by strictly reconciling three foundational documents:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       SPECIFICATION TRIAD RECONCILIATION                               │
├────────────────────────────────┬──────────────────────────────────────┬────────────────────────────────┤
│ 1. APPLE UI/UX TRANSFORMATION  │ 2. MTT_ADMIN_UX_SPECIFICATION.md     │ 3. API INVENTORY CATALOG       │
│    (mtt-admin/APPLE_UI_UX_...) │    (docs/MTT_ADMIN_UX_SPECIFICATION) │    (ADMIN_MANAGEMENT_API_...)  │
├────────────────────────────────┼──────────────────────────────────────┼────────────────────────────────┤
│ • Apple HIG visual standards   │ • Legacy industrial baseline         │ • Strict API field schemas     │
│ • San Francisco / Inter stack  │ • 0px sharp geometry (SUPERSEDED)    │ • Live Redis & SQL keys        │
│ • Squircles (12px/16px/24px)   │ • High data density requirement      │ • Telemetry data units & types │
│ • Fitts / Hick / Miller laws   │ • Dark charcoal palette (#0b1326)    │ • Status enums (OCPP 2.0.1)    │
│ • 44pt tap targets & tnum      │ • Telemetry monospaced values        │ • Rate & currency formats      │
└────────────────────────────────┴──────────────────────────────────────┴────────────────────────────────┘
```

### Key Reconciliation Decisions:
1. **Design System Authority**: `mtt-admin/APPLE_UI_UX_TRANSFORMATION_PLAN.md` is the **authoritative visual and ergonomic standard**. The legacy 0px sharp-corner brutalism from `MTT_ADMIN_UX_SPECIFICATION.md` is fully superseded by Apple squircle geometry (`rounded-xl` 16px, `rounded-2xl` 20px) and glassmorphic depth.
2. **Terminology & Branding**: All legacy "Mission Control" and "Industrial Intelligence" strings are replaced with **"Charge Station Management System"** and **"Enterprise EV Charging Management (CSMS)"**. Blank settings fallback to empty space `""` with ambient logo watermarks (40% opacity + blur).
3. **Data & Schema Integrity**: All UI components, tables, filters, and cards strictly map to the exact JSON structures defined in `docs/ADMIN_MANAGEMENT_API_INVENTORY.md`.

---

## 2. Root Cause Analysis: Typography Flaws & Text Overlapping

Auditing `mtt-admin/src/` revealed five specific structural root causes for text collisions and layout breaks:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DIAGNOSED TEXT OVERLAP & ALIGNMENT ROOT CAUSES                        │
├─────────────────────────┬───────────────────────────────────────────┬───────────────────────────────────┤
│ Failure Mode            │ Code Pattern Identified                   │ Visual Defect                     │
├─────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────┤
│ 1. Flexbox Collisions   │ `flex justify-between items-start`        │ Long station IDs & titles collide │
│    without Box Bounds   │ without `min-w-0` on text containers      │ with status badges and right-side │
│                         │ and without `shrink-0` on badges/icons    │ price tags on medium cards.       │
├─────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────┤
│ 2. Table Column Squeeze │ `<table>` rendered without an             │ Columns collapse into each other; │
│    without Min-Widths   │ `overflow-x-auto` wrapper and lacking     │ timestamps, serials, and status   │
│                         │ `min-w-[...]` constraints on cells        │ pills wrap and overlap vertically.│
├─────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────┤
│ 3. Sub-Scale Typography │ `text-[10px]`, `text-[11px]`, and         │ Glyphs clip against badge borders │
│    & Tight Line Heights │ `leading-none` mixed into micro-badges    │ and descenders (g, y, p, q)       │
│                         │ with `py-0.5` inside tight flex rows      │ collide with card separators.     │
├─────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────┤
│ 4. Mixed Font Stacks    │ `font-headline` pointing to Hanken        │ Inconsistent x-heights, letter    │
│    in Tailwind Config   │ Grotesk while body uses Geist/Apple-sys   │ spacing jerks, and baseline jumps.│
├─────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────┤
│ 5. Mixed Icon Standards │ Mixed Material Symbols Outlined           │ Baseline misalignment between     │
│                         │ (`<span className="material-symbols">`)   │ text labels and icon glyphs.      │
│                         │ and Lucide SVG components (`<Zap />`)     │                                   │
└─────────────────────────┴───────────────────────────────────────────┴───────────────────────────────────┘
```

---

## 3. Unified Typography & Layout Design System (Apple HIG)

### 3.1 Font Stack Hierarchy
```css
/* Typography Design Tokens */
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Geist", system-ui, sans-serif;
--font-display: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Geist", system-ui, sans-serif;
--font-mono: "SF Mono", "Geist Mono", "JetBrains Mono", ui-monospace, monospace;
```

### 3.2 Canonical Typography Scale & Line-Height Matrix

| Token | Class | Size | Line Height | Tracking | Weight | Target Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Hero** | `text-4xl font-bold tracking-tight` | 36px | 44px (`leading-tight`) | `-0.025em` | 700 | Main overview counters, Hero stats |
| **Page Heading (H1)** | `text-2xl font-bold tracking-tight text-white` | 24px | 32px (`leading-8`) | `-0.02em` | 700 | Primary Page Titles |
| **Section Title (H2)**| `text-lg font-semibold text-white` | 18px | 28px (`leading-7`) | `-0.015em` | 600 | Card Section Titles, Modal Headers |
| **Card Title (H3)** | `text-base font-semibold text-white` | 16px | 24px (`leading-6`) | `-0.01em` | 600 | Card Headers, Charger IDs |
| **KPI Big Number** | `text-3xl font-bold font-sans tabular-nums` | 30px | 36px (`leading-9`) | `-0.02em` | 700 | Dashboard Metric Values |
| **Form Inputs** | `h-11 px-4 text-base font-sans` | 16px (12pt) | 24px (`leading-normal`) | `normal` | 400 | Text fields, Selects, Textareas |
| **Form Labels** | `text-sm font-semibold text-slate-200` | 14px | 20px (`leading-5`) | `normal` | 600 | Input field labels, Section subtitles |
| **Body Standard** | `text-sm font-normal text-slate-300` | 14px | 20px (`leading-5`) | `normal` | 400 | General descriptions, table content |
| **Telemetry / Data**| `text-xs font-mono tabular-nums text-slate-300` | 12px | 16px (`leading-4`) | `0.02em` | 500 | kW, kWh, Volts, Amps, Lat/Lng |
| **Status Badge** | `text-xs font-mono font-bold tracking-wide` | 12px | 16px (`leading-none`) | `0.04em` | 700 | Online / Charging / Faulted / Stopped |

---

## 4. Universal Anti-Overlapping Architectural Invariants

Every React component in `mtt-admin` must adhere to these 4 structural layout invariants:

### Rule 1: The Zero-Collision Flex Pattern (`min-w-0` + `shrink-0`)
Whenever a title/ID sits beside a badge, price, or action button in a horizontal row:
```tsx
{/* CORRECT ZERO-COLLISION PATTERN */}
<div className="flex items-center justify-between gap-3 min-w-0">
  {/* Left text container MUST have min-w-0 and truncate on text */}
  <div className="min-w-0 flex-1">
    <h3 className="text-base font-semibold text-white truncate">{station.name}</h3>
    <p className="text-xs text-slate-400 font-mono truncate">{station.model}</p>
  </div>
  
  {/* Right status badge MUST have shrink-0 to prevent compression */}
  <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-mono font-semibold ...">
    {station.status}
  </span>
</div>
```

### Rule 2: Virtualized & High-Density Tables Wrapped in Overflow Containers
All tables must be wrapped in a scrollable, responsive container with minimum column widths:
```tsx
<div className="material-card overflow-hidden rounded-2xl border border-white/5">
  <div className="overflow-x-auto w-full">
    <table className="w-full text-left border-collapse text-sm">
      <thead>
        <tr className="border-b border-white/5 bg-slate-900/60 text-xs font-mono text-slate-400 uppercase tracking-wider h-11">
          <th className="px-5 min-w-[160px]">Station ID</th>
          <th className="px-4 min-w-[180px]">Location / Site</th>
          <th className="px-4 min-w-[120px]">Max Power</th>
          <th className="px-4 min-w-[140px]">Status</th>
          <th className="px-5 min-w-[100px] text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5 font-mono text-xs">
        {/* rows */}
      </tbody>
    </table>
  </div>
</div>
```

### Rule 3: Single Icon Standard (Lucide React)
Replace all raw Material Symbols Outlined (`<span className="material-symbols-outlined">`) with standard **Lucide React** SVG icons with explicit width/height (`w-4 h-4`, `w-5 h-5`) and `shrink-0`.

### Rule 4: Apple Squircle Radii & Elevation
- **Base Cards & Dialogs**: `rounded-2xl` (20px) with `border border-white/8` and `apple-glass` backdrop blur.
- **Buttons & Form Fields**: `rounded-xl` (12px) with `h-11` (44px Fitts's law touch floor).
- **Status Pills & Chips**: `rounded-full` with `px-2.5 py-1 text-xs`.

---

## 5. Screen-by-Screen Remediation Plan

### 5.1 Dashboard Overview (`DashboardPage.tsx`)
- **KPI Cards**: Update to `min-w-0` on value wrappers. Use `text-3xl font-bold font-sans tabular-nums leading-none` for metric numerals.
- **Activity Rings**: Ensure label text has `truncate` and does not overflow container queries.
- **Live Event Ticker**: Wrap timestamp, charger ID, and event description with explicit flex gaps and `shrink-0` on event type badges.

### 5.2 Hardware Chargers (`ChargersPage.tsx`)
- **Grid Mode Cards**: Fix header collision (`c.id` vs status pill) using Rule 1.
- **Ledger Mode Table**: Add `overflow-x-auto` container with min-widths (`min-w-[150px]` for ID, `min-w-[180px]` for Vendor/Model, `min-w-[120px]` for Power, `min-w-[130px]` for Status).
- **Inspector Slide-over Drawer**: Convert form inputs and telemetry charts to full 12pt (`text-base`) with clean `leading-normal` spacing.

### 5.3 Sessions & Billing Ledger (`SessionsPage.tsx`)
- **Table Container**: Add `overflow-x-auto` wrapper. Set explicit column min-widths for Session ID (`min-w-[140px]`), Station ID (`min-w-[140px]`), Driver Tag (`min-w-[160px]`), Timestamp (`min-w-[160px]`), Energy (`min-w-[120px]`), Cost (`min-w-[120px]`).
- **Session Modal**: Clean up ECharts chart tooltips with glassmorphic styling and prevent text clipping on transaction detail rows.

### 5.4 Tariffs & Pricing Engine (`TariffsPage.tsx`)
- **Base Tariff Cards**: Fix title row (`t.name` vs `€/kWh` price tag) with `min-w-0` + `shrink-0`.
- **Pricing Tiers Grid**: Ensure rate breakdown items (`Energy`, `Time`, `Idle Penalty`, `Flat Fee`) have clean tabular numbers with `tabular-nums`.
- **Modals**: Apply 12pt inputs (`h-11 px-4 text-base`) to `TariffModelModal.tsx` and `PricingTierModal.tsx`.

### 5.5 EMS & Smart Charging (`EmsPage.tsx`)
- **Site Flow & Gauges**: Harmonize typography on power dials (Current Draw vs Grid Capacity).
- **Throttling Table**: Wrap table in `overflow-x-auto` with min-widths for Station ID, Current kW, Limit kW, and Throttle slider.

### 5.6 Fleet & Access (`RfidFleetPage.tsx` & `VehiclesPage.tsx`)
- **Token Tables**: Add `overflow-x-auto` and `truncate` with tooltip on long RFID UID / Parent ID strings.
- **Vehicle Cards**: Align battery SoC meters and vehicle VINs with `shrink-0` on manufacturer badges.

### 5.7 Security & Roaming (`PkiVaultPage.tsx` & `RoamingPage.tsx`)
- **Certificate Ledger**: Fix long SHA-256 serial numbers and Subject CN strings by providing `max-w-[180px] truncate` with `title={serial}` and `shrink-0` on download/revoke action buttons.
- **OCPI Roaming**: Standardize endpoint URLs and credentials with monospaced code styling and copy-to-clipboard buttons.

---

## 6. API Inventory Alignment Matrix

| Admin Page | Primary API Endpoints | Request / Response Key Validation |
| :--- | :--- | :--- |
| **Dashboard** | `GET /api/v1/sessions/stats/today`<br>`GET /api/v1/chargers`<br>`GET /api/v1/ems/live` | `energy_today_kwh`, `active_sessions_count`, `network_health_percent`, `revenue_today_cents`, `charger_kw`, `grid_connection_kw` |
| **Chargers** | `GET /api/v1/chargers`<br>`POST /api/v1/chargers`<br>`POST /api/v1/chargers/:id/:action` | `id`, `vendor`, `model`, `max_power_kw`, `site`, `tariff_kwh`, `status` (`Available`, `Charging`, `Faulted`, `Unavailable`) |
| **Sessions** | `GET /api/v1/sessions`<br>`GET /api/v1/sessions/:id` | `id`, `charge_point`, `connector_id`, `auth_id`, `start_time`, `stop_time`, `energy_kwh`, `total_cost`, `status` |
| **Tariffs** | `GET /api/v1/tariffs`<br>`POST /api/v1/tariffs`<br>`GET /api/v1/pricing/config` | `id`, `name`, `energy_rate`, `time_rate`, `idle_rate`, `flat_fee`, `components`, `tiers` |
| **EMS** | `GET /api/v1/ems/live`<br>`POST /api/v1/ems/smart-charging/profile` | `grid_connection_kw`, `charger_kw`, `solar_kw`, `battery_kw`, `stations_throttled` |
| **Fleet** | `GET /api/v1/rfid/tokens`<br>`POST /api/v1/rfid/tokens`<br>`GET /api/v1/fleet/groups` | `id_tag`, `parent_id_tag`, `status`, `group_id`, `max_active_sessions`, `allowed_sites` |
| **Vehicles** | `GET /api/v1/vehicles`<br>`POST /api/v1/vehicles` | `id`, `vin`, `model`, `battery_capacity_kwh`, `max_ac_charging_power_kw`, `soc_percent` |
| **PKI Vault** | `GET /api/v1/pki/certificates`<br>`POST /api/v1/pki/issue/secc` | `serial`, `type` (`secc`, `contract`), `subject`, `charge_point`, `not_after`, `status` |
| **Roaming** | `GET /api/v1/ocpi/credentials`<br>`GET /api/v1/ocpi/locations` | `party_id`, `country_code`, `roles`, `status`, `endpoints` |
| **Settings** | `GET /api/v1/admin/settings/:category`<br>`POST /api/v1/admin/settings/:category` | `org`, `branding` (`company_name`, `app_title`, `logo_url`), `smtp`, `sms`, `ocpi`, `backups` |

---

## 7. Execution Checklist

- [x] **Step 1**: Author and validate reconciliation plan across Apple HIG, UX Spec, and API inventory.
- [ ] **Step 2**: Update `mtt-admin/tailwind.config.js` to ensure `font-headline` and `font-sans` strictly prioritize Apple SF Pro / Inter font stack.
- [ ] **Step 3**: Audit and apply Zero-Collision Flex Pattern (`min-w-0`, `shrink-0`, `truncate`) across all page components.
- [ ] **Step 4**: Wrap all data tables with `overflow-x-auto` containers and explicit column `min-w-[...]` rules.
- [ ] **Step 5**: Replace legacy Material Symbols with Lucide React icons across all screens.
- [ ] **Step 6**: Execute `npm run build` in `mtt-admin` and verify zero compilation errors.
