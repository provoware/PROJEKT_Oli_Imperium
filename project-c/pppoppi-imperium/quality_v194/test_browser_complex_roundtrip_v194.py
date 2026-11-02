#!/usr/bin/env python3
"""Komplexe gueltige Wirtschaftsspielstaende nach echten UI-Aktionen pruefen.

Zwei Menschen, zwei Regionen, zwei Vertraege und zwei Monatsabschluesse.
Browserprofile und Sicherungen sind wegwerfbar; keine Spielkern-Manipulation.
Das ist ein Teiltest, keine Freigabe fuer komplette Endpartien.
"""
import copy
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from test_browser_natural_rescue_v194 import export_state, state
from test_browser_reimport_v194 import import_file

HERE = Path(__file__).resolve().parent
FIELDS = (("H1", "BERLIN-1", "BERLIN"), ("H2", "NORD-2", "NORD"))


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def action(page, scene, name, claim, region=None):
    page.evaluate("(id) => NeoEconomy.select(id)", claim)
    if scene != "claim":
        page.evaluate("(name) => NeoEconomy.open(name)", scene)
    selector = (f'[data-econ="{name}"][data-region="{region}"]'
                if region else f'[data-econ="{name}"][data-claim="{claim}"]')
    button = page.locator(selector)
    check(f"{name} {claim}: genau eine sichtbare Aktion", button.count() == 1)
    button.click()
    check(f"{name} {claim}: Engine-Zustand gueltig",
          page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)


def end_turn(page, handoff):
    page.evaluate("NeoEconomy.open('calendar')")
    page.locator('[data-econ="END_TURN"]').click()
    if handoff:
        page.locator('[data-ui="handoff-ok"]').wait_for(state="visible")
        check("Zuguebergabe an zweiten Menschen",
              state(page)["turnIndex"] == 1 and state(page)["phase"] == "TURN")
        # SPE-01 aus PR #27: Die geheime Uebergabe darf weder einen Download
        # noch einen Spielstand-Import ausloesen. Echte Browser-Ereignisse.
        before = state(page)
        exported = page.evaluate("""() => {
            const oldUrl = URL.createObjectURL;
            const oldClick = HTMLAnchorElement.prototype.click;
            let requested = false;
            try {
                URL.createObjectURL = () => { requested = true; return 'blob:blocked-test'; };
                HTMLAnchorElement.prototype.click = () => {};
                document.getElementById('saveGame').click();
            } finally {
                URL.createObjectURL = oldUrl;
                HTMLAnchorElement.prototype.click = oldClick;
            }
            return requested;
        }""")
        check("Vertrauliche Uebergabe sperrt Spielstand-Export",
              not exported and state(page) == before
              and page.evaluate("NeoEconomy.needsHandoff()") is True)
        foreign = page.evaluate("""() => NeoEconomy.engine.fresh({
            humans: 2, ais: 0, seed: 'PR27-HANDOFF-IMPORT'
        })""")
        check("Gegenprobe erzeugt gueltigen fremden Spielstand",
              page.evaluate("(s) => NeoEconomy.engine.validate(s)", foreign) is True
              and foreign != before)
        page.locator("#loadEconFile").set_input_files({
            "name": "handoff-foreign.json",
            "mimeType": "application/json",
            "buffer": json.dumps(foreign, ensure_ascii=False).encode("utf-8"),
        })
        check("Vertrauliche Uebergabe sperrt fremden Spielstand-Import",
              state(page) == before
              and page.evaluate("NeoEconomy.needsHandoff()") is True)
        page.locator('[data-ui="handoff-ok"]').click()
    else:
        page.wait_for_function("NeoEconomy.getState()?.phase === 'REPORT'")


def create_month_one(page):
    page.locator("#startGame").click()
    page.locator("#econMode").select_option("2-2")
    page.locator('[data-ui="newgame"]').click()
    initial = state(page)
    check("Vier Firmen, zwei menschliche Spieler, neun Claims",
          [f["id"] for f in initial["companies"]] == ["H1", "H2", "A1", "A2"]
          and len(initial["claims"]) == 9 and initial["turnIndex"] == 0)
    for index, (_, claim, region) in enumerate(FIELDS):
        for scene, name in (("claim", "SURVEY"), ("claim", "BUY"),
                            ("claim", "DRILL"), ("claim", "PUMP"),
                            ("warehouse", "SHIP"), ("market", "OFFER")):
            action(page, scene, name, claim)
        action(page, "contracts", "SIGN", claim, region)
        end_turn(page, handoff=(index == 0))
    report = state(page)
    check("Zwei getrennte, gueltige Eigentums- und Vertragsketten",
          all(report["claims"][claim]["owner"] == firm
              and report["companies"][index]["contracts"][0]["region"] == region
              and report["companies"][index]["contracts"][0]["status"] == "OPEN"
              for index, (firm, claim, region) in enumerate(FIELDS)))
    check("Erster Monat einmal abgerechnet, beide Firmen mit Marktumsatz",
          report["month"] == 1 and report["phase"] == "REPORT"
          and len(report["reports"]) == 1
          and all(report["companies"][i]["monthSoldMilli"] > 0 for i in (0, 1)))
    return report


def continue_month_two(page):
    page.locator('[data-econ="NEXT_MONTH"]').click()
    page.wait_for_function(
        "NeoEconomy.getState()?.month === 2 && NeoEconomy.getState()?.phase === 'TURN'"
    )
    for index, (_, claim, _) in enumerate(FIELDS):
        action(page, "claim", "PUMP", claim)
        end_turn(page, handoff=(index == 0))
    result = state(page)
    check("Zwei Vertraege im zweiten Monat fachlich erfuellt",
          result["month"] == 2 and result["phase"] == "REPORT"
          and len(result["reports"]) == 2
          and all(result["companies"][i]["contracts"][0]["status"] == "DONE"
                  and result["companies"][i]["contracts"][0]["soldMilli"] == 40000
                  and result["companies"][i]["stats"]["contractsDone"] == 1
                  for i in (0, 1)))
    check("Zwei getrennte Vertragserloese und Transportrechnungen",
          all(len([x for x in result["companies"][i]["ledger"]
                   if x["code"] == "VERTRAGSERLÖS"]) == 1
                  and len([x for x in result["companies"][i]["obligations"]
                           if x["kind"] == "VERTRAGSTRANSPORT"]) == 1
                  for i in (0, 1)))
    check("Keine doppelten Buchungskennungen im zweiten Monat",
          len(result["processedIds"]) == len(set(result["processedIds"])))
    return result


def economic_signature(snapshot):
    # UI-Befehlskennungen enthalten Date.now(); deren Werte duerfen zwischen
    # Browserlaeufen abweichen, nicht aber Anzahl oder Wirtschaftsfolgen.
    normalized = copy.deepcopy(snapshot)
    normalized["processedIds"] = list(range(len(normalized["processedIds"])))
    return normalized


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-complex-roundtrip-") as temp:
        preview = Path(temp) / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        check("Offline-Aufbau im Wegwerfverzeichnis", (preview / "index.html").is_file())
        errors, external = [], []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                def session():
                    context = browser.new_context(
                        viewport={"width": 800, "height": 600},
                        accept_downloads=True, reduced_motion="reduce")
                    page = context.new_page()
                    page.set_default_timeout(15000)
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.on("request", lambda request: external.append(request.url)
                            if request.url.startswith(("http://", "https://")) else None)
                    page.goto((preview / "index.html").as_uri(), wait_until="load")
                    page.wait_for_function("typeof NeoEconomy === 'object'")
                    return context, page

                context, page = session()
                month_one = create_month_one(page)
                exported_one = export_state(page)
                check("Komplexer Monatsstand vollstaendig exportiert",
                      exported_one == month_one and len(exported_one["events"]) > 0
                      and all(len(exported_one["companies"][i]["ledger"]) >= 4
                              for i in (0, 1)))
                context.close()

                context, page = session()
                check("Neuer Browserkontext ohne alten Zustand", state(page) is None)
                import_file(page, "vier-firmen-monat-1.json", exported_one, True)
                check("Gueltiger verschachtelter Import unveraendert",
                      state(page) == exported_one)
                month_two = continue_month_two(page)
                exported_two = export_state(page)
                check("Zweiter Abschluss mit allen Journalen exportiert",
                      exported_two == month_two)
                context.close()

                context, page = session()
                import_file(page, "vier-firmen-replay.json", exported_one, True)
                replay = continue_month_two(page)
                check("Gleiche Wirtschaftsfolgen nach unabhaengigem Neustart",
                      economic_signature(replay) == economic_signature(month_two))
                check("Befehlsanzahl in beiden Durchlaeufen gleich",
                      len(replay["processedIds"]) == len(month_two["processedIds"]))
                context.close()

                context, page = session()
                import_file(page, "vier-firmen-monat-2.json", exported_two, True)
                check("Zweiter Bericht exakt wiederhergestellt",
                      state(page) == exported_two)
                page.locator('[data-econ="NEXT_MONTH"]').click()
                continued = state(page)
                check("Monat drei ohne erneute Vertrags- oder Monatsbuchung",
                      continued["month"] == 3 and continued["phase"] == "TURN"
                      and len(continued["reports"]) == 2
                      and all(continued["companies"][i]["stats"]["contractsDone"] == 1
                              and len([x for x in continued["companies"][i]["ledger"]
                                       if x["code"] == "VERTRAGSERLÖS"]) == 1
                              for i in (0, 1)))
                check("800x600 ohne horizontalen Ueberlauf",
                      page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"))
                check("Keine externen Netzwerkanfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("KOMPLEXE SPIELSTAENDE:", json.dumps({
                    "human_companies": 2, "ai_companies": 2,
                    "independent_regions": ["BERLIN", "NORD"],
                    "fulfilled_contracts": 2, "settled_months": 2,
                    "browser_contexts": 4, "independent_replays": 2,
                    "exact_import_roundtrips": 3,
                    "release_gate": "BLOCKED",
                }, ensure_ascii=False), flush=True)
                context.close()
            finally:
                browser.close()


if __name__ == "__main__":
    main()
