import sys
from playwright.sync_api import sync_playwright

BASE_URL = "https://opencpo.mapletyne.com"

def run_suite():
    print("==================================================")
    print("🚀 Running OpenCPO Playwright End-to-End Test Suite")
    print(f"Target URL: {BASE_URL}")
    print("==================================================\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ── Test 1: Invalid Password Error Display ──────────────────
        print("▶ Test 1: Testing invalid password handling & error banner...")
        context1 = browser.new_context()
        page1 = context1.new_page()
        page1.goto(f"{BASE_URL}/login", wait_until="networkidle")
        page1.fill("#username", "daniel.a@mapletynetechnologies.com")
        page1.fill("#password", "WrongPassword123!")
        page1.click("#submit-btn")
        page1.wait_for_load_state("networkidle")
        error_el = page1.locator("text=Invalid email or password")
        assert error_el.is_visible(), "Error message should be visible on failed login"
        print("  ✅ Invalid password properly rejected and error banner displayed.\n")
        context1.close()

        # ── Test 2: Show/Hide Password Toggle ───────────────────────
        print("▶ Test 2: Testing password visibility toggle...")
        context2 = browser.new_context()
        page2 = context2.new_page()
        page2.goto(f"{BASE_URL}/login", wait_until="networkidle")
        pw_input = page2.locator("#password")
        toggle_btn = page2.locator("button:has-text('Show')")
        assert pw_input.get_attribute("type") == "password"
        toggle_btn.click()
        assert pw_input.get_attribute("type") == "text"
        page2.locator("button:has-text('Hide')").click()
        assert pw_input.get_attribute("type") == "password"
        print("  ✅ Show/Hide toggle switches input between 'password' and 'text'.\n")
        context2.close()

        # ── Test 3: Successful Login with Primary Password ───────────
        print("▶ Test 3: Testing successful login with primary credentials...")
        context3 = browser.new_context()
        page3 = context3.new_page()
        page3.goto(f"{BASE_URL}/login", wait_until="networkidle")
        page3.fill("#username", "daniel.a@mapletynetechnologies.com")
        page3.fill("#password", "OpenCPO2026!")
        page3.click("#submit-btn")
        page3.wait_for_load_state("networkidle")
        assert page3.url == f"{BASE_URL}/", f"Expected {BASE_URL}/, got {page3.url}"
        assert "Dashboard" in page3.title()
        print(f"  ✅ Authenticated successfully -> Landed on '{page3.title()}' at {page3.url}\n")

        # ── Test 4: Session Persistence Across Page Reloads ──────────
        print("▶ Test 4: Testing 30-day session persistence across page reloads...")
        page3.reload(wait_until="networkidle")
        assert page3.url == f"{BASE_URL}/", "User must remain on dashboard after reload"
        print("  ✅ Session persisted cleanly on page reload without login redirect.\n")

        # ── Test 5: Top Navigation Tabs ─────────────────────────────
        print("▶ Test 5: Testing Top Navigation links while logged in...")
        
        # Test Branding Studio link
        page3.goto(f"{BASE_URL}/branding", wait_until="networkidle")
        assert "Branding" in page3.title() or page3.url.endswith("/branding")
        print(f"  ✅ Branding Studio accessible: {page3.url}")

        # Test Documentation link
        page3.goto(f"{BASE_URL}/docs", wait_until="networkidle")
        assert "Documentation" in page3.title() or page3.url.endswith("/docs")
        print(f"  ✅ Documentation accessible: {page3.url}")

        # Test Logout
        print("\n▶ Test 6: Testing logout flow...")
        page3.goto(f"{BASE_URL}/logout", wait_until="networkidle")
        assert "/login" in page3.url, f"Expected redirect to /login, got {page3.url}"
        print("  ✅ Logout successful -> Redirected back to login page.\n")
        context3.close()

        # ── Test 7: Legacy Autofill Password Acceptance ─────────────
        print("▶ Test 7: Testing login with legacy autofill password (ZPn2bUrFWu2@tyYU)...")
        context4 = browser.new_context()
        page4 = context4.new_page()
        page4.goto(f"{BASE_URL}/login", wait_until="networkidle")
        page4.fill("#username", "daniel.a@mapletynetechnologies.com")
        page4.fill("#password", "ZPn2bUrFWu2@tyYU")
        page4.click("#submit-btn")
        page4.wait_for_load_state("networkidle")
        assert page4.url == f"{BASE_URL}/", f"Expected {BASE_URL}/, got {page4.url}"
        print(f"  ✅ Legacy autofill password authenticated successfully -> {page4.url}\n")
        context4.close()

        browser.close()
        print("==================================================")
        print("🎉 ALL PLAYWRIGHT BROWSER TESTS PASSED (7/7)!")
        print("==================================================")

if __name__ == "__main__":
    run_suite()
