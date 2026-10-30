#!/usr/bin/env python3
"""Browser-Fachtest: echte Wirtschaftsklicks, Monatsabrechnung und Neustart.

Nur isolierter, temporärer Offline-Technikaufbau. Keine produktiven Spielstände.
Ein positiver Teiltest ist ausdrücklich keine Vorrelease-Freigabe.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
CLAIM = "BERLIN-1"


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def click_economy(page, scene, action, selector=None):
    # Navigation darf direkt geöffnet werden; die wirtschaftliche Aktion
    # wird ausschließlich über die tatsächliche sichtbare Schaltfläche ausgelöst.
    page.evaluate("(name) => NeoEconomy.open(name)", scene)
    button = page.locator(selector or ('[data-econ="' + action + '"][data-claim="' + CLAIM + '"]'))
    check(action + ": genau eine Schaltfläche", button.count() == 1)
    button.click()
    state = page.evaluate("NeoEconomy.getState()")
    check(action + ": Wirtschaftszustand gültig",
          page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)
    return state


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-economy-browser-") as temp:
        destination = Path(temp) / "preview"
        subprocess.run(
            ["node", str(HERE / "build.cjs"), str(destination)],
            check=True, capture_output=True, text=True, timeout=90,
        )
        check("Offline-Aufbau vorhanden", (destination / "index.html").is_file())
        errors, external = [], []
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
                    page.on("pageerror", lambda err: errors.append(str(err)))
                    page.on("request", lambda req: external.append(req.url)
                            if req.url.startswith(("https://", "http://")) else None)
                    page.goto((destination / "index.html").as_uri(), wait_until="load")
                    page.wait_for_function("typeof window.NeoEconomy === 'object'")
                    return context, page

                context, page = new_session()
                page.locator("#startGame").click()
                page.locator('[data-ui="newgame"]').click()
                page.wait_for_function("NeoEconomy.getState() !== null")
                initial = page.evaluate("NeoEconomy.getState()")
                check("Neue Partie: ein Mensch, zwei KI-Firmen, neun Felder",
                      len(initial["companies"]) == 3 and len(initial["claims"]) == 9)

                rejected = click_economy(page, "claim", "PUMP")
                check("Fördern ohne Bohrung verändert nichts", rejected == initial)
                surveyed = click_economy(page, "claim", "SURVEY")
                check("Gutachten bucht zwei Spieltage und eine Zahlung",
                      surveyed["companies"][0]["daysUsed"] == 2
                      and "H1" in surveyed["claims"][CLAIM]["surveyedBy"]
                      and surveyed["companies"][0]["cashCent"] < initial["companies"][0]["cashCent"])
                bought = click_economy(page, "claim", "BUY")
                check("Kauf: Eigentümer H1", bought["claims"][CLAIM]["owner"] == "H1")
                rejected_buy = click_economy(page, "claim", "BUY")
                check("Doppelter Kauf wird ohne Zustandsänderung abgewiesen",
                      rejected_buy == bought)
                drilled = click_economy(page, "claim", "DRILL")
                check("Bohrung abgeschlossen", drilled["claims"][CLAIM]["drilled"])
                pumped = click_economy(page, "claim", "PUMP")
                check("Förderung erzeugt genau 100 Barrel im Tank",
                      pumped["claims"][CLAIM]["inventoryMilli"] == 100000
                      and pumped["companies"][0]["monthProducedMilli"] == 100000)
                shipped = click_economy(page, "warehouse", "SHIP")
                check("Verladung verschiebt Öl ohne Mengenverlust",
                      shipped["claims"][CLAIM]["inventoryMilli"] == 0
                      and shipped["claims"][CLAIM]["preparedMilli"] == 100000)
                offered = click_economy(page, "market", "OFFER")
                check("Marktangebot noch ohne Erlös",
                      offered["claims"][CLAIM]["order"]
                      and offered["companies"][0]["cashCent"] == shipped["companies"][0]["cashCent"])
                signed = click_economy(
                    page, "contracts", "SIGN",
                    '[data-econ="SIGN"][data-region="BERLIN"]',
                )
                contracts = signed["companies"][0]["contracts"]
                check("Vertrag: 40 Barrel, Fälligkeit Monat 2",
                      len(contracts) == 1 and contracts[0]["status"] == "OPEN"
                      and contracts[0]["qtyMilli"] == 40000
                      and contracts[0]["dueMonth"] == 2)

                page.evaluate("NeoEconomy.open('calendar')")
                page.locator('[data-econ="END_TURN"]').click()
                page.wait_for_function("NeoEconomy.getState()?.phase === 'REPORT'")
                report1 = page.evaluate("NeoEconomy.getState()")
                check("Monat 1: Marktverkauf und genau ein Bericht",
                      report1["month"] == 1 and len(report1["reports"]) == 1
                      and report1["companies"][0]["monthSoldMilli"] > 0
                      and any(x["code"] == "MARKTERLÖS"
                              for x in report1["companies"][0]["ledger"]))
                check("Vertrag bleibt bis Monat 2 offen",
                      report1["companies"][0]["contracts"][0]["status"] == "OPEN")

                page.locator('[data-econ="NEXT_MONTH"]').click()
                page.wait_for_function("NeoEconomy.getState()?.month === 2")
                month2 = click_economy(page, "claim", "PUMP")
                check("Monat 2: frisches Öl für den Vertrag",
                      month2["claims"][CLAIM]["inventoryMilli"] >= 40000)
                page.evaluate("NeoEconomy.open('calendar')")
                page.locator('[data-econ="END_TURN"]').click()
                page.wait_for_function("NeoEconomy.getState()?.phase === 'REPORT'")
                report2 = page.evaluate("NeoEconomy.getState()")
                fulfilled = report2["companies"][0]["contracts"][0]
                check("Monat 2: Vertrag vollständig und pünktlich erfüllt",
                      fulfilled["status"] == "DONE"
                      and fulfilled["soldMilli"] == 40000
                      and report2["companies"][0]["monthContractMilli"] == 40000
                      and report2["companies"][0]["stats"]["contractsDone"] == 1)
                check("Vertragserlös und Transportgebühr gebucht",
                      any(x["code"] == "VERTRAGSERLÖS"
                          for x in report2["companies"][0]["ledger"])
                      and any(x["kind"] == "VERTRAGSTRANSPORT"
                              for x in report2["companies"][0]["obligations"]))
                check("Genau zwei Monatsberichte", len(report2["reports"]) == 2)

                page.locator("#closeBtn").click()
                with page.expect_download() as download_info:
                    page.locator("#saveGame").click()
                exported = json.loads(
                    Path(download_info.value.path()).read_text(encoding="utf-8")
                )
                check("Export bewahrt die vollständige Wirtschaftshistorie",
                      exported == report2)
                context.close()
                context, page = new_session()
                check("Neuer Browserkontext hat keinen Spielstand",
                      page.evaluate("NeoEconomy.getState()") is None)
                page.locator("#loadEconFile").set_input_files({
                    "name": "economy-month-2.json",
                    "mimeType": "application/json",
                    "buffer": json.dumps(exported, ensure_ascii=False).encode("utf-8"),
                })
                page.wait_for_function("NeoEconomy.getState()?.month === 2")
                restored = page.evaluate("NeoEconomy.getState()")
                check("Neustart und Import erhalten Geld, Verträge, Buchungen und Berichte",
                      restored == report2)
                page.locator('[data-econ="NEXT_MONTH"]').click()
                page.wait_for_function("NeoEconomy.getState()?.month === 3")
                after = page.evaluate("NeoEconomy.getState()")
                check("Nach Wiederherstellung kein doppelter Monatsabschluss",
                      len(after["reports"]) == 2
                      and after["companies"][0]["stats"]["contractsDone"] == 1)
                check("Keine externen Netzwerkanfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("WIRTSCHAFT-BROWSER:", json.dumps({
                    "ui_actions": ["SURVEY", "BUY", "DRILL", "PUMP", "SHIP",
                                   "OFFER", "SIGN", "END_TURN", "PUMP", "END_TURN"],
                    "rejected_actions": 2,
                    "months_settled": 2,
                    "market_sale": "PASS",
                    "contract_fulfilled": "PASS",
                    "export_restart_import": "PASS",
                    "release_gate": "BLOCKED: weitere Pflichten offen",
                }, ensure_ascii=False), flush=True)
                context.close()
            finally:
                browser.close()


if __name__ == "__main__":
    main()
