# Frontend Rules, Standards & Engineering Conventions

**Platform:** Mapletyne MTT Charge CPO Enterprise  
**Applications:**
1. **Operator Mission Control (`mapletyne-admin`):** React 18/19 + TypeScript 5.7 (Strict Mode) + Vite 6 + Tailwind CSS 3.4 + TanStack Query v5 + Apache ECharts 6.
2. **Driver Mobile PWA (`mapletyne-chargeapp`):** FastAPI + Jinja2 Server-Rendered Templates + HTMX + Leaflet/MapLibre + Service Worker PWA (`manifest.json` & `sw.js`).

---

## 1. Repository Topology & Component Hierarchy

### 1.1 Operator Admin Application (`mapletyne-admin/src/`)
```text
mapletyne-admin/src/
├── App.tsx                        # Root Provider tree (ErrorBoundary -> QueryClient -> Theme -> Auth -> Site -> Router)
├── main.tsx                       # React DOM root mount
├── materialSymbolsList.ts         # Canonical allowlist of Google Material Symbols
├── context/
│   ├── AuthContext.tsx            # Keycloak OIDC JWT decoding, role normalization & session lifecycle
│   └── SiteContext.tsx            # Global multi-site selector state & site-scoped collection filter
├── hooks/
│   └── use-live-events.ts         # Server-Sent Events (SSE) / WebSocket telemetry stream -> TanStack Query cache
├── lib/
│   ├── api-client.ts              # Typed REST client with automatic Bearer token injection & 401 handling
│   ├── theme-provider.tsx         # Dual-adaptive Light/Dark/System mode + dynamic multi-tenant branding tokens
│   ├── echarts-theme.ts           # Theme-aware ECharts 6 palette & axis configuration
│   ├── telemetry-processor.ts     # High-frequency OCPP MeterValues normalization & smoothing
│   ├── utils.ts                   # cn() class merger, ensureArray() defensive unwrapper, formatters
│   └── types/
│       └── api.ts                 # Auto-generated OpenAPI TypeScript definitions (npm run codegen)
├── styles/
│   ├── globals.css                # M3 CSS custom properties (:root light default, .dark override) & Tabler classes
│   ├── m3-tokens.css              # Generated Material Design 3 HCT token variables
│   ├── m3-tokens.json             # Canonical M3 seed (#006948) token JSON
│   └── tailwind.m3-preset.js      # Tailwind CSS M3 color & typography preset
├── components/
│   ├── common/                    # ErrorBoundary, shared badges, confirmation dialogs
│   ├── layout/                    # AppShell, Sidebar (#0F172A rail), Header, CommandPaletteModal
│   ├── dashboard/                 # Executive KPI cards, live network power curves, activity feeds
│   ├── chargers/                  # ChargerDetailDrawer, ChargerTelemetryView (3-phase oscilloscope)
│   ├── sessions/                  # SessionDetailModal, SessionChargingProfileChart
│   ├── fleet/                     # DepotBayGrid, FleetGanttTimeline, DepotPowerHeadroomChart, RFID modals
│   ├── ems/                       # PeakShavingGuardrails, SmartChargingProfileDispatcher, EmsSiteFlowSankey
│   ├── tariffs/                   # TariffSpotCurveChart, CostBasisCard, PricingTierModal
│   └── roaming/                   # OcpiPartnerDetailModal
└── pages/                         # Route-level page views (DashboardPage, ChargersPage, EmsPage, etc.)
```

### 1.2 Driver Mobile PWA (`mapletyne-chargeapp/`)
```text
mapletyne-chargeapp/
├── main.py                        # FastAPI application entrypoint, PWA manifest/SW routes, skin resolver
├── config.py                      # Environment-driven port (8003/34003), CSMS API URL, skin & plugin config
├── core/
│   └── middleware.py              # Request context injection (tenant branding, feature flags, i18n, auth session)
├── routes/
│   ├── home.py                    # Station discovery map & availability endpoints (/app/)
│   ├── charge.py                  # Connector selection & pre-charge estimator (/app/charge)
│   ├── qr.py                      # QR code scanner & direct EVSE lookup (/app/qr)
│   ├── session.py                 # Live charging telemetry & SSE/WS updates (/app/session/{id})
│   ├── receipt.py                 # Itemized CDR receipt & PDF export (/app/receipt/{id})
│   ├── auth.py                    # Driver Keycloak OIDC login, OTP registration & profile (/app/account/*)
│   ├── cert_setup.py              # ISO 15118 Plug & Charge contract certificate provisioning
│   └── push.py                    # Web Push notification subscription endpoints
├── templates/
│   ├── base.html                  # OLED Dark-Mode-First (#0B0F19) PWA shell, bottom nav, SW registration
│   ├── home.html                  # Screen 01: Depot Map & Bottom Sheet
│   ├── charge.html                # Screen 02: QR Scan & Connector Auth
│   ├── session.html               # Screen 03: Active Telemetry & SoC Ring
│   ├── receipt.html               # Screen 04: Digital Receipt
│   ├── auth.html                  # Screens 05–08: Login, Profile, History & Settings
│   ├── cert_setup.html            # ISO 15118 PKI Setup
│   └── error.html                 # Mobile-optimized dark error recovery screen
└── static/
    ├── manifest.json              # PWA Web App Manifest
    ├── sw.js                      # Offline-capable Service Worker
    ├── htmx.min.js                # Declarative partial HTML updates
    └── style.css                  # Driver PWA OLED styling rules
```

---

## 2. Mandatory Coding & Design System Invariants

### 2.1 Iconography Rule (Zero Tolerance)
- **Rule:** Exclusively use Google Material Symbols via `<span className="material-symbols-outlined" aria-hidden="true">icon_name</span>`.
- **Prohibited:** Never install or import `lucide-react`, `@heroicons/react`, `react-icons`, or `@fortawesome/*`.
- **Validation:** All icon names in `mapletyne-admin` are validated against [`src/materialSymbolsList.ts`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/materialSymbolsList.ts).

### 2.2 Styling, Theme & Token Hygiene
- **Semantic CSS Variables First:** Always bind surfaces, text, and borders to semantic token classes (`bg-background`, `bg-surface-container`, `bg-surface-container-high`, `text-on-surface`, `text-on-surface-variant`, `border-outline`, `text-primary`) rather than hardcoded light-only or dark-only utility classes.
- **No Unstyled Default Fills:** Every container, modal, drawer, and SVG preview must declare an explicit M3 token fill (never leave default browser backgrounds or `#B1B2B5` Penpot placeholder fills).
- **Typography & Touch Floor Enforcement:**
  - Never use font sizes below `12px` (`text-xs`). Avoid arbitrary microscopic classes like `text-[10px]` or `text-[11px]`.
  - All `<input>`, `<select>`, `<textarea>`, and `<button>` elements must render at `16px` (`1rem` / `text-base`) minimum on mobile viewports.
  - All clickable/tappable elements must provide a minimum `44x44px` hit box (`min-h-[44px] min-w-[44px]`).
  - All numeric telemetry readouts must include the `.tnum` (`tabular-nums`) class.

### 2.3 Defensive Data Unwrapping & Strict TypeScript
- **Zero Unhandled Undefined Crashes:** Backend endpoints may return either a raw JSON array `[...]` or a keyed envelope `{ chargers: [...] }` / `{ items: [...] }`. Always normalize collections through `ensureArray(data, 'key')` from [`src/lib/utils.ts`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/lib/utils.ts) before calling `.map()`, `.filter()`, or `.reduce()`.
- **OpenAPI Type Synchronization:** Run `npm run codegen` in `mapletyne-admin` to regenerate [`src/lib/types/api.ts`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/lib/types/api.ts) whenever backend FastAPI Pydantic schemas change.
- **Import Ordering Standard:**
  1. External React / Router / TanStack packages (`react`, `react-router-dom`, `@tanstack/react-query`)
  2. Internal contexts & hooks (`@/context/*`, `@/hooks/*`)
  3. Internal library utilities & API client (`@/lib/*`)
  4. Domain feature components (`@/components/*`)
  5. Styles & static assets

---

## 3. Security & Shift-Left Frontend Rules

- **XSS Prevention:** Never use `dangerouslySetInnerHTML` in React or `| safe` in Jinja2 templates on untrusted user, OCPP station, or RFID tag strings. Jinja2 autoescaping must remain enabled for all `.html` templates.
- **Tenant & Auth Token Isolation:**
  - Admin JWTs (`opencpo_admin_jwt`) are verified on route transitions via `AuthGuard` and automatically cleared on HTTP `401 Unauthorized` responses.
  - Multi-tenant branding overrides injected via [`ThemeProvider`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/lib/theme-provider.tsx) only set validated CSS custom properties (`--primary`, `--status-online`, `--tertiary`) via `document.documentElement.style.setProperty()` and never interpolate raw CSS strings into `<style>` tags.
- **Package Hygiene:** Do not add new npm or pip packages without running dependency vulnerability scanning (`scan_dependencies`). Prefer native browser APIs and existing workspace libraries (`echarts`, `@tanstack/react-query`, `@tanstack/react-table`, `@tanstack/react-virtual`).
