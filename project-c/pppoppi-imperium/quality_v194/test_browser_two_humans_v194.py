#!/usr/bin/env python3
"""Zwei menschliche Firmen: Zugwechsel, echte Insolvenz, getrennte Sanierung.

Nur temporaerer Offline-Chromium-Aufbau. Wirtschaftshandlungen ausschliesslich
per sichtbarem Klick, keine Manipulation von Geld, Schulden oder Spielphase.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def state(page):
    return page.evaluate("NeoEconomy.getState()")


def pending(page, index):
    return page.evaluate(
        "(i) => NeoEconomy.engine.pending(NeoEconomy.getState().companies[i])",
        index,
    )


def actions(page, berlin, nord, firm_id):
    for scene, name, claim in (
        ("claim", "SURVEY", berlin),
        ("claim", "BUY", berlin),
        ("claim", "DRILL", berlin),
        ("claim", "SURVEY", nord),
        ("claim", "BUY", nord),
        ("warehouse", "TANK_UPGRADE", berlin),
        ("security", "SECURITY", berlin),
        ("security", "SECURITY", berlin),
    ):
        page.evaluate("(id) => NeoEconomy.select(id)", claim)
        if scene != "claim":
            page.evaluate("(name) => NeoEconomy.open(name)", scene)
        button = page.locator(f'[data-econ="{name}"][data-claim="{claim}"]')
        check(f"{firm_id}: {name} {claim} sichtbar", button.count() == 1)
        before = state(page)
        button.click()
        after = state(page)
        firm = next(f for f in after["companies"] if f["id"] == firm_id)
        old = next(f for f in before["companies"] if f["id"] == firm_id)
        check(f"{firm_id}: {name} verbucht", firm["cashCent"] < old["cashCent"]
              and firm["daysUsed"] > old["daysUsed"])
        check("Nach Aktion gueltiger Spielstand",
              page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-two-human-rescue-") as temp:
        preview = Path(temp) / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        check("Isolierter Offline-Aufbau", (preview / "index.html").is_file())
        errors, external = [], []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                def session():
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
                    return context, page

                context, page = session()
                page.locator("#startGame").click()
                page.locator("#econMode").select_option("2-2")
                page.locator('[data-ui="newgame"]').click()
                fresh = state(page)
                check("Zwei Menschen und zwei Computer starten",
                      [f["id"] for f in fresh["companies"]] ==
                      ["H1", "H2", "A1", "A2"]
                      and fresh["turnIndex"] == 0 and fresh["phase"] == "TURN")
                actions(page, "BERLIN-1", "NORD-1", "H1")
                first = state(page)
                check("Erster Mensch: regulare Ausgaben ohne Testfiktion",
                      first["companies"][0]["cashCent"] == 60_000
                      and first["companies"][0]["daysUsed"] == 15)
                page.evaluate("NeoEconomy.open('calendar')")
                page.locator('[data-econ="END_TURN"]').click()
                switched = state(page)
                check("Erster Zug wechselt ohne Monatsabrechnung zu H2",
                      switched["phase"] == "TURN" and switched["turnIndex"] == 1
                      and switched["month"] == 1 and len(switched["reports"]) == 0)
                check("Uebergabesperre ist aktiv",
                      page.evaluate("NeoEconomy.needsHandoff()") is True
                      and page.locator('[data-ui="handoff-ok"]').count() == 1)
                check("H1 bleibt vor H2-Zug unveraendert",
                      switched["companies"][0] == first["companies"][0])
                page.locator('[data-ui="handoff-ok"]').click()
                check("Uebergabe wurde ausdruecklich bestaetigt",
                      page.evaluate("NeoEconomy.needsHandoff()") is False)
                actions(page, "BERLIN-2", "NORD-2", "H2")
                second = state(page)
                check("Zweiter Mensch hat unabhaengig 15 Spieltage genutzt",
                      second["companies"][1]["cashCent"] == 60_000
                      and second["companies"][1]["daysUsed"] == 15)
                check("Eigentum der Menschen ist getrennt",
                      second["claims"]["BERLIN-1"]["owner"] == "H1"
                      and second["claims"]["BERLIN-2"]["owner"] == "H2"
                      and second["claims"]["NORD-1"]["owner"] == "H1"
                      and second["claims"]["NORD-2"]["owner"] == "H2")
                page.evaluate("NeoEconomy.open('calendar')")
                page.locator('[data-econ="END_TURN"]').click()
                page.wait_for_function("NeoEconomy.getState()?.phase === 'RESCUE'")
                rescue = state(page)
                check("Beide menschlichen Firmen regulär insolvent",
                      rescue["month"] == 1 and rescue["rescueIds"] == ["H1", "H2"]
                      and pending(page, 0) == 80_000 and pending(page, 1) == 80_000)
                check("Monatsabschluss genau einmal, auch fuer Computerfirmen",
                      len(rescue["reports"]) == 1 and
                      len([e for e in rescue["events"]
                           if e["type"] == "MONATSABSCHLUSS"]) == 1)
                page.evaluate("NeoEconomy.open('rescue')")
                page.locator('[data-econ="RESCUE_LOAN"]').click()
                after_loan = state(page)
                check("Nur H1 gerettet, H2 bleibt im Sanierungsverfahren",
                      after_loan["phase"] == "RESCUE"
                      and after_loan["rescueIds"] == ["H2"]
                      and pending(page, 0) == 0 and pending(page, 1) == 80_000
                      and after_loan["companies"][0]["debtCent"] == 4_000_000)
                check("H1-Rettungskredit nur einmal im Journal",
                      len([x for x in after_loan["companies"][0]["ledger"]
                           if x["code"] == "RETTUNGSKREDIT"]) == 1)
                page.locator('[data-econ="RESTART"]').click()
                recovered = state(page)
                check("H2-Neustart beendet Sanierung, H1 unveraendert",
                      recovered["phase"] == "REPORT"
                      and recovered["rescueIds"] == []
                      and recovered["companies"][0] == after_loan["companies"][0]
                      and recovered["companies"][1]["generation"] == 2
                      and recovered["companies"][1]["cashCent"] == 15_000_000
                      and recovered["companies"][1]["stats"]["rescues"] == 1)
                check("H1-Felder erhalten, H2-Felder freigegeben",
                      recovered["claims"]["BERLIN-1"]["owner"] == "H1"
                      and recovered["claims"]["NORD-1"]["owner"] == "H1"
                      and recovered["claims"]["BERLIN-2"]["owner"] is None
                      and recovered["claims"]["NORD-2"]["owner"] is None)
                page.locator("#closeBtn").click()
                with page.expect_download() as downloaded:
                    page.locator("#saveGame").click()
                saved = json.loads(Path(downloaded.value.path()).read_text(encoding="utf-8"))
                check("Export ist identisch mit beiden Sanierungsresultaten",
                      saved == recovered)
                context.close()

                context, page = session()
                check("Neuer Browserkontext ohne fremde Partie", state(page) is None)
                page.locator("#loadEconFile").set_input_files({
                    "name": "zwei-menschen-sanierung.json",
                    "mimeType": "application/json",
                    "buffer": json.dumps(saved, ensure_ascii=False).encode("utf-8"),
                })
                page.wait_for_function("NeoEconomy.getState()?.phase === 'REPORT'")
                check("Import nach Neustart unveraendert", state(page) == saved)
                page.locator('[data-econ="NEXT_MONTH"]').click()
                continued = state(page)
                check("Folgemonat ohne erneute Sanierung und Doppelbuchung",
                      continued["month"] == 2 and continued["phase"] == "TURN"
                      and len(continued["reports"]) == 1
                      and len([x for x in continued["companies"][0]["ledger"]
                               if x["code"] == "RETTUNGSKREDIT"]) == 1
                      and continued["companies"][1]["generation"] == 2)
                check("800x600 ohne horizontalen Seitenueberlauf",
                      page.evaluate(
                          "document.documentElement.scrollWidth <= innerWidth + 2"))
                check("Keine externen HTTP-Anfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("ZWEI-MENSCHEN-SANIERUNG:", json.dumps({
                    "mode": "2-2", "human_turns": 2,
                    "natural_rescue_ids": ["H1", "H2"],
                    "rescue_paths": ["H1: CREDIT", "H2: RESTART"],
                    "restart_import": "PASS",
                    "release_gate": "BLOCKED: weitere Pflichten offen",
                }), flush=True)
                context.close()
            finally:
                browser.close()


if __name__ == "__main__":
    main()
