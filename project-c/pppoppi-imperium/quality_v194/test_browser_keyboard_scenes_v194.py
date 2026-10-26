#!/usr/bin/env python3
"""Chromium-Tastaturtest fuer alle Spielszenen. CSS-Viewports sind kein nativer Zoom."""
import json
import subprocess
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
MODES = (("800x600", 800, 600), ("CSS-175", 457, 343), ("CSS-200", 400, 300))


def check(label, passed):
    print(("PASS: " if passed else "FAIL: ") + label, flush=True)
    if not passed:
        raise AssertionError(label)


def tab_to(page, selector, max_tabs=160):
    """Nur echte Tab-Tastendruecke, niemals locator.focus()."""
    target = page.locator(selector)
    if target.count() != 1 or not target.is_visible() or not target.is_enabled():
        return False
    for _ in range(max_tabs + 1):
        if target.evaluate("(el) => document.activeElement === el"):
            return True
        page.keyboard.press("Tab")
    return False


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-keyboard-") as temp:
        target = Path(temp) / "preview"
        subprocess.run(
            ["node", str(HERE / "build.cjs"), str(target)],
            check=True, timeout=90, capture_output=True, text=True,
        )
        check("Isolierte Offline-Vorschau gebaut", (target / "index.html").is_file())
        results = []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                for label, width, height in MODES:
                    context = browser.new_context(
                        viewport={"width": width, "height": height},
                        reduced_motion="reduce",
                    )
                    errors, external = [], []
                    try:
                        page = context.new_page()
                        page.set_default_timeout(12000)
                        page.on("pageerror", lambda err: errors.append(str(err)))
                        page.on("request", lambda request: external.append(request.url)
                                if request.url.startswith(("http://", "https://")) else None)
                        page.goto((target / "index.html").as_uri(), wait_until="load")
                        page.wait_for_function("typeof PPNavigation191 === 'object'")
                        check(label + ": Startknopf per Tab", tab_to(page, "#startGame"))
                        page.keyboard.press("Enter")
                        page.locator("#econMode").wait_for(state="visible")
                        check(label + ": neue Partie per Tab", tab_to(page, '[data-ui="newgame"]'))
                        page.keyboard.press("Enter")
                        page.wait_for_function("NeoEconomy.getState() !== null")
                        before = page.evaluate("JSON.stringify(NeoEconomy.getState())")
                        scenes = page.evaluate("PPNavigation191.getScenes()")
                        check(label + ": mindestens 35 eindeutige Szenen",
                              len(scenes) >= 35 and len(scenes) == len(set(scenes)))
                        closed, visible, ring = 0, 0, 0
                        for scene in scenes:
                            page.evaluate("(id) => PPNavigation191.open(id)", scene)
                            check(label + "/" + scene + ": Dialog offen",
                                  page.locator("#dialog").evaluate("(el) => el.open"))
                            check(label + "/" + scene + ": Schliessen mit Tab erreichbar",
                                  tab_to(page, "#closeBtn"))
                            focus = page.evaluate("""() => {
                                const el = document.activeElement;
                                const s = getComputedStyle(el);
                                return {
                                    keyboard: el.matches(':focus-visible'),
                                    ring: (s.outlineStyle !== 'none'
                                           && parseFloat(s.outlineWidth) > 0)
                                          || s.boxShadow !== 'none'
                                };
                            }""")
                            visible += int(focus["keyboard"])
                            ring += int(focus["ring"])
                            check(label + "/" + scene + ": Tastaturfokus markiert",
                                  focus["keyboard"])
                            page.keyboard.press("Enter")
                            check(label + "/" + scene + ": Enter schliesst Dialog",
                                  not page.locator("#dialog").evaluate("(el) => el.open"))
                            closed += 1
                        check(label + ": Navigation veraendert Spielstand nicht",
                              before == page.evaluate("JSON.stringify(NeoEconomy.getState())"))
                        page.evaluate("PPNavigation191.open('computer')")
                        page.evaluate("PPNavigation191.open('market')")
                        check(label + ": Markt geoeffnet",
                              page.evaluate("PPNavigation191.current()") == "market")
                        page.keyboard.press("Alt+ArrowLeft")
                        check(label + ": Alt+Links kehrt zum Computer zurueck",
                              page.evaluate("PPNavigation191.current()") == "computer")
                        check(label + ": Uebersicht per Tab erreichbar",
                              tab_to(page, '#v191-navigator [data-nav="quick"]'))
                        page.keyboard.press("Enter")
                        check(label + ": Uebersicht per Enter",
                              page.evaluate("PPNavigation191.current()") == "quick")
                        page.keyboard.press("Shift+Tab")
                        check(label + ": Rueckwaerts-Tab zum Buero",
                              page.evaluate("""() => document.activeElement?.matches(
                                  '#v191-navigator [data-nav="desk"]') === true"""))
                        page.keyboard.press("Enter")
                        check(label + ": Buero schliesst den Dialog",
                              not page.locator("#dialog").evaluate("(el) => el.open"))
                        check(label + ": keine JavaScript-Fehler", not errors)
                        check(label + ": keine externen HTTP-Anfragen", not external)
                        result = {
                            "viewport": [width, height],
                            "scenes": len(scenes),
                            "tab_enter_close": closed,
                            "focus_visible": visible,
                            "computed_outline_or_shadow": ring,
                            "visual_focus_status": "DIAGNOSE_ONLY",
                            "native_zoom": "NOT_TESTED",
                        }
                        results.append(result)
                        print("KEYBOARD-AUDIT:", json.dumps(result, ensure_ascii=False), flush=True)
                    finally:
                        context.close()
            finally:
                browser.close()
        print("ERGEBNIS:", json.dumps(results, ensure_ascii=False), flush=True)
        print("GRENZE: Szenen programmatisch geoeffnet; nicht alle Spielaktionen "
              "per Tastatur geprueft. CSS-Viewport ist kein nativer Zoom. "
              "BED-02, BED-03, BAR-01 bleiben BLOCKED.", flush=True)


if __name__ == "__main__":
    main()
