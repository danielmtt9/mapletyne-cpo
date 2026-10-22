#!/usr/bin/env python3
"""
Empirical Verification & Stress Test Harness for Milestone 2:
Screens 1 to 4 on Penpot Canvas b0861d9d-6919-8015-8008-d266309e53fd.

Investigates:
1. Strict 4px and 8px mathematical grid conjunction on ALL shapes across Screens 1-4.
2. Bounding box collisions among navigation icons, labels, and buttons.
3. Icon typography: font family strictly "Material Symbols Outlined", font size 24, bounds 24x24.
4. Touch target sizes: interactive controls >= 44x44px.
5. Typography floor: all text layers >= 12px font size.
"""

import sys
import os
import json
import re
from typing import Dict, Any, List, Tuple

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from tests.e2e.conftest import PenpotMCPTestClient, FILE_ID, PAGE_ID

def run_empirical_challenger_analysis():
    client = PenpotMCPTestClient()
    
    # 1. Fetch frames
    frames = client.get_frames(FILE_ID, PAGE_ID)
    frame_map = {f['id']: f for f in frames}
    
    # Identify Screens 1-4
    m2_frames = {}
    for fid, f in frame_map.items():
        name = f.get("name", "")
        if "Mobile - Driver 01" in name or "Depot Map" in name:
            m2_frames["Screen 1 (Depot Map)"] = f
        elif "Mobile - Driver 02" in name or "QR Scan" in name:
            m2_frames["Screen 2 (QR Scan)"] = f
        elif "Mobile - Driver 03" in name or "Telemetry" in name:
            m2_frames["Screen 3 (Telemetry)"] = f
        elif "Mobile - Driver 04" in name or "Receipt" in name:
            m2_frames["Screen 4 (Receipt)"] = f

    print("=" * 80)
    print("EMPIRICAL CHALLENGER VERIFICATION REPORT — MILESTONE 2")
    print("=" * 80)
    print(f"Target File: {FILE_ID}")
    print(f"Target Page: {PAGE_ID}")
    print(f"M2 Frames detected: {len(m2_frames)}")
    for sname, f in m2_frames.items():
        print(f"  {sname}: ID={f['id']}, Bounds=(x={f['x']}, y={f['y']}, w={f['width']}, h={f['height']})")

    # 2. Fetch all shapes
    all_shapes = client.get_all_shapes(FILE_ID, PAGE_ID)
    print(f"\nTotal shapes on page: {len(all_shapes)}")

    # Group shapes by frame using get_shape_details
    m2_shapes_by_screen: Dict[str, List[Tuple[Dict[str, Any], Dict[str, Any]]]] = {k: [] for k in m2_frames}
    frame_id_to_sname = {f['id']: k for k, f in m2_frames.items()}
    
    for s in all_shapes:
        sid = s.get("id")
        if sid == "00000000-0000-0000-0000-000000000000":
            continue
        det = client.call_tool("get_shape_details", {"file_id": FILE_ID, "page_id": PAGE_ID, "shape_id": sid})
        if not det:
            continue
        fid = det.get("frame_id")
        if fid in frame_id_to_sname:
            sname = frame_id_to_sname[fid]
            m2_shapes_by_screen[sname].append((s, det))

    total_m2_shapes = sum(len(v) for v in m2_shapes_by_screen.values())
    print(f"Total shapes in Screens 1-4: {total_m2_shapes}")
    for sname, s_list in m2_shapes_by_screen.items():
        print(f"  {sname}: {len(s_list)} shapes")

    # =========================================================================
    # CHECK 1: Strict 4px and 8px Mathematical Grid Conjunction
    # =========================================================================
    print("\n" + "=" * 80)
    print("CHECK 1: STRICT 4PX & 8PX MATHEMATICAL GRID EVALUATION")
    print("=" * 80)

    is_mult_4 = lambda v: abs(v - round(v)) < 0.01 and (round(v) % 4 == 0)
    is_mult_8 = lambda v: abs(v - round(v)) < 0.01 and (round(v) % 8 == 0)

    # Frame level grid check
    for sname, f in m2_frames.items():
        fx, fy, fw, fh = f["x"], f["y"], f["width"], f["height"]
        print(f"Frame {sname}: x={fx} (mod4={fx%4==0}, mod8={fx%8==0}), y={fy} (mod4={fy%4==0}, mod8={fy%8==0}), w={fw} (mod4={fw%4==0}, mod8={fw%8==0}), h={fh} (mod4={fh%4==0}, mod8={fh%8==0})")

    # Shape level grid check:
    # We inspect:
    # a) Structural containers (rects, frames)
    # b) Text elements (x, y positions; and we note their width, height)
    # c) Icon elements
    containers_checked = 0
    containers_off_grid_4 = []
    containers_off_grid_8 = []

    texts_checked = 0
    texts_pos_off_grid_4 = []
    texts_pos_off_grid_8 = []
    texts_dim_non_int = []

    for sname, s_list in m2_shapes_by_screen.items():
        for s, det in s_list:
            stype = s.get("type")
            name = s.get("name", "Unnamed")
            x = float(s.get("x", 0))
            y = float(s.get("y", 0))
            w = float(s.get("width", 0))
            h = float(s.get("height", 0))

            if stype in ["rect", "frame"]:
                containers_checked += 1
                pos_4 = is_mult_4(x) and is_mult_4(y)
                dim_4 = is_mult_4(w) and is_mult_4(h)
                pos_8 = is_mult_8(x) and is_mult_8(y)
                dim_8 = is_mult_8(w) and is_mult_8(h)

                if not (pos_4 and dim_4):
                    containers_off_grid_4.append({
                        "screen": sname, "name": name, "id": s["id"], "type": stype,
                        "x": x, "y": y, "w": w, "h": h,
                        "reason": f"x%4={x%4}, y%4={y%4}, w%4={w%4}, h%4={h%4}"
                    })
                if not (pos_8 and dim_8):
                    containers_off_grid_8.append({
                        "screen": sname, "name": name, "id": s["id"],
                        "x": x, "y": y, "w": w, "h": h,
                        "reason": f"x%8={x%8}, y%8={y%8}, w%8={w%8}, h%8={h%8}"
                    })
            else:
                texts_checked += 1
                pos_4 = is_mult_4(x) and is_mult_4(y)
                pos_8 = is_mult_8(x) and is_mult_8(y)
                if not pos_4:
                    texts_pos_off_grid_4.append({
                        "screen": sname, "name": name, "id": s["id"], "type": stype,
                        "x": x, "y": y, "w": w, "h": h,
                        "reason": f"x%4={x%4}, y%4={y%4}"
                    })
                if not pos_8:
                    texts_pos_off_grid_8.append({
                        "screen": sname, "name": name, "id": s["id"],
                        "x": x, "y": y, "reason": f"x%8={x%8}, y%8={y%8}"
                    })
                # Check if dimensions are fractional
                if abs(w - round(w)) >= 0.01 or abs(h - round(h)) >= 0.01:
                    texts_dim_non_int.append({
                        "screen": sname, "name": name, "id": s["id"], "type": stype,
                        "w": w, "h": h
                    })

    print(f"\nContainers (rect/frame) evaluated: {containers_checked}")
    print(f"Containers off 4px grid: {len(containers_off_grid_4)}")
    for c in containers_off_grid_4:
        print(f"  [4px VIOLATION] {c['screen']} -> '{c['name']}': x={c['x']}, y={c['y']}, w={c['w']}, h={c['h']} ({c['reason']})")
    print(f"Containers off 8px grid: {len(containers_off_grid_8)}")
    for c in containers_off_grid_8[:10]:
        print(f"  [8px note] {c['screen']} -> '{c['name']}': x={c['x']}, y={c['y']}, w={c['w']}, h={c['h']} ({c['reason']})")
    if len(containers_off_grid_8) > 10:
        print(f"  ... and {len(containers_off_grid_8)-10} more containers on 4px grid but not 8px.")

    print(f"\nNon-container elements (text/icon/path) evaluated: {texts_checked}")
    print(f"Elements with off-grid (4px) position: {len(texts_pos_off_grid_4)}")
    for t in texts_pos_off_grid_4:
        print(f"  [4px VIOLATION] {t['screen']} -> '{t['name']}': x={t['x']}, y={t['y']} ({t['reason']})")

    print(f"Elements with fractional bounding dimensions (auto text layout): {len(texts_dim_non_int)}")

    # =========================================================================
    # CHECK 2: Bounding Box Collisions
    # =========================================================================
    print("\n" + "=" * 80)
    print("CHECK 2: BOUNDING BOX COLLISIONS (NAVIGATION & BUTTONS)")
    print("=" * 80)

    # Within each screen, check pairwise collisions:
    # 1. Navigation items (Bottom nav icons vs Bottom nav labels)
    # 2. Interactive buttons vs other buttons/interactive elements
    # 3. Text vs Text collisions
    total_nav_collisions = 0
    total_button_collisions = 0
    all_collisions = []

    for sname, s_list in m2_shapes_by_screen.items():
        print(f"\nCollisions check for {sname}:")
        # Navigation items
        nav_shapes = [s for s, _ in s_list if "nav" in s.get("name", "").lower() or "tab" in s.get("name", "").lower()]
        print(f"  Nav shapes found: {len(nav_shapes)}")
        
        # Check pairwise
        n = len(s_list)
        screen_collisions = []
        for i in range(n):
            s1, d1 = s_list[i]
            n1 = s1.get("name", "")
            t1 = s1.get("type", "")
            # Skip background canvas rects
            if "canvas" in n1.lower() or "background" in n1.lower() or s1.get("width", 0) >= 390:
                continue
            x1, y1, w1, h1 = float(s1.get("x", 0)), float(s1.get("y", 0)), float(s1.get("width", 0)), float(s1.get("height", 0))

            for j in range(i + 1, n):
                s2, d2 = s_list[j]
                n2 = s2.get("name", "")
                t2 = s2.get("type", "")
                if "canvas" in n2.lower() or "background" in n2.lower() or s2.get("width", 0) >= 390:
                    continue
                # If one is a container rect and the other is a child inside it (e.g. button rect containing button text), that is containment, not collision
                # Check containment:
                x2, y2, w2, h2 = float(s2.get("x", 0)), float(s2.get("y", 0)), float(s2.get("width", 0)), float(s2.get("height", 0))

                # Check 2D bounding box intersection
                x_overlap = max(0.0, min(x1 + w1, x2 + w2) - max(x1, x2))
                y_overlap = max(0.0, min(y1 + h1, y2 + h2) - max(y1, y2))

                if x_overlap > 0.05 and y_overlap > 0.05:
                    # Is this expected containment?
                    # E.g. card container containing text, or button container containing button text
                    is_s1_container_of_s2 = (x1 <= x2 and y1 <= y2 and x1 + w1 >= x2 + w2 and y1 + h1 >= y2 + h2)
                    is_s2_container_of_s1 = (x2 <= x1 and y2 <= y1 and x2 + w2 >= x1 + w1 and y2 + h2 >= y1 + h1)
                    
                    if is_s1_container_of_s2 or is_s2_container_of_s1:
                        # Legitimate visual container hierarchy (e.g. card, button, badge)
                        pass
                    else:
                        # Partial overlap / collision
                        screen_collisions.append({
                            "screen": sname,
                            "shape1": f"'{n1}' ({t1}) [{x1},{y1},{w1},{h1}]",
                            "shape2": f"'{n2}' ({t2}) [{x2},{y2},{w2},{h2}]",
                            "overlap": f"{x_overlap:.1f}x{y_overlap:.1f}px"
                        })

        print(f"  Unintended collisions detected: {len(screen_collisions)}")
        for col in screen_collisions:
            print(f"    ⚠ Collision: {col['shape1']} intersects {col['shape2']} by {col['overlap']}")
            all_collisions.append(col)

    # =========================================================================
    # CHECK 3: Icon Typography, Family, Size, and Bounding Box (24x24)
    # =========================================================================
    print("\n" + "=" * 80)
    print("CHECK 3: ICON TYPOGRAPHY & BOUNDS VERIFICATION")
    print("=" * 80)

    icon_shapes = []
    icon_violations = []

    for sname, s_list in m2_shapes_by_screen.items():
        for s, det in s_list:
            name = s.get("name", "")
            stype = s.get("type", "")
            if "icon" in name.lower() or "reticle" in name.lower():
                w = float(s.get("width", 0))
                h = float(s.get("height", 0))
                
                # Extract font info from content if text shape
                font_family = None
                font_size = None
                glyph_text = None
                
                content = det.get("content", {})
                def extract_font_info(c_node):
                    nonlocal font_family, font_size, glyph_text
                    if isinstance(c_node, dict):
                        if "font-family" in c_node:
                            font_family = c_node["font-family"]
                        if "font-size" in c_node:
                            font_size = c_node["font-size"]
                        if "text" in c_node:
                            glyph_text = c_node["text"]
                        for v in c_node.values():
                            extract_font_info(v)
                    elif isinstance(c_node, list):
                        for item in c_node:
                            extract_font_info(item)

                extract_font_info(content)

                icon_info = {
                    "screen": sname,
                    "name": name,
                    "id": s["id"],
                    "type": stype,
                    "width": w,
                    "height": h,
                    "font_family": font_family,
                    "font_size": font_size,
                    "text": glyph_text
                }
                icon_shapes.append(icon_info)

                # Verification rules:
                # 1. font_family must be "Material Symbols Outlined" (case-insensitive, or slug)
                # 2. font_size must be 24 (or float(24))
                # 3. width == 24 and height == 24
                violations = []
                if stype == "text":
                    if not font_family or "material" not in font_family.lower():
                        violations.append(f"font-family='{font_family}' != 'Material Symbols Outlined'")
                    try:
                        fs = float(font_size) if font_size else 0
                        if fs != 24.0:
                            violations.append(f"font-size={font_size} != 24")
                    except Exception:
                        violations.append(f"font-size='{font_size}' invalid")
                
                if w != 24.0 or h != 24.0:
                    violations.append(f"bounds {w}x{h} != 24x24")

                if violations:
                    icon_violations.append({**icon_info, "violations": violations})

    print(f"Total icon shapes across Screens 1-4: {len(icon_shapes)}")
    print(f"Icon violations found: {len(icon_violations)}")
    for v in icon_violations:
        print(f"  ⚠ {v['screen']} -> '{v['name']}': {', '.join(v['violations'])} (bounds={v['width']}x{v['height']}, font={v['font_family']}, size={v['font_size']}, glyph='{v['text']}')")

    # =========================================================================
    # CHECK 4: Touch Target Sizes (>= 44x44px)
    # =========================================================================
    print("\n" + "=" * 80)
    print("CHECK 4: TOUCH TARGET SIZES (FITTS'S LAW >= 44x44PX)")
    print("=" * 80)

    # Identify all interactive controls:
    # Buttons, CTAs, bottom nav items, toggle buttons, inputs
    touch_controls = []
    touch_violations = []

    for sname, s_list in m2_shapes_by_screen.items():
        for s, det in s_list:
            name = s.get("name", "")
            stype = s.get("type", "")
            w = float(s.get("width", 0))
            h = float(s.get("height", 0))

            is_interactive = any(term in name.lower() for term in [
                "btn", "button", "cta", "touch target", "nav tab", "bottom nav item", "tab -"
            ])
            # Rect containers named button/cta/tab
            if is_interactive and stype in ["rect", "frame"]:
                touch_controls.append({
                    "screen": sname,
                    "name": name,
                    "id": s["id"],
                    "width": w,
                    "height": h
                })
                # Check Fitts's Law >= 44x44px
                # Note: Full-width mobile buttons typically 344x48 or 344x52 (width >= 44, height >= 44)
                # Bottom nav items: typically 64x64 or 44x44
                if w < 44.0 or h < 44.0:
                    touch_violations.append({
                        "screen": sname,
                        "name": name,
                        "id": s["id"],
                        "width": w,
                        "height": h,
                        "violation": f"Dimensions {w}x{h} are less than 44x44px"
                    })

    print(f"Interactive touch targets identified: {len(touch_controls)}")
    for tc in touch_controls:
        status = "✓ PASS" if tc["width"] >= 44.0 and tc["height"] >= 44.0 else "✗ FAIL"
        print(f"  {status}: {tc['screen']} -> '{tc['name']}' ({tc['width']}x{tc['height']}px)")

    print(f"\nTouch target violations (< 44x44px): {len(touch_violations)}")
    for tv in touch_violations:
        print(f"  ⚠ {tv['screen']} -> '{tv['name']}': {tv['violation']}")

    # =========================================================================
    # CHECK 5: Typography Floor (>= 12px)
    # =========================================================================
    print("\n" + "=" * 80)
    print("CHECK 5: TYPOGRAPHY FLOOR ENFORCEMENT (>= 12PX)")
    print("=" * 80)

    total_texts = 0
    typography_violations = []
    font_size_distribution = {}

    for sname, s_list in m2_shapes_by_screen.items():
        for s, det in s_list:
            stype = s.get("type", "")
            name = s.get("name", "")
            if stype != "text":
                continue
            total_texts += 1
            content = det.get("content", {})
            font_size = None
            text_str = ""

            def extract_text_info(c_node):
                nonlocal font_size, text_str
                if isinstance(c_node, dict):
                    if "font-size" in c_node and font_size is None:
                        font_size = c_node["font-size"]
                    if "text" in c_node:
                        text_str += c_node["text"] + " "
                    for v in c_node.values():
                        extract_text_info(v)
                elif isinstance(c_node, list):
                    for item in c_node:
                        extract_text_info(item)

            extract_text_info(content)
            
            try:
                fs = float(font_size) if font_size else 0.0
            except Exception:
                fs = 0.0

            font_size_distribution[fs] = font_size_distribution.get(fs, 0) + 1

            if fs < 12.0:
                typography_violations.append({
                    "screen": sname,
                    "name": name,
                    "id": s["id"],
                    "font_size": fs,
                    "text": text_str.strip()
                })

    print(f"Total text shapes evaluated: {total_texts}")
    print(f"Font size distribution:")
    for fs in sorted(font_size_distribution.keys()):
        print(f"  {fs}px: {font_size_distribution[fs]} occurrences")

    print(f"\nTypography floor violations (< 12px): {len(typography_violations)}")
    for tv in typography_violations:
        print(f"  ⚠ {tv['screen']} -> '{tv['name']}': font_size={tv['font_size']}px (text='{tv['text']}')")

    # =========================================================================
    # SUMMARY
    # =========================================================================
    print("\n" + "=" * 80)
    print("CHALLENGER VERIFICATION SUMMARY")
    print("=" * 80)
    print(f"1. Off-grid containers (4px): {len(containers_off_grid_4)}")
    print(f"2. Off-grid element positions (4px): {len(texts_pos_off_grid_4)}")
    print(f"3. Bounding box collisions: {len(all_collisions)}")
    print(f"4. Icon typography/bounds violations: {len(icon_violations)}")
    print(f"5. Touch target violations (< 44px): {len(touch_violations)}")
    print(f"6. Typography floor violations (< 12px): {len(typography_violations)}")

if __name__ == "__main__":
    run_empirical_challenger_analysis()
