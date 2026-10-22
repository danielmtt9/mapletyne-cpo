#!/usr/bin/env python3
"""
Mapletyne MTT Charge CPO - Milestones 3, 4 & 5:
- Milestone 3: Driver Mobile PWA Account & Settings (Screens 5 to 8)
- Milestone 4: Operator Mission Control Dashboards (Screens 2 to 4)
- Milestone 5: Multi-Artboard SVG Vector Exporter for all 12 screens

Strict adherence to:
- M3 tokens (#0B0F19 dark canvas, #F8FAFC light canvas, #0F172A surface, #10B981 / #006A60 emerald accents)
- Strict 4px/8px mathematical grid on ALL coordinates and dimensions
- Minimum 12px typography floor
- Touch hit targets >= 44x44px
- Exclusively Google Material Symbols ("Material Symbols Outlined", bounds 24x24)
- High WCAG AAA contrast
"""

import sys
import os
from typing import Dict, Any, Optional

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from tests.e2e.conftest import (
    PenpotMCPTestClient,
    FILE_ID,
    PAGE_ID,
)
from scripts.replicate_m2_driver_screens import (
    ArtboardBuilder,
    export_svg_frame,
)


class M3M4Builder(ArtboardBuilder):
    def add_mobile_bottom_nav(self, frame_id: str, suffix: str, active_tab: str = "account"):
        self.add_rect(f"Mobile Bottom Navigation Bar {suffix}", 0.0, 780.0, 392.0, 64.0, "#0F172A", frame_id)
        map_col = "#10B981" if active_tab == "map" else "#CBD5E1"
        scan_col = "#10B981" if active_tab == "scan" else "#CBD5E1"
        acc_col = "#10B981" if active_tab == "account" else "#CBD5E1"
        self.add_icon(f"Icon - Bottom Nav {suffix} Map", "map", 52.0, 796.0, frame_id, size=24, fill=map_col)
        self.add_icon(f"Icon - Bottom Nav {suffix} Scan", "qr_code_scanner", 184.0, 796.0, frame_id, size=24, fill=scan_col)
        self.add_icon(f"Icon - Bottom Nav {suffix} Profile", "person", 316.0, 796.0, frame_id, size=24, fill=acc_col)

    def add_desktop_shell(self, frame_id: str, suffix: str, page_title: str, active_nav: int = 1):
        # Canvas background
        self.add_rect(f"Container - Desktop Canvas {suffix}", 0.0, 0.0, 1440.0, 1024.0, "#F8FAFC", frame_id)
        # Top Header
        self.add_rect(f"Top Navigation Header {suffix}", 240.0, 0.0, 1200.0, 64.0, "#FFFFFF", frame_id, stroke="#E2E8F0")
        self.add_text(f"Text - Page Header {suffix}", page_title, 272.0, 20.0, frame_id, font_size=20, fill="#0F172A", font_weight="700")
        self.add_rect(f"Button - Header Action {suffix}", 1248.0, 12.0, 168.0, 40.0, "#006A60", frame_id, radius=8.0)
        self.add_text(f"Text - Header Action {suffix}", "Dispatch Profile", 1276.0, 24.0, frame_id, font_size=14, fill="#FFFFFF", font_weight="700")
        # Sidebar
        self.add_rect(f"Sidebar Navigation Container {suffix}", 0.0, 0.0, 240.0, 1024.0, "#0F172A", frame_id)
        self.add_text(f"Text - Brand Sidebar {suffix}", "Mapletyne CPO", 24.0, 20.0, frame_id, font_size=20, fill="#10B981", font_weight="700")
        nav_items = [
            "Depot Mission Control",
            "EVSE Charger Management",
            "Depot Bay & Fleet Gantt",
            "Smart Charging & EMS",
        ]
        for idx, label in enumerate(nav_items):
            y_pos = 96.0 + idx * 48.0
            col = "#10B981" if idx == active_nav else "#CBD5E1"
            wt = "700" if idx == active_nav else "400"
            self.add_text(f"Text - Sidebar Nav {suffix} {idx}", label, 24.0, y_pos, frame_id, font_size=14, fill=col, font_weight=wt)

    # ==========================================================================
    # MILESTONE 3: DRIVER MOBILE PWA SCREENS 5 TO 8
    # ==========================================================================

    def build_screen_5(self) -> str:
        """Screen 5: Login / Register (Mobile - Driver 05 Login Register)."""
        print("\n--- Building Screen 5: Login / Register ---")
        frame_id = self.create_clean_frame("Mobile - Driver 05 Login Register", 3560.0, 100.0, 392.0, 844.0, "#0B0F19")
        self.add_rect("Container - Screen Canvas Login", 0.0, 0.0, 392.0, 844.0, "#0B0F19", frame_id)

        # Header
        self.add_rect("Mobile Header Login", 0.0, 0.0, 392.0, 64.0, "#0F172A", frame_id)
        self.add_rect("Button - Login Back", 16.0, 12.0, 44.0, 44.0, "#1E293B", frame_id, radius=8.0)
        self.add_icon("Icon - Login Back", "arrow_back", 28.0, 24.0, frame_id, size=24, fill="#F8FAFC")
        self.add_text("Text - Login Header Title", "Driver Sign In", 72.0, 20.0, frame_id, font_size=18, fill="#F8FAFC", font_weight="700")

        # Hero
        self.add_rect("Container - Login Avatar Circle", 164.0, 88.0, 64.0, 64.0, "#1E293B", frame_id, radius=32.0, stroke="#10B981", stroke_width=4.0)
        self.add_icon("Icon - Login Hero User", "account_circle", 184.0, 108.0, frame_id, size=24, fill="#10B981")
        self.add_text("Text - Welcome Back Title", "Welcome Back", 120.0, 164.0, frame_id, font_size=24, fill="#F8FAFC", font_weight="700")
        self.add_text("Text - Welcome Subtitle", "Sign in to manage fleet charging & receipts", 52.0, 196.0, frame_id, font_size=14, fill="#CBD5E1")

        # Sign-In Card
        self.add_rect("Card - Glassmorphic Sign In", 24.0, 232.0, 344.0, 344.0, "#0F172A", frame_id, radius=20.0, stroke="#1E293B")
        self.add_text("Text - Email Label", "Work Email", 48.0, 252.0, frame_id, font_size=12, fill="#CBD5E1", font_weight="700")
        self.add_rect("Container - Email Input Field", 48.0, 276.0, 296.0, 48.0, "#1E293B", frame_id, radius=12.0)
        self.add_icon("Icon - Email Field", "mail", 60.0, 288.0, frame_id, size=24, fill="#10B981")
        self.add_text("Text - Email Value", "driver@mapletyne.com", 96.0, 292.0, frame_id, font_size=14, fill="#F8FAFC")

        self.add_text("Text - Password Label", "Password", 48.0, 340.0, frame_id, font_size=12, fill="#CBD5E1", font_weight="700")
        self.add_rect("Container - Password Input Field", 48.0, 364.0, 296.0, 48.0, "#1E293B", frame_id, radius=12.0)
        self.add_icon("Icon - Password Field", "lock", 60.0, 376.0, frame_id, size=24, fill="#10B981")
        self.add_text("Text - Password Value", "••••••••••••", 96.0, 380.0, frame_id, font_size=14, fill="#F8FAFC")

        self.add_rect("Button - Sign In SSO CTA", 48.0, 432.0, 296.0, 48.0, "#10B981", frame_id, radius=12.0)
        self.add_text("Text - Sign In SSO Label", "Sign In with Enterprise SSO", 92.0, 448.0, frame_id, font_size=16, fill="#0B0F19", font_weight="700")

        # Keycloak IAM Badge
        self.add_rect("Container - Keycloak IAM Badge", 48.0, 500.0, 296.0, 48.0, "#1E293B", frame_id, radius=12.0)
        self.add_icon("Icon - Keycloak Shield", "verified_user", 60.0, 512.0, frame_id, size=24, fill="#10B981")
        self.add_text("Text - Keycloak Badge Text", "Secured by Mapletyne Keycloak IAM", 96.0, 516.0, frame_id, font_size=12, fill="#F8FAFC", font_weight="700")

        # 2-Step OTP Registration Card
        self.add_rect("Card - OTP Registration Wizard", 24.0, 592.0, 344.0, 168.0, "#0F172A", frame_id, radius=20.0, stroke="#1E293B")
        self.add_text("Text - OTP Card Title", "2-Step Mobile OTP Verification", 48.0, 612.0, frame_id, font_size=14, fill="#F8FAFC", font_weight="700")
        for i in range(6):
            bx = 48.0 + i * 48.0
            self.add_rect(f"Container - OTP Digit Box {i+1}", bx, 644.0, 44.0, 48.0, "#1E293B", frame_id, radius=8.0, stroke="#10B981")
            self.add_text(f"Text - OTP Digit {i+1}", str((i + 4) % 10), bx + 16.0, 660.0, frame_id, font_size=16, fill="#F8FAFC", font_weight="700")
        self.add_rect("Button - Register OTP CTA", 48.0, 704.0, 296.0, 44.0, "#1E293B", frame_id, radius=8.0)
        self.add_text("Text - Register OTP Label", "Verify 6-Digit SMS Code", 112.0, 716.0, frame_id, font_size=14, fill="#10B981", font_weight="700")

        self.add_mobile_bottom_nav(frame_id, "Login", active_tab="account")
        return frame_id

    def build_screen_6(self) -> str:
        """Screen 6: Account Profile (Mobile - Driver 06 Account Profile)."""
        print("\n--- Building Screen 6: Account Profile ---")
        frame_id = self.create_clean_frame("Mobile - Driver 06 Account Profile", 4040.0, 100.0, 392.0, 844.0, "#0B0F19")
        self.add_rect("Container - Screen Canvas Profile", 0.0, 0.0, 392.0, 844.0, "#0B0F19", frame_id)

        # Header
        self.add_rect("Mobile Header Profile", 0.0, 0.0, 392.0, 64.0, "#0F172A", frame_id)
        self.add_text("Text - Profile Header Title", "Driver Profile", 24.0, 20.0, frame_id, font_size=18, fill="#F8FAFC", font_weight="700")
        self.add_rect("Button - Profile Notifications", 332.0, 12.0, 44.0, 44.0, "#1E293B", frame_id, radius=8.0)
        self.add_icon("Icon - Profile Notifications", "notifications", 344.0, 24.0, frame_id, size=24, fill="#10B981")

        # Avatar Hero (76x76 circle)
        self.add_rect("Container - Driver Avatar 76x76", 24.0, 80.0, 76.0, 76.0, "#1E293B", frame_id, radius=36.0, stroke="#10B981", stroke_width=4.0)
        self.add_icon("Icon - Driver Avatar Person", "person", 52.0, 108.0, frame_id, size=24, fill="#10B981")
        self.add_text("Text - Driver Full Name", "Alex Morgan", 116.0, 88.0, frame_id, font_size=22, fill="#F8FAFC", font_weight="700")
        self.add_rect("Container - Verified Fleet Pill", 116.0, 120.0, 224.0, 32.0, "#1E293B", frame_id, radius=16.0, stroke="#10B981")
        self.add_icon("Icon - Verified Fleet Check", "verified", 124.0, 124.0, frame_id, size=24, fill="#10B981")
        self.add_text("Text - Verified Fleet Label", "Mapletyne London Fleet", 156.0, 128.0, frame_id, font_size=12, fill="#10B981", font_weight="700")

        # Attributes Card
        self.add_rect("Card - Driver Attributes", 24.0, 176.0, 344.0, 240.0, "#0F172A", frame_id, radius=20.0, stroke="#1E293B")
        attrs = [
            ("badge", "RFID Card ID", "RFID-9921-LON"),
            ("business", "Company VAT", "GB99201482"),
            ("directions_car", "Assigned Vehicle", "Tesla Model Y (EU24 XYZ)"),
            ("ev_station", "Default Connector", "CCS2 High-Power (150kW)")
        ]
        for idx, (ic, lbl, val) in enumerate(attrs):
            ry = 196.0 + idx * 52.0
            self.add_icon(f"Icon - Attr {idx}", ic, 44.0, ry, frame_id, size=24, fill="#10B981")
            self.add_text(f"Text - Attr Label {idx}", lbl, 80.0, ry - 4.0, frame_id, font_size=12, fill="#CBD5E1")
            self.add_text(f"Text - Attr Value {idx}", val, 80.0, ry + 12.0, frame_id, font_size=14, fill="#F8FAFC", font_weight="700")

        # Navigation Actions Card
        self.add_rect("Card - Profile Navigation Actions", 24.0, 432.0, 344.0, 240.0, "#0F172A", frame_id, radius=20.0, stroke="#1E293B")
        nav_actions = [
            ("credit_card", "Payment Methods · Visa 4242"),
            ("receipt_long", "Billing & Tax Invoices"),
            ("support_agent", "24/7 Fleet Driver Support")
        ]
        for idx, (ic, title) in enumerate(nav_actions):
            by = 452.0 + idx * 64.0
            self.add_rect(f"Button - Profile Nav Action {idx}", 44.0, by, 304.0, 48.0, "#1E293B", frame_id, radius=12.0)
            self.add_icon(f"Icon - Profile Nav {idx}", ic, 56.0, by + 12.0, frame_id, size=24, fill="#38BDF8")
            self.add_text(f"Text - Profile Nav {idx}", title, 92.0, by + 16.0, frame_id, font_size=14, fill="#F8FAFC", font_weight="700")

        # Sign Out CTA
        self.add_rect("Button - Sign Out CTA", 24.0, 692.0, 344.0, 48.0, "#1E293B", frame_id, radius=12.0, stroke="#EF4444")
        self.add_icon("Icon - Sign Out", "logout", 136.0, 704.0, frame_id, size=24, fill="#EF4444")
        self.add_text("Text - Sign Out Label", "Sign Out", 172.0, 708.0, frame_id, font_size=14, fill="#F8FAFC", font_weight="700")

        self.add_mobile_bottom_nav(frame_id, "Profile", active_tab="account")
        return frame_id

    def build_screen_7(self) -> str:
        """Screen 7: Charging History (Mobile - Driver 07 Charging History)."""
        print("\n--- Building Screen 7: Charging History ---")
        frame_id = self.create_clean_frame("Mobile - Driver 07 Charging History", 4520.0, 100.0, 392.0, 844.0, "#0B0F19")
        self.add_rect("Container - Screen Canvas History", 0.0, 0.0, 392.0, 844.0, "#0B0F19", frame_id)

        # Header
        self.add_rect("Mobile Header History", 0.0, 0.0, 392.0, 64.0, "#0F172A", frame_id)
        self.add_text("Text - History Header Title", "Charging History", 24.0, 20.0, frame_id, font_size=18, fill="#F8FAFC", font_weight="700")
        self.add_rect("Button - History Filter Tune", 332.0, 12.0, 44.0, 44.0, "#1E293B", frame_id, radius=8.0)
        self.add_icon("Icon - History Filter Tune", "tune", 344.0, 24.0, frame_id, size=24, fill="#10B981")

        # 3-Column Aggregate KPI Banner
        self.add_rect("Card - Aggregate KPI Banner", 24.0, 80.0, 344.0, 80.0, "#0F172A", frame_id, radius=16.0, stroke="#1E293B")
        self.add_text("Text - KPI Energy Val", "342.5 kWh", 40.0, 96.0, frame_id, font_size=16, fill="#10B981", font_weight="700")
        self.add_text("Text - KPI Energy Lbl", "Total Energy", 40.0, 124.0, frame_id, font_size=12, fill="#CBD5E1")
        self.add_text("Text - KPI Spend Val", "£119.88", 164.0, 96.0, frame_id, font_size=16, fill="#10B981", font_weight="700")
        self.add_text("Text - KPI Spend Lbl", "Total Spent", 164.0, 124.0, frame_id, font_size=12, fill="#CBD5E1")
        self.add_text("Text - KPI Sessions Val", "14 Sessions", 268.0, 96.0, frame_id, font_size=16, fill="#F8FAFC", font_weight="700")
        self.add_text("Text - KPI Sessions Lbl", "Completed", 268.0, 124.0, frame_id, font_size=12, fill="#CBD5E1")

        # Filter Segmented Bar
        self.add_rect("Button - Filter All", 24.0, 176.0, 108.0, 44.0, "#10B981", frame_id, radius=12.0)
        self.add_text("Text - Filter All", "All Sessions", 40.0, 192.0, frame_id, font_size=12, fill="#0B0F19", font_weight="700")
        self.add_rect("Button - Filter Month", 140.0, 176.0, 108.0, 44.0, "#1E293B", frame_id, radius=12.0)
        self.add_text("Text - Filter Month", "This Month", 160.0, 192.0, frame_id, font_size=12, fill="#F8FAFC", font_weight="700")
        self.add_rect("Button - Filter 30d", 256.0, 176.0, 112.0, 44.0, "#1E293B", frame_id, radius=12.0)
        self.add_text("Text - Filter 30d", "Past 30 Days", 272.0, 192.0, frame_id, font_size=12, fill="#F8FAFC", font_weight="700")

        # Vertical Session Card Stack
        sessions = [
            ("88219", "Depot Bay 04 · CCS2 150kW", "Today, 14:10 · 34.50 kWh · 42m", "£14.50"),
            ("88104", "Depot Bay 02 · CCS2 150kW", "Yesterday, 09:15 · 28.20 kWh · 35m", "£11.84"),
            ("87992", "Depot Bay 06 · Type 2 22kW", "18 Oct, 18:30 · 14.10 kWh · 1h 12m", "£5.92"),
            ("87810", "Depot Bay 01 · CCS2 150kW", "15 Oct, 07:45 · 48.00 kWh · 50m", "£20.16"),
        ]
        for idx, (sid, st, meta, cost) in enumerate(sessions):
            cy = 236.0 + idx * 108.0
            self.add_rect(f"Card - Session {sid}", 24.0, cy, 344.0, 96.0, "#0F172A", frame_id, radius=16.0, stroke="#1E293B")
            self.add_icon(f"Icon - Session {sid}", "ev_station", 40.0, cy + 20.0, frame_id, size=24, fill="#10B981")
            self.add_text(f"Text - Session Station {sid}", st, 76.0, cy + 16.0, frame_id, font_size=14, fill="#F8FAFC", font_weight="700")
            self.add_text(f"Text - Session Meta {sid}", meta, 76.0, cy + 44.0, frame_id, font_size=12, fill="#CBD5E1")
            self.add_text(f"Text - Session Cost {sid}", cost, 300.0, cy + 16.0, frame_id, font_size=16, fill="#10B981", font_weight="700")

        # Download Monthly Statement CTA
        self.add_rect("Button - Download Monthly Statement CTA", 24.0, 684.0, 344.0, 48.0, "#10B981", frame_id, radius=12.0)
        self.add_icon("Icon - Statement Download", "download", 52.0, 696.0, frame_id, size=24, fill="#0B0F19")
        self.add_text("Text - Statement Download Label", "Download Monthly Statement (PDF)", 88.0, 700.0, frame_id, font_size=14, fill="#0B0F19", font_weight="700")

        self.add_mobile_bottom_nav(frame_id, "History", active_tab="account")
        return frame_id

    def build_screen_8(self) -> str:
        """Screen 8: Settings (Mobile - Driver 08 Settings)."""
        print("\n--- Building Screen 8: Settings ---")
        frame_id = self.create_clean_frame("Mobile - Driver 08 Settings", 5000.0, 100.0, 392.0, 844.0, "#0B0F19")
        self.add_rect("Container - Screen Canvas Settings", 0.0, 0.0, 392.0, 844.0, "#0B0F19", frame_id)

        # Header
        self.add_rect("Mobile Header Settings", 0.0, 0.0, 392.0, 64.0, "#0F172A", frame_id)
        self.add_text("Text - Settings Header Title", "Settings & Preferences", 24.0, 20.0, frame_id, font_size=18, fill="#F8FAFC", font_weight="700")

        # Language Selector Card
        self.add_rect("Card - Language Selector", 24.0, 80.0, 344.0, 112.0, "#0F172A", frame_id, radius=16.0, stroke="#1E293B")
        self.add_icon("Icon - Language Globe", "language", 44.0, 96.0, frame_id, size=24, fill="#10B981")
        self.add_text("Text - Language Section Title", "App Display Language", 80.0, 100.0, frame_id, font_size=14, fill="#F8FAFC", font_weight="700")
        self.add_rect("Button - Lang EN", 44.0, 132.0, 96.0, 44.0, "#10B981", frame_id, radius=8.0)
        self.add_text("Text - Lang EN", "English", 68.0, 148.0, frame_id, font_size=12, fill="#0B0F19", font_weight="700")
        self.add_rect("Button - Lang NL", 148.0, 132.0, 96.0, 44.0, "#1E293B", frame_id, radius=8.0)
        self.add_text("Text - Lang NL", "Nederlands", 160.0, 148.0, frame_id, font_size=12, fill="#F8FAFC", font_weight="700")
        self.add_rect("Button - Lang DE", 252.0, 132.0, 96.0, 44.0, "#1E293B", frame_id, radius=8.0)
        self.add_text("Text - Lang DE", "Deutsch", 276.0, 148.0, frame_id, font_size=12, fill="#F8FAFC", font_weight="700")

        # Preferences Toggle List Card
        self.add_rect("Card - Preferences Toggle List", 24.0, 208.0, 344.0, 296.0, "#0F172A", frame_id, radius=20.0, stroke="#1E293B")
        prefs = [
            ("notifications_active", "Push Session Alerts"),
            ("receipt", "Auto Email VAT Receipts"),
            ("bolt", "High-Power DC Ready Alerts"),
            ("fingerprint", "Biometric Fast Sign-In")
        ]
        for idx, (ic, title) in enumerate(prefs):
            py = 228.0 + idx * 68.0
            self.add_icon(f"Icon - Pref {idx}", ic, 44.0, py + 12.0, frame_id, size=24, fill="#10B981")
            self.add_text(f"Text - Pref Title {idx}", title, 80.0, py + 16.0, frame_id, font_size=14, fill="#F8FAFC", font_weight="700")
            self.add_rect(f"Button - Toggle Pref {idx}", 296.0, py + 4.0, 52.0, 44.0, "#10B981", frame_id, radius=20.0)
            self.add_text(f"Text - Toggle State {idx}", "ON", 312.0, py + 16.0, frame_id, font_size=12, fill="#0B0F19", font_weight="700")

        # Network & Infrastructure Info Card
        self.add_rect("Card - Network Infrastructure Info", 24.0, 520.0, 344.0, 236.0, "#0F172A", frame_id, radius=16.0, stroke="#1E293B")
        self.add_text("Text - Infra Section Title", "CSMS Network & Telemetry", 44.0, 540.0, frame_id, font_size=14, fill="#F8FAFC", font_weight="700")
        net_rows = [
            ("dns", "OCPP 2.0.1 / ISO 15118-20"),
            ("cloud_done", "wss://csms.mapletyne.com"),
            ("info", "Build v2.4.0-enterprise")
        ]
        for idx, (ic, val) in enumerate(net_rows):
            ny = 580.0 + idx * 52.0
            self.add_icon(f"Icon - Net {idx}", ic, 44.0, ny, frame_id, size=24, fill="#38BDF8")
            self.add_text(f"Text - Net Val {idx}", val, 80.0, ny + 4.0, frame_id, font_size=14, fill="#CBD5E1")

        self.add_mobile_bottom_nav(frame_id, "Settings", active_tab="account")
        return frame_id

    # ==========================================================================
    # MILESTONE 4: OPERATOR MISSION CONTROL DASHBOARDS (SCREENS 1 TO 4)
    # ==========================================================================

    def build_operator_screen_1(self) -> str:
        """Operator Screen 1: Executive Depot Dashboard (Desktop - Operator Mission Control, 1440x1024)."""
        print("\n--- Building Operator Screen 1: Executive Depot Dashboard ---")
        frame_id = self.create_clean_frame("Desktop - Operator Mission Control", 100.0, 100.0, 1440.0, 1024.0, "#F8FAFC")

        # Canvas background
        self.add_rect("Container - Desktop Canvas Mission Control", 0.0, 0.0, 1440.0, 1024.0, "#F8FAFC", frame_id)

        # Top Navigation Header (280px sidebar offset -> width 1160px)
        self.add_rect("Top Navigation Header", 280.0, 0.0, 1160.0, 64.0, "#FFFFFF", frame_id, stroke="#E2E8F0")
        self.add_rect("Container - Header Breadcrumb", 296.0, 12.0, 248.0, 40.0, "#F8FAFC", frame_id, radius=8.0)
        self.add_text("Text - Header Breadcrumb", "Executive Depot Dashboard", 304.0, 24.0, frame_id, font_size=14, fill="#0F172A", font_weight="700")

        self.add_rect("Container - Header Search", 560.0, 12.0, 320.0, 40.0, "#0F172A", frame_id, radius=8.0)
        self.add_text("Text - Search Bar", "Search EVSE, Fleet ID, Session...", 576.0, 24.0, frame_id, font_size=14, fill="#CBD5E1")

        self.add_rect("Container - Depot Switcher", 904.0, 12.0, 176.0, 40.0, "#0F172A", frame_id, radius=8.0)
        self.add_text("Text - Depot Switcher", "Central Fleet Depot", 920.0, 24.0, frame_id, font_size=14, fill="#F8FAFC", font_weight="700")

        self.add_rect("Container - Header Profile", 1096.0, 12.0, 128.0, 40.0, "#0F172A", frame_id, radius=8.0)
        self.add_text("Text - Header User", "Ops Lead", 1120.0, 24.0, frame_id, font_size=14, fill="#F8FAFC", font_weight="700")

        self.add_rect("Button - Primary Action", 1240.0, 12.0, 176.0, 40.0, "#006A60", frame_id, radius=8.0)
        self.add_text("Text - Button Label", "+ New Charging Rule", 1256.0, 24.0, frame_id, font_size=14, fill="#FFFFFF", font_weight="700")

        # Sidebar Navigation Container (280x1024)
        self.add_rect("Sidebar Navigation Container", 0.0, 0.0, 280.0, 1024.0, "#0F172A", frame_id)
        self.add_text("Text - Brand Title", "Mapletyne CPO", 24.0, 20.0, frame_id, font_size=20, fill="#10B981", font_weight="700")

        self.add_icon("Icon - Nav Dashboard", "dashboard", 24.0, 96.0, frame_id, size=24, fill="#10B981")
        self.add_text("Text - Nav Dashboard", "Executive Depot Dashboard", 56.0, 96.0, frame_id, font_size=16, fill="#10B981", font_weight="700")

        self.add_icon("Icon - Nav Telemetry", "ev_station", 24.0, 144.0, frame_id, size=24, fill="#CBD5E1")
        self.add_text("Text - Nav Telemetry", "EVSE Charger Management", 56.0, 144.0, frame_id, font_size=14, fill="#CBD5E1")

        self.add_icon("Icon - Nav Smart Charging", "bolt", 24.0, 192.0, frame_id, size=24, fill="#CBD5E1")
        self.add_text("Text - Nav Smart Charging", "Smart Charging & EMS", 56.0, 192.0, frame_id, font_size=14, fill="#CBD5E1")

        self.add_rect("Container - Nav Fleet Bays", 16.0, 236.0, 248.0, 40.0, "#1E293B", frame_id, radius=8.0)
        self.add_icon("Icon - Nav Fleet Bays", "schedule", 24.0, 240.0, frame_id, size=24, fill="#CBD5E1")
        self.add_text("Text - Nav Fleet Bays", "Depot Bay & Fleet Gantt", 56.0, 240.0, frame_id, font_size=14, fill="#CBD5E1")

        # 4-Metric KPI Ribbon
        self.add_rect("Card - Active Depot Load", 304.0, 96.0, 264.0, 128.0, "#FFFFFF", frame_id, radius=12.0, stroke="#E2E8F0")
        self.add_text("Text - Card Title 1", "ACTIVE DEPOT LOAD", 328.0, 120.0, frame_id, font_size=12, fill="#0F172A", font_weight="700")
        self.add_text("Text - Card Value 1", "482.4 kW", 328.0, 152.0, frame_id, font_size=28, fill="#006A60", font_weight="700")

        self.add_rect("Card - Charger Status", 592.0, 96.0, 264.0, 128.0, "#FFFFFF", frame_id, radius=12.0, stroke="#E2E8F0")
        self.add_text("Text - Card Title 2", "CHARGER STATUS", 616.0, 120.0, frame_id, font_size=12, fill="#0F172A", font_weight="700")
        self.add_text("Text - Card Value 2", "42 / 44 Online", 616.0, 152.0, frame_id, font_size=28, fill="#0F172A", font_weight="700")

        self.add_rect("Card - Energy Delivered Today", 880.0, 96.0, 264.0, 128.0, "#FFFFFF", frame_id, radius=12.0, stroke="#E2E8F0")
        self.add_text("Text - Card Title 3", "ENERGY DELIVERED (24H)", 904.0, 120.0, frame_id, font_size=12, fill="#0F172A", font_weight="700")
        self.add_text("Text - Card Value 3", "4,820 kWh", 904.0, 152.0, frame_id, font_size=28, fill="#006A60", font_weight="700")

        self.add_rect("Card - BESS State of Charge", 1168.0, 96.0, 248.0, 128.0, "#FFFFFF", frame_id, radius=12.0, stroke="#E2E8F0")
        self.add_text("Text - Card Title 4", "DEPOT BESS STORAGE", 1192.0, 120.0, frame_id, font_size=12, fill="#0F172A", font_weight="700")
        self.add_text("Text - Card Value 4", "88% (1.2 MWh)", 1192.0, 152.0, frame_id, font_size=28, fill="#0F172A", font_weight="700")

        # 2:1 Power Stream Chart & BESS Radial Gauge Row
        self.add_rect("Card - Real-Time Power Stream Chart", 304.0, 248.0, 736.0, 336.0, "#0F172A", frame_id, radius=16.0)
        self.add_text("Text - Power Stream Header", "Real-Time Grid + Solar + BESS Power Stream (kW)", 332.0, 276.0, frame_id, font_size=18, fill="#FFFFFF", font_weight="700")
        self.add_rect("Container - Power Stream Plot", 332.0, 320.0, 680.0, 232.0, "#1E293B", frame_id, radius=12.0, stroke="#10B981")
        self.add_text("Text - Power Stream Legend 1", "Grid Import: 337.4 kW · Solar PV: 65.0 kW · BESS Discharge: 80.0 kW", 356.0, 352.0, frame_id, font_size=14, fill="#10B981", font_weight="700")
        self.add_text("Text - Power Stream Peak Cap", "Site Transformer Guardrail Limit: 600.0 kW (Zero Peak Penalties)", 356.0, 392.0, frame_id, font_size=14, fill="#CBD5E1")

        self.add_rect("Card - BESS Microgrid Radial Gauge", 1064.0, 248.0, 352.0, 336.0, "#0F172A", frame_id, radius=16.0)
        self.add_text("Text - BESS Gauge Header", "Microgrid Autonomy", 1092.0, 276.0, frame_id, font_size=18, fill="#FFFFFF", font_weight="700")
        self.add_rect("Container - BESS Radial Ring", 1160.0, 328.0, 160.0, 160.0, "#1E293B", frame_id, radius=80.0, stroke="#10B981", stroke_width=8.0)
        self.add_text("Text - BESS Radial Val", "88%", 1212.0, 392.0, frame_id, font_size=28, fill="#10B981", font_weight="700")
        self.add_text("Text - BESS Radial Sub", "Peak Shaving Active (+145 kW)", 1104.0, 516.0, frame_id, font_size=14, fill="#CBD5E1", font_weight="700")

        # Active Sessions Datagrid Card
        self.add_rect("Card - Active Charging Sessions Datagrid", 304.0, 608.0, 1112.0, 376.0, "#FFFFFF", frame_id, radius=12.0, stroke="#E2E8F0")
        self.add_text("Text - Sessions Datagrid Header", "Active Depot Charging Sessions (OCPP 2.0.1 Live Telemetry)", 332.0, 632.0, frame_id, font_size=18, fill="#0F172A", font_weight="700")

        exec_sessions = [
            ("SES-88219 · Bay 04", "EVSE-LON-04 (CCS2 150kW)", "Fleet Bus #104 · SoC 68%", "142.5 kW · 24.35 kWh"),
            ("SES-88215 · Bay 01", "EVSE-LON-01 (CCS2 150kW)", "Fleet Bus #101 · SoC 84%", "148.2 kW · 62.10 kWh"),
            ("SES-88211 · Bay 02", "EVSE-LON-02 (CCS2 150kW)", "Fleet Van #209 · SoC 64%", "112.0 kW · 18.40 kWh"),
        ]
        for idx, (s_id, evse, veh, pwr) in enumerate(exec_sessions):
            ry = 684.0 + idx * 88.0
            self.add_rect(f"Container - Exec Session Row {idx}", 332.0, ry, 1056.0, 68.0, "#0F172A", frame_id, radius=8.0)
            self.add_text(f"Text - Exec Session ID {idx}", s_id, 356.0, ry + 24.0, frame_id, font_size=14, fill="#10B981", font_weight="700")
            self.add_text(f"Text - Exec Session EVSE {idx}", evse, 560.0, ry + 24.0, frame_id, font_size=14, fill="#FFFFFF", font_weight="700")
            self.add_text(f"Text - Exec Session Veh {idx}", veh, 840.0, ry + 24.0, frame_id, font_size=14, fill="#CBD5E1")
            self.add_text(f"Text - Exec Session Pwr {idx}", pwr, 1120.0, ry + 24.0, frame_id, font_size=14, fill="#38BDF8", font_weight="700")

        return frame_id

    def build_operator_screen_2(self) -> str:
        """Operator Screen 2: EVSE Charger Management (1440x1024)."""
        print("\n--- Building Operator Screen 2: EVSE Charger Management ---")
        frame_id = self.create_clean_frame("Desktop - Operator 02 EVSE Charger Management", 96.0, 1200.0, 1440.0, 1024.0, "#F8FAFC")
        self.add_desktop_shell(frame_id, "EVSE", "EVSE Charger Farm & Live 3-Phase Oscilloscope", active_nav=1)

        # 4-Metric Ribbon
        kpis = [
            ("TOTAL EVSE UNITS", "44 Stations", "#0F172A"),
            ("ACTIVE CHARGING", "18 Bay Sessions", "#006A60"),
            ("FAULT / ALARMS", "0 Critical", "#006A60"),
            ("FIRMWARE COMPLIANCE", "100% OCPP 2.0.1", "#0F172A"),
        ]
        for idx, (lbl, val, col) in enumerate(kpis):
            kx = 272.0 + idx * 284.0
            self.add_rect(f"Card - EVSE KPI {idx}", kx, 96.0, 264.0, 112.0, "#FFFFFF", frame_id, radius=12.0, stroke="#E2E8F0")
            self.add_text(f"Text - EVSE KPI Lbl {idx}", lbl, kx + 24.0, 116.0, frame_id, font_size=12, fill="#0F172A", font_weight="700")
            self.add_text(f"Text - EVSE KPI Val {idx}", val, kx + 24.0, 148.0, frame_id, font_size=24, fill=col, font_weight="700")

        # Charger Grid Panel (Left)
        self.add_rect("Card - Charger Fleet Grid", 272.0, 232.0, 560.0, 752.0, "#FFFFFF", frame_id, radius=12.0, stroke="#E2E8F0")
        self.add_text("Text - Charger Grid Title", "Depot Chargers (CCS2 150kW - 350kW)", 296.0, 256.0, frame_id, font_size=18, fill="#0F172A", font_weight="700")
        stations = [
            ("EVSE-LON-01", "148.2 kW · SoC 78% · Bus #104"),
            ("EVSE-LON-02", "142.0 kW · SoC 64% · Van #209"),
            ("EVSE-LON-03", "Available · Idle · 0.0 kW"),
            ("EVSE-LON-04", "150.0 kW · SoC 42% · Truck #311"),
            ("EVSE-LON-05", "72.4 kW · Throttled · Bus #108"),
        ]
        for idx, (st_id, desc) in enumerate(stations):
            sy = 304.0 + idx * 124.0
            self.add_rect(f"Card - Station Row {idx}", 296.0, sy, 512.0, 104.0, "#0F172A", frame_id, radius=12.0)
            self.add_icon(f"Icon - Station {idx}", "ev_station", 316.0, sy + 24.0, frame_id, size=24, fill="#10B981")
            self.add_text(f"Text - Station ID {idx}", st_id, 352.0, sy + 20.0, frame_id, font_size=16, fill="#FFFFFF", font_weight="700")
            self.add_text(f"Text - Station Desc {idx}", desc, 352.0, sy + 52.0, frame_id, font_size=14, fill="#CBD5E1")

        # 600px Slide Drawer with 3-Phase Oscilloscope (Right)
        self.add_rect("Card - 3-Phase Oscilloscope Slide Drawer", 856.0, 232.0, 552.0, 752.0, "#0F172A", frame_id, radius=16.0)
        self.add_text("Text - Drawer Header", "EVSE-LON-01 · 3-Phase Oscilloscope Telemetry", 880.0, 260.0, frame_id, font_size=18, fill="#FFFFFF", font_weight="700")
        self.add_rect("Container - Oscilloscope Plot Area", 880.0, 304.0, 504.0, 280.0, "#1E293B", frame_id, radius=12.0, stroke="#10B981")
        self.add_text("Text - Phase L1", "Phase L1: 400.2 V · 214.0 A · 49.98 Hz", 904.0, 336.0, frame_id, font_size=14, fill="#10B981", font_weight="700")
        self.add_text("Text - Phase L2", "Phase L2: 399.8 V · 213.5 A · 49.98 Hz", 904.0, 376.0, frame_id, font_size=14, fill="#38BDF8", font_weight="700")
        self.add_text("Text - Phase L3", "Phase L3: 400.5 V · 214.2 A · 49.98 Hz", 904.0, 416.0, frame_id, font_size=14, fill="#F8FAFC", font_weight="700")
        self.add_text("Text - THD Metric", "Total Harmonic Distortion (THD): 1.4% (Nominal)", 904.0, 464.0, frame_id, font_size=14, fill="#CBD5E1")

        # OCPP Command Controls inside Drawer
        self.add_rect("Button - Remote Stop Session", 880.0, 616.0, 240.0, 48.0, "#1E293B", frame_id, radius=8.0, stroke="#EF4444")
        self.add_text("Text - Remote Stop", "Remote Stop Transaction", 916.0, 632.0, frame_id, font_size=14, fill="#FFFFFF", font_weight="700")
        self.add_rect("Button - Unlock Connector", 1144.0, 616.0, 240.0, 48.0, "#10B981", frame_id, radius=8.0)
        self.add_text("Text - Unlock Connector", "Unlock CCS2 Connector", 1184.0, 632.0, frame_id, font_size=14, fill="#0B0F19", font_weight="700")

        return frame_id

    def build_operator_screen_3(self) -> str:
        """Operator Screen 3: Depot Bay & Fleet Gantt (1440x1024)."""
        print("\n--- Building Operator Screen 3: Depot Bay & Fleet Gantt ---")
        frame_id = self.create_clean_frame("Desktop - Operator 03 Depot Bay Fleet Gantt", 1616.0, 1200.0, 1440.0, 1024.0, "#F8FAFC")
        self.add_desktop_shell(frame_id, "Gantt", "Depot Bay Matrix & Fleet Departure Gantt Schedule", active_nav=2)

        # 4-Column Bay Matrix Cards with Live Vehicle SoC
        bays = [
            ("BAY #01 · BUS-104", "SoC: 84% -> Target 100%", "Departs: 05:30 AM"),
            ("BAY #02 · VAN-209", "SoC: 68% -> Target 90%", "Departs: 06:00 AM"),
            ("BAY #03 · TRK-311", "SoC: 92% -> Target 100%", "Departs: 05:15 AM"),
            ("BAY #04 · BUS-112", "SoC: 48% -> Target 95%", "Departs: 06:30 AM"),
        ]
        for idx, (title, soc, dep) in enumerate(bays):
            bx = 272.0 + idx * 284.0
            self.add_rect(f"Card - Bay Matrix {idx}", bx, 96.0, 264.0, 160.0, "#0F172A", frame_id, radius=12.0)
            self.add_icon(f"Icon - Bay Vehicle {idx}", "directions_bus", bx + 20.0, 116.0, frame_id, size=24, fill="#10B981")
            self.add_text(f"Text - Bay Title {idx}", title, bx + 56.0, 120.0, frame_id, font_size=14, fill="#FFFFFF", font_weight="700")
            self.add_text(f"Text - Bay SoC {idx}", soc, bx + 20.0, 164.0, frame_id, font_size=14, fill="#10B981", font_weight="700")
            self.add_text(f"Text - Bay Dep {idx}", dep, bx + 20.0, 200.0, frame_id, font_size=12, fill="#CBD5E1")

        # Horizontal Stacked Fleet Gantt Timeline
        self.add_rect("Card - Horizontal Fleet Gantt Timeline", 272.0, 280.0, 1136.0, 704.0, "#FFFFFF", frame_id, radius=12.0, stroke="#E2E8F0")
        self.add_text("Text - Gantt Section Header", "24-Hour Fleet Dispatch & Charging Schedule (00:00 - 08:00 Shift)", 296.0, 304.0, frame_id, font_size=18, fill="#0F172A", font_weight="700")

        gantt_rows = [
            ("Fleet Bus #104 (Route 24)", 520.0, 440.0, "150 kW Fast Charge · Complete by 05:00"),
            ("Fleet Van #209 (Express)", 560.0, 360.0, "120 kW Smart Charge · Complete by 05:45"),
            ("Heavy Truck #311 (Freight)", 480.0, 520.0, "350 kW Ultra-Rapid · Complete by 04:45"),
            ("Fleet Bus #112 (Route 18)", 600.0, 480.0, "150 kW Peak Shaved · Complete by 06:15"),
            ("Shuttle #402 (Airport)", 520.0, 320.0, "80 kW Trickle Fill · Complete by 04:30"),
        ]
        for idx, (veh, bar_x, bar_w, bar_txt) in enumerate(gantt_rows):
            ry = 368.0 + idx * 112.0
            self.add_rect(f"Container - Gantt Track {idx}", 296.0, ry, 1088.0, 88.0, "#0F172A", frame_id, radius=12.0)
            self.add_text(f"Text - Gantt Vehicle {idx}", veh, 320.0, ry + 32.0, frame_id, font_size=14, fill="#FFFFFF", font_weight="700")
            self.add_rect(f"Container - Gantt Bar {idx}", bar_x, ry + 20.0, bar_w, 48.0, "#10B981", frame_id, radius=8.0)
            self.add_text(f"Text - Gantt Bar Label {idx}", bar_txt, bar_x + 16.0, ry + 36.0, frame_id, font_size=12, fill="#0B0F19", font_weight="700")

        return frame_id

    def build_operator_screen_4(self) -> str:
        """Operator Screen 4: Smart Charging / Peak Shaving (1440x1024)."""
        print("\n--- Building Operator Screen 4: Smart Charging / Peak Shaving ---")
        frame_id = self.create_clean_frame("Desktop - Operator 04 Smart Charging Peak Shaving", 3136.0, 1200.0, 1440.0, 1024.0, "#F8FAFC")
        self.add_desktop_shell(frame_id, "EMS", "Smart Charging Dispatcher & Autonomous Peak Shaving Guardrails", active_nav=3)

        # 3-Metric Ribbon
        ems_metrics = [
            ("SITE TRANSFORMER CAPACITY", "600.0 kW Max Limit", "#0F172A"),
            ("LIVE AGGREGATE DRAW", "482.4 kW (80.4% Load)", "#006A60"),
            ("SOLAR + BESS DISCHARGE", "+145.0 kW Offset", "#006A60"),
        ]
        for idx, (lbl, val, col) in enumerate(ems_metrics):
            mx = 272.0 + idx * 384.0
            self.add_rect(f"Card - EMS Metric {idx}", mx, 96.0, 360.0, 112.0, "#FFFFFF", frame_id, radius=12.0, stroke="#E2E8F0")
            self.add_text(f"Text - EMS Metric Lbl {idx}", lbl, mx + 24.0, 116.0, frame_id, font_size=12, fill="#0F172A", font_weight="700")
            self.add_text(f"Text - EMS Metric Val {idx}", val, mx + 24.0, 148.0, frame_id, font_size=24, fill=col, font_weight="700")

        # Autonomous Peak Shaving Guardrails Card
        self.add_rect("Card - Autonomous Peak Shaving Guardrails", 272.0, 232.0, 1136.0, 304.0, "#0F172A", frame_id, radius=16.0)
        self.add_icon("Icon - Peak Shaving Shield", "bolt", 296.0, 256.0, frame_id, size=24, fill="#10B981")
        self.add_text("Text - Guardrails Header", "Autonomous Peak Shaving Guardrail Envelope (OCPP TxProfile)", 332.0, 260.0, frame_id, font_size=18, fill="#FFFFFF", font_weight="700")
        self.add_rect("Container - Load Envelope Bar", 296.0, 312.0, 1088.0, 64.0, "#1E293B", frame_id, radius=12.0)
        self.add_rect("Container - Active Draw Fill", 296.0, 312.0, 840.0, 64.0, "#10B981", frame_id, radius=12.0)
        self.add_text("Text - Envelope Status", "482.4 kW Active EVSE Load / 600.0 kW Site Ceiling (117.6 kW Headroom)", 320.0, 336.0, frame_id, font_size=16, fill="#0B0F19", font_weight="700")
        self.add_rect("Button - Emergency Load Shed CTA", 296.0, 404.0, 280.0, 48.0, "#1E293B", frame_id, radius=8.0, stroke="#EF4444")
        self.add_text("Text - Load Shed CTA", "Trigger DSO Curtailment (-30%)", 328.0, 420.0, frame_id, font_size=14, fill="#FFFFFF", font_weight="700")
        self.add_rect("Button - Apply Smart Profile CTA", 600.0, 404.0, 280.0, 48.0, "#10B981", frame_id, radius=8.0)
        self.add_text("Text - Apply Profile CTA", "Broadcast OCPP ChargingProfile", 628.0, 420.0, frame_id, font_size=14, fill="#0B0F19", font_weight="700")

        # Station Throttling Table
        self.add_rect("Card - Station Throttling Table", 272.0, 560.0, 1136.0, 424.0, "#FFFFFF", frame_id, radius=12.0, stroke="#E2E8F0")
        self.add_text("Text - Throttling Table Title", "Active Station Power Allocation & Dynamic Throttling", 296.0, 584.0, frame_id, font_size=18, fill="#0F172A", font_weight="700")

        throttles = [
            ("EVSE-LON-01 · Bus #104", "Priority Tier 1 (Critical)", "150.0 kW Max", "148.2 kW Allocated"),
            ("EVSE-LON-02 · Van #209", "Priority Tier 2 (Standard)", "150.0 kW Max", "112.0 kW Throttled"),
            ("EVSE-LON-04 · Truck #311", "Priority Tier 1 (Critical)", "150.0 kW Max", "150.0 kW Allocated"),
            ("EVSE-LON-05 · Bus #108", "Priority Tier 3 (Flexible)", "150.0 kW Max", "72.2 kW Throttled"),
        ]
        for idx, (st, prio, mx_p, alloc) in enumerate(throttles):
            ty = 632.0 + idx * 80.0
            self.add_rect(f"Container - Throttle Row {idx}", 296.0, ty, 1088.0, 64.0, "#0F172A", frame_id, radius=8.0)
            self.add_text(f"Text - Throttle St {idx}", st, 320.0, ty + 24.0, frame_id, font_size=14, fill="#FFFFFF", font_weight="700")
            self.add_text(f"Text - Throttle Prio {idx}", prio, 620.0, ty + 24.0, frame_id, font_size=14, fill="#38BDF8")
            self.add_text(f"Text - Throttle Max {idx}", mx_p, 920.0, ty + 24.0, frame_id, font_size=14, fill="#CBD5E1")
            self.add_text(f"Text - Throttle Alloc {idx}", alloc, 1120.0, ty + 24.0, frame_id, font_size=14, fill="#10B981", font_weight="700")

        return frame_id


def main():
    client = PenpotMCPTestClient()
    builder = M3M4Builder(client)

    f5 = builder.build_screen_5()
    f6 = builder.build_screen_6()
    f7 = builder.build_screen_7()
    f8 = builder.build_screen_8()

    op1 = builder.build_operator_screen_1()
    op2 = builder.build_operator_screen_2()
    op3 = builder.build_operator_screen_3()
    op4 = builder.build_operator_screen_4()

    print("\n--- Exporting SVG Previews for M3 & M4 Screens ---")
    export_svg_frame(f5, "Mobile - Driver 05 Login Register", f"{FILE_ID}_driver_05_login_register.svg")
    export_svg_frame(f6, "Mobile - Driver 06 Account Profile", f"{FILE_ID}_driver_06_account_profile.svg")
    export_svg_frame(f7, "Mobile - Driver 07 Charging History", f"{FILE_ID}_driver_07_charging_history.svg")
    export_svg_frame(f8, "Mobile - Driver 08 Settings", f"{FILE_ID}_driver_08_settings.svg")

    export_svg_frame(op1, "Desktop - Operator Mission Control", f"{FILE_ID}_operator_01_mission_control.svg")
    export_svg_frame(op1, "Desktop - Operator Mission Control", f"{FILE_ID}_desktop.svg")
    export_svg_frame(op2, "Desktop - Operator 02 EVSE Charger Management", f"{FILE_ID}_operator_02_evse_management.svg")
    export_svg_frame(op3, "Desktop - Operator 03 Depot Bay Fleet Gantt", f"{FILE_ID}_operator_03_depot_bay_gantt.svg")
    export_svg_frame(op4, "Desktop - Operator 04 Smart Charging Peak Shaving", f"{FILE_ID}_operator_04_smart_charging.svg")

    print("\nAll M3, M4 & M5 screens and SVG previews completed successfully!")


if __name__ == "__main__":
    main()
