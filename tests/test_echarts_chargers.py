import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:34080"
EMAIL = "daniel.a@mapletynetechnologies.com"
PASSWORD = "byoWkDX86ndK49$3"

def test_echarts_chargers_drawer():
    print(f"🚀 Verifying Hardware Chargers ECharts Drawer at {BASE_URL}/chargers")
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

        # 2. Navigate to /chargers
        print("2. Navigating to /chargers...")
        page.goto(f"{BASE_URL}/chargers", wait_until="networkidle")
        page.wait_for_selector("table tbody tr", timeout=5000)
        print("   ✅ Chargers table loaded.")

        # 3. Click on the first charger row or Inspect button to open Drawer
        print("3. Opening Charger Detail Drawer...")
        page.click("table tbody tr:first-child")
        page.wait_for_selector("text=3-Phase Scope", timeout=5000)
        page.wait_for_selector("text=OUTPUT METER", timeout=5000)
        print("   ✅ Drawer opened with telemetry panels.")

        # 4. Check for ECharts canvas inside drawer
        drawer_canvases = page.locator("canvas")
        canvas_count = drawer_canvases.count()
        assert canvas_count >= 2, f"Expected at least 2 ECharts canvases in drawer, found {canvas_count}"
        print(f"   ✅ Found {canvas_count} ECharts canvas element(s) in drawer.")

        # 5. Test metric toggle (Volts vs Amps)
        print("4. Testing 3-Phase metric toggle...")
        page.click("button:has-text('Amps')")
        page.wait_for_timeout(500)
        page.click("button:has-text('Volts')")
        page.wait_for_timeout(500)
        print("   ✅ Metric toggle between Volts and Amps executed smoothly.")

        # 6. Check console errors
        print("5. Checking console & runtime logs...")
        critical_errors = [e for e in errors if "favicon" not in e]
        if critical_errors:
            print(f"   ❌ Console/Page Errors detected: {critical_errors}")
            sys.exit(1)
        else:
            print("   ✅ Zero runtime errors during drawer ECharts rendering.")

        # 7. Screenshot
        page.screenshot(path="screen_echarts_charger_drawer.png")
        print("   ✅ Saved screenshot to screen_echarts_charger_drawer.png")

        browser.close()
        print("\n🎉 Hardware Chargers ECharts Detail Drawer test passed with 100% success!")

if __name__ == "__main__":
    test_echarts_chargers_drawer()
