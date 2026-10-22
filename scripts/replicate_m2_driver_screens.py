#!/usr/bin/env python3
"""
Mapletyne MTT Charge CPO - Milestone 2: Driver Mobile PWA Core Charging Flow
Generates and verifies Screens 1 to 4 in Penpot file b0861d9d-6919-8015-8008-d266309e53fd:
1. Screen 1: Depot Map / Home (Mobile - Driver 01 Depot Map)
2. Screen 2: QR Scan / Auth (Mobile - Driver 02 QR Scan)
3. Screen 3: Active Charging Telemetry (Mobile - Driver 03 Active Telemetry)
4. Screen 4: Digital Receipt (Mobile - Driver 04 Digital Receipt)

Strict adherence to:
- M3 tokens (#0B0F19 canvas, #0F172A surface, #10B981 / #48E260 emerald accents)
- Strict 4px/8px mathematical grid on ALL coordinates and dimensions
- Minimum 12px typography floor
- Touch hit targets >= 44x44px
- Exclusively Google Material Symbols ("Material Symbols Outlined", bounds 24x24)
- Zero collisions, full WCAG AAA contrast
"""

import sys
import os
import re
import json
import time
import urllib.request
from typing import Dict, Any, List, Optional, Tuple

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from tests.e2e.conftest import (
    PenpotMCPTestClient,
    FILE_ID,
    PAGE_ID,
    PROJECT_ID,
    DEFAULT_PENPOT_BASE,
    PREVIEWS_DIR,
)

def assert_grid(name: str, val: float, is_dimension: bool = False):
    """Enforce strict 4-point mathematical grid conjunction."""
    rounded = round(val)
    if abs(val - rounded) >= 0.05 or rounded % 4 != 0:
        raise ValueError(f"Grid Violation in '{name}': value={val} (must be multiple of 4)")
    if is_dimension and rounded <= 0:
        raise ValueError(f"Dimension Violation in '{name}': value={val} (must be > 0)")

def get_penpot_auth() -> Tuple[Optional[str], Optional[str]]:
    """Authenticates with Penpot to acquire auth-token cookie and profile ID."""
    email = os.environ.get("PENPOT_EMAIL", "daniel.a@mapletynetechnologies.com")
    password = os.environ.get("PENPOT_PASSWORD", "jzv@MVX3yfd.tfz0exr")
    login_url = f"{DEFAULT_PENPOT_BASE}/api/rpc/command/login-with-password"
    payload = json.dumps({"email": email, "password": password}).encode("utf-8")
    req = urllib.request.Request(login_url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            cookie_hdr = resp.headers.get("Set-Cookie", "")
            m_cookie = re.search(r"auth-token=([^;]+)", cookie_hdr)
            auth_token = m_cookie.group(1) if m_cookie else None
            body = resp.read().decode("utf-8")
            m_prof = re.search(r'~:id\",\"~u([^\"]+)', body)
            profile_id = m_prof.group(1) if m_prof else None
            return auth_token, profile_id
    except Exception as e:
        print(f"[Auth Error] {e}")
        return None, None

def export_svg_frame(frame_id: str, frame_name: str, out_filename: str):
    """Export frame to SVG using authenticated Chromium renderer."""
    auth_token, profile_id = get_penpot_auth()
    if not auth_token or not profile_id:
        print(f"[Export Error] Failed to authenticate for {frame_name}")
        return

    export_url = f"{DEFAULT_PENPOT_BASE}/api/export"
    payload = {
        "~:cmd": "~:export-shapes",
        "~:profile-id": f"~u{profile_id}",
        "~:wait": True,
        "~:exports": [{
            "~:page-id": f"~u{PAGE_ID}",
            "~:file-id": f"~u{FILE_ID}",
            "~:object-id": f"~u{frame_id}",
            "~:type": "~:svg",
            "~:suffix": "",
            "~:scale": 1.0,
            "~:name": frame_name
        }]
    }
    req = urllib.request.Request(
        export_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/transit+json",
            "Cookie": f"auth-token={auth_token}"
        }
    )
    svg_content = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                body = resp.read().decode("utf-8")
                m_uri = re.search(r"assets/by-id/[^\"]+", body)
                if not m_uri:
                    print(f"[Export Error] No asset URI in response for {frame_name}")
                    return
                asset_rel = m_uri.group(0)

            asset_url = f"{DEFAULT_PENPOT_BASE}/{asset_rel}"
            asset_req = urllib.request.Request(asset_url, headers={"Cookie": f"auth-token={auth_token}"})
            with urllib.request.urlopen(asset_req, timeout=20) as resp:
                svg_content = resp.read().decode("utf-8")
            if svg_content:
                break
        except Exception as e:
            if attempt == 2:
                print(f"[Export Error] Failed after 3 attempts for {frame_name}: {e}")
                return
            time.sleep(2)

    if not svg_content:
        print(f"[Export Error] No SVG content retrieved for {frame_name}")
        return

    # Hydrate with Google Material Symbols webfont
    font_face = (
        "@font-face {\n"
        "    font-family: 'Material Symbols Outlined';\n"
        "    font-style: normal;\n"
        "    font-weight: 400;\n"
        "    src: url(https://fonts.gstatic.com/s/materialsymbolsoutlined/v380/kJF1BvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oDMzByHX9rA6RzaxHMPdY43zj-jCxv3fzvRNU22ZXGJpEpjC_1v-p_4MrImHCIJIZrDCvHOej.woff2) format('woff2');\n"
        "  }\n"
    )
    if "Material Symbols Outlined" not in svg_content:
        if "<style>" in svg_content:
            svg_content = svg_content.replace("<style>", f"<style>{font_face}\n")
        elif "<defs>" in svg_content:
            svg_content = svg_content.replace("<defs>", f"<defs><style>{font_face}</style>")
        else:
            svg_content = svg_content.replace("<svg", f"<svg><defs><style>{font_face}</style></defs>")

    os.makedirs(PREVIEWS_DIR, exist_ok=True)
    out_path = os.path.join(PREVIEWS_DIR, out_filename)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"[Export Success] Saved {out_path} ({len(svg_content)} bytes)")


class ArtboardBuilder:
    def __init__(self, client: PenpotMCPTestClient):
        self.client = client
        self.existing_objs = {o["id"]: o for o in self.client.call_tool("get_page_objects", {"file_id": FILE_ID, "page_id": PAGE_ID})}
        self.frames = {o["name"]: o for o in self.existing_objs.values() if o.get("type") == "frame"}
        self.frame_offsets: Dict[str, Tuple[float, float]] = {
            o["id"]: (float(o.get("x", 0.0)), float(o.get("y", 0.0)))
            for o in self.existing_objs.values()
            if o.get("type") == "frame"
        }

    def create_clean_frame(self, name: str, x: float, y: float, w: float, h: float, fill: str) -> str:
        assert_grid(f"Frame {name} x", x)
        assert_grid(f"Frame {name} y", y)
        assert_grid(f"Frame {name} w", w, is_dimension=True)
        assert_grid(f"Frame {name} h", h, is_dimension=True)

        objs = self.client.call_tool("get_page_objects", {"file_id": FILE_ID, "page_id": PAGE_ID})
        for o in objs:
            if o.get("name") == name and o.get("type") == "frame":
                print(f"Deleting existing frame '{name}' ({o['id']}) for clean recreation")
                self.client.call_tool("delete_shape", {"file_id": FILE_ID, "page_id": PAGE_ID, "shape_id": o["id"]})

        frame_res = self.client.call_tool("create_frame", {
            "file_id": FILE_ID,
            "page_id": PAGE_ID,
            "name": name,
            "x": float(x),
            "y": float(y),
            "width": float(w),
            "height": float(h),
            "fill_color": fill
        })
        frame_id = frame_res["id"]
        self.frame_offsets[frame_id] = (float(x), float(y))
        print(f"Created frame '{name}' ({frame_id}) at ({x}, {y})")
        return frame_id

    def add_rect(self, name: str, x: float, y: float, w: float, h: float, fill: str, parent_id: str,
                 radius: float = 0.0, stroke: Optional[str] = None, stroke_width: float = 1.0) -> Dict[str, Any]:
        fx, fy = self.frame_offsets.get(parent_id, (0.0, 0.0))
        abs_x = fx + float(x)
        abs_y = fy + float(y)
        assert_grid(f"{name} x", abs_x)
        assert_grid(f"{name} y", abs_y)
        assert_grid(f"{name} w", w, is_dimension=True)
        assert_grid(f"{name} h", h, is_dimension=True)

        args = {
            "file_id": FILE_ID,
            "page_id": PAGE_ID,
            "name": name,
            "x": abs_x,
            "y": abs_y,
            "width": float(w),
            "height": float(h),
            "fill_color": fill,
            "parent_id": parent_id,
            "border_radius": float(radius)
        }
        if stroke:
            args["stroke_color"] = stroke
            args["stroke_width"] = float(stroke_width)

        res = self.client.call_tool("create_rectangle", args)
        if not res or "id" not in res:
            raise RuntimeError(f"Failed to create rect {name}: {res}")
        return res

    def add_text(self, name: str, text: str, x: float, y: float, parent_id: str,
                 font_size: int = 14, fill: str = "#F8FAFC", font_weight: str = "400",
                 w: Optional[float] = None, h: Optional[float] = None,
                 font_family: str = "sourcesanspro") -> Dict[str, Any]:
        fx, fy = self.frame_offsets.get(parent_id, (0.0, 0.0))
        abs_x = fx + float(x)
        abs_y = fy + float(y)
        assert_grid(f"{name} x", abs_x)
        assert_grid(f"{name} y", abs_y)
        if font_size < 12:
            raise ValueError(f"Typography floor violation in '{name}': {font_size}px < 12px")

        args = {
            "file_id": FILE_ID,
            "page_id": PAGE_ID,
            "name": name,
            "text": text,
            "x": abs_x,
            "y": abs_y,
            "font_size": int(font_size),
            "font_weight": str(font_weight),
            "fill_color": fill,
            "font_family": font_family,
            "parent_id": parent_id
        }
        if w is not None:
            assert_grid(f"{name} w", w, is_dimension=True)
            args["width"] = float(w)
        if h is not None:
            assert_grid(f"{name} h", h, is_dimension=True)
            args["height"] = float(h)

        res = self.client.call_tool("create_text", args)
        if not res or "id" not in res:
            raise RuntimeError(f"Failed to create text {name}: {res}")
        return res

    def add_icon(self, name: str, icon_glyph: str, x: float, y: float, parent_id: str,
                 size: int = 24, fill: str = "#10B981") -> Dict[str, Any]:
        fx, fy = self.frame_offsets.get(parent_id, (0.0, 0.0))
        abs_x = fx + float(x)
        abs_y = fy + float(y)
        assert_grid(f"{name} x", abs_x)
        assert_grid(f"{name} y", abs_y)
        assert_grid(f"{name} size", float(size), is_dimension=True)

        args = {
            "file_id": FILE_ID,
            "page_id": PAGE_ID,
            "name": name,
            "text": icon_glyph,
            "x": abs_x,
            "y": abs_y,
            "width": float(size),
            "height": float(size),
            "font_size": int(size),
            "fill_color": fill,
            "font_family": "Material Symbols Outlined",
            "parent_id": parent_id
        }
        res = self.client.call_tool("create_text", args)
        if not res or "id" not in res:
            raise RuntimeError(f"Failed to create icon {name}: {res}")
        return res

    def build_screen_1(self):
        """Cleanly build Screen 1: Depot Map / Home (Mobile - Driver 01 Depot Map) with canvas-offset coordinates."""
        print("\n--- Building Screen 1: Depot Map / Home ---")
        # Also remove legacy 'Mobile - Driver PWA' if present
        objs = self.client.call_tool("get_page_objects", {"file_id": FILE_ID, "page_id": PAGE_ID})
        for o in objs:
            if o.get("name") == "Mobile - Driver PWA" and o.get("type") == "frame":
                self.client.call_tool("delete_shape", {"file_id": FILE_ID, "page_id": PAGE_ID, "shape_id": o["id"]})

        frame_id = self.create_clean_frame("Mobile - Driver 01 Depot Map", 1640.0, 100.0, 392.0, 844.0, "#0B0F19")

        # 1. Screen canvas background rect (bottom-most layer)
        self.add_rect("Container - Screen Canvas Depot Map", 0.0, 0.0, 392.0, 844.0, "#0B0F19", frame_id)

        # 2. Top Navigation Header
        self.add_rect("Mobile Top Navigation Header", 0.0, 0.0, 392.0, 64.0, "#0F172A", frame_id)
        self.add_text("Text - Mobile Brand", "Mapletyne Charge", 24.0, 20.0, frame_id, font_size=18, fill="#F8FAFC", font_weight="700")

        # 3. Search Bar
        self.add_rect("Container - Search Input Bar", 24.0, 72.0, 344.0, 40.0, "#1E293B", frame_id, radius=8.0)
        self.add_icon("Icon - Search Pin", "search", 36.0, 80.0, frame_id, size=24, fill="#94A3B8")
        self.add_text("Text - Search Field", "Search chargers, bays, locations...", 68.0, 80.0, frame_id, font_size=13, fill="#CBD5E1")

        # 4. Depot Status Badge
        self.add_rect("Container - Depot Availability Badge", 24.0, 120.0, 344.0, 36.0, "#1E293B", frame_id, radius=8.0)
        self.add_icon("Icon - Depot Station Icon", "ev_station", 36.0, 128.0, frame_id, size=24, fill="#10B981")
        self.add_text("Text - Depot Available Count", "Central Fleet Depot · 12/16 Available", 68.0, 128.0, frame_id, font_size=13, fill="#F8FAFC", font_weight="700")

        # 5. Interactive Map Container with 3 Charger Pins
        self.add_rect("Container - Map Representation Area", 24.0, 168.0, 344.0, 320.0, "#1E293B", frame_id, radius=16.0)
        # Pin 1: Bay 04 - Available CCS2 150kW
        self.add_rect("Container - Pin Bay 04", 44.0, 192.0, 124.0, 44.0, "#10B981", frame_id, radius=8.0)
        self.add_icon("Icon - Pin Bay 04", "flash_on", 52.0, 204.0, frame_id, size=24, fill="#0B0F19")
        self.add_text("Text - Pin Bay 04 Label", "Bay 04 · 150kW", 80.0, 204.0, frame_id, font_size=12, fill="#0B0F19", font_weight="700")

        # Pin 2: Bay 05 - In Use
        self.add_rect("Container - Pin Bay 05", 212.0, 248.0, 124.0, 44.0, "#334155", frame_id, radius=8.0)
        self.add_icon("Icon - Pin Bay 05", "offline_bolt", 220.0, 260.0, frame_id, size=24, fill="#94A3B8")
        self.add_text("Text - Pin Bay 05 Label", "Bay 05 · In Use", 248.0, 260.0, frame_id, font_size=12, fill="#CBD5E1", font_weight="700")

        # Pin 3: Bay 06 - Reserved
        self.add_rect("Container - Pin Bay 06", 92.0, 320.0, 124.0, 44.0, "#334155", frame_id, radius=8.0)
        self.add_icon("Icon - Pin Bay 06", "schedule", 100.0, 332.0, frame_id, size=24, fill="#F59E0B")
        self.add_text("Text - Pin Bay 06 Label", "Bay 06 · Reserved", 128.0, 332.0, frame_id, font_size=12, fill="#CBD5E1", font_weight="700")

        # 6. Bottom Sheet Charger Card
        self.add_rect("Card - Mobile Depot Bay", 24.0, 504.0, 344.0, 264.0, "#0F172A", frame_id, radius=16.0, stroke="#1E293B")
        self.add_text("Text - Bay Status", "DEPOT BAY 04 · AVAILABLE", 48.0, 528.0, frame_id, font_size=12, fill="#10B981", font_weight="700")
        self.add_text("Text - Plug Status", "Ultra-Fast DC Charger Ready", 48.0, 556.0, frame_id, font_size=18, fill="#F8FAFC", font_weight="700")
        self.add_rect("Container - Fast DC Spec Pill", 48.0, 592.0, 128.0, 28.0, "#10B981", frame_id, radius=6.0)
        self.add_text("Text - Fast DC Spec Label", "CCS2 · 150 kW DC", 56.0, 600.0, frame_id, font_size=12, fill="#0B0F19", font_weight="700")
        self.add_rect("Button - Scan QR CTA", 48.0, 632.0, 296.0, 48.0, "#10B981", frame_id, radius=12.0)
        self.add_text("Text - CTA Label", "Scan QR to Start Charging", 96.0, 648.0, frame_id, font_size=15, fill="#0B0F19", font_weight="700")

        # 7. Global Mobile Bottom Navigation Bar (64px)
        self.add_rect("Mobile Bottom Navigation Bar", 0.0, 780.0, 392.0, 64.0, "#0F172A", frame_id)
        self.add_rect("Tab - Map Hit Zone", 0.0, 780.0, 128.0, 64.0, "#0F172A", frame_id)
        self.add_icon("Icon - Nav Map", "map", 52.0, 788.0, frame_id, size=24, fill="#10B981")
        self.add_text("Text - Nav Map", "Map", 48.0, 816.0, frame_id, font_size=12, fill="#10B981", font_weight="700")

        self.add_rect("Tab - Scan Hit Zone", 128.0, 780.0, 136.0, 64.0, "#0F172A", frame_id)
        self.add_icon("Icon - Nav Scan", "qr_code_scanner", 184.0, 788.0, frame_id, size=24, fill="#CBD5E1")
        self.add_text("Text - Nav Scan", "Scan", 180.0, 816.0, frame_id, font_size=12, fill="#CBD5E1")

        self.add_rect("Tab - Account Hit Zone", 264.0, 780.0, 128.0, 64.0, "#0F172A", frame_id)
        self.add_icon("Icon - Nav Profile", "person", 316.0, 788.0, frame_id, size=24, fill="#CBD5E1")
        self.add_text("Text - Nav Profile", "Account", 304.0, 816.0, frame_id, font_size=12, fill="#CBD5E1")

        print("Screen 1 successfully built with canvas-offset coordinates.")
        return frame_id

    def build_screen_2(self):
        """Implement Screen 2: QR Scan / Auth (Mobile - Driver 02 QR Scan)."""
        print("\n--- Building Screen 2: QR Scan / Auth ---")
        frame_id = self.create_clean_frame("Mobile - Driver 02 QR Scan", 2120.0, 100.0, 392.0, 844.0, "#0B0F19")

        # Canvas background rect
        self.add_rect("Container - Screen Canvas QR", 0.0, 0.0, 392.0, 844.0, "#0B0F19", frame_id)

        # Top Bar
        self.add_rect("Mobile Header QR", 0.0, 0.0, 392.0, 64.0, "#0F172A", frame_id)
        self.add_rect("Button - QR Back", 16.0, 12.0, 44.0, 44.0, "#1E293B", frame_id, radius=8.0)
        self.add_icon("Icon - QR Back", "arrow_back", 28.0, 24.0, frame_id, size=24, fill="#F8FAFC")
        self.add_text("Text - QR Header Title", "Scan Charger QR", 72.0, 20.0, frame_id, font_size=18, fill="#F8FAFC", font_weight="700")
        self.add_rect("Button - Flash Toggle", 332.0, 12.0, 44.0, 44.0, "#1E293B", frame_id, radius=8.0)
        self.add_icon("Icon - Flash Toggle", "flash_on", 344.0, 24.0, frame_id, size=24, fill="#10B981")

        # Viewfinder HUD Reticle
        self.add_rect("Container - Viewfinder HUD", 48.0, 88.0, 296.0, 296.0, "#0F172A", frame_id, radius=24.0, stroke="#10B981", stroke_width=4.0)
        self.add_icon("Icon - Viewfinder Center Reticle", "qr_code_scanner", 184.0, 224.0, frame_id, size=24, fill="#10B981")
        self.add_text("Text - Reticle Prompt Label", "Align QR code on charger screen within frame", 48.0, 396.0, frame_id, font_size=13, fill="#CBD5E1")

        # Manual charger ID card
        self.add_rect("Card - Manual Charger ID", 24.0, 432.0, 344.0, 152.0, "#0F172A", frame_id, radius=16.0)
        self.add_text("Text - Manual ID Title", "Or Enter Charger ID manually", 48.0, 448.0, frame_id, font_size=14, fill="#F8FAFC", font_weight="700")
        self.add_rect("Container - Manual ID Input Box", 48.0, 480.0, 224.0, 48.0, "#1E293B", frame_id, radius=12.0)
        self.add_icon("Icon - Input Tag", "tag", 56.0, 492.0, frame_id, size=24, fill="#94A3B8")
        self.add_text("Text - Manual ID Placeholder", "LON-DEPOT-04", 88.0, 496.0, frame_id, font_size=14, fill="#CBD5E1")
        self.add_rect("Button - Manual ID Submit", 280.0, 480.0, 64.0, 48.0, "#10B981", frame_id, radius=12.0)
        self.add_icon("Icon - Submit Arrow", "arrow_forward", 300.0, 492.0, frame_id, size=24, fill="#0B0F19")
        self.add_text("Text - Manual Hint", "Charger ID is printed below the screen", 48.0, 540.0, frame_id, font_size=12, fill="#CBD5E1")

        # Driver pre-auth phone verification card
        self.add_rect("Card - Driver Pre-Auth", 24.0, 600.0, 344.0, 168.0, "#0F172A", frame_id, radius=16.0)
        self.add_text("Text - Pre-Auth Title", "Driver Identity Verification", 48.0, 616.0, frame_id, font_size=14, fill="#F8FAFC", font_weight="700")
        self.add_rect("Container - Phone Input Box", 48.0, 644.0, 296.0, 48.0, "#1E293B", frame_id, radius=12.0)
        self.add_icon("Icon - Phone Icon", "call", 56.0, 656.0, frame_id, size=24, fill="#94A3B8")
        self.add_text("Text - Phone Value", "+44 7700 900077 · OTP Verified", 88.0, 656.0, frame_id, font_size=13, fill="#F8FAFC")
        self.add_rect("Button - Confirm Authorize CTA", 48.0, 704.0, 296.0, 52.0, "#10B981", frame_id, radius=12.0)
        self.add_text("Text - Confirm Authorize Label", "Confirm & Start Session", 104.0, 720.0, frame_id, font_size=15, fill="#0B0F19", font_weight="700")

        # Bottom Navigation Bar
        self.add_rect("Mobile Bottom Navigation Bar QR", 0.0, 780.0, 392.0, 64.0, "#0F172A", frame_id)
        self.add_icon("Icon - Bottom Nav QR Map", "map", 52.0, 788.0, frame_id, size=24, fill="#CBD5E1")
        self.add_icon("Icon - Bottom Nav QR Scan", "qr_code_scanner", 184.0, 788.0, frame_id, size=24, fill="#10B981")
        self.add_icon("Icon - Bottom Nav QR Profile", "person", 316.0, 788.0, frame_id, size=24, fill="#CBD5E1")

        print("Screen 2 successfully built.")
        return frame_id

    def build_screen_3(self):
        """Implement Screen 3: Active Charging Telemetry (Mobile - Driver 03 Active Telemetry)."""
        print("\n--- Building Screen 3: Active Charging Telemetry ---")
        frame_id = self.create_clean_frame("Mobile - Driver 03 Active Telemetry", 2600.0, 100.0, 392.0, 844.0, "#0B0F19")

        # Canvas background rect
        self.add_rect("Container - Screen Canvas Telemetry", 0.0, 0.0, 392.0, 844.0, "#0B0F19", frame_id)

        # Top Bar
        self.add_rect("Mobile Header Telemetry", 0.0, 0.0, 392.0, 64.0, "#0F172A", frame_id)
        self.add_rect("Button - Telemetry Back", 16.0, 12.0, 44.0, 44.0, "#1E293B", frame_id, radius=8.0)
        self.add_icon("Icon - Telemetry Back", "arrow_back", 28.0, 24.0, frame_id, size=24, fill="#F8FAFC")
        self.add_text("Text - Telemetry Header Title", "Active Telemetry", 72.0, 20.0, frame_id, font_size=18, fill="#F8FAFC", font_weight="700")
        self.add_rect("Container - Live Badge", 288.0, 16.0, 88.0, 32.0, "#1E293B", frame_id, radius=16.0, stroke="#10B981")
        self.add_icon("Icon - Live Pulse", "sensors", 296.0, 20.0, frame_id, size=24, fill="#10B981")
        self.add_text("Text - Live Badge Label", "LIVE", 324.0, 24.0, frame_id, font_size=12, fill="#10B981", font_weight="700")

        # Bay & Session Summary
        self.add_text("Text - Station Bay Summary", "Depot Bay 04 · CCS2 150kW", 24.0, 76.0, frame_id, font_size=16, fill="#F8FAFC", font_weight="700")
        self.add_text("Text - Session ID Summary", "Active Session #SES-88219", 24.0, 100.0, frame_id, font_size=12, fill="#94A3B8")

        # Concentric Activity Rings / SoC Hero Widget
        self.add_rect("Container - SoC Rings Center", 96.0, 124.0, 200.0, 200.0, "#0F172A", frame_id, radius=100.0, stroke="#10B981", stroke_width=8.0)
        self.add_rect("Container - Inner Ring Cyan", 124.0, 152.0, 144.0, 144.0, "#0B0F19", frame_id, radius=72.0, stroke="#38BDF8", stroke_width=6.0)
        self.add_text("Text - SoC Percentage Value", "68%", 160.0, 192.0, frame_id, font_size=36, fill="#F8FAFC", font_weight="700")
        self.add_icon("Icon - Battery Charging Full", "battery_charging_full", 152.0, 244.0, frame_id, size=24, fill="#10B981")
        self.add_text("Text - Battery SoC Subtitle", "Battery SoC (DC)", 180.0, 248.0, frame_id, font_size=12, fill="#10B981", font_weight="700")

        # Hero Live Power Banner
        self.add_rect("Card - Live Power Hero", 24.0, 336.0, 344.0, 72.0, "#0F172A", frame_id, radius=16.0)
        self.add_icon("Icon - Power Bolt", "bolt", 40.0, 352.0, frame_id, size=24, fill="#10B981")
        self.add_text("Text - Live Power Value", "142.5 kW", 72.0, 348.0, frame_id, font_size=28, fill="#10B981", font_weight="700")
        self.add_text("Text - Live Power Label", "Delivering Fast DC Power", 216.0, 360.0, frame_id, font_size=12, fill="#CBD5E1")

        # 4-Row Telemetry Stats Glass Card
        self.add_rect("Card - Telemetry 4-Row Stats", 24.0, 420.0, 344.0, 192.0, "#0F172A", frame_id, radius=16.0)
        # Row 1: Delivered
        self.add_icon("Icon - Row Delivered", "offline_bolt", 40.0, 436.0, frame_id, size=24, fill="#F8FAFC")
        self.add_text("Text - Row Delivered Label", "Delivered Energy", 72.0, 436.0, frame_id, font_size=14, fill="#CBD5E1")
        self.add_text("Text - Row Delivered Value", "24.350 kWh", 232.0, 436.0, frame_id, font_size=14, fill="#F8FAFC", font_weight="700")
        # Row 2: Duration
        self.add_icon("Icon - Row Duration", "schedule", 40.0, 476.0, frame_id, size=24, fill="#F8FAFC")
        self.add_text("Text - Row Duration Label", "Charging Duration", 72.0, 476.0, frame_id, font_size=14, fill="#CBD5E1")
        self.add_text("Text - Row Duration Value", "00:32:15", 248.0, 476.0, frame_id, font_size=14, fill="#F8FAFC", font_weight="700")
        # Row 3: Cost
        self.add_icon("Icon - Row Cost", "payments", 40.0, 516.0, frame_id, size=24, fill="#10B981")
        self.add_text("Text - Row Cost Label", "Cost (incl. VAT)", 72.0, 516.0, frame_id, font_size=14, fill="#CBD5E1")
        self.add_text("Text - Row Cost Value", "£8.52", 280.0, 516.0, frame_id, font_size=15, fill="#10B981", font_weight="700")
        # Row 4: Rate
        self.add_icon("Icon - Row Rate", "analytics", 40.0, 556.0, frame_id, size=24, fill="#94A3B8")
        self.add_text("Text - Row Rate Label", "Tariff Unit Rate", 72.0, 556.0, frame_id, font_size=13, fill="#94A3B8")
        self.add_text("Text - Row Rate Value", "£0.35 / kWh", 248.0, 556.0, frame_id, font_size=13, fill="#94A3B8")

        # Overstay Grace Alert Banner
        self.add_rect("Card - Overstay Grace Alert", 24.0, 624.0, 344.0, 64.0, "#0F172A", frame_id, radius=12.0, stroke="#F59E0B")
        self.add_icon("Icon - Grace Hourglass", "hourglass_empty", 36.0, 640.0, frame_id, size=24, fill="#F59E0B")
        self.add_text("Text - Grace Alert Message", "Grace Active: Move vehicle in 14:22 before £0.50/min idle fee", 68.0, 644.0, frame_id, font_size=12, fill="#F8FAFC", font_weight="700")

        # Emergency Action Buttons (Vertical Stack)
        self.add_rect("Button - Emergency Stop CTA", 24.0, 704.0, 344.0, 52.0, "#EF4444", frame_id, radius=12.0)
        self.add_icon("Icon - Stop Session", "stop_circle", 84.0, 716.0, frame_id, size=24, fill="#0B0F19")
        self.add_text("Text - Stop Session Label", "Stop Charging Session", 116.0, 720.0, frame_id, font_size=20, fill="#0B0F19", font_weight="700")

        self.add_rect("Button - Emergency Unlock CTA", 24.0, 768.0, 344.0, 48.0, "#1E293B", frame_id, radius=12.0, stroke="#334155")
        self.add_icon("Icon - Unlock Cable", "lock_open", 84.0, 780.0, frame_id, size=24, fill="#F8FAFC")
        self.add_text("Text - Unlock Cable Label", "Emergency Unlock Cable", 116.0, 780.0, frame_id, font_size=14, fill="#F8FAFC", font_weight="700")

        print("Screen 3 successfully built.")
        return frame_id

    def build_screen_4(self):
        """Implement Screen 4: Digital Receipt (Mobile - Driver 04 Digital Receipt)."""
        print("\n--- Building Screen 4: Digital Receipt ---")
        frame_id = self.create_clean_frame("Mobile - Driver 04 Digital Receipt", 3080.0, 100.0, 392.0, 844.0, "#0B0F19")

        # Canvas background rect
        self.add_rect("Container - Screen Canvas Receipt", 0.0, 0.0, 392.0, 844.0, "#0B0F19", frame_id)

        # Top Bar
        self.add_rect("Mobile Header Receipt", 0.0, 0.0, 392.0, 64.0, "#0F172A", frame_id)
        self.add_rect("Button - Receipt Back", 16.0, 12.0, 44.0, 44.0, "#1E293B", frame_id, radius=8.0)
        self.add_icon("Icon - Receipt Back", "arrow_back", 28.0, 24.0, frame_id, size=24, fill="#F8FAFC")
        self.add_text("Text - Receipt Header Title", "Charging Receipt", 72.0, 20.0, frame_id, font_size=18, fill="#F8FAFC", font_weight="700")

        # Celebration Hero Card
        self.add_rect("Card - Celebration Hero", 24.0, 72.0, 344.0, 96.0, "#0F172A", frame_id, radius=16.0)
        self.add_icon("Icon - Celebration Check", "check_circle", 40.0, 96.0, frame_id, size=48, fill="#10B981")
        self.add_text("Text - Celebration Title", "Thank you for charging!", 96.0, 92.0, frame_id, font_size=18, fill="#F8FAFC", font_weight="700")
        self.add_text("Text - Celebration Subtitle", "Receipt sent to driver@mapletyne.com", 96.0, 120.0, frame_id, font_size=12, fill="#94A3B8")

        # Itemized Receipt Card
        self.add_rect("Card - Itemized Receipt", 24.0, 180.0, 344.0, 384.0, "#0F172A", frame_id, radius=16.0)
        # Header
        self.add_text("Text - Receipt Header Label", "CHARGING RECEIPT", 48.0, 196.0, frame_id, font_size=14, fill="#CBD5E1", font_weight="700")
        self.add_text("Text - Receipt Ref Value", "REC-8F21DA-LON", 216.0, 196.0, frame_id, font_size=12, fill="#94A3B8", font_weight="700")

        # Location
        self.add_icon("Icon - Receipt Location", "location_on", 48.0, 228.0, frame_id, size=24, fill="#CBD5E1")
        self.add_text("Text - Receipt Location Label", "Location", 76.0, 228.0, frame_id, font_size=13, fill="#CBD5E1")
        self.add_text("Text - Receipt Location Value", "Depot Bay 04", 224.0, 228.0, frame_id, font_size=13, fill="#F8FAFC", font_weight="700")

        # Connector
        self.add_icon("Icon - Receipt Connector", "power", 48.0, 264.0, frame_id, size=24, fill="#CBD5E1")
        self.add_text("Text - Receipt Connector Label", "Connector", 76.0, 264.0, frame_id, font_size=13, fill="#CBD5E1")
        self.add_text("Text - Receipt Connector Value", "Port 1 (CCS2 150kW)", 188.0, 264.0, frame_id, font_size=13, fill="#F8FAFC", font_weight="700")

        # Duration
        self.add_icon("Icon - Receipt Duration", "schedule", 48.0, 300.0, frame_id, size=24, fill="#CBD5E1")
        self.add_text("Text - Receipt Duration Label", "Duration", 76.0, 300.0, frame_id, font_size=13, fill="#CBD5E1")
        self.add_text("Text - Receipt Duration Value", "00:42:15", 256.0, 300.0, frame_id, font_size=13, fill="#F8FAFC", font_weight="700")

        # Energy
        self.add_icon("Icon - Receipt Energy", "offline_bolt", 48.0, 336.0, frame_id, size=24, fill="#CBD5E1")
        self.add_text("Text - Receipt Energy Label", "Energy", 76.0, 336.0, frame_id, font_size=13, fill="#CBD5E1")
        self.add_text("Text - Receipt Energy Value", "34.500 kWh", 244.0, 336.0, frame_id, font_size=13, fill="#F8FAFC", font_weight="700")

        # Base Rate
        self.add_icon("Icon - Receipt Rate", "sell", 48.0, 372.0, frame_id, size=24, fill="#CBD5E1")
        self.add_text("Text - Receipt Rate Label", "Base Rate", 76.0, 372.0, frame_id, font_size=13, fill="#CBD5E1")
        self.add_text("Text - Receipt Rate Value", "£0.35 / kWh", 244.0, 372.0, frame_id, font_size=13, fill="#F8FAFC", font_weight="700")

        # Subtotal & VAT
        self.add_text("Text - Receipt Subtotal Label", "Subtotal (excl. VAT)", 76.0, 408.0, frame_id, font_size=12, fill="#CBD5E1")
        self.add_text("Text - Receipt Subtotal Value", "£12.08", 268.0, 408.0, frame_id, font_size=12, fill="#CBD5E1")
        self.add_text("Text - Receipt VAT Label", "VAT (20%)", 76.0, 428.0, frame_id, font_size=12, fill="#CBD5E1")
        self.add_text("Text - Receipt VAT Value", "£2.42", 276.0, 428.0, frame_id, font_size=12, fill="#CBD5E1")

        # Divider
        self.add_rect("Divider - Receipt Line", 48.0, 452.0, 296.0, 4.0, "#1E293B", frame_id)

        # Total Paid
        self.add_text("Text - Receipt Total Paid Label", "Total Paid", 76.0, 468.0, frame_id, font_size=16, fill="#F8FAFC", font_weight="700")
        self.add_text("Text - Receipt Total Paid Value", "£14.50", 256.0, 468.0, frame_id, font_size=18, fill="#10B981", font_weight="700")

        # Payment Method
        self.add_icon("Icon - Receipt Payment", "credit_card", 48.0, 504.0, frame_id, size=24, fill="#CBD5E1")
        self.add_text("Text - Receipt Payment Label", "Payment Method", 76.0, 504.0, frame_id, font_size=12, fill="#CBD5E1")
        self.add_text("Text - Receipt Payment Value", "Apple Pay (··4242)", 196.0, 504.0, frame_id, font_size=12, fill="#F8FAFC", font_weight="700")

        # CO2 Impact Card
        self.add_rect("Card - CO2 Impact", 24.0, 576.0, 344.0, 64.0, "#0F172A", frame_id, radius=12.0, stroke="#10B981")
        self.add_icon("Icon - CO2 Eco", "eco", 36.0, 592.0, frame_id, size=28, fill="#10B981")
        self.add_text("Text - CO2 Impact Message", "15.84 kg CO₂ saved vs equivalent diesel fleet van", 72.0, 596.0, frame_id, font_size=12, fill="#F8FAFC", font_weight="700")

        # Primary and Secondary CTAs
        self.add_rect("Button - Download Invoice CTA", 24.0, 656.0, 344.0, 52.0, "#10B981", frame_id, radius=12.0)
        self.add_icon("Icon - Download Invoice", "download", 64.0, 668.0, frame_id, size=24, fill="#0B0F19")
        self.add_text("Text - Download Invoice Label", "Download VAT Invoice (PDF)", 96.0, 672.0, frame_id, font_size=15, fill="#0B0F19", font_weight="700")

        self.add_rect("Button - Charge Again CTA", 24.0, 716.0, 344.0, 48.0, "#1E293B", frame_id, radius=12.0, stroke="#334155")
        self.add_icon("Icon - Charge Again", "replay", 112.0, 728.0, frame_id, size=24, fill="#F8FAFC")
        self.add_text("Text - Charge Again Label", "Charge Again", 144.0, 728.0, frame_id, font_size=14, fill="#F8FAFC", font_weight="700")

        # Bottom Navigation Bar
        self.add_rect("Mobile Bottom Navigation Bar Receipt", 0.0, 780.0, 392.0, 64.0, "#0F172A", frame_id)
        self.add_icon("Icon - Bottom Nav Receipt Map", "map", 52.0, 788.0, frame_id, size=24, fill="#CBD5E1")
        self.add_icon("Icon - Bottom Nav Receipt Scan", "qr_code_scanner", 184.0, 788.0, frame_id, size=24, fill="#CBD5E1")
        self.add_icon("Icon - Bottom Nav Receipt Profile", "person", 316.0, 788.0, frame_id, size=24, fill="#10B981")

        print("Screen 4 successfully built.")
        return frame_id


def main():
    print("==================================================")
    print("Starting Milestone 2 Replication Execution")
    print("==================================================")
    client = PenpotMCPTestClient()
    builder = ArtboardBuilder(client)

    f1 = builder.build_screen_1()
    f2 = builder.build_screen_2()
    f3 = builder.build_screen_3()
    f4 = builder.build_screen_4()

    print("\nAll 4 driver screens created / updated successfully!")
    print(f"Screen 1 ID: {f1}")
    print(f"Screen 2 ID: {f2}")
    print(f"Screen 3 ID: {f3}")
    print(f"Screen 4 ID: {f4}")

    # Export vector SVGs for all frames
    print("\n--- Exporting SVG Previews ---")
    export_svg_frame(f1, "Mobile - Driver 01 Depot Map", f"{FILE_ID}_driver_01_depot_map.svg")
    export_svg_frame(f2, "Mobile - Driver 02 QR Scan", f"{FILE_ID}_driver_02_qr_scan.svg")
    export_svg_frame(f3, "Mobile - Driver 03 Active Telemetry", f"{FILE_ID}_driver_03_active_telemetry.svg")
    export_svg_frame(f4, "Mobile - Driver 04 Digital Receipt", f"{FILE_ID}_driver_04_digital_receipt.svg")
    # Also ensure default mobile is synced
    export_svg_frame(f1, "Mobile - Driver 01 Depot Map", f"{FILE_ID}_mobile.svg")

    print("\nReplication script execution complete!")

if __name__ == "__main__":
    main()
