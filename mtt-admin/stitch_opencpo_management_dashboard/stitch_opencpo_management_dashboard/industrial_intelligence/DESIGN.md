---
name: Industrial Intelligence
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#ffb3af'
  on-tertiary: '#650911'
  tertiary-container: '#fc7c78'
  on-tertiary-container: '#711419'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3af'
  on-tertiary-fixed: '#410005'
  on-tertiary-fixed-variant: '#842225'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
  status-online: '#10B981'
  status-fault: '#F97316'
  status-offline: '#64748B'
  electric-blue: '#3B82F6'
  deep-charcoal: '#0F172A'
  surface-elevation: '#1E293B'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  data-table:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  code:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
spacing:
  unit: 4px
  gutter: 16px
  margin-desktop: 32px
  margin-mobile: 16px
  table-row-height: 40px
  container-max: 1440px
---

## Brand & Style

The design system is engineered for the high-stakes environment of Charge Point Operations. It embodies **Industrial Intelligence**: a philosophy that prioritizes technical precision, data density, and real-time reliability. The aesthetic is unapologetically professional, favoring functional clarity over decorative flair.

The brand personality is **authoritative and efficient**. It speaks to engineers and operators who manage critical infrastructure. The UI must evoke a sense of "Mission Control"—where every pixel serves a purpose, and system health is communicated through high-contrast visual cues and sharp, geometric structures. 

Drawing from **Modern Industrialism**, the system utilizes a dark-mode first approach to reduce eye strain during long monitoring shifts, while employing vibrant, functional color accents to highlight critical status changes. There is no room for ambiguity; the interface is a high-performance tool built for the "Plug & Charge" era.

## Colors

The palette is rooted in a **Dark Mode** foundation to provide a high-contrast backdrop for real-time telemetry.

- **Primary (Emerald #10B981):** Representing "Available" and "Online" states. This is the heartbeat of the system, used for success states and active charger signals.
- **Secondary (Electric Blue #3B82F6):** The primary brand accent used for interactive elements, primary CTAs, and technical highlights.
- **Neutral (Deep Charcoal #0F172A):** The void upon which the system is built. It ensures maximum legibility for vibrant data points.
- **Functional Accents:**
    - **Safety Orange (#F97316):** Reserved strictly for warnings, faults, and maintenance alerts.
    - **Steel Gray (#64748B):** Used for inactive, offline, or decommissioned assets to move them to the background of the user's attention.

## Typography

Typography is optimized for **legibility under pressure**. 

- **Hanken Grotesk (Headlines):** A sharp, contemporary sans-serif used for structural headers and high-level KPIs. It provides a clean, professional aesthetic that scales from large dashboard titles to section headings.
- **Geist (Body & Data):** Chosen for its technical, developer-centric DNA. It features highly legible numerals and tabular figures, essential for comparing meter values and power curves across high-density tables.

For mobile views, `display-lg` should scale down to `headline-xl` equivalents to maintain hierarchy without overwhelming the viewport. All labels for technical fields (e.g., EMAID, JWT) should use the `code` or `label-caps` style for instant visual categorization.

## Layout & Spacing

The layout philosophy follows a **high-density grid** designed to maximize "information at a glance."

- **Desktop:** A 12-column fluid grid with 16px gutters. To support the "Mission Control" feel, margins are generous (32px) to frame the data, but internal component padding is tight (4px increments) to allow for more data rows.
- **Data Density:** The system uses a specialized 40px fixed row height for tables to ensure high vertical density without sacrificing tap/click targets.
- **Reflow:** On mobile, the grid collapses to a single column. Complex data tables should transform into "Status Cards" or horizontal-scroll containers to preserve the integrity of technical values.
- **Sidebars:** Persistent left-hand navigation is recommended for the CPO dashboard to allow rapid switching between Chargers, Sessions, and Billing.

## Elevation & Depth

In this design system, depth is communicated through **Tonal Layering** and **Sharp Borders** rather than shadows. This reinforces the industrial, software-as-tool aesthetic.

- **Base Layer:** The deepest charcoal (#0F172A) serves as the canvas.
- **Surface Layer:** Secondary containers (cards, sidebars) use a lighter charcoal (#1E293B) with 0px borders.
- **Separation:** Divisions are created using 1px solid borders in a slightly lighter tint or a low-opacity white (10%).
- **Interactive Depth:** Elements do not "float" with shadows; instead, they "illuminate." Hover states should trigger a primary color border glow or a subtle increase in background lightness.
- **Overlays:** Modals and wizards use a 60% opacity black backdrop with a subtle blur to pull the user's focus without breaking the flat, technical aesthetic.

## Shapes

The shape language is strictly **Sharp (0px)**. 

Every element—buttons, cards, input fields, and status badges—features 90-degree corners. This evokes a sense of "engineered precision." There are no soft edges in the system, reflecting the rigid standards (ISO 15118) and the high-performance hardware being managed. 

Dividers should be clean, 1px lines. Status indicators are either solid squares or vertical bars, never circles, to maintain the architectural consistency of the grid.

## Components

- **Buttons:** Sharp-cornered, high-contrast blocks. Primary buttons use the Electric Blue background with white text. Secondary buttons are "ghost" style with 1px white or blue borders.
- **Status Badges:** Compact rectangular tags. "Online" uses a solid Emerald background; "Faulted" uses Safety Orange. Text is always uppercase `label-caps` for maximum visibility.
- **Data Tables:** The core of the platform. Rows feature alternating background tints for readability. Columns are sortable with clear indicators. Numerical data (Power, Voltage) is right-aligned to allow for easy comparison.
- **KPI Cards:** Minimalist blocks showing a single large value (`headline-xl`) with a small descriptive label. These are placed at the top of dashboards for instant health checks.
- **Input Fields:** Dark background fields with 1px borders that turn Electric Blue on focus. No rounding. Error states highlight the entire border in Safety Orange.
- **Live Telemetry Sparklines:** Small, high-density line charts embedded within table rows or cards to show 10-second power ingestion trends without requiring a full page refresh.