#!/usr/bin/env python3
"""Dreistufiges Bohr-Minispiel bei echtem Chromium-Tab-Zoom 175/200 %.

Ausschliesslich technische Teilpruefung: keine Originalregel- oder Releasefreigabe.
Spielaktionen und Druckregler werden nur mit echten Tastatureingaben bedient.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

from test_browser_keyboard_drill_v194 import activate, check, state, tab_to
from test_browser_native_zoom_minigames_v194 import layout_diagnostic
from test_browser_native_zoom_v194 import extension_at, set_real_zoom

HERE = Path(__file__).resolve().parent
CLAIM = "BERLIN-1"
ZOOMS = (1.75, 2.0)


def valid(page, label):
    check(label + ": Wirtschaftszustand gueltig",
          page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)


def layout(page, label):
    metrics = layout_diagnostic(page, label)
    check(label + ": kein horizontaler Ueberlauf",
          metrics["horizontal_overflow"] <= 2)
    check(label + ": Schliessen-Knopf im Bildbereich",
          metrics["closeVisible"])
    return metrics


def run_drill(page, label):
    for action in ("SURVEY", "BUY"):
        page.evaluate("NeoEconomy.open('claim')")
        activate(page, f'[data-econ="{action}"][data-claim="{CLAIM}"]',
                 label + ": " + action)
        valid(page, label + ": " + action)
    check(label + ": eigenes Feld",
          state(page)["claims"][CLAIM]["owner"] == "H1")
    page.evaluate("NeoEconomy.open('workshop')")
    activate(page, f'[data-econ="DRILL_SELF_START"][data-claim="{CLAIM}"]',
             label + ": Bohrspiel starten")
    check(label + ": Bohrspiel aktiv",
          state(page)["minigame"]["kind"] == "DRILL")
    layouts = [layout(page, label + ": vor Abschnitt 1")]
    targets = []
    for stage in range(3):
        current = state(page)
        check(label + f": Abschnitt {stage + 1} aktiv",
              current["minigame"] is not None
              and current["minigame"]["stage"] == stage)
        target = page.evaluate(
            "NeoEconomy.engine.target(NeoEconomy.getState(), NeoEconomy.getState().minigame)"
        )
        check(label + ": Druckziel gueltig",
              isinstance(target, int) and 0 <= target <= 100)
        check(label + ": Druckregler per Tab erreichbar",
              tab_to(page, "#skillPressure"))
        check(label + ": Druckregler mit sichtbarem Fokus",
              page.evaluate("document.activeElement.matches(':focus-visible')"))
        page.keyboard.press("Home")
        check(label + ": Home setzt Druck auf null",
              page.locator("#skillPressure").input_value() == "0")
        for _ in range(target):
            page.keyboard.press("ArrowRight")
        check(label + ": Zielwert ausschliesslich per Pfeiltasten",
              page.locator("#skillPressure").input_value() == str(target))
        activate(page, '[data-arcade="drill-check"]',
                 label + f": Abschnitt {stage + 1} abschliessen")
        after = state(page)
        valid(page, label + f": Abschnitt {stage + 1}")
        if stage < 2:
            check(label + ": naechster Abschnitt",
                  after["minigame"] is not None
                  and after["minigame"]["stage"] == stage + 1)
        else:
            check(label + ": regulaer fertig",
                  after["minigame"] is None
                  and after["claims"][CLAIM]["drilled"])
        layouts.append(layout(page, label + f": nach Abschnitt {stage + 1}"))
        targets.append(target)
    return targets, layouts


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-native-drill-") as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        check("Offline-Vorschau aus geprueftem Quellmanifest",
              (preview / "index.html").is_file())
        ext = root / "zoom-extension"
        extension_at(ext)
        results = []
        with sync_playwright() as playwright:
            context = playwright.chromium.launch_persistent_context(
                str(root / "browser-profile"), channel="chromium",
                headless=True, viewport={"width": 800, "height": 600},
                accept_downloads=True, reduced_motion="reduce",
                args=["--disable-extensions-except=" + str(ext),
                      "--load-extension=" + str(ext)])
            try:
                worker = (context.service_workers[0] if context.service_workers
                          else context.wait_for_event("serviceworker", timeout=15000))
                check("Lokale Zoom-Erweiterung geladen",
                      worker.url.startswith("chrome-extension://"))
                for factor in ZOOMS:
                    label = str(round(factor * 100)) + "%"
                    errors, external = [], []
                    page = context.new_page()
                    page.set_default_timeout(15000)
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.on("request", lambda request: external.append(request.url)
                            if request.url.startswith(("http://", "https://")) else None)
                    try:
                        page.goto((preview / "index.html").as_uri(),
                                  wait_until="load")
                        page.wait_for_function("typeof NeoEconomy === 'object'")
                        set_real_zoom(worker, page.url, 1.0)
                        activate(page, "#startGame", label + ": Spielstart")
                        page.locator("#econMode").wait_for(state="visible")
                        activate(page, '[data-ui="newgame"]', label + ": neue Partie")
                        page.wait_for_function("NeoEconomy.getState() !== null")
                        if page.locator("#dialog").evaluate("(d) => d.open"):
                            page.keyboard.press("Escape")
                            page.wait_for_function("!document.querySelector('#dialog').open")
                        before = page.evaluate("JSON.stringify(NeoEconomy.getState())")
                        zoom = set_real_zoom(worker, page.url, factor)
                        check(label + ": echter Chromium-Tab-Zoom",
                              abs(zoom["factor"] - factor) < 0.01)
                        page.wait_for_function(
                            "(f) => Math.abs(devicePixelRatio - f) < 0.1",
                            arg=factor)
                        width = page.evaluate("innerWidth")
                        check(label + ": CSS-Breite nach Zoom kleiner als 500",
                              width < 500)
                        check(label + ": Zoom veraendert Spielstand nicht",
                              before == page.evaluate("JSON.stringify(NeoEconomy.getState())"))
                        targets, layouts = run_drill(page, label)
                        exported_state = state(page)
                        activate(page, "#closeBtn", label + ": Dialog schliessen")
                        with page.expect_download() as download:
                            activate(page, "#saveGame", label + ": Spielstand exportieren")
                        saved = json.loads(Path(download.value.path()).read_text(encoding="utf-8"))
                        check(label + ": Export ist identisch", saved == exported_state)
                        check(label + ": keine JavaScript-Fehler", not errors)
                        check(label + ": keine externen HTTP-Anfragen", not external)
                        results.append({
                            "zoom_percent": round(factor * 100),
                            "native_api": "chrome.tabs.setZoom/getZoom",
                            "css_width": width, "stages": 3,
                            "pressure_targets": targets,
                            "export_equal": True, "layout": layouts,
                            "release_gate": "BLOCKED"
                        })
                    finally:
                        page.close()
                check("Beide echten Zoomstufen geprueft",
                      [row["zoom_percent"] for row in results] == [175, 200])
                print("NATIVE-ZOOM-DRILL:",
                      json.dumps(results, ensure_ascii=False), flush=True)
                print("GRENZE: Nur Bohr-Minispiel. Fokuskontraste, Zwischenbild-"
                      "Ueberdeckungen, alle Dialogaktionen und regulaere Endpartien "
                      "bleiben BLOCKED.", flush=True)
            finally:
                context.close()


if __name__ == "__main__":
    main()
