# Apple-Inspired, Ergonomic & ECharts Telemetry UI/UX Transformation Plan: MTT-Admin

**Project**: OpenCPO Admin Dashboard (`mtt-admin`)  
**Design Standards**: 
1. Apple Human Interface Guidelines (macOS & iOS HIG)
2. The Left Sidebar & Main Canvas Dashboard Design Framework (Fitts's, Hick's, Miller's Laws & Modern CSS Triad)
3. Apache ECharts Advanced Telemetry Specification (Gauges, Shaders, LTTB Sampling)
4. Stitch OpenCPO Design System (`stitch_opencpo_management_dashboard`)
5. WCAG 2.2 Level AA/AAA Accessibility Standard  
**Lead Designer**: 🎨 Sally (UX Designer)  
**Date**: September 2026  

---

## 1. Executive Summary & Design System Synthesis

This transformation plan integrates **Apple's Human Interface Guidelines**, the **Cognitive Ergonomics Framework**, and deep **Apache ECharts Telemetry Optimization** into a unified, high-performance architecture for `mtt-admin`.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                   UNIFIED ERGONOMIC, APPLE HIG & ECHARTS ARCHITECTURE                    │
├──────────────────────────┬───────────────────────────────────────────────────────────────┤
│ 1. COGNITIVE ERGONOMICS  │ • Fitts's Law: Infinite left magic edge, 44×44pt tap targets │
│    & HCI HEURISTICS      │ • Hick's Law: 2-level max sidebar IA, single primary CTA/card │
│                          │ • Miller's Law: Card isolation, ≤7 visual chunks per screen   │
├──────────────────────────┼───────────────────────────────────────────────────────────────┤
│ 2. DESIGN TOKENS         │ • Apple squircle radii (12px/16px/24px continuous curves)     │
│    & FOUNDATIONS         │ • San Francisco / Inter font stack + tabular numerals (tnum)  │
│                          │ • Translucent Glassmorphic materials (backdrop-blur-2xl)      │
├──────────────────────────┼───────────────────────────────────────────────────────────────┤
│ 3. REFINED macOS SHELL   │ • CSS Grid Macro-layout: [260px Sidebar | 1fr Dynamic Canvas] │
│    (MILESTONE 2 DEEP)    │ • 2-Level Grouped Sidebar (Operations / Energy / Fleet / Sec) │
│                          │ • Frosted Glass Titlebar: Breadcrumbs, ⌘K Palette, Live Pill  │
│                          │ • Collapsible 68px Icon-Rail state with Fitts's Law hitboxes  │
├──────────────────────────┼───────────────────────────────────────────────────────────────┤
│ 4. ECHARTS TELEMETRY     │ • Apple Activity Multi-Rings (round-capped gauge meters)      │
│    ENGINE OPTIMIZATION   │ • Smooth Bezier Area Curves (gradient fills, no dot clutter) │
│                          │ • Glassmorphic Tooltips (backdrop-filter: blur(16px))         │
│                          │ • LTTB Downsampling & useDirtyRect: true (60 FPS telemetry)   │
├──────────────────────────┼───────────────────────────────────────────────────────────────┤
│ 5. "YOU-ARE-HERE"        │ • Semantic <nav aria-label="..."> and single <main> landmark  │
│    WAYFINDING & A11Y     │ • Skip link + 3px solid focus indicators + ARIA Live regions  │
│                          │ • ECharts W3C WAI-ARIA automatic screen reader descriptions   │
└──────────────────────────┴───────────────────────────────────────────────────────────────┘
```

---

## 2. Refined Milestone 2: The macOS App Shell Blueprint

The macOS App Shell provides the unified window and navigation chrome for the entire application. It resolves past issues with flat navigation sprawl, rigid 0px brutalist boxes, and missing "You-Are-Here" spatial wayfinding.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   macOS APP SHELL TOPOLOGY                                       │
├────────────────────────┬─────────────────────────────────────────────────────────────────────────┤
│ [SKIP-TO-CONTENT LINK] │  (Visually hidden until Tab focus; shifts focus directly to <main>)     │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ <nav> FROSTED SIDEBAR  │ <header> TRANSLUCENT TITLEBAR (h-16, backdrop-blur-xl, border-b)        │
│ (w-64 / w-17 collapse) │ ┌──────────────────────┐ ┌────────────────────┐ ┌─────────────────────┐ │
│                        │ │ [⌘] Breadcrumb Trail │ │ [🔍 Search (⌘K)]   │ │ [● Live] [Org/Avatar│ │
│ • SQUIRCLE BRAND TILE  │ └──────────────────────┘ └────────────────────┘ └─────────────────────┘ │
│   (rounded-xl, glow)   ├─────────────────────────────────────────────────────────────────────────┤
│                        │ <main id="main-content" className="@container flex-1 overflow-y-auto"> │
│ • 2-LEVEL GROUPED IA:  │                                                                         │
│   OPERATIONS           │   PAGE PRIMARY HEADING (<h1 className="text-2xl font-bold">)            │
│   ├ Dashboard          │                                                                         │
│   ├ Hardware Chargers  │   DYNAMIC GRID / CARDS (Adapts via CSS Container Queries)               │
│   └ Sessions & Ledger  │   ┌───────────────────────────────┐ ┌─────────────────────────────────┐ │
│   ENERGY & EMS         │   │ @container (min-width: 768px) │ │ @container (min-width: 768px)   │ │
│   ├ Energy Flow (EMS)  │   │ Card A                        │ │ Card B                          │ │
│   └ Tariffs & Pricing  │   └───────────────────────────────┘ └─────────────────────────────────┘ │
│   FLEET & ACCESS       │                                                                         │
│   ├ RFID Tokens & Org  │                                                                         │
│   └ Fleet Vehicles     │                                                                         │
│   SECURITY & ROAMING   │                                                                         │
│   ├ PKI Vault (Cert)   │                                                                         │
│   └ OCPI Roaming       │                                                                         │
│                        │                                                                         │
│ • FOOTER CONTROLS:     │                                                                         │
│   ├ [Collapse Rail ◀]  │                                                                         │
│   ├ SSE Live Heartbeat │                                                                         │
│   └ User Profile Pill  │                                                                         │
└────────────────────────┴─────────────────────────────────────────────────────────────────────────┘
```

### 2.1 CSS Grid Macro-Architecture (`AppShell.tsx`)
Replace relative absolute/fixed coordinate stitching with a robust two-column CSS Grid:

```tsx
// src/components/layout/AppShell.tsx
import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPaletteModal } from './CommandPaletteModal';
import { useLiveEvents } from '@/hooks/use-live-events';

export const AppShell: React.FC = () => {
  const { isConnected } = useLiveEvents();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const token = localStorage.getItem('opencpo_admin_jwt');

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-500/30 selection:text-blue-200">
      {/* WCAG 2.2 Bypass Block (Skip Link) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-blue-600 focus:text-white focus:rounded-xl focus:shadow-apple-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Root Layout: CSS Grid Macro-Architecture */}
      <div
        className={`grid min-h-screen transition-all duration-300 ease-out ${
          isSidebarCollapsed ? 'grid-cols-[68px_1fr]' : 'grid-cols-[260px_1fr]'
        }`}
      >
        {/* Left-Anchored Semantic Navigation */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isLiveConnected={isConnected}
        />

        {/* Dynamic Main Stage */}
        <div className="flex flex-col min-h-screen min-w-0 overflow-hidden">
          <Header
            onOpenCommand={() => setIsCommandOpen(true)}
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <main
            id="main-content"
            className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950/60 @container"
            tabIndex={-1}
          >
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global ⌘K Command Palette */}
      <CommandPaletteModal
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </div>
  );
};
```

---

### 2.2 Two-Level Grouped Navigation (`Sidebar.tsx`)
Resolves Hick's Law by chunking 9 raw items into 4 semantic domain groups with clean section headers, Lucide icons, and macOS active-state pill indicators:

```tsx
// Navigation IA Schema
export const navigationGroups = [
  {
    title: 'Operations',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard },
      { label: 'Hardware Chargers', path: '/chargers', icon: Zap },
      { label: 'Sessions & Ledger', path: '/sessions', icon: Receipt },
    ],
  },
  {
    title: 'Energy & EMS',
    items: [
      { label: 'Energy Flow (EMS)', path: '/ems', icon: Activity },
      { label: 'Tariffs & Pricing', path: '/tariffs', icon: Coins },
    ],
  },
  {
    title: 'Fleet & Access',
    items: [
      { label: 'RFID & Fleet Accounts', path: '/fleet', icon: Users },
      { label: 'Fleet Vehicles', path: '/vehicles', icon: Car },
    ],
  },
  {
    title: 'Security & Roaming',
    items: [
      { label: 'PKI Security Vault', path: '/pki', icon: ShieldCheck },
      { label: 'OCPI Roaming', path: '/roaming', icon: Globe },
    ],
  },
];
```

#### Visual Styling of Sidebar Items:
* **Default State**: `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all duration-150`
* **Active State**: `bg-blue-600/15 text-blue-400 font-semibold shadow-sm border border-blue-500/20`
* **Collapsed Mode (68px)**: Tooltip hover triggers with full text label for rapid Fitts's Law acquisition.

---

### 2.3 Frosted Titlebar & Wayfinding (`Header.tsx`)
Implements the essential **"You-Are-Here"** navigation cues:

1. **Dynamic Linked Breadcrumbs**:
   - Parses active route (`/chargers/CP-001` -> `Home > Chargers > CP-001`).
2. **Global Command Bar Trigger (`⌘K`)**:
   - Glassmorphic search pill triggering fuzzy search across Chargers, Sessions, Vehicles, and Tariffs.
3. **SSE Event Bus Heartbeat Pill**:
   - `● Streaming` (Apple Emerald `#34C759` with subtle ambient pulse) or `● Reconnecting` (Coral Red `#FF3B30`).
4. **User Profile Dropdown**:
   - Squircle avatar with organization switcher and sign-out button.

---

## 3. Screen-by-Screen Blueprint Updates

| Screen | Stitch Reference | Apple HIG & ECharts Implementation |
| :--- | :--- | :--- |
| **1. Dashboard Overview** | `opencpo_dashboard_overview` | Apple Activity Multi-Ring for site capacity/occupancy; 24h ECharts bezier power area curve; Live event ticker with squircle chips. |
| **2. Hardware Chargers** | `hardware_charger_inventory` | Segmented Control (Grid ⊞ \| Ledger ☰); connector status glow badges; Slide-over Inspector Drawer with live 3-phase oscilloscope. |
| **3. Tariffs & Pricing** | `tariffs_pricing_engine` | Apple Wallet card tiers (Peak/Off-Peak/Shoulder); tabular €/kWh formatting; dynamic spot price timeline with hover ruler. |
| **4. Fleet & Vehicles** | `rfid_fleet_management` | Segmented Sub-navigation (Corporate Accounts \| RFID Tokens); vehicle cards with battery SoC charge meters. |
| **5. EMS & Smart Charging** | `ems_telemetry_dashboard` | Circular dial for grid headroom; tactile power sliders; multi-source energy balance chart (Grid vs Solar vs BESS). |

---

## 4. Implementation Roadmap

| Milestone | Key Deliverables | Verification Strategy |
| :--- | :--- | :--- |
| **M1: Design Foundations & Tokens** | Update `tailwind.config.js` (squircles, Apple palette, `tnum`), add glassmorphism utilities & CSS container query declarations. | Tailwind build check; inspect card border radii and font rendering. |
| **M2: macOS App Shell & IA** | Refactor `AppShell.tsx`, `Sidebar.tsx` (2-level IA, Lucide icons, active pill, collapse rail), `Header.tsx` (breadcrumbs, ⌘K search, heartbeat). | Screen reader landmark test + keyboard tab traversal + collapse state check. |
| **M3: ECharts Master Theme & Dashboard**| Upgrade `BaseEChart.tsx` (Apple theme, glassmorphic tooltips, LTTB sampling) and `DashboardOverview.tsx` (Activity rings, bezier load curve). | Visual inspection of 60 FPS live telemetry streaming and tooltips. |
| **M4: Chargers, Tariffs, EMS & Fleet** | Upgrade `ChargersPage.tsx` (slide-over drawer), `TariffsPage.tsx` (Wallet cards), `EmsPage.tsx` (tactile dials), `RfidFleetPage.tsx`. | Responsive container query test (collapse sidebar, check card reflow). |
| **M5: Automated Playwright E2E Verification** | Execute master test suite (`tests/test_e2e_all_apis_buttons_links.py`). | 100% pass across all 10 administrative pages and interactive modals. |
