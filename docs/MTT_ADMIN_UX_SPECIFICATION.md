# UX Design Specification & Design System Adaptation
## OpenCPO Enterprise Suite (`mtt-admin`) — Industrial Intelligence Design System

---

## 1. Executive Summary & Design Vision

This specification defines the complete adaptation of the **Industrial Intelligence** design system from [`mtt-admin/stitch_opencpo_management_dashboard`](file:///home/danielaroko/applications/opencpo/mtt-admin/stitch_opencpo_management_dashboard/stitch_opencpo_management_dashboard/) into the production **Next.js 15 / React 19 + shadcn/ui + Tailwind CSS** architecture.

The interface embodies a **"Mission Control"** aesthetic engineered for the high-stakes environment of Charge Point Operations. It prioritizes **data density**, **sub-second real-time responsiveness**, **monospaced telemetry clarity**, and **unambiguous state communication**.

---

## 2. Design System Tokens & Foundations

Adapted directly from [`industrial_intelligence/DESIGN.md`](file:///home/danielaroko/applications/opencpo/mtt-admin/stitch_opencpo_management_dashboard/stitch_opencpo_management_dashboard/industrial_intelligence/DESIGN.md):

### 2.1 Color Palette & Theme Tokens

```css
:root {
  /* Canvas & Tonal Surface Layers */
  --background: #0b1326;                /* Deep Charcoal Void Canvas */
  --surface-container-lowest: #060e20;  /* Inset Panels & Code Blocks */
  --surface-container-low: #131b2e;     /* Sidebar & Header Surface */
  --surface-container: #171f33;         /* Cards, Grids & Dialogs */
  --surface-container-high: #222a3d;    /* Hover States & Active Rows */
  --surface-container-highest: #2d3449; /* Elevated Modals & Tooltips */

  /* Text & Typography Contrast */
  --on-surface: #dae2fd;                /* High-Contrast Primary Text */
  --on-surface-variant: #bbcabf;        /* Subtitles & Secondary Labels */
  --outline: #86948a;                   /* Active Field Borders */
  --outline-variant: rgba(60, 74, 66, 0.4); /* Subtle 1px Grid Borders */

  /* Functional Status Accents */
  --status-online: #10b981;             /* Emerald: Online, Available, Success */
  --primary: #4edea3;                   /* Bright Emerald: CTAs, Active Tabs */
  --secondary: #3b82f6;                 /* Electric Blue: Focus, Highlights */
  --status-fault: #f97316;              /* Safety Orange: Warnings, Faults */
  --status-offline: #64748b;            /* Steel Gray: Inactive, Disconnected */
}
```

### 2.2 Typography Hierarchy

| Style Token | Font Family | Size / Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `display-lg` | **Hanken Grotesk** | 48px / 1.1 (-0.02em) | 700 Bold | Hero Metrics & Overview Headlines |
| `headline-xl` | **Hanken Grotesk** | 32px / 1.2 | 600 SemiBold | Section Titles & Primary KPI Numbers |
| `headline-md` | **Hanken Grotesk** | 24px / 1.2 | 600 SemiBold | Modal Headers & Drawer Titles |
| `body-lg` | **Geist** | 18px / 1.5 | 400 Regular | Primary Descriptions & Subtext |
| `body-md` | **Geist** | 16px / 1.5 | 400 Regular | Standard Body Content |
| `data-table` | **Geist (Tabular)** | 14px / 1.2 (+0.01em)| 500 Medium | Table Cells, Power Figures, Timestamps |
| `label-caps` | **Geist (Monospace)**| 12px / 1.0 (+0.05em)| 700 Bold | Uppercase Badges, Status Tags, Keys |
| `code` | **Geist Mono** | 13px / 1.4 | 400 Regular | Station IDs, eMAIDs, JWTs, Serial # |

### 2.3 Geometry, Shapes & Elevation
* **Sharp 0px Geometry:** All buttons, cards, input fields, badges, and modal sheets feature **90-degree crisp corners** (0px border-radius) to reflect engineered industrial precision.
* **40px Fixed Row Height:** Data table rows are fixed at **40px** for high vertical data density.
* **Tonal Illumination:** Interactive elements do not use soft drop-shadows; instead, hover/active states trigger a **subtle border glow** (`border-primary` or `bg-surface-container-high`).

---

## 3. Screen-by-Screen UX & Component Adaptation

### 3.1 Global Shell & Navigation
* **Source:** `opencpo_dashboard_overview/code.html`
* **Sidebar (`w-64 bg-surface-container-low`):**
  * Top Logo Mark + Brand Title (`OpenCPO` / Custom Brand).
  * Navigation Links with active state background (`bg-secondary-container text-on-secondary-container`):
    * `Dashboard`, `Chargers`, `Sessions`, `Tariffs`, `RFID & Fleet`, `Vehicles`, `PKI Vault`, `Energy (EMS)`, `Roaming (OCPI)`, `Settings`.
  * Bottom Live Event Bus Indicator with animated green pulse dot (`LIVE FEED: Active`).
  * Operator Profile Chip with Super Admin badge.
* **Top Header (`h-16 bg-background/80 backdrop-blur`):**
  * Multi-Site Selector dropdown (`All Sites ▾`).
  * Command Palette Input (`Cmd+K` global quick launcher).
  * Date Range Filter Picker.
  * System Notification Bell.

---

### 3.2 Overview Dashboard (`opencpo_dashboard_overview`)
* **KPI Header Grid (4 Cards):**
  1. **Today's Energy:** `1,240.5 kWh` with trending comparison (`+12% vs yesterday`).
  2. **Active Sessions:** `42` with live green pulsing indicator and capacity bar.
  3. **Network Health:** `98.2%` with Operational status badge.
  4. **Total Revenue:** `€4,120.00` calculated in real time.
* **Live Network Power & Telemetry Chart:** Real-time power curve rendering total kilowatt draw.
* **Site Health & Status Distribution:** Visual breakdown of Online, Charging, Available, and Faulted EVSEs.
* **Recent Activity Feed:** Real-time stream of charger connections, RFID taps, and transaction terminations.

---

### 3.3 Hardware Charger Inventory & Search Filter State
* **Source:** `hardware_charger_inventory/code.html` & `active_search_filter_state/code.html`
* **Multi-Facet Filter Bar:**
  * Status Filter Pills: `All`, `Online (Emerald)`, `Charging (Blue)`, `Available (Green)`, `Faulted (Orange)`, `Offline (Gray)`.
  * Power Slider / Filter: AC 7-22kW vs DC Fast 50-350kW.
  * Site Location Filter.
* **Virtualized Charger Data Table:**
  * Columns: `Station ID` (monospace), `Display Name`, `Vendor / Model`, `Connectors (Type & Status)`, `Max kW`, `Site`, `Tariff`, `Last Heartbeat`, `Actions`.
  * Inline Action Buttons: `Inspect Drawer`, `Remote Start`, `Remote Stop`, `Soft Reset`.

---

### 3.4 Charger Detail Drawer Panel
* **Source:** `charger_detail_panel_state/code.html`
* **Interaction:** Slides out smoothly from the right side of the screen upon clicking a station row without navigating away.
* **Panel Components:**
  * **Header:** Station ID, Model, Live Status Badge, IP Address, OCPP Version (`OCPP 2.0.1` / `1.6-J`).
  * **Live Telemetry Gauges:** Instantaneous Active Power (kW), Voltage (V), Current (A), and Session SoC (%).
  * **Connector Tabs:** Switch between Connector 1 (CCS2) and Connector 2 (Type 2).
  * **Remote Command Control Grid:**
    * `⚡ Remote Start`: Opens driver/tag input dialog.
    * `⏹ Remote Stop`: Terminates active transaction.
    * `🔄 Soft / Hard Reboot`: Confirmation dialog with reboot sequence.
    * `🔓 Unlock Cable`: Emergency cable release.
    * `📊 Set Smart Charging Profile`: Dynamic kW throttling slider.
    * `🧹 Clear RFID Cache` & `📡 Trigger Diagnostic Message`.

---

### 3.5 Register Charger Modal
* **Source:** `register_charger_modal_state/code.html`
* **Interaction:** 2-column modal with sharp 0px borders and backdrop blur.
* **Form Sections:**
  * **Hardware Identity:** Station ID, Vendor, Model, Serial Number, OCPP Version.
  * **Location & Site:** Site Assignment, Street Address, City, Latitude, Longitude.
  * **Electrical & Pricing:** Max Power Rating (kW), Default Tariff Assignment, Simulated Flag toggle.

---

### 3.6 Sessions & Billing Ledger
* **Source:** `sessions_billing_ledger/code.html`
* **Virtualized Data Table (TanStack Virtual):**
  * Columns: `Transaction ID`, `Station ID`, `Driver / eMAID`, `Start Time`, `End Time`, `Duration`, `Energy (kWh)`, `Total Cost (€)`, `VAT (21%)`, `Status`, `Invoice / Receipt`.
  * Date Range Filter Picker + Search Bar.
  * 1-Click CSV and PDF Export.

---

### 3.7 Tariffs & Pricing Engine
* **Source:** `tariffs_pricing_engine/code.html`
* **Tariff Builder Form:** Multi-component rate definition (`energy_rate`, `time_rate`, `idle_rate`, `flat_fee`, `currency`).
* **ENTSO-E Spot Price Chart:** Real-time 24-hour Day-Ahead electricity market price curve.
* **Dynamic Margin Multiplier:** Interactive slider to set spot markup percentage + fixed margin per kWh.
* **Customer Tiers:** Tiers for VIP, Fleet, Employee, and Public drivers.

---

### 3.8 RFID & Fleet Groups Management
* **Source:** `rfid_fleet_management/code.html`
* **Token Management Table:** Card UID, Label, Driver Name, Assigned Corporate Group, Expiration Date, Status (`Active`, `Blocked`, `Expired`).
* **Quick Actions:** Issue Token Modal, Block/Unblock Toggle, Replace Lost Card Modal.
* **Corporate Groups Directory:** Fleet company name, billing email, monthly aggregate kWh usage, and invoice status.

---

### 3.9 Fleet Vehicles Inventory
* **Source:** `fleet_vehicles_inventory/code.html`
* **Vehicle Directory:** License Plate, Make/Model (e.g. Tesla Model Y, Polestar 2), Assigned Driver, Connector Compatibility.
* **ISO 15118 Plug & Charge Readiness:** Visual badge indicating whether an OEM contract certificate is installed and valid.

---

### 3.10 ISO 15118 PKI & Security Vault
* **Source:** `pki_security_vault/code.html`
* **Visual Trust Hierarchy Tree:** Interactive diagram showing V2G Root CA ➔ SECC Sub-CA / MO Sub-CA ➔ Leaf Certificates.
* **Certificate Lifecycle Table:** Serial Number, Common Name, Expiry Date, CRL Status.
* **SECC CSR Signer:** Drag-and-drop CSR upload to instantly issue TLS 1.3 server certificates.

---

### 3.11 EMS Telemetry & Grid Dashboard
* **Source:** `ems_telemetry_dashboard/code.html`
* **Site Energy Balance Dial:** Circular energy flow diagram showing real-time balance between:
  * ⚡ **Grid Import / Export** (kW)
  * ☀️ **Solar PV Generation** (kW)
  * 🔋 **BESS Battery Storage State** (kW & SoC %)
  * 🔌 **Total EV Charging Demand** (kW)
  * 🏢 **Building Baseline Load** (kW)
* **Peak Shaving Threshold:** Visual slider to enforce maximum site grid power limits.

---

### 3.12 OCPI Roaming Hub
* **Source:** `ocpi_roaming_management/code.html`
* **Roaming Partner Cards:** Hubject, Plugsurfing, Shell Recharge with live connection health status.
* **Connection Handshake:** 1-click test button and Token B credential exchange modal.
* **Sync Log Stream:** Real-time log of pushed/pulled Locations, EVSEs, Tariffs, and CDRs.

---

### 3.13 System Settings, Backups & Brand Studio
* **Source:** `system_settings_backups/code.html`
* **Brand & Organization Studio:**
  * Horizontal Logo Uploader (SVG/PNG).
  * Compact Mark & Favicon Uploader.
  * Company Legal Name, App Title, Support Email & Phone.
  * Theme Color Palette Picker (`primary`, `accent`, `background`, `card`).
  * **Live Preview:** Immediate rendering of custom brand variables in the UI.
* **Modular Feature Toggles:** Instant switches for Payment Gateway, Smart Load Balancing, PKI, and OCPI.
* **Maintenance & Backups:** 1-click database backup archive creation, download, and restore points.

---

## 4. Component Library Implementation Blueprint (`shadcn/ui`)

To achieve the sharp industrial precision, all shadcn/ui primitives are configured with `rounded-none` and strict dark-mode color mappings:

```tsx
// src/components/ui/button.tsx
import { cn } from "@/lib/utils";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-data-table text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-secondary disabled:pointer-events-none disabled:opacity-50 rounded-none",
          variant === "default" && "bg-primary text-on-primary hover:bg-primary/90",
          variant === "secondary" && "bg-secondary text-on-secondary hover:bg-secondary/90",
          variant === "destructive" && "bg-status-fault text-white hover:bg-status-fault/90",
          variant === "outline" && "border border-outline-variant bg-transparent text-on-surface hover:bg-surface-container-high",
          variant === "ghost" && "hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface",
          size === "default" && "h-10 px-4 py-2",
          size === "sm" && "h-8 px-3 text-xs",
          size === "lg" && "h-12 px-8 text-base",
          className
        )}
        {...props}
      />
    );
  }
);
```

---

## 5. Next Steps for Implementation

1. **Scaffold Next.js 15 / React 19 Project** in `mtt-admin/`.
2. **Copy Design Tokens & Global CSS** from `industrial_intelligence/DESIGN.md` into `src/styles/globals.css`.
3. **Generate TypeScript Types** via `npm run codegen` against `http://127.0.0.1:8000/openapi.json`.
4. **Implement Shell & Page Components** matching the adapted HTML screens.
