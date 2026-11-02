#!/usr/bin/env python3
"""Reproduzierbare Chromium-Leistungsdiagnose, kein Vorrelease-Leistungs-Gate.

Misst echten Offline-Dateistart und 12 oder 48 reguläre Monatswechsel in einem
wegwerfbaren Browserprofil. Die Messungen sind Momentaufnahmen eines
GitHub-Runners, keine garantierten Grenzwerte fuer Kubuntu oder Langzeitbetrieb.
"""
import json
import math
import os
import statistics
import subprocess
import tempfile
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
TOTAL_MONTHS = int(os.environ.get("PPPOPPI_PERF_MONTHS", "12"))
if TOTAL_MONTHS not in (12, 48):
    raise ValueError("PPPOPPI_PERF_MONTHS erlaubt nur 12 oder 48")
CHECKPOINTS = {0, 4, 8, 12} if TOTAL_MONTHS == 12 else {0, 12, 24, 36, 48}


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def metrics(session):
    # Nur nach einer expliziten Bereinigung messen: weniger Messrauschen
    # durch noch nicht aufgeraeumte, aber bereits unerreichbare Objekte.
    session.send("HeapProfiler.collectGarbage")
    values = session.send("Performance.getMetrics")["metrics"]
    names = {item["name"]: item["value"] for item in values}
    required = ("JSHeapUsedSize", "Nodes", "Documents", "TaskDuration")
    check("Chromium-Messwerte verfuegbar", all(
        key in names and math.isfinite(names[key]) for key in required))
    return {key: round(names[key], 3) for key in required}


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-performance-") as temp:
        preview = Path(temp) / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        check("Offline-Vorschau erzeugt", (preview / "index.html").is_file())
        errors, external, months, samples = [], [], [], {}
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                context = browser.new_context(
                    viewport={"width": 800, "height": 600},
                    reduced_motion="reduce")
                page = context.new_page()
                page.set_default_timeout(15000)
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.on("request", lambda request: external.append(request.url)
                        if request.url.startswith(("http://", "https://")) else None)
                session = context.new_cdp_session(page)
                session.send("Performance.enable")
                session.send("HeapProfiler.enable")
                started = time.perf_counter()
                page.goto((preview / "index.html").as_uri(), wait_until="load")
                page.wait_for_function("typeof NeoEconomy === 'object'")
                load_seconds = round(time.perf_counter() - started, 4)
                check("Offline-Dateistart abgeschlossen", load_seconds > 0)
                page.locator("#startGame").click()
                page.locator('[data-ui="newgame"]').click()
                page.wait_for_function("NeoEconomy.getState() !== null")
                check("Drei Firmen vorhanden",
                      len(page.evaluate("NeoEconomy.getState().companies")) == 3)
                samples["0"] = metrics(session)

                for month in range(1, TOTAL_MONTHS + 1):
                    start = time.perf_counter()
                    before = page.evaluate("NeoEconomy.getState()")
                    check("Monat %d startet korrekt" % month,
                          before["month"] == month and before["phase"] == "TURN")
                    page.evaluate("NeoEconomy.open('calendar')")
                    page.locator('[data-econ="END_TURN"]').click()
                    page.wait_for_function("NeoEconomy.getState()?.phase === 'REPORT'")
                    page.locator('[data-econ="NEXT_MONTH"]').click()
                    page.wait_for_function(
                        "(expected) => NeoEconomy.getState()?.month === expected",
                        arg=month + 1)
                    after = page.evaluate("NeoEconomy.getState()")
                    check("Monat %d ohne Berichtverlust" % month,
                          after["phase"] == "TURN" and len(after["reports"]) == month)
                    duration = time.perf_counter() - start
                    check("Monat %d: gueltige Zeitmessung" % month,
                          math.isfinite(duration) and duration > 0)
                    months.append(round(duration, 4))
                    if month in CHECKPOINTS:
                        samples[str(month)] = metrics(session)

                check(f"{TOTAL_MONTHS} echte Browser-Monatswechsel", len(months) == TOTAL_MONTHS)
                check(f"{len(CHECKPOINTS)} Speicher-/DOM-Messpunkte", len(samples) == len(CHECKPOINTS))
                check("Keine externen HTTP-Anfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                start_heap = samples["0"]["JSHeapUsedSize"]
                end_heap = samples[str(TOTAL_MONTHS)]["JSHeapUsedSize"]
                result = {
                    "scope": f"ein Chromium-Profil, 800x600, file://, {TOTAL_MONTHS} Monate",
                    "months_completed": len(months),
                    "reports": len(after["reports"]),
                    "start_seconds": load_seconds,
                    "month_seconds": months,
                    "median_month_seconds": round(statistics.median(months), 4),
                    "max_month_seconds": round(max(months), 4),
                    "samples": samples,
                    "heap_change_bytes": round(end_heap - start_heap),
                    "heap_sampling": f"nach HeapProfiler.collectGarbage an allen {len(CHECKPOINTS)} Messpunkten",
                    "performance_gate": "BLOCKED: keine verbindlichen Grenzwerte oder Kubuntu-Nachweise",
                    "release_gate": "BLOCKED",
                }
                print("PERFORMANCE-DIAGNOSE:", json.dumps(result, ensure_ascii=False), flush=True)
                context.close()
            finally:
                browser.close()


if __name__ == "__main__":
    main()
