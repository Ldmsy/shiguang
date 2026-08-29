from pathlib import Path
import os
import sys

from playwright.sync_api import sync_playwright


def main() -> int:
    phase = os.environ.get("CAPTURE_PHASE", "current")
    port = os.environ.get("APP_PREVIEW_PORT", "4194")
    login_selector = os.environ.get("APP_LOGIN_SELECTOR", ".felt-login")
    output = Path(__file__).resolve().parents[1] / "build" / "visual-review" / phase
    output.mkdir(parents=True, exist_ok=True)
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
        page.goto(f"http://127.0.0.1:{port}", wait_until="networkidle")
        page.evaluate("localStorage.clear()")
        page.reload(wait_until="networkidle")
        page.locator(login_selector).wait_for(state="visible")
        page.screenshot(path=str(output / "00-login.png"), full_page=False)
        page.locator('[data-auth-view="register"]').click()
        page.screenshot(path=str(output / "00-register.png"), full_page=False)
        page.evaluate("state.loggedIn=true; state.profileSetup=true; render()")
        page.screenshot(path=str(output / "00-onboarding.png"), full_page=False)
        page.evaluate("state.profileSetup=false; state.loggedIn=false; state.authView='login'; render()")
        page.locator("[data-device-login]").click()
        page.locator(".workspace-shell").wait_for(state="visible")

        def reset() -> None:
            page.reload(wait_until="networkidle")
            page.locator(".workspace-shell").wait_for(state="visible")
            page.evaluate("window.scrollTo(0, 0)")

        def shot(name: str) -> None:
            page.wait_for_timeout(250)
            overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
            assert overflow <= 1, f"horizontal overflow on {name}: {overflow}px"
            page.screenshot(path=str(output / f"{name}.png"), full_page=False)

        def activate(selector: str) -> bool:
            locator = page.locator(selector).first
            if not locator.count():
                return False
            locator.evaluate("element => element.click()")
            return True

        shot("01-talk")
        page.locator('[data-action="toggle-navigation"]').first.click()
        shot("02-navigation")

        for name, tab in (("03-report", "report"), ("04-me", "me"), ("05-friend", "friend")):
            reset()
            activate(f'[data-tab="{tab}"]')
            shot(name)

        details = (
            ("06-profile-settings", "talk", "profile-settings"),
            ("07-privacy", "talk", "privacy"),
            ("08-export", "talk", "export"),
            ("09-monthly-report", "report", "full-report"),
            ("10-growth-card", "report", "card-0"),
            ("11-memory", "me", "memory"),
            ("12-vocabulary", "me", "vocabulary"),
            ("13-opportunity", "friend", "opportunity"),
            ("14-social-card", "friend", "profile-card"),
        )
        for name, tab, target in details:
            reset()
            activate(f'[data-tab="{tab}"]')
            if activate(f'[data-open="{target}"]'):
                shot(name)

        reset()
        page.locator('[data-action="camera"]').click()
        shot("15-camera-consent")

        reset()
        page.evaluate("state.sidebar=true; render()")
        shot("16-history")

        reset()
        activate('[data-tab="friend"]')
        activate('[data-open="opportunity"]')
        activate('[data-open="partners"]')
        shot("17-partners")
        if activate('[data-open="real-partner-0"]'):
            shot("18-partner-profile")

        reset()
        activate('[data-tab="friend"]')
        activate('[data-open="opportunity"]')
        activate('[data-open="partners"]')
        if activate('[data-open="real-partner-chat-0"]'):
            shot("19-partner-chat")

        reset()
        activate('[data-tab="me"]')
        if activate('.ability-bubble'):
            shot("20-ability-modal")

        reset()
        page.evaluate("state.moodSheet=true; render()")
        shot("21-mood-sheet")

        reset()
        page.evaluate("state.report=true; render()")
        shot("22-report-sheet")

        browser.close()

    if browser_errors:
        print("Browser errors:", *browser_errors, sep="\n- ", file=sys.stderr)
        return 1
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
