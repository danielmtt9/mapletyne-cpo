# MTT Charge App — Apple HIG UI/UX Transformation Plan

## 1. Architecture & Design System Alignment
This document establishes the UI/UX architecture and visual standards for the new **MTT Charge App** (Progressive Web Application), porting the Apple Human Interface Guidelines (HIG) design system developed in `mtt-admin`.

---

## 2. Core Visual Principles

### 2.1 Apple HIG Glassmorphism & Squircles
- **Background**: Deep obsidian canvas (`#0b1326`) with dynamic watermarked branding background at $40\%$ opacity with 30px backdrop blur.
- **Cards & Surfaces**: Liquid glass surfaces using `bg-surface-container/70 backdrop-blur-xl border border-white/10 shadow-2xl`.
- **Corner Radii (Squircles)**:
  - Small elements (buttons, badges): `rounded-xl` (12px–16px).
  - Cards, modals, bottom sheets: `rounded-3xl` (24px–32px).
  - Floating action buttons & avatars: `rounded-full`.

### 2.2 Typography Hierarchy & 12pt Form Floor
- **Font Stack**: Apple San Francisco Pro (`SF Pro Display`, `Inter`, `Geist`, system-ui).
- **Numbers & Telemetry**: Monospaced tabular numerals (`tabular-nums font-mono`) to prevent text jitter during high-frequency telemetry updates.
- **Form Inputs**: Minimum 12pt (16px / `text-base`) with 44pt touch target heights (`h-11 px-4 text-base rounded-xl`).
- **Headings**:
  - Welcome Banner / Hero: `text-[24pt] sm:text-4xl font-extrabold tracking-tight`.
  - Section Headers: `text-lg font-bold tracking-tight`.
  - Captions & Badges: `text-xs uppercase tracking-wider font-semibold`.

### 2.3 Currency & Regional Formatting
- **Standard Currency**: British Pounds (`£` / `GBP`) formatted everywhere with 2 decimal places (`formatCurrency(val, '£')`).
- **Dynamic Override**: Inherited from `/api/v1/public/branding` via React Context / ThemeProvider.

---

## 3. Screen-by-Screen UX Specifications

```
  ┌────────────────────────────────────────────────────────┐
  │                 MTT Charge App Screens                 │
  ├───────────────────┬──────────────────┬─────────────────┤
  │ 1. Map & Station  │ 2. Pre-Charge    │ 3. Live Charge  │
  │    Discovery      │    Estimator     │    Telemetry    │
  ├───────────────────┼──────────────────┼─────────────────┤
  │ 4. Preparation    │ 5. Completion    │ 6. User Account │
  │    & Plug Prompt  │    & Receipt     │    & History    │
  └───────────────────┴──────────────────┴─────────────────┘
```

### Screen 1: Map & Station Discovery
- Interactive OpenStreetMap (Leaflet/Mapbox) with custom cluster pins.
- Station bottom sheet slides up on pin click showing live connector availability (`Available`, `Charging`, `Faulted`).
- Filter pills: `All`, `Ultra-Fast (150kW+)`, `Fast (50kW+)`, `AC (22kW)`.

### Screen 2: Pre-Charge Screen & Cost Estimator (`/charge/{cp_id}/{connector}`)
- Large squircle hero card showing station name, connector power (e.g. `150 kW DC CCS2`), and tariff rate (`£0.42/kWh`).
- Interactive slider: *"How much energy do you need?"* ($10\text{--}100\text{ kWh}$).
- Instant estimated cost and estimated charging time calculation.
- Primary CTA: **"Start Charging (£25 Pre-Auth)"** (Apple Pay / Google Pay / Card).

### Screen 3: "Please Plug In" Modal (`Preparing` State)
- Full-screen glassmorphic overlay with animated connector insertion illustration.
- Headline: *"Connect charging cable to your car"*.
- Status heartbeat indicator displaying real-time pilot handshake progress.

### Screen 4: Live Telemetry & Charging Screen (`/session/{session_id}`)
- **Hero Widget**: Dual concentric Apple Activity Rings:
  - Outer Ring: Target Energy delivered (kWh).
  - Inner Ring: Vehicle Battery SoC ($0\text{--}100\%$).
- **Live Metric Grid**:
  - `Power (kW)` with live pulse animation.
  - `Energy (kWh)` delivered.
  - `Duration` (HH:MM:SS timer).
  - `Current Cost (£)`.
- **Secondary Actions**:
  - `Stop Charging` (Emergency Red squircle).
  - `Unlock Cable` (Secondary outline squircle).

### Screen 5: Receipt & Session Summary (`/receipt/{session_id}`)
- Confetti celebration animation upon successful stop.
- Itemized cost breakdown: Base energy + VAT + Parking.
- One-tap **"Download VAT Invoice (PDF)"**.

---

## 4. Frontend Technology Stack
- **Framework**: Vite + React 18 + TypeScript (or FastAPI Jinja2 + HTMX dynamic skinning).
- **Styling**: Tailwind CSS v3.4 + Tailwind Animate + Glassmorphism utilities.
- **Charts & Gauges**: Apache ECharts 5 (optimized lightweight bundle) for telemetry curves.
- **Icons**: Lucide React + Material Symbols Outlined.
- **Offline / PWA**: Service Worker with Cache-First strategy for branding assets.
