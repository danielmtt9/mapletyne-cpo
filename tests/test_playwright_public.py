from playwright.sync_api import sync_playwright

BASE_URL = "https://opencpo.mapletyne.com"
EMAIL = "daniel.a@mapletynetechnologies.com"
PASSWORD = "byoWkDX86ndK49$3"

def test_public():
    print(f"🚀 Running Playwright verification on public domain: {BASE_URL}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Step 1: Login
        print("1. Performing login on public domain...")
        page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        page.fill("#username", EMAIL)
        page.fill("#password", PASSWORD)
        page.click("#submit-btn")
        page.wait_for_timeout(2000)
        assert "/login" not in page.url, f"Login failed on public domain, url: {page.url}"
        print("   ✅ Logged in successfully on public domain!")

        # Step 2: Dashboard
        print("2. Verifying Dashboard on public domain...")
        page.goto(f"{BASE_URL}/", wait_until="networkidle")
        page.wait_for_timeout(1000)
        assert "OpenCPO Mission Control" in page.content() or "Dashboard" in page.content()
        print("   ✅ Public domain dashboard loaded cleanly!")

        browser.close()
        print("\n🎉 PUBLIC DOMAIN ACCESS FULLY RESTORED AND VERIFIED!")

if __name__ == "__main__":
    test_public()
