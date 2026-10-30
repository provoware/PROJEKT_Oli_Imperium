#!/usr/bin/env python3
"""Wirtschaftskette mit echten Tasten bei nativem Chromium-Zoom 175/200 %.

Isolierte, aus dem geschuetzten Manifest gebaute Offline-Technikvorschau.
Wirtschaftliche Aktionen sind echte Tab-/Enter-Eingaben; nur die Szenenwahl
nutzt die vorhandene Schnittstelle. Kein vollstaendiger Release-Nachweis.
"""
import json
import subprocess
import tempfile
from pathlib import Path
from test_browser_native_zoom_v194 import wait_for_zoom_worker

from playwright.sync_api import sync_playwright

from test_browser_keyboard_economy_v194 import run_economy, start_fresh
from test_browser_keyboard_pipe_fire_v194 import activate, check, state, valid
from test_browser_native_zoom_minigames_v194 import layout_diagnostic
from test_browser_native_zoom_v194 import extension_at, set_real_zoom

HERE = Path(__file__).resolve().parent
ZOOMS = (1.75, 2.0)


def run_zoom(context, worker, preview, factor):
    label = str(round(factor * 100)) + "%"
    errors, external = [], []
    page = context.new_page()
    page.set_default_timeout(15000)
    page.on("pageerror", lambda err: errors.append(str(err)))
    page.on("request", lambda req: external.append(req.url)
            if req.url.startswith(("http://", "https://")) else None)
    try:
        page.goto((preview / "index.html").as_uri(), wait_until="load")
        page.wait_for_function("typeof NeoEconomy === 'object'")
        set_real_zoom(worker, page.url, 1.0)
        start_fresh(page, label)
        if page.locator("#dialog").evaluate("(el) => el.open"):
            page.keyboard.press("Escape")
            page.wait_for_function("!document.querySelector('#dialog').open")
        initial = state(page)
        zoom = set_real_zoom(worker, page.url, factor)
        check(label + ": nativer Chromium-Tab-Zoom bestaetigt",
              abs(zoom["factor"] - factor) < 0.01)
        page.wait_for_function(
            "(f) => Math.abs(devicePixelRatio - f) < 0.1", arg=factor)
        check(label + ": echte CSS-Breite unter 500",
              page.evaluate("innerWidth") < 500)
        check(label + ": Zoom veraendert den Spielstand nicht",
              state(page) == initial)

        page.evaluate("NeoEconomy.open('claim')")
        before_layout = layout_diagnostic(page, label + ": Feldansicht")
        check(label + ": Feldansicht ohne horizontalen Ueberlauf",
              before_layout["horizontal_overflow"] == 0)
        final = run_economy(page, label)
        valid(page, label + ": Wirtschaft nach zwei Monaten")
        check(label + ": zwei Monatsberichte und erfuellter Vertrag",
              len(final["reports"]) == 2
              and final["companies"][0]["contracts"][0]["status"] == "DONE")
        report_layout = layout_diagnostic(page, label + ": Monatsbericht")
        check(label + ": Monatsbericht ohne horizontalen Ueberlauf",
              report_layout["horizontal_overflow"] == 0)

        activate(page, "#closeBtn", label + ": Dialog per Tastatur schliessen")
        with page.expect_download() as download_info:
            activate(page, "#saveGame", label + ": Export per Tab/Enter")
        saved = json.loads(Path(
            download_info.value.path()).read_text(encoding="utf-8"))
        check(label + ": Export identisch zum Wirtschaftszustand",
              saved == final)
        check(label + ": keine JavaScript-Fehler", not errors)
        check(label + ": keine externen HTTP-Anfragen", not external)
        return {
            "zoom_percent": round(factor * 100),
            "native_api": "chrome.tabs.setZoom/getZoom",
            "months_settled": 2,
            "contract_done": True,
            "rejected_actions": ["PUMP_BEFORE_DRILL", "DUPLICATE_BUY"],
            "keyboard_actions": 15,
            "layout_stages": 2,
            "checked_controls": sum(
                item["dynamic_hit_audit"]["checked"]
                for item in (before_layout, report_layout)),
            "horizontal_overflow_px": 0,
            "export_equal": True,
            "release_gate": "BLOCKED",
        }
    finally:
        page.close()


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-zoom-economy-") as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(
            ["node", str(HERE / "build.cjs"), str(preview)],
            check=True, timeout=90, capture_output=True, text=True)
        check("Hashgepruefte Offline-Technikvorschau gebaut",
              (preview / "index.html").is_file())
        extension = root / "zoom-extension"
        extension_at(extension)
        results = []
        with sync_playwright() as playwright:
            context = playwright.chromium.launch_persistent_context(
                str(root / "browser-profile"), channel="chromium",
                headless=True, viewport={"width": 800, "height": 600},
                accept_downloads=True, reduced_motion="reduce",
                args=["--disable-extensions-except=" + str(extension),
                      "--load-extension=" + str(extension)])
            try:
                worker = wait_for_zoom_worker(context)
                check("Echte Zoom-Erweiterung geladen",
                      worker.url.startswith("chrome-extension://"))
                for factor in ZOOMS:
                    results.append(run_zoom(context, worker, preview, factor))
            finally:
                context.close()
        check("175 und 200 Prozent tatsaechlich durchlaufen",
              [row["zoom_percent"] for row in results] == [175, 200])
        print("NATIVE-ZOOM-ECONOMY:",
              json.dumps(results, ensure_ascii=False), flush=True)
        print("GRENZE: Feldansicht und Monatsbericht quantitativ geprueft; "
              "weitere Dialogaktionen, Text-/Animationsueberdeckungen und "
              "regulaere Spielendzustaende bleiben offen. "
              "BED-02/BED-03/VER-01/VER-02 bleiben BLOCKED.", flush=True)


if __name__ == "__main__":
    main()
