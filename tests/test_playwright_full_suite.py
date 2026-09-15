from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:34080"
EMAIL = "daniel.a@mapletynetechnologies.com"
PASSWORD = "byoWkDX86ndK49$3"

PAGES = [
    ("/", "Dashboard"),
    ("/chargers", "Chargers"),
    ("/sessions", "Sessions"),
    ("/tariffs", "Tariffs"),
    ("/fleet", "RFID & Fleet"),
    ("/vehicles", "Vehicles"),
    ("/pki", "PKI Vault"),
    ("/ems", "Energy"),
    ("/roaming", "Roaming"),
    ("/settings", "Settings"),
]

def run_suite():
    print(f"🚀 Running Full Authenticated Playwright Suite on {BASE_URL}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Step 1: Login
        print("1. Performing login...")
        page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        page.fill("#username", EMAIL)
        page.fill("#password", PASSWORD)
        page.click("#submit-btn")
        page.wait_for_timeout(1500)
        assert page.url == f"{BASE_URL}/" or page.url == f"{BASE_URL}", f"Login failed: {page.url}"
        print("   ✅ Logged in successfully!")

        # Step 2: Visit each page
        for path, name in PAGES:
            print(f"2. Testing page '{name}' ({path})...")
            page.goto(f"{BASE_URL}{path}", wait_until="networkidle")
            page.wait_for_timeout(1000)
            assert page.url.endswith(path) or page.url == f"{BASE_URL}/", f"Page redirect failure on {path}: {page.url}"
            assert "/login" not in page.url, f"Unauthorized redirect to login occurred on {path}"
            page.screenshot(path=f"screen_{name.lower().replace(' ', '_').replace('&', 'and')}.png")
            print(f"   ✅ {name} loaded cleanly at {page.url}")

        browser.close()
        print("\n🎉 ALL 10 PAGES TESTED AND VERIFIED IN PLAYWRIGHT!")

if __name__ == "__main__":
    run_suite()
