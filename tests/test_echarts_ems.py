import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:34080"
EMAIL = "daniel.a@mapletynetechnologies.com"
PASSWORD = "byoWkDX86ndK49$3"

def test_echarts_ems():
    print(f"🚀 Verifying EMS ECharts Analytics at {BASE_URL}/ems")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console errors
        errors = []
        page.on("console", lambda msg: errors.append(f"CONSOLE {msg.type}: {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda exc: errors.append(f"PAGEERROR: {exc}"))

        # 1. Login
        print("1. Performing login...")
        page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        page.fill("#username", EMAIL)
        page.fill("#password", PASSWORD)
        page.click("#submit-btn")
        page.wait_for_timeout(1500)
        assert page.url == f"{BASE_URL}/" or page.url == f"{BASE_URL}", f"Login failed: {page.url}"
        print("   ✅ Logged in successfully!")

        # 2. Navigate to /ems
        print("2. Navigating to /ems...")
        page.goto(f"{BASE_URL}/ems", wait_until="networkidle")
        page.wait_for_selector("text=Energy Management System", timeout=5000)
        print("   ✅ EMS Page loaded.")

        # 3. Check for ECharts canvases on page (Multi-Source Balance & Battery SoC Gauge)
        canvases = page.locator("canvas")
        canvas_count = canvases.count()
        assert canvas_count >= 2, f"Expected at least 2 ECharts canvases on EMS page, found {canvas_count}"
        print(f"   ✅ Found {canvas_count} ECharts canvas element(s) on EMS page.")

        # 4. Switch to Flow Sankey tab
        print("3. Testing Flow Sankey tab switch...")
        page.click("button:has-text('Flow Sankey')")
        page.wait_for_timeout(1000)
        page.wait_for_selector("text=Site Energy Distribution Flow", timeout=5000)
        sankey_canvases = page.locator("canvas").count()
        assert sankey_canvases >= 2, f"Expected Sankey canvas, found {sankey_canvases}"
        print("   ✅ Flow Sankey view active and rendered.")

        # 5. Switch back to Time Series tab
        page.click("button:has-text('Time Series')")
        page.wait_for_timeout(500)

        # 6. Check console errors
        print("4. Checking console & runtime logs...")
        critical_errors = [e for e in errors if "favicon" not in e]
        if critical_errors:
            print(f"   ❌ Console/Page Errors detected: {critical_errors}")
            sys.exit(1)
        else:
            print("   ✅ Zero runtime errors during EMS ECharts rendering.")

        # 7. Screenshot
        page.screenshot(path="screen_echarts_ems_page.png")
        print("   ✅ Saved screenshot to screen_echarts_ems_page.png")

        browser.close()
        print("\n🎉 EMS ECharts Visual Analytics test passed with 100% success!")

if __name__ == "__main__":
    test_echarts_ems()
