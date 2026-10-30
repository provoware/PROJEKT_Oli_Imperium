#!/usr/bin/env python3
"""Natuerlicher Notverkauf: Browser-Prozessneustart, JSON und Folgemonat.

Nur echte Spielaktionen und ein unveraenderter Spielstart. Kein synthetischer
Insolvenz-Spielstand, keine Aenderung am Spielkern, kein C64-Originalbeleg.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser_natural_rescue_v194 import (
    ACTIONS, BERLIN, NORD, action, export_state, import_state, pending, state,
)

HERE = Path(__file__).resolve().parent


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def count_sales(snapshot):
    return len([entry for entry in snapshot["companies"][0]["ledger"]
                if entry["code"] == "NOTVERKAUF"])


def session(playwright, preview, errors, external):
    # Jeder Aufruf startet einen neuen Chromium-Prozess, nicht nur einen Tab.
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 800, "height": 600},
        accept_downloads=True, reduced_motion="reduce",
    )
    page = context.new_page()
    page.set_default_timeout(15000)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("request", lambda req: external.append(req.url)
            if req.url.startswith(("https://", "http://")) else None)
    page.goto((preview / "index.html").as_uri(), wait_until="load")
    page.wait_for_function("typeof window.NeoEconomy === 'object'")
    return browser, page


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-natural-sale-restart-") as tmp:
        preview = Path(tmp) / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, capture_output=True, text=True, timeout=90)
        check("Isolierter Offline-Aufbau vorhanden",
              (preview / "index.html").is_file())
        errors, external = [], []
        with sync_playwright() as playwright:
            browser, page = session(playwright, preview, errors, external)
            try:
                page.locator("#startGame").click()
                page.locator('[data-ui="newgame"]').click()
                page.wait_for_function("NeoEconomy.getState() !== null")
                fresh = state(page)
                check("Unveraenderter neuer Spielstand statt Testfiktion",
                      fresh["phase"] == "TURN"
                      and fresh["companies"][0]["cashCent"] == 20_000_000
                      and fresh["companies"][0]["obligations"] == [])
                for scene, name, claim in ACTIONS:
                    action(page, scene, name, claim)
                before = state(page)
                check("Acht reale Ausgaben erzeugen 60.000 Cent Restkasse",
                      before["companies"][0]["cashCent"] == 60_000
                      and before["claims"][BERLIN]["owner"] == "H1"
                      and before["claims"][NORD]["owner"] == "H1")
                page.evaluate("NeoEconomy.open('calendar')")
                page.locator('[data-econ="END_TURN"]').click()
                page.wait_for_function("NeoEconomy.getState()?.phase === 'RESCUE'")
                rescue = state(page)
                check("Echte Monatsrechnung erzeugt 80.000 Cent Rueckstand",
                      rescue["month"] == 1 and rescue["rescueIds"] == ["H1"]
                      and pending(page) == 80_000
                      and len(rescue["reports"]) == 1)
                page.locator('[data-econ="RESCUE_SALE"]').click()
                sold = state(page)
                check("Natuerlicher Notverkauf zahlt Schulden und gibt nur BERLIN frei",
                      sold["phase"] == "REPORT"
                      and sold["companies"][0]["cashCent"] == 2_920_000
                      and sold["companies"][0]["debtCent"] == 0
                      and sold["claims"][BERLIN]["owner"] is None
                      and sold["claims"][NORD]["owner"] == "H1"
                      and pending(page) == 0)
                check("Einmaliger Notverkauf, keine zweite Monatsabrechnung",
                      count_sales(sold) == 1 and len(sold["reports"]) == 1)
                exported = export_state(page)
                check("Notverkauf mit allen Buchungen exakt exportiert",
                      exported == sold)
            finally:
                browser.close()

            browser, page = session(playwright, preview, errors, external)
            try:
                import_state(page, "natuerlicher-notverkauf.json", exported, "REPORT")
                restored = state(page)
                check("Neuer Chromium-Prozess bewahrt Verkauf und Eigentum",
                      restored == sold and count_sales(restored) == 1)
                page.locator('[data-econ="NEXT_MONTH"]').click()
                turn2 = state(page)
                check("Zweiter Monat startet ohne erneuten Notverkauf",
                      turn2["month"] == 2 and turn2["phase"] == "TURN"
                      and len(turn2["reports"]) == 1
                      and count_sales(turn2) == 1
                      and turn2["claims"][BERLIN]["owner"] is None
                      and turn2["claims"][NORD]["owner"] == "H1")
                page.evaluate("NeoEconomy.open('calendar')")
                page.locator('[data-econ="END_TURN"]').click()
                page.wait_for_function("NeoEconomy.getState()?.phase === 'REPORT'")
                month2 = state(page)
                check("Weiterer echter Monatsabschluss ohne doppelte Verkaufsgutschrift",
                      month2["month"] == 2 and len(month2["reports"]) == 2
                      and count_sales(month2) == 1
                      and month2["claims"][BERLIN]["owner"] is None
                      and month2["claims"][NORD]["owner"] == "H1")
                page.locator('[data-econ="NEXT_MONTH"]').click()
                turn3 = state(page)
                check("Dritter Monat laeuft mit gueltigem Spielstand weiter",
                      turn3["month"] == 3 and turn3["phase"] == "TURN"
                      and len(turn3["reports"]) == 2
                      and count_sales(turn3) == 1
                      and page.evaluate(
                          "NeoEconomy.engine.validate(NeoEconomy.getState())") is True)
                check("800x600 ohne horizontalen Seitenueberlauf",
                      page.evaluate(
                          "document.documentElement.scrollWidth <= innerWidth + 2"))
                check("Kein externer HTTP-Verkehr", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("NATUERLICHER-BROWSER-NOTVERKAUF:", json.dumps({
                    "fixture": False, "real_economy_actions": len(ACTIONS),
                    "chromium_process_starts": 2, "json_imports": 1,
                    "months_completed": 2, "sale_entries": count_sales(turn3),
                    "release_gate": "BLOCKED: Endpartien und weitere Pflichten fehlen",
                }, ensure_ascii=False), flush=True)
            finally:
                browser.close()


if __name__ == "__main__":
    main()
