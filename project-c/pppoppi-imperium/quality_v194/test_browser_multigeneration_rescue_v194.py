#!/usr/bin/env python3
"""Zwei natuerliche Insolvenzen ueber drei Generationen im echten Offline-Browser.

Nur regulaere UI-Aktionen und frische Chromium-Prozesse; keine manipulierten
Spielstaende, keine Original-C64-Regelbehauptung, kein Vorrelease-PASS.
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
MAX_FOLLOWUP_MONTHS = 240


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def rescue_events(snapshot):
    return [event for event in snapshot["events"]
            if event["type"] == "SANIERUNGSNEUSTART" and event["company"] == "H1"]


def start_session(playwright, preview, errors, external):
    # Jeder Aufruf erzeugt einen neuen Chromium-PROZESS, nicht nur einen Tab.
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 800, "height": 600},
        accept_downloads=True, reduced_motion="reduce",
    )
    page = context.new_page()
    page.set_default_timeout(15000)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("request", lambda request: external.append(request.url)
            if request.url.startswith(("http://", "https://")) else None)
    page.goto((preview / "index.html").as_uri(), wait_until="load")
    page.wait_for_function("typeof window.NeoEconomy === 'object'")
    return browser, page


def finish_two_human_turns(page):
    before = state(page)
    check("H1 beginnt den Monat", before["phase"] == "TURN"
          and before["turnIndex"] == 0)
    page.evaluate("NeoEconomy.open('calendar')")
    page.locator('[data-econ="END_TURN"]').click()
    page.locator('[data-ui="handoff-ok"]').wait_for(state="visible")
    switched = state(page)
    check("H2-Zug ohne vorzeitige Monatsbuchung",
          switched["phase"] == "TURN" and switched["turnIndex"] == 1
          and len(switched["reports"]) == len(before["reports"]))
    page.locator('[data-ui="handoff-ok"]').click()
    page.evaluate("NeoEconomy.open('calendar')")
    page.locator('[data-econ="END_TURN"]').click()
    page.wait_for_function(
        "['REPORT','RESCUE'].includes(NeoEconomy.getState()?.phase)"
    )
    after = state(page)
    check("Monat exakt einmal abgerechnet",
          len(after["reports"]) == len(before["reports"]) + 1
          and after["month"] == before["month"])
    check("Gueltiger Spielstand nach beiden Zuegen",
          page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)
    return after


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-browser-multigen-") as tmp:
        preview = Path(tmp) / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, capture_output=True, text=True, timeout=90)
        check("Isolierter Offline-Aufbau vorhanden", (preview / "index.html").is_file())
        errors, external = [], []
        process_starts = 0
        with sync_playwright() as playwright:
            browser, page = start_session(playwright, preview, errors, external)
            process_starts += 1
            try:
                page.locator("#startGame").click()
                page.locator("#econMode").select_option("2-2")
                page.locator('[data-ui="newgame"]').click()
                fresh = state(page)
                check("Zwei Menschen und zwei Computer ohne Testfiktion",
                      fresh["phase"] == "TURN" and fresh["month"] == 1
                      and [firm["id"] for firm in fresh["companies"]] == ["H1", "H2", "A1", "A2"]
                      and all(firm["type"] == "human" for firm in fresh["companies"][:2])
                      and fresh["companies"][0]["cashCent"] == 20_000_000)
                for scene, name, claim in ACTIONS:
                    action(page, scene, name, claim)
                prepared = state(page)
                check("Acht sichtbare Wirtschaftsaktionen: 60.000 Cent Restkasse",
                      prepared["companies"][0]["cashCent"] == 60_000
                      and prepared["companies"][0]["daysUsed"] == 15)
                first_rescue = finish_two_human_turns(page)
                check("Erste natuerliche H1-Insolvenz: 80.000 Cent Rueckstand",
                      first_rescue["phase"] == "RESCUE"
                      and first_rescue["rescueIds"] == ["H1"]
                      and pending(page) == 80_000)
                page.evaluate("NeoEconomy.open('rescue')")
                page.locator('[data-econ="RESTART"]').click()
                generation_two = state(page)
                check("Erster Neustart: Generation 2, beide Felder frei",
                      generation_two["phase"] == "REPORT"
                      and generation_two["companies"][0]["generation"] == 2
                      and generation_two["companies"][1]["generation"] == 1
                      and generation_two["claims"][BERLIN]["owner"] is None
                      and generation_two["claims"][NORD]["owner"] is None
                      and len(rescue_events(generation_two)) == 1)
                saved_one = export_state(page)
                check("Erster Neustart verlustfrei exportiert", saved_one == generation_two)
            finally:
                browser.close()

            browser, page = start_session(playwright, preview, errors, external)
            process_starts += 1
            try:
                import_state(page, "generation-2.json", saved_one, "REPORT")
                page.locator('[data-econ="NEXT_MONTH"]').click()
                months = 0
                second_rescue = None
                for _ in range(MAX_FOLLOWUP_MONTHS):
                    before = state(page)
                    check("Generation 2 bleibt bis zur zweiten Insolvenz erhalten",
                          before["phase"] == "TURN"
                          and before["companies"][0]["generation"] == 2
                          and before["companies"][1]["generation"] == 1)
                    result = finish_two_human_turns(page)
                    months += 1
                    if result["phase"] == "RESCUE":
                        second_rescue = result
                        break
                    page.locator('[data-econ="NEXT_MONTH"]').click()
                check("Zweite natuerliche Insolvenz innerhalb von 240 Folgemonaten",
                      second_rescue is not None and 1 < months <= MAX_FOLLOWUP_MONTHS)
                check("Nur H1 insolvent; kein fremder Spieler betroffen",
                      second_rescue["rescueIds"] == ["H1"]
                      and second_rescue["companies"][0]["stats"]["rescues"] == 1
                      and second_rescue["companies"][1]["generation"] == 1
                      and pending(page) > 0
                      and len(second_rescue["reports"]) == second_rescue["month"])
                saved_two = export_state(page)
                check("Offene zweite Sanierung exakt exportiert", saved_two == second_rescue)
            finally:
                browser.close()

            browser, page = start_session(playwright, preview, errors, external)
            process_starts += 1
            try:
                import_state(page, "zweite-sanierung.json", saved_two, "RESCUE")
                page.evaluate("NeoEconomy.open('rescue')")
                page.locator('[data-econ="RESTART"]').click()
                generation_three = state(page)
                check("Zweiter Neustart erzeugt Generation 3 und genau zwei Ereignisse",
                      generation_three["phase"] == "REPORT"
                      and generation_three["rescueIds"] == []
                      and generation_three["companies"][0]["generation"] == 3
                      and generation_three["companies"][0]["stats"]["rescues"] == 2
                      and generation_three["companies"][1]["generation"] == 1
                      and len(rescue_events(generation_three)) == 2)
                saved_three = export_state(page)
                check("Generation 3 unveraendert exportiert", saved_three == generation_three)
            finally:
                browser.close()

            browser, page = start_session(playwright, preview, errors, external)
            process_starts += 1
            try:
                import_state(page, "generation-3.json", saved_three, "REPORT")
                page.locator('[data-econ="NEXT_MONTH"]').click()
                continued = state(page)
                check("Folgemonat ohne doppelte Sanierung oder Monatsabrechnung",
                      continued["phase"] == "TURN"
                      and continued["month"] == saved_three["month"] + 1
                      and len(continued["reports"]) == len(saved_three["reports"])
                      and len(rescue_events(continued)) == 2
                      and continued["companies"][0]["generation"] == 3
                      and len(continued["processedIds"]) == len(set(continued["processedIds"])))
                check("800x600 ohne horizontalen Seitenueberlauf",
                      page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"))
                check("Kein externer HTTP-Verkehr", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("BROWSER-MEHRGENERATIONEN:", json.dumps({
                    "fixture": False, "human_companies": 2, "ai_companies": 2,
                    "real_initial_actions": len(ACTIONS),
                    "natural_insolvencies_h1": 2,
                    "generations_reached": 3,
                    "followup_months": months,
                    "chromium_process_starts": process_starts,
                    "json_imports": 3,
                    "historical_c64_verified": False,
                    "full_endgame_tested": False,
                    "prerelease_gate": "BLOCKED",
                }, ensure_ascii=False), flush=True)
            finally:
                browser.close()


if __name__ == "__main__":
    main()
