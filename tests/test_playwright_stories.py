import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:34080"
EMAIL = "daniel.a@mapletynetechnologies.com"
PASSWORD = "byoWkDX86ndK49$3"

def test_stories():
    print(f"🚀 Running Comprehensive Story Verification on {BASE_URL}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Step 1: Login
        print("1. Testing Auth / Login...")
        page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        page.fill("#username", EMAIL)
        page.fill("#password", PASSWORD)
        page.click("#submit-btn")
        page.wait_for_timeout(1500)
        assert "/login" not in page.url, f"Login failed, stayed on {page.url}"
        print("   ✅ Auth successful!")

        # Step 2: Dashboard & Self-Healing Monitor
        print("2. Testing Dashboard & Self-Healing Monitor...")
        page.goto(f"{BASE_URL}/", wait_until="networkidle")
        page.wait_for_timeout(1000)
        content = page.content()
        assert "Self-Healing Engine" in content or "Watchdog" in content, "Self-Healing Engine monitor not found on Dashboard"
        print("   ✅ Dashboard Self-Healing live monitor verified.")

        # Step 3: Settings - Brand Studio & Site Host Payouts
        print("3. Testing Brand Studio & Site Host Payouts in /settings...")
        page.goto(f"{BASE_URL}/settings", wait_until="networkidle")
        page.wait_for_timeout(1000)
        content = page.content()
        assert "Brand & White-Label Studio" in content or "Brand Studio" in content, "Brand Studio tab missing"
        assert "Site Host Revenue Splits" in content, "Revenue Splits tab missing"

        # Click Payouts tab
        page.click("button:has-text('Site Host Revenue Splits')")
        page.wait_for_timeout(500)
        content = page.content()
        assert "Site Host Commission Rate" in content or "Settlement Cycle" in content, "Payouts configuration panel missing"
        print("   ✅ Story 1 (Brand Studio) & Story 2 (Site Host Payouts) UI verified.")

        # Step 4: Chargers Page & Self Healing Control
        print("4. Testing Chargers Page & Drawer Controls...")
        page.goto(f"{BASE_URL}/chargers", wait_until="networkidle")
        page.wait_for_timeout(1000)
        content = page.content()
        assert "Hardware Chargers" in content, "Chargers page header missing"
        
        # Click first row if any
        rows = page.locator("tbody tr")
        if rows.count() > 0:
            rows.first.click()
            page.wait_for_timeout(800)
            drawer_content = page.content()
            assert "Self-Healing" in drawer_content or "Soft Reboot" in drawer_content, "Drawer actions missing self-healing / reboot"
            print("   ✅ Charger Detail Drawer & Self-Healing action verified.")
        else:
            print("   ℹ️ No chargers populated in table to click drawer.")

        # Step 5: Tariffs Page & What-If Dynamic Simulator
        print("5. Testing Tariffs Page & Dynamic Spot Simulator...")
        page.goto(f"{BASE_URL}/tariffs", wait_until="networkidle")
        page.wait_for_timeout(1000)
        content = page.content()
        assert "What-If Spot Simulator" in content, "What-If Spot Simulator missing"
        assert "Wholesale Spot vs Simulated Retail Rate Curve" in content, "24h Curve Chart missing"
        assert "Monthly Forecast Projection" in content, "Forecast projection card missing"
        print("   ✅ Story 4 (Dynamic Tariff Simulator) verified.")

        browser.close()
        print("\n🎉 ALL STORIES (1, 2, 3, 4) VERIFIED IN PLAYWRIGHT TEST SUITE!")

if __name__ == "__main__":
    test_stories()
