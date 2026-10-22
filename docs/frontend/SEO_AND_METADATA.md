<!--
<agent-discovery-protocol>
ROLE: UX Designer & Frontend Architect (Sally - bmm-ux-designer / Amelia - bmm-agent-dev)
CO-PILOT: Product Manager (John - bmm-pm)
PHASE: Phase 1.1 & Phase 3 (Frontend SEO, PWA Manifest, Multi-Tenant Metadata & Web Vitals Budgets)

GOVERNANCE INVARIANTS:
1. Canonical Domains:
   - Operator Mission Control (`mapletyne-admin`): `https://admin.mttcharge.mapletyne.com` (Local Dev/Prod Port: `34000`)
   - Driver Mobile PWA (`mapletyne-chargeapp`): `https://app.mttcharge.mapletyne.com/app/` (Local Dev/Prod Port: `34003`)
2. Multi-Tenant Dynamic Metadata: Both applications dynamically adapt document title, theme-color, favicon, and apple-touch-icon from `/api/v1/public/branding`.
3. Core Web Vitals: LCP < 2.0s, CLS < 0.05, INP < 100ms.
</agent-discovery-protocol>
-->

# SEO, PWA Metadata, Multi-Tenant Branding & Performance Budgets

**Platform:** Mapletyne MTT Charge CPO Enterprise (`mapletyne-admin` & `mapletyne-chargeapp`)

---

## 1. Document Metadata & Multi-Tenant Head Management

### 1.1 Operator Mission Control (`mapletyne-admin/index.html`)
- **Static Baseline Metadata ([`mapletyne-admin/index.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/index.html)):**
  - **Title:** `Mapletyne EMS — Executive SaaS EV Charging & Microgrid Management`
  - **Theme Color:** `<meta name="theme-color" content="#006948" />` (Forest Emerald M3 Seed)
  - **Icons & Manifest:**
    - `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`
    - `<link rel="apple-touch-icon" href="/icon-192.png" />`
    - `<link rel="manifest" href="/site.webmanifest" />`
  - **Preconnected Font Origins:** `https://fonts.googleapis.com` and `https://fonts.gstatic.com` (`crossorigin`) loading `Inter:wght@300..800`, `Geist+Mono:wght@400;500;700`, and `Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200`.
- **Runtime Multi-Tenant Metadata Override ([`src/lib/theme-provider.tsx`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-admin/src/lib/theme-provider.tsx)):**
  - Upon fetching `/api/v1/public/branding`, `ThemeProvider` dynamically updates:
    - `document.title` $\rightarrow$ `<company_name> — <app_title>` (defaulting to `Mapletyne — Executive SaaS EV Charging Management`).
    - `<link rel="icon">` $\rightarrow$ Resolved in priority order: `favicon_url` $\rightarrow$ `logo_data_uri` $\rightarrow$ `logo_url` $\rightarrow$ `/favicon.svg`.
- **Search Engine Indexing Policy (Operator Console):**
  - Because `mapletyne-admin` is an authenticated enterprise control plane, production NGINX ingress injects `X-Robots-Tag: noindex, nofollow` on `/login`, `/chargers`, `/ems`, `/pki`, and `/settings` while allowing public marketing/blog routes (`/posts`, `/pages/:slug`) to be indexed when enabled.

### 1.2 Driver Mobile PWA (`mapletyne-chargeapp/templates/base.html`)
- **Server-Side Dynamic Metadata Injection ([`base.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/base.html)):**
  - FastAPI's `inject_context` middleware populates tenant `branding` and localization dictionary `t` on every request prior to Jinja2 template rendering:
    - `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />` — Required for full-bleed iOS Dynamic Island and home-indicator safe areas (`env(safe-area-inset-bottom)`).
    - `<meta name="theme-color" content="#0b1326" />` (or tenant `branding.bg_color`, matched to `#0B0F19` / `#0F172A` OLED header surface).
    - `<meta name="mobile-web-app-capable" content="yes" />` & `<meta name="apple-mobile-web-app-capable" content="yes" />`.
    - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`.
    - `<meta name="apple-mobile-web-app-title" content="MTT Charge" />` (or tenant `branding.company_name`).
    - `<link rel="manifest" href="/app/manifest.json?v=5" />`.
    - `<link rel="apple-touch-icon" sizes="512x512" href="/app/static/icon-512.png?v=5" />` (or tenant `branding.logo_data_uri`).

---

## 2. Progressive Web App (PWA) Manifest & Service Worker Specification

### 2.1 Web App Manifest ([`mapletyne-chargeapp/static/manifest.json`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/static/manifest.json))
Served at `GET /manifest.json` (and `/app/manifest.json`) with `media_type="application/manifest+json"` and `Cache-Control: no-cache`:

```json
{
  "name": "Mapletyne MTT Charge",
  "short_name": "MTT Charge",
  "description": "Find EV charging stations, scan QR or use ISO 15118 Plug & Charge, and track live charging telemetry.",
  "start_url": "/app/",
  "scope": "/app/",
  "display": "standalone",
  "background_color": "#0B0F19",
  "theme_color": "#006948",
  "orientation": "portrait-primary",
  "categories": ["utilities", "navigation", "travel"],
  "icons": [
    {
      "src": "/app/static/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/app/static/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 2.2 Service Worker Lifecycle (`GET /sw.js`)
- Served from [`mapletyne-chargeapp/main.py`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/main.py) with explicit HTTP headers:
  - `Service-Worker-Allowed: /app/`
  - `Cache-Control: no-cache`
- **Caching Strategy:**
  - **Static Assets (`/app/static/*`, `/skin/*`, Material Symbols font):** `Stale-While-Revalidate` for instant cold boot in underground parking garages and remote fleet depots with weak cellular reception.
  - **Live Telemetry & Session Endpoints (`/app/session/*`, `/api/v1/events/stream`):** `Network-Only` (never cache live kW/SoC readings or OCPP command calls).
  - **Install Prompt UX:** [`base.html`](file:///home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/templates/base.html) intercepts `beforeinstallprompt` and presents a non-intrusive glassmorphic install pill (`#pwa-install-banner`) with session-scoped dismissal (`sessionStorage['pwa_dismissed']`).

---

## 3. OpenGraph, QR Deep-Linking & Social Metadata

For public station share links and QR code landing URLs (`/app/charge?evse=MTT-YYZ-A04`):

| Meta Property | Specification Value | Purpose |
| :--- | :--- | :--- |
| `og:type` | `website` | Standard OpenGraph resource type |
| `og:site_name` | `Mapletyne MTT Charge` | Brand attribution on Slack, Teams, iMessage, WhatsApp |
| `og:title` | `<Station Name> — <Max kW> kW DC Fast Charging` | Dynamic title showing station capacity & availability |
| `og:description` | `Live EVSE status, transparent kWh tariff, and instant QR or ISO 15118 Plug & Charge session start.` | Actionable summary for shared depot/public charger links |
| `og:image` | `1200x630px` PNG/SVG card (`#0B0F19` background, `#006948` badge) | High-contrast preview card |
| `twitter:card` | `summary_large_image` | Large summary card format |

---

## 4. Core Web Vitals & Performance Budgets

| Metric / Budget | Operator Admin (`mapletyne-admin`) | Driver Mobile PWA (`mapletyne-chargeapp`) | Enforcement Mechanism |
| :--- | :--- | :--- | :--- |
| **Largest Contentful Paint (LCP)** | `< 1.8s` (Desktop Ethernet/Wi-Fi) | `< 2.0s` (4G / Depot Wi-Fi) | Preconnected Google Fonts, SSR Jinja2 HTML shell on Driver PWA, Vite code-splitting |
| **Cumulative Layout Shift (CLS)** | `< 0.05` | `< 0.02` | Explicit fixed dimensions on KPI cards (`116px` height), chart containers (`380px`), icons (`24x24px`), and tabular numerals (`.tnum`) |
| **Interaction to Next Paint (INP)** | `< 100ms` | `< 100ms` | Virtualized rows (`@tanstack/react-virtual`) for >100 chargers/sessions; direct `setQueryData` for telemetry |
| **Initial JS Bundle (Gzip)** | `< 180 KB` core shell (ECharts lazy-loaded per route) | `< 45 KB` (`htmx.min.js` + `leaflet.js` cached via Service Worker) | Zero bloated icon packs (`material-symbols-outlined` variable webfont only) |
