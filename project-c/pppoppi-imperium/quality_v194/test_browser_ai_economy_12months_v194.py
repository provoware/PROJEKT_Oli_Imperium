#!/usr/bin/env python3
"""Zwoelf Wirtschaftsmonate mit zwei Menschen, zwei KI-Firmen und Prozessneustarts.

Ausschliesslich sichtbare Wirtschaftsaktionen in einem temporaeren, offline
erzeugten Chromium-Spiel. Kein Original-C64-Nachweis und keine Release-Freigabe.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
SCHEMA = "pppoppi.endstate.session.proposal/1"


def check(label, condition):
    print(("PASS: " if condition else "FAIL: ") + label, flush=True)
    if not condition:
        raise AssertionError(label)


def state(page):
    return page.evaluate("NeoEconomy.getState()")


def click_action(page, scene, command, claim, counters, region=None):
    page.evaluate("(id) => NeoEconomy.select(id)", claim)
    page.evaluate("(name) => NeoEconomy.open(name)", scene)
    selector = ('[data-econ="%s"][data-region="%s"]' % (command, region)
                if region else '[data-econ="%s"][data-claim="%s"]' % (command, claim))
    button = page.locator(selector)
    check(command + " " + claim + ": sichtbare Aktion",
          button.count() == 1 and button.is_visible() and button.is_enabled())
    before = state(page)
    button.click()
    after = state(page)
    check(command + " " + claim + ": gueltiger Zustandswechsel",
          after != before and
          page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True)
    counters[command] = counters.get(command, 0) + 1


def finish_two_humans_and_ai(page, month):
    before = state(page)
    check("Monat %d: H1 am Zug" % month,
          before["month"] == month and before["phase"] == "TURN"
          and before["turnIndex"] == 0 and len(before["reports"]) == month - 1)
    page.evaluate("NeoEconomy.open('calendar')")
    page.locator('[data-econ="END_TURN"]').click()
    handoff = state(page)
    check("Monat %d: H2 uebernimmt ohne KI-Vorgriff" % month,
          handoff["phase"] == "TURN" and handoff["turnIndex"] == 1
          and len(handoff["reports"]) == month - 1
          and page.evaluate("NeoEconomy.needsHandoff()") is True)
    page.locator('[data-ui="handoff-ok"]').click()
    check("Monat %d: vertrauliche Uebergabe bestaetigt" % month,
          page.evaluate("NeoEconomy.needsHandoff()") is False)
    page.evaluate("NeoEconomy.open('calendar')")
    page.locator('[data-econ="END_TURN"]').click()
    page.wait_for_function(
        "(m) => NeoEconomy.getState()?.month === m && "
        "['REPORT','RESCUE'].includes(NeoEconomy.getState()?.phase)", arg=month)
    after = state(page)
    check("Monat %d: ein Bericht und zwei KI-Zuege" % month,
          after["phase"] == "REPORT"
          and len(after["reports"]) == month
          and after["lastReport"]["month"] == month
          and {e["company"] for e in after["events"]
               if e["type"] == "KI_ZUG" and e["month"] == month} == {"A1", "A2"}
          and len([e for e in after["events"]
                   if e["type"] == "KI_ZUG" and e["month"] == month]) == 2)
    check("Monat %d: KI und Geldbestaende gueltig" % month,
          page.evaluate("NeoEconomy.engine.validate(NeoEconomy.getState())") is True
          and len(after["lastReport"]["companies"]) == 4
          and all(f["cashCent"] >= 0 and f["debtCent"] >= 0
                  for f in after["companies"])
          and len(after["processedIds"]) == len(set(after["processedIds"])))
    return after


def main():
    with tempfile.TemporaryDirectory(prefix="pppoppi-ai-economy-12m-") as tmp:
        root = Path(tmp)
        preview = root / "preview"
        subprocess.run(["node", str(HERE / "build.cjs"), str(preview)],
                       check=True, timeout=90, capture_output=True, text=True)
        info = json.loads((preview / "BUILD_INFO.json").read_text(encoding="utf-8"))
        check("110 geschuetzte Quelloriginale geprueft", info["sourceFiles"] == 110)
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
                page.on("pageerror", lambda err: errors.append(str(err)))
                page.on("request", lambda req: external.append(req.url)
                        if req.url.startswith(("http://", "https://")) else None)
                page.goto((preview / "index.html").as_uri(), wait_until="load")
                page.wait_for_function("window.NeoEconomy && window.NeoEconomy.endstate")
                check("Frischer Chromium-Prozess ohne uebernommene Partie",
                      state(page) is None)
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
                path = root / filename
                download.value.save_as(path)
                payload = json.loads(path.read_text(encoding="utf-8"))
                check("Export mit gueltigem 12-Monats-Vertrag",
                      payload["schema"] == SCHEMA
                      and payload["contract"]["months"] == 12)
                return path, payload

            try:
                page = start_process()
                page.locator("#startGame").click()
                page.locator("#econMode").select_option("2-2")
                page.get_by_label("Spielart", exact=True).select_option("campaign:12")
                page.locator('#dialogContent [data-ui="newgame"]').click()
                initial = state(page)
                check("Vier Firmen in der richtigen Reihenfolge",
                      [(f["id"], f["type"]) for f in initial["companies"]] ==
                      [("H1", "human"), ("H2", "human"),
                       ("A1", "ai"), ("A2", "ai")]
                      and initial["month"] == 1
                      and page.evaluate("NeoEconomy.endstate.contract().months") == 12)

                for scene, command, region in (
                    ("claim", "SURVEY", None),
                    ("claim", "BUY", None),
                    ("claim", "DRILL", None),
                    ("claim", "PUMP", None),
                    ("warehouse", "SHIP", None),
                    ("market", "OFFER", None),
                    ("contracts", "SIGN", "BERLIN"),
                ):
                    click_action(page, scene, command, "BERLIN-1", actions, region)
                check("H1: gefoerdertes und angebotenes Oel mit Vertrag",
                      state(page)["claims"]["BERLIN-1"]["owner"] == "H1"
                      and len(state(page)["companies"][0]["contracts"]) == 1)

                # Die H2-Aktionen werden erst nach dem sichtbaren Zugwechsel
                # ausgefuehrt; ab dann laufen A1 und A2 automatisch.
                page.evaluate("NeoEconomy.open('calendar')")
                page.locator('[data-econ="END_TURN"]').click()
                check("Erster menschlicher Wechsel ist vertraulich",
                      page.evaluate("NeoEconomy.needsHandoff()") is True)
                page.locator('[data-ui="handoff-ok"]').click()
                for command in ("SURVEY", "BUY"):
                    click_action(page, "claim", command, "NORD-1", actions)
                check("H2: eigener Claim ohne Vermischung mit H1",
                      state(page)["claims"]["NORD-1"]["owner"] == "H2"
                      and state(page)["claims"]["BERLIN-1"]["owner"] == "H1")
                page.evaluate("NeoEconomy.open('calendar')")
                page.locator('[data-econ="END_TURN"]').click()
                page.wait_for_function("NeoEconomy.getState()?.phase==='REPORT'")
                first = state(page)
                check("Erster Monatsbericht: beide KI-Firmen am Zug",
                      len(first["reports"]) == 1
                      and {e["company"] for e in first["events"]
                           if e["type"] == "KI_ZUG"} == {"A1", "A2"})
                check("Erster Monatsbericht: reale KI-Entscheidungen",
                      any(e["type"] == "KI_ENTSCHEIDUNG"
                          for e in first["events"]))
                check("Erster Monat: kein unerwarteter menschlicher Konkurs",
                      first["rescueIds"] == []
                      and first["companies"][0]["generation"] == 1
                      and first["companies"][1]["generation"] == 1)

                for month in range(1, 13):
                    if month > 1:
                        before = state(page)
                        check("Monat %d: beide Menschen vor KI" % month,
                              before["month"] == month
                              and before["turnIndex"] == 0
                              and before["phase"] == "TURN")
                        report = finish_two_humans_and_ai(page, month)
                    else:
                        report = first
                    check("Monat %d: keine vorzeitige Endfreigabe" % month,
                          page.evaluate("NeoEconomy.endstate.status()") ==
                          ("finished" if month == 12 else "active"))
                    if month in (3, 6, 9):
                        checkpoint = state(page)
                        path, payload = export_session(
                            page, "ki-wirtschaft-monat-%02d.json" % month)
                        check("Monat %d: KI-Ereignisse und Berichte exportiert" % month,
                              payload["state"] == checkpoint
                              and payload["archive"] is None)
                        stop_process()
                        page = start_process()
                        page.locator("#loadSessionFile").set_input_files(str(path))
                        page.wait_for_function(
                            "(m) => NeoEconomy.getState()?.month===m && "
                            "NeoEconomy.getState()?.phase==='REPORT'", arg=month)
                        imports += 1
                        check("Monat %d: KI-Zuege nach Prozessneustart identisch" % month,
                              state(page) == checkpoint
                              and page.evaluate(
                                  "NeoEconomy.endstate.contract().months") == 12)
                    if month < 12:
                        page.locator('[data-econ="NEXT_MONTH"]').click()
                        page.wait_for_function(
                            "(m) => NeoEconomy.getState()?.month===m && "
                            "NeoEconomy.getState()?.phase==='TURN'", arg=month + 1)

                final = state(page)
                archive = page.evaluate("NeoEconomy.endstate.archive()")
                ai_turns = [e for e in final["events"] if e["type"] == "KI_ZUG"]
                decisions = [e for e in final["events"]
                             if e["type"] == "KI_ENTSCHEIDUNG"]
                check("24 KI-Zuege in zwoelf Monaten ohne Verdoppelung",
                      len(ai_turns) == 24
                      and {e["company"] for e in ai_turns} == {"A1", "A2"})
                check("Beide KI-Strategien haben echte Entscheidungen getroffen",
                      {e["company"] for e in decisions} == {"A1", "A2"}
                      and all(e["score"] > 0 and e["reason"] and e["strategy"]
                              for e in decisions))
                check("Abschluss mit vier Firmen, 12 Berichten und Archiv",
                      len(final["reports"]) == 12
                      and final["month"] == 12
                      and len(archive["ranking"]) == 4
                      and archive["snapshot"] == final
                      and archive["endMonth"] == 12)
                path, payload = export_session(page, "ki-wirtschaft-archiv.json")
                check("Abschlussdatei enthaelt nur das unveraenderte Archiv",
                      payload["state"] is None and payload["archive"] == archive)
                stop_process()
                page = start_process()
                page.locator("#loadSessionFile").set_input_files(str(path))
                page.wait_for_function("NeoEconomy.endstate.status()==='finished'")
                imports += 1
                check("Abschlussarchiv nach fuenftem Prozess identisch",
                      state(page) == final
                      and page.evaluate("NeoEconomy.endstate.archive()") == archive)
                page.evaluate("NeoEconomy.send('NEXT_MONTH')")
                check("Nach Archiv keine nachtraegliche KI- oder Monatsaktion",
                      state(page) == final)
                check("Fuenf Chromium-Prozesse, vier exakte Importe",
                      processes == 5 and imports == 4)
                check("800x600 ohne horizontalen Ueberlauf",
                      page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2"))
                check("Offline ohne HTTP/HTTPS", not external)
                check("Keine JavaScript-Laufzeitfehler", not errors)
                print("KI-WIRTSCHAFT-12M:", json.dumps({
                    "months": 12, "companies": ["H1", "H2", "A1", "A2"],
                    "ai_turns": len(ai_turns),
                    "ai_decisions": len(decisions),
                    "ui_actions": actions, "chromium_processes": processes,
                    "session_imports": imports, "original_c64_verified": False,
                    "release_gate": "BLOCKED",
                }, ensure_ascii=False, sort_keys=True), flush=True)
            finally:
                stop_process()


if __name__ == "__main__":
    main()
