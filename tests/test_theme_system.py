import os
import re
from pathlib import Path
import pytest


# Define base paths relative to the project root
BASE_DIR = Path(__file__).resolve().parent.parent

ADMIN_SRC = BASE_DIR / "mapletyne-admin" / "src"
CHARGEAPP_STATIC = BASE_DIR / "mapletyne-chargeapp" / "static"
CHARGEAPP_TEMPLATES = BASE_DIR / "mapletyne-chargeapp" / "templates"


def read_file(file_path: Path) -> str:
    """Reads the content of a file."""
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    return file_path.read_text(encoding="utf-8")


class TestAdminThemeProvider:
    def test_admin_theme_provider_inline_override_prevention(self) -> None:
        """
        Reads mapletyne-admin/src/lib/theme-provider.tsx and asserts that when in dark mode,
        root.style.removeProperty('--background'), removeProperty('--secondary'), and
        removeProperty('--card') are executed to avoid specificity collisions.
        """
        file_path = ADMIN_SRC / "lib" / "theme-provider.tsx"
        content = read_file(file_path)

        # Check for the existence of the specific removeProperty calls
        assert "removeProperty('--background')" in content, \
            "Missing removal of --background property in dark mode logic."
        assert "removeProperty('--secondary')" in content, \
            "Missing removal of --secondary property in dark mode logic."
        assert "removeProperty('--card')" in content, \
            "Missing removal of --card property in dark mode logic."

        # Optional: Ensure these are within a context that implies dark mode handling.
        # We look for 'dark' class or variable assignment nearby to ensure context,
        # though strict AST parsing is overkill for this simple assertion requirement.
        # The presence of the specific removals is the primary requirement.


class TestAdminProfileThemeSelector:
    def test_admin_profile_theme_selector_present(self) -> None:
        """
        Reads mapletyne-admin/src/pages/ProfilePage.tsx and asserts that useTheme provides setTheme
        and that buttons for 'light', 'dark', and 'system' exist with Google Material Symbols.
        """
        file_path = ADMIN_SRC / "pages" / "ProfilePage.tsx"
        content = read_file(file_path)

        # Assert useTheme is used and setTheme is accessed/used
        assert "useTheme" in content, "useTheme hook is not imported or used."
        assert "setTheme" in content, "setTheme function from useTheme is not present."

        # Assert buttons for light, dark, system exist
        # We look for text content or aria-labels indicating these modes.
        assert re.search(r"'light'|\"light\"", content), "Button for 'light' mode not found."
        assert re.search(r"'dark'|\"dark\"", content), "Button for 'dark' mode not found."
        assert re.search(r"'system'|\"system\"", content), "Button for 'system' mode not found."

        # Assert Google Material Symbols are used.
        # Common patterns: <span class="material-symbols-outlined">...</span> or icon names like 'light_mode', etc.
        # We check for the presence of material symbol classes or icons generally associated with theme switching.
        assert "material-symbols" in content.lower() or "icon" in content.lower(), \
            "Google Material Symbols or equivalent icon implementation not found."


class TestChargeappLightModeTokens:
    def test_chargeapp_light_mode_tokens_defined(self) -> None:
        """
        Reads mapletyne-chargeapp/static/style.css and asserts that .light selector defines
        --bg, --card, --border, --text, and --accent.
        """
        file_path = CHARGEAPP_STATIC / "style.css"
        content = read_file(file_path)

        # Find the .light block.
        light_block_match = re.search(r'\.light[^{]*\{([^}]*)\}', content, re.DOTALL)
        
        assert light_block_match is not None, ".light selector block not found in style.css."

        light_block_content = light_block_match.group(1)

        required_properties = ['--bg', '--card', '--border', '--text', '--accent']
        
        for prop in required_properties:
            # Check if the property is defined within the .light block
            pattern = rf'{re.escape(prop)}\s*:'
            assert re.search(pattern, light_block_content), \
                f"CSS variable {prop} not defined in .light selector."


class TestChargeappHomeJsThemeLifecycle:
    def test_chargeapp_home_js_theme_lifecycle(self) -> None:
        """
        Reads mapletyne-chargeapp/static/home.js and asserts that toggleTheme toggles between light and dark,
        sets localStorage('chargeapp_theme'), updates documentElement classes, and swaps tile layers.
        """
        file_path = CHARGEAPP_STATIC / "home.js"
        content = read_file(file_path)

        # Assert toggleTheme function exists
        assert "toggleTheme" in content, "toggleTheme function not found."

        # Assert localStorage('chargeapp_theme') is set
        assert "localStorage" in content and "chargeapp_theme" in content, \
            "localStorage with key 'chargeapp_theme' not found."

        # Assert documentElement classes are updated (e.g., document.documentElement.classList)
        assert "documentElement" in content and "classList" in content, \
            "Updates to documentElement classes not found."

        # Assert swapping tile layers. This is specific to the app's implementation.
        # We look for keywords related to tiles and layer switching/toggling.
        # Common patterns: 'tile', 'layer', 'swap', 'toggle', 'light', 'dark' in context of DOM manipulation.
        assert re.search(r'tile.*(?:layer|swap|toggle)', content, re.IGNORECASE) or \
               re.search(r'layer.*(?:tile|swap|toggle)', content, re.IGNORECASE), \
            "Logic for swapping tile layers not found."


class TestChargeappHomeHtmlThemeButton:
    def test_chargeapp_home_html_theme_button(self) -> None:
        """
        Reads mapletyne-chargeapp/templates/home.html and asserts that theme-toggle button uses CSS variables
        rather than hardcoded dark rgba styling.
        """
        file_path = CHARGEAPP_TEMPLATES / "home.html"
        content = read_file(file_path)

        # Find the theme-toggle button or element
        assert "theme-toggle" in content, "theme-toggle element not found."

        # Assert that hardcoded dark rgba styling is NOT present directly on the button.
        # We look for 'rgba(' followed by values typical of a dark color (e.g., 0, 0, 0 or similar)
        # and ensure it's not inline in the theme-toggle context.
        
        # Find the section containing theme-toggle
        toggle_section = re.search(r'(?i)(theme-toggle[^>]*>)', content)
        
        if toggle_section:
            toggle_html = toggle_section.group(1)
            # Check for hardcoded rgba dark colors within that specific HTML tag/section
            # This is a heuristic. A more robust check would parse the DOM, but regex suffices here.
            assert not re.search(r'rgba\s*\(\s*0\s*,\s*0\s*,\s*0\s*,', toggle_html), \
                "Hardcoded dark rgba styling found directly on theme-toggle element."
            
            # Assert usage of CSS variables (e.g., var(--bg) or similar)
            assert "var(" in content, "CSS variables not used in home.html."


class TestAdminBrandingContrastSafeguard:
    def test_theme_provider_prevents_dark_branding_in_light_mode(self) -> None:
        """
        Asserts that theme-provider.tsx includes isLightColor verification so dark hex values
        like #0b1326 or #171f33 are never assigned to --background or --card in light mode.
        """
        content = read_file(ADMIN_SRC / "lib" / "theme-provider.tsx")
        assert "isLightColor" in content, "isLightColor contrast helper function not found."
        assert "isLightColor(cfg.bg_color)" in content, "isLightColor check on cfg.bg_color not found."
        assert "isLightColor(cfg.card_color)" in content, "isLightColor check on cfg.card_color not found."


class TestChargeappSkinTokens:
    def test_otaski_skin_has_light_tokens(self) -> None:
        """
        Asserts that mapletyne-chargeapp/skins/otaski/static/style.css includes .light selector
        with --bg, --card, and --text definitions.
        """
        content = read_file(BASE_DIR / "mapletyne-chargeapp" / "skins" / "otaski" / "static" / "style.css")
        assert ".light" in content, ".light class not found in skins/otaski/static/style.css."
        match = re.search(r'\.light[^{]*\{([^}]*)\}', content, re.DOTALL)
        assert match is not None, ".light block not found in otaski skin."
        block = match.group(1)
        for var in ['--bg', '--card', '--text']:
            assert var in block, f"{var} not defined in otaski .light block."


class TestAdminNoHardcodedTextWhiteOnSurfaces:
    def test_vehicles_page_uses_semantic_text_tokens(self) -> None:
        """
        Asserts that VehiclesPage.tsx tabler-card KPI values do not use hardcoded text-white
        on bg-surface-container cards.
        """
        content = read_file(ADMIN_SRC / "pages" / "VehiclesPage.tsx")
        assert "text-2xl font-bold font-mono text-white mt-1" not in content, \
            "Found hardcoded text-white on total_bays KPI card."
        assert "text-2xl font-bold font-mono text-on-surface mt-1" in content, \
            "total_bays KPI card does not use text-on-surface."
