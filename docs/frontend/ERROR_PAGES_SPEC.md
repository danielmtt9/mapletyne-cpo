# Error Boundaries, Fault Recovery & System Pages Specification

**Platform:** Mapletyne MTT Charge CPO Enterprise (`mapletyne-admin` & `mapletyne-chargeapp`)  
**Operational Safety Principle:** A frontend UI exception or network drop MUST NEVER interrupt active physical EV charging delivery or leave an operator without a recovery path. Connected EVSEs autonomously enforce local OCPP `TxDefaultProfile` power limits during CSMS UI faults.

---

## 1. Error Handling Hierarchy (`mapletyne-admin`)

### 1.1 Global React Error Boundary ([`src/components/common/ErrorBoundary.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/components/common/ErrorBoundary.tsx))
Wraps the entire application tree in [`src/App.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/App.tsx) (`<ErrorBoundary>`). If any child component or chart throws an unhandled rendering exception:

- **Visual Specification:**
  - Full-viewport centered recovery card (`max-w-2xl`, `p-8 sm:p-12`, `border-outline`, `shadow-2xl`) on `--background` (`#F8FAFC` light / `#0F172A` dark).
  - **Icon Container:** `80x80px` (`w-20 h-20 rounded-2xl`) rose alert badge (`bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20`) with `48px` Google Material Symbol `cloud_off` (`aria-hidden="true"`).
  - **Status Pill:** Monospace badge `ERR_TELEMETRY_ENGINE_FAULT (500)`.
  - **Headline:** `Microgrid Telemetry Dispatcher Unreachable` (`text-3xl font-bold`).
  - **Safety Assurance Copy:** Informs the operator that connected dispensers have safely defaulted to local autonomous power limits (`Fallback Safe State Active — 100 kW Dispenser Cap`).
  - **Diagnostic Monospace Terminal Box (`bg-surface-container-high font-mono text-xs`):**
    - Renders `[EXCEPTION] <ErrorName>: <ErrorMessage>`
    - Renders `[GATEWAY] Status: Fallback Safe State Active (100 kW Dispenser Cap)`
    - Renders truncated stack trace (`max-h-28 overflow-y-auto text-[11px]` in diagnostic block) for rapid incident triage.
  - **Recovery CTAs (Fitts's Law `>= 44px` height):**
    1. **Primary CTA (`bg-primary text-white rounded-xl px-6 py-3`):** Icon `refresh` + `"Reload Operations View"` (`window.location.reload()`).
    2. **Secondary CTA (`border-outline bg-surface-container rounded-xl px-5 py-3`):** Icon `logout` + `"Return to Login"` (clears `opencpo_admin_jwt` and redirects to `/login`).

### 1.2 Unresolved Route / 404 Page ([`src/pages/NotFoundPage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/NotFoundPage.tsx))
Bound to `<Route path="*" element={<NotFoundPage />} />` inside [`AppShell`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/components/layout/AppShell.tsx) so the operator retains full access to the Left Navigation Sidebar and Top Header:

- **Visual Specification:**
  - Centered diagnostic card (`max-w-xl`, `p-8 sm:p-12`) with Material Symbol `cloud_off`.
  - **Status Pill:** `ERR_ROUTE_NOT_FOUND (404)`.
  - **Headline:** `Substation View or Route Not Found`.
  - **Diagnostic Monospace Terminal Box:**
    - `[ROUTER-GATEWAY] HTTP 404: Endpoint unresolved`
    - `[REGISTRY] Checked: /chargers, /sessions, /ems, /fleet, /settings`
    - `Path: <window.location.pathname>`
  - **Recovery CTAs:**
    1. **Primary CTA (`bg-primary text-white`):** Material Symbol `dashboard` + `"Return to Dashboard"` (`<NavLink to="/">`).
    2. **Secondary CTA (`border-outline bg-surface-container`):** Material Symbol `arrow_back` + `"Go Back"` (`window.history.back()`).

### 1.3 API & Real-Time Stream Fault Resilience
- **HTTP `401 Unauthorized` Interceptor ([`src/lib/api-client.ts`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/lib/api-client.ts)):**
  - Automatically clears expired JWT credentials and redirects to `/login` without crashing React components.
- **SSE Telemetry Disconnection ([`src/hooks/use-live-events.ts`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/hooks/use-live-events.ts)):**
  - When `/api/v1/events/stream` drops, `isConnected` transitions to `false`, switching the sidebar/header status indicator from `LIVE FEED: Active` (emerald pulse) to `RECONNECTING...` (amber badge) and scheduling an automatic 5-second reconnect timer.
- **Defensive Collection Fallback (`ensureArray`):**
  - If an API endpoint returns HTTP `502` / `503` or an empty payload, `SiteContext` and page views fall back gracefully to empty arrays `[]` or cached `localStorage` branding (`opencpo_branding`) rather_than throwing TypeError exceptions.

---

## 2. Driver Mobile PWA Error & Offline Specification (`mapletyne-chargeapp`)

### 2.1 Mobile Error Template ([`mapletyne-chargeapp/templates/error.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/error.html))
Extends [`base.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/base.html) on the `#0B0F19` OLED Dark-Mode-First canvas so the bottom navigation bar (`Map`, `Scan`, `Account`) remains accessible at all times:

- **Layout & Ergonomics (`392x844px` mobile viewport):**
  - Vertically centered container (`min-height: 80vh`, `max-width: 360px`, `padding: 24px`).
  - Displays tenant brand logo (`/skin/logo.svg` with automatic fallback to `/skin/logo.png`).
  - High-contrast warning icon (`48px`), primary error heading (`20px` bold `#F8FAFC`), and secondary diagnostic detail (`13px` `#94A3B8`).
  - Full-width tactile recovery CTA (`btn btn-primary`, `>= 48px` height): **"Back to map"** (`href="/app/"`).

### 2.2 Driver Session & Hardware Fault States

| Fault Scenario | HTTP / OCPP Code | Driver Mobile PWA UX Response | Operator Mission Control UX Response |
| :--- | :--- | :--- | :--- |
| **QR Code / EVSE ID Not Found** | `HTTP 404` | Inline banner on Screen 02 (`Mobile - Driver 02 QR Scan`) prompting manual Station ID verification or re-scan | Logged as unmapped lookup |
| **Connector Occupied or Reserved** | `HTTP 409 Conflict` / `Occupied` | Bottom sheet highlights available sibling connector (e.g., `CCS2 #2 Available`) | Connector pill shows `#38BDF8` In-Use or `#F59E0B` Reserved |
| **Authorization Rejected (RFID / OIDC / P&C)** | `HTTP 403` / `Invalid` / `Blocked` | Displays clear reason (`Card Blocked` or `Payment Pre-Auth Declined`) with link to Wallet / Guest Pay | Triggers alert in `TokenAuditDrawer.tsx` |
| **EVSE Hardware Fault / E-Stop Pressed** | `Faulted` (`OverCurrentFailure`, `GroundFailure`, `EmergencyStop`) | Screen 03 transitions ring to `#EF4444` Fault banner, freezes cost accrual, and provides partial CDR receipt link + Support phone CTA | Top-priority `#EF4444` alert in Operator Screen 01 & 02; enables remote `Reset` / `UnlockConnector` in `ChargerDetailDrawer.tsx` |
| **Cellular / Wi-Fi Offline During Active Session** | `Navigator Offline` / `WS Closed` | Service Worker serves cached UI shell; banner states *"Connection lost — your vehicle continues charging safely. Telemetry will sync when back online."* | EVSE buffers signed OCMF meter values locally and replays upon WebSocket reconnect |
