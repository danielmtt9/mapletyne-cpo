import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:34080"
EMAIL = "daniel.a@mapletynetechnologies.com"
PASSWORD = "byoWkDX86ndK49$3"

def run_test():
    print(f"Testing login at {BASE_URL}/login with Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Step 1: Open /login
        print("1. Navigating to /login")
        page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        page.screenshot(path="login_page_loaded.png")
        print("   Title:", page.title())

        # Step 2: Test invalid login
        print("2. Testing invalid password rejection")
        page.fill("#username", EMAIL)
        page.fill("#password", "WrongPassword999!")
        page.click("#submit-btn")
        page.wait_for_timeout(1000)
        page.screenshot(path="login_invalid_submitted.png")
        error_text = page.locator("#error-banner").inner_text()
        print("   Error banner:", error_text)
        assert "Invalid" in error_text or "credentials" in error_text, f"Unexpected error text: {error_text}"
        print("   ✅ Invalid credentials correctly rejected!")

        # Step 3: Test valid login
        print("3. Testing valid password authentication")
        page.fill("#username", EMAIL)
        page.fill("#password", PASSWORD)
        page.click("#submit-btn")
        page.wait_for_timeout(2000)
        page.screenshot(path="login_success_landed.png")
        print("   Current URL:", page.url)
        jwt = page.evaluate("localStorage.getItem('opencpo_admin_jwt')")
        print("   Stored JWT:", jwt[:30] + "..." if jwt else "None")
        assert jwt and len(jwt) > 20, "JWT token was not stored in localStorage"
        assert page.url == f"{BASE_URL}/" or page.url == f"{BASE_URL}", f"Expected landing on {BASE_URL}/, got {page.url}"
        print("   ✅ Valid credentials successfully authenticated and redirected to Dashboard!")

        # Step 4: Test session persistence on reload
        print("4. Testing session persistence on page reload")
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(1000)
        assert page.url == f"{BASE_URL}/" or page.url == f"{BASE_URL}", "Session lost on reload"
        print("   ✅ Session persistent on reload!")

        browser.close()
        print("\n🎉 ALL PLAYWRIGHT LOGIN TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_test()
