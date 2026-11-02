#!/usr/bin/env python3
"""Browser-Langlauf: 12 Monate, 3 Exporte und echte Chromium-Prozessneustarts.

Ausschliesslich isolierter temporaerer Technikaufbau und neue Chromium-Prozesse.
Kein produktiver Spielstand, Originalquelltext oder Benutzerprofil wird veraendert.
"""
import copy
import json
import subprocess
import tempfile
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
CHECKPOINTS = (4, 8, 12)


def check(name, condition):
    print(("PASS: " if condition else "FAIL: ") + name, flush=True)
    if not condition:
        raise AssertionError(name)


def import_json(page, name, data):
    page.locator("#loadEconFile").set_input_files({
        "name": name,
        "mimeType": "application/json",
        "buffer": json.dumps(data, ensure_ascii=False).encode("utf-8"),
    })


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-longrun-") as temp:
        destination = Path(temp) / "preview"
        subprocess.run(
            ["node", str(HERE / "build.cjs"), str(destination)],
            check=True, timeout=90, capture_output=True, text=True,
        )
        check("Isolierter Offline-Aufbau vorhanden", (destination / "index.html").is_file())
        page_url = (destination / "index.html").as_uri()
        errors, external = [], []
        measurements = []
        browser_process_restarts = 0
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                def new_session():
                    context = browser.new_context(
                        viewport={"width": 800, "height": 600},
                        accept_downloads=True,
                        reduced_motion="reduce",
                    )
                    page = context.new_page()
                    page.set_default_timeout(12000)
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.on("request", lambda request: external.append(request.url)
                            if request.url.startswith(("http://", "https://")) else None)
                    page.goto(page_url, wait_until="load")
                    page.wait_for_function("typeof window.NeoEconomy === 'object'")
                    check("Neue Sitzung beginnt ohne uebernommenen Spielstand",
                          page.evaluate("NeoEconomy.getState()") is None)
                    return context, page

                context, page = new_session()
                page.locator("#startGame").click()
                page.locator("#econMode").wait_for(state="visible")
                page.locator('[data-ui="newgame"]').click()
                page.wait_for_function("NeoEconomy.getState() !== null")
                check("Partie mit einer menschlichen und zwei KI-Firmen",
                      len(page.evaluate("NeoEconomy.getState().companies")) == 3)

                last_sequence = -1
                for month in range(1, 13):
                    started = time.monotonic()
                    before = page.evaluate("NeoEconomy.getState()")
                    check("Monat %d: aktive Runde" % month,
                          before["month"] == month and before["phase"] == "TURN")
                    page.evaluate("NeoEconomy.open('calendar')")
                    page.locator('[data-econ="END_TURN"]').click()
                    page.wait_for_function("NeoEconomy.getState()?.phase === 'REPORT'")
                    report = page.evaluate("NeoEconomy.getState()")
                    check("Monat %d: exakt ein neuer Monatsbericht" % month,
                          report["month"] == month and len(report["reports"]) == month)
                    page.locator('[data-econ="NEXT_MONTH"]').click()
                    page.wait_for_function(
                        "(expected) => NeoEconomy.getState()?.month === expected",
                        arg=month + 1,
                    )
                    after = page.evaluate("NeoEconomy.getState()")
                    check("Monat %d: Folgemonat und steigende Ereignisfolge" % month,
                          after["phase"] == "TURN" and after["sequence"] > last_sequence)
                    last_sequence = after["sequence"]
                    measurements.append(round(time.monotonic() - started, 3))

                    if month not in CHECKPOINTS:
                        continue
                    page.locator("#closeBtn").click()
                    with page.expect_download() as download_info:
                        page.locator("#saveGame").click()
                    exported = json.loads(
                        Path(download_info.value.path()).read_text(encoding="utf-8")
                    )
                    check("Checkpoint %d: Download identisch zum Spielstand" % month,
                          exported == after)
                    context.close()
                    # Ein neuer Kontext im selben Browser beweist keinen
                    # Neustart des Browserprozesses. Den Prozess beenden und
                    # aus der gespeicherten Datei in einem neuen starten.
                    browser.close()
                    browser = playwright.chromium.launch(headless=True)
                    browser_process_restarts += 1
                    context, page = new_session()
                    import_json(page, "checkpoint-%02d.json" % month, exported)
                    page.wait_for_function(
                        "(expected) => NeoEconomy.getState()?.month === expected",
                        arg=month + 1,
                    )
                    check("Checkpoint %d: Neustart und Import ohne Datenverlust" % month,
                          page.evaluate("NeoEconomy.getState()") == after)
                    manipulated = copy.deepcopy(exported)
                    manipulated["companies"][0]["cashCent"] = -1
                    import_json(page, "invalid-cash-%02d.json" % month, manipulated)
                    page.wait_for_function(
                        "document.querySelector('#toast')?.textContent?.includes('Import abgelehnt')"
                    )
                    check("Checkpoint %d: Manipulierter Import bleibt folgenlos" % month,
                          page.evaluate("NeoEconomy.getState()") == after)

                final_state = page.evaluate("NeoEconomy.getState()")
                check("Drei unabhaengige Chromium-Prozessneustarts",
                      browser_process_restarts == len(CHECKPOINTS))
                check("Zwölf Monate, zwölf Berichte und Monat 13 erreicht",
                      final_state["month"] == 13 and len(final_state["reports"]) == 12)
                check("Keine externen HTTP-Anfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("BROWSER-LANGZEIT:", json.dumps({
                    "months_completed": 12,
                    "reports": len(final_state["reports"]),
                    "restart_import_cycles": len(CHECKPOINTS),
                    "chromium_process_restarts": browser_process_restarts,
                    "rejected_manipulated_imports": len(CHECKPOINTS),
                    "month_durations_seconds": measurements,
                    "performance_gate": "BLOCKED (keine belastbare Messgrenze)",
                    "release_gate": "BLOCKED (weitere Pflichten offen)",
                }, ensure_ascii=False), flush=True)
                context.close()
            finally:
                browser.close()


if __name__ == "__main__":
    main()
