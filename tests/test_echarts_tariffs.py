import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:34080"
EMAIL = "daniel.a@mapletynetechnologies.com"
PASSWORD = "byoWkDX86ndK49$3"

def test_echarts_tariffs():
    print(f"🚀 Verifying Tariffs ECharts Analytics at {BASE_URL}/tariffs")
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

        # 2. Navigate to /tariffs
        print("2. Navigating to /tariffs...")
        page.goto(f"{BASE_URL}/tariffs", wait_until="networkidle")
        page.wait_for_selector("text=Tariffs & Dynamic Pricing Engine", timeout=5000)
        print("   ✅ Tariffs Page loaded.")

        # 3. Check for ECharts canvas on page
        canvases = page.locator("canvas")
        canvas_count = canvases.count()
        assert canvas_count >= 1, f"Expected at least 1 ECharts canvas on Tariffs page, found {canvas_count}"
        print(f"   ✅ Found {canvas_count} ECharts canvas element(s) on Tariffs page.")

        # 4. Check console errors
        print("3. Checking console & runtime logs...")
        critical_errors = [e for e in errors if "favicon" not in e]
        if critical_errors:
            print(f"   ❌ Console/Page Errors detected: {critical_errors}")
            sys.exit(1)
        else:
            print("   ✅ Zero runtime errors during Tariffs ECharts rendering.")

        # 5. Screenshot
        page.screenshot(path="screen_echarts_tariffs_page.png")
        print("   ✅ Saved screenshot to screen_echarts_tariffs_page.png")

        browser.close()
        print("\n🎉 Tariffs ECharts Visual Analytics test passed with 100% success!")

if __name__ == "__main__":
    test_echarts_tariffs()
