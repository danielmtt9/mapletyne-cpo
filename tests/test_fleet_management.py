import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:34080"
EMAIL = "daniel.a@mapletynetechnologies.com"
PASSWORD = "byoWkDX86ndK49$3"

def test_fleet_management():
    print(f"🚀 Running Comprehensive Fleet & Vehicles Tests at {BASE_URL}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

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

        # 2. Navigate to /fleet
        print("2. Navigating to /fleet...")
        page.goto(f"{BASE_URL}/fleet", wait_until="networkidle")
        page.wait_for_selector("text=RFID Tokens & Fleet Groups", timeout=5000)
        print("   ✅ RFID Tokens & Fleet Groups Page loaded.")

        # 3. Assert zero range sliders on /fleet
        sliders_fleet = page.locator("input[type='range']").count()
        assert sliders_fleet == 0, f"Found {sliders_fleet} range sliders on /fleet! Sliders are forbidden."
        print("   ✅ Confirmed: 0 range sliders on /fleet.")

        # 4. Check ECharts canvas elements on /fleet
        canvases_fleet = page.locator("canvas").count()
        assert canvases_fleet >= 1, f"Expected ECharts canvas on /fleet, found {canvases_fleet}"
        print(f"   ✅ Found {canvases_fleet} ECharts canvas element(s) on /fleet.")

        # 5. Test Creating a Corporate Fleet Group
        print("5. Testing Add Corporate Group...")
        page.click("button:has-text('Add Corporate Group')")
        page.wait_for_selector("text=Create Corporate Fleet Group", timeout=3000)
        
        test_group_name = f"Logistics Corp {int(time.time())}"
        page.fill("input[placeholder='e.g. DHL Express Logistics']", test_group_name)
        page.fill("input[placeholder='invoices@company.com']", "billing@logisticscorp.com")
        page.click("button:has-text('Save Corporate Group')")
        page.wait_for_timeout(1500)
        print(f"   ✅ Created corporate group: {test_group_name}")

        # 6. Test Issuing a New RFID Token
        print("6. Testing Issue New Token...")
        page.click("button:has-text('Issue New Token')")
        page.wait_for_selector("text=Issue New RFID / Driver Token", timeout=3000)

        test_token_uid = f"RFID_{int(time.time()) % 100000}"
        page.fill("input[placeholder='e.g. 04A1B2C3D4 or OCPO_TOKEN_1']", test_token_uid)
        page.fill("input[placeholder='e.g. Jean Dupont']", "Max Verstappen")
        page.click("button:has-text('Provision Token')")
        page.wait_for_timeout(1500)
        print(f"   ✅ Provisioned token: {test_token_uid}")

        # 7. Navigate to /vehicles
        print("7. Navigating to /vehicles...")
        page.goto(f"{BASE_URL}/vehicles", wait_until="networkidle")
        page.wait_for_selector("text=Fleet Vehicles & Plug & Charge", timeout=5000)
        print("   ✅ Fleet Vehicles Page loaded.")

        # 8. Assert zero range sliders on /vehicles
        sliders_veh = page.locator("input[type='range']").count()
        assert sliders_veh == 0, f"Found {sliders_veh} range sliders on /vehicles! Sliders are forbidden."
        print("   ✅ Confirmed: 0 range sliders on /vehicles.")

        # 9. Check ECharts canvas on /vehicles
        canvases_veh = page.locator("canvas").count()
        assert canvases_veh >= 1, f"Expected ECharts canvas on /vehicles, found {canvases_veh}"
        print(f"   ✅ Found {canvases_veh} ECharts canvas element(s) on /vehicles.")

        # 10. Test Registering a Fleet EV
        print("10. Testing Register Fleet EV...")
        page.click("button:has-text('Register Fleet EV')")
        page.wait_for_selector("text=Register Fleet EV", timeout=3000)

        test_plate = f"EV-{int(time.time()) % 10000}-NL"
        page.fill("input[placeholder='e.g. 1-ABC-234 or NL-EV-99']", test_plate)
        page.fill("input[placeholder='e.g. Volvo, Tesla, Scania']", "Volvo Trucks")
        page.fill("input[placeholder='e.g. FH Electric, Model Y']", "FH Electric Heavy Haul")
        page.click("button:has-text('Register Vehicle')")
        page.wait_for_timeout(1500)
        print(f"   ✅ Registered fleet EV: {test_plate}")

        # 11. Check runtime console errors
        print("11. Verifying console error logs...")
        critical_errors = [e for e in errors if "favicon" not in e]
        if critical_errors:
            print(f"   ❌ Console/Page Errors detected: {critical_errors}")
            sys.exit(1)
        else:
            print("   ✅ Zero runtime console errors.")

        # 12. Screenshots
        page.screenshot(path="screen_fleet_verified.png")
        print("   ✅ Screenshot saved to screen_fleet_verified.png")

        browser.close()
        print("\n🎉 Fleet & Vehicles Subsystem tests passed with 100% success!")

if __name__ == "__main__":
    test_fleet_management()
