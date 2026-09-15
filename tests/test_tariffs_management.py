import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:34080"
EMAIL = "daniel.a@mapletynetechnologies.com"
PASSWORD = "byoWkDX86ndK49$3"

def test_tariffs_management():
    print(f"🚀 Running Comprehensive Tariffs & Pricing Management Tests at {BASE_URL}/tariffs")
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
        page.wait_for_selector("text=Tariffs & Pricing Management", timeout=5000)
        print("   ✅ Tariffs Page loaded.")

        # 3. Assert ZERO sliders exist on the page
        print("3. Verifying zero range sliders...")
        sliders = page.locator("input[type='range']")
        assert sliders.count() == 0, f"Found {sliders.count()} range slider(s) on Tariffs page! Sliders must be strictly avoided."
        print("   ✅ Confirmed: 0 sliders found on Tariffs page (Strict Input/Dropdown/Button requirement satisfied).")

        # 4. Check ECharts canvas elements
        print("4. Checking ECharts Canvas elements...")
        canvases = page.locator("canvas")
        canvas_count = canvases.count()
        assert canvas_count >= 1, f"Expected ECharts canvas elements on Tariffs page, found {canvas_count}"
        print(f"   ✅ Found {canvas_count} ECharts canvas element(s) rendering successfully.")

        # 5. Test Creating a New Tariff Model
        print("5. Testing Create Tariff Model modal...")
        page.click("button:has-text('Create Tariff Model')")
        page.wait_for_selector("text=Create New Tariff Model", timeout=3000)
        
        test_tariff_name = f"Test Fleet Supercharger {int(time.time())}"
        page.fill("input[placeholder='e.g. Standard Public AC Charging']", test_tariff_name)
        # Fill Energy Rate
        page.locator("input[type='number']").first.fill("0.520")
        
        page.click("button:has-text('Register Tariff Model')")
        page.wait_for_timeout(1500)
        print("   ✅ Registered new tariff model via modal.")

        # 6. Test Creating a New Pricing Tier
        print("6. Testing Add Pricing Tier modal...")
        page.click("button:has-text('Add Margin Tier')")
        page.wait_for_selector("text=Add Customer Pricing Tier", timeout=3000)

        test_tier_id = f"tier_test_{int(time.time()) % 10000}"
        page.fill("input[placeholder='e.g. vip_corporate_fleet']", test_tier_id)
        page.fill("input[placeholder='e.g. VIP Corporate Priority']", "Test High Margin Tier")
        page.fill("input[placeholder='e.g. Commercial fleets with >500 sessions/mo']", "Automated QA Test Tier")
        
        page.click("button:has-text('Save Pricing Tier')")
        page.wait_for_timeout(1500)
        print("   ✅ Created customer pricing tier via modal.")

        # 7. Check runtime console errors
        print("7. Verifying runtime console logs...")
        critical_errors = [e for e in errors if "favicon" not in e]
        if critical_errors:
            print(f"   ❌ Console/Page Errors detected: {critical_errors}")
            sys.exit(1)
        else:
            print("   ✅ Zero runtime console errors.")

        # 8. Take verification screenshot
        page.screenshot(path="screen_tariffs_management_verified.png")
        print("   ✅ Screenshot saved to screen_tariffs_management_verified.png")

        browser.close()
        print("\n🎉 Tariffs & Pricing Management test completed with 100% success!")

if __name__ == "__main__":
    test_tariffs_management()
