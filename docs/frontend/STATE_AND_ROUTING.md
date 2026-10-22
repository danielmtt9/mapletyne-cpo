# State Management, Real-Time Telemetry & Routing Architecture

**Platform:** Mapletyne MTT Charge CPO Enterprise (`mapletyne-admin` & `mapletyne-chargeapp`)  
**Core Technologies:** React Router v7, TanStack Query v5 (`@tanstack/react-query`), Server-Sent Events (SSE) / WebSockets (`useLiveEvents`), FastAPI + HTMX + Jinja2 (`mapletyne-chargeapp`), Keycloak OIDC JWT Authentication.

---

## 1. State Topology & Separation of Concerns

The Mapletyne frontend architecture enforces a strict boundary between **Server Cache State**, **Real-Time Streaming Telemetry**, **Global Context State**, and **Ephemeral UI State**:

### 1.1 Server State & Live Telemetry (`mapletyne-admin`)
- **TanStack Query v5 (`QueryClient`):**
  - Configured in [`src/App.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/App.tsx) with `staleTime: 5000` (5 seconds) and `retry: 1`.
  - Standardized Query Key Hierarchy:
    - `['chargers']` — Full EVSE hardware inventory and connector status matrix.
    - `['charger', stationId]` — Single dispenser configuration, connectors, and diagnostic state.
    - `['telemetry', stationId]` — High-frequency OCPP `MeterValues` (3-phase voltage `L1/L2/L3`, current, active power kW, SoC %, cabinet temperature).
    - `['sessions']` & `['sessions', 'stats']` — Active and historical charging transactions and KPI aggregations.
    - `['ems', 'sites']` & `['ems', 'telemetry', siteId]` — Microgrid transformer load, solar PV, BESS SoC, and active curtailment profiles.
    - `['tariffs']` & `['tariffs', 'spot-curve']` — Pricing models, customer tiers, and ENTSO-E 24h day-ahead spot curves.
    - `['fleet', 'tokens']`, `['fleet', 'groups']`, `['fleet', 'vehicles']` — RFID tokens, fleet groups, depot bay assignments, and Gantt schedules.
    - `['pki', 'certificates']` — ISO 15118-2/20 V2G Root, Sub-CA, and SECC leaf certificates.
    - `['roaming', 'partners']` — OCPI 2.2.1 roaming hubs, CDR sync logs, and handshake statuses.

- **Real-Time Event Bus Synchronization ([`src/hooks/use-live-events.ts`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/hooks/use-live-events.ts)):**
  - Establishes a persistent `EventSource('/api/v1/events/stream')` connection with automatic 5-second exponential/fixed backoff reconnection on network drop.
  - Event-Driven Cache Updates:
    - `charger.status`: Immediately invalidates `['chargers']`, `['charger', data.charge_point]`, and `['sessions', 'stats']`.
    - `meter.values`: Directly mutates the query cache synchronously via `queryClient.setQueryData(['telemetry', data.charge_point], data)` for zero-latency 60fps oscilloscope rendering without triggering redundant HTTP refetches.
    - `session.started` / `session.stopped`: Immediately invalidates `['sessions']` and `['chargers']`.

### 1.2 Global React Context Providers (`mapletyne-admin`)
1. **[`ThemeProvider`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/lib/theme-provider.tsx) (`src/lib/theme-provider.tsx`):**
   - Manages `theme` (`'light' | 'dark' | 'system'`) persisted in `localStorage['mapletyne_theme']` (defaulting to `'light'` for Operator Mission Control).
   - Fetches and caches multi-tenant branding (`/api/v1/public/branding` $\rightarrow$ `localStorage['opencpo_branding']`), dynamically applying `--primary`, `--status-online`, `--tertiary`, `currencySymbol`, document title, and favicon.
2. **[`AuthProvider`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/context/AuthContext.tsx) (`src/context/AuthContext.tsx`):**
   - Decodes Keycloak OIDC / CSMS JWT tokens from `localStorage['opencpo_admin_jwt']`, normalizing realm roles (`Super Admin`, `Site Operator`, `Fleet Manager`, `EV Driver`), user initials, and time-of-day operational greetings.
   - Exposes `logout()` to purge `opencpo_admin_jwt`, `opencpo_refresh_token`, and `opencpo_user` before redirecting to `/login`.
3. **[`SiteProvider`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/context/SiteContext.tsx) (`src/context/SiteContext.tsx`):**
   - Synchronizes the global multi-site selector (`selectedSite` in `localStorage['opencpo_selected_site']`, defaulting to `'all'`).
   - Merges configured EMS sites (`/api/v1/ems/sites`) with discovered charger locations (`/api/v1/chargers`) and provides the `filterBySite<T>(items)` helper across all dashboard, charger, session, and fleet views.

### 1.3 Mutation & Cache Invalidation Policy
Every `useMutation` hook executing an OCPP command or CRUD operation MUST invalidate affected query keys in `onSuccess`:
```ts
const remoteStartMutation = useMutation({
  mutationFn: (payload: RemoteStartPayload) =>
    api.post(`/chargers/${payload.stationId}/remote-start`, payload),
  onSuccess: (_data, variables) => {
    queryClient.invalidateQueries({ queryKey: ['chargers'] });
    queryClient.invalidateQueries({ queryKey: ['charger', variables.stationId] });
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
  },
});
```

---

## 2. Routing Architecture & Route Registry

### 2.1 Operator Mission Control Routes (`mapletyne-admin` — Port `34000`)
Implemented via `BrowserRouter` in [`src/App.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/App.tsx) wrapped in `AppShell` (Left Sidebar `#0F172A` + Top Header + Outlet):

| Route Path | Page Component | Penpot Artboard Reference | Access Policy & Description |
| :--- | :--- | :--- | :--- |
| `/login` | [`LoginPage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/LoginPage.tsx) | Operator Auth | Public OIDC / JWT operator sign-in screen |
| `/` | [`DashboardPage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/DashboardPage.tsx) | `Desktop - Operator Mission Control` | Executive KPI ribbon, microgrid load curve, connector donut, live bay ledger |
| `/chargers` | [`ChargersPage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/ChargersPage.tsx) | `Desktop - Operator 02 EVSE Charger Management` | Hardware inventory table + `#0F172A` 3-phase oscilloscope drawer & remote OCPP controls |
| `/sessions` | [`SessionsPage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/SessionsPage.tsx) | Operator Sessions Ledger | Virtualized CDR billing ledger, session power curves, CSV/PDF export |
| `/tariffs` | [`TariffsPage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/TariffsPage.tsx) | Operator Tariff Engine | Multi-component tariffs, ENTSO-E 24h spot curve, dynamic margin sliders |
| `/fleet` & `/rfid-fleet` | [`RfidFleetPage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/RfidFleetPage.tsx) | `Desktop - Operator 03 Depot Bay Fleet Gantt` | Depot bay spatial matrix, 24h fleet departure Gantt timeline, RFID token & group modals |
| `/vehicles` | [`VehiclesPage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/VehiclesPage.tsx) | Operator Fleet Vehicles | Electric bus/truck VIN registry, battery capacity, ISO 15118 P&C contract status |
| `/pki` & `/pki-vault` | [`PkiVaultPage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/PkiVaultPage.tsx) | Operator PKI Vault | ISO 15118 V2G Root / Sub-CA trust tree, CRL status, SECC CSR signer |
| `/ems` | [`EmsPage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/EmsPage.tsx) | `Desktop - Operator 04 Smart Charging Peak Shaving` | Autonomous peak shaving guardrails, Sankey energy flow, OCPP `SetChargingProfile` dispatcher |
| `/roaming` | [`RoamingPage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/RoamingPage.tsx) | Operator OCPI Roaming | OCPI 2.2.1 partner cards (Hubject, Plugsurfing), Token B handshake, sync logs |
| `/settings` & `/settings/branding` | [`SettingsPage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/SettingsPage.tsx) | Operator Brand Studio | Multi-tenant Brand Studio, feature toggles, database backup & restore |
| `/profile` | [`ProfilePage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/ProfilePage.tsx) | Operator Profile | Operator account credentials, role permissions, notification preferences |
| `/editor/:pageId` | [`ReactPuckEditor.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/ReactPuckEditor.tsx) | Visual Page Studio | Protected by `AuthGuard` — visual layout editor for custom portal pages |
| `*` | [`NotFoundPage.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/pages/NotFoundPage.tsx) | Operator 404 | Diagnostic 404 substation route error card |

### 2.2 Driver Mobile PWA Routes (`mapletyne-chargeapp` — Port `34003` / `/app/`)
Served by FastAPI ([`mapletyne-chargeapp/main.py`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/main.py)) with `inject_context` middleware injecting tenant branding, feature flags, and session state:

| Route Path | FastAPI Router | Jinja2 Template | Penpot Artboard Reference | State & Telemetry Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| `/app/` | `routes/home.py` | [`home.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/home.html) | `Mobile - Driver 01 Depot Map` | Leaflet dark vector map + live station availability polling / HTMX bottom sheet |
| `/app/qr` & `/app/charge` | `routes/qr.py`, `routes/charge.py` | [`charge.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/charge.html) | `Mobile - Driver 02 QR Scan` | Camera QR scanner (`BarcodeDetector` / canvas fallback), connector picker & kWh estimator |
| `/app/session/{id}` | `routes/session.py` | [`session.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/session.html) | `Mobile - Driver 03 Active Telemetry` | Real-time WebSocket / SSE telemetry push updating SoC ring, kW, kWh, duration & cost |
| `/app/receipt/{id}` | `routes/receipt.py` | [`receipt.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/receipt.html) | `Mobile - Driver 04 Digital Receipt` | Itemized CDR fiscal breakdown, OCMF signature status & PDF invoice download |
| `/app/account/login` | `routes/auth.py` | [`auth.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/auth.html) | `Mobile - Driver 05 Login Register` | Keycloak OIDC Direct Grant login, 2-step email OTP registration & HttpOnly session cookie |
| `/app/account/profile` | `routes/auth.py` | [`auth.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/auth.html) | `Mobile - Driver 06 Account Profile` | Driver identity, RFID card management, payment methods & ISO 15118 certificate link |
| `/app/account/history` | `routes/auth.py` | [`auth.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/auth.html) | `Mobile - Driver 07 Charging History` | Historical charging sessions list, monthly kWh/spend summary & receipt links |
| `/app/account/settings` | `routes/auth.py` | [`auth.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/auth.html) | `Mobile - Driver 08 Settings` | Target SoC ceiling, Web Push notifications (`routes/push.py`), language & PWA cache reset |
| `/app/cert-setup` | `routes/cert_setup.py` | [`cert_setup.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/cert_setup.html) | ISO 15118 PKI Setup | Vehicle contract certificate installation wizard |
