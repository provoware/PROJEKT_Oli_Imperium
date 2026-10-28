#!/usr/bin/env python3
"""Natuerliche Vertrags-Teillieferung ueber sichtbare Browseraktionen.

Vier Menschen verhindern KI-Angebote; die Marktmenge entsteht ausschliesslich
durch regulaere Klicks. Zwei echte Chromium-Prozessneustarts, JSON-Rundlauf,
Abrechnung und 800x600 werden geprueft. Kein Endspiel- oder C64-Originalbeleg.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser_natural_rescue_v194 import export_state, state
from test_browser_reimport_v194 import import_file

HERE = Path(__file__).resolve().parent
CLAIM = "NORD-1"


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def round_div(numerator, divisor):
    return (numerator + divisor // 2) // divisor


def click_action(page, scene, name, region=None):
    page.evaluate("(claim) => NeoEconomy.select(claim)", CLAIM)
    if scene != "claim":
        page.evaluate("(scene) => NeoEconomy.open(scene)", scene)
    selector = (f'[data-econ="{name}"][data-region="{region}"]'
                if region else f'[data-econ="{name}"][data-claim="{CLAIM}"]')
    button = page.locator(selector)
    check(f"{name}: genau eine sichtbare Schaltflaeche", button.count() == 1)
    button.click()
    check(f"{name}: gueltiger Spielzustand",
          page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)


def finish_four_turns(page):
    for index in range(4):
        before = state(page)
        check(f"Spielerzug {index + 1}: richtige Firma",
              before["phase"] == "TURN" and before["turnIndex"] == index
              and before["companies"][index]["id"] == f"H{index + 1}")
        page.evaluate("NeoEconomy.open('calendar')")
        page.locator('[data-econ="END_TURN"]').click()
        if index < 3:
            page.locator('[data-ui="handoff-ok"]').wait_for(state="visible")
            check("Keine vorzeitige Monatsabrechnung",
                  state(page)["phase"] == "TURN"
                  and state(page)["turnIndex"] == index + 1)
            page.locator('[data-ui="handoff-ok"]').click()
        else:
            page.wait_for_function("NeoEconomy.getState()?.phase === 'REPORT'")


def verify_breach(snapshot, price_before, config):
    firm = snapshot["companies"][0]
    contract = firm["contracts"][0]
    price = round_div(price_before * config["contractBonusBps"], 10000)
    revenue = round_div(20000 * price, 1000)
    penalty = round_div(revenue * config["contractPenaltyBps"], 10000)
    revenues = [x for x in firm["ledger"] if x["code"] == "VERTRAGSERLÖS"]
    penalties = [x for x in firm["obligations"] if x["kind"] == "VERTRAGSSTRAFE"]
    fees = [x for x in firm["obligations"] if x["kind"] == "VERTRAGSTRANSPORT"]
    check("Echte Teilmenge 20.000 von 40.000 ist Vertragsbruch",
          snapshot["month"] == 2 and snapshot["phase"] == "REPORT"
          and len(snapshot["reports"]) == 2
          and contract["status"] == "BREACH"
          and contract["qtyMilli"] == 40000
          and contract["soldMilli"] == 20000
          and firm["monthContractMilli"] == 20000
          and firm["stats"]["contractsDone"] == 0)
    check("Vertragserloes, Fehlmengenstrafe und Transport exakt einmal",
          len(revenues) == len(penalties) == len(fees) == 1
          and revenues[0]["deltaCent"] == revenue
          and penalties[0]["dueCent"] == penalty
          and penalties[0]["paidCent"] == penalty
          and fees[0]["dueCent"] == config["contractDeliveryFee"]
          and fees[0]["paidCent"] == config["contractDeliveryFee"]
          and len([x for x in firm["ledger"]
                   if x["code"] == "ZAHLUNG_VERTRAGSSTRAFE"]) == 1
          and len([x for x in firm["ledger"]
                   if x["code"] == "ZAHLUNG_VERTRAGSTRANSPORT"]) == 1)
    check("Lager nach Teillieferung leer und Buchungskennungen eindeutig",
          snapshot["claims"][CLAIM]["inventoryMilli"] == 0
          and snapshot["claims"][CLAIM]["preparedMilli"] == 0
          and len(snapshot["processedIds"]) == len(set(snapshot["processedIds"])))


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-browser-partial-") as temp:
        preview = Path(temp) / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        check("Offline-Spiel in Wegwerfverzeichnis aufgebaut",
              (preview / "index.html").is_file())
        errors, external = [], []
        with sync_playwright() as playwright:
            def session():
                # Anders als bei Kontext-Neustarts wird Chromium neu gestartet.
                browser = playwright.chromium.launch(headless=True)
                context = browser.new_context(
                    viewport={"width": 800, "height": 600},
                    accept_downloads=True, reduced_motion="reduce")
                page = context.new_page()
                page.set_default_timeout(15000)
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.on("request", lambda req: external.append(req.url)
                        if req.url.startswith(("http://", "https://")) else None)
                page.goto((preview / "index.html").as_uri(), wait_until="load")
                page.wait_for_function("typeof NeoEconomy === 'object'")
                return browser, page

            browser, page = session()
            try:
                page.locator("#startGame").click()
                page.locator("#econMode").select_option("4-0")
                page.locator('[data-ui="newgame"]').click()
                initial = state(page)
                check("Vier menschliche Firmen ohne Computer-Angebote",
                      [x["id"] for x in initial["companies"]]
                      == ["H1", "H2", "H3", "H4"]
                      and all(x["type"] == "human" for x in initial["companies"]))
                for scene, name in (
                    ("claim", "SURVEY"), ("claim", "BUY"), ("claim", "DRILL"),
                    ("claim", "PUMP"), ("warehouse", "SHIP"), ("market", "OFFER")
                ):
                    click_action(page, scene, name)
                click_action(page, "contracts", "SIGN", region="NORD")
                finish_four_turns(page)
                first = state(page)
                check("Natuerlicher Marktverkauf: 80.000 verkauft, 20.000 im Lager",
                      first["month"] == 1 and first["phase"] == "REPORT"
                      and first["companies"][0]["monthSoldMilli"] == 80000
                      and first["claims"][CLAIM]["inventoryMilli"] == 20000
                      and first["companies"][0]["contracts"][0]["status"] == "OPEN")
                saved_first = export_state(page)
                check("Monat eins vollstaendig exportiert", saved_first == first)
            finally:
                browser.close()

            browser, page = session()
            try:
                check("Chromium-Neustart eins: kein fremder Spielstand",
                      state(page) is None)
                import_file(page, "teillieferung-monat-1.json", saved_first, True)
                check("Monat eins exakt wiederhergestellt", state(page) == saved_first)
                page.locator('[data-econ="NEXT_MONTH"]').click()
                page.wait_for_function("NeoEconomy.getState()?.month === 2")
                checkpoint = state(page)
                config = page.evaluate("NeoEconomy.engine.CFG")
                check("Monat zwei: keine kuenstliche Lagerauffuellung",
                      checkpoint["claims"][CLAIM]["inventoryMilli"] == 20000
                      and checkpoint["companies"][0]["contracts"][0]["dueMonth"] == 2)
                finish_four_turns(page)
                settled = state(page)
                verify_breach(settled, checkpoint["prices"]["NORD"], config)
                saved_second = export_state(page)
                check("Vertragsbruch samt Buchungen exakt exportiert",
                      saved_second == settled)
            finally:
                browser.close()

            browser, page = session()
            try:
                check("Chromium-Neustart zwei: leerer neuer Prozess",
                      state(page) is None)
                import_file(page, "teillieferung-monat-2.json", saved_second, True)
                check("Vertragsbruch unveraendert importiert",
                      state(page) == saved_second)
                import_file(page, "teillieferung-monat-2-nochmals.json", saved_second, True)
                check("Wiederimport ohne doppelte Buchungen",
                      state(page) == saved_second)
                page.locator('[data-econ="NEXT_MONTH"]').click()
                continued = state(page)
                check("Monat drei ohne Vertrags- oder Monats-Doppelbuchung",
                      continued["month"] == 3 and continued["phase"] == "TURN"
                      and len(continued["reports"]) == 2
                      and continued["companies"][0]["contracts"][0]["status"] == "BREACH"
                      and len([x for x in continued["companies"][0]["ledger"]
                               if x["code"] == "VERTRAGSERLÖS"]) == 1
                      and len([x for x in continued["companies"][0]["obligations"]
                               if x["kind"] == "VERTRAGSSTRAFE"]) == 1)
                check("800x600 ohne horizontales Scrollen",
                      page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"))
                check("Keine externen Netzwerkanfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("BROWSER-TEILLIEFERUNG:", json.dumps({
                    "human_companies": 4, "market_sold_milli": 80000,
                    "delivered_milli": 20000, "missing_milli": 20000,
                    "chromium_process_starts": 3, "json_imports": 3,
                    "monthly_reports": 2, "release_gate": "BLOCKED"
                }, ensure_ascii=False), flush=True)
            finally:
                browser.close()


if __name__ == "__main__":
    main()
