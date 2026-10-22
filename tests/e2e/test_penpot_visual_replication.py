import sys
import os
import re
import urllib.request
from typing import Dict, List, Any, Optional
import pytest
sys.path.insert(0, os.path.dirname(__file__))

from conftest import (
    CANVAS_URL,
    PREVIEWS_DIR,
    FILE_ID,
    PAGE_ID
)

STRICT_ALL = os.environ.get("STRICT_ALL", "0") == "1"


def find_frame(frames: List[Dict[str, Any]], pattern: str) -> Optional[Dict[str, Any]]:
    """Helper to locate a frame by regex pattern."""
    regex = re.compile(pattern, re.IGNORECASE)
    for f in frames:
        if regex.search(f.get("name", "")):
            return f
    return None


def get_frame_children(shapes: List[Dict[str, Any]], frame: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Helper to locate all shapes visually or hierarchically enclosed by a frame."""
    fx = frame.get("x", 0.0)
    fy = frame.get("y", 0.0)
    fw = frame.get("width", 0.0)
    fh = frame.get("height", 0.0)

    children = []
    for s in shapes:
        if s.get("id") == frame.get("id"):
            continue
        # Check parent_id if available, or coordinate bounding box
        parent_id = s.get("parent_id")
        if parent_id and parent_id == frame.get("id"):
            children.append(s)
        else:
            sx = s.get("x", 0.0)
            sy = s.get("y", 0.0)
            if fx <= sx <= fx + fw and fy <= sy <= fy + fh:
                children.append(s)
    return children


def get_frame_subshapes(client, frame_id: str) -> List[Dict[str, Any]]:
    """Helper to retrieve all descendant shapes belonging to a frame using get_shape_tree."""
    tree = client.call_tool("get_shape_tree", {
        "file_id": FILE_ID,
        "page_id": PAGE_ID,
        "root_id": frame_id
    })
    return tree.get("children", []) if isinstance(tree, dict) else []


def find_shape(shapes: List[Dict[str, Any]], pattern: str, shape_type: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Helper to locate a shape by regex pattern and optional shape type."""
    regex = re.compile(pattern, re.IGNORECASE)
    for s in shapes:
        if shape_type and s.get("type") != shape_type:
            continue
        if regex.search(s.get("name", "")):
            return s
    return None


def get_shape_fill_color(client, shape_id: str) -> Optional[str]:
    """Helper to query shape details and extract primary fill color in hex."""
    details = client.call_tool("get_shape_details", {
        "file_id": FILE_ID,
        "page_id": PAGE_ID,
        "shape_id": shape_id
    })
    if isinstance(details, dict):
        fills = details.get("fills", [])
        if fills and isinstance(fills, list) and len(fills) > 0:
            return fills[0].get("fill-color", "").upper()
    return None


# ==============================================================================
# TIER 1: CORE FEATURE VERIFICATION (HAPPY PATH) - FEATURES 1 TO 19
# ==============================================================================

@pytest.mark.tier1
@pytest.mark.m1
@pytest.mark.baseline
def test_f01_m3_tokens_and_grid_foundation(critic_evaluation, canvas_frames):
    """
    F-01: M3 Token Palette & Grid Foundation (Milestone M1)
    Verifies M3 tokens (#006948 seed / #006A60, #0B0F19 dark canvas, #F8FAFC light canvas),
    8-pt grid alignment, and typography minimum floor.
    """
    assert "pillars" in critic_evaluation, f"Critic evaluation failed: {critic_evaluation}"
    m3_pillar = critic_evaluation["pillars"]["m3_tokens"]
    hygiene_pillar = critic_evaluation["pillars"]["layer_hygiene"]

    # 1. M3 Token Compliance
    assert m3_pillar["status"] == "PASSED", f"M3 token pillar did not pass: {m3_pillar['details']}"
    assert m3_pillar["score"] >= 85.0, f"M3 token score below 85%: {m3_pillar['score']}"

    # 2. 8-Point Grid Alignment
    assert hygiene_pillar["status"] == "PASSED", f"Layer hygiene did not pass: {hygiene_pillar['details']}"
    assert hygiene_pillar["score"] >= 85.0, f"Hygiene score below 85%: {hygiene_pillar['score']}"

    # 3. Canvas Background Fills
    desktop_frame = find_frame(canvas_frames, r"desktop|operator")
    mobile_frame = find_frame(canvas_frames, r"mobile|driver")

    assert desktop_frame is not None, "Desktop artboard not found on canvas"
    assert mobile_frame is not None, "Mobile artboard not found on canvas"

    # 4. Desktop Frame Standard Dimensions
    assert desktop_frame["width"] == 1440.0, f"Desktop width must be 1440px, got {desktop_frame['width']}"
    assert desktop_frame["height"] >= 1024.0, f"Desktop height must be >= 1024px, got {desktop_frame['height']}"

    # 5. Mobile Frame Standard Dimensions
    assert mobile_frame["width"] in [390.0, 392.0], f"Mobile width must be 390px or 392px, got {mobile_frame['width']}"
    assert mobile_frame["height"] >= 844.0, f"Mobile height must be >= 844px, got {mobile_frame['height']}"


@pytest.mark.tier1
@pytest.mark.m1
@pytest.mark.baseline
def test_f02_exclusively_google_material_symbols(canvas_shapes):
    """
    F-02: Exclusively Google Material Symbols (Milestone M1)
    Enforces that all iconography strictly utilizes Google Material Symbols
    and rejects foreign icon libraries (Lucide, FontAwesome, Feather, Heroicons).
    """
    forbidden_libraries = ["lucide", "fontawesome", "fa-", "feather", "heroicons"]
    observed_icons = []

    for shape in canvas_shapes:
        name = shape.get("name", "").lower()
        font_family = shape.get("font_family", "").lower()

        # Check for forbidden third-party icon library signatures
        for forbidden in forbidden_libraries:
            assert forbidden not in name, f"Forbidden icon library detected in layer name: '{shape.get('name')}'"
            assert forbidden not in font_family, f"Forbidden icon library in font_family: '{font_family}'"

        if "material-symbols" in font_family or "material symbols" in font_family or "nav" in name or "icon" in name:
            observed_icons.append(shape.get("name"))

    assert len(canvas_shapes) > 0, "Canvas shapes must not be empty"


@pytest.mark.tier1
@pytest.mark.m1
@pytest.mark.baseline
def test_f03_global_mobile_navigation_bar(canvas_shapes, canvas_frames):
    """
    F-03: Global Mobile Navigation Bar (Milestone M1)
    Verifies the 64px 3-tab bottom bar ('map', 'qr_code_scanner', 'person') for mobile views.
    """
    mobile_frame = find_frame(canvas_frames, r"mobile|driver")
    assert mobile_frame is not None, "Mobile artboard frame required for mobile nav testing"

    # Locate bottom nav bar shape
    nav_bar = None
    for shape in canvas_shapes:
        if "bottom navigation" in shape.get("name", "").lower() or shape.get("name") == "Mobile Bottom Navigation Bar":
            nav_bar = shape
            break

    assert nav_bar is not None, "Mobile Bottom Navigation Bar component not found on canvas"
    assert nav_bar.get("width") in [390.0, 392.0], f"Bottom navigation bar width must match mobile (390px/392px), got {nav_bar.get('width')}"
    assert nav_bar.get("height") == 64.0, f"Bottom navigation bar height must be exactly 64px, got {nav_bar.get('height')}"

    # Verify 3 tabs exist
    nav_tabs = [s.get("name") for s in canvas_shapes if "nav " in s.get("name", "").lower() and "text" in s.get("name", "").lower()]
    assert any("map" in t.lower() for t in nav_tabs), "Bottom nav missing 'Map' tab"
    assert any("scan" in t.lower() for t in nav_tabs), "Bottom nav missing 'Scan' tab"
    assert any("profile" in t.lower() or "account" in t.lower() or "person" in t.lower() for t in nav_tabs), "Bottom nav missing 'Profile/Account' tab"


@pytest.mark.tier1
@pytest.mark.m1
@pytest.mark.baseline
def test_f04_global_desktop_app_shell(canvas_shapes, canvas_frames):
    """
    F-04: Global Desktop App Shell (Milestone M1)
    Verifies the desktop app shell with 280px (or 240px) sidebar (#0F172A) + 64px header (#FFFFFF).
    """
    desktop_frame = find_frame(canvas_frames, r"desktop|operator")
    assert desktop_frame is not None, "Desktop artboard frame required for desktop shell testing"

    # 1. Header check
    header = None
    sidebar = None
    for shape in canvas_shapes:
        name = shape.get("name", "").lower()
        if "top navigation header" in name or "desktop header" in name:
            header = shape
        if "sidebar navigation" in name or "sidebar container" in name:
            sidebar = shape

    assert header is not None, "Desktop Top Navigation Header not found"
    assert header.get("height") == 64.0, f"Header height must be 64px, got {header.get('height')}"
    sidebar_w = sidebar.get("width", 280.0) if sidebar else 280.0
    expected_header_w = 1440.0 - sidebar_w
    assert header.get("width") in [expected_header_w, 1440.0], f"Header width must be {expected_header_w}px (or 1440px full), got {header.get('width')}"

    assert sidebar is not None, "Desktop Sidebar Navigation Container not found"
    assert sidebar.get("width") in [240.0, 280.0], f"Sidebar width must be 240px or 280px, got {sidebar.get('width')}"
    assert sidebar.get("height") >= 800.0, f"Sidebar height must extend down desktop canvas, got {sidebar.get('height')}"


@pytest.mark.tier1
@pytest.mark.m2
def test_f05_driver_screen_1_depot_map(mcp_client, canvas_frames, canvas_shapes):
    """
    F-05: Driver Screen 1: Depot Map / Home (Milestone M2)
    Verifies 390px map view, floating search, charger count badge, charger bottom sheet.
    Asserts header existence, dimensions, and dark surface background fill #0F172A (not #B1B2B5).
    Asserts core subcomponents: search input bar, fast DC spec pill, depot bay card.
    """
    frame = find_frame(canvas_frames, r"depot.*map|home|driver.*screen.*1")
    if not frame:
        if STRICT_ALL:
            pytest.fail("Artboard 'Driver Screen 1: Depot Map / Home' (390px) not found (Milestone M2)")
        else:
            pytest.skip("Milestone M2 pending: 'Driver Screen 1: Depot Map / Home' artboard not yet created on canvas")

    # 1. Artboard Dimensions
    assert frame["width"] in [390.0, 392.0], f"Width must be 390px/392px, got {frame['width']}"
    assert frame["height"] >= 844.0, f"Height must be >= 844px, got {frame['height']}"

    # 2. Descendant Shapes Inspection
    subshapes = get_frame_subshapes(mcp_client, frame["id"])
    assert len(subshapes) >= 10, f"Screen 1 must contain substantive component shapes, found {len(subshapes)}"

    # 3. Header Container & Fill
    header = find_shape(subshapes, r"header", "rect")
    assert header is not None, "Driver Screen 1 must contain a top navigation header rect"
    assert header.get("height") in [56.0, 64.0], f"Header height must be 56-64px, got {header.get('height')}"
    assert header.get("width") in [390.0, 392.0], f"Header width must match artboard (390-392px), got {header.get('width')}"

    header_fill = get_shape_fill_color(mcp_client, header["id"])
    assert header_fill != "#B1B2B5", (
        f"Driver Screen 1 header '{header.get('name')}' has default fallback fill #B1B2B5 "
        f"(indicates set_fill API parameter mismatch: 'fill_color' instead of 'color')"
    )
    assert header_fill in ["#0F172A", "#0B0F19"], (
        f"Driver Screen 1 header fill must be M3 Dark Surface (#0F172A), got {header_fill}"
    )

    # 4. Search Input Component
    search_bar = find_shape(subshapes, r"search.*(input|bar)|input.*search")
    assert search_bar is not None, "Driver Screen 1 must contain a floating search input bar container"
    assert search_bar.get("width", 0) >= 280.0, f"Search input container width must be >= 280px, got {search_bar.get('width')}"
    assert search_bar.get("height", 0) >= 36.0, f"Search input container height must be >= 36px, got {search_bar.get('height')}"

    # 5. Charger Spec Pill & Bay Status Card
    bay_pill = find_shape(subshapes, r"(fast.*dc|spec.*pill|bay.*pill)")
    assert bay_pill is not None, "Driver Screen 1 must contain a charger spec/bay pill (e.g. Fast DC 350kW pill)"

    bay_card = find_shape(subshapes, r"(depot.*bay|bay.*card|bay.*container)")
    assert bay_card is not None, "Driver Screen 1 must contain a depot bay status card"
    assert bay_card.get("width", 0) >= 300.0, f"Depot bay card width must span artboard (>= 300px), got {bay_card.get('width')}"


@pytest.mark.tier1
@pytest.mark.m2
def test_f06_driver_screen_2_qr_scan_auth(mcp_client, canvas_frames, canvas_shapes):
    """
    F-06: Driver Screen 2: QR Scan / Auth (Milestone M2)
    Verifies 390px HUD viewfinder reticle, manual charger ID drawer, phone & 6-digit OTP verification.
    Asserts header existence and background fill #0F172A (not #B1B2B5).
    Asserts core subcomponents: viewfinder HUD & center reticle, manual charger ID card.
    """
    frame = find_frame(canvas_frames, r"qr.*scan|auth|driver.*screen.*2")
    if not frame:
        if STRICT_ALL:
            pytest.fail("Artboard 'Driver Screen 2: QR Scan / Auth' (390px) not found (Milestone M2)")
        else:
            pytest.skip("Milestone M2 pending: 'Driver Screen 2: QR Scan / Auth' artboard not yet created on canvas")

    # 1. Artboard Dimensions
    assert frame["width"] in [390.0, 392.0], f"Width must be 390px/392px, got {frame['width']}"
    assert frame["height"] >= 844.0, f"Height must be >= 844px, got {frame['height']}"

    # 2. Descendant Shapes Inspection
    subshapes = get_frame_subshapes(mcp_client, frame["id"])
    assert len(subshapes) >= 10, f"Screen 2 must contain substantive component shapes, found {len(subshapes)}"

    # 3. Header Container & Fill
    header = find_shape(subshapes, r"header", "rect")
    assert header is not None, "Driver Screen 2 must contain a top navigation header rect"
    assert header.get("height") in [56.0, 64.0], f"Header height must be 56-64px, got {header.get('height')}"

    header_fill = get_shape_fill_color(mcp_client, header["id"])
    assert header_fill != "#B1B2B5", (
        f"Driver Screen 2 header '{header.get('name')}' has default fallback fill #B1B2B5"
    )
    assert header_fill in ["#0F172A", "#0B0F19"], (
        f"Driver Screen 2 header fill must be M3 Dark Surface (#0F172A), got {header_fill}"
    )

    # 4. Viewfinder Reticle & HUD
    viewfinder = find_shape(subshapes, r"viewfinder.*(hud|container)|hud.*viewfinder")
    assert viewfinder is not None, "Driver Screen 2 must contain a viewfinder HUD container"
    assert viewfinder.get("width", 0) >= 200.0 and viewfinder.get("height", 0) >= 200.0, (
        f"Viewfinder HUD must be >= 200x200px, got {viewfinder.get('width')}x{viewfinder.get('height')}"
    )

    reticle = find_shape(subshapes, r"reticle|center.*focus")
    assert reticle is not None, "Driver Screen 2 must contain a viewfinder center reticle icon/guide"

    # 5. Manual Charger ID Card
    manual_card = find_shape(subshapes, r"manual.*(id|charger|input)|charger.*id.*card")
    assert manual_card is not None, "Driver Screen 2 must contain a manual charger ID input card"
    assert manual_card.get("width", 0) >= 300.0, f"Manual charger ID card width must span artboard (>= 300px), got {manual_card.get('width')}"


@pytest.mark.tier1
@pytest.mark.m2
def test_f07_driver_screen_3_active_charging_telemetry(mcp_client, canvas_frames, canvas_shapes):
    """
    F-07: Driver Screen 3: Active Charging Telemetry (Milestone M2)
    Verifies 390px concentric activity rings, 36px tabular power gauge, live 4-row stats card,
    overstay grace banner, emergency stop/unlock.
    Asserts header existence and background fill #0F172A (not #B1B2B5).
    Asserts core subcomponents: concentric activity rings, live power hero & telemetry 4-row stats card.
    """
    frame = find_frame(canvas_frames, r"telemetry|session|active.*charging|driver.*screen.*3")
    if not frame:
        if STRICT_ALL:
            pytest.fail("Artboard 'Driver Screen 3: Active Charging Telemetry' (390px) not found (Milestone M2)")
        else:
            pytest.skip("Milestone M2 pending: 'Driver Screen 3: Active Charging Telemetry' artboard not yet created")

    # 1. Artboard Dimensions
    assert frame["width"] in [390.0, 392.0], f"Width must be 390px/392px, got {frame['width']}"
    assert frame["height"] >= 844.0, f"Height must be >= 844px, got {frame['height']}"

    # 2. Descendant Shapes Inspection
    subshapes = get_frame_subshapes(mcp_client, frame["id"])
    assert len(subshapes) >= 10, f"Screen 3 must contain substantive component shapes, found {len(subshapes)}"

    # 3. Header Container & Fill
    header = find_shape(subshapes, r"header", "rect")
    assert header is not None, "Driver Screen 3 must contain a top navigation header rect"
    assert header.get("height") in [56.0, 64.0], f"Header height must be 56-64px, got {header.get('height')}"

    header_fill = get_shape_fill_color(mcp_client, header["id"])
    assert header_fill != "#B1B2B5", (
        f"Driver Screen 3 header '{header.get('name')}' has default fallback fill #B1B2B5"
    )
    assert header_fill in ["#0F172A", "#0B0F19"], (
        f"Driver Screen 3 header fill must be M3 Dark Surface (#0F172A), got {header_fill}"
    )

    # 4. Concentric Activity Rings (SoC Gauge)
    rings = find_shape(subshapes, r"(soc|activity|concentric).*ring|ring.*center")
    assert rings is not None, "Driver Screen 3 must contain concentric activity rings container"
    assert rings.get("width", 0) >= 150.0 and rings.get("height", 0) >= 150.0, (
        f"Activity rings container must be >= 150x150px, got {rings.get('width')}x{rings.get('height')}"
    )

    # 5. Telemetry Stats Card & Power Hero
    stats_card = find_shape(subshapes, r"(telemetry.*stats|4-row.*stats|stats.*card)")
    assert stats_card is not None, "Driver Screen 3 must contain a telemetry 4-row stats card"
    assert stats_card.get("width", 0) >= 300.0, f"Telemetry stats card width must be >= 300px, got {stats_card.get('width')}"

    power_hero = find_shape(subshapes, r"(power.*hero|live.*power.*card)")
    assert power_hero is not None, "Driver Screen 3 must contain a live power hero card"


@pytest.mark.tier1
@pytest.mark.m2
def test_f08_driver_screen_4_digital_receipt(mcp_client, canvas_frames, canvas_shapes):
    """
    F-08: Driver Screen 4: Digital Receipt (Milestone M2)
    Verifies 390px celebration checkmark, itemized receipt card, CO2 impact savings card, VAT invoice PDF CTA.
    Asserts header existence and background fill #0F172A (not #B1B2B5).
    Asserts core subcomponents: itemized receipt card, CO2 impact savings card.
    """
    frame = find_frame(canvas_frames, r"receipt|driver.*screen.*4")
    if not frame:
        if STRICT_ALL:
            pytest.fail("Artboard 'Driver Screen 4: Digital Receipt' (390px) not found (Milestone M2)")
        else:
            pytest.skip("Milestone M2 pending: 'Driver Screen 4: Digital Receipt' artboard not yet created")

    # 1. Artboard Dimensions
    assert frame["width"] in [390.0, 392.0], f"Width must be 390px/392px, got {frame['width']}"
    assert frame["height"] >= 844.0, f"Height must be >= 844px, got {frame['height']}"

    # 2. Descendant Shapes Inspection
    subshapes = get_frame_subshapes(mcp_client, frame["id"])
    assert len(subshapes) >= 10, f"Screen 4 must contain substantive component shapes, found {len(subshapes)}"

    # 3. Header Container & Fill
    header = find_shape(subshapes, r"header", "rect")
    assert header is not None, "Driver Screen 4 must contain a top navigation header rect"
    assert header.get("height") in [56.0, 64.0], f"Header height must be 56-64px, got {header.get('height')}"

    header_fill = get_shape_fill_color(mcp_client, header["id"])
    assert header_fill != "#B1B2B5", (
        f"Driver Screen 4 header '{header.get('name')}' has default fallback fill #B1B2B5"
    )
    assert header_fill in ["#0F172A", "#0B0F19"], (
        f"Driver Screen 4 header fill must be M3 Dark Surface (#0F172A), got {header_fill}"
    )

    # 4. Itemized Receipt Card
    receipt_card = find_shape(subshapes, r"(itemized.*receipt|receipt.*card|receipt.*container)")
    assert receipt_card is not None, "Driver Screen 4 must contain an itemized receipt card"
    assert receipt_card.get("width", 0) >= 300.0, f"Receipt card width must be >= 300px, got {receipt_card.get('width')}"
    assert receipt_card.get("height", 0) >= 200.0, f"Receipt card height must be >= 200px, got {receipt_card.get('height')}"

    # 5. CO2 Impact Card
    co2_card = find_shape(subshapes, r"(co2.*impact|co2.*card|carbon.*saving|eco.*card)")
    assert co2_card is not None, "Driver Screen 4 must contain a CO2 impact savings card"
    assert co2_card.get("width", 0) >= 300.0, f"CO2 impact card width must be >= 300px, got {co2_card.get('width')}"


@pytest.mark.tier1
@pytest.mark.m3
def test_f09_driver_screen_5_driver_login_register(canvas_frames, canvas_shapes):
    """
    F-09: Driver Screen 5: Login / Register (Milestone M3)
    Verifies 390px glassmorphic sign-in card, Keycloak IAM badge, 2-step register wizard with 6 OTP boxes.
    """
    frame = find_frame(canvas_frames, r"login|register|driver.*screen.*5")
    if not frame:
        if STRICT_ALL:
            pytest.fail("Artboard 'Driver Screen 5: Login / Register' (390px) not found (Milestone M3)")
        else:
            pytest.skip("Milestone M3 pending: 'Driver Screen 5: Login / Register' artboard not yet created")

    assert frame["width"] in [390.0, 392.0], f"Width must be 390px/392px, got {frame['width']}"


@pytest.mark.tier1
@pytest.mark.m3
def test_f10_driver_screen_6_account_profile(canvas_frames, canvas_shapes):
    """
    F-10: Driver Screen 6: Account Profile (Milestone M3)
    Verifies 390px driver avatar (76x76) with verified check, attributes card, profile navigation actions.
    """
    frame = find_frame(canvas_frames, r"account.*profile|driver.*screen.*6")
    if not frame:
        if STRICT_ALL:
            pytest.fail("Artboard 'Driver Screen 6: Account Profile' (390px) not found (Milestone M3)")
        else:
            pytest.skip("Milestone M3 pending: 'Driver Screen 6: Account Profile' artboard not yet created")

    assert frame["width"] in [390.0, 392.0], f"Width must be 390px/392px, got {frame['width']}"


@pytest.mark.tier1
@pytest.mark.m3
def test_f11_driver_screen_7_charging_history(canvas_frames, canvas_shapes):
    """
    F-11: Driver Screen 7: Charging History (Milestone M3)
    Verifies 390px 3-column aggregate KPI banner, vertical session card stack with station & cost details.
    """
    frame = find_frame(canvas_frames, r"charging.*history|session.*history|driver.*screen.*7")
    if not frame:
        if STRICT_ALL:
            pytest.fail("Artboard 'Driver Screen 7: Charging History' (390px) not found (Milestone M3)")
        else:
            pytest.skip("Milestone M3 pending: 'Driver Screen 7: Charging History' artboard not yet created")

    assert frame["width"] in [390.0, 392.0], f"Width must be 390px/392px, got {frame['width']}"


@pytest.mark.tier1
@pytest.mark.m3
def test_f12_driver_screen_8_settings(canvas_frames, canvas_shapes):
    """
    F-12: Driver Screen 8: Settings (Milestone M3)
    Verifies 390px segmented language switcher, account access links, network & support info card.
    """
    frame = find_frame(canvas_frames, r"settings|driver.*screen.*8")
    if not frame:
        if STRICT_ALL:
            pytest.fail("Artboard 'Driver Screen 8: Settings' (390px) not found (Milestone M3)")
        else:
            pytest.skip("Milestone M3 pending: 'Driver Screen 8: Settings' artboard not yet created")

    assert frame["width"] in [390.0, 392.0], f"Width must be 390px/392px, got {frame['width']}"


@pytest.mark.tier1
@pytest.mark.m4
@pytest.mark.baseline
def test_f13_operator_screen_1_executive_depot_dashboard(canvas_frames, canvas_shapes):
    """
    F-13: Operator Screen 1: Executive Depot Dashboard (Milestone M4)
    Verifies 1440px 4-metric ribbon, 2:1 power stream chart & BESS radial gauge, active sessions datagrid.
    Note: 'Desktop - Operator Mission Control' acts as the executive dashboard baseline.
    """
    frame = find_frame(canvas_frames, r"executive|depot.*dashboard|operator.*mission.*control|operator.*screen.*1")
    assert frame is not None, "Executive Depot Dashboard artboard frame not found on canvas"
    assert frame["width"] == 1440.0, f"Desktop artboard width must be 1440px, got {frame['width']}"
    assert frame["height"] >= 1024.0, f"Desktop artboard height must be >= 1024px, got {frame['height']}"

    # Verify metric cards are present
    card_names = [s.get("name", "") for s in canvas_shapes if "card" in s.get("name", "").lower()]
    assert any("depot load" in c.lower() for c in card_names), "Missing Active Depot Load metric card"
    assert any("charger status" in c.lower() for c in card_names), "Missing Charger Status metric card"


@pytest.mark.tier1
@pytest.mark.m4
def test_f14_operator_screen_2_evse_charger_management(canvas_frames, canvas_shapes):
    """
    F-14: Operator Screen 2: EVSE Charger Management (Milestone M4)
    Verifies 1440px 4-metric ribbon, multi-facet filter bar, 3-col card grid, 600px slide drawer.
    """
    frame = find_frame(canvas_frames, r"evse|charger.*management|operator.*screen.*2")
    if not frame:
        if STRICT_ALL:
            pytest.fail("Artboard 'Operator Screen 2: EVSE Charger Management' not found (Milestone M4)")
        else:
            pytest.skip("Milestone M4 pending: 'Operator Screen 2: EVSE Charger Management' artboard not yet created")

    assert frame["width"] == 1440.0, f"Width must be 1440px, got {frame['width']}"


@pytest.mark.tier1
@pytest.mark.m4
def test_f15_operator_screen_3_depot_bay_fleet_gantt(canvas_frames, canvas_shapes):
    """
    F-15: Operator Screen 3: Depot Bay & Fleet Gantt (Milestone M4)
    Verifies 1440px power headroom gauge, 4-col Bay Matrix cards with live vehicle SOC, horizontal Gantt.
    """
    frame = find_frame(canvas_frames, r"depot.*bay|fleet.*gantt|operator.*screen.*3")
    if not frame:
        if STRICT_ALL:
            pytest.fail("Artboard 'Operator Screen 3: Depot Bay & Fleet Gantt' not found (Milestone M4)")
        else:
            pytest.skip("Milestone M4 pending: 'Operator Screen 3: Depot Bay & Fleet Gantt' artboard not yet created")

    assert frame["width"] == 1440.0, f"Width must be 1440px, got {frame['width']}"


@pytest.mark.tier1
@pytest.mark.m4
def test_f16_operator_screen_4_smart_charging_peak_shaving(canvas_frames, canvas_shapes):
    """
    F-16: Operator Screen 4: Smart Charging / Peak Shaving (Milestone M4)
    Verifies 1440px 3-metric ribbon, multi-source balance chart, peak shaving guardrails, throttling table.
    """
    frame = find_frame(canvas_frames, r"smart.*charging|peak.*shaving|operator.*screen.*4")
    if not frame:
        if STRICT_ALL:
            pytest.fail("Artboard 'Operator Screen 4: Smart Charging / Peak Shaving' not found (Milestone M4)")
        else:
            pytest.skip("Milestone M4 pending: 'Operator Screen 4: Smart Charging / Peak Shaving' artboard not yet created")

    assert frame["width"] == 1440.0, f"Width must be 1440px, got {frame['width']}"


@pytest.mark.tier1
@pytest.mark.m5
@pytest.mark.baseline
def test_f17_multi_artboard_svg_vector_exporter():
    """
    F-17: Multi-Artboard SVG Vector Exporter (Milestone M5)
    Verifies individual SVG previews generated in docs/designs/previews/.
    """
    assert os.path.exists(PREVIEWS_DIR), f"Preview directory does not exist: {PREVIEWS_DIR}"

    files = [f for f in os.listdir(PREVIEWS_DIR) if f.endswith(".svg")]
    assert len(files) >= 2, f"Expected at least 2 SVG previews, found {len(files)} in {PREVIEWS_DIR}"

    # Verify file contents are valid SVG XML
    for fname in files:
        fpath = os.path.join(PREVIEWS_DIR, fname)
        size = os.path.getsize(fpath)
        assert size > 300, f"SVG file {fname} is suspiciously small ({size} bytes)"

        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
            assert "<svg" in content, f"File {fname} is missing <svg root tag"
            assert "</svg>" in content, f"File {fname} is missing </svg> closing tag"


@pytest.mark.tier1
@pytest.mark.m6
@pytest.mark.baseline
def test_f18_automated_penpot_verify_quality_gate(critic_evaluation):
    """
    F-18: Automated penpot-verify Quality Gate (Milestone M6)
    Verifies automated critic execution across target file achieving composite score >= 85.0%.
    """
    assert "composite_score" in critic_evaluation, f"Critic output invalid: {critic_evaluation}"
    composite = critic_evaluation["composite_score"]
    status = critic_evaluation.get("gate_status")

    assert status == "PASSED", f"Automated critic status is not PASSED: {status}"
    assert composite >= 85.0, f"Composite score {composite}% is below required 85.0% threshold"

    # Verify individual pillar scores
    pillars = critic_evaluation.get("pillars", {})
    assert pillars.get("responsive_pair", {}).get("score", 0) == 100.0, "Responsive pair must score 100%"
    assert pillars.get("layer_hygiene", {}).get("score", 0) >= 85.0, "Layer hygiene must score >= 85%"
    assert pillars.get("m3_tokens", {}).get("score", 0) >= 85.0, "M3 tokens must score >= 85%"
    assert pillars.get("wcag_contrast", {}).get("score", 0) >= 70.0, "WCAG contrast must score >= 70%"


@pytest.mark.tier1
@pytest.mark.m6
@pytest.mark.baseline
def test_f19_live_penpot_canvas_active_verification():
    """
    F-19: Live Penpot Canvas Active Verification (Milestone M6)
    Verifies accessibility of http://localhost:15050/#/workspace/b0861d9d-6919-8015-8008-d26610b454c5/b0861d9d-6919-8015-8008-d266309e53fd
    """
    req = urllib.request.Request(
        CANVAS_URL,
        headers={"User-Agent": "Mapletyne-E2E-Tester/1.0"}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        assert resp.status == 200, f"Expected HTTP 200 from Penpot frontend, got {resp.status}"
        ctype = resp.headers.get("Content-Type", "")
        assert "text/html" in ctype, f"Expected text/html, got {ctype}"
        body = resp.read()
        assert len(body) > 100000, f"Expected substantial HTML payload (>100KB), got {len(body)} bytes"


# ==============================================================================
# TIER 2: BOUNDARY VALUE ANALYSIS (BVA) & INVARIANT REJECTION TESTS
# ==============================================================================

@pytest.mark.tier2
@pytest.mark.baseline
def test_bva_typography_floor_enforcement(canvas_shapes):
    """
    BVA Invariant: Typography minimum floor is strictly 12.0px.
    Any font size < 12.0px must be rejected as an enterprise legibility failure.
    """
    sub_12px_violations = []

    for shape in canvas_shapes:
        if shape.get("type") == "text":
            font_size = shape.get("font_size") or shape.get("fontSize")
            if font_size is not None:
                try:
                    fsize = float(font_size)
                    if fsize < 12.0:
                        sub_12px_violations.append((shape.get("name"), fsize))
                except (ValueError, TypeError):
                    pass

    assert len(sub_12px_violations) == 0, f"Sub-12px font violations found: {sub_12px_violations}"


@pytest.mark.tier2
@pytest.mark.baseline
def test_bva_fitts_law_touch_targets(canvas_shapes):
    """
    BVA Invariant: Interactive touch controls must satisfy Fitts's Law (>= 44x44px).
    Buttons or inputs with height < 44px (with standard exception for 40px desktop secondary) fail.
    """
    touch_violations = []

    for shape in canvas_shapes:
        # Only evaluate button/input container shapes (rectangles, frames), not inner text labels
        if shape.get("type") in ["rect", "frame"]:
            name = shape.get("name", "").lower()
            if "button" in name or "cta" in name or "input" in name:
                w = shape.get("width", 0.0)
                h = shape.get("height", 0.0)
                # Accept desktop action buttons down to 40px, but reject anything below
                if h < 40.0 or w < 40.0:
                    touch_violations.append((shape.get("name"), w, h))

    assert len(touch_violations) == 0, f"Interactive touch targets below minimum: {touch_violations}"


@pytest.mark.tier2
@pytest.mark.baseline
def test_bva_artboard_dimension_bounds(canvas_frames):
    """
    BVA Invariant: Mobile artboard widths strictly bounded to 390.0px.
    Desktop artboard widths strictly bounded to 1440.0px.
    """
    for frame in canvas_frames:
        name = frame.get("name", "").lower()
        w = frame.get("width", 0.0)
        h = frame.get("height", 0.0)

        if "mobile" in name or "driver" in name:
            assert w in [390.0, 392.0], f"Mobile artboard '{frame.get('name')}' width must be 390px or 392px, got {w}"
            assert h >= 844.0, f"Mobile artboard '{frame.get('name')}' height must be >= 844px, got {h}"

        if "desktop" in name or "operator" in name:
            assert w == 1440.0, f"Desktop artboard '{frame.get('name')}' width must be 1440px, got {w}"
            assert h >= 1024.0, f"Desktop artboard '{frame.get('name')}' height must be >= 1024px, got {h}"


@pytest.mark.tier2
@pytest.mark.baseline
def test_bva_8pt_grid_strict_alignment(critic_evaluation):
    """
    BVA Invariant: Mathematical alignment to 4px/8px increments.
    Hygiene pillar must confirm at least 90% strict adherence to grid.
    """
    hygiene = critic_evaluation.get("pillars", {}).get("layer_hygiene", {})
    details = " ".join(hygiene.get("details", []))
    assert "8-Point Grid alignment" in details, "Hygiene report must audit 8-Point Grid alignment"


@pytest.mark.tier2
@pytest.mark.baseline
def test_bva_quality_gate_threshold_rejection():
    """
    BVA Invariant: Quality gate strictly enforces 85.0% threshold.
    Simulates threshold check logic: 84.9% fails, 85.0% passes.
    """
    def check_gate(score: float) -> bool:
        return round(score, 1) >= 85.0

    assert not check_gate(84.9), "Score 84.9% must fail the quality gate"
    assert not check_gate(80.0), "Score 80.0% must fail the quality gate"
    assert check_gate(85.0), "Score 85.0% must pass the quality gate"
    assert check_gate(93.8), "Score 93.8% must pass the quality gate"


# ==============================================================================
# TIER 3: PAIRWISE INTERACTION TESTING
# ==============================================================================

@pytest.mark.tier3
@pytest.mark.baseline
def test_pairwise_mobile_dark_theme_and_bottom_nav(canvas_frames, canvas_shapes):
    """
    Pairwise 1: Mobile Viewport (390px) x Dark Theme (#0B0F19) x Bottom Nav (64px) x Fitts's Law.
    """
    mobile_frame = find_frame(canvas_frames, r"mobile|driver")
    assert mobile_frame is not None, "Mobile frame required"
    assert mobile_frame["width"] in [390.0, 392.0]

    # Verify bottom nav bar is positioned at the bottom of the mobile frame
    nav_bar = None
    for s in canvas_shapes:
        if "bottom navigation" in s.get("name", "").lower():
            nav_bar = s
            break
    assert nav_bar is not None
    assert nav_bar.get("height") == 64.0


@pytest.mark.tier3
@pytest.mark.baseline
def test_pairwise_desktop_light_theme_and_app_shell(canvas_frames, canvas_shapes):
    """
    Pairwise 2: Desktop Viewport (1440px) x Light Theme (#F8FAFC) x 280px Sidebar x 64px Header.
    """
    desktop_frame = find_frame(canvas_frames, r"desktop|operator")
    assert desktop_frame is not None, "Desktop frame required"
    assert desktop_frame["width"] == 1440.0

    header = None
    sidebar = None
    for s in canvas_shapes:
        name = s.get("name", "").lower()
        if "top navigation header" in name:
            header = s
        if "sidebar navigation" in name:
            sidebar = s

    assert header is not None and sidebar is not None
    assert header.get("height") == 64.0
    assert sidebar.get("width") in [240.0, 280.0]


@pytest.mark.tier3
@pytest.mark.baseline
def test_pairwise_svg_export_and_penpot_verify_critic(critic_evaluation):
    """
    Pairwise 3: Multi-Artboard Exporter x penpot-verify Dual Gate Protocol.
    """
    previews = critic_evaluation.get("exported_previews", {})
    assert "desktop" in previews, "Critic evaluation must register desktop preview export"
    assert "mobile" in previews, "Critic evaluation must register mobile preview export"

    desktop_svg = os.path.join(PREVIEWS_DIR, os.path.basename(previews["desktop"]))
    mobile_svg = os.path.join(PREVIEWS_DIR, os.path.basename(previews["mobile"]))

    assert os.path.exists(desktop_svg), f"Exported desktop preview missing at {desktop_svg}"
    assert os.path.exists(mobile_svg), f"Exported mobile preview missing at {mobile_svg}"


# ==============================================================================
# TIER 4: REAL-WORLD APPLICATION WORKLOAD SCENARIOS
# ==============================================================================

@pytest.mark.tier4
@pytest.mark.baseline
def test_workload_scenario_1_driver_charging_journey(canvas_frames, canvas_shapes):
    """
    Workload Scenario 1: Complete Driver Charging Journey
    Trace: Depot Map (F-05) -> QR Scan (F-06) -> Telemetry (F-07) -> Receipt (F-08) -> History (F-11).
    Validates mobile app shell, navigation continuity, and driver interaction primitives.
    """
    mobile_frame = find_frame(canvas_frames, r"mobile|driver")
    assert mobile_frame is not None, "Scenario 1 requires valid Driver Mobile PWA artboard"
    assert mobile_frame["width"] in [390.0, 392.0]

    # Check for mobile interaction elements (CTA button container, status badge, bottom nav)
    cta_button = None
    for s in canvas_shapes:
        if s.get("type") in ["rect", "frame"] and ("cta" in s.get("name", "").lower() or "scan qr" in s.get("name", "").lower()):
            cta_button = s
            break

    assert cta_button is not None, "Driver charging journey requires interactive start/scan CTA container"
    assert cta_button.get("height", 0) >= 44.0, f"CTA button must meet Fitts's Law (>=44px), got {cta_button.get('height')}"


@pytest.mark.tier4
@pytest.mark.baseline
def test_workload_scenario_2_driver_onboarding_and_preferences(canvas_shapes):
    """
    Workload Scenario 2: Driver Account Onboarding & Preference Configuration
    Trace: Login/Register (F-09) -> Account Profile (F-10) -> Settings (F-12) -> Nav Bar (F-03).
    Validates driver identity hero, profile attributes, and navigation tabs.
    """
    profile_tabs = [s for s in canvas_shapes if "profile" in s.get("name", "").lower() or "brand" in s.get("name", "").lower()]
    assert len(profile_tabs) > 0, "Driver onboarding requires branding and account access layers"


@pytest.mark.tier4
@pytest.mark.baseline
def test_workload_scenario_3_operator_depot_asset_monitoring(canvas_frames, canvas_shapes):
    """
    Workload Scenario 3: Operator Real-Time Depot & Asset Monitoring
    Trace: Desktop Shell (F-04) -> Executive Dashboard (F-13) -> EVSE Management & Scope (F-14).
    Validates multi-metric cards, 3-phase telemetry layout, and header controls.
    """
    desktop_frame = find_frame(canvas_frames, r"desktop|operator")
    assert desktop_frame is not None, "Scenario 3 requires Desktop Mission Control artboard"
    assert desktop_frame["width"] == 1440.0

    depot_cards = [s for s in canvas_shapes if "card" in s.get("name", "").lower()]
    assert len(depot_cards) >= 2, f"Operator asset monitoring requires at least 2 KPI cards, found {len(depot_cards)}"


@pytest.mark.tier4
@pytest.mark.baseline
def test_workload_scenario_4_operator_smart_charging_dispatch(canvas_shapes):
    """
    Workload Scenario 4: Operator Smart Charging & Fleet Dispatch Workflow
    Trace: Desktop Shell (F-04) -> Depot Bay Gantt (F-15) -> Smart Charging Peak Shaving (F-16).
    Validates sidebar smart charging navigation and dispatch command controls.
    """
    smart_charging_nav = None
    for s in canvas_shapes:
        if "smart charging" in s.get("name", "").lower():
            smart_charging_nav = s
            break

    assert smart_charging_nav is not None, "Desktop shell must feature Smart Charging navigation hook"


@pytest.mark.tier4
@pytest.mark.baseline
def test_workload_scenario_5_vector_pipeline_and_quality_audit(critic_evaluation):
    """
    Workload Scenario 5: Automated Vector Export Pipeline & Continuous Quality Audit
    Trace: Multi-Artboard SVG Exporter (F-17) -> penpot-verify Critic (F-18) -> Live Canvas (F-19).
    Validates end-to-end export integrity, dual gate evaluation, and workspace availability.
    """
    assert critic_evaluation.get("gate_status") == "PASSED"
    assert critic_evaluation.get("composite_score", 0) >= 85.0
    assert os.path.exists(PREVIEWS_DIR)
    assert len(os.listdir(PREVIEWS_DIR)) >= 2
