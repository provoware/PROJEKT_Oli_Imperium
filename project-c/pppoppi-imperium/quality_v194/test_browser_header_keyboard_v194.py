#!/usr/bin/env python3
"""Echter 175/200-Prozent-Chromium-Zoom: Kopfzeile und Hilfedialog per Tastatur."""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from campaign_keyboard_audit_v194 import (
    tab_to_target, press_tab_focused, assert_computed_focus_indicator,
)
from campaign_keyboard_reverse_v194 import verify_reverse_tab_roundtrip
from test_browser_native_zoom_v194 import (
    extension_at, wait_for_zoom_worker, set_real_zoom,
)

HERE = Path(__file__).resolve().parent


def require_toggle_change(before, after, selector):
    if before not in ("true", "false") or after not in ("true", "false"):
        raise AssertionError("Ungueltiger aria-pressed-Zustand: " + selector)
    if before == after:
        raise AssertionError("Enter hat Schalter nicht umgeschaltet: " + selector)


def require_motion_preference(pressed, stored, label):
    """ARIA, lokale Einstellung und sichtbare Beschriftung muessen uebereinstimmen."""
    if pressed not in ("true", "false") or stored != pressed:
        raise AssertionError("Bewegung: Zustand nicht konsistent gespeichert")
    expected = "Bewegung an" if pressed == "true" else "Bewegung aus"
    if expected not in label:
        raise AssertionError("Bewegung: Schaltertext widerspricht dem Zustand")


def keyboard_activate(page, selector):
    steps = tab_to_target(page, selector)
    verify_reverse_tab_roundtrip(page, selector)
    assert_computed_focus_indicator(page.locator(selector), selector)
    press_tab_focused(page, selector)
    return steps


def run(zoom):
    if zoom not in (175, 200):
        raise ValueError("Nur 175 und 200 Prozent sind fuer diesen Pflichtpfad zulaessig")
    with tempfile.TemporaryDirectory(prefix="oli-header-keyboard-") as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        build = json.loads((preview / "BUILD_INFO.json").read_text(encoding="utf-8"))
        if build.get("sourceFiles") != 110:
            raise AssertionError("110 Originaldateien nicht nachgewiesen")
        extension = root / "zoom-extension"
        extension_at(extension)
        errors, external = [], []
        with sync_playwright() as pw:
            context = pw.chromium.launch_persistent_context(
                str(root / "profile"), channel="chromium", headless=True,
                viewport={"width": 800, "height": 600}, reduced_motion="reduce",
                args=["--disable-extensions-except=" + str(extension),
                      "--load-extension=" + str(extension)],
            )
            try:
                page = context.new_page()
                page.set_default_timeout(15000)
                page.on("pageerror", lambda err: errors.append(str(err)))
                page.on("request", lambda req: external.append(req.url)
                        if req.url.startswith(("http://", "https://")) else None)
                page.goto((preview / "index.html").as_uri(), wait_until="load")
                page.wait_for_function("window.NeoEconomy && window.NeoEconomy.endstate")
                worker = wait_for_zoom_worker(context)
                baseline = set_real_zoom(worker, page.url, 1.0)
                if abs(baseline["factor"] - 1.0) >= 0.01:
                    raise AssertionError("Basiszoom nicht 100 Prozent")
                page.wait_for_function("innerWidth >= 790")
                width = page.evaluate("innerWidth")
                dpr = page.evaluate("devicePixelRatio")
                actual = set_real_zoom(worker, page.url, zoom / 100)
                if abs(actual["factor"] - zoom / 100) >= 0.01:
                    raise AssertionError("Echter Browserzoom nicht gesetzt")
                page.wait_for_function(
                    "({factor,dpr}) => devicePixelRatio >= dpr*(factor-0.05)",
                    arg={"factor": zoom / 100, "dpr": dpr})
                if page.evaluate("innerWidth") >= width * 0.65:
                    raise AssertionError("Browserzoom nicht im Layout wirksam")
                if page.evaluate("NeoEconomy.getState()") is not None:
                    raise AssertionError("Unerwarteter Spielstand vor Tastaturpruefung")
                checked = []
                for selector in ("#zonesBtn", "#soundBtn"):
                    button = page.locator(selector)
                    for _ in range(2):
                        before = button.get_attribute("aria-pressed")
                        steps = keyboard_activate(page, selector)
                        after = button.get_attribute("aria-pressed")
                        require_toggle_change(before, after, selector)
                        checked.append({"selector": selector, "tabs": steps,
                                        "before": before, "after": after})
                motion = page.locator("#motionBtn")
                for _ in range(2):
                    before = motion.get_attribute("aria-pressed")
                    steps = keyboard_activate(page, "#motionBtn")
                    after = motion.get_attribute("aria-pressed")
                    require_toggle_change(before, after, "#motionBtn")
                    stored = page.evaluate("localStorage.getItem('pppoppi-motion-enabled')")
                    require_motion_preference(after, stored, motion.inner_text())
                    checked.append({"selector": "#motionBtn", "tabs": steps,
                                    "before": before, "after": after,
                                    "preference_saved": True})
                steps = keyboard_activate(page, "#helpBtn")
                page.locator("#dialog").wait_for(state="visible")
                if not page.locator("#dialog").evaluate("el => el.open"):
                    raise AssertionError("Hilfedialog nicht geoeffnet")
                checked.append({"selector": "#helpBtn", "tabs": steps})
                steps = keyboard_activate(page, "#closeBtn")
                page.wait_for_function("!document.querySelector('#dialog').open")
                checked.append({"selector": "#closeBtn", "tabs": steps})
                saved_motion = motion.get_attribute("aria-pressed")
                page.reload(wait_until="load")
                page.wait_for_function("window.NeoEconomy && window.NeoEconomy.endstate")
                require_motion_preference(
                    page.locator("#motionBtn").get_attribute("aria-pressed"),
                    page.evaluate("localStorage.getItem('pppoppi-motion-enabled')"),
                    page.locator("#motionBtn").inner_text())
                if page.locator("#motionBtn").get_attribute("aria-pressed") != saved_motion:
                    raise AssertionError("Bewegungseinstellung nach Neustart verloren")
                if page.evaluate("NeoEconomy.getState()") is not None:
                    raise AssertionError("Tastaturpruefung hat einen Spielstand erzeugt")
                if page.evaluate("document.documentElement.scrollWidth > innerWidth + 2"):
                    raise AssertionError("Horizontaler Seitenueberlauf bei Browserzoom")
                if errors or external:
                    raise AssertionError("JavaScript-Fehler oder externe Anfrage: " +
                                         repr({"errors": errors, "external": external}))
                print("PASS: HEADER-KEYBOARD " + json.dumps({
                    "zoom": zoom, "viewport": "800x600", "controls": checked,
                    "external_requests": 0, "page_errors": 0,
                    "state_unchanged": True, "motion_reload_verified": True,
                }, ensure_ascii=False), flush=True)
            finally:
                context.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--zoom", type=int, required=True, choices=(175, 200))
    run(parser.parse_args().zoom)
