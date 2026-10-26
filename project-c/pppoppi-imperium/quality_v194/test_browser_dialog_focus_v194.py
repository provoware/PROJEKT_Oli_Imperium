#!/usr/bin/env python3
"""Lese-Audit: Tab-Reichweite und Fokus aller aktiven Dialogelemente.

Keine Spielaktion wird ausgelöst. Szenenwahl per vorhandener Navigations-API;
die echte Tab-Taste durchläuft alle sichtbaren, aktivierten Bedienelemente.
CSS-200 ist KEIN nativer Browserzoom; Kontrast wird nicht visuell abgenommen.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
MODES = (("800x600", 800, 600), ("CSS-200", 400, 300))
CONTROLS = "button, a[href], input, select, textarea, [tabindex]"


def check(label, ok):
    print(("PASS: " if ok else "FAIL: ") + label, flush=True)
    if not ok:
        raise AssertionError(label)


def tab_to(page, selector, limit=240):
    target = page.locator(selector)
    if target.count() != 1 or not target.is_visible() or not target.is_enabled():
        return False
    for _ in range(limit):
        if target.evaluate("(el) => document.activeElement === el"):
            return True
        page.keyboard.press("Tab")
    return False


def inventory(page):
    """Nur tatsaechlich sichtbare, aktivierte Tab-Kandidaten im offenen Dialog."""
    return page.evaluate("""(selector) => {
        const dialog = document.querySelector('#dialog');
        const elements = [...dialog.querySelectorAll(selector)];
        const seen = new Set();
        const eligible = elements.filter(el => {
            if (seen.has(el)) return false;
            seen.add(el);
            const style = getComputedStyle(el);
            return el.tabIndex >= 0 && !el.disabled &&
                el.getClientRects().length > 0 &&
                style.display !== 'none' && style.visibility !== 'hidden' &&
                !el.closest('[inert]');
        });
        return eligible.map((el, i) => {
            el.dataset.qaAuditIndex = String(i);
            const labels = el.labels ? [...el.labels].map(x => x.textContent.trim()) : [];
            const name = el.getAttribute('aria-label') ||
                el.getAttribute('title') || labels.join(' ') ||
                el.innerText || el.getAttribute('placeholder') || el.value || '';
            return {id: String(i), tag: el.tagName.toLowerCase(),
                name: String(name).trim().slice(0, 80)};
        });
    }""", CONTROLS)


def focus_details(page):
    return page.evaluate("""() => {
        const el = document.activeElement;
        if (!el) return null;
        const style = getComputedStyle(el);
        return {id: el.dataset.qaAuditIndex ?? null,
            visible: el.matches(':focus-visible'),
            ring: (style.outlineStyle !== 'none' &&
                parseFloat(style.outlineWidth) > 0) || style.boxShadow !== 'none'};
    }""")


def audit_scene(page, scene):
    page.evaluate("(name) => PPNavigation191.open(name)", scene)
    check(scene + ": Dialog geoeffnet",
          page.locator("#dialog").evaluate("(el) => el.open"))
    before = page.evaluate("JSON.stringify(NeoEconomy.getState())")
    expected = inventory(page)
    check(scene + ": mindestens ein Tab-Ziel", len(expected) >= 1)
    check(scene + ": Schliessen per Tab", tab_to(page, "#closeBtn"))
    observed, rings, focus_visible = set(), set(), set()
    # Ein kompletter Tab-Kreis plus Reserve. Es wird kein Enter ausgeloest.
    for _ in range(2 * len(expected) + 12):
        current = focus_details(page)
        if current and current["id"] is not None:
            observed.add(current["id"])
            if current["ring"]:
                rings.add(current["id"])
            if current["visible"]:
                focus_visible.add(current["id"])
        if len(observed) == len(expected):
            break
        page.keyboard.press("Tab")
    missing = [item for item in expected if item["id"] not in observed]
    no_ring = [item for item in expected if item["id"] not in rings]
    no_focus_visible = [item for item in expected if item["id"] not in focus_visible]
    unnamed = [item for item in expected if not item["name"]]
    check(scene + ": Spielstand unveraendert",
          before == page.evaluate("JSON.stringify(NeoEconomy.getState())"))
    return {"scene": scene, "controls": len(expected),
            "reached": len(observed), "missing": missing,
            "no_ring": no_ring, "no_focus_visible": no_focus_visible,
            "unnamed": unnamed}


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-dialog-focus-") as temp:
        preview = Path(temp) / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        check("Isolierte, hashgepruefte Offline-Vorschau",
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
                        page.on("pageerror", lambda err: errors.append(str(err)))
                        page.on("request", lambda req: external.append(req.url)
                                if req.url.startswith(("http://", "https://")) else None)
                        page.goto((preview / "index.html").as_uri(), wait_until="load")
                        page.wait_for_function("typeof PPNavigation191 === 'object'")
                        check(label + ": Startknopf per Tab", tab_to(page, "#startGame"))
                        page.keyboard.press("Enter")
                        page.locator("#econMode").wait_for(state="visible")
                        check(label + ": neue Partie per Tab",
                              tab_to(page, '[data-ui="newgame"]'))
                        page.keyboard.press("Enter")
                        page.wait_for_function("NeoEconomy.getState() !== null")
                        scenes = page.evaluate("PPNavigation191.getScenes()")
                        check(label + ": mindestens 35 eindeutige Szenen",
                              len(scenes) >= 35 and len(set(scenes)) == len(scenes))
                        rows = [audit_scene(page, scene) for scene in scenes]
                        missing = [x for row in rows for x in row["missing"]]
                        without_ring = [x for row in rows for x in row["no_ring"]]
                        unnamed = [x for row in rows for x in row["unnamed"]]
                        no_focus = [x for row in rows for x in row["no_focus_visible"]]
                        summary = {
                            "mode": label, "scenes": len(rows),
                            "controls": sum(row["controls"] for row in rows),
                            "reached": sum(row["reached"] for row in rows),
                            "missing": len(missing), "without_ring": len(without_ring),
                            "without_focus_visible": len(no_focus),
                            "unnamed": len(unnamed),
                            "issues": [row for row in rows if
                                       row["missing"] or row["no_ring"] or
                                       row["no_focus_visible"] or row["unnamed"]][:15],
                            "native_zoom": "NOT_TESTED",
                            "visual_contrast": "NOT_TESTED"
                        }
                        print("DIALOG-FOCUS-AUDIT:",
                              json.dumps(summary, ensure_ascii=False), flush=True)
                        check(label + ": keine JavaScript-Fehler", not errors)
                        check(label + ": keine externen HTTP-Anfragen", not external)
                        check(label + ": alle Dialogelemente per Tab erreichbar",
                              not missing)
                        check(label + ": Fokus per :focus-visible",
                              not no_focus)
                        results.append(summary)
                    finally:
                        context.close()
            finally:
                browser.close()
        check("Beide Bildschirmmodi tatsaechlich geprueft", len(results) == 2)
        print("ERGEBNIS:", json.dumps(results, ensure_ascii=False), flush=True)
        print("GRENZE: Keine Aktionen innerhalb der Szenen ausgeloest. "
              "Keine native Browserzoom- oder Kontrast-Sichtabnahme. "
              "BED-02, BED-03, BAR-01, BAR-02 bleiben BLOCKED.", flush=True)


if __name__ == "__main__":
    main()
