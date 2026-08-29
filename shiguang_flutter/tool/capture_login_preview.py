from pathlib import Path
import os
import sys

from playwright.sync_api import sync_playwright


def main() -> int:
    output = Path(__file__).resolve().parents[1] / "build" / "login-felt-v1.png"
    output.parent.mkdir(parents=True, exist_ok=True)
    browser_errors: list[str] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page.on("pageerror", lambda error: browser_errors.append(str(error)))
        port = os.environ.get("LOGIN_PREVIEW_PORT", "4173")
        page.goto(f"http://127.0.0.1:{port}", wait_until="networkidle")
        page.evaluate("localStorage.clear()")
        page.reload(wait_until="networkidle")
        page.locator(".felt-login").wait_for(state="visible")

        assert page.locator(".login-brand-row b").inner_text() == "我是谁"
        assert page.locator('[data-login-method="password"]').is_visible()
        assert page.locator('[data-login-method="code"]').is_visible()
        assert page.locator('[data-action="login"]').is_visible()

        page.locator('[data-login-method="code"]').click()
        assert page.locator(".verify-field").is_visible()
        page.locator('[data-login-method="password"]').click()
        assert page.locator(".password-field").is_visible()

        page.screenshot(path=str(output), full_page=False)
        page.locator("[data-device-login]").click()
        page.locator(".workspace-shell").wait_for(state="visible")
        browser.close()

    if browser_errors:
        print("Browser errors:", *browser_errors, sep="\n- ", file=sys.stderr)
        return 1
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
