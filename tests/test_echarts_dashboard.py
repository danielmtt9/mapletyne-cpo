import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:34080"
EMAIL = "daniel.a@mapletynetechnologies.com"
PASSWORD = "byoWkDX86ndK49$3"

def test_echarts_dashboard():
    print(f"🚀 Verifying Apache ECharts integration on Dashboard at {BASE_URL}")
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

        # 2. Check for ECharts Canvas element
        print("2. Checking ECharts Canvas element...")
        canvas_locator = page.locator("canvas")
        page.wait_for_selector("canvas", timeout=5000)
        canvas_count = canvas_locator.count()
        assert canvas_count >= 1, f"Expected at least 1 ECharts canvas, found {canvas_count}"
        print(f"   ✅ Found {canvas_count} canvas element(s) on the dashboard.")

        # 3. Check Live Network Load Curve header and Live pill
        print("3. Checking Live Network Load Curve UI...")
        page.wait_for_selector("text=Real-Time Network Load Curve", timeout=5000)
        page.wait_for_selector("text=Live: 0.0 kW", timeout=5000)
        print("   ✅ Real-Time Network Load Curve header and 'Live: 0.0 kW' zero-state pill confirmed.")

        # 4. Check that there are no Javascript runtime or ECharts initialization errors
        print("4. Checking console & runtime logs...")
        critical_errors = [e for e in errors if "favicon" not in e]
        if critical_errors:
            print(f"   ❌ Console/Page Errors detected: {critical_errors}")
            sys.exit(1)
        else:
            print("   ✅ Zero runtime errors during ECharts initialization.")

        # 5. Take screenshot of live rendered ECharts dashboard
        page.screenshot(path="screen_echarts_dashboard_live.png")
        print("   ✅ Saved screenshot to screen_echarts_dashboard_live.png")

        # 6. Test responsive resize trigger
        print("5. Testing responsive canvas resize...")
        page.set_viewport_size({"width": 1024, "height": 768})
        page.wait_for_timeout(1000)
        page.set_viewport_size({"width": 1600, "height": 1000})
        page.wait_for_timeout(1000)
        print("   ✅ Resize completed without crash.")

        browser.close()
        print("\n🎉 Apache ECharts Dashboard test passed with 100% success!")

if __name__ == "__main__":
    test_echarts_dashboard()
