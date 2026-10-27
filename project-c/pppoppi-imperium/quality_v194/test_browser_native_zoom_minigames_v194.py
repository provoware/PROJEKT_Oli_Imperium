#!/usr/bin/env python3
"""Rohrnetz und Feuerwehr unter echtem Chromium-Tab-Zoom 175/200 %.

Alle Spielaktionen erfolgen per echten Tab-/Enter-Tasten; die vorhandene
Szenenwahl-API dient nur dem Aufruf der richtigen Ansicht. Kein Release-Gate.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

from test_browser_keyboard_pipe_fire_v194 import (
    activate, fire, pipe, start, state, to_fire_month, valid,
)
from test_browser_native_zoom_v194 import extension_at, set_real_zoom

HERE = Path(__file__).resolve().parent
ZOOMS = (1.75, 2.0)


def check(label, passed):
    print(("PASS: " if passed else "FAIL: ") + label, flush=True)
    if not passed:
        raise AssertionError(label)


def layout_diagnostic(page, stage):
    """Nur messen: Scrollbreite ist kein Ersatz fuer visuelle Abnahme."""
    result = page.evaluate("""() => {
        const dialog = document.querySelector('#dialog');
        const content = document.querySelector('#dialogContent');
        const root = document.documentElement;
        const close = document.querySelector('#closeBtn');
        const rect = close.getBoundingClientRect();
        return {
            width: innerWidth, height: innerHeight, dpr: devicePixelRatio,
            pageExcess: Math.max(0, root.scrollWidth - root.clientWidth),
            dialogExcess: Math.max(0, dialog.scrollWidth - dialog.clientWidth),
            contentExcess: Math.max(0, content.scrollWidth - content.clientWidth),
            closeVisible: rect.width > 0 && rect.height > 0 &&
                rect.left < innerWidth && rect.right > 0 &&
                rect.top < innerHeight && rect.bottom > 0
        };
    }""")
    result["stage"] = stage
    result["horizontal_overflow"] = max(
        result["pageExcess"], result["dialogExcess"], result["contentExcess"])
    print("ZOOM-MINIGAME-LAYOUT:", json.dumps(result, ensure_ascii=False),
          flush=True)
    return result


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-native-arcade-") as tmp:
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
                    page.on("request", lambda req: external.append(req.url)
                            if req.url.startswith(("http://", "https://")) else None)
                    try:
                        page.goto((preview / "index.html").as_uri(),
                                  wait_until="load")
                        page.wait_for_function("typeof NeoEconomy === 'object'")
                        set_real_zoom(worker, page.url, 1.0)
                        start(page, label)
                        # Nach einer neuen Partie ist der Unternehmenscomputer
                        # modal; ihn vor dem Zoom und dem naechsten Dialog
                        # regulaer schliessen.
                        if page.locator("#dialog").evaluate("(d) => d.open"):
                            page.keyboard.press("Escape")
                            page.wait_for_function(
                                "!document.querySelector('#dialog').open")
                        before = page.evaluate(
                            "JSON.stringify(NeoEconomy.getState())")
                        zoom = set_real_zoom(worker, page.url, factor)
                        check(label + ": echter Tab-Zoom per API",
                              abs(zoom["factor"] - factor) < 0.01)
                        page.wait_for_function(
                            "(f) => Math.abs(devicePixelRatio - f) < 0.1",
                            arg=factor)
                        width = page.evaluate("innerWidth")
                        check(label + ": tatsaechlich verkleinerte CSS-Breite",
                              width < 500)
                        check(label + ": Zoom aendert Wirtschaft nicht",
                              before == page.evaluate(
                                  "JSON.stringify(NeoEconomy.getState())"))
                        rotations = pipe(page, label)
                        valid(page, label + ": nach Rohrnetz")
                        pipe_layout = layout_diagnostic(page, "PIPE-finished")
                        to_fire_month(page, label)
                        fire(page, label)
                        valid(page, label + ": nach Feuerwehr")
                        fire_layout = layout_diagnostic(page, "FIRE-finished")
                        exported_state = state(page)
                        activate(page, "#closeBtn", label + ": Dialog schliessen")
                        with page.expect_download() as download:
                            activate(page, "#saveGame", label + ": Export")
                        saved = json.loads(Path(
                            download.value.path()).read_text(encoding="utf-8"))
                        check(label + ": Export identisch zum Spielzustand",
                              saved == exported_state)
                        check(label + ": keine JavaScript-Fehler", not errors)
                        check(label + ": keine externen HTTP-Anfragen",
                              not external)
                        results.append({
                            "zoom_percent": round(factor * 100),
                            "native_api": "chrome.tabs.setZoom/getZoom",
                            "css_width": width, "pipe_stages": 3,
                            "pipe_rotations": rotations, "fire_stages": 3,
                            "wrong_fire_choices": 1, "month": 4,
                            "export_equal": True,
                            "layout": [pipe_layout, fire_layout],
                            "release_gate": "BLOCKED",
                        })
                    finally:
                        page.close()
                check("Beide nativen Zoomstufen durchgespielt",
                      [r["zoom_percent"] for r in results] == [175, 200])
                print("NATIVE-ZOOM-MINIGAMES:",
                      json.dumps(results, ensure_ascii=False), flush=True)
                print("GRENZE: Rohrnetz und Feuerwehr geprueft, Bohrspiel und "
                      "weitere Aktionen unter echtem Zoom offen. "
                      "Fokuskontrast und visuelle Ueberdeckungen nicht "
                      "abgenommen. BED-03 und BAR-01 bleiben BLOCKED.",
                      flush=True)
            finally:
                context.close()


if __name__ == "__main__":
    main()
