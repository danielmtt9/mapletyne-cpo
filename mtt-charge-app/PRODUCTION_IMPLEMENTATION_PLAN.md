# MTT Charge App — Production Architecture, Apple HIG UI/UX & EVerest Simulation Plan

**Project**: MTT Driver Charge PWA (`mtt-charge-app`)  
**Design Standards**: Apple Human Interface Guidelines (macOS/iOS HIG), Stitch Design System (`stitch_opencpo_management_dashboard`), WCAG 2.2 AA/AAA  
**Protocol Standards**: OCPP 1.6-J, OCPP 2.0.1, IEC 61851-1, ISO 15118-2/20  
**API Authority**: OpenCPO Admin Management & Public API Catalog (`docs/ADMIN_MANAGEMENT_API_INVENTORY.md`)  
**Target Environment**: Production Cloudflare Edge + Simulation Farm (`everest.mapletyne.com`)  
**Architect**: 🏛️ Winston (System Architect)  
**Date**: September 2026  

---

## 1. Executive Summary & Design System Synthesis

The **MTT Charge App** is the next-generation, high-performance Progressive Web Application (PWA) designed for EV drivers. It seamlessly adapts the enterprise **Apple Human Interface Guidelines (HIG)**, **Glassmorphism**, and **Dynamic Multi-Tenant Branding** established in `mtt-admin`, while strictly adhering to the API contracts in `docs/ADMIN_MANAGEMENT_API_INVENTORY.md`.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         MTT CHARGE APP UNIFIED PRODUCTION ARCHITECTURE                           │
├──────────────────────────┬───────────────────────────────────────────────────────────────────────┤
│ 1. VISUAL & HIG FOUNDATION│ • Apple Squircle geometry: 12px/16px/24px/32px continuous curves      │
│    (mtt-admin Port)      │ • Deep Obsidian canvas (#0b1326) with 40% opacity watermark logo      │
│                          │ • 30px Backdrop-blur Glassmorphism (bg-surface-container/70)         │
│                          │ • 12pt (16px) form touch floor with 44pt Fitts's Law hitboxes         │
│                          │ • Tabular monospaced numbers (tabular-nums) for jitter-free telemetry │
│                          │ • Default British Pounds (£ / GBP) formatted across all screens       │
├──────────────────────────┼───────────────────────────────────────────────────────────────────────┤
│ 2. DYNAMIC BRANDING &    │ • Hydrated from GET /api/v1/public/branding                          │
│    THEME ENGINE          │ • Live dynamic favicon & Apple touch icon DOM injection               │
│                          │ • Multi-tenant CSS variables (--primary, --background, --secondary)  │
├──────────────────────────┼───────────────────────────────────────────────────────────────────────┤
│ 3. EV CHARGING LIFECYCLE │ • 120s "Preparing / Plug In Cable" interstitial with countdown timer  │
│    & PROTOCOL CONTROLS   │ • Dual Battery SoC Engine: Native (ISO 15118/DC) + AC manual estimator│
│                          │ • Emergency "Unlock Cable" solenoid release (UnlockConnector.req)     │
│                          │ • Overstay grace period (15:00 min timer) & idle fee push alerts      │
├──────────────────────────┼───────────────────────────────────────────────────────────────────────┤
│ 4. TELEMETRY & API LAYER │ • Primary: Zero-latency Redis Server-Sent Events (/events/stream)     │
│    (INVENTORY ALIGNED)   │ • Fallback: Resilient 3s HTTP polling (/api/v1/public/sessions/{id}) │
│                          │ • Strict alignment with docs/ADMIN_MANAGEMENT_API_INVENTORY.md        │
├──────────────────────────┼───────────────────────────────────────────────────────────────────────┤
│ 5. EVEREST SIMULATION    │ • Complete end-to-end verification against everest.mapletyne.com      │
│    COMPATIBILITY         │ • Automated test matrix for AC, DC CCS, ISO 15118, & timeout scenarios│
└──────────────────────────┴───────────────────────────────────────────────────────────────────────┘
```

---

## 2. API Alignment & Compliance Analysis

The implementation plan has been reconciled against the authoritative OpenCPO API catalog ([`docs/ADMIN_MANAGEMENT_API_INVENTORY.md`](file:///home/danielaroko/applications/opencpo/docs/ADMIN_MANAGEMENT_API_INVENTORY.md)).

### API Endpoint Mapping Table

| Charge App Functionality | OpenCPO Core Endpoint | Auth Required | Request Payload / Query Params | Response Schema Alignment |
|:---|:---|:---:|:---|:---|
| **Public Branding & Theme** | `GET /api/v1/public/branding` | None | None | `{company_name, logo_data_uri, logo_url, favicon_url, primary_color, secondary_color, currency: "GBP"}` |
| **QR Code Station Lookup** | `GET /api/v1/public/qr/{code}/lookup` | None | `code` (Path) | `{cp_id, connector_id, site_id, evse_id}` |
| **Charger Specs & Live Status** | `GET /api/v1/chargers/{cp_id}` | None / Public | `cp_id` (Path) | `{id, name, max_power_kw, connectors: [{id, status, power_kw, tariff_kwh}], live: {...}}` |
| **Dynamic Tier Tariff** | `GET /api/v1/pricing/current` | None | None | `{tiers: {public: {rate_incl, rate_excl, margin_adder}}}` |
| **Session Initiation** | `POST /api/v1/public/sessions` | None | `{cp_id, connector_id, driver_phone, driver_start_soc_pct?, driver_target_soc_pct?, battery_capacity_kwh?}` | `{session_id, status: "pending" \| "authorized", rate_kwh, checkout_url?}` |
| **Session Status & Telemetry** | `GET /api/v1/public/sessions/{id}` | None | `id` (Path) | `{id, status, kwh, power_kw, duration_seconds, cost, soc_pct, currency, pricing_tier}` |
| **Live Telemetry Stream (SSE)** | `GET /api/v1/events/stream` | None / Query | `session_id={id}` | `data: {"kwh": 12.4, "power_kw": 48.2, "soc": 65, "cost": 5.21}` |
| **120s Timeout Cancellation** | `POST /api/v1/public/sessions/{id}/cancel` | None | `id` (Path), `{reason: "cable_insertion_timeout"}` | `{status: "cancelled", message: "Session cancelled"}` |
| **Remote Stop Command** | `POST /api/v1/public/sessions/{id}/stop` | None | `id` (Path) | `{status: "Completed", kwh, total_cost, stopped_at}` |
| **Emergency Cable Unlock** | `POST /api/v1/public/chargers/{cp_id}/connectors/{connector_id}/unlock` | None | `cp_id`, `connector_id` (Path) | `{status: "Unlocked", message: "UnlockConnector dispatched"}` |
| **PDF VAT Receipt** | `GET /api/v1/public/sessions/{id}/pdf` | None | `id` (Path) | Binary `application/pdf` with legal entity & VAT |
| **Web Push Subscription** | `POST /api/v1/public/push/subscribe` | None | `{subscription: {endpoint, keys}}` | `{status: "subscribed"}` |

---

## 3. Detailed Screen Architecture & Stitch Design Integration

The screens port the visual language of `stitch_opencpo_management_dashboard` and the Apple HIG principles from `mtt-admin/APPLE_UI_UX_TRANSFORMATION_PLAN.md`.

```
  ┌────────────────────────────────────────────────────────┐
  │                 MTT Charge App Screens                 │
  ├───────────────────┬──────────────────┬─────────────────┤
  │ 1. Map & Station  │ 2. Pre-Charge    │ 3. 120s Cable   │
  │    Discovery      │    Estimator     │    Insertion    │
  ├───────────────────┼──────────────────┼─────────────────┤
  │ 4. Live Telemetry │ 5. Overstay &    │ 6. VAT Receipt  │
  │    Activity Rings │    Grace Period  │    & PDF Export │
  └───────────────────┴──────────────────┴─────────────────┘
```

---

### Screen 1: Map & Station Discovery (`/app/` or `/`) — Preserving Core Capabilities & Enhancing Responsiveness

#### 1.1 Preserved Core Map Capabilities (100% Retained from `opencpo-charge-app`)
- **Leaflet Spatial Mapping Engine**: Leaflet 1.9.4 with OpenStreetMap & CartoDB Dark Matter tile layer with automatic light/dark theme toggle.
- **Dynamic Bounding Box & Radius Query**: Connects to OpenCPO Core `GET /api/v1/public/chargers/nearby?lat={lat}&lng={lng}&radius={radius}`.
- **Station Marker Clustering & Status Glow**: Custom SVG pin markers (`pinSVG(color)`) with real-time status indication:
  - `Available`: Emerald Green (`#22c55e`)
  - `Charging` / `Occupied`: Electric Blue (`#00B0E4` / `#3b82f6`)
  - `Faulted`: Crimson Rose (`#ef4444`)
  - `Offline`: Slate Grey (`#64748b`)
- **High-Accuracy Geolocation**: `navigator.geolocation` with animated pulsing user position dot (`userMarker`) and automated distance calculation (`distTo(lat, lng)`).
- **Search Autocomplete**: Live station, city, and address search filter dropdown with keyboard navigation and instant map pan.
- **Interactive Sliding Station Sheet**: Displays station name, exact distance (e.g. `1.2 km`), connector list, power ratings (`kW`), dynamic tariffs, and turn-by-turn navigation links (`Google Maps` / `Apple Maps`).

#### 1.2 Mobile Responsiveness & Touch Ergonomics Enhancements
- **Touch Drag Event Isolation**: Attach `L.DomEvent.disableScrollPropagation(sheet)` and `L.DomEvent.disableClickPropagation(sheet)` to prevent map panning when scrolling connector lists on mobile touchscreens.
- **Safe Area Inset Handling**: Apply `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` to search bar (`#map-search-wrap`), floating logo, and bottom sheet to prevent clipping behind iOS Dynamic Island or Android gesture bars.
- **Fitts's Law Hitboxes**: Zoom buttons (`+` / `−`), geolocation crosshairs (`#geo-btn`), and theme toggles updated to minimum $44\times 44\text{pt}$ touch targets with `rounded-2xl` glassmorphic styling.
- **Currency & Tariff Formatting**: Dynamically formats connector tariff rates using British Pounds (`£` / `GBP`) inherited from `/api/v1/public/branding` (e.g. `£0.42/kWh`).
- **Sheet Drag Handle**: Add mobile-friendly swipe down gesture on `#sheet-handle` for fluid dismissal.

---

### Screen 2: Pre-Charge & Cost Estimator (`/charge/{cp_id}/{connector}`)
- **Hero Card**: Glassmorphic `rounded-3xl` card displaying station name, physical connector identifier, maximum power rating (e.g. `150 kW DC CCS2`), and live tariff rate (`£0.42/kWh`).
- **Interactive Energy Slider (Fitts's Law Target)**:
  - Driver drags slider: *"Target Energy: 40 kWh (+140 miles)"*.
  - Instant live cost calculation: `£16.80 estimated`.
- **Optional Battery Estimation Accordion (AC Charging Support)**:
  - Collapsible squircle: *"Optional: Enter your EV battery details for accurate SoC %"*.
  - Inputs (12pt / `h-11 px-4 text-base rounded-xl`):
    - Starting Battery Level: `35%`
    - Target Battery Level: `80%`
    - Battery Pack Capacity: `64 kWh`
  - When submitted, values are persisted directly to `ocpp.public_sessions` in PostgreSQL.
- **Primary CTA**:
  - Full-width `h-12 rounded-2xl bg-primary text-on-primary font-bold text-base shadow-apple-md hover:shadow-apple-lg transition-all flex items-center justify-center gap-2`:
    **"Start Charging (£25 Pre-Authorization)"**

---

### Screen 3: 120-Second "Preparing / Please Plug In" Experience
- **Trigger**: Driver taps "Start Charging" while the connector is in `Available` / `Preparing` state (cable not yet inserted or contactors not closed).
- **Layout & Interaction**:
  - Full-screen modal overlay with `bg-background/90 backdrop-blur-3xl`.
  - Circular SVG countdown timer with continuous stroke-dashoffset animation ($120\text{s} \rightarrow 0\text{s}$).
  - Animated SVG illustration depicting the charging plug clicking into the vehicle inlet.
  - Clear Typography:
    - Headline: `text-2xl font-extrabold text-white`: *"Please plug the connector into your EV"*.
    - Subtitle: `text-sm text-slate-300`: *"Awaiting physical connection on Connector #1 at Newcastle Hub..."*
  - Live heartbeat status monitoring OCPP transitions:
    `IEC 61851 Pilot State A (12V) ➔ State B (9V Connected) ➔ State C (6V Charging)`.
  - Action Controls:
    - Button 1: *"Cancel & Release Pre-Auth"* $\rightarrow$ Calls `POST /api/v1/public/sessions/{id}/cancel`.
  - **Auto-Timeout Safety**: If 120s elapses without cable connection, the app automatically cancels the session, releases the pre-auth hold, and displays: *"Session timed out: No vehicle connection detected. Pre-authorization released."*

---

### Screen 4: Live Telemetry & Dual Concentric Rings (`/session/{session_id}`)
- **Hero Telemetry Widget (Dual Concentric Apple Activity Rings)**:
  - Outer Ring (Cyan / Emerald): Delivered Energy ($\text{kWh}$) progress toward target (e.g. `24.5 / 50.0 kWh`).
  - Inner Ring (Electric Blue): Real-Time Battery State of Charge ($0\text{--}100\%$).
    - For DC CCS / ISO 15118: Driven natively by OCPP `MeterValues.req(SoC)`.
    - For AC: Driven by dynamic formula: $\text{Current SoC} = \text{Start SoC} + \left(\frac{\Delta\text{kWh}}{\text{Capacity}} \times 100\right)$.
- **Telemetry Metric Grid (`grid-cols-2 md:grid-cols-4 gap-3`)**:
  - **Card 1 (Power)**: Instantaneous power in $\text{kW}$ with live pulse indicator (`tabular-nums text-3xl font-bold`).
  - **Card 2 (Energy)**: Cumulative $\text{kWh}$ delivered.
  - **Card 3 (Duration)**: Active charging timer (`HH:MM:SS`).
  - **Card 4 (Cost)**: Cumulative accrued cost in British Pounds (`£10.29`).
- **Emergency Action Buttons**:
  - **Stop Button**: Large red glassmorphic button (`bg-rose-600 hover:bg-rose-500 rounded-2xl h-12 text-white font-bold flex items-center justify-center gap-2`).
  - **Unlock Cable Button**: Secondary outline button (`border border-white/20 hover:border-white/40 rounded-2xl h-12 text-slate-200 font-semibold flex items-center justify-center gap-2`) calling `POST /api/v1/public/chargers/{cp_id}/connectors/{connector_id}/unlock`.

---

### Screen 5: Overstay Grace Period & Idle Fee Engine
- **Trigger**: When vehicle reaches $100\%$ SoC or charging stops, but the physical connector remains inserted in the vehicle inlet (Pilot State B).
- **Grace Period Timer**:
  - 15-minute countdown banner in amber glassmorphism:
    *"Charging Complete — 15:00 min remaining before £0.50/min overstay fees apply."*
- **Push Notification & SMS**:
  - Dispatches browser Web Push notification via `POST /api/v1/public/push/subscribe` and SMS:
    *"Your vehicle has completed charging. Please unplug and vacate the bay within 15 minutes to avoid idle parking surcharges."*
- **Auto-Dismiss**: As soon as the cable is unplugged (Pilot State A / `Available`), transitions to Screen 6.

---

### Screen 6: Receipt & Session Summary (`/receipt/{session_id}`)
- **Celebration & Header**:
  - Confetti burst animation upon completed session.
  - Title: *"Charging Complete"*.
- **Itemized Billing Summary Card**:
  - Station & Connector: `Newcastle Central Hub — Station #01 (CCS2)`
  - Total Energy: `34.82 kWh`
  - Charging Duration: `00:42:15`
  - Average Power: `49.5 kW`
  - Base Energy Cost: `£14.62`
  - Overstay / Idle Surcharge: `£0.00`
  - VAT ($20\%$): `£2.92`
  - **Total Paid**: `£17.54` (Charged to Card ending in 4242)
- **Actions**:
  - One-Tap **"Download Tax Receipt (PDF)"** calling `GET /api/v1/public/sessions/{session_id}/pdf`.
  - **"Unlock Cable"** button (if cable is still connected).
  - **"Back to Map / New Session"**.

---

## 4. Backend Engineering Workstream (`opencpo-core`)

### 4.1 Schema Migration (`ocpp.public_sessions`)
```sql
-- Migration: Add driver SoC estimation and unlock timestamp
ALTER TABLE ocpp.public_sessions
  ADD COLUMN IF NOT EXISTS driver_start_soc_pct INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS driver_target_soc_pct INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS battery_capacity_kwh NUMERIC(5,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS latest_soc_pct INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS idle_duration_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS idle_fee_amount NUMERIC(8,2) DEFAULT 0.00;
```

### 4.2 Public Cable Unlock API Endpoint (`public.py` & `charger_commands.py`)
```python
@router.post("/public/chargers/{cp_id}/connectors/{connector_id}/unlock")
async def unlock_connector_public(cp_id: str, connector_id: int):
    """Emergency cable unlock command dispatched by driver."""
    from state import charger_registry
    try:
        msg_id = await charger_registry.send_unlock_connector(cp_id, connector_id)
        return {
            "status": "Unlocked",
            "message": f"UnlockConnector dispatched to {cp_id} connector {connector_id}",
            "msg_id": msg_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to unlock connector: {str(e)}")
```

### 4.3 Enhanced Public Session Telemetry Payload (`public_sessions.py`)
Ensure `GET /api/v1/public/sessions/{id}` returns:
```json
{
  "id": "7f84a329-e46a-782b-1d03-cbf9902e48aa",
  "status": "Charging",
  "kwh": 24.51,
  "power_kw": 48.2,
  "duration_seconds": 1820,
  "cost": 10.29,
  "currency": "GBP",
  "currency_symbol": "£",
  "soc_pct": 68,
  "is_estimated_soc": false,
  "idle_duration_seconds": 0,
  "cable_locked": true
}
```

---

## 5. EVerest Simulation Validation Matrix (`everest.mapletyne.com`)

The testing suite validates all physical, electrical, protocol, and UI edge cases using the EVerest simulation environment.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             EVEREST TEST MATRIX & VERIFICATION SUITE                             │
├─────────┬──────────────────────┬────────────────────────────────────┬────────────────────────────┤
│ TEST ID │ SCENARIO             │ PROTOCOL / PHYSICAL INTERACTION    │ EXPECTED OUTCOME           │
├─────────┼──────────────────────┼────────────────────────────────────┼────────────────────────────┤
│ EV-01   │ Happy Path DC Fast   │ App pre-auth (£25) ➔ EVerest plug  │ Starts charging in <3s,    │
│         │ Charging (CCS2)      │ in within 20s ➔ ISO 15118 TLS      │ live SoC ring streams 10%  │
│         │                      │ handshake ➔ StartTransaction       │ to 80%, stop from app.     │
├─────────┼──────────────────────┼────────────────────────────────────┼────────────────────────────┤
│ EV-02   │ 120s Cable Insertion │ App pre-auth ➔ Driver walks away   │ Interstitial shows 120s    │
│         │ Timeout              │ without plugging in cable          │ countdown ➔ Auto-cancels   │
│         │                      │                                    │ pre-auth at 0s cleanly.    │
├─────────┼──────────────────────┼────────────────────────────────────┼────────────────────────────┤
│ EV-03   │ Vehicle Side BMS     │ Active charge ➔ EVerest vehicle    │ Contactors open, status ➔  │
│         │ Target Stop (100%)   │ reaches 100% SoC ➔ State C ➔ B     │ Finishing, 15-min overstay │
│         │                      │                                    │ grace period banner fires. │
├─────────┼──────────────────────┼────────────────────────────────────┼────────────────────────────┤
│ EV-04   │ Stuck Cable Recovery │ Untethered AC Type 2 session stops │ Driver clicks "Unlock      │
│         │ (UnlockConnector)    │ but simulated solenoid lock stays  │ Cable" ➔ UnlockConnector   │
│         │                      │ engaged                            │ dispatches ➔ Lock opens.   │
├─────────┼──────────────────────┼────────────────────────────────────┼────────────────────────────┤
│ EV-05   │ Network Flapping &   │ SSE event bus connection cut for   │ App switches to 3s polling │
│         │ Cellular Drop        │ 15 seconds during active charge    │ without jitter ➔ Reconnects│
│         │                      │                                    │ to SSE automatically.      │
└─────────┴──────────────────────┴────────────────────────────────────┴────────────────────────────┘
```

---

## 6. Phased Implementation Roadmap

```
Week 1: Core API & Database Ext.   ➔ Schema migration, UnlockConnector endpoint, session payload.
Week 2: Apple HIG Visual System    ➔ Tailwind tokens, 12pt form floor, £ GBP, dynamic branding.
Week 3: Interactive Charging Flow  ➔ 120s cable insertion modal, dual concentric rings, SoC engine.
Week 4: Grace Period & SSE Stream  ➔ Idle fee alerts, push notifications, zero-latency SSE bus.
Week 5: EVerest Integration        ➔ Live verification against everest.mapletyne.com & deploy.
```

---

## 7. Acceptance Criteria Checklist
- [ ] **Apple HIG Alignment**: Translucent glassmorphism, squircles (`rounded-3xl`), obsidian canvas `#0b1326`, and dynamic branding watermark implemented.
- [ ] **12pt Form Floor**: All inputs and controls satisfy 12pt (16px) minimum font size and 44pt touch target heights.
- [ ] **British Pounds Standardization**: All currency signs display `£` with dynamic formatting inherited from `GET /api/v1/public/branding`.
- [ ] **API Catalog Alignment**: All request and response schemas strictly match `docs/ADMIN_MANAGEMENT_API_INVENTORY.md`.
- [ ] **120s Interstitial Timeout**: Awaiting cable connection modal counts down from 120s and cancels pre-auth on expiry.
- [ ] **Battery SoC Visualizer**: Dual concentric activity rings display delivered kWh and live battery SoC percentage (native DC + optional AC manual estimator).
- [ ] **Emergency Cable Unlock**: Working `UnlockConnector.req` trigger accessible on session and receipt screens.
- [ ] **Overstay Grace Period Engine**: 15-minute countdown and push notification upon charging completion.
- [ ] **Zero-Latency Telemetry**: Persistent SSE stream with transparent 3-second HTTP polling fallback.
- [ ] **EVerest Compatibility**: 100% pass rate across EV-01 through EV-05 test scenarios on `everest.mapletyne.com`.
