"""
tests/test_uiux_scanners.py
Unit and Integration Tests for Programmatic UI/UX Audit Scanners & Contrast Calculator.
"""

import math
import pytest
import tempfile
import os

from tools.calculate_contrast import (
    hex_to_rgb,
    srgb_channel_to_linear,
    relative_luminance,
    calculate_contrast_ratio,
    evaluate_wcag,
)

from tools.scan_font_floor import (
    calculate_px,
    scan_file as scan_font_file,
)

from tools.scan_icon_inventory import (
    scan_file as scan_icon_file,
    EMOJI_REPLACEMENTS,
    is_regional_flag,
)

from tools.scan_navigation_routes import (
    scan_navigation_defects,
)


class TestContrastCalculator:
    def test_hex_to_rgb(self):
        assert hex_to_rgb("#FFFFFF") == (255, 255, 255)
        assert hex_to_rgb("#000000") == (0, 0, 0)
        assert hex_to_rgb("FFF") == (255, 255, 255)
        assert hex_to_rgb("#006948") == (0, 105, 72)

    def test_linear_conversion(self):
        assert srgb_channel_to_linear(0) == 0.0
        assert math.isclose(srgb_channel_to_linear(255), 1.0, rel_tol=1e-5)
        # Boundary test at 0.04045
        c_boundary = int(0.04045 * 255)
        val = srgb_channel_to_linear(c_boundary)
        assert val > 0.0

    def test_relative_luminance(self):
        assert math.isclose(relative_luminance("#FFFFFF"), 1.0, rel_tol=1e-5)
        assert math.isclose(relative_luminance("#000000"), 0.0, abs_tol=1e-5)
        # Forest emerald #006948 luminance around 0.1057
        lum_emerald = relative_luminance("#006948")
        assert 0.10 < lum_emerald < 0.11
        # Light canvas #F8FAFC luminance around 0.9536
        lum_light = relative_luminance("#F8FAFC")
        assert 0.95 < lum_light < 0.96

    def test_contrast_ratio_symmetry(self):
        r1 = calculate_contrast_ratio("#006948", "#F8FAFC")
        r2 = calculate_contrast_ratio("#F8FAFC", "#006948")
        assert math.isclose(r1, r2, rel_tol=1e-4)
        assert math.isclose(r1, 6.45, abs_tol=0.05)

    def test_contrast_ratio_extremes(self):
        # Black and white max contrast: 21:1
        bw_ratio = calculate_contrast_ratio("#FFFFFF", "#000000")
        assert math.isclose(bw_ratio, 21.0, abs_tol=0.01)

        # Same colors: 1:1
        same_ratio = calculate_contrast_ratio("#FFFFFF", "#FFFFFF")
        assert math.isclose(same_ratio, 1.0, abs_tol=0.01)

    def test_wcag_evaluations(self):
        # 6.45:1 passes AA normal (>= 4.5) and AA large (>= 3.0), fails AAA normal (< 7.0)
        res = evaluate_wcag(6.45)
        assert res["wcag_aa_normal"] is True
        assert res["wcag_aa_large"] is True
        assert res["wcag_aaa_normal"] is False

        # 2.42:1 fails AA normal, fails AA large, fails AAA
        fail_res = evaluate_wcag(2.42)
        assert fail_res["wcag_aa_normal"] is False
        assert fail_res["wcag_aa_large"] is False


class TestFontFloorScanner:
    def test_calculate_px(self):
        assert calculate_px("12", "px") == 12.0
        assert calculate_px("10", "px") == 10.0
        assert calculate_px("0.75", "rem") == 12.0
        assert calculate_px("0.7", "rem") == 11.2
        assert calculate_px("0.72", "rem") == 11.52
        assert calculate_px("9", "pt") == 12.0  # 9 * (96/72) = 12.0
        assert calculate_px("8", "pt") < 12.0

    def test_scan_file_violations(self):
        sample_code = """
        <div className="text-[10px] text-slate-500">Sub-12px Tailwind</div>
        <div className="text-xs">Compliant 12px Tailwind</div>
        <span style={{ fontSize: '11px', fontWeight: 600 }}>Sub-12px React Inline</span>
        <span style={{ fontSize: '14px' }}>Compliant 14px React Inline</span>
        <p style={{ fontSize: '0.7rem' }}>Sub-12px rem</p>
        <p style={{ fontSize: '0.75rem' }}>Compliant 0.75rem</p>
        """
        with tempfile.NamedTemporaryFile("w", suffix=".tsx", delete=False) as f:
            f.write(sample_code)
            temp_path = f.name

        try:
            violations = scan_font_file(temp_path, os.path.dirname(temp_path), floor_px=12.0)
            assert len(violations) == 3
            tokens = [v["raw_token"] for v in violations]
            assert "text-[10px]" in tokens
            assert "fontSize: '11px'" in tokens
            assert "fontSize: '0.7rem'" in tokens
        finally:
            os.remove(temp_path)


class TestIconInventoryScanner:
    def test_emoji_replacements(self):
        assert EMOJI_REPLACEMENTS["⚡"] == "bolt"
        assert EMOJI_REPLACEMENTS["⚠️"] == "warning"
        assert EMOJI_REPLACEMENTS["✅"] == "check_circle"
        assert EMOJI_REPLACEMENTS["💳"] == "credit_card"
        assert EMOJI_REPLACEMENTS["📍"] == "location_on"

    def test_regional_flags(self):
        assert is_regional_flag("🇱🇻") is True
        assert is_regional_flag("⚡") is False

    def test_scan_icons_and_violations(self):
        sample_code = """
        <span className="material-symbols-outlined">bolt</span>
        <svg width="24" height="24" viewBox="0 0 24 24"><path d="M..."/></svg>
        <button>⚡ Start Charging</button>
        <option value="+371">🇱🇻 +371</option>
        """
        with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as f:
            f.write(sample_code)
            temp_path = f.name

        try:
            res = scan_icon_file(temp_path, os.path.dirname(temp_path))
            assert len(res["compliant"]) == 1
            assert res["compliant"][0]["icon"] == "bolt"

            violation_types = [v["type"] for v in res["violations"]]
            assert "Raw Inline SVG" in violation_types
            assert "Raw UI Emoji" in violation_types
            assert "Country Flag Emoji" in violation_types
        finally:
            os.remove(temp_path)


class TestNavigationRouteScanner:
    def test_scan_real_codebase_routes(self):
        repo_root = "/home/danielaroko/applications/mapletynecpo"
        results = scan_navigation_defects(repo_root)

        assert results["scanned_files_count"] > 100
        assert len(results["missing_app_prefix_violations"]) >= 10
        assert len(results["dead_anchors"]) >= 50

        # Verify /privacy is identified as an orphaned route
        orphaned_paths = [o["path"] for o in results["orphaned_routes"]]
        assert "/privacy" in orphaned_paths

        # Verify missing /app in qr.py or cert_setup.html is detected
        missing_urls = [v["url"] for v in results["missing_app_prefix_violations"]]
        assert any("/charge/" in u for u in missing_urls)
        assert any("/receipt/" in u for u in missing_urls)
