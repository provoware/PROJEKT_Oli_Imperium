#!/usr/bin/env python3
"""Native Escape-Schliessung und Fokus-Rueckkehr im Offline-Chromium.

Die Szenen-Inventur verwendet die bestehende Navigationsschnittstelle;
Help/Quick werden zusaetzlich durch echte Tab- und Enter-Tasten geoeffnet.
Kein nativer Browserzoom und keine vollstaendige Spielaktionsabnahme.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
MODES = (("800x600", 800, 600), ("CSS-200", 400, 300))


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def tab_to(page, selector, max_tabs=240):
    target = page.locator(selector)
    if target.count() != 1 or not target.is_visible() or not target.is_enabled():
        return False
    for _ in range(max_tabs + 1):
        if target.evaluate("el => document.activeElement === el"):
            return True
        page.keyboard.press("Tab")
    return False


def escape_dialog(page, label):
    check(label + ": Dialog geoeffnet",
          page.locator("#dialog").evaluate("el => el.open"))
    page.evaluate("""() => {
        window.__qaEscapeClosed = false;
        document.querySelector('#dialog').addEventListener('close',
            () => { window.__qaEscapeClosed = true; }, {once: true});
    }""")
    page.keyboard.press("Escape")
    page.wait_for_function("window.__qaEscapeClosed === true")
    check(label + ": Escape schliesst nativen Dialog",
          not page.locator("#dialog").evaluate("el => el.open"))
    check(label + ": Navigationshistorie nach Schliessen leer",
          page.evaluate("PPNavigation191.getTrail().length") == 0)


def test_viewport(page, label):
    check(label + ": Startknopf mit Tab", tab_to(page, "#startGame"))
    page.keyboard.press("Enter")
    page.locator("#econMode").wait_for(state="visible")
    check(label + ": neue Partie mit Tab", tab_to(page, '[data-ui="newgame"]'))
    page.keyboard.press("Enter")
    page.wait_for_function("NeoEconomy.getState() !== null")
    before = page.evaluate("JSON.stringify(NeoEconomy.getState())")
    scenes = page.evaluate("PPNavigation191.getScenes()")
    check(label + ": mindestens 35 unterschiedliche Szenen",
          len(scenes) >= 35 and len(scenes) == len(set(scenes)))
    for scene in scenes:
        page.evaluate("scene => PPNavigation191.open(scene)", scene)
        escape_dialog(page, label + "/" + scene)
        check(label + "/" + scene + ": Wirtschaftszustand unveraendert",
              page.evaluate("JSON.stringify(NeoEconomy.getState())") == before)
    for selector in ("#helpBtn", "#quickBtn"):
        check(label + "/" + selector + ": Ausloeser per Tab erreichbar",
              tab_to(page, selector))
        check(label + "/" + selector + ": sichtbarer Tastaturfokus",
              page.evaluate("document.activeElement.matches(':focus-visible')"))
        page.keyboard.press("Enter")
        escape_dialog(page, label + "/" + selector + ": Tastaturoeffnung")
        check(label + "/" + selector + ": Fokus zum Ausloeser zurueck",
              page.locator(selector).evaluate("el => document.activeElement === el"))
    check(label + ": Wirtschaftskern weiterhin gueltig",
          page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)
    check(label + ": Spielstand nach allen Dialogen identisch",
          page.evaluate("JSON.stringify(NeoEconomy.getState())") == before)
    return {"viewport": label, "scenes_escape_closed": len(scenes),
            "keyboard_openers_focus_restored": 2,
            "native_browser_zoom": "NOT_TESTED",
            "complete_keyboard_gameplay": "NOT_TESTED"}


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-keyboard-escape-") as temp:
        preview = Path(temp) / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        check("Hashgepruefte Offline-Vorschau erstellt",
              (preview / "index.html").is_file())
        results = []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                for label, width, height in MODES:
                    context = browser.new_context(
                        viewport={"width": width, "height": height},
                        reduced_motion="reduce")
                    errors, external = [], []
                    try:
                        page = context.new_page()
                        page.set_default_timeout(12000)
                        page.on("pageerror", lambda error: errors.append(str(error)))
                        page.on("request", lambda request: external.append(request.url)
                                if request.url.startswith(("http://", "https://")) else None)
                        page.goto((preview / "index.html").as_uri(), wait_until="load")
                        page.wait_for_function("typeof PPNavigation191 === 'object'")
                        results.append(test_viewport(page, label))
                        check(label + ": keine JavaScript-Fehler", not errors)
                        check(label + ": keine externen HTTP-Anfragen", not external)
                    finally:
                        context.close()
            finally:
                browser.close()
        check("Beide CSS-Bildbereiche geprueft", len(results) == 2)
        print("ESCAPE-AUDIT:", json.dumps(results, ensure_ascii=False), flush=True)
        print("GRENZE: Szeneninventur per API, zwei echte Tastaturoeffnungen. "
              "Kein nativer Zoom, kein Fokuskontrast und keine Gesamtfreigabe.", flush=True)


if __name__ == "__main__":
    main()
