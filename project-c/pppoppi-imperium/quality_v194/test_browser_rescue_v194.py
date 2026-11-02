#!/usr/bin/env python3
"""Isolierter Browser-Test fuer Sanierung, Notverkauf und Neustart.

Der Engpass wird als klar gekennzeichnete TEST-FIKTUR in einem gueltigen
Spielstand erzeugt; die eigentliche RESCUE-Phase entsteht erst durch den
normalen Monatsabschluss. Kein produktiver Spielstand wird verwendet.
"""
import copy
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
CLAIM = "BERLIN-1"
TEST_DEBT = 5_000_000


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def load(page, name, state):
    page.locator("#loadEconFile").set_input_files({
        "name": name,
        "mimeType": "application/json",
        "buffer": json.dumps(state, ensure_ascii=False).encode("utf-8"),
    })
    page.wait_for_function("(cash) => NeoEconomy.getState()?.companies[0].cashCent === cash",
                           arg=state["companies"][0]["cashCent"])


def get(page):
    return page.evaluate("NeoEconomy.getState()")


def start_rescue(page, fixture):
    load(page, "isolierte-schulden-testfiktion.json", fixture)
    check("Testfiktion vor Monatsabschluss gueltig",
          page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)
    page.evaluate("NeoEconomy.open('calendar')")
    page.locator('[data-econ="END_TURN"]').click()
    page.wait_for_function("NeoEconomy.getState()?.phase === 'RESCUE'")
    state = get(page)
    check("Regulaerer Monatsabschluss erzeugt Sanierungsphase",
          state["month"] == 1 and state["rescueIds"] == ["H1"]
          and len(state["reports"]) == 1
          and state["companies"][0]["cashCent"] == 0)
    check("Offene Schulden enthalten Testforderung und Monatslohn",
          page.evaluate("NeoEconomy.engine.pending(NeoEconomy.getState().companies[0])")
          >= TEST_DEBT)
    return state


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-rescue-browser-") as temp:
        destination = Path(temp) / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(destination)],
                       check=True, capture_output=True, text=True, timeout=90)
        check("Temporarer Offline-Aufbau vorhanden",
              (destination / "index.html").is_file())
        errors, external = [], []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                def session():
                    context = browser.new_context(
                        viewport={"width": 800, "height": 600},
                        accept_downloads=True,
                        reduced_motion="reduce",
                    )
                    page = context.new_page()
                    page.set_default_timeout(12000)
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.on("request", lambda req: external.append(req.url)
                            if req.url.startswith(("https://", "http://")) else None)
                    page.goto((destination / "index.html").as_uri(), wait_until="load")
                    page.wait_for_function("typeof window.NeoEconomy === 'object'")
                    return context, page

                context, page = session()
                page.locator("#startGame").click()
                page.locator('[data-ui="newgame"]').click()
                page.wait_for_function("NeoEconomy.getState() !== null")
                for action in ("SURVEY", "BUY"):
                    page.evaluate("NeoEconomy.open('claim')")
                    page.locator(f'[data-econ="{action}"][data-claim="{CLAIM}"]').click()
                owned = get(page)
                check("Testgrundlage: ein ehrlich erworbenes eigenes Feld",
                      owned["claims"][CLAIM]["owner"] == "H1")
                fixture = copy.deepcopy(owned)
                fixture["companies"][0]["cashCent"] = 0
                fixture["companies"][0]["obligations"] = [{
                    "id": "TESTFIKTUR-M1-GLAEUBIGER",
                    "priority": 1, "dueCent": TEST_DEBT,
                    "paidCent": 0, "kind": "TESTFORDERUNG",
                }]
                check("Kuenstlicher Engpass explizit nur in Testfiktion",
                      fixture["phase"] == "TURN"
                      and fixture["companies"][0]["cashCent"] == 0
                      and page.evaluate(
                          "(s) => NeoEconomy.engine.validate(s)", fixture) is True)

                rescue = start_rescue(page, fixture)
                page.locator('[data-econ="RESCUE_LOAN"]').click()
                loan = get(page)
                check("Rettungskredit bucht Geld und gleich hohe Schulden",
                      loan["phase"] == "RESCUE"
                      and loan["companies"][0]["loanUsed"]
                      and loan["companies"][0]["debtCent"] == 4_000_000
                      and any(x["code"] == "RETTUNGSKREDIT"
                              for x in loan["companies"][0]["ledger"]))
                check("Kredit bezahlt einen Teil, offene Forderung bleibt",
                      0 < page.evaluate(
                          "NeoEconomy.engine.pending(NeoEconomy.getState().companies[0])")
                      < TEST_DEBT + 90_000)
                page.locator('[data-econ="RESCUE_LOAN"]').click()
                check("Zweiter Rettungskredit wird ohne Zustandsaenderung abgewiesen",
                      get(page) == loan)
                page.locator('[data-econ="RESCUE_SALE"]').click()
                sold = get(page)
                check("Notverkauf beendet die Sanierung ohne negative Kasse",
                      sold["phase"] == "REPORT"
                      and sold["claims"][CLAIM]["owner"] is None
                      and sold["companies"][0]["cashCent"] >= 0
                      and page.evaluate(
                          "NeoEconomy.engine.pending(NeoEconomy.getState().companies[0])")
                      == 0)
                check("Notverkauf nur einmal gebucht, genau ein Monatsbericht",
                      len([x for x in sold["companies"][0]["ledger"]
                           if x["code"] == "NOTVERKAUF"]) == 1
                      and len(sold["reports"]) == 1)
                page.locator("#closeBtn").click()
                with page.expect_download() as downloaded:
                    page.locator("#saveGame").click()
                exported = json.loads(
                    Path(downloaded.value.path()).read_text(encoding="utf-8"))
                check("Export nach Sanierung byteinhaltlich identisch", exported == sold)
                context.close()
                context, page = session()
                load(page, "nach-notverkauf.json", exported)
                check("Browser-Neustart erhaelt Sanierung, Schulden und Journal",
                      get(page) == sold)
                page.locator('[data-econ="NEXT_MONTH"]').click()
                after = get(page)
                check("Folgemonat ohne doppelte Notverkaufsbuchung",
                      after["month"] == 2 and len(after["reports"]) == 1
                      and len([x for x in after["companies"][0]["ledger"]
                               if x["code"] == "NOTVERKAUF"]) == 1)

                context.close()
                context, page = session()
                start_rescue(page, fixture)
                page.locator('[data-econ="RESTART"]').click()
                restarted = get(page)
                firm = restarted["companies"][0]
                check("Sanierungsneustart setzt Generation, Kasse und Schulden zurueck",
                      restarted["phase"] == "REPORT"
                      and firm["generation"] == 2
                      and firm["cashCent"] == 15_000_000
                      and firm["debtCent"] == 0
                      and firm["stats"]["rescues"] == 1)
                check("Neustart gibt das eigene Feld frei und protokolliert Ereignis",
                      restarted["claims"][CLAIM]["owner"] is None
                      and any(x["type"] == "SANIERUNGSNEUSTART"
                              for x in restarted["events"]))
                page.locator("#closeBtn").click()
                with page.expect_download() as downloaded:
                    page.locator("#saveGame").click()
                saved_restart = json.loads(
                    Path(downloaded.value.path()).read_text(encoding="utf-8"))
                context.close()
                context, page = session()
                load(page, "nach-neustart.json", saved_restart)
                check("Browser-Neustart erhaelt neue Generation ohne Datenverlust",
                      get(page) == restarted)
                check("Keine externen Netzwerkanfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("SANIERUNGS-BROWSER:", json.dumps({
                    "fixture": "synthetischer Engpass in isoliertem, gueltigem Spielstand",
                    "rescue_entered_by_real_month_end": True,
                    "loan_then_sale": "PASS",
                    "second_loan_rejected": "PASS",
                    "restart": "PASS",
                    "export_import": 2,
                    "release_gate": "BLOCKED: reale Insolvenzpartie und weitere Pflichten offen",
                }, ensure_ascii=False), flush=True)
                context.close()
            finally:
                browser.close()


if __name__ == "__main__":
    main()
