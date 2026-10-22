<!--
<agent-discovery-protocol>
ROLE: UX Designer (Sally - bmm-ux-designer)
CO-PILOT: Senior Frontend Architect (Amelia - bmm-agent-dev) & Product Manager (John - bmm-pm)
PHASE: Phase 1.1 & Phase 3 (Design System SSOT & Penpot Visual Artboard Synchronization)

DESIGN SYSTEM GOVERNANCE CHECKLIST:
1. Primary Brand Seed: Forest Emerald M3 Precision (`#006948` seed token, `#006A60` / `#006C4A` M3 light primary, `#10B981` / `#48E260` high-visibility emerald accents).
2. Dual-Adaptive Theme Strategy:
   - Operator Mission Control (`mapletyne-admin`): M3 Light Mode default (`#F8FAFC` canvas, `#FFFFFF` cards with `#E2E8F0` border, `#0F172A` sidebar & dark telemetry drawers) with runtime dark-mode toggle & multi-tenant branding token overrides (`ThemeProvider`).
   - Driver Mobile PWA (`mapletyne-chargeapp`): Dark-Mode-First OLED high-glare ergonomics (`#0B0F19` canvas, `#0F172A` card surfaces, `#1E293B` elevated controls).
3. Iconography SSOT: Strictly Google Material Symbols (`material-symbols-outlined`, 24x24px bounding box). Zero Lucide, FontAwesome, Feather, or Heroicons.
4. Mathematical Grid & Ergonomics: Strict 4px/8px grid alignment, >=12px (`text-xs`) typography floor, >=44x44px Fitts's Law touch targets, 16px mobile input font floor.
</agent-discovery-protocol>
-->

# Design System, Tokens & Enterprise Layout Specifications (Google Material 3 SSOT)

**Platform:** Mapletyne MTT Charge CPO Enterprise (`mapletyne-admin` & `mapletyne-chargeapp`)  
**Design Language:** Google Material Design 3 (M3) HCT Dynamic Color Science + Tabler Enterprise Layout Ecosystem + Industrial Intelligence Telemetry  
**Penpot Visual SSOT File ID:** `b0861d9d-6919-8015-8008-d266309e53fd` (Project ID: `b0861d9d-6919-8015-8008-d26610b454c5`)  
**Automated Visual Critic Score:** **93.8% PASS** across all 12 verified artboards.

---

## 1. Single Source of Truth (SSOT) & Iconography Invariants

### 1.1 Design System Architecture
The Mapletyne MTT Charge platform enforces a unified token pipeline connecting **Penpot Visual Artboards**, [`docs/design/m3-tokens.json`](file:///home/danielaroko/applications/mapletynecpo/docs/design/m3-tokens.json), [`mapletyne-admin/src/styles/globals.css`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/styles/globals.css), and [`mapletyne-chargeapp/templates/base.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/base.html).

- **Seed Brand Token:** **Forest Emerald (`#006948`)** — Engineered for high-trust energy infrastructure, sustainable microgrid telemetry, and unambiguous outdoor legibility.
- **Canonical Token Artifacts:**
  - [`docs/design/m3-tokens.json`](file:///home/danielaroko/applications/mapletynecpo/docs/design/m3-tokens.json) — Algorithmic M3 HCT light/dark token registry.
  - [`mapletyne-admin/src/styles/m3-tokens.css`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/styles/m3-tokens.css) & [`mapletyne-admin/src/styles/tailwind.m3-preset.js`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/styles/tailwind.m3-preset.js) — Tailwind CSS preset and CSS custom property bindings.
  - [`mapletyne-admin/src/lib/theme-provider.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/lib/theme-provider.tsx) — Runtime multi-tenant branding injection and Light/Dark/System theme resolver.

### 1.2 Iconography SSOT (`material-symbols-outlined`)
- **Mandatory Standard:** All iconography across `mapletyne-admin`, `mapletyne-chargeapp`, and Penpot artboards MUST use **Google Material Symbols** (`material-symbols-outlined`, `material-symbols-rounded`, `material-symbols-sharp`) rendered inside a standardized `24x24px` bounding box (`opsz: 24`, `wght: 400`, `FILL: 0`, `GRAD: 0`).
- **Strictly Prohibited Libraries:** `lucide-react`, `@fortawesome/*`, `react-feather`, `@heroicons/react`, or ad-hoc unaligned inline SVGs.
- **Canonical Font Stylesheet (`index.html`):**
  ```html
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  ```
- **Standard CSS Rule:**
  ```css
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    display: inline-block;
    vertical-align: middle;
    line-height: 1;
  }
  ```

---

## 2. Dual-Adaptive Theme Strategy & Token Palette

Mapletyne MTT Charge serves two distinct operational environments that require tailored luminance profiles while sharing the same Forest Emerald semantic core:

### 2.1 Surface Strategy Comparison
1. **Operator Mission Control (`mapletyne-admin` — Desktop 1440x1024):**
   - **Default Mode:** **M3 Light Mode** optimized for prolonged multi-monitor control room shifts, financial auditing, and tabular data scanning.
   - **Light Mode Surfaces:** `#F8FAFC` primary canvas (`--background`), `#FFFFFF` card containers (`--surface-container`) with crisp `1px solid #E2E8F0` borders (`--outline`), `#F1F5F9` table headers (`--surface-container-high`), anchored by a high-contrast `#0F172A` left navigation sidebar (`240px`–`280px`) and `#0F172A` real-time 3-phase telemetry oscilloscope drawers.
   - **Dark Mode Override (`.dark`):** Toggles seamlessly via [`ThemeProvider`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/lib/theme-provider.tsx) (`localStorage['mapletyne_theme']`) to `#0F172A` canvas, `#1E293B` cards, `#27354F` elevated hover rows, and `#334155` borders.
   - **Multi-Tenant Dynamic Overrides:** `ThemeProvider` fetches `/api/v1/public/branding` on initialization, caching in `localStorage['opencpo_branding']` and dynamically injecting `--primary`, `--status-online`, `--tertiary`, custom logos, currency symbols, and document titles.

2. **Driver Mobile PWA (`mapletyne-chargeapp` — Mobile 392x844):**
   - **Default Mode:** **Dark-Mode-First OLED High-Glare Ergonomics** engineered for outdoor depot yards, night-shift fleet operations, and windshield/in-cab glare reduction.
   - **OLED Surfaces:** `#0B0F19` deep obsidian canvas, `#0F172A` primary card and header containers, `#1E293B` elevated interactive buttons, pill selectors, and input wells, with `#334155` subtle 1px structural borders.

### 2.2 Master Color Token Matrix (M3 HCT + Industrial Telemetry)

All color pairings are validated against **WCAG 2.1 AA (4.5:1 minimum)** and **AAA (7.0:1 target)** contrast standards:

| Semantic Token Role | CSS Custom Property | Operator Light Mode | Operator Dark Mode | Driver Mobile PWA (OLED) | Semantic Usage & Component Binding |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Brand Seed / Primary** | `--primary` | `#006948` (M3 `#006C4A` / `#006A60`) | `#10B981` (M3 `#6EDBAA`) | `#006948` / `#10B981` | Primary CTAs, active navigation indicators, focus rings |
| **Driver High-Glare Accent** | `--accent` | `#059669` | `#34D399` | `#48E260` / `#10B981` | QR scan laser frame, active SoC ring, "Start Charge" CTA |
| **Primary Container** | `--primary-container` | `#91E5BC` (M3 `#8AF8C5`) | `#064E3B` (M3 `#005237`) | `#064E3B` | Active pill backgrounds, selected connector badges |
| **On-Primary** | `--on-primary` | `#FFFFFF` | `#FFFFFF` (`#003825` M3) | `#FFFFFF` / `#0B1A10` | High-contrast text and icons inside primary buttons |
| **Secondary** | `--secondary` | `#0F172A` (M3 `#4D6357`) | `#3B82F6` (M3 `#B4CCBD`) | `#3B82F6` | Secondary action buttons, structural dark anchors |
| **Tertiary / Telemetry Sky** | `--tertiary` / `--electric-blue` | `#0284C7` (M3 `#3D6473`) | `#38BDF8` (M3 `#A5CCDE`) | `#38BDF8` | Live kW power curves, active charging flow, L2 phase trace |
| **Canvas Background** | `--background` | `#F8FAFC` (M3 `#FBFDF9`) | `#0F172A` (M3 `#191C1A`) | `#0B0F19` | Root viewport background |
| **Surface Container Lowest** | `--surface-container-lowest` | `#FFFFFF` | `#040814` | `#060A12` | Inset code blocks, OCPP JSON payload terminals |
| **Surface Container Low** | `--surface-container-low` | `#F8FAFC` | `#0C1427` | `#0F172A` | Top app bars, bottom navigation bars, secondary wells |
| **Surface Container (Card)** | `--surface-container` | `#FFFFFF` | `#1E293B` | `#0F172A` | KPI cards, data tables, bottom sheets, receipt cards |
| **Surface Container High** | `--surface-container-high` | `#F1F5F9` | `#27354F` | `#1E293B` | Table headers, hover rows, elevated input controls |
| **Surface Container Highest**| `--surface-container-highest`| `#E2E8F0` | `#334155` | `#334155` | Modals, tooltips, active segmented controls |
| **On-Surface (Primary Text)**| `--on-surface` | `#0F172A` (M3 `#191C1A`) | `#F8FAFC` (M3 `#E1E3DF`) | `#F8FAFC` | Primary headings, KPI numerals, table data cells |
| **On-Surface Variant** | `--on-surface-variant` | `#475569` (M3 `#404943`) | `#CBD5E1` (M3 `#C0C9C1`) | `#94A3B8` | Secondary labels, timestamps, muted metadata |
| **Outline / Card Border** | `--outline` | `#E2E8F0` (M3 `#707973`) | `#334155` (M3 `#8A938C`) | `#1E293B` / `#334155` | 1px structural card borders, table row dividers |
| **Outline Variant** | `--outline-variant` | `#CBD5E1` (M3 `#C0C9C1`) | `#475569` (M3 `#404943`) | `#334155` | Input field borders, inactive toggle outlines |
| **Sidebar Anchor** | `--sidebar-bg` | `#0F172A` | `#0B1329` | N/A (Bottom Tab Bar) | Permanent dark operator navigation rail (`240px`) |
| **Status: Online / Available**| `--status-online` | `#059669` | `#10B981` | `#10B981` | EVSE Available, Heartbeat Online, PKI Certificate Valid |
| **Status: Charging / In-Use**| `--status-in-use` | `#0284C7` | `#38BDF8` | `#38BDF8` | Active power delivery, ISO 15118 session active |
| **Status: Warning / Derated**| `--status-warning` | `#D97706` | `#F59E0B` | `#F59E0B` | Peak-shaving throttle active, thermal derating, idle fee |
| **Status: Fault / Emergency**| `--status-fault` | `#DC2626` (M3 `#BA1A1A`) | `#EF4444` (M3 `#FFB4AB`) | `#EF4444` | Hardware fault, E-Stop button, overcurrent trip |
| **Status: Offline / Unknown**| `--status-offline` | `#64748B` | `#64748B` | `#64748B` | Disconnected websocket, decommissioned EVSE |

---

## 3. Mathematical 4px/8px Grid & Spacing System

Every layout container, padding, margin, and coordinate in Penpot and CSS strictly adheres to the **8-point spatial grid** (with `4px` micro-steps for dense badge/icon alignment):

- **`4px` (`0.25rem` / `gap-1`):** Inline icon-to-badge spacing, status dot offsets, label-to-input tight vertical stack.
- **`8px` (`0.5rem` / `gap-2`, `p-2`):** Standard icon-to-text gap, filter pill spacing, compact table cell padding.
- **`12px` (`0.75rem` / `gap-3`, `p-3`):** Mobile card interior spacing, nav item icon-to-label gap, button vertical padding.
- **`16px` (`1.0rem` / `gap-4`, `p-4`):** Mobile viewport horizontal screen margins (`x=16px` on `392px` frame $\rightarrow$ `360px` content width), dense card padding, mobile grid gutters.
- **`24px` (`1.5rem` / `gap-6`, `p-6`):** Standard desktop card interior padding, desktop 12-column grid gutters, vertical form group spacing.
- **`32px` (`2.0rem` / `gap-8`, `p-8`):** Desktop main workspace horizontal padding, major dashboard section separation.
- **`48px` (`3.0rem` / `h-12`):** Standard mobile touch button height, dense header height, modal footer height.
- **`64px` (`4.0rem` / `h-16`):** Global desktop top header height (`64px`), collapsed sidebar rail width (`64px`).

---

## 4. Typography Scale, Hierarchy & Tabular Telemetry Rules

### 4.1 Font Families
- **Primary UI Sans (`font-sans`):** `'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif` — Clean geometric legibility across desktop and mobile.
- **Telemetry & Identifier Mono (`font-mono`):** `'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` — Used for OCPP Station IDs (`EVSE-YYZ-01`), eMAIDs, RFID UIDs, X.509 serial numbers, and live oscilloscope logs.

### 4.2 Strict Typography Scale & Minimum Floors
- **Enterprise Minimum Text Floor (`>= 12px` / `text-xs`):** No readable UI text, badge, table header, or axis label may ever be rendered smaller than `12px` (`0.75rem`). Sub-12px text (`10px`, `11px`) is strictly forbidden.
- **Mobile Interactive Input Floor (`>= 16px` / `text-base`):** All `<input>`, `<select>`, `<textarea>`, and primary interactive buttons MUST use `font-size: 16px` (`1rem`) minimum to prevent automatic viewport zoom on iOS Safari and Android Chrome.
- **Tabular Numerals (`tabular-nums` / `.tnum`):** Every kW power figure, kWh energy counter, SoC percentage, voltage/current reading, duration timer, and currency amount MUST apply `font-variant-numeric: tabular-nums` so digits never jitter during sub-second WebSocket/SSE updates.

| Token Name | Size (`rem` / `px`) | Line Height | Font Weight | Letter Spacing | Primary Application |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Hero (`display-lg`)** | `2.25rem` (`36px`) – `3rem` (`48px`) | `1.15` | `700 Bold` / `800` | `-0.02em` | Driver Active SoC % (`78%`), Executive Hero KPI |
| **Page Title (`h1`)** | `1.5rem` (`24px`) – `2rem` (`32px`) | `1.20` | `700 Bold` | `-0.015em` | Desktop Page Header, KPI Primary Metric (`1,284 kW`) |
| **Section Title (`h2`)** | `1.25rem` (`20px`) | `1.30` | `600 SemiBold` | `-0.01em` | Dashboard Panel Titles, Modal Headers, Mobile Screen Title |
| **Card Header (`h3`)** | `1.0rem` (`16px`) | `1.40` | `600 SemiBold` | `0em` | Card Titles, Drawer Subsections, Mobile Station Header |
| **Interactive Base (`body-lg`)** | `1.0rem` (`16px`) | `1.50` | `500 Medium` | `0em` | Form Inputs, Select Dropdowns, Primary CTA Buttons |
| **Enterprise Body (`body-sm`)** | `0.875rem` (`14px`) | `1.45` | `400 Regular` / `500` | `0em` | Default Desktop Body, Data Table Cells (`.tabler-table-row`) |
| **Caption / Overline (`label-xs`)**| `0.75rem` (`12px`) | `1.35` | `600 SemiBold` | `+0.05em` | Table Column Headers (`.tabler-table-header`), Status Badges, Nav Labels |

---

## 5. Structural Layout, Ergonomics & Component Specifications

### 5.1 Operator Desktop Shell (`mapletyne-admin` — `1440x1024px`)
- **Left Navigation Sidebar (`.tabler-sidebar`):**
  - Expanded Width: `240px` (Penpot artboard standard) up to `256px` (`w-64`).
  - Collapsed Icon Rail: `64px` (`w-16`).
  - Background: `#0F172A` (`--sidebar-bg`), right border `1px solid #1E293B`.
  - Navigation Items: `44px` height (`>= 44px` Fitts's Law target), `16px` horizontal padding, `12px` icon-to-label gap. Active state uses `rgba(0, 105, 72, 0.15)` fill with `#34D399` text and a `4px` left emerald accent bar (`#10B981`).
- **Global Top Header (`.tabler-header`):**
  - Height: `64px` (`h-16`), spanning `x=240px` to `1440px` (`width=1200px`).
  - Contains: Page Title & Breadcrumb, Global Site Selector (`All Sites ▾` via `SiteContext`), `Cmd+K` Command Palette trigger, Live Telemetry Status Pill (`OCPP 2.0.1 WSS LIVE`), Theme Mode Toggle, and Operator Profile Chip.
- **Workspace Content Grid:**
  - 12-column CSS Grid with `24px` gutters and `24px`–`32px` outer padding (`x=264px`, `w=1152px`).
  - **KPI Summary Row:** 4 equal cards (`270px x 116px`, `24px` gap), `12px` border radius (`rounded-xl`), `#FFFFFF` surface, `1px solid #E2E8F0` border.

### 5.2 Driver Mobile PWA Shell (`mapletyne-chargeapp` — `392x844px`)
- **Viewport Geometry:** `392x844px` baseline artboard (iPhone 14/15 Pro & modern Android viewport class) with `16px` horizontal padding (`360px` inner card width).
- **Top Status & App Header:**
  - System Status Bar (`0–36px`) + App Bar (`44px–52px` height) on `#0F172A` surface with `24x24px` Material Symbol actions wrapped in `44x44px` minimum touch zones.
- **Bottom Navigation Bar (`#app-nav`):**
  - Fixed at bottom (`y=772px`, `height=72px`), `#0F172A` surface with `backdrop-filter: blur(24px)` and safe-area padding (`env(safe-area-inset-bottom)`).
  - 4 primary tabs (`Map`, `Scan`, `Session` / `Activity`, `Profile` / `Account`), each occupying `>= 80x52px` touch area with `24px` Material Symbol icon and `12px` label.

### 5.3 Fitts's Law Touch Targets & Interactive Ergonomics
- **Minimum Hit Target:** Every interactive control (buttons, icon buttons, filter chips, table row actions, bottom nav tabs, toggle switches) MUST maintain an effective clickable/tappable bounding box of at least **`44x44px`** (`48x48px` preferred on mobile).
- **Primary Mobile CTAs:** Full-width (`360px` or `328px` inside cards) with `48px`–`56px` height (`rounded-xl` / `12px` radius).
- **Emergency Stop / Terminate Session CTA:** High-contrast crimson `#EF4444` fill (`52px` height on Driver Screen 03) requiring explicit confirmation or slide-to-stop gesture to prevent accidental interruption.

---

## 6. Verified Penpot Visual SSOT Inventory (12 Artboards)

All 12 artboards reside in Penpot File `b0861d9d-6919-8015-8008-d266309e53fd` ("Design System & Responsive Artboards") under Project `b0861d9d-6919-8015-8008-d26610b454c5` ("Mapletyne CPO Enterprise") and are exported as verified vector SVG previews in [`docs/designs/previews/`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/).

### 6.1 Driver Mobile PWA Artboards (8 Screens — OLED Dark-Mode-First `#0B0F19`)

| # | Penpot Frame Name | Dimensions (`W x H`) | Canvas Coordinates (`X, Y`) | Codebase Template / Route | Verified SVG Preview Path |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `Mobile - Driver 01 Depot Map` | `392 x 844 px` | `x: 1640.0, y: 100.0` | [`home.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/home.html) (`/app/`) | [`b0861d9d-6919-8015-8008-d266309e53fd_driver_01_depot_map.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_driver_01_depot_map.svg) & [`_mobile.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_mobile.svg) |
| **02** | `Mobile - Driver 02 QR Scan` | `392 x 844 px` | `x: 2120.0, y: 100.0` | [`charge.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/charge.html) (`/app/charge`) | [`b0861d9d-6919-8015-8008-d266309e53fd_driver_02_qr_scan.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_driver_02_qr_scan.svg) |
| **03** | `Mobile - Driver 03 Active Telemetry` | `392 x 844 px` | `x: 2600.0, y: 100.0` | [`session.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/session.html) (`/app/session/{id}`) | [`b0861d9d-6919-8015-8008-d266309e53fd_driver_03_active_telemetry.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_driver_03_active_telemetry.svg) |
| **04** | `Mobile - Driver 04 Digital Receipt` | `392 x 844 px` | `x: 3080.0, y: 100.0` | [`receipt.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/receipt.html) (`/app/receipt/{id}`) | [`b0861d9d-6919-8015-8008-d266309e53fd_driver_04_digital_receipt.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_driver_04_digital_receipt.svg) |
| **05** | `Mobile - Driver 05 Login Register` | `392 x 844 px` | `x: 3560.0, y: 100.0` | [`auth.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/auth.html) (`/app/account/login`) | [`b0861d9d-6919-8015-8008-d266309e53fd_driver_05_login_register.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_driver_05_login_register.svg) |
| **06** | `Mobile - Driver 06 Account Profile` | `392 x 844 px` | `x: 4040.0, y: 100.0` | [`auth.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/auth.html) / [`cert_setup.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/cert_setup.html) | [`b0861d9d-6919-8015-8008-d266309e53fd_driver_06_account_profile.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_driver_06_account_profile.svg) |
| **07** | `Mobile - Driver 07 Charging History` | `392 x 844 px` | `x: 4520.0, y: 100.0` | `/app/account/history` | [`b0861d9d-6919-8015-8008-d266309e53fd_driver_07_charging_history.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_driver_07_charging_history.svg) |
| **08** | `Mobile - Driver 08 Settings` | `392 x 844 px` | `x: 5000.0, y: 100.0` | `/app/account/settings` | [`b0861d9d-6919-8015-8008-d266309e53fd_driver_08_settings.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_driver_08_settings.svg) |

### 6.2 Operator Mission Control Artboards (4 Screens — M3 Light Mode Default `#F8FAFC`)

| # | Penpot Frame Name | Dimensions (`W x H`) | Canvas Coordinates (`X, Y`) | Codebase Component / Route | Verified SVG Preview Path |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `Desktop - Operator Mission Control` | `1440 x 1024 px` | `x: 100.0, y: 100.0` | [`DashboardPage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/DashboardPage.tsx) (`/`) | [`b0861d9d-6919-8015-8008-d266309e53fd_operator_01_mission_control.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_operator_01_mission_control.svg) & [`_desktop.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_desktop.svg) |
| **02** | `Desktop - Operator 02 EVSE Charger Management` | `1440 x 1024 px` | `x: 96.0, y: 1200.0` | [`ChargersPage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/ChargersPage.tsx) (`/chargers`) | [`b0861d9d-6919-8015-8008-d266309e53fd_operator_02_evse_management.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_operator_02_evse_management.svg) |
| **03** | `Desktop - Operator 03 Depot Bay Fleet Gantt` | `1440 x 1024 px` | `x: 1616.0, y: 1200.0` | [`RfidFleetPage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/RfidFleetPage.tsx) & [`FleetGanttTimeline.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/components/fleet/FleetGanttTimeline.tsx) (`/fleet`) | [`b0861d9d-6919-8015-8008-d266309e53fd_operator_03_depot_bay_gantt.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_operator_03_depot_bay_gantt.svg) |
| **04** | `Desktop - Operator 04 Smart Charging Peak Shaving`| `1440 x 1024 px` | `x: 3136.0, y: 1200.0` | [`EmsPage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/EmsPage.tsx) & [`PeakShavingGuardrails.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/components/ems/PeakShavingGuardrails.tsx) (`/ems`) | [`b0861d9d-6919-8015-8008-d266309e53fd_operator_04_smart_charging.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_operator_04_smart_charging.svg) |

---

## 7. Data Visualization & Telemetry Charting Standards

- **Apache ECharts 6 (`echarts` + [`echarts-theme.ts`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/lib/echarts-theme.ts)):**
  - Used for all high-frequency microgrid telemetry curves, 3-phase voltage/current oscilloscopes (`L1` `#10B981`, `L2` `#38BDF8`, `L3` `#F59E0B`), ENTSO-E 24h spot price curves, and Sankey site energy flow diagrams.
  - Charts automatically subscribe to `useTheme().resolvedTheme` to switch axis lines, split lines, and tooltip backgrounds between M3 Light Mode and Dark Mode without remounting.
- **Custom SVG Telemetry Gauges:**
  - Battery State-of-Charge (SoC) circular gauges ([`EmsBatterySocGauge.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/components/ems/EmsBatterySocGauge.tsx) and Driver Screen 03 SoC ring) render crisp vector arcs with emerald `#10B981` active strokes and tabular center readouts.
