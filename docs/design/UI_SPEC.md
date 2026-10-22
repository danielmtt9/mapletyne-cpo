# UI Specification, Interaction Architecture & Accessibility (Enterprise Standards)

**Platform:** Mapletyne MTT Charge CPO Enterprise (`mapletyne-admin` & `mapletyne-chargeapp`)  
**Visual SSOT Reference:** Penpot File `b0861d9d-6919-8015-8008-d266309e53fd` (12 Verified Artboards)  
**Compliance Target:** WCAG 2.1 Level AA / Level AAA (Core Telemetry & Emergency Controls)

---

## 1. Accessibility & ARIA Invariants (WCAG 2.1 AA / AAA)

### 1.1 Luminance & Contrast Ratios
- **Operator Mission Control (`mapletyne-admin` — Light Mode Default `#F8FAFC`):**
  - Primary data text (`#0F172A` on `#FFFFFF` / `#F8FAFC`): **`17.4:1` (AAA)**.
  - Secondary metadata (`#475569` on `#FFFFFF`): **`7.5:1` (AAA)**.
  - Primary Brand CTA (`#FFFFFF` on `#006948`): **`6.8:1` (AA+ / Large AAA)**.
  - Dark Left Sidebar & Oscilloscope Drawers (`#F8FAFC` on `#0F172A`): **`17.4:1` (AAA)**.
- **Driver Mobile PWA (`mapletyne-chargeapp` — OLED Dark-Mode-First `#0B0F19`):**
  - Primary telemetry numerals (`#F8FAFC` on `#0B0F19` / `#0F172A`): **`18.1:1` (AAA)**.
  - Live Emerald Accents (`#10B981` / `#48E260` on `#0B0F19`): **`8.9:1` to `11.4:1` (AAA)**.
  - Secondary labels (`#94A3B8` on `#0F172A`): **`5.8:1` (AA)**.
- **Non-Text UI Component Boundaries:**
  - All interactive input borders, segmented controls, and card outlines maintain appropriate `1px solid` structural boundaries (`#E2E8F0` / `#CBD5E1` in Light Mode; `#1E293B` / `#334155` in OLED Dark Mode) supplemented by high-contrast focus rings.

### 1.2 Focus Management & Keyboard Navigation
- **Global Focus Ring (`:focus-visible`):**
  - Every focusable element renders a `2px solid var(--primary)` (`#006948` light / `#10B981` dark) outline with `outline-offset: 2px`.
- **Modal & Drawer Focus Trapping:**
  - Slide-over drawers ([`ChargerDetailDrawer.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/components/chargers/ChargerDetailDrawer.tsx), [`VehicleTelematicsDrawer.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/components/fleet/VehicleTelematicsDrawer.tsx)) and modals ([`CommandPaletteModal.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/components/layout/CommandPaletteModal.tsx), [`EmsOverrideModal.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/components/fleet/EmsOverrideModal.tsx)) trap `Tab` / `Shift+Tab` focus while open, close on `Escape`, and restore focus to the triggering element upon dismissal.
- **Global Keyboard Shortcuts:**
  - `Cmd+K` / `Ctrl+K` opens the [`CommandPaletteModal`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/components/layout/CommandPaletteModal.tsx) from any operator screen for instant navigation to chargers, bays, sessions, or OCPP actions.

### 1.3 Fitts's Law Touch Targets & Semantic ARIA
- **Touch Target Floor (`>= 44x44px`):**
  - All interactive controls across both desktop and mobile viewports enforce a minimum `44x44px` hit target (`48x48px` standard on mobile PWA).
  - Visual icons (`24x24px` `material-symbols-outlined`) inside headers, table action cells, and bottom sheets are wrapped in `44x44px` or `48x48px` button containers.
- **Decorative vs. Semantic Icons:**
  - Decorative Material Symbols adjacent to text labels MUST include `aria-hidden="true"`.
  - Icon-only action buttons (e.g., theme toggle, notification bell, drawer close button) MUST declare an explicit `aria-label` and `title`.
- **Live Region Announcements:**
  - Real-time charging state transitions (`Available` $\rightarrow$ `Preparing` $\rightarrow$ `Charging` $\rightarrow$ `Finishing` $\rightarrow$ `Faulted`) use `aria-live="polite"` (or `aria-live="assertive"` for critical hardware faults and E-Stop alerts).

---

## 2. Screen-by-Screen UI & Interaction Specifications (12 Artboards)

### 2.1 Driver Mobile PWA (`mapletyne-chargeapp` — `392x844px` OLED `#0B0F19`)

#### Screen 01: Depot Map & Station Discovery (`Mobile - Driver 01 Depot Map`)
- **Preview:** [`b0861d9d-6919-8015-8008-d266309e53fd_driver_01_depot_map.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_driver_01_depot_map.svg)
- **Header & Search (`y: 36–148px`):**
  - Top bar (`#0F172A`, `52px` height) with Mapletyne brand mark, live grid tariff badge (`$0.28/kWh`), and notification trigger.
  - Search input well (`360x48px`, `#1E293B`, `16px` font) with `search` and `tune` Material Symbols.
- **Filter Chip Rail (`y: 156–192px`):**
  - Horizontal scrollable filter chips (`36px` visual pill with `44px` vertical hit zone): `All (12)`, `CCS2 350kW`, `Available Now`, `ISO 15118 P&C`.
- **Interactive Dark Vector Map Canvas (`y: 204–500px`):**
  - Renders depot charger pins with color-coded availability badges (`#10B981` Available, `#38BDF8` In-Use, `#F59E0B` Reserved) and floating `my_location` FAB (`48x48px`).
- **Selected Dispenser Bottom Sheet (`y: 512–756px`):**
  - Card container (`360x244px`, `#0F172A`, `16px` corner radius, `#1E293B` border).
  - Displays Station Title (`Mapletyne Hub — Bay A04`), status pill (`AVAILABLE`), connector cards (`CCS2 #1 • 350 kW DC`, `CCS2 #2 • 150 kW DC`), and full-width `#006948` primary CTA (`48px` height): **"Select Connector & Start Charge"**.

#### Screen 02: QR Code Scanner & Plug & Charge Auth (`Mobile - Driver 02 QR Scan`)
- **Preview:** [`b0861d9d-6919-8015-8008-d266309e53fd_driver_02_qr_scan.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_driver_02_qr_scan.svg)
- **Camera Viewfinder (`y: 120–420px`):**
  - `280x280px` centered optical reticle on `#0F172A` surface with `#10B981` corner brackets and animated horizontal scan laser (`#48E260`).
  - Quick torch/flashlight toggle and camera flip buttons (`48x48px` hit targets).
- **Manual EVSE ID Entry & ISO 15118 Fallback (`y: 444–748px`):**
  - Manual Station Code input (`360x48px`, `16px` monospace input, e.g., `MTT-YYZ-A04`) + `#006948` **"Verify Dispenser"** button (`48px` height).
  - ISO 15118 Plug & Charge readiness banner showing active vehicle contract certificate status (`EMAID: CA-MTT-884920-A`).

#### Screen 03: Active Charging Session Telemetry (`Mobile - Driver 03 Active Telemetry`)
- **Preview:** [`b0861d9d-6919-8015-8008-d266309e53fd_driver_03_active_telemetry.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_driver_03_active_telemetry.svg)
- **Hero SoC Ring Gauge (`y: 104–324px`):**
  - Centered circular SoC ring (`#0F172A` card, `#10B981` active progress ring) displaying **`78%` SoC** in `36px` bold tabular numerals, target SoC (`90%`), and estimated time remaining (`14 min left`).
- **4-Tile Real-Time Telemetry Bento Grid (`y: 340–548px`):**
  - 2x2 grid of `172x96px` `#0F172A` cards (`16px` gap):
    1. **Charging Power:** `184.6 kW` (`#38BDF8` sky accent, `bolt` icon, `800V • 231A`).
    2. **Energy Delivered:** `42.80 kWh` (`#10B981` emerald accent, `battery_charging_full` icon).
    3. **Session Duration:** `00:18:42` (`#F8FAFC` tabular clock, `schedule` icon).
    4. **Running Cost:** `$11.98` (`#F59E0B` amber accent, `payments` icon, `@ $0.28/kWh`).
- **Live Power Curve & Stop Control (`y: 564–756px`):**
  - Sparkline power profile card (`360x116px`) + High-emphasis `#EF4444` crimson **"Stop Charging Session"** button (`360x52px`) with `stop_circle` Material Symbol.

#### Screen 04: Itemized CDR Digital Receipt (`Mobile - Driver 04 Digital Receipt`)
- **Preview:** [`b0861d9d-6919-8015-8008-d266309e53fd_driver_04_digital_receipt.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_driver_04_digital_receipt.svg)
- **Completion Summary (`y: 100–252px`):**
  - Emerald verification badge (`check_circle`), total billed amount (`$16.42`), and OCPI CDR reference ID (`CDR-2026-1021-8841`).
- **Itemized Fiscal Ledger (`y: 268–604px`):**
  - Tabular breakdown of Energy Delivered (`52.40 kWh @ $0.28/kWh = $14.67`), Peak Demand / Idle Fee (`$0.00`), Harmonized Tax (`HST 13% = $1.75`), Eichrecht cryptographic meter signature status (`Verified OCMF`), and payment method (`Visa •••• 4821`).
- **Receipt Actions (`y: 620–752px`):**
  - Primary `#006948` **"Download PDF Invoice"** button (`48px` height) and secondary `#1E293B` **"Email Receipt / Return to Map"** button (`48px` height).

#### Screen 05: Driver OIDC Login, OTP & Guest Access (`Mobile - Driver 05 Login Register`)
- **Preview:** [`b0861d9d-6919-8015-8008-d266309e53fd_driver_05_login_register.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_driver_05_login_register.svg)
- **Authentication Modes:**
  - Segmented toggle (`Sign In` / `Create Account`, `44px` height).
  - Email/fleet ID and password inputs (`48px` height, `16px` font), `#006948` **"Sign In with Keycloak SSO"** CTA (`48px` height), and **"Instant Guest QR Pay"** ad-hoc charging flow.

#### Screen 06: Driver Account, Wallet & ISO 15118 PKI (`Mobile - Driver 06 Account Profile`)
- **Preview:** [`b0861d9d-6919-8015-8008-d266309e53fd_driver_06_account_profile.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_driver_06_account_profile.svg)
- **Driver & Fleet Identity Card:** Driver avatar, Fleet Group badge (`Mapletyne Logistics Fleet #04`), active RFID token (`UID: 04:A2:9F:11:C0`), and ISO 15118 Plug & Charge X.509 contract certificate provisioning control.

#### Screen 07: Charging History & Analytics (`Mobile - Driver 07 Charging History`)
- **Preview:** [`b0861d9d-6919-8015-8008-d266309e53fd_driver_07_charging_history.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_driver_07_charging_history.svg)
- **Monthly Energy & Spend Summary:** Aggregate kWh (`618.4 kWh`), total spend (`$173.15`), CO2 offset metric, and chronological list of clickable CDR session cards (`360x88px` each).

#### Screen 08: App Preferences & Vehicle Settings (`Mobile - Driver 08 Settings`)
- **Preview:** [`b0861d9d-6919-8015-8008-d266309e53fd_driver_08_settings.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_driver_08_settings.svg)
- **Configuration Controls:** Target SoC limit preset (`80% Daily / 100% Route`), push notification toggles (Session Complete, Idle Fee Warning, Fault Alert), multi-language selector (`EN / FR / DE`), and offline PWA cache management.

---

### 2.2 Operator Mission Control (`mapletyne-admin` — `1440x1024px` M3 Light Default `#F8FAFC`)

#### Operator Screen 01: Executive Depot Mission Control (`Desktop - Operator Mission Control`)
- **Preview:** [`b0861d9d-6919-8015-8008-d266309e53fd_operator_01_mission_control.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_operator_01_mission_control.svg)
- **KPI Ribbon (`y: 88–204px`):**
  - 4 cards (`270x116px` each): **Active Site Load** (`1,284.5 kW / 1,500 kW Cap`), **Active Charging Sessions** (`18 / 24 Bays`), **EVSE Network Uptime** (`99.4% Online`), and **24h Energy Dispensed** (`14,820 kWh`).
- **Real-Time Microgrid Load Curve (`x: 264, y: 228, w: 760, h: 380px`):**
  - Multi-series area chart plotting Grid Import (`#0284C7`), Solar PV Generation (`#10B981`), BESS Discharge (`#8B5CF6`), and Peak Shaving Threshold (`1,500 kW` dashed `#EF4444` guardrail).
- **Fleet Connector Status Donut & Alerts (`x: 1048, y: 228, w: 368, h: 380px`):**
  - Live breakdown of Available (`12`), Charging (`18`), Reserved (`4`), and Faulted (`1`) connectors plus actionable OCPP fault triage feed.
- **Active Depot Dispenser Telemetry Table (`x: 264, y: 632, w: 1152, h: 368px`):**
  - High-density tabular ledger (`48px` row height) with live kW, SoC %, vehicle VIN/plate, tariff tier, and 1-click remote action triggers.

#### Operator Screen 02: EVSE Charger Management & 3-Phase Oscilloscope (`Desktop - Operator 02 EVSE Charger Management`)
- **Preview:** [`b0861d9d-6919-8015-8008-d266309e53fd_operator_02_evse_management.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_operator_02_evse_management.svg)
- **Hardware Inventory Matrix (`x: 264, y: 228, w: 740, h: 772px`):**
  - Multi-facet filter bar (`All`, `Online`, `Charging`, `Faulted`, `OCPP 2.0.1`) + virtualized station table showing firmware version, heartbeat latency, and connector states.
- **High-Contrast Dark Telemetry Drawer (`x: 1020, y: 228, w: 396, h: 772px`):**
  - Dedicated `#0F172A` diagnostic panel embedding a live **3-Phase Oscilloscope** (`L1` `#10B981`, `L2` `#38BDF8`, `L3` `#F59E0B` voltage/current waveforms), internal cabinet thermals (`42.1°C`), and OCPP 2.0.1 remote command grid (`RemoteStartTransaction`, `RemoteStopTransaction`, `Reset(OnIdle)`, `UnlockConnector`, `TriggerMessage`).

#### Operator Screen 03: Depot Bay Matrix & Fleet Departure Gantt (`Desktop - Operator 03 Depot Bay Fleet Gantt`)
- **Preview:** [`b0861d9d-6919-8015-8008-d266309e53fd_operator_03_depot_bay_gantt.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_operator_03_depot_bay_gantt.svg)
- **Spatial Depot Bay Grid ([`DepotBayGrid.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/components/fleet/DepotBayGrid.tsx)):**
  - Interactive visual bay map (`Bays A01–B12`) displaying assigned electric bus/truck ID, current SoC %, target SoC %, and departure readiness status.
- **24-Hour Fleet Departure Gantt Timeline ([`FleetGanttTimeline.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/components/fleet/FleetGanttTimeline.tsx)):**
  - Horizontal time-block scheduler aligning overnight charging windows, off-peak TOU tariff valleys, and mandatory morning route pull-out deadlines (`05:30 AM` / `06:00 AM`).

#### Operator Screen 04: Smart Charging Dispatcher & Peak Shaving Guardrails (`Desktop - Operator 04 Smart Charging Peak Shaving`)
- **Preview:** [`b0861d9d-6919-8015-8008-d266309e53fd_operator_04_smart_charging.svg`](file:///home/danielaroko/applications/mapletynecpo/docs/designs/previews/b0861d9d-6919-8015-8008-d266309e53fd_operator_04_smart_charging.svg)
- **Autonomous Peak Shaving Guardrails ([`PeakShavingGuardrails.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/components/ems/PeakShavingGuardrails.tsx)):**
  - Site transformer capacity ceiling control (`1,500 kW` hard limit, `1,350 kW` dynamic warning buffer), BESS discharge dispatch rules, and solar self-consumption priority.
- **OCPP `SetChargingProfile` Dispatcher ([`SmartChargingProfileDispatcher.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/components/ems/SmartChargingProfileDispatcher.tsx)):**
  - Per-dispenser dynamic curtailment table showing allocated kW ceiling vs. requested vehicle kW, priority tier (`Tier 1 Route Critical` vs. `Tier 3 Dwell Flexible`), and 1-click profile push.

---

## 3. Cognitive Animation, Micro-Interactions & Performance Budgets

- **Transition Timing Budget:**
  - Hover states and button feedback: `150ms cubic-bezier(0.4, 0, 0.2, 1)`.
  - Slide-over drawers and bottom sheets: `220ms cubic-bezier(0.16, 1, 0.3, 1)` (never exceed `300ms`).
- **Reduced Motion Compliance:**
  - Respect `@media (prefers-reduced-motion: reduce)` by disabling pulse animations and drawer slide transitions in favor of instantaneous opacity changes.
- **Doherty Threshold (< 100ms UI Feedback):**
  - Remote OCPP hardware commands (`RemoteStart`, `RemoteStop`, `SetChargingProfile`, `UnlockConnector`) MUST immediately transition the button to an optimistic pending state (`Pending ACK...` with spinner) within `< 50ms` while awaiting the asynchronous OCPP WebSocket `CallResult`.
