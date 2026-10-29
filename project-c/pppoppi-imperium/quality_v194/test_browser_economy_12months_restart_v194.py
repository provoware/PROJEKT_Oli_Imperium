#!/usr/bin/env python3
"""Zwölf Monate reale Wirtschaftsaktionen mit echten Chromium-Neustarts.

Nur temporärer Offline-Aufbau der eigenständigen PPPOPPI-Adaption.
Keine manipulierten Spielstände, kein C64-Originalnachweis und keine Freigabe.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

from test_browser_campaign_lastmonth_rescue_v194 import finish_four_human_turns

HERE = Path(__file__).resolve().parent
CLAIM = "BERLIN-1"
SCHEMA = "pppoppi.endstate.session.proposal/1"


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def state(page):
    return page.evaluate("NeoEconomy.getState()")


def click_action(page, scene, command, counters, region=None):
    # Nur die Szenenwahl nutzt die vorhandene Navigation; der Wirtschafts-
    # befehl wird über die tatsächlich sichtbare Schaltfläche ausgeführt.
    page.evaluate("(id) => NeoEconomy.select(id)", CLAIM)
    page.evaluate("(name) => NeoEconomy.open(name)", scene)
    selector = ('[data-econ="%s"][data-region="%s"]' % (command, region)
                if region else '[data-econ="%s"][data-claim="%s"]' % (command, CLAIM))
    button = page.locator(selector)
    check(command + ": genau eine sichtbare Schaltfläche",
          button.count() == 1 and button.is_visible() and button.is_enabled())
    before = state(page)
    button.click()
    after = state(page)
    check(command + ": echter gültiger Zustandswechsel",
          after != before and
          page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)
    counters[command] = counters.get(command, 0) + 1


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-economy-12m-browser-") as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        info = json.loads((preview / "BUILD_INFO.json").read_text(encoding="utf-8"))
        check("110 unveränderte Quellen im isolierten Aufbau geprüft",
              info["sourceFiles"] == 110)
        errors, external, actions = [], [], {}
        processes, imports = 0, 0
        with sync_playwright() as pw:
            browser = None

            def start_process():
                nonlocal browser, processes
                browser = pw.chromium.launch(headless=True)
                processes += 1
                context = browser.new_context(
                    viewport={"width": 800, "height": 600},
                    accept_downloads=True, reduced_motion="reduce")
                page = context.new_page()
                page.set_default_timeout(15000)
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.on("request", lambda request: external.append(request.url)
                        if request.url.startswith(("http://", "https://")) else None)
                page.goto((preview / "index.html").as_uri(), wait_until="load")
                page.wait_for_function("window.NeoEconomy && window.NeoEconomy.endstate")
                check("Neuer Chromium-Prozess ohne alten Spielstand", state(page) is None)
                return page

            def stop_process():
                nonlocal browser
                if browser is not None:
                    browser.close()
                    browser = None

            def export_session(page, filename):
                page.evaluate("NeoEconomy.open('computer')")
                with page.expect_download() as download:
                    page.locator('#dialogContent [data-ui="session-export"]').click()
                target = root / filename
                download.value.save_as(target)
                payload = json.loads(target.read_text(encoding="utf-8"))
                check("Versionierter Sitzungsexport mit 12-Monats-Vertrag",
                      payload["schema"] == SCHEMA
                      and payload["contract"]["months"] == 12)
                return target, payload

            try:
                page = start_process()
                page.locator("#startGame").click()
                page.locator("#econMode").select_option("4-0")
                page.get_by_label("Spielart", exact=True).select_option("campaign:12")
                page.locator('#dialogContent [data-ui="newgame"]').click()
                initial = state(page)
                check("Unveränderte 12-Monats-Partie mit vier Menschen",
                      [f["id"] for f in initial["companies"]]
                      == ["H1", "H2", "H3", "H4"]
                      and initial["phase"] == "TURN"
                      and initial["month"] == 1
                      and initial["companies"][0]["obligations"] == [])

                for scene, command, region in (
                    ("claim", "SURVEY", None),
                    ("claim", "BUY", None),
                    ("claim", "DRILL", None),
                    ("claim", "PUMP", None),
                    ("warehouse", "SHIP", None),
                    ("market", "OFFER", None),
                    ("contracts", "SIGN", "BERLIN"),
                ):
                    click_action(page, scene, command, actions, region)
                check("Erster Monat: echte Förderung, Lieferung und Vertrag",
                      state(page)["claims"][CLAIM]["drilled"]
                      and state(page)["claims"][CLAIM]["owner"] == "H1"
                      and len(state(page)["companies"][0]["contracts"]) == 1)

                for month in range(1, 13):
                    before = state(page)
                    check("Monat %d: korrekter menschlicher Spielzug" % month,
                          before["month"] == month and before["phase"] == "TURN"
                          and before["turnIndex"] == 0
                          and len(before["reports"]) == month - 1)
                    if month > 1:
                        claim = before["claims"][CLAIM]
                        if claim["burning"]:
                            click_action(page, "security", "FIRE_EXPERT", actions)
                        if state(page)["claims"][CLAIM]["damaged"]:
                            click_action(page, "security", "REPAIR", actions)
                        claim = state(page)["claims"][CLAIM]
                        if (claim["reserveMilli"] >= 100000
                                and claim["inventoryMilli"] + claim["preparedMilli"]
                                + 100000 <= claim["tankMilli"]):
                            click_action(page, "claim", "PUMP", actions)
                        claim = state(page)["claims"][CLAIM]
                        if claim["inventoryMilli"] >= 1000 and claim["preparedMilli"] == 0:
                            click_action(page, "warehouse", "SHIP", actions)
                        claim = state(page)["claims"][CLAIM]
                        if claim["preparedMilli"] > 0 and not claim["order"]:
                            click_action(page, "market", "OFFER", actions)
                    before_settlement = state(page)
                    old_ledger = len(before_settlement["companies"][0]["ledger"])
                    old_cash = before_settlement["companies"][0]["cashCent"]
                    report = finish_four_human_turns(page)
                    check("Monat %d: genau ein gültiger Wirtschaftsbericht" % month,
                          report["month"] == month
                          and len(report["reports"]) == month
                          and report["lastReport"]["month"] == month
                          and len(report["processedIds"]) ==
                          len(set(report["processedIds"])))
                    new_entries = report["companies"][0]["ledger"][old_ledger:]
                    check("Monat %d: Geld und Journal ohne verdeckte Differenz" % month,
                          report["companies"][0]["cashCent"]
                          == old_cash + sum(e["deltaCent"] for e in new_entries))
                    if month == 2:
                        check("Vertrag aus echter Förderung pünktlich erfüllt",
                              report["companies"][0]["contracts"][0]["status"] == "DONE"
                              and report["companies"][0]["stats"]["contractsDone"] == 1)
                    if month in (3, 6, 9):
                        checkpoint = state(page)
                        saved, payload = export_session(
                            page, "wirtschaft-monat-%02d.json" % month)
                        check("Monat %d: kompletter Bericht exakt exportiert" % month,
                              payload["state"] == checkpoint
                              and payload["archive"] is None)
                        stop_process()
                        page = start_process()
                        page.locator("#loadSessionFile").set_input_files(str(saved))
                        page.wait_for_function(
                            "(m) => NeoEconomy.getState()?.month===m && "
                            "NeoEconomy.getState()?.phase==='REPORT'", arg=month)
                        imports += 1
                        check("Monat %d: neuer Chromium-Prozess erhält alle Buchungen" % month,
                              state(page) == checkpoint
                              and page.evaluate(
                                  "NeoEconomy.endstate.contract().months") == 12)
                    if month < 12:
                        check("Vor dem Schlussmonat keine vorzeitige Archivierung",
                              page.evaluate("NeoEconomy.endstate.status()") == "active")
                        page.locator('[data-econ="NEXT_MONTH"]').click()
                        page.wait_for_function(
                            "(m) => NeoEconomy.getState()?.month===m && "
                            "NeoEconomy.getState()?.phase==='TURN'", arg=month + 1)

                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                final = state(page)
                archive = page.evaluate("NeoEconomy.endstate.archive()")
                check("Vollständiges Abschlussarchiv nach zwölf Wirtschaftsmonaten",
                      final["month"] == 12
                      and len(final["reports"]) == 12
                      and archive["endMonth"] == 12
                      and archive["snapshot"] == final
                      and len(archive["ranking"]) == 4)
                check("Echte Marktumsätze und ein erfüllter Vertrag im Journal",
                      sum(1 for e in final["companies"][0]["ledger"]
                          if e["code"] == "MARKTERLÖS") >= 1
                      and final["companies"][0]["stats"]["contractsDone"] == 1)
                archived, payload = export_session(page, "wirtschaft-archiv.json")
                check("Abschlussdatei enthält ausschließlich unverändertes Archiv",
                      payload["state"] is None and payload["archive"] == archive)
                stop_process()

                page = start_process()
                page.locator("#loadSessionFile").set_input_files(str(archived))
                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                imports += 1
                check("Endarchiv nach viertem Import byteinhaltlich identisch",
                      state(page) == final
                      and page.evaluate("NeoEconomy.endstate.archive()") == archive)
                page.evaluate("NeoEconomy.send('NEXT_MONTH')")
                check("Abschlussarchiv sperrt nachträgliche Wirtschaftsaktionen",
                      state(page) == final)
                check("Fünf eigenständige Chromium-Prozesse, vier Importe",
                      processes == 5 and imports == 4)
                check("800x600 ohne horizontalen Seitenüberlauf",
                      page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"))
                check("Vollständig offline, ohne HTTP/HTTPS-Anfragen", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("WIRTSCHAFT-BROWSER-12M:", json.dumps({
                    "months": 12, "reports": 12,
                    "ui_actions": actions, "processes": processes,
                    "session_imports": imports, "session_exports": 4,
                    "original_c64_verified": False,
                    "release_gate": "BLOCKED",
                }, ensure_ascii=False, sort_keys=True), flush=True)
            finally:
                stop_process()


if __name__ == "__main__":
    main()
