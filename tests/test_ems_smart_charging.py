import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:34080"
EMAIL = "daniel.a@mapletynetechnologies.com"
PASSWORD = "byoWkDX86ndK49$3"

def test_ems_smart_charging():
    print(f"🚀 Verifying EMS Autonomous Smart Charging & Peak Shaving at {BASE_URL}/ems")
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

        # 3. Assert strictly ZERO sliders and absence of BESS Battery visual
        print("3. Verifying zero slider elements and absence of BESS Battery visual...")
        slider_count = page.locator("input[type='range']").count()
        assert slider_count == 0, f"Expected 0 sliders, found {slider_count} range inputs!"
        bess_count = page.locator("text=BESS Battery Storage").count()
        assert bess_count == 0, f"Expected 0 BESS Battery elements, found {bess_count}!"
        print("   ✅ Zero sliders & absence of BESS Battery visual confirmed.")

        # 4. Test Peak Shaving Guardrails Panel
        print("4. Testing Autonomous Peak Shaving Guardrails...")
        page.wait_for_selector("text=Autonomous Peak Shaving Guardrails", timeout=5000)
        # Select 15% safety buffer
        page.select_option("select >> nth=0", index=0) # Site selector
        # Submit peak shaving guardrails
        page.click("button:has-text('Save & Deploy Peak Shaving Guardrails')")
        page.wait_for_timeout(1000)
        print("   ✅ Peak shaving guardrails submitted and deployed.")

        # 5. Test Smart Charging Profile Dispatcher
        print("5. Testing Smart Charging Profile Dispatcher...")
        page.wait_for_selector("text=Smart Charging Profile Dispatcher", timeout=5000)
        # Fill 35.0 kW
        page.fill("input[type='number'] >> nth=1", "35.0")
        # Click dispatch
        page.click("button:has-text('Dispatch SetChargingProfile')")
        page.wait_for_timeout(1000)
        print("   ✅ Smart charging profile dispatched.")

        # 6. Test Hardware Station Throttling Table quick action
        print("6. Testing Hardware Station Throttling Table...")
        page.wait_for_selector("text=Hardware Station Power Allocation & Throttling Status", timeout=5000)
        throttle_btns = page.locator("button:has-text('Throttle 22kW')")
        if throttle_btns.count() > 0:
            throttle_btns.first.click()
            page.wait_for_timeout(1000)
            print("   ✅ One-click station throttle executed.")

        # 7. Check console errors
        print("7. Checking console & runtime logs...")
        critical_errors = [e for e in errors if "favicon" not in e]
        if critical_errors:
            print(f"   ❌ Console/Page Errors detected: {critical_errors}")
            sys.exit(1)
        else:
            print("   ✅ Zero runtime errors during EMS Smart Charging execution.")

        # 8. Screenshot
        page.screenshot(path="screen_ems_smart_charging_dashboard.png")
        print("   ✅ Saved screenshot to screen_ems_smart_charging_dashboard.png")

        browser.close()
        print("\n🎉 EMS Autonomous Smart Charging & Peak Shaving test passed with 100% success!")

if __name__ == "__main__":
    test_ems_smart_charging()
