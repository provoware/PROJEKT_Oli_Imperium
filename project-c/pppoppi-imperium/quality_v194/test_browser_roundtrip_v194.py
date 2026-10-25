#!/usr/bin/env python3
"""Isolierter Chromium-Rundlauf des erzeugten V1.9.4-Technikaufbaus.

Keine Originaldateien, echten Spielstände oder fremden Verzeichnisse verändern.
Der Browser öffnet die lokale index.html (file://), ohne einen Webserver.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
BUILD_SCRIPT = HERE / "build.cjs"


def check(name, condition):
    if not condition:
        print("FAIL:", name, flush=True)
        raise AssertionError(name)
    print("PASS:", name, flush=True)


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-browser-") as temp:
        destination = Path(temp) / "preview"
        subprocess.run(
            ["node", str(BUILD_SCRIPT), str(destination)],
            check=True, timeout=90, capture_output=True, text=True,
        )
        check("Technikaufbau hat einen lokalen Einstieg", (destination / "index.html").is_file())
        errors = []
        external = []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                def open_page():
                    context = browser.new_context(
                        viewport={"width": 800, "height": 600},
                        accept_downloads=True,
                        reduced_motion="reduce",
                    )
                    page = context.new_page()
                    page.set_default_timeout(12000)
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.on(
                        "request",
                        lambda request: external.append(request.url)
                        if request.url.startswith(("http://", "https://")) else None,
                    )
                    page.goto((destination / "index.html").as_uri(), wait_until="load")
                    page.wait_for_function("typeof window.NeoEconomy === 'object'")
                    return context, page

                first_context, first = open_page()
                check(
                    "Kern V1.9.3 und Prüfschicht V1.9.4 sind getrennt",
                    first.evaluate("NeoEconomy.gameVersion === '1.9.3' && NeoEconomy.qaVersion === '1.9.4'"),
                )
                check("Ohne Import startet kein fremder Spielstand", first.evaluate("NeoEconomy.getState()") is None)
                first.locator("#startGame").focus()
                first.keyboard.press("Enter")
                first.locator("#econMode").wait_for(state="visible")
                check("Startdialog per Tastatur erreichbar", first.locator("#econMode").is_visible())
                first.locator('[data-ui="newgame"]').click()
                first.wait_for_function("NeoEconomy.getState() !== null")
                check("Partie mit zwei KI-Firmen gestartet", first.evaluate("NeoEconomy.getState().companies.length") == 3)

                first.evaluate("NeoEconomy.open('calendar')")
                first.locator('[data-econ="END_TURN"]').click()
                check("Monatsabschluss berechnet", first.evaluate("NeoEconomy.getState().phase") == "REPORT")
                first.locator('[data-econ="NEXT_MONTH"]').click()
                original = first.evaluate("NeoEconomy.getState()")
                check("Folgemonat erreicht", original["month"] == 2)
                width = first.evaluate(
                    "({viewport:innerWidth,content:document.documentElement.scrollWidth})"
                )
                print("BEOBACHTUNG 800x600:", json.dumps(width), flush=True)
                check("800x600 ohne horizontalen Seitenüberlauf", width["content"] <= width["viewport"] + 2)

                with first.expect_download() as download_info:
                    first.locator("#saveGame").click()
                downloaded = json.loads(Path(download_info.value.path()).read_text(encoding="utf-8"))
                check("Export enthält exakt den aktuellen Spielzustand", downloaded == original)
                first_context.close()

                # Neue Browser-Sitzung: kein In-Memory-Zustand aus dem alten Fenster.
                second_context, second = open_page()
                check("Neustart ohne stillen alten Spielzustand", second.evaluate("NeoEconomy.getState()") is None)
                second.locator("#loadEconFile").set_input_files({
                    "name": "isolate-save.json",
                    "mimeType": "application/json",
                    "buffer": json.dumps(downloaded, ensure_ascii=False).encode("utf-8"),
                })
                second.wait_for_function("NeoEconomy.getState()?.month === 2")
                restored = second.evaluate("NeoEconomy.getState()")
                check("Neustart und Reimport bytewertgleich im JSON-Datenmodell", restored == original)

                second.locator("#loadEconFile").set_input_files({
                    "name": "corrupt.json",
                    "mimeType": "application/json",
                    "buffer": b'{"schema":',
                })
                second.wait_for_function(
                    "document.querySelector('#toast')?.textContent?.includes('Import abgelehnt')"
                )
                check("Beschädigter Import verändert den Spielstand nicht",
                      second.evaluate("NeoEconomy.getState()") == original)
                check("Keine externen HTTP-Anfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                second_context.close()
            finally:
                browser.close()
        print("BROWSER-RUNDLAUF: PASS; offline file://, Tastatur, 800x600, Export, Neustart, Reimport, defekter Import", flush=True)


if __name__ == "__main__":
    main()
