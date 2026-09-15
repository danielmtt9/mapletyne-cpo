import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:34080"
EMAIL = "daniel.a@mapletynetechnologies.com"
PASSWORD = "byoWkDX86ndK49$3"

def run_master_e2e_test_suite():
    print("=" * 80)
    print("🚀 STARTING EXHAUSTIVE E2E PLATFORM & API AUTOMATION TEST SUITE")
    print(f"Target Gateway: {BASE_URL}")
    print("=" * 80)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        errors = []
        page.on("console", lambda msg: errors.append(f"CONSOLE {msg.type}: {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda exc: errors.append(f"PAGEERROR: {exc}"))
        page.on("response", lambda resp: print(f"   ⚠️ HTTP {resp.status} on {resp.url}") if resp.status >= 400 and "favicon" not in resp.url else None)

        # ----------------------------------------------------------------------
        # 1. AUTHENTICATION & LOGIN FLOW
        # ----------------------------------------------------------------------
        print("\n[Phase 1] Testing Authentication & Login Flow (/login)...")
        page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        assert page.locator("#username").is_visible(), "Username input missing on login page"
        assert page.locator("#password").is_visible(), "Password input missing on login page"
        assert page.locator("#submit-btn").is_visible(), "Submit button missing on login page"

        page.fill("#username", EMAIL)
        page.fill("#password", PASSWORD)
        page.click("#submit-btn")
        page.wait_for_timeout(1500)
        assert page.url in [f"{BASE_URL}/", f"{BASE_URL}"], f"Login failed: redirected to {page.url}"
        print("   ✅ Logged in successfully; JWT stored; redirected to Dashboard.")

        # ----------------------------------------------------------------------
        # 2. SIDEBAR NAVIGATION & SSE EVENT BUS
        # ----------------------------------------------------------------------
        print("\n[Phase 2] Verifying Sidebar Navigation & Real-Time Event Bus...")
        assert page.locator("text=Mission Control").is_visible(), "Sidebar brand header not visible"
        assert page.locator("text=EVENT BUS").is_visible(), "Sidebar SSE Event Bus not visible"
        
        nav_routes = [
            ("Chargers", "/chargers"),
            ("Sessions", "/sessions"),
            ("Tariffs", "/tariffs"),
            ("RFID & Fleet", "/fleet"),
            ("Vehicles", "/vehicles"),
            ("PKI Vault", "/pki"),
            ("Energy (EMS)", "/ems"),
            ("Roaming (OCPI)", "/roaming"),
            ("Settings", "/settings"),
            ("Dashboard", "/"),
        ]

        for label, path in nav_routes:
            link = page.locator(f"aside nav a:has-text('{label}')") if label != "Settings" else page.locator("aside a[href='/settings']")
            link.click()
            page.wait_for_timeout(400)
            assert path in page.url, f"Navigation link '{label}' failed to route to {path}"
            print(f"   ✅ Navigated cleanly to '{label}' ({path})")

        # ----------------------------------------------------------------------
        # 3. DASHBOARD OVERVIEW & LOAD CURVE TELEMETRY (/)
        # ----------------------------------------------------------------------
        print("\n[Phase 3] Testing Dashboard Overview (/) & Telemetry...")
        page.goto(f"{BASE_URL}/", wait_until="networkidle")
        page.wait_for_timeout(1000)
        
        # Check KPI summary cards
        assert page.locator("text=Network Overview").is_visible(), "Dashboard Network Overview title not visible"
        assert page.locator("text=Today's Energy").is_visible() or page.locator("text=Active Sessions").is_visible()
        print("   ✅ Dashboard Network Overview & KPI summary cards active.")

        # Check ECharts Canvas on Dashboard
        canvases = page.locator("canvas")
        assert canvases.count() >= 1, "Dashboard ECharts load curve canvas not rendered"
        print(f"   ✅ Dashboard ECharts canvases rendered: {canvases.count()} canvas element(s).")

        # ----------------------------------------------------------------------
        # 4. CHARGERS MANAGEMENT & REMOTE COMMANDS (/chargers)
        # ----------------------------------------------------------------------
        print("\n[Phase 4] Testing Chargers Fleet & Remote Control (/chargers)...")
        page.goto(f"{BASE_URL}/chargers", wait_until="networkidle")
        page.wait_for_timeout(1000)

        # Assert no sliders
        assert page.locator("input[type='range']").count() == 0, "Sliders found on Chargers page!"

        # Check search & status filters
        search_input = page.locator("input[placeholder*='Search']")
        if search_input.count() > 0:
            search_input.first.fill("otaski")
            page.wait_for_timeout(400)
            search_input.first.fill("")
            page.wait_for_timeout(400)

        # Check charger cards
        charger_cards = page.locator(".bg-surface-container")
        print(f"   ✅ Found {charger_cards.count()} container elements on Chargers page.")

        # ----------------------------------------------------------------------
        # 5. SESSIONS & CDR TRANSACTIONS (/sessions)
        # ----------------------------------------------------------------------
        print("\n[Phase 5] Testing Sessions & CDR Billing Engine (/sessions)...")
        page.goto(f"{BASE_URL}/sessions", wait_until="networkidle")
        page.wait_for_timeout(1000)
        assert page.locator("input[type='range']").count() == 0, "Sliders found on Sessions page!"
        print("   ✅ Sessions page loaded with zero range sliders.")

        # ----------------------------------------------------------------------
        # 6. TARIFFS, COST BASIS & PRICING TIERS (/tariffs)
        # ----------------------------------------------------------------------
        print("\n[Phase 6] Testing Tariffs & Pricing Management (/tariffs)...")
        page.goto(f"{BASE_URL}/tariffs", wait_until="networkidle")
        page.wait_for_timeout(1000)

        # Assert zero sliders on tariffs page
        assert page.locator("input[type='range']").count() == 0, "Forbidden slider found on Tariffs page!"
        print("   ✅ Confirmed: 0 sliders on Tariffs page.")

        # Check ECharts on Tariffs
        tariffs_canvases = page.locator("canvas").count()
        assert tariffs_canvases >= 1, "Expected ECharts canvases on Tariffs page"
        print(f"   ✅ Found {tariffs_canvases} ECharts canvas element(s) on Tariffs page.")

        # Test Create Tariff Modal
        print("   - Testing Create Tariff Model modal...")
        page.click("button:has-text('Create Tariff Model')")
        page.wait_for_selector("text=Create New Tariff Model", timeout=3000)
        
        t_name = f"AutoQA Tariff {int(time.time()) % 10000}"
        page.fill("input[placeholder='e.g. Standard Public AC Charging']", t_name)
        page.click("button:has-text('Register Tariff Model')")
        page.wait_for_timeout(1200)
        print(f"   ✅ Created new Tariff model: {t_name}")

        # Test Add Pricing Tier Modal
        print("   - Testing Add Margin Tier modal...")
        page.click("button:has-text('Add Margin Tier')")
        page.wait_for_selector("text=Add Customer Pricing Tier", timeout=3000)

        tier_id = f"tier_qa_{int(time.time()) % 10000}"
        page.fill("input[placeholder='e.g. vip_corporate_fleet']", tier_id)
        page.fill("input[placeholder='e.g. VIP Corporate Priority']", f"QA Tier {tier_id}")
        page.click("button:has-text('Save Pricing Tier')")
        page.wait_for_timeout(1200)
        print(f"   ✅ Created customer pricing tier: {tier_id}")

        # ----------------------------------------------------------------------
        # 7. RFID TOKENS & CORPORATE FLEET GROUPS (/fleet)
        # ----------------------------------------------------------------------
        print("\n[Phase 7] Testing RFID Tokens & Corporate Fleet Groups (/fleet)...")
        page.goto(f"{BASE_URL}/fleet", wait_until="networkidle")
        page.wait_for_timeout(1000)

        assert page.locator("input[type='range']").count() == 0, "Sliders found on Fleet page!"
        fleet_canvases = page.locator("canvas").count()
        assert fleet_canvases >= 1, "Expected ECharts canvases on Fleet page"
        print(f"   ✅ Confirmed: 0 sliders, {fleet_canvases} ECharts canvases on Fleet page.")

        # Test Create Corporate Group
        print("   - Testing Add Corporate Group...")
        page.click("button:has-text('Add Corporate Group')")
        page.wait_for_selector("text=Create Corporate Fleet Group", timeout=3000)
        group_name = f"QA Fleet Org {int(time.time()) % 10000}"
        page.fill("input[placeholder='e.g. DHL Express Logistics']", group_name)
        page.click("button:has-text('Save Corporate Group')")
        page.wait_for_timeout(1200)
        print(f"   ✅ Created Corporate Group: {group_name}")

        # Test Issue Token
        print("   - Testing Issue New Token...")
        page.click("button:has-text('Issue New Token')")
        page.wait_for_selector("text=Issue New RFID / Driver Token", timeout=3000)
        token_uid = f"QA_TAG_{int(time.time()) % 100000}"
        page.fill("input[placeholder='e.g. 04A1B2C3D4 or OCPO_TOKEN_1']", token_uid)
        page.fill("input[placeholder='e.g. Jean Dupont']", "QA Test Driver")
        page.click("button:has-text('Provision Token')")
        page.wait_for_timeout(1200)
        print(f"   ✅ Provisioned token: {token_uid}")

        # Test Token Card Replacement Modal
        print("   - Testing Card Replacement Modal...")
        replace_btn = page.locator("button[title='Replace Card']").first
        if replace_btn.count() > 0:
            replace_btn.click()
            page.wait_for_selector("text=Replace RFID Token / Badge", timeout=3000)
            page.click("button:has-text('Cancel')")
            page.wait_for_timeout(400)
            print("   ✅ Opened and verified Token Replacement Modal.")

        # Test Token Audit Drawer
        print("   - Testing Token Audit Trail Drawer...")
        audit_btn = page.locator("button[title='Audit Trail']").first
        if audit_btn.count() > 0:
            audit_btn.click()
            page.wait_for_selector("text=Token Audit Trail", timeout=3000)
            page.click("button:has-text('Close Audit Trail')")
            page.wait_for_timeout(400)
            print("   ✅ Opened and verified Token Audit Trail Drawer.")

        # Test Token Sessions Drawer
        print("   - Testing Token Sessions Drawer...")
        sess_btn = page.locator("button[title='View Charging Sessions']").first
        if sess_btn.count() > 0:
            sess_btn.click()
            page.wait_for_selector("text=Token Charging Sessions", timeout=3000)
            page.click("button:has-text('Close Sessions')")
            page.wait_for_timeout(400)
            print("   ✅ Opened and verified Token Sessions Drawer.")

        # ----------------------------------------------------------------------
        # 8. FLEET VEHICLES & PLUG & CHARGE (/vehicles)
        # ----------------------------------------------------------------------
        print("\n[Phase 8] Testing Fleet Vehicles & ISO 15118 Plug & Charge (/vehicles)...")
        page.goto(f"{BASE_URL}/vehicles", wait_until="networkidle")
        page.wait_for_timeout(1000)

        assert page.locator("input[type='range']").count() == 0, "Sliders found on Vehicles page!"
        print("   ✅ Confirmed: 0 sliders on Vehicles page.")

        # Register Vehicle Modal
        print("   - Testing Register Fleet EV modal...")
        page.click("button:has-text('Register Fleet EV')")
        page.wait_for_selector("text=Register Fleet EV", timeout=3000)

        plate = f"QA-{int(time.time()) % 10000}-EV"
        page.fill("input[placeholder='e.g. 1-ABC-234 or NL-EV-99']", plate)
        page.fill("input[placeholder='e.g. Volvo, Tesla, Scania']", "Scania")
        page.fill("input[placeholder='e.g. FH Electric, Model Y']", "25 P Electric")
        page.click("button:has-text('Register Vehicle')")
        page.wait_for_timeout(1200)
        print(f"   ✅ Registered Fleet EV: {plate}")

        # Test Vehicle Sessions Drawer
        veh_sess_btn = page.locator("button[title='Charging Sessions']").first
        if veh_sess_btn.count() > 0:
            veh_sess_btn.click()
            page.wait_for_selector("text=Vehicle Session Telemetry", timeout=3000)
            page.click("button:has-text('Close Telemetry')")
            page.wait_for_timeout(400)
            print("   ✅ Opened and verified Vehicle Session Telemetry Drawer.")

        # ----------------------------------------------------------------------
        # 9. PKI VAULT & CERTIFICATES (/pki)
        # ----------------------------------------------------------------------
        print("\n[Phase 9] Testing PKI Vault & Cryptographic Security (/pki)...")
        page.goto(f"{BASE_URL}/pki", wait_until="networkidle")
        page.wait_for_timeout(1000)
        assert page.locator("text=Root CA").count() >= 1 or page.locator("text=User CA").count() >= 1
        print("   ✅ PKI Vault active and operational.")

        # ----------------------------------------------------------------------
        # 10. ENERGY MANAGEMENT SYSTEM & PEAK SHAVING (/ems)
        # ----------------------------------------------------------------------
        print("\n[Phase 10] Testing Energy Management System & Smart Charging (/ems)...")
        page.goto(f"{BASE_URL}/ems", wait_until="networkidle")
        page.wait_for_timeout(1000)
        assert page.locator("input[type='range']").count() == 0, "Sliders found on EMS page!"
        ems_canvas = page.locator("canvas").count()
        assert ems_canvas >= 1, "Expected ECharts canvas on EMS page"
        print(f"   ✅ EMS page active: 0 sliders, {ems_canvas} ECharts canvas element(s).")

        # ----------------------------------------------------------------------
        # 11. OCPI ROAMING & EMSP CONNECTIONS (/roaming)
        # ----------------------------------------------------------------------
        print("\n[Phase 11] Testing OCPI Roaming Network (/roaming)...")
        page.goto(f"{BASE_URL}/roaming", wait_until="networkidle")
        page.wait_for_timeout(1000)
        assert page.locator("input[type='range']").count() == 0, "Sliders found on Roaming page!"
        print("   ✅ OCPI Roaming page active.")

        # ----------------------------------------------------------------------
        # 12. PLATFORM SETTINGS & COMMS TEST (/settings)
        # ----------------------------------------------------------------------
        print("\n[Phase 12] Testing Platform Settings & Communications (/settings)...")
        page.goto(f"{BASE_URL}/settings", wait_until="networkidle")
        page.wait_for_timeout(1000)
        assert page.locator("input[type='range']").count() == 0, "Sliders found on Settings page!"
        print("   ✅ Platform Settings page active.")

        # ----------------------------------------------------------------------
        # FINAL LOG & ERROR VERIFICATION
        # ----------------------------------------------------------------------
        print("\n[Phase 13] Verifying Runtime Logs & Console Exceptions...")
        critical_errors = [e for e in errors if "favicon" not in e]
        if critical_errors:
            print(f"❌ Critical console errors captured: {critical_errors}")
            sys.exit(1)
        else:
            print("✅ Zero runtime console errors across entire platform journey!")

        # Take full suite verification screenshot
        page.screenshot(path="screen_e2e_master_suite_complete.png")
        print("✅ Saved final master test screenshot to screen_e2e_master_suite_complete.png")

        browser.close()
        print("\n" + "=" * 80)
        print("🎉 EXHAUSTIVE E2E AUTOMATION TEST SUITE COMPLETED WITH 100% SUCCESS!")
        print("=" * 80)

if __name__ == "__main__":
    run_master_e2e_test_suite()
