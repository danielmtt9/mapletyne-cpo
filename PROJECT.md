# Project: Mapletyne MTT Charge CPO Penpot Visual Replication

## Architecture
The Mapletyne MTT Charge CPO visual replication project translates the end-to-end user interfaces of the Mapletyne CPO platform into pixel-accurate, responsive, Material Design 3-compliant artboards inside Penpot.

### Systems Under Replication:
1. **Driver Mobile PWA (`mapletyne-chargeapp`)**: 8 core screens at 390px mobile viewport, styled in dark-mode-first obsidian canvas (`#0B0F19`), Forest Emerald accent (`#006948` / `#48e260`), liquid glass containers (`rgba(23, 35, 53, 0.75)`), Fitts's Law touch targets ($\ge 44\times 44$px), and Apple HIG / M3 concentric telemetry widgets.
2. **Operator Mission Control (`mapletyne-admin`)**: 4 core operator screens at 1440px desktop viewport, styled with M3 light canvas (`#F8FAFC`), 280px left navigation sidebar (`#0F172A`), 64px header, live power flow visualizers, 3-phase oscilloscope drawers, Bay Matrix cards, Fleet Gantt timelines, and peak shaving guardrails.
3. **Penpot Design System & Automation**: Target Penpot file `b0861d9d-6919-8015-8008-d266309e53fd` in project `b0861d9d-6919-8015-8008-d26610b454c5`. Automation via `penpot-verify` evaluating the 4 calibrated pillars (Responsive Pair, Layer Hygiene, M3 Tokens, WCAG AAA Contrast), vector export pipeline saving SVG previews to `docs/designs/previews/`, and live canvas at `http://localhost:15050/#/workspace/b0861d9d-6919-8015-8008-d26610b454c5/b0861d9d-6919-8015-8008-d266309e53fd`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | M3 Token Palette & Grid Foundation | Configure M3 tokens (#006948 seed, #0B0F19 dark canvas, #F8FAFC light canvas), 8-pt grid, 12px min typography floor | M1 | Survey |
| 2 | Exclusively Google Material Symbols | Enforce `material-symbols-outlined` with 0 foreign icon libraries | M1 | Survey |
| 3 | Global Mobile Navigation Bar | 64px 3-tab bottom bar (`map`, `qr_code_scanner`, `person`) for mobile views | M1 | Survey |
| 4 | Global Desktop App Shell | 280px collapsible sidebar (`#0F172A`) + 64px header for 1440px desktop views | M1 | Survey |
| 5 | Driver Screen 1: Depot Map / Home | 390px map view, floating search, charger count badge, charger bottom sheet | M2 | Survey |
| 6 | Driver Screen 2: QR Scan / Auth | 390px HUD viewfinder reticle, manual charger ID drawer, phone & 6-digit OTP verification | M2 | Survey |
| 7 | Driver Screen 3: Active Charging Telemetry | 390px concentric activity rings, 36px tabular power gauge, live 4-row stats card, overstay grace banner, emergency stop/unlock | M2 | Survey |
| 8 | Driver Screen 4: Digital Receipt | 390px celebration checkmark, itemized receipt card, CO2 impact savings card, VAT invoice PDF CTA | M2 | Survey |
| 9 | Driver Screen 5: Login / Register | 390px glassmorphic sign-in card, Keycloak IAM badge, 2-step register wizard with 6 OTP boxes | M3 | Survey |
| 10 | Driver Screen 6: Account Profile | 390px driver avatar (76x76) with verified check, attributes card, profile navigation actions | M3 | Survey |
| 11 | Driver Screen 7: Charging History | 390px 3-column aggregate KPI banner, vertical session card stack with station & cost details | M3 | Survey |
| 12 | Driver Screen 8: Settings | 390px segmented language switcher, account access links, network & support info card | M3 | Survey |
| 13 | Operator Screen 1: Executive Depot Dashboard | 1440px 4-metric ribbon, 2:1 power stream chart & BESS radial thermal gauge, active sessions datagrid | M4 | Survey |
| 14 | Operator Screen 2: EVSE Charger Management | 1440px 4-metric ribbon, multi-facet filter bar, 3-col card grid, 600px slide drawer with 3-phase oscilloscope | M4 | Survey |
| 15 | Operator Screen 3: Depot Bay & Fleet Gantt | 1440px power headroom gauge, 4-col Bay Matrix cards with live vehicle SOC, horizontal stacked Gantt timeline | M4 | Survey |
| 16 | Operator Screen 4: Smart Charging / Peak Shaving | 1440px 3-metric ribbon, multi-source balance chart, autonomous peak shaving guardrails, station throttling table | M4 | Survey |
| 17 | Multi-Artboard SVG Vector Exporter | Export individual SVG previews for all 12 artboards to `docs/designs/previews/` | M5 | Survey |
| 18 | Automated `penpot-verify` Quality Gate | Execute automated critic across file `b0861d9d-6919-8015-8008-d266309e53fd` achieving score >= 85% | M6 | Survey |
| 19 | Live Penpot Canvas Active Verification | Verify accessibility of `http://localhost:15050/#/workspace/b0861d9d-6919-8015-8008-d26610b454c5/b0861d9d-6919-8015-8008-d266309e53fd` | M6 | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Foundation & Shared Navigation Shells | Design tokens, 8-pt grid, mobile bottom nav, desktop sidebar/header shell | None | DONE (Gate PASS: 100% penpot-verify, 0 off-grid, 0 collisions) |
| M2 | Driver Mobile PWA: Core Charging Flow | Replicate Screens 1-4 (Depot Map, QR Scan/Auth, Telemetry, Digital Receipt) | M1 | DONE (Gate PASS: 99.0% penpot-verify, 25/25 tests passed, 0 off-grid, WCAG AAA compliant) |
| M3 | Driver Mobile PWA: Account & Settings | Replicate Screens 5-8 (Login/Register, Profile, History, Settings) | M1 | DONE (All 4 screens rendered & exported) |
| M4 | Operator Mission Control Dashboards | Replicate Screens 1-4 (Executive Dashboard, EVSE Management, Bay Gantt, Smart Charging) | M1 | DONE (All 4 screens rendered & exported) |
| M5 | Multi-Artboard Vector Export Pipeline | Export all 12 artboards as clean SVG previews in `docs/designs/previews/` | M2, M3, M4 | DONE (All 12 SVG previews exported) |
| M6 | Final Verification & Quality Gate Pass | Automated `penpot-verify` (score >= 85%), WCAG AAA compliance, live canvas sign-off | M5 | DONE (32/32 E2E tests & penpot-verify PASSED) |

## Interface Contracts
### Mobile Artboard Contract (Screens 1 to 8)
- Dimensions: Width: `390px`, Height: `844px` (or `1024px` for scrollable content)
- Background fill: `#0B0F19`
- Primary Accent: `#006948` (Brand) / `#48E260` (High contrast highlight) / `#6EDBAA` (M3 Dark Primary)
- Container Surface: `rgba(23, 35, 53, 0.75)` with 1px border `rgba(255, 255, 255, 0.10)`
- Bottom Nav: Height `64px` at $y = \text{height} - 64$, 3 tabs (`map`, `qr_code_scanner`, `person`)
- Font floor: Minimum `12px` for badges, `14px` body, `16px` inputs, `20px+` headers

### Desktop Artboard Contract (Screens 1 to 4)
- Dimensions: Width: `1440px`, Height: `1024px` (or `1200px` for extended tables/Gantt)
- Background fill: `#F8FAFC`
- Sidebar: Width `280px` (or `240px`), fill `#0F172A`, height matches artboard
- Header: Height `64px`, width $1440 - \text{sidebar\_width}$, fill `#FFFFFF`, border `#E2E8F0`
- Content Canvas: $x = \text{sidebar\_width}$, $y = 64$
- Primary Accent: `#006948`, Text On-Surface: `#0F172A`, Text Variant: `#475569`
- Font floor: Minimum `12px` for table headers/badges, `14px` body/tables, `16px` buttons/inputs, `24px-36px` metrics

## Code Layout
- Penpot Automation & Verifier: `/home/danielaroko/.local/bin/penpot-verify`, `/home/danielaroko/applications/ui_ux/scripts/penpot-verifier.py`
- Target Penpot Project & File: Project `b0861d9d-6919-8015-8008-d26610b454c5`, File `b0861d9d-6919-8015-8008-d266309e53fd`
- SVG Preview Directory: `/home/danielaroko/applications/mapletynecpo/docs/designs/previews/`
- Agent Metadata & Hand-offs: `/home/danielaroko/applications/mapletynecpo/.agents/teamwork/`
- Driver App Source of Truth: `/home/danielaroko/applications/mapletynecpo/mapletyne-chargeapp/`
- Admin Dashboard Source of Truth: `/home/danielaroko/applications/mapletynecpo/mapletyne-admin/`
